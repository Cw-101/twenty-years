/**
 * Match record: what he has actually done, and what it does to him.
 *
 * Every match-kind scene resolves to one performance — goals, assists, a
 * rating — decided by the roll margin and the approach he took. Those numbers
 * are not decoration: form moves the dice in later matches, the story quotes
 * them back at him, and the ending is written from them.
 */

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** A record exists on every game, including saves made before it did. */
export function ensureRecord(game) {
  if (!game.record || !Array.isArray(game.record.matches)) {
    game.record = { matches: [] };
  }
  return game.record;
}

/**
 * Turn one resolved match into a performance.
 * margin  = roll total - DC (negative on a failure)
 * crit/fumble come from the die itself
 */
export function performanceFor(game, { margin = 0, approach = 'careful', crit = false, fumble = false, attribute = 5 } = {}) {
  let goals = 0;
  let assists = 0;

  if (!fumble) {
    // a striker's number: goals come from the bold and the crafted
    const goalChance = margin + (approach === 'bold' ? 2 : 0) + (approach === 'craft' ? 1 : 0);
    if (crit) goals = 2;
    else if (goalChance >= 7) goals = 1;
    else if (goalChance >= 4 && approach === 'bold' && attribute >= 6) goals = 1;

    if (margin >= 3 && (approach === 'craft' || approach === 'honest')) assists = 1;
    if (crit && assists === 0) assists = 1;
  }

  const rating = clamp(
    6.1 + margin * 0.22 + (crit ? 0.9 : 0) - (fumble ? 1.4 : 0) + (attribute - 5) * 0.08,
    3.4,
    9.9,
  );

  // who won: the scoreline follows the performance, not the other way round
  const swing = goals * 1.1 + assists * 0.7 + margin * 0.25;
  const result = swing >= 1.5 ? 'win' : swing <= -1.2 ? 'loss' : 'draw';

  return { goals, assists, rating: Math.round(rating * 10) / 10, result };
}

/** Append a performance. Safe to call with an empty object. */
export function recordMatch(game, chapter, performance) {
  const record = ensureRecord(game);
  record.matches.push({
    chapter: (chapter ?? game.chapter ?? 0) + 1,
    goals: performance.goals || 0,
    assists: performance.assists || 0,
    rating: performance.rating || 6.0,
    result: performance.result || 'draw',
    age: game.age,
  });
  return record.matches[record.matches.length - 1];
}

/** Totals for one chapter (1-based, matching what the player sees). */
export function seasonStats(game, chapterNumber = (game.chapter || 0) + 1) {
  const record = ensureRecord(game);
  const rows = record.matches.filter((m) => m.chapter === chapterNumber);
  return summarise(rows);
}

export function careerStats(game) {
  return summarise(ensureRecord(game).matches);
}

function summarise(rows) {
  const apps = rows.length;
  const goals = rows.reduce((a, m) => a + m.goals, 0);
  const assists = rows.reduce((a, m) => a + m.assists, 0);
  const ratingSum = rows.reduce((a, m) => a + m.rating, 0);
  return {
    apps,
    goals,
    assists,
    wins: rows.filter((m) => m.result === 'win').length,
    draws: rows.filter((m) => m.result === 'draw').length,
    losses: rows.filter((m) => m.result === 'loss').length,
    avgRating: apps ? Math.round((ratingSum / apps) * 10) / 10 : 0,
  };
}

/**
 * How hot he is, in dice. The last three performances decide whether he walks
 * out believing he will score or expecting the ball to bounce off him.
 */
export function formModifier(game) {
  const matches = ensureRecord(game).matches.slice(-3);
  if (matches.length < 2) return 0;
  const avg = matches.reduce((a, m) => a + m.rating, 0) / matches.length;
  const mod = (avg - 6.6) * 0.55;
  return Math.round(clamp(mod, -1.5, 1.5) * 2) / 2;   // to the nearest half
}

/** A word for the form, for prose and for the profile. */
export function formWord(game) {
  const mod = formModifier(game);
  if (mod >= 1) return 'in form';
  if (mod >= 0.5) return 'sharp';
  if (mod <= -1) return 'out of sorts';
  if (mod <= -0.5) return 'short of it';
  return 'steady';
}

/** One line a person in the story could plausibly say about the numbers. */
export function formLine(game) {
  const { apps, goals, assists, avgRating } = careerStats(game);
  if (!apps) return null;
  if (goals >= 20) return `${goals} goals. Nobody at this club has done that in a decade.`;
  if (goals >= 10) return `${goals} goals this season, and they still talk about him like he is new.`;
  if (assists >= 10) return `${assists} assists. The lad who makes the others look good.`;
  if (avgRating >= 7.6) return `Averaging ${avgRating.toFixed(1)}. That is not luck, that is a season.`;
  if (avgRating && avgRating < 6.2) return `${apps} games and an average under ${avgRating.toFixed(1)}. He knows.`;
  return null;
}
