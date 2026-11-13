/**
 * Game state and the chapter/scene engine.
 *
 * Guardian framing: the player is a voice the footballer can hear, with three
 * whispers per chapter. Every intervention costs one; silence is free.
 */
import { makeRng, intBetween } from './rng.js';
import { CHAPTERS } from './story.js';
import { makeOrigin } from './origin.js';
import { writeBiography, writeEpilogue } from './biography.js';

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export const WHISPERS_PER_CHAPTER = 3;

/**
 * Start a career.
 *
 * `nation`, `secondNation`, `city`, `pedigree` and `background` are the player's
 * chosen bases; anything omitted is drawn from the seed. The origin sets the
 * opening numbers (tier, wage, belief, reputation) but never the plot.
 */
export function newGame({ seed = Date.now(), name, nation, secondNation, city, pedigree, background } = {}) {
  const rng = makeRng(seed);
  const origin = makeOrigin({ seed: seed ^ 0x9e3779b9, nation, secondNation, city, pedigree, background });
  if (name) origin.name = name;

  const game = {
    seed,
    origin,
    name: origin.name,
    nation: origin.nation,
    secondNation: origin.secondNation,
    chapter: 0,
    scene: 0,
    age: CHAPTERS[0].ageStart,
    whispers: WHISPERS_PER_CHAPTER,
    trust: origin.start.trust,
    belief: origin.start.belief,
    conscience: 65,
    reputation: origin.start.reputation,
    tier: origin.start.tier,
    wage: origin.start.wage,
    caps: 0,
    flags: {},
    log: [],
    spokenCount: 0,
    silentCount: 0,
    randState: rng.state,
    finished: false,
  };
  return game;
}

export function currentChapter(game) {
  return CHAPTERS[game.chapter] ?? null;
}

/** The scene the player is looking at, or null when the career is over. */
export function currentScene(game) {
  const chapter = currentChapter(game);
  if (!chapter) return null;
  for (let i = game.scene; i < chapter.scenes.length; i++) {
    const scene = chapter.scenes[i];
    if (typeof scene.if === 'function' && !scene.if(game)) {
      game.scene = i + 1;
      continue;
    }
    game.scene = i;
    return scene;
  }
  return null;
}

/** Choices, with whisper options marked unavailable when influence is spent. */
export function availableChoices(game, scene) {
  return scene.choices.map((choice, index) => ({
    index,
    label: typeof choice.label === 'function' ? choice.label(game) : choice.label,
    whisper: choice.whisper === true,
    available: choice.whisper === true ? game.whispers > 0 : true,
    lockedReason: choice.whisper === true && game.whispers <= 0 ? 'No whispers left' : null,
  }));
}

/** Pick a choice. Returns the log entry produced. */
export function choose(game, scene, index) {
  const choice = scene.choices[index];
  if (!choice) throw new Error(`no choice ${index} on scene ${scene.id}`);
  if (choice.whisper && game.whispers <= 0) throw new Error('no whispers left');

  if (choice.whisper) {
    game.whispers -= 1;
    game.spokenCount += 1;
  } else {
    game.silentCount += 1;
  }

  const effects = typeof choice.effects === 'function' ? choice.effects(game) : (choice.effects || {});
  for (const [key, delta] of Object.entries(effects)) {
    if (['trust', 'belief', 'conscience'].includes(key)) game[key] = clamp(game[key] + delta);
    else game.flags[key] = delta;
  }
  if (choice.flag) game.flags[choice.flag] = true;

  const note = typeof choice.log === 'function' ? choice.log(game) : (choice.log || choice.label);
  const entry = {
    chapter: game.chapter + 1,
    chapterTitle: currentChapter(game).title,
    age: game.age,
    scene: scene.id,
    said: choice.whisper ? (typeof choice.say === 'function' ? choice.say(game) : choice.label) : null,
    choice: choice.label,
    note,
    trust: game.trust,
    belief: game.belief,
    conscience: game.conscience,
  };
  game.log.push(entry);

  game.scene += 1;
  return entry;
}

/** Move to the next chapter, refreshing whispers and ageing the character. */
export function advanceChapter(game) {
  game.chapter += 1;
  const chapter = currentChapter(game);
  if (!chapter) {
    game.finished = true;
    return { finished: true };
  }
  game.age = chapter.ageStart;
  game.whispers = WHISPERS_PER_CHAPTER;
  game.scene = 0;
  return { finished: false, chapter };
}

export function isFinished(game) {
  return game.finished === true;
}

export function biography(game) {
  return writeBiography(game);
}

export function epilogue(game) {
  return writeEpilogue(game);
}
