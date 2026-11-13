import { test } from 'node:test';
import assert from 'node:assert/strict';

import { newGame, currentScene, availableChoices, advanceChapter, isFinished, sceneList } from '../src/game.js';
import { CAMPAIGNS, listCampaigns } from '../src/campaigns.js';
import { makeOrigin, HOOKS } from '../src/origin.js';

test('a campaign fixes the origin and only the name is yours', () => {
  const g = newGame({ seed: 4, campaign: 'valley' });
  assert.equal(g.origin.nation, 'Wales');
  assert.equal(g.origin.city, 'Merthyr Tydfil');
  assert.equal(g.club, 'Cardiff Academy');
  assert.equal(g.name, `${CAMPAIGNS.valley.defaultFirst} ${CAMPAIGNS.valley.defaultLast}`);
  assert.equal(g.campaign, 'valley');

  const named = newGame({ seed: 4, campaign: 'valley', name: 'Evan Jones' });
  assert.equal(named.name, 'Evan Jones');
  assert.equal(named.origin.city, 'Merthyr Tydfil', 'origin must not drift when a name is set');
});

test('campaign adds its own scenes to the matching chapter', () => {
  const g = newGame({ seed: 4, campaign: 'valley' });
  const ids = sceneList(g).map((s) => s.id);
  assert.ok(ids.includes('car-park'), `expected the campaign opening scene, got ${ids.join(',')}`);

  const plain = newGame({ seed: 4, nation: 'Wales', city: 'Merthyr Tydfil' });
  assert.ok(!sceneList(plain).map((s) => s.id).includes('car-park'), 'procedural careers must not get campaign scenes');
});

test('campaign scenes are reachable by playing', () => {
  const g = newGame({ seed: 4, campaign: 'valley' });
  const seen = [];
  let guard = 0;
  while (!isFinished(g) && guard++ < 300) {
    const scene = currentScene(g);
    if (!scene) { advanceChapter(g); continue; }
    seen.push(scene.id);
    const opts = availableChoices(g, scene);
    const usable = opts.find((o) => o.available);
    g.scene += 1;
    g.log.push({ said: usable && usable.whisper ? 'x' : null });
  }
  for (const id of ['car-park', 'the-flag', 'the-money', 'the-return']) {
    assert.ok(seen.includes(id), `${id} never appeared`);
  }
});

test('unknown campaign is rejected loudly', () => {
  assert.throws(() => newGame({ seed: 1, campaign: 'nope' }), /unknown campaign/);
});

test('campaign list is discoverable', () => {
  const list = listCampaigns();
  assert.ok(list.length >= 1);
  for (const c of list) {
    assert.ok(c.id && c.title && c.blurb && c.nation);
  }
});

test('every origin gets 2-3 hooks, including a family hook', () => {
  for (let s = 1; s <= 40; s++) {
    const o = makeOrigin({ seed: s });
    assert.ok(o.hooks.length >= 2 && o.hooks.length <= 3, `seed ${s}: ${o.hooks.length} hooks`);
    assert.ok(o.hooks.some((h) => h.tag === 'family'), `seed ${s}: no family hook`);
    assert.ok(o.hooks.every((h) => HOOKS.some((k) => k.id === h.id)));
  }
});

test('hooks are drawn from the seed, so careers differ', () => {
  const sets = new Set();
  for (let s = 1; s <= 40; s++) sets.add(makeOrigin({ seed: s }).hooks.map((h) => h.id).join('+'));
  assert.ok(sets.size > 3, `expected varied hooks, got ${sets.size} combinations`);
});

test('hook text reaches the opening scene', () => {
  const g = newGame({ seed: 12, nation: 'Germany' });
  const opening = currentScene(g);
  const text = opening.text(g);
  const familyHook = g.origin.hooks.find((h) => h.tag === 'family');
  assert.ok(text.includes(familyHook.text), 'the first scene should carry his family hook');
});

test('nations are the requested set: Europe plus China, no Nigeria', async () => {
  const { NATIONS, MAIN_NATIONS } = await import('../src/origin.js');
  assert.ok(!NATIONS.Nigeria, 'Nigeria should be removed for now');
  assert.ok(NATIONS.China, 'China is required');
  for (const main of ['England', 'Wales', 'Germany', 'Greece', 'Japan', 'China']) {
    assert.ok(MAIN_NATIONS.includes(main), `${main} should be a main story country`);
  }
  assert.ok(Object.keys(NATIONS).length >= 8, 'expect a decent pool of nations');
});

test('first and last name can be set independently over the base name', () => {
  const base = newGame({ seed: 2, campaign: 'hkderby' });
  assert.equal(base.name, 'Ka-ho Chan');

  const firstOnly = newGame({ seed: 2, campaign: 'hkderby', firstName: 'Marcus' });
  assert.equal(firstOnly.name, 'Marcus Chan');

  const lastOnly = newGame({ seed: 2, campaign: 'hkderby', lastName: 'Ng' });
  assert.equal(lastOnly.name, 'Ka-ho Ng');

  const both = newGame({ seed: 2, campaign: 'hkderby', firstName: 'Callum', lastName: 'Ng' });
  assert.equal(both.name, 'Callum Ng');

  const full = newGame({ seed: 2, campaign: 'hkderby', name: 'Evan Jones' });
  assert.equal(full.name, 'Evan Jones', 'a full name must still win');
});
