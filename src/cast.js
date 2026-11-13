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
  mother:   { name: 'his mother',   role: 'mother' },
  father:   { name: 'his father',   role: 'father' },
  brother:  { name: 'his brother',  role: 'brother' },
  coach:    { name: 'the coach',    role: 'coach' },
  manager:  { name: 'the manager',  role: 'manager' },
  agent:    { name: 'Terry',        role: 'agent' },
  physio:   { name: 'Ian',          role: 'physio' },
  captain:  { name: 'the captain',  role: 'captain' },
  kid:      { name: 'the kid',      role: 'young player' },
  reporter: { name: 'the reporter', role: 'press' },
  grandmother: { name: 'his grandmother', role: 'grandmother' },
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
      cast[key] = { key, name: custom, role: base.role, named: true };
    } else {
      cast[key] = { key, name: base.name, role: base.role, named: false };
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
