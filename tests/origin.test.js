import { test } from 'node:test';
import assert from 'node:assert/strict';

import { newGame, currentScene, availableChoices, advanceChapter, isFinished, biography } from '../src/game.js';
import { makeOrigin, NATIONS, PEDIGREES } from '../src/origin.js';

test('origins vary across seeds', () => {
  const nations = new Set();
  const pedigrees = new Set();
  const cities = new Set();
  for (let s = 1; s <= 60; s++) {
    const o = makeOrigin({ seed: s });
    nations.add(o.nation);
    pedigrees.add(o.pedigree);
    cities.add(`${o.nation}/${o.city}`);
  }
  assert.ok(nations.size >= 3, `expected several nations, got ${nations.size}`);
  assert.ok(pedigrees.size >= 3, `expected several pedigrees, got ${pedigrees.size}`);
  assert.ok(cities.size >= 8, `expected varied cities, got ${cities.size}`);
});

test('same seed gives the same origin', () => {
  const a = makeOrigin({ seed: 777 });
  const b = makeOrigin({ seed: 777 });
  assert.deepEqual(a, b);
});

test('chosen bases are honoured', () => {
  const o = makeOrigin({ seed: 5, nation: 'Japan', pedigree: 'nonleague', city: 'Sapporo' });
  assert.equal(o.nation, 'Japan');
  assert.equal(o.pedigree, 'nonleague');
  assert.equal(o.city, 'Sapporo');
  assert.ok(o.name.length > 3);
});

test('dual nationality is common, and never the same country twice', () => {
  let duals = 0;
  for (let s = 1; s <= 80; s++) {
    const o = makeOrigin({ seed: s });
    if (o.secondNation) {
      duals++;
      assert.notEqual(o.secondNation, o.nation);
      assert.ok(NATIONS[o.secondNation], 'second nation must exist');
    }
  }
  assert.ok(duals > 10, `expected a meaningful share of dual nationals, got ${duals}/80`);
});

test('pedigree changes the starting position', () => {
  const prodigy = newGame({ seed: 3, pedigree: 'prodigy' });
  const nonleague = newGame({ seed: 3, pedigree: 'nonleague' });
  assert.ok(prodigy.belief > nonleague.belief, 'a prodigy should start believing more');
  assert.ok(prodigy.tier < nonleague.tier, 'a prodigy should start higher up');
  assert.ok(prodigy.reputation > nonleague.reputation);
});

test('the two-countries scene only appears for dual nationals', () => {
  const findScene = (game) => {
    let guard = 0;
    while (!isFinished(game) && guard++ < 200) {
      const scene = currentScene(game);
      if (!scene) { advanceChapter(game); continue; }
      if (scene.id === 'two-countries') return scene;
      const opts = availableChoices(game, scene);
      game.log.push({ dummy: true });
      game.scene += 1;
    }
    return null;
  };

  const dual = newGame({ seed: 9, nation: 'England', secondNation: 'Nigeria' });
  assert.ok(dual.secondNation, 'forced dual nationality should stick');
  assert.ok(findScene(dual), 'dual national must get the scene');

  const single = newGame({ seed: 9, nation: 'England', secondNation: null });
  assert.equal(single.secondNation, null);
  assert.equal(findScene(single), null, 'single national must not get the scene');
});

test('biography names the player and his home city', () => {
  const game = newGame({ seed: 21, nation: 'Spain', city: 'Seville' });
  let guard = 0;
  while (!isFinished(game) && guard++ < 300) {
    const scene = currentScene(game);
    if (!scene) { advanceChapter(game); continue; }
    const opts = availableChoices(game, scene);
    const whisper = opts.find((o) => o.whisper && o.available);
    game.scene += 1;
    game.log.push({ said: whisper ? 'x' : null });
  }
  game.finished = true;
  const bio = biography(game);
  assert.ok(bio.includes(game.name));
  assert.ok(bio.includes('Seville'), 'biography should place him');
});
