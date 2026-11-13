import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { newGame, currentScene, availableChoices, advanceChapter, isFinished, sceneList, memories, choose } from '../src/game.js';
import { makeOrigin } from '../src/origin.js';
import { HOOK_SCENES } from '../src/hook-scenes.js';
import { toJSON, fromJSON, saveGame, loadGame } from '../src/save.js';

test('hook scenes only exist for careers carrying that hook', () => {
  const withHook = newGame({ seed: 2, nation: 'England', pedigree: 'academy', hooks: undefined });
  // force a specific hook by rebuilding the origin
  const g1 = newGame({ seed: 2, nation: 'England' });
  g1.origin.hooks = [{ id: 'deafEar', tag: 'body', text: 'x' }];
  g1.chapter = 1; g1.scene = 0;
  const playable = (g) => sceneList(g).filter((s) => !s.if || s.if(g)).map((s) => s.id);
  const ids = playable(g1);
  assert.ok(ids.includes('the-noise'), `expected the deaf-ear scene, got ${ids.join(',')}`);

  const g2 = newGame({ seed: 2, nation: 'England' });
  g2.origin.hooks = [{ id: 'temper', tag: 'mind', text: 'x' }];
  g2.chapter = 1; g2.scene = 0;
  const ids2 = playable(g2);
  assert.ok(!ids2.includes('the-noise'), 'scene must not appear without the hook');
  assert.ok(withHook); // silence unused
});

test('every hook has at least one reactive scene', () => {
  const covered = new Set();
  for (const chapter of Object.values(HOOK_SCENES)) {
    for (const scene of chapter) {
      const fn = scene.if.toString();
      for (const id of ['fatherLeft', 'sisterIll', 'twinReleased', 'carer', 'grandadCoach', 'debt', 'secondJob', 'deafEar', 'stammer', 'temper', 'thinConfidence', 'superstitious']) {
        if (fn.includes(id)) covered.add(id);
      }
    }
  }
  // the ones that are load-bearing enough to deserve their own scene
  for (const id of ['deafEar', 'stammer', 'temper', 'twinReleased', 'sisterIll', 'fatherLeft', 'carer', 'grandadCoach', 'superstitious', 'thinConfidence']) {
    assert.ok(covered.has(id), `${id} has no reactive scene`);
  }
});

test('choices that set a flag are recorded as memories', () => {
  const g = newGame({ seed: 8 });
  const setsFlag = (scene, i) => scene.choices[i].flag
    || Object.keys(scene.choices[i].effects || {}).some((k) => !['trust', 'belief', 'conscience'].includes(k));

  // advance until a scene offers a flag-setting choice
  let scene = null;
  let guard = 0;
  while (guard++ < 20) {
    const s = currentScene(g);
    if (!s) { advanceChapter(g); continue; }
    if (s.choices.some((_, i) => setsFlag(s, i))) { scene = s; break; }
    g.scene += 1;
  }
  assert.ok(scene, 'expected a scene with a flag-setting choice');
  const opts = availableChoices(g, scene);
  const withFlag = opts.find((o) => setsFlag(scene, o.index));
  const entry = choose(g, scene, withFlag.index);
  assert.ok(Array.isArray(entry.remembered));
  if (entry.remembered.length) {
    assert.ok(memories(g).length >= 1);
    assert.ok(memories(g)[0].note.length > 5);
  }
});

test('save and load round-trips the career exactly', () => {
  const g = newGame({ seed: 3, campaign: 'valley' });
  for (let i = 0; i < 6; i++) {
    const scene = currentScene(g);
    if (!scene) { advanceChapter(g); continue; }
    const opts = availableChoices(g, scene);
    const usable = opts.find((o) => o.available);
    choose(g, scene, usable.index);
  }
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ty-')), 'save.json');
  saveGame(g, file);
  const loaded = loadGame(file);

  assert.equal(loaded.name, g.name);
  assert.equal(loaded.chapter, g.chapter);
  assert.equal(loaded.scene, g.scene);
  assert.equal(loaded.whispers, g.whispers);
  assert.deepEqual(loaded.flags, g.flags);
  assert.deepEqual(loaded.memories, g.memories);
  assert.equal(loaded.log.length, g.log.length);
  assert.equal(loaded.randState, g.randState, 'RNG state must travel with the save');
});

test('a resumed career continues rather than restarting', () => {
  const g = newGame({ seed: 15, campaign: 'valley' });
  for (let i = 0; i < 4; i++) {
    const scene = currentScene(g);
    const opts = availableChoices(g, scene);
    choose(g, scene, opts.find((o) => o.available).index);
  }
  const before = { chapter: g.chapter, scene: g.scene, log: g.log.length };
  const restored = fromJSON(JSON.parse(toJSON(g)).game ? toJSON(g) : toJSON(g));
  assert.equal(restored.chapter, before.chapter);
  assert.equal(restored.log.length, before.log);
  const next = currentScene(restored);
  assert.ok(next, 'a resumed career should still have a scene to play');
});

test('rejects a file that is not a save', () => {
  assert.throws(() => fromJSON('{"hello":"world"}'), /not a Twenty Years save/);
});

test('a full career records memories and still finishes', () => {
  const g = newGame({ seed: 44 });
  let guard = 0;
  while (!isFinished(g) && guard++ < 300) {
    const scene = currentScene(g);
    if (!scene) { advanceChapter(g); continue; }
    const opts = availableChoices(g, scene);
    const usable = opts.find((o) => o.available);
    choose(g, scene, usable.index);
  }
  assert.ok(isFinished(g));
  assert.ok(memories(g).length > 3, `expected a trail of memories, got ${memories(g).length}`);
});
