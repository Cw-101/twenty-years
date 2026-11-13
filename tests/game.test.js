import { test } from 'node:test';
import assert from 'node:assert/strict';

import { newGame, currentScene, availableChoices, choose, advanceChapter, isFinished, biography, epilogue, WHISPERS_PER_CHAPTER } from '../src/game.js';
import { CHAPTERS } from '../src/story.js';

test('same seed produces the same person', () => {
  const a = newGame({ seed: 1234 });
  const b = newGame({ seed: 1234 });
  assert.equal(a.name, b.name);
  assert.deepEqual(a.trust, b.trust);
});

test('different seeds produce different people', () => {
  const names = new Set();
  for (let s = 1; s <= 20; s++) names.add(newGame({ seed: s }).name);
  assert.ok(names.size > 5, `expected variety, got ${names.size}`);
});

test('every chapter opens with a scene and three whispers', () => {
  const game = newGame({ seed: 7 });
  assert.equal(game.whispers, WHISPERS_PER_CHAPTER);
  assert.ok(currentScene(game), 'first chapter must have a playable scene');
  for (const chapter of CHAPTERS) {
    assert.ok(chapter.scenes.length >= 2, `${chapter.id} needs scenes`);
    assert.ok(chapter.ageStart <= chapter.ageEnd);
  }
});

test('whisper options lock when influence is spent', () => {
  const game = newGame({ seed: 99 });
  game.whispers = 0;
  const scene = currentScene(game);
  const choices = availableChoices(game, scene);
  assert.ok(choices.some((c) => c.whisper && !c.available), 'a whisper option must be locked at zero');
  assert.ok(choices.some((c) => !c.whisper && c.available), 'silence must always stay available');
  assert.throws(() => choose(game, scene, choices.find((c) => c.whisper).index));
});

test('choosing a whisper spends exactly one whisper and writes a log entry', () => {
  const game = newGame({ seed: 5 });
  const scene = currentScene(game);
  const opts = availableChoices(game, scene);
  const whisper = opts.find((o) => o.whisper);
  const before = game.whispers;
  const entry = choose(game, scene, whisper.index);
  assert.equal(game.whispers, before - 1);
  assert.equal(game.log.length, 1);
  assert.equal(entry.scene, scene.id);
  assert.ok(entry.note.length > 0);
});

test('stats stay inside 0..100 under extreme choices', () => {
  const game = newGame({ seed: 11 });
  game.trust = 1; game.belief = 1; game.conscience = 1;
  let guard = 0;
  while (!isFinished(game) && guard++ < 100) {
    const scene = currentScene(game);
    if (!scene) { advanceChapter(game); continue; }
    const opts = availableChoices(game, scene);
    const usable = opts.find((o) => o.available);
    choose(game, scene, usable.index);
    for (const key of ['trust', 'belief', 'conscience']) {
      assert.ok(game[key] >= 0 && game[key] <= 100, `${key} out of range: ${game[key]}`);
    }
  }
});

test('a full auto playthrough finishes and produces a biography', () => {
  const game = newGame({ seed: 42 });
  let guard = 0;
  while (!isFinished(game) && guard++ < 300) {
    const scene = currentScene(game);
    if (!scene) { advanceChapter(game); continue; }
    const opts = availableChoices(game, scene);
    const whisper = opts.find((o) => o.whisper && o.available);
    choose(game, scene, (whisper || opts[opts.length - 1]).index);
  }
  assert.ok(isFinished(game), 'career should finish');
  const bio = biography(game);
  assert.ok(bio.includes(game.name), 'biography must name the player');
  assert.ok(bio.length > 300, 'biography should be substantial');
  assert.ok(epilogue(game).length > 40);
  assert.ok(game.log.length >= 20, `expected a full arc of scenes, got ${game.log.length}`);
});
