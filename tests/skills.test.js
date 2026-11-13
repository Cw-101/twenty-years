import test from 'node:test';
import assert from 'node:assert/strict';

import { newGame, advanceChapter, availableChoices, currentScene, choose } from '../src/game.js';
import {
  ATTRIBUTES, SKILL_MAX, startSkills, pointsForChapter, spendPoint,
  personality, personalityLine, canAfford, skillSummary,
} from '../src/skills.js';
import { toJSON, fromJSON } from '../src/save-core.js';
import { CHAPTERS } from '../src/story.js';

test('a new career starts with readable attributes and no points to spend', () => {
  const g = newGame({ seed: 7, campaign: 'hkderby' });
  for (const { key } of ATTRIBUTES) {
    assert.ok(g.skills[key] >= 1 && g.skills[key] <= SKILL_MAX, `${key} out of range`);
  }
  assert.equal(g.skillPoints, 0);
});

test('pedigree shapes the starting attributes', () => {
  const prodigy = startSkills({ pedigree: 'prodigy' });
  const nonleague = startSkills({ pedigree: 'nonleague' });
  assert.ok(prodigy.technique > prodigy.engine);
  assert.ok(nonleague.engine > nonleague.technique);
});

test('finishing a chapter pays out training points', () => {
  const g = newGame({ seed: 8, campaign: 'hkderby' });
  const before = g.skillPoints;
  const res = advanceChapter(g);
  assert.equal(res.finished, false);
  assert.equal(res.pointsAwarded, pointsForChapter(g));
  assert.equal(g.skillPoints, before + res.pointsAwarded);
});

test('a point spent raises the attribute and cannot be spent twice', () => {
  const g = newGame({ seed: 9, campaign: 'hkderby' });
  g.skillPoints = 1;
  const before = g.skills.technique;
  assert.equal(spendPoint(g, 'technique'), before + 1);
  assert.equal(g.skillPoints, 0);
  assert.equal(spendPoint(g, 'technique'), null);
  assert.equal(g.skills.technique, before + 1);
});

test('attributes stop at the cap even with points to spare', () => {
  const g = newGame({ seed: 10, campaign: 'hkderby' });
  g.skillPoints = 5;
  g.skills.engine = SKILL_MAX;
  assert.equal(spendPoint(g, 'engine'), null);
  assert.equal(g.skills.engine, SKILL_MAX);
  assert.equal(g.skillPoints, 5, 'a refused spend must not consume a point');
});

test('personality has four axes, in range, with a label each', () => {
  const g = newGame({ seed: 11, campaign: 'hkderby' });
  const axes = personality(g);
  assert.equal(axes.length, 4);
  for (const ax of axes) {
    assert.ok(ax.value >= -100 && ax.value <= 100);
    assert.ok(typeof ax.label === 'string' && ax.label.length > 0);
  }
  assert.equal(typeof personalityLine(g), 'string');
});

test('the choices actually move the personality', () => {
  const quiet = newGame({ seed: 12, campaign: 'hkderby' });
  quiet.flags = { quietWord: true, stayedInSchool: true, refusedPills: true, mentoredKid: true };

  const loud = newGame({ seed: 12, campaign: 'hkderby' });
  loud.flags = { answeredBack: true, tookCash: true, deniedScandal: true, builtPersona: true };

  const egoOf = (g) => personality(g).find((a) => a.key === 'ego').value;
  assert.ok(egoOf(loud) > egoOf(quiet), 'arrogant flags should read more arrogant');

  const opennessOf = (g) => personality(g).find((a) => a.key === 'openness').value;
  assert.ok(opennessOf(loud) > opennessOf(quiet), 'a built persona should read more guarded');
});

test('skill-gated choices stay locked until the attribute is there', () => {
  const g = newGame({ seed: 13, campaign: 'hkderby' });
  const gated = {
    id: 'test-gate',
    text: 'x',
    choices: [{ label: 'Needs presence', requires: { presence: 9 } }],
  };
  assert.equal(canAfford(g, { presence: 9 }), false);
  const opts = availableChoices(g, gated);
  assert.equal(opts[0].available, false);
  assert.match(opts[0].lockedReason, /needs presence 9/);

  g.skills.presence = 9;
  assert.equal(availableChoices(g, gated)[0].available, true);
});

test('skills survive a save and an old save is migrated', () => {
  const g = newGame({ seed: 14, campaign: 'hkderby' });
  g.skillPoints = 2;
  g.skills.composure = 7;
  const back = fromJSON(toJSON(g));
  assert.equal(back.skills.composure, 7);
  assert.equal(back.skillPoints, 2);

  const legacy = JSON.parse(toJSON(g));
  delete legacy.game.skills;
  delete legacy.game.skillPoints;
  const migrated = fromJSON(JSON.stringify(legacy));
  assert.deepEqual(Object.keys(migrated.skills).sort(), ATTRIBUTES.map((a) => a.key).sort());
  assert.equal(migrated.skillPoints, 0);
});

test('the skill summary always describes a real player', () => {
  const g = newGame({ seed: 15, campaign: 'hkderby' });
  const line = skillSummary(g);
  assert.ok(line.length > 10);
  assert.ok(!/undefined/.test(line));
});

test('a whole career can be played without the skill layer breaking it', () => {
  const g = newGame({ seed: 16, campaign: 'hkderby' });
  let guard = 0;
  while (!g.finished && guard++ < 400) {
    const scene = currentScene(g);
    if (!scene) { advanceChapter(g); continue; }
    const opts = availableChoices(g, scene).filter((o) => o.available);
    assert.ok(opts.length > 0, `no playable choice in ${scene.id}`);
    choose(g, scene, opts[0].index);
  }
  assert.ok(guard > CHAPTERS.length, 'should have played real scenes');
  assert.ok(!/undefined/.test(skillSummary(g)));
});
