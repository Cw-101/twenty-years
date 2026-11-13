/**
 * Save format, with no Node dependencies — usable from the browser and from
 * tests. The filesystem helpers live in save.js.
 */
const SAVE_VERSION = 1;

export function toJSON(game) {
  return JSON.stringify({ version: SAVE_VERSION, savedAt: new Date().toISOString(), game }, null, 2);
}

export function toObject(game) {
  return { version: SAVE_VERSION, savedAt: new Date().toISOString(), game };
}

export function fromJSON(text) {
  return fromObject(JSON.parse(text));
}

export function fromObject(parsed) {
  const game = parsed && parsed.game ? parsed.game : parsed;
  if (!game || typeof game !== 'object' || !game.origin || typeof game.chapter !== 'number') {
    throw new Error('not a Twenty Years save');
  }
  if (!Array.isArray(game.memories)) game.memories = [];
  if (!Array.isArray(game.log)) game.log = [];
  // Careers saved before skills existed start from a neutral set rather than crashing.
  if (!game.skills || typeof game.skills !== 'object') {
    game.skills = { technique: 4, engine: 4, composure: 4, presence: 4, discipline: 4 };
  }
  if (typeof game.skillPoints !== 'number') game.skillPoints = 0;
  if (!Array.isArray(game.skillHistory)) game.skillHistory = [];
  return game;
}
