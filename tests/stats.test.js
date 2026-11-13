/**
 * The match record has to mean something, or it is a spreadsheet.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureRecord, performanceFor, recordMatch,
  seasonStats, careerStats, formModifier, formWord, formLine,
} from '../src/stats.js';
import { newGame, choose, currentScene, enterScene, advanceChapter } from '../src/game.js';

const game = () => newGame({ seed: 21, campaign: 'hkderby' });

test('a new career starts with an empty record', () => {
  const g = game();
  assert.deepEqual(careerStats(g), {
    apps: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, avgRating: 0,
  });
});

test('a good roll produces a performance worth keeping', () => {
  const p = performanceFor(game(), { margin: 8, approach: 'bold', crit: false, attribute: 6 });
  assert.equal(p.goals, 1);
  assert.ok(p.rating > 6.5, `rating should reflect a good game, got ${p.rating}`);
  assert.ok(['win', 'draw'].includes(p.result));
});

test('a critical is worth two goals', () => {
  const p = performanceFor(game(), { margin: 9, approach: 'bold', crit: true, attribute: 6 });
  assert.equal(p.goals, 2);
});

test('a fumble is a bad afternoon, not a heroic one', () => {
  const p = performanceFor(game(), { margin: -6, approach: 'bold', fumble: true, attribute: 5 });
  assert.equal(p.goals, 0);
  assert.equal(p.assists, 0);
  assert.ok(p.rating < 6, `rating should be poor, got ${p.rating}`);
  assert.equal(p.result, 'loss');
});

test('recorded matches roll up into a season and a career', () => {
  const g = game();
  recordMatch(g, 0, { goals: 1, assists: 0, rating: 7.4, result: 'win' });
  recordMatch(g, 0, { goals: 0, assists: 1, rating: 6.6, result: 'draw' });
  recordMatch(g, 1, { goals: 2, assists: 1, rating: 8.9, result: 'win' });

  const first = seasonStats(g, 1);
  assert.equal(first.apps, 2);
  assert.equal(first.goals, 1);
  assert.equal(first.assists, 1);
  assert.equal(first.wins, 1);
  assert.equal(first.avgRating, 7);

  const career = careerStats(g);
  assert.equal(career.apps, 3);
  assert.equal(career.goals, 3);
  assert.equal(career.assists, 2);
});

test('form is a dice modifier that stays inside a sane range', () => {
  const g = game();
  assert.equal(formModifier(g), 0, 'no matches, no opinion');

  for (let i = 0; i < 3; i++) recordMatch(g, 0, { goals: 2, assists: 1, rating: 9.2, result: 'win' });
  const hot = formModifier(g);
  assert.ok(hot > 0 && hot <= 1.5, `hot form should be a small positive, got ${hot}`);
  assert.equal(formWord(g), 'in form');

  const cold = game();
  for (let i = 0; i < 3; i++) recordMatch(cold, 0, { goals: 0, assists: 0, rating: 4.4, result: 'loss' });
  const bad = formModifier(cold);
  assert.ok(bad < 0 && bad >= -1.5, `cold form should be a small negative, got ${bad}`);
  assert.equal(formWord(cold), 'out of sorts');
});

test('a match day in the story lands on the record', () => {
  const g = game();
  let guard = 0;
  let played = 0;
  while (customGuard(g) && guard++ < 400) {
    const scene = currentScene(g);
    if (!scene) { advanceChapter(g); continue; }
    enterScene(g, scene);
    if (scene.kind === 'match') {
      const before = careerStats(g).apps;
      choose(g, scene, 0);
      played++;
      assert.equal(careerStats(g).apps, before + 1, `appearance not recorded on ${scene.id}`);
      break;
    }
    const options = scene.choices.map((_, i) => i);
    choose(g, scene, options[guard % options.length]);
  }
  assert.ok(played > 0, 'the story should contain at least one match scene');
});

function customGuard(g) {
  return !g.finished;
}

test('the record survives a save and a load', async () => {
  const { toJSON, fromJSON } = await import('../src/save-core.js');
  const g = game();
  recordMatch(g, 0, { goals: 1, assists: 2, rating: 8.1, result: 'win' });
  const back = fromJSON(toJSON(g));
  assert.deepEqual(careerStats(back), careerStats(g));
});

test('a line about the numbers is offered once there are numbers', () => {
  const g = game();
  assert.equal(formLine(g), null);
  for (let i = 0; i < 4; i++) recordMatch(g, 0, { goals: 4, assists: 0, rating: 8.4, result: 'win' });
  assert.ok(formLine(g), 'a player with 16 goals should get a line');
});

test('old saves without a record still work', () => {
  const g = game();
  delete g.record;
  assert.doesNotThrow(() => ensureRecord(g));
  assert.deepEqual(ensureRecord(g).matches, []);
});
