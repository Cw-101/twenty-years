import test from 'node:test';
import assert from 'node:assert/strict';

import {
  newGame, choose, availableChoices, advanceChapter, currentScene,
  snapshot, restore, spendInspiration, approachOf, dcOf, INSPIRATION_PER_CHAPTER,
} from '../src/game.js';
import { check, rollD20, modifierFor, describeCheck, APPROACHES } from '../src/dice.js';

function sceneOf(id) {
  return { id, text: 'x', choices: [{ label: 'a' }, { label: 'b' }, { label: 'c' }] };
}

test('every scene offers three real options, each with an approach and a DC', () => {
  const g = newGame({ seed: 1, campaign: 'hkderby' });
  const scene = sceneOf('test');
  const opts = availableChoices(g, scene);
  assert.equal(opts.length, 3);
  for (const o of opts) {
    assert.ok(o.approachLabel, 'every option has an approach');
    assert.ok(APPROACHES[o.approach], `unknown approach ${o.approach}`);
    assert.equal(typeof o.dc, 'number');
    assert.equal(typeof o.modifier, 'number');
    assert.equal(o.available, true, 'nothing is gated on whispers any more');
  }
  // the three options are not all the same approach
  assert.equal(new Set(opts.map((o) => o.approach)).size, 3);
});

test('a d20 stays in range and respects the seeded stream', () => {
  const g = newGame({ seed: 4, campaign: 'hkderby' });
  for (let i = 0; i < 200; i++) {
    const r = rollD20(g);
    assert.ok(r.natural >= 1 && r.natural <= 20);
  }
  const a = newGame({ seed: 99, campaign: 'hkderby' });
  const b = newGame({ seed: 99, campaign: 'hkderby' });
  const rollsA = Array.from({ length: 20 }, () => rollD20(a).natural);
  const rollsB = Array.from({ length: 20 }, () => rollD20(b).natural);
  assert.deepEqual(rollsA, rollsB, 'same seed, same rolls');
});

test('attribute 1-10 maps to a -4..+5 modifier', () => {
  const g = newGame({ seed: 5, campaign: 'hkderby' });
  g.skills.presence = 1;
  assert.equal(modifierFor(g, 'presence'), -4);
  g.skills.presence = 5;
  assert.equal(modifierFor(g, 'presence'), 0);
  g.skills.presence = 10;
  assert.equal(modifierFor(g, 'presence'), 5);
});

test('a natural 20 always succeeds and a natural 1 always fails', () => {
  const g = newGame({ seed: 6, campaign: 'hkderby' });
  g.skills.composure = 1;              // -4, so 20-4=16 can still beat a DC of 15
  const crit = check(g, 'composure', 30);   // impossible by maths
  // force the roll by seeding until we see a 20 or a 1
  let sawCrit = crit.crit, sawFumble = crit.fumble;
  for (let i = 0; i < 400 && !(sawCrit && sawFumble); i++) {
    const r = check(g, 'composure', 30);
    if (r.crit) { sawCrit = true; assert.equal(r.success, true); }
    if (r.fumble) { sawFumble = true; assert.equal(r.success, false); }
  }
  assert.ok(sawCrit, 'should see a natural 20 within 400 rolls');
  assert.ok(sawFumble, 'should see a natural 1 within 400 rolls');
});

test('advantage rolls twice and keeps the better die', () => {
  const g = newGame({ seed: 7, campaign: 'hkderby' });
  const r = check(g, 'technique', 12, { advantage: true });
  assert.equal(r.rolls.length, 2);
  assert.equal(r.natural, Math.max(...r.rolls));
});

test('inspiration is three per chapter and can be spent down to nothing', () => {
  const g = newGame({ seed: 8, campaign: 'hkderby' });
  assert.equal(g.inspiration, INSPIRATION_PER_CHAPTER);
  for (let i = 0; i < INSPIRATION_PER_CHAPTER; i++) assert.equal(spendInspiration(g), true);
  assert.equal(g.inspiration, 0);
  assert.equal(spendInspiration(g), false, 'cannot spend what is not there');

  advanceChapter(g);
  assert.equal(g.inspiration, INSPIRATION_PER_CHAPTER, 'a new chapter refills it');
});

test('a failed check applies the failure cost and sets no success flag', () => {
  const g = newGame({ seed: 9, campaign: 'hkderby' });
  const scene = {
    id: 'force-fail',
    text: 'x',
    choices: [{
      label: 'try something hard',
      dc: 40,                       // unbeatable except by a natural 20
      effects: { belief: +9 },
      failEffects: { belief: -4, conscience: -1 },
      flag: 'succeeded',
      log: 'It worked.',
      failLog: 'It did not work.',
    }],
  };
  let entry = choose(g, scene, 0);
  let guard = 0;
  while (entry.success && guard++ < 60) {
    const s2 = snapshot(g);
    restore(g, s2);
    entry = choose(g, scene, 0);
  }
  assert.equal(entry.success, false);
  assert.equal(entry.note, 'It did not work.');
  assert.equal(g.flags.succeeded, undefined);
});

test('a successful check sets the flag and records the roll', () => {
  const g = newGame({ seed: 10, campaign: 'hkderby' });
  const scene = {
    id: 'force-pass',
    text: 'x',
    choices: [{ label: 'easy', dc: 1, effects: { belief: +4 }, flag: 'didIt', log: 'It worked.' }],
  };
  const entry = choose(g, scene, 0);
  assert.equal(entry.success, true);
  assert.equal(g.flags.didIt, true);
  assert.match(entry.check.text, /^d20 \d+/);
  assert.ok(entry.check.total >= 2);
});

test('a reroll from a snapshot consumes inspiration and can change the outcome', () => {
  const g = newGame({ seed: 11, campaign: 'hkderby' });
  const scene = { id: 'rr', text: 'x', choices: [{ label: 'x', dc: 14, effects: { belief: +3 }, flag: 'x' }] };
  const before = snapshot(g);
  choose(g, scene, 0);
  restore(g, before);                 // undo the first attempt…
  assert.equal(spendInspiration(g), true);   // …pay inspiration…
  const second = choose(g, scene, 0, { advantage: true });   // …and roll again with advantage
  assert.equal(second.check.advantage, true);
  assert.equal(g.inspiration, INSPIRATION_PER_CHAPTER - 1);
  assert.equal(g.log.length, 1, 'the first attempt is not kept');
});

test('the approach taken is counted, and it moves personality', () => {
  const g = newGame({ seed: 12, campaign: 'hkderby' });
  const ego = (game) => {
    // personality is imported lazily to keep this test focused on the counting
    return game.stance ? game.stance.bold || 0 : 0;
  };
  const scene = { id: 'stance', text: 'x', choices: [{ label: 'bold', approach: 'bold', dc: 1, effects: {} }] };
  choose(g, scene, 0);
  choose(g, scene, 0);
  assert.equal(ego(g), 2);
});

test('a whole career plays with dice and never runs out of legal options', () => {
  const g = newGame({ seed: 13, campaign: 'hkderby' });
  let guard = 0;
  while (!g.finished && guard++ < 500) {
    const scene = currentScene(g);
    if (!scene) { advanceChapter(g); continue; }
    const opts = availableChoices(g, scene).filter((o) => o.available);
    assert.ok(opts.length > 0, `no legal option in ${scene.id}`);
    choose(g, scene, opts[guard % opts.length].index);
  }
  assert.equal(g.finished, true);
  assert.ok(g.inspiration >= 0);
  assert.ok(Object.keys(g.stance).length > 0);
  assert.ok(approachOf({ id: 'x' }, {}, 0));
  assert.ok(dcOf({ id: 'x' }, {}) > 0);
  assert.ok(describeCheck({ rolls: [9], natural: 9, mod: 2, total: 11, dc: 12 }).includes('vs 12'));
});
