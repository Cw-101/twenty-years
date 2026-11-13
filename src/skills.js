/**
 * Two kinds of stat, deliberately kept apart.
 *
 * FOOTBALL is what he can do: touch, engine, composure, vision, power. It is
 * distributed once at the start, trained between chapters, and it decides the
 * checks in match-day and training scenes.
 *
 * PERSONALITY is who he is becoming: confidence, loyalty, openness, conscience.
 * It is not bought — it is read from the choices — and it decides the social
 * checks in story scenes.
 *
 * Nothing here changes the plot. It changes what the plot says about him, and
 * which moments he can take on.
 */

export const FOOTBALL = [
  { key: 'touch',     label: 'Touch',     blurb: 'first touch, close control, the ball under pressure' },
  { key: 'engine',    label: 'Engine',    blurb: 'the running, the recovery, the eighty-eighth minute' },
  { key: 'composure', label: 'Composure', blurb: 'nerves in the moment that decides it' },
  { key: 'vision',    label: 'Vision',    blurb: 'seeing the pass before it exists' },
  { key: 'power',     label: 'Power',     blurb: 'strength, pace, the physical argument' },
];

/** Backwards-compatible alias: older screens and tests called these "attributes". */
export const ATTRIBUTES = FOOTBALL;

export const PERSONALITY = [
  { key: 'ego',        left: 'Self-effacing', right: 'Arrogant', blurb: 'how much room he takes up' },
  { key: 'loyalty',    left: 'Loyal',         right: 'Restless', blurb: 'what he owes, and to whom' },
  { key: 'openness',   left: 'Open',          right: 'Guarded',  blurb: 'how much of himself he shows' },
  { key: 'conscience', left: 'Straight',      right: 'Cynical',  blurb: 'what he will do to get on' },
];

export const SKILL_MIN = 1;
export const SKILL_MAX = 10;
export const START_POINTS = 10;   // placed before the first scene
export const START_MAX = 6;       // no attribute above this at sixteen
export const START_BASE = 2;      // where everyone begins

/* ------------------------------------------------------- starting spread */

export function blankAllocation() {
  const out = {};
  for (const { key } of FOOTBALL) out[key] = START_BASE;
  return out;
}

export function pointsLeft(allocation) {
  const spent = FOOTBALL.reduce((n, { key }) => n + ((allocation[key] ?? START_BASE) - START_BASE), 0);
  return START_POINTS - spent;
}

export function canRaise(allocation, key) {
  return pointsLeft(allocation) > 0 && allocation[key] < START_MAX;
}

export function canLower(allocation, key) {
  return allocation[key] > START_BASE;
}

/** What his pedigree would suggest, if the player does not want to choose. */
export function suggestedAllocation(origin) {
  const a = blankAllocation();
  const pedigree = origin && origin.pedigree;
  if (pedigree === 'prodigy') { a.touch += 4; a.vision += 3; a.composure += 2; a.power += 1; }
  else if (pedigree === 'nonleague') { a.engine += 4; a.power += 3; a.composure += 2; a.touch += 1; }
  else if (pedigree === 'lateloomer') { a.engine += 3; a.power += 3; a.composure += 2; a.touch += 1; a.vision += 1; }
  else if (pedigree === 'emigrant') { a.touch += 3; a.engine += 3; a.vision += 2; a.power += 1; a.composure += 1; }
  else { a.touch += 3; a.vision += 3; a.engine += 2; a.composure += 1; a.power += 1; }
  return a;
}

/** Clamp, fill gaps and never hand out more than the budget. */
export function normaliseAllocation(allocation, fallback) {
  const src = allocation || fallback || blankAllocation();
  const out = {};
  for (const { key } of FOOTBALL) {
    const v = Number(src[key]);
    out[key] = Number.isFinite(v) ? Math.max(SKILL_MIN, Math.min(START_MAX, Math.round(v))) : START_BASE;
  }
  let over = -pointsLeft(out);
  while (over > 0) {
    const highest = [...FOOTBALL].map((f) => f.key).sort((a, b) => out[b] - out[a])[0];
    if (out[highest] <= SKILL_MIN) break;
    out[highest] -= 1;
    over -= 1;
  }
  return out;
}

export function startSkills(origin, allocation) {
  return normaliseAllocation(allocation, suggestedAllocation(origin));
}

/* ---------------------------------------------------------------- growth */

export function pointsForChapter(game) {
  return 3 + (game.belief >= 70 ? 1 : 0);
}

export function awardPoints(game) {
  const n = pointsForChapter(game);
  game.skillPoints = (game.skillPoints || 0) + n;
  return n;
}

/** Spend one point. Returns the attribute's new value, or null if nothing happened. */
export function spendPoint(game, key) {
  if (!game.skillPoints || game.skillPoints <= 0) return null;
  if (!game.skills || !(key in game.skills)) return null;
  if (game.skills[key] >= SKILL_MAX) return null;
  game.skills[key] += 1;
  game.skillPoints -= 1;
  game.skillHistory = game.skillHistory || [];
  game.skillHistory.push({ key, age: game.age, chapter: game.chapter + 1 });
  return game.skills[key];
}

/** Take back the last point spent this session. Returns the key, or null. */
export function refundPoint(game) {
  const history = game.skillHistory || [];
  if (!history.length) return null;
  const last = history[history.length - 1];
  if (!last || !game.skills || typeof game.skills[last.key] !== 'number') return null;
  if (game.skills[last.key] <= SKILL_MIN) return null;
  game.skills[last.key] -= 1;
  game.skillPoints = (game.skillPoints || 0) + 1;
  history.pop();
  return last.key;
}

export function canAfford(game, requires) {
  if (!requires) return true;
  return Object.entries(requires).every(([k, v]) => (game.skills ? game.skills[k] : 0) >= v);
}

/* ----------------------------------------------------------- personality */

/**
 * How each approach, repeated, bends a personality axis.
 * Choosing "bold" twenty times makes an arrogant man even when no single flag
 * ever said so.
 */
const STANCE_PULL = {
  bold:    { ego: 7 },
  careful: { openness: 5 },
  honest:  { conscience: -7 },
  craft:   { loyalty: 4, ego: 2 },
  graft:   { loyalty: 5, ego: -1 },
};

const AXIS_FLAGS = {
  ego: {
    answeredBack: 25, deniedScandal: 30, tookCash: 15, saidItOutLoud: 8,
    stayedInSchool: -15, quietWord: -12, refusedPills: -10, mentoredKid: -10,
    frontedUp: -8, wentInAfraid: -6, expectedNothing: -8,
  },
  loyalty: {
    tookBigMove: 40, stayedLoyal: -40, helpedBrother: -18, refusedBrother: 12,
    smartClause: 15, tookCash: 15, keptGoing: 12, retiredEarly: 8,
  },
  openness: {
    spokeUp: -30, mentoredKid: -20, quietWord: -10, honestInterview: -25,
    builtPersona: 35, pushedAlone: 20, wentToManager: -6, watchedFromBench: 8,
  },
  conscience: {
    refusedPills: -30, frontedUp: -20, deniedScandal: 35, tookPills: 10,
    sharkAgent: 20, wentToManager: -10, tookCash: 10, helpedBrother: -12,
    hidInjury: 6,
  },
};

const BAND_WORDS = {
  ego:        ['Self-effacing', 'Quiet', 'Confident', 'Cocksure', 'Arrogant'],
  loyalty:    ['Loyal', 'Settled', 'Balanced', 'Ambitious', 'Restless'],
  openness:   ['Open', 'Frank', 'Private', 'Guarded', 'Sealed off'],
  conscience: ['Straight', 'Decent', 'Pragmatic', 'Cynical', 'Cold'],
};

const BAND_EDGES = [-60, -15, 25, 60, 100];

/** Each axis runs -100 (the left word) to +100 (the right word). */
export function personality(game) {
  const flags = game.flags || {};
  const stance = game.stance || {};
  return PERSONALITY.map((axis) => {
    let value = 0;
    for (const [flag, weight] of Object.entries(AXIS_FLAGS[axis.key] || {})) {
      if (flags[flag]) value += weight;
    }
    for (const [approach, count] of Object.entries(stance)) {
      const pull = STANCE_PULL[approach];
      if (pull && pull[axis.key]) value += pull[axis.key] * count;
    }
    value = Math.max(-100, Math.min(100, value));
    const index = Math.max(0, BAND_EDGES.findIndex((edge) => value <= edge));
    return { ...axis, value, index, label: BAND_WORDS[axis.key][index === -1 ? 4 : index] };
  });
}

/** The one-line version, for the biography. */
export function personalityLine(game) {
  const all = personality(game);
  const strongest = [...all].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];
  return strongest ? strongest.label : 'Unreadable';
}

/** A personality axis as a d20 modifier: -5 (fully left) to +5 (fully right). */
export function personalityModifier(game, axisKey) {
  const axis = personality(game).find((a) => a.key === axisKey);
  if (!axis) return 0;
  return Math.max(-5, Math.min(5, Math.round(axis.value / 20)));
}

/* ------------------------------------------------------------------ prose */

export function topSkill(game) {
  const skills = game.skills || {};
  return FOOTBALL
    .map((a) => ({ ...a, value: skills[a.key] ?? 0 }))
    .sort((a, b) => b.value - a.value)[0];
}

export function skillSummary(game) {
  const s = game.skills || {};
  const t = s.touch ?? 0, e = s.engine ?? 0, c = s.composure ?? 0, v = s.vision ?? 0, p = s.power ?? 0;
  if (t >= 8 && t >= e) return 'a technical player, the sort who keeps the ball when the game is falling apart';
  if (e >= 8) return 'a runner — the kind that wins the eighty-eighth minute and never gets the credit';
  if (c >= 8) return 'a cool head, which is worth more than pace and cannot be coached';
  if (v >= 8) return 'a reader of the game, two passes ahead of everyone else on the pitch';
  if (p >= 8) return 'a physical player who wins the argument before the ball arrives';
  return 'a good player with no single standout gift, which is the hardest kind to be noticed for';
}
