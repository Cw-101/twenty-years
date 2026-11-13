/**
 * The people in his life.
 *
 * Telltale's memory beat only lands if it has a name on it. "Someone will
 * remember that" is noise; "Mei will remember that" is a person in a kitchen
 * deciding something about her son.
 *
 * A campaign can rename any of them — a Welsh mother is not a Hong Kong mother —
 * and anything unnamed falls back to a plain description.
 */

export const CAST = {
  mother: {
    name: 'his mother', role: 'mother',
    about: 'Came to Derby from Sham Shui Po in 2003 with two suitcases. Works nights at a care home on Osmaston Road. Keeps her English careful and exact, because she has spent twenty years being corrected. One rule: he takes the college day.',
  },
  father: { name: 'his father', role: 'father', about: 'In Hong Kong, on the other end of a phone, and never quite at the end of it.' },
  brother: { name: 'his brother', role: 'brother', about: 'Two years older, still on the estate, still the funniest person in the family, and knows it.' },
  sister: {
    name: 'his sister', role: 'sister',
    about: 'Sixteen, quicker than everyone else in the house, and the only one who says the true thing out loud.',
  },
  coach: { name: 'the coach', role: 'coach', about: 'Runs the under-18s. Two hundred games in the Conference and mentions it less than you would expect.' },
  manager: { name: 'the manager', role: 'manager', about: 'Picks the team, protects the club, and has been sacked twice before.' },
  agent: { name: 'Terry', role: 'agent', about: 'Ten per cent, a good coat, and a car that is not leased. Took thirty per cent off a lad here in 2014.' },
  physio: { name: 'Ian', role: 'physio', about: 'Eighteen years at the club. Knows what a knee is worth and what a season is worth, and they are not the same number.' },
  captain: { name: 'the captain', role: 'captain', about: 'Thirty-four, eight months left on his contract, and has decided that being feared is the same as being respected.' },
  kid: { name: 'the kid', role: 'young player', about: 'Seventeen, signed from the under-18s, and in the same seat in the same corner of the same dressing room.' },
  reporter: { name: 'the reporter', role: 'press', about: 'Twenty-three, local, and sent to do the academy piece because the first team lost on Saturday.' },
  grandmother: { name: 'his grandmother', role: 'grandmother', about: 'Sham Shui Po, a fan that does not work in summer, and a phone call every Sunday.' },
};

/**
 * Everyone the game can hold against you, with whatever names the campaign set.
 * `display` is what the notification says, so it reads as English either way.
 */
export function resolveCast(overrides = {}) {
  const cast = {};
  for (const [key, base] of Object.entries(CAST)) {
    const custom = overrides[key];
    if (custom) {
      cast[key] = { key, name: custom, role: base.role, about: base.about, named: true };
    } else {
      cast[key] = { key, name: base.name, role: base.role, about: base.about, named: false };
    }
  }
  return cast;
}

/** "Mei will remember that" / "His mother will remember that". */
export function witnessLine(game, key) {
  const person = (game.cast && game.cast[key]) || CAST[key];
  if (!person) return 'Someone will remember that';
  const name = person.name;
  if (person.named) return `${name} will remember that`;
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} will remember that`;
}

/** The text used inside prose when a character speaks or is referred to. */
export function nameOf(game, key) {
  const person = (game.cast && game.cast[key]) || CAST[key];
  return person ? person.name : key;
}
