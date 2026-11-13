import { test } from 'node:test';
import assert from 'node:assert/strict';

import { newGame, currentScene, availableChoices, choose, advanceChapter, isFinished } from '../src/game.js';

test('a whisper never fails when trust is high', () => {
  const g = newGame({ seed: 31, campaign: 'hkderby' });
  g.trust = 90;
  let failures = 0;
  let guard = 0;
  while (!isFinished(g) && guard++ < 200) {
    const scene = currentScene(g);
    if (!scene) { advanceChapter(g); continue; }
    const opts = availableChoices(g, scene).filter((o) => o.whisper && o.available);
    if (!opts.length) { g.scene += 1; continue; }
    const entry = choose(g, scene, opts[0].index);
    if (entry.failed) failures++;
  }
  assert.equal(failures, 0, 'high trust must never drop a whisper');
});

test('a whisper can fail on very low trust, and a failed whisper changes nothing', () => {
  let sawFailure = false;
  for (let seed = 1; seed <= 40 && !sawFailure; seed++) {
    const g = newGame({ seed, campaign: 'hkderby' });
    g.trust = 5;
    let guard = 0;
    while (!isFinished(g) && guard++ < 80) {
      const scene = currentScene(g);
      if (!scene) { advanceChapter(g); continue; }
      const opts = availableChoices(g, scene).filter((o) => o.whisper && o.available);
      if (!opts.length) { g.scene += 1; continue; }

      const before = { trust: g.trust, belief: g.belief, conscience: g.conscience, flags: Object.keys(g.flags).length };
      const entry = choose(g, scene, opts[0].index);
      if (entry.failed) {
        sawFailure = true;
        assert.equal(g.belief, before.belief, 'a failed whisper must not move belief');
        assert.equal(g.conscience, before.conscience, 'a failed whisper must not move conscience');
        assert.equal(g.trust, before.trust, 'a failed whisper must not move trust');
        assert.equal(entry.remembered.length, 0, 'a failed whisper leaves no memory');
        assert.match(entry.note, /did not hear you/i);
        break;
      }
    }
  }
  assert.ok(sawFailure, 'expected at least one failure across 40 low-trust careers');
});

test('a failed whisper is still spent', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const g = newGame({ seed, campaign: 'hkderby' });
    g.trust = 5;
    const scene = currentScene(g);
    const opts = availableChoices(g, scene);
    const w = opts.find((o) => o.whisper && o.available);
    const before = g.whispers;
    const entry = choose(g, scene, w.index);
    if (entry.failed) {
      assert.equal(g.whispers, before - 1, 'the whisper is spent even when it fails');
      return;
    }
  }
  assert.fail('no failure produced in 40 attempts — check the probability');
});
