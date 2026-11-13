/**
 * Dice.
 *
 * Every choice is a check: d20 + an attribute modifier against a difficulty.
 * The RNG rides on the game's own seeded state, so a career replays the same
 * way it was played rather than being re-rolled by a page refresh.
 */

import { makeRng } from './rng.js';

export const DC_EASY = 7;
export const DC_NORMAL = 10;
export const DC_HARD = 13;

/** A football attribute (1-10) becomes a modifier of -4 to +5, D&D style. */
export function modifierFor(game, attribute) {
  const value = (game.skills && game.skills[attribute]) || 4;
  return value - 5;
}

/**
 * Which football attribute an approach tests on match day.
 * Bold is physical, careful is nerve, honest is vision, craft is touch, graft is engine.
 */
export const MATCH_ATTRIBUTE = {
  bold: 'power',
  careful: 'composure',
  honest: 'vision',
  craft: 'touch',
  graft: 'engine',
};

/** Which personality axis a social approach tests on. */
export const SOCIAL_AXIS = {
  bold: 'ego',
  careful: 'openness',
  honest: 'conscience',
  craft: 'openness',
  graft: 'loyalty',
};

/** The three approaches, each tied to an attribute and a personality push. */
export const APPROACHES = {
  bold:    { label: 'Bold',    attribute: 'presence',   axis: 'ego',       blurb: 'say it out loud' },
  careful: { label: 'Careful', attribute: 'composure',  axis: 'openness',  blurb: 'take your time' },
  honest:  { label: 'Honest',  attribute: 'discipline', axis: 'conscience', blurb: 'tell the truth' },
  craft:   { label: 'Craft',   attribute: 'technique',  axis: 'ambition',  blurb: 'do it properly' },
  graft:   { label: 'Graft',   attribute: 'engine',     axis: 'ambition',  blurb: 'out-work it' },
};

/**
 * Roll a d20 with optional advantage (roll twice, keep the higher).
 * Mutates game.randState so the stream continues correctly.
 */
export function rollD20(game, { advantage = false } = {}) {
  const rng = makeRng(game.seed);
  rng.state = game.randState ?? rng.state;
  const a = 1 + Math.floor(rng() * 20);
  const b = advantage ? 1 + Math.floor(rng() * 20) : null;
  game.randState = rng.state;
  const used = b === null ? a : Math.max(a, b);
  return { rolls: [a, b].filter((n) => n !== null), natural: used, advantage };
}

/**
 * Resolve a check: d20 + modifier vs DC.
 * A natural 20 always succeeds and a natural 1 always fails, whatever the maths.
 */
export function check(game, attribute, dc, { advantage = false, modifier = null } = {}) {
  const roll = rollD20(game, { advantage });
  const mod = modifier === null ? modifierFor(game, attribute) : modifier;
  const total = roll.natural + mod;
  const crit = roll.natural === 20;
  const fumble = roll.natural === 1;
  const success = crit || (!fumble && total >= dc);
  return {
    attribute,
    dc,
    mod,
    rolls: roll.rolls,
    natural: roll.natural,
    total,
    success,
    crit,
    fumble,
    advantage: roll.advantage,
  };
}

/** How a check reads on screen: "d20 12 + 3 = 15 vs 12". */
export function describeCheck(result) {
  const dice = result.rolls.length > 1 ? `d20 ${result.rolls.join('/')}` : `d20 ${result.natural}`;
  const sign = result.mod >= 0 ? '+' : '−';
  return `${dice} ${sign}${Math.abs(result.mod)} = ${result.total} vs ${result.dc}`;
}
