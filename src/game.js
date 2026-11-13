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
import { startSkills, awardPoints, canAfford, personalityModifier, normaliseAllocation, suggestedAllocation } from './skills.js';
import {
  APPROACHES, check, describeCheck, DC_NORMAL, DC_HARD,
  MATCH_ATTRIBUTE, SOCIAL_AXIS,
} from './dice.js';
import { resolveCast, witnessLine } from './cast.js';

const clamp = (n, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export const WHISPERS_PER_CHAPTER = 3;   // legacy, kept for old saves
export const INSPIRATION_PER_CHAPTER = 3;

/** Which approach an option represents: stated, read from its wording, or by position. */
/** Reading order: the first option is usually the direct one, then the patient, then the honest. */
const POSITION_APPROACH = ['bold', 'careful', 'honest', 'graft', 'craft'];

const APPROACH_HINTS = [
  [/\b(say nothing|stay out of it|not (his|your) (fight|room)|silence|keep out)\b/i, 'careful'],
  [/\b(truth|honest|admit|front up|tell him the truth|explain|apolog|be honest)\b/i, 'honest'],
  [/\b(shout|demand|speak up|say something|answer back|fight|go at it|refuse|confront|say it out loud)\b/i, 'bold'],
  [/\b(train|work|learn|run|practice|graft|keep going|strap it|play through|recover)\b/i, 'graft'],
  [/\b(read|contract|clause|deal|negotiat|study|think it through|treat it as|plan)\b/i, 'craft'],
];

export function approachOf(scene, choice, index) {
  if (choice.approach) return choice.approach;
  if (choice.requires) {
    const [attr] = Object.keys(choice.requires);
    const match = Object.entries(APPROACHES).find(([, a]) => a.attribute === attr);
    if (match) return match[0];
  }
  const label = typeof choice.label === 'function' ? '' : String(choice.label || '');
  for (const [pattern, approach] of APPROACH_HINTS) {
    if (pattern.test(label)) return approach;
  }
  return POSITION_APPROACH[index % POSITION_APPROACH.length];
}

/** How hard this option is: a stated DC, or scaled by how far into the chapter it sits. */
export function dcOf(scene, choice) {
  if (typeof choice.dc === 'number') return choice.dc;
  if (choice.requires) return DC_HARD;
  return DC_NORMAL;
}

/**
 * Start a career.
 *
 * `nation`, `secondNation`, `city`, `pedigree` and `background` are the player's
 * chosen bases; anything omitted is drawn from the seed. The origin sets the
 * opening numbers (tier, wage, belief, reputation) but never the plot.
 */
export function newGame({ seed = Date.now(), name, firstName, lastName, nation, secondNation, city, pedigree, background, campaign, allocation } = {}) {
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
    cast: resolveCast((campaignDef && campaignDef.cast) || {}),
    campaignTitle: campaignDef ? campaignDef.title : null,
    club: campaignDef ? campaignDef.startingClub : null,
    name: displayName,
    nation: origin.nation,
    secondNation: origin.secondNation,
    chapter: 0,
    scene: 0,
    age: CHAPTERS[0].ageStart,
    whispers: WHISPERS_PER_CHAPTER,
    inspiration: INSPIRATION_PER_CHAPTER,
    stance: {},
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
    skills: startSkills(origin, allocation ? normaliseAllocation(allocation) : suggestedAllocation(origin)),
    skillsStart: null,   // filled in just below, so the profile can show growth
    skillPoints: 0,
    skillHistory: [],
    met: {},
    randState: rng.state,
    finished: false,
  };
  game.skillsStart = { ...game.skills };
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

/** Choices, each with the approach and check it will require. */
/** What a choice will roll against: a football stat or a personality axis. */
export function checkFor(game, scene, choice, index) {
  const approachKey = choice.approach || approachOf(scene, choice, index);
  const kind = scene.kind === 'match' || scene.kind === 'training' ? scene.kind : 'story';
  if (kind === 'story') {
    const axis = choice.axis || SOCIAL_AXIS[approachKey] || 'ego';
    return { kind, subject: axis, modifier: personalityModifier(game, axis) };
  }
  const attribute = choice.attribute || MATCH_ATTRIBUTE[approachKey] || 'composure';
  return { kind, subject: attribute, modifier: (game.skills ? game.skills[attribute] : 4) - 5 };
}

/** Remember that he has met somebody. Only met people appear in the profile. */
export function meet(game, key) {
  if (!key) return;
  game.met = game.met || {};
  if (game.met[key]) return;
  game.met[key] = { chapter: game.chapter + 1, age: game.age, order: Object.keys(game.met).length };
}

/**
 * Everybody the scene puts in the room, met on entry rather than on decision.
 * Returns the people who are new to him this scene, so the UI can announce them.
 */
export function enterScene(game, scene) {
  const before = new Set(Object.keys(game.met || {}));
  for (const key of (scene.meets || [])) meet(game, key);
  if (scene.witness) meet(game, scene.witness);
  return Object.keys(game.met || {}).filter((k) => !before.has(k));
}

/**
 * Everything the profile needs about one person: who they are, when he met
 * them, and every decision they were in the room for.
 */
export function personRecord(game, key) {
  const person = (game.cast || {})[key];
  if (!person) return null;
  const met = (game.met || {})[key] || null;
  const memories = (game.memories || []).filter((m) => m.witness === key);
  return {
    key,
    name: person.name,
    role: person.role,
    about: person.about || '',
    named: Boolean(person.named),
    met,
    memories,
    count: memories.length,
  };
}

/** Everyone he has met, oldest first. */
export function knownPeople(game) {
  const met = game.met || {};
  return Object.keys(met)
    .sort((a, b) => (met[a].order ?? 0) - (met[b].order ?? 0))
    .map((key) => personRecord(game, key))
    .filter(Boolean);
}

/** Topics already used in this scene. */
export function seenTopics(game, scene) {
  game.topics = game.topics || {};
  return game.topics[scene.id] || [];
}

/** The conversations still open in this scene, in order. */
export function availableTopics(game, scene) {
  if (!Array.isArray(scene.topics)) return [];
  const seen = seenTopics(game, scene);
  return scene.topics
    .map((topic, index) => ({ topic, index }))
    .filter(({ topic }) => {
      if (topic.if && !topic.if(game)) return false;
      if (topic.once !== false && seen.includes(topic.id)) return false;
      return true;
    })
    .map(({ topic, index }) => ({
      index,
      id: topic.id,
      label: typeof topic.label === 'function' ? topic.label(game) : topic.label,
    }));
}

/**
 * Talk to someone. Never rolls — this is how you learn what is going on.
 * Returns the prose it produced, or null if the topic was already used.
 */
export function learnTopic(game, scene, topicId) {
  const topic = (scene.topics || []).find((t) => t.id === topicId);
  if (!topic) return null;
  game.topics = game.topics || {};
  const seen = game.topics[scene.id] || [];
  if (topic.once !== false && seen.includes(topic.id)) return null;

  for (const key of (topic.cast || [])) meet(game, key);

  const text = typeof topic.text === 'function' ? topic.text(game) : topic.text;
  const effects = typeof topic.effects === 'function' ? topic.effects(game) : (topic.effects || {});
  for (const [key, delta] of Object.entries(effects)) {
    if (['trust', 'belief', 'conscience'].includes(key)) game[key] = clamp(game[key] + delta);
    else game.flags[key] = delta;
  }
  if (topic.flag) game.flags[topic.flag] = true;
  if (topic.once !== false) game.topics[scene.id] = [...seen, topic.id];

  game.learned = game.learned || [];
  game.learned.push({ scene: scene.id, topic: topic.id, age: game.age, chapter: game.chapter + 1 });

  return { id: topic.id, text, effects };
}

/** How much what he has found out helps the decision: +1 per thing, capped. */
export function insightBonus(game, scene) {
  const n = seenTopics(game, scene).length;
  return Math.min(3, n);
}

export function availableChoices(game, scene) {
  const insight = insightBonus(game, scene);
  return scene.choices.map((choice, index) => {
    const skillOk = canAfford(game, choice.requires);
    const approachKey = approachOf(scene, choice, index);
    const approach = APPROACHES[approachKey];
    const checkInfo = checkFor(game, scene, choice, index);
    const needs = choice.requires
      ? Object.entries(choice.requires).map(([k, v]) => `${k} ${v}`).join(', ')
      : null;
    return {
      index,
      label: typeof choice.label === 'function' ? choice.label(game) : choice.label,
      approach: approachKey,
      approachLabel: approach.label,
      kind: checkInfo.kind,
      attribute: checkInfo.subject,
      rolls: choice.roll !== false,
      dc: dcOf(scene, choice),
      modifier: checkInfo.modifier + (choice.roll === false ? 0 : insight),
      insight,
      requires: choice.requires || null,
      available: skillOk,
      lockedReason: skillOk ? null : `needs ${needs}`,
    };
  });
}

/** Deep copy of a career, so a roll can be undone and taken again. */
export function snapshot(game) {
  return JSON.parse(JSON.stringify(game));
}

export function restore(game, snap) {
  for (const key of Object.keys(game)) delete game[key];
  Object.assign(game, JSON.parse(JSON.stringify(snap)));
  return game;
}

/** Spend one inspiration to take a roll again. Returns true if it was spent. */
export function spendInspiration(game) {
  if (!game.inspiration || game.inspiration <= 0) return false;
  game.inspiration -= 1;
  return true;
}

/**
 * Pick a choice: roll d20 + attribute against the option's DC.
 *
 * Success applies the choice's effects and sets its flag. Failure applies its
 * `failEffects` (or a small default cost) and its `failLog`, and sets no flag —
 * the story remembers what he tried, but not always that it worked.
 *
 * Pass `advantage: true` to roll twice and keep the better — that is what
 * spending inspiration buys.
 */
export function choose(game, scene, index, { advantage = false } = {}) {
  const choice = scene.choices[index];
  if (!choice) throw new Error(`no choice ${index} on scene ${scene.id}`);

  const approachKey = approachOf(scene, choice, index);
  const dc = dcOf(scene, choice);
  const checkInfo = checkFor(game, scene, choice, index);
  const attribute = checkInfo.subject;

  const rolls = choice.roll !== false;
  const insight = rolls ? insightBonus(game, scene) : 0;
  const result = rolls
    ? check(game, attribute, dc, { advantage, modifier: checkInfo.modifier + insight })
    : {
        attribute, dc, mod: 0, rolls: [], natural: null, total: null,
        success: true, crit: false, fumble: false, advantage: false, noRoll: true,
      };
  const success = result.success;

  const raw = success
    ? (typeof choice.effects === 'function' ? choice.effects(game) : (choice.effects || {}))
    : (typeof choice.failEffects === 'function'
        ? choice.failEffects(game)
        : (choice.failEffects || { belief: -2 }));
  const effects = { ...raw };

  // a critical success is worth a little more of what the choice was reaching for
  if (result.crit) {
    for (const key of ['trust', 'belief', 'conscience']) {
      if (typeof effects[key] === 'number' && effects[key] > 0) effects[key] += 2;
    }
  }
  if (result.fumble) {
    for (const key of ['trust', 'belief', 'conscience']) {
      if (typeof effects[key] === 'number' && effects[key] > 0) effects[key] = 0;
    }
    effects.belief = Math.min(effects.belief ?? 0, -3);
  }

  for (const [key, delta] of Object.entries(effects)) {
    if (['trust', 'belief', 'conscience'].includes(key)) game[key] = clamp(game[key] + delta);
    else game.flags[key] = delta;
  }
  if (success && choice.flag) game.flags[choice.flag] = true;
  if (!success && choice.failFlag) game.flags[choice.failFlag] = true;

  // Which way he leaned, whatever the dice said — this is what personality reads.
  game.stance = game.stance || {};
  game.stance[approachKey] = (game.stance[approachKey] || 0) + 1;

  const DEFAULT_FAIL = {
    bold: 'He went at it too hard, and the room closed up around him.',
    careful: 'He waited a beat too long, and the moment went without him.',
    honest: 'He told the truth to the wrong face, and it cost him.',
    craft: 'He did the work properly and it still was not enough.',
    graft: 'He ran himself into the ground and the ball did not care.',
  };
  const note = success
    ? (typeof choice.log === 'function' ? choice.log(game) : (choice.log || choice.label))
    : (typeof choice.failLog === 'function'
        ? choice.failLog(game)
        : (choice.failLog || DEFAULT_FAIL[approachKey] || 'He went at it, and it did not come off.'));

  // Which long-tail flags this choice set — surfaced as "he will remember".
  const flagIds = [];
  for (const key of Object.keys(effects)) {
    if (!['trust', 'belief', 'conscience'].includes(key)) flagIds.push(key);
  }
  if (success && choice.flag) flagIds.push(choice.flag);
  if (!success && choice.failFlag) flagIds.push(choice.failFlag);
  const remembered = [...new Set(flagIds)].filter((id) => !String(id).startsWith('seen:'));

  // Who is in the room, and therefore who he now knows.
  for (const key of (choice.meets || scene.meets || [])) meet(game, key);

  // Who saw it. Explicit on the choice, else the scene's usual witness.
  const witnessKey = choice.witness || scene.witness || null;
  if (witnessKey) meet(game, witnessKey);
  const witness = witnessKey
    ? { key: witnessKey, line: witnessLine(game, witnessKey) }
    : null;

  const entry = {
    chapter: game.chapter + 1,
    chapterTitle: currentChapter(game).title,
    age: game.age,
    scene: scene.id,
    choice: typeof choice.label === 'function' ? choice.label(game) : choice.label,
    approach: approachKey,
    sceneKind: checkInfo.kind,
    attribute,
    insight,
    check: { ...result, text: describeCheck(result) },
    success,
    failed: !success,
    note,
    remembered,
    witness,
    trust: game.trust,
    belief: game.belief,
    conscience: game.conscience,
  };
  game.log.push(entry);

  for (const id of remembered) {
    game.memories.push({
      id, age: game.age, chapter: game.chapter + 1, note,
      witness: witness ? witness.key : null,
      witnessName: witness ? witness.line : null,
    });
  }

  // A person in the room remembers the attempt even when the dice said no.
  if (witnessKey && !remembered.length) {
    game.memories.push({
      id: `attempt:${scene.id}`, age: game.age, chapter: game.chapter + 1, note,
      witness: witnessKey, witnessName: witness.line, attempt: true,
    });
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
  game.inspiration = INSPIRATION_PER_CHAPTER;
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
