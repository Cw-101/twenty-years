import test from 'node:test';
import assert from 'node:assert/strict';

import {
  newGame, choose, availableChoices, enterScene, knownPeople, personRecord, meet,
  currentScene, advanceChapter,
} from '../src/game.js';

test('a scene announces who is new in it, once', () => {
  const g = newGame({ seed: 1, campaign: 'hkderby' });
  const scene = { id: 's1', meets: ['mother', 'coach'], text: 'x', choices: [{ label: 'a' }] };
  const first = enterScene(g, scene);
  assert.deepEqual(first.sort(), ['coach', 'mother']);
  const second = enterScene(g, scene);
  assert.deepEqual(second, [], 'nobody is new the second time');
});

test('people are listed in the order he met them', () => {
  const g = newGame({ seed: 2, campaign: 'hkderby' });
  meet(g, 'mother');
  meet(g, 'coach');
  meet(g, 'sister');
  const names = knownPeople(g).map((p) => p.name);
  assert.deepEqual(names, ['Mei', 'Bramley', 'Wing']);
});

test('a person record carries only the memories they witnessed', () => {
  const g = newGame({ seed: 3, campaign: 'hkderby' });
  meet(g, 'mother');
  meet(g, 'coach');

  const witnessedByMother = {
    id: 'x', text: 'x', witness: 'mother',
    choices: [{ label: 'go', roll: false, effects: { belief: +2 }, flag: 'wentHome', log: 'He went home.' }],
  };
  const witnessedByCoach = {
    id: 'y', text: 'x', witness: 'coach',
    choices: [{ label: 'stay', roll: false, effects: { belief: +2 }, flag: 'stayedLate', log: 'He stayed late.' }],
  };
  choose(g, witnessedByMother, 0);
  choose(g, witnessedByCoach, 0);

  const mother = personRecord(g, 'mother');
  const coach = personRecord(g, 'coach');
  assert.equal(mother.count, 1);
  assert.equal(coach.count, 1);
  assert.match(mother.memories[0].note, /He went home/);
  assert.match(coach.memories[0].note, /He stayed late/);
});

test('a failure is still remembered by whoever was in the room', () => {
  const g = newGame({ seed: 4, campaign: 'hkderby' });
  meet(g, 'physio');
  const scene = {
    id: 'fail', text: 'x', witness: 'physio',
    choices: [{ label: 'push', attribute: 'power', dc: 40, effects: { belief: +3 }, failLog: 'It did not hold.' }],
  };
  let entry = choose(g, scene, 0);
  let guard = 0;
  while (entry.success && guard++ < 40) {
    const g2 = newGame({ seed: 4 + guard, campaign: 'hkderby' });
    Object.assign(g, g2);
    meet(g, 'physio');
    entry = choose(g, scene, 0);
  }
  const physio = personRecord(g, 'physio');
  assert.ok(physio.count >= 1);
  assert.ok(physio.memories.some((m) => m.attempt === true || /did not hold/i.test(m.note)));
});

test('an unknown person has no record', () => {
  const g = newGame({ seed: 5, campaign: 'hkderby' });
  assert.equal(personRecord(g, 'nobody'), null);
});

test('a career ends with people who remember things', () => {
  const g = newGame({ seed: 6, campaign: 'hkderby' });
  let guard = 0;
  while (!g.finished && guard++ < 500) {
    const scene = currentScene(g);
    if (!scene) { advanceChapter(g); continue; }
    enterScene(g, scene);
    const opts = availableChoices(g, scene).filter((o) => o.available);
    choose(g, scene, opts[guard % opts.length].index);
  }
  assert.ok(g.finished, 'the career should finish');
  const withMemories = knownPeople(g).filter((p) => p.count > 0);
  assert.ok(withMemories.length >= 4, 'several people should remember something');
  assert.ok(withMemories.every((p) => typeof p.name === 'string' && p.name.length > 0));
});
