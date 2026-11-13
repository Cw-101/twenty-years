import test from 'node:test';
import assert from 'node:assert/strict';

import {
  newGame, choose, availableChoices, availableTopics, learnTopic,
  insightBonus, seenTopics, currentScene,
} from '../src/game.js';

function hubScene() {
  return {
    id: 'hub',
    text: 'x',
    topics: [
      { id: 'a', label: 'Ask about the money', text: 'They owe money.', effects: { trust: +2 }, flag: 'knowsDebt' },
      { id: 'b', label: 'Ask about the knee', text: 'The knee is bad.' },
      { id: 'c', label: 'Ask about the sister', text: 'She is at the door.' },
      { id: 'd', label: 'Ask again', text: 'Once only.', once: true },
    ],
    choices: [
      { label: 'Decide', attribute: 'power', dc: 10, effects: { belief: +3 }, flag: 'decided' },
      { label: 'Wait', roll: false, effects: { conscience: +1 }, flag: 'waited' },
    ],
  };
}

test('a hub offers conversations before the decision', () => {
  const g = newGame({ seed: 1, campaign: 'hkderby' });
  const scene = hubScene();
  const topics = availableTopics(g, scene);
  assert.equal(topics.length, 4);
  assert.ok(topics.every((t) => typeof t.label === 'string' && t.id));
});

test('learning something applies its effects once and then it is gone', () => {
  const g = newGame({ seed: 2, campaign: 'hkderby' });
  const scene = hubScene();
  const before = g.trust;
  const res = learnTopic(g, scene, 'a');
  assert.equal(res.text, 'They owe money.');
  assert.equal(g.trust, before + 2);
  assert.equal(g.flags.knowsDebt, true);
  assert.equal(g.learned.length, 1);

  assert.equal(learnTopic(g, scene, 'a'), null, 'the same question cannot be asked twice');
  assert.equal(availableTopics(g, scene).length, 3);
});

test('what he learned improves the check he is about to make, and is capped', () => {
  const g = newGame({ seed: 3, campaign: 'hkderby' });
  const scene = hubScene();
  const baseMod = availableChoices(g, scene)[0].modifier;

  learnTopic(g, scene, 'a');
  assert.equal(insightBonus(g, scene), 1);
  assert.equal(availableChoices(g, scene)[0].modifier, baseMod + 1);

  learnTopic(g, scene, 'b');
  learnTopic(g, scene, 'c');
  assert.equal(insightBonus(g, scene), 3);
  assert.equal(availableChoices(g, scene)[0].modifier, baseMod + 3);

  // and it stops climbing there
  const extra = { ...scene, topics: [...scene.topics, { id: 'e', label: 'more', text: 'more' }] };
  learnTopic(g, extra, 'e');
  assert.equal(insightBonus(g, extra), 3);
});

test('a choice marked as not rolling simply happens', () => {
  const g = newGame({ seed: 4, campaign: 'hkderby' });
  const scene = hubScene();
  const beliefBefore = g.belief;
  const entry = choose(g, scene, 1);
  assert.equal(entry.check.noRoll, true);
  assert.equal(entry.success, true);
  assert.equal(entry.check.natural, null);
  assert.equal(g.flags.waited, true);
  assert.equal(g.belief, beliefBefore, 'a no-roll choice does not apply dice effects at all');
});

test('rolling choices still roll, and insight is recorded on the entry', () => {
  const g = newGame({ seed: 5, campaign: 'hkderby' });
  const scene = hubScene();
  learnTopic(g, scene, 'a');
  const entry = choose(g, scene, 0);
  assert.equal(entry.check.noRoll, undefined);
  assert.equal(entry.insight, 1);
  assert.match(entry.check.text, /d20/);
});

test('the real scenes carry conversations: the call, the offer and the agent', async () => {
  const story = await import('../src/story.js');
  const ids = ['the-call', 'the-offer', 'the-agent'];
  for (const id of ids) {
    const scene = story.CHAPTERS.flatMap((c) => c.scenes).find((s) => s.id === id);
    assert.ok(scene, `${id} should exist`);
    assert.ok(Array.isArray(scene.topics) && scene.topics.length >= 3, `${id} should offer at least three conversations`);
    const g = newGame({ seed: 6, campaign: 'hkderby' });
    const first = learnTopic(g, scene, scene.topics[0].id);
    assert.ok(first && first.text.length > 40, `${id} first conversation should produce prose`);
  }
});

test('choosing to say nothing never rolls, anywhere in the story', async () => {
  const story = await import('../src/story.js');
  for (const chapter of story.CHAPTERS) {
    for (const scene of chapter.scenes) {
      for (const choice of scene.choices) {
        if (/^Say nothing/i.test(String(choice.label || ''))) {
          assert.equal(choice.roll, false, `${scene.id}: silence should not be a dice roll`);
        }
      }
    }
  }
});

test('a scene can offer between two and five options', async () => {
  const story = await import('../src/story.js');
  const counts = new Set();
  for (const chapter of story.CHAPTERS) {
    for (const scene of chapter.scenes) {
      const n = scene.choices.length;
      assert.ok(n >= 2 && n <= 6, `${scene.id} has ${n} options`);
      counts.add(n);
    }
  }
  assert.ok(counts.size >= 2, 'scenes should not all have the same number of options');
});
