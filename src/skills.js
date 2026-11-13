/**
 * Skills, training points, and a personality read back from the choices.
 *
 * The prose is the game, but twenty years of a career needs a spine the player
 * can look at: what he is good at, what he has been pouring his weeks into, and
 * what kind of man the decisions are making him. Nothing here changes the plot —
 * it changes what the plot says about him, and which moments he can take on.
 */

export const ATTRIBUTES = [
  { key: 'technique',  label: 'Touch',      blurb: 'on the ball, in tight spaces' },
  { key: 'engine',     label: 'Engine',     blurb: 'the running, late in games' },
  { key: 'composure',  label: 'Composure',  blurb: 'in the big moment' },
  { key: 'presence',   label: 'Presence',   blurb: 'how a room reads him' },
  { key: 'discipline', label: 'Discipline', blurb: 'training, and the mornings after' },
];

export const SKILL_MIN = 1;
export const SKILL_MAX = 10;

/** Starting attributes, shaped by how he came into the game. */
export function startSkills(origin) {
  const base = { technique: 4, engine: 4, composure: 4, presence: 4, discipline: 4 };
  const pedigree = origin && origin.pedigree;
  const bump = (key, n) => { base[key] = Math.min(SKILL_MAX, base[key] + n); };

  if (pedigree === 'prodigy') { bump('technique', 2); bump('presence', 1); }
  else if (pedigree === 'nonleague') { bump('engine', 2); bump('discipline', 1); }
  else if (pedigree === 'lateloomer') { bump('engine', 1); bump('composure', 1); }
  else if (pedigree === 'emigrant') { bump('technique', 1); bump('engine', 1); }
  else { bump('technique', 1); bump('discipline', 1); }

  return base;
}

/** How many points a chapter is worth: three, plus one for a self-belief he earned. */
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

export function canAfford(game, requires) {
  if (!requires) return true;
  return Object.entries(requires).every(([k, v]) => (game.skills ? game.skills[k] : 0) >= v);
}

/**
 * Personality, read from flags rather than declared.
 * Each axis runs -100 (the left word) to +100 (the right word).
 */
const AXES = [
  {
    key: 'ego',
    left: 'Self-effacing',
    right: 'Arrogant',
    bands: [[-60, 'Self-effacing'], [-15, 'Quiet'], [30, 'Confident'], [65, 'Cocksure'], [100, 'Arrogant']],
    weights: {
      answeredBack: 25, deniedScandal: 30, tookCash: 15, saidItOutLoud: 8,
      stayedInSchool: -15, quietWord: -12, refusedPills: -10, mentoredKid: -10,
      frontedUp: -8, wentInAfraid: -6, expectedNothing: -8,
    },
  },
  {
    key: 'ambition',
    left: 'Loyal',
    right: 'Restless',
    bands: [[-60, 'Loyal'], [-15, 'Settled'], [20, 'Balanced'], [55, 'Ambitious'], [100, 'Restless']],
    weights: {
      tookBigMove: 40, stayedLoyal: -40, helpedBrother: -18, refusedBrother: 12,
      smartClause: 15, tookCash: 15, keptGoing: 12, retiredEarly: 8,
    },
  },
  {
    key: 'openness',
    left: 'Open', 
    right: 'Guarded',
    bands: [[-60, 'Open'], [-15, 'Frank'], [25, 'Private'], [60, 'Guarded'], [100, 'Sealed off']],
    weights: {
      spokeUp: -30, mentoredKid: -20, quietWord: -10, honestInterview: -25,
      builtPersona: 35, pushedAlone: 20, wentToManager: -6, watchedFromBench: 8,
    },
  },
  {
    key: 'conscience',
    left: 'Straight',
    right: 'Cynical',
    bands: [[-60, 'Straight'], [-15, 'Decent'], [25, 'Pragmatic'], [60, 'Cynical'], [100, 'Cold']],
    weights: {
      refusedPills: -30, frontedUp: -20, deniedScandal: 35, tookPills: 10,
      sharkAgent: 20, wentToManager: -10, tookCash: 10, helpedBrother: -12,
      hidInjury: 6,
    },
  },
];

export function personality(game) {
  const flags = game.flags || {};
  return AXES.map((axis) => {
    let value = 0;
    for (const [flag, weight] of Object.entries(axis.weights)) {
      if (flags[flag]) value += weight;
    }
    value = Math.max(-100, Math.min(100, value));
    const band = axis.bands.find(([edge]) => value <= edge) || axis.bands[axis.bands.length - 1];
    return { key: axis.key, left: axis.left, right: axis.right, value, label: band[1] };
  });
}

/** The one-line version, for the header and the biography. */
export function personalityLine(game) {
  const p = personality(game);
  const strongest = [...p].sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];
  return strongest ? strongest.label : 'Unreadable';
}

/** His strongest attribute, for prose that knows what kind of player he is. */
export function topSkill(game) {
  const skills = game.skills || {};
  const sorted = ATTRIBUTES
    .map((a) => ({ ...a, value: skills[a.key] ?? 0 }))
    .sort((a, b) => b.value - a.value);
  return sorted[0];
}

/** A short "what kind of player is he" sentence. */
export function skillSummary(game) {
  const s = game.skills || {};
  const t = s.technique ?? 0, e = s.engine ?? 0, c = s.composure ?? 0, p = s.presence ?? 0, d = s.discipline ?? 0;
  if (t >= 8 && t >= e) return 'a technical player, the sort who keeps the ball when the game is falling apart';
  if (e >= 8) return 'a runner — the kind that wins the eighty-eighth minute and never gets the credit';
  if (c >= 8) return 'a cool head, which is worth more than pace and cannot be coached';
  if (p >= 8) return 'a presence in a room before he is a presence on the pitch';
  if (d >= 8) return 'a professional, in the unglamorous sense of the word';
  return 'a good player with no single standout gift, which is the hardest kind to be noticed for'
}
