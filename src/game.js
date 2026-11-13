/**
 * Game state and the chapter/scene engine.
 *
 * Guardian framing: the player is a voice the footballer can hear, with three
 * whispers per chapter. Every intervention costs one; silence is free.
 */
import { makeRng, intBetween } from './rng.js';
import { CHAPTERS } from './story.js';
import { HOOK_SCENES } from './hook-scenes.js';
import { makeOrigin } from './origin.js';
import { getCampaign } from './campaigns.js';
import { writeBiography, writeEpilogue } from './biography.js';
import { startSkills, awardPoints, canAfford, skillSummary, personalityLine } from './skills.js';

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export const WHISPERS_PER_CHAPTER = 3;

/**
 * Start a career.
 *
 * `nation`, `secondNation`, `city`, `pedigree` and `background` are the player's
 * chosen bases; anything omitted is drawn from the seed. The origin sets the
 * opening numbers (tier, wage, belief, reputation) but never the plot.
 */
export function newGame({ seed = Date.now(), name, firstName, lastName, nation, secondNation, city, pedigree, background, campaign } = {}) {
  const rng = makeRng(seed);
  const campaignDef = campaign ? getCampaign(campaign) : null;
  if (campaign && !campaignDef) throw new Error(`unknown campaign: ${campaign}`);

  // A campaign fixes the origin entirely — only the name is the player's.
  const originOpts = campaignDef
    ? { seed: seed ^ 0x9e3779b9, ...campaignDef.origin }
    : { seed: seed ^ 0x9e3779b9, nation, secondNation, city, pedigree, background };

  const origin = makeOrigin(originOpts);

  // Name: an explicit full name wins; otherwise first/last can be set
  // independently over the campaign's base name (or the generated one).
  const legacy = campaignDef && campaignDef.defaultName ? campaignDef.defaultName.split(' ') : [];
  const baseFirst = campaignDef ? (campaignDef.defaultFirst || legacy[0]) : origin.name.split(' ')[0];
  const baseLast = campaignDef
    ? (campaignDef.defaultLast || legacy.slice(1).join(' '))
    : origin.name.split(' ').slice(1).join(' ');
  const displayName = name
    || `${firstName || baseFirst} ${lastName || baseLast}`.trim();
  origin.name = displayName;

  const game = {
    seed,
    origin,
    campaign: campaignDef ? campaignDef.id : null,
    campaignTitle: campaignDef ? campaignDef.title : null,
    club: campaignDef ? campaignDef.startingClub : null,
    name: displayName,
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
    memories: [],
    spokenCount: 0,
    silentCount: 0,
    skills: startSkills(origin),
    skillPoints: 0,
    skillHistory: [],
    randState: rng.state,
    finished: false,
  };
  return game;
}

export function currentChapter(game) {
  return CHAPTERS[game.chapter] ?? null;
}

/** Shared chapter scenes, hook-reactive scenes, plus any campaign scenes. */
export function sceneList(game) {
  const chapter = currentChapter(game);
  if (!chapter) return [];
  const hookScenes = HOOK_SCENES[game.chapter] || [];
  const campaignDef = game.campaign ? getCampaign(game.campaign) : null;
  const extra = (campaignDef && campaignDef.scenes && campaignDef.scenes[game.chapter]) || [];
  return chapter.scenes.concat(hookScenes, extra);
}

/** The scene the player is looking at, or null when the career is over. */
export function currentScene(game) {
  const list = sceneList(game);
  for (let i = game.scene; i < list.length; i++) {
    const scene = list[i];
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
  return scene.choices.map((choice, index) => {
    const skillOk = canAfford(game, choice.requires);
    const whisperOk = choice.whisper !== true || game.whispers > 0;
    const needs = choice.requires
      ? Object.entries(choice.requires).map(([k, v]) => `${k} ${v}`).join(', ')
      : null;
    return {
      index,
      label: typeof choice.label === 'function' ? choice.label(game) : choice.label,
      whisper: choice.whisper === true,
      requires: choice.requires || null,
      available: skillOk && whisperOk,
      lockedReason: !skillOk ? `needs ${needs}` : (!whisperOk ? 'No whispers left' : null),
    };
  });
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

  // A whisper can fail. Below 40 trust he may simply not hear you — the lower
  // the trust, the likelier it is that your one intervention is spent on nothing.
  let failed = false;
  if (choice.whisper) {
    const rng = makeRng(game.seed);
    rng.setState(game.randState);
    if (game.trust < 40) {
      const failChance = Math.min(0.6, (40 - game.trust) / 60);
      failed = rng() < failChance;
    }
    game.randState = rng.state;
  }

  const effects = failed ? {} : (typeof choice.effects === 'function' ? choice.effects(game) : (choice.effects || {}));
  for (const [key, delta] of Object.entries(effects)) {
    if (['trust', 'belief', 'conscience'].includes(key)) game[key] = clamp(game[key] + delta);
    else game.flags[key] = delta;
  }
  if (!failed && choice.flag) game.flags[choice.flag] = true;

  const note = failed
    ? 'He did not hear you. Whatever you said, it did not reach him, and the week decided itself.'
    : (typeof choice.log === 'function' ? choice.log(game) : (choice.log || choice.label));

  // Which long-tail flags this choice just set — surfaced as "he will remember".
  const flagIds = [];
  for (const key of Object.keys(effects)) {
    if (!['trust', 'belief', 'conscience'].includes(key)) flagIds.push(key);
  }
  if (!failed && choice.flag) flagIds.push(choice.flag);
  const remembered = failed ? [] : [...new Set(flagIds)].filter((id) => !String(id).startsWith('seen:'));

  const entry = {
    chapter: game.chapter + 1,
    chapterTitle: currentChapter(game).title,
    age: game.age,
    scene: scene.id,
    said: choice.whisper ? (typeof choice.say === 'function' ? choice.say(game) : choice.label) : null,
    choice: choice.label,
    note,
    remembered,
    failed,
    trust: game.trust,
    belief: game.belief,
    conscience: game.conscience,
  };
  game.log.push(entry);

  for (const id of remembered) {
    game.memories.push({ id, age: game.age, chapter: game.chapter + 1, note });
  }

  game.scene += 1;
  return entry;
}

/** Move to the next chapter, refreshing whispers and ageing the character. */
export function advanceChapter(game) {
  // Finishing a chapter is a season of work: it pays out training points.
  const pointsAwarded = game.chapter < CHAPTERS.length ? awardPoints(game) : 0;

  game.chapter += 1;
  const chapter = currentChapter(game);
  if (!chapter) {
    game.finished = true;
    return { finished: true, pointsAwarded };
  }
  game.age = chapter.ageStart;
  game.whispers = WHISPERS_PER_CHAPTER;
  game.scene = 0;
  return { finished: false, chapter, pointsAwarded };
}

export function isFinished(game) {
  return game.finished === true;
}

/** Everything he is carrying: one entry per long-tail flag a choice set. */
export function memories(game) {
  return Array.isArray(game.memories) ? game.memories.slice() : [];
}

export function biography(game) {
  return writeBiography(game);
}

export function epilogue(game) {
  return writeEpilogue(game);
}
