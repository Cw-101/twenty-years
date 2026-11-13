/**
 * Origin generation — who the player is before the game starts.
 *
 * Three player-chosen bases (nationality, location, pedigree) plus everything
 * else drawn from the seed: name, family background, and **hooks** — two or
 * three specific personal details (a deaf ear, an absent father, a twin who was
 * released) that later scenes and the biography weave in. Hooks are what stop
 * two careers reading the same without the player having to imagine anything.
 *
 * Nations are tiered: `main` nations are the ones that will get authored
 * campaigns and richer flavour; `extra` are procedural-only for now.
 */
import { makeRng, pick, chance } from './rng.js';
import { FLAVOUR } from './flavour.js';

/* ------------------------------------------------------------------ nations */

export const NATIONS = {
  England: {
    tier: 'main',
    first: ['Callum', 'Jude', 'Ollie', 'Reece', 'Mason', 'Dominic', 'Harvey', 'Kieran'],
    last: ['Whitmore', 'Ashworth', 'Belling', 'Hartley', 'Rowan', 'Sutcliffe', 'Doyle', 'Kemp'],
    cities: ['Leeds', 'Bristol', 'Newcastle', 'Croydon', 'Salford', 'Norwich'],
    textures: ['wet grass', 'terraced streets', 'scout anoraks', 'a bus that leaves at eight', 'floodlights on at four'],
    flavour: 'rain on the training pitches, scouts in anoraks, and a pathway that eats sixteen-year-olds',
  },
  Wales: {
    tier: 'main',
    first: ['Dafydd', 'Rhys', 'Iwan', 'Owain', 'Gethin', 'Aled', 'Tomos', 'Emyr'],
    last: ['Llewellyn', 'Prydderch', 'Vaughan', 'Morgan', 'Hopcyn', 'Bevan', 'Rees', 'Tudur'],
    cities: ['Merthyr Tydfil', 'Swansea', 'Wrexham', 'Aberystwyth', 'Caernarfon', 'Newport'],
    textures: ['a valley that holds the sound in', 'chapel light', 'a pitch cut into a hillside', 'two languages in one shout'],
    flavour: 'a hillside pitch, a language switch at the touchline, and a country that produces players it cannot keep',
  },
  Germany: {
    tier: 'main',
    first: ['Jonas', 'Lukas', 'Finn', 'Niklas', 'Emil', 'Max', 'Timo', 'Florian'],
    last: ['Brandt', 'Keller', 'Vogel', 'Hoffmann', 'Bauer', 'Wagner', 'Kruger', 'Sauer'],
    cities: ['Dortmund', 'Leipzig', 'Bremen', 'Stuttgart', 'Hamburg', 'Cologne'],
    textures: ['concrete under floodlights', 'a whistle at exactly six', 'cold air off the river', 'order that feels like pressure'],
    flavour: 'organised training, cold mornings, and an expectation that is polite and total',
  },
  Greece: {
    tier: 'main',
    first: ['Nikos', 'Giorgos', 'Dimitris', 'Kostas', 'Yiannis', 'Petros', 'Vasilis', 'Spiros'],
    last: ['Papadakis', 'Karagiannis', 'Stavrou', 'Dimitriou', 'Mavros', 'Vlachos', 'Rallis', 'Sotiris'],
    cities: ['Thessaloniki', 'Piraeus', 'Patras', 'Heraklion', 'Larissa', 'Volos'],
    textures: ['dust and cicadas', 'whitewash glare', 'a church bell at the wrong hour', 'heat that makes the ball heavy'],
    flavour: 'hard sun, an old club with old debts, and a country that remembers its one great summer',
  },
  Portugal: {
    tier: 'extra',
    first: ['Rúben', 'Diogo', 'Tiago', 'Gonçalo', 'André', 'Nuno', 'Bernardo', 'Vasco'],
    last: ['Ferreira', 'Costa', 'Moutinho', 'Almeida', 'Sousa', 'Carvalho', 'Neves', 'Teixeira'],
    cities: ['Porto', 'Braga', 'Setúbal', 'Coimbra', 'Faro', 'Aveiro'],
    textures: ['seafront wind', 'cobbles that hold heat', 'a small country listening', 'export as habit'],
    flavour: 'seafront pitches, a small country with a habit of exporting its best, and an old fear of being forgotten',
  },
  Spain: {
    tier: 'extra',
    first: ['Mateo', 'Álvaro', 'Iker', 'Hugo', 'Sergio', 'Pablo', 'Nico', 'Adrián'],
    last: ['Vargas', 'Serrano', 'Iglesias', 'Cabrera', 'Delgado', 'Reyes', 'Molina', 'Cano'],
    cities: ['Seville', 'Bilbao', 'Valencia', 'Zaragoza', 'Málaga', 'Vigo'],
    textures: ['concrete under a hard sun', 'a bar that never closes', 'clapping in rhythm', 'the smell of orange peel'],
    flavour: 'concrete pitches under a hard sun, and a style of play that either fits him or does not',
  },
  France: {
    tier: 'extra',
    first: ['Théo', 'Yanis', 'Karim', 'Léo', 'Mehdi', 'Gabin', 'Ousmane', 'Rémi'],
    last: ['Dupont', 'Benali', 'Laurent', 'Marchand', 'Rousseau', 'Sissoko', 'Girard', 'Traoré'],
    cities: ['Marseille', 'Lyon', 'Rennes', 'Lille', 'Toulouse', 'Saint-Étienne'],
    textures: ['banlieue concrete', 'a cage at dusk', 'three languages in one session', 'a stadium that wants an argument'],
    flavour: 'a banlieue pitch, a country that produces too many players at once, and a system that measures everything',
  },
  Italy: {
    tier: 'extra',
    first: ['Matteo', 'Lorenzo', 'Alessio', 'Davide', 'Simone', 'Andrea', 'Pietro', 'Marco'],
    last: ['Ricci', 'Conti', 'Marchetti', 'Fabbri', 'Greco', 'Moretti', 'Vitale', 'Sala'],
    cities: ['Naples', 'Bergamo', 'Turin', 'Bologna', 'Bari', 'Verona'],
    textures: ['an argument in the stands', 'a barista who knows the team', 'afternoon heat', 'a pitch with a history'],
    flavour: 'a region that thinks it owns football, a nonna who watches every match, and pressure that shows up as noise',
  },
  Japan: {
    tier: 'main',
    first: ['Haruto', 'Ren', 'Sota', 'Kaito', 'Yuki', 'Riku', 'Daiki', 'Sho'],
    last: ['Tanaka', 'Sato', 'Kobayashi', 'Watanabe', 'Ito', 'Nakamura', 'Yamamoto', 'Kondo'],
    cities: ['Osaka', 'Yokohama', 'Sapporo', 'Nagoya', 'Fukuoka', 'Sendai'],
    textures: ['a high-school tournament on television', 'training that starts on the minute', 'humidity', 'a quiet, total discipline'],
    flavour: 'high-school tournaments on television, brutal training camps, and a country still arguing about whether it belongs',
  },
  China: {
    tier: 'main',
    first: ['Wei', 'Chao', 'Jian', 'Hao', 'Lei', 'Ming', 'Tao', 'Jun'],
    last: ['Zhang', 'Wang', 'Liu', 'Chen', 'Zhao', 'Sun', 'Wu', 'Han'],
    cities: ['Shanghai', 'Dalian', 'Beijing', 'Guangzhou', 'Chengdu', 'Jinan'],
    textures: ['smog over a training ground', 'a thousand people at a junior match', 'neon and rain on the way home', 'an academy that costs the family'],
    flavour: 'huge crowds for junior matches, an academy treadmill that costs the family, and a country deciding what football is for',
  },
  'Hong Kong': {
    tier: 'main',
    first: ['Chun', 'Ka-ho', 'Wing', 'Ho', 'Tsz', 'Kin', 'Yat', 'Lok'],
    last: ['Chan', 'Wong', 'Lam', 'Cheung', 'Ng', 'Ho', 'Tsang', 'Yip'],
    cities: ['Sham Shui Po', 'Mong Kok', 'Sha Tin', 'Tsuen Wan', 'Kwun Tong', 'Aberdeen'],
    textures: ['humidity at six in the morning', 'neon on wet tarmac', 'a rooftop pitch between towers', 'the MTR at rush hour', 'a grandmother\'s fan turning'],
    flavour: 'a city of vertical pitches and neon, where football competes with everything else and mostly loses',
  },
};

export const MAIN_NATIONS = Object.keys(NATIONS).filter((n) => NATIONS[n].tier === 'main');

/* ----------------------------------------------------------------- pedigrees */

export const PEDIGREES = {
  prodigy: {
    label: 'Prodigy at a giant',
    hype: 88, tier: 1, wage: 2.4, belief: 72,
    expectation: 'everyone in the building already knows your name',
    scrutiny: true,
    flavour: 'A first-team debut at seventeen, a photograph on the wall, and a contract that assumes you will not fail.',
    traits: { professionalism: 12, ambition: 18, temperament: -6 },
  },
  academy: {
    label: 'Academy at a mid club',
    hype: 55, tier: 2, wage: 0.9, belief: 58,
    expectation: 'the coaches rate you, the crowd has never heard of you',
    scrutiny: false,
    flavour: 'A tidy academy, a realistic pathway, and a manager who will give you fifteen minutes if you earn them.',
    traits: { professionalism: 6, ambition: 4 },
  },
  nonleague: {
    label: 'Non-league, searching',
    hype: 20, tier: 4, wage: 0.35, belief: 45,
    expectation: 'nobody is watching, which is either freedom or a warning',
    scrutiny: false,
    flavour: 'A pitch with a slope, a manager who works weekdays, and a bus to away games that leaves at eight.',
    traits: { professionalism: -4, loyalty: 12, ambition: -6 },
  },
  lateloomer: {
    label: 'Late developer',
    hype: 32, tier: 3, wage: 0.6, belief: 48,
    expectation: 'you are older than the other prospects and nobody has decided about you yet',
    scrutiny: false,
    flavour: 'Released at fifteen and picked up at eighteen — the body arrived late and nobody is sure what to do with it.',
    traits: { temperament: 10, professionalism: 4, injuryProne: -8 },
  },
  emigrant: {
    label: 'Moved abroad young',
    hype: 62, tier: 2, wage: 1.2, belief: 52,
    expectation: 'a long way from home, and nobody here can read your face',
    scrutiny: false,
    flavour: 'A move at fifteen to a country where the football is faster, the language is not yours, and the phone calls home get shorter.',
    traits: { temperament: -8, loyalty: -6, ambition: 12 },
  },
};

/* --------------------------------------------------------------- backgrounds */

const BACKGROUNDS = [
  { id: 'working', label: 'Working-class household', note: 'The money matters from the first contract.' },
  { id: 'comfortable', label: 'Comfortable family', note: 'There is something to fall back on, which changes what risk means.' },
  { id: 'single-parent', label: 'Raised by one parent', note: 'The parent is the loudest voice in the room, apart from you.' },
  { id: 'large-family', label: 'One of five children', note: 'You are not the only person in this family with needs.' },
  { id: 'immigrant', label: 'Parents came from somewhere else', note: 'Two countries are watching, and they do not agree.' },
];

/* --------------------------------------------------------------------- hooks */

/**
 * Hooks are the antidote to generic prose: two or three specific facts pulled
 * into scene text and the biography. Tagged so scenes can ask for "a family
 * hook" rather than naming a specific one.
 */
export const HOOKS = [
  { id: 'fatherLeft', tag: 'family', text: 'His father left when he was nine and rings twice a year, always on the same date.' },
  { id: 'sisterIll', tag: 'family', text: 'His younger sister has been in and out of hospital since she was four, and he is the one who sits with her.' },
  { id: 'twinReleased', tag: 'family', text: 'He has a twin brother who was released the same week he was kept, and neither of them has said it out loud.' },
  { id: 'carer', tag: 'family', text: 'At sixteen he does all the family\'s paperwork, in a second language, without complaining.' },
  { id: 'grandadCoach', tag: 'family', text: 'His grandfather coached him on a car park until he was fourteen, with a whistle and no patience.' },
  { id: 'debt', tag: 'money', text: 'The family borrowed for boots, petrol and coach fares, and nobody has ever added up the total.' },
  { id: 'secondJob', tag: 'money', text: 'His mother works nights, and he knows exactly how much the first contract would change that.' },
  { id: 'deafEar', tag: 'body', text: 'He is deaf in one ear. Nobody at the club knows, and he turns his head to compensate.' },
  { id: 'stammer', tag: 'body', text: 'He has a stammer that disappears the moment the ball is at his feet.' },
  { id: 'temper', tag: 'mind', text: 'There is a temper in him that has not yet been seen at the club, but you have seen it.' },
  { id: 'thinConfidence', tag: 'mind', text: 'His confidence is a thin coat. Praise soaks straight through it and he needs more than he admits.' },
  { id: 'superstitious', tag: 'mind', text: 'He is superstitious in a way that looks funny from outside and is not funny to him.' },
  { id: 'hkFamily', tag: 'family', text: 'His grandmother in Sham Shui Po rings every Sunday and asks, in Cantonese, when he is coming home.' },
  { id: 'twoLanguages', tag: 'mind', text: 'He speaks Cantonese at home and English everywhere else, and thinks in a mixture of both that neither side quite owns.' },
  { id: 'derbyBorn', tag: 'family', text: 'He was born in Derby and has never lived in Hong Kong, and the family correct him about that more often than he would like.' },
];

function drawHooks(rng) {
  const family = HOOKS.filter((h) => h.tag === 'family');
  const others = HOOKS.filter((h) => h.tag !== 'family');
  const picked = [pick(rng, family)];
  const wanted = chance(rng, 0.5) ? 2 : 1;
  for (let i = 0; i < wanted; i++) {
    const candidate = pick(rng, others);
    if (!picked.some((p) => p.id === candidate.id)) picked.push(candidate);
  }
  return picked;
}

/** One hook line by tag, for scene text. Returns '' when none exists. */
export function hookLine(origin, tag, index = 0) {
  if (!origin || !Array.isArray(origin.hooks)) return '';
  const matches = origin.hooks.filter((h) => h.tag === tag);
  return matches[index] ? matches[index].text : '';
}

/* -------------------------------------------------------------------- origin */

export function makeOrigin({ seed = Date.now(), nation, secondNation, city, pedigree, background, hooks } = {}) {
  const rng = makeRng(seed);
  const nationKeys = Object.keys(NATIONS);
  const chosenNation = nation && NATIONS[nation] ? nation : pick(rng, nationKeys);

  let dual = secondNation;
  if (dual === undefined) {
    dual = chance(rng, 0.45) ? pick(rng, nationKeys.filter((n) => n !== chosenNation)) : null;
  }
  if (dual === chosenNation) dual = null;

  const cityList = NATIONS[chosenNation].cities;
  // An explicitly supplied city is honoured even if it is not in the nation's
  // list — diaspora careers are born somewhere else (Derby, in one case).
  const diaspora = Boolean(city) && !cityList.includes(city);
  const chosenCity = city ? String(city) : pick(rng, cityList);

  const pedKey = pedigree && PEDIGREES[pedigree] ? pedigree : pick(rng, Object.keys(PEDIGREES));
  const ped = PEDIGREES[pedKey];

  const bg = background ? BACKGROUNDS.find((b) => b.id === background) || pick(rng, BACKGROUNDS) : pick(rng, BACKGROUNDS);
  const namePool = NATIONS[chosenNation];
  const name = `${pick(rng, namePool.first)} ${pick(rng, namePool.last)}`;

  const chosenHooks = hooks ? HOOKS.filter((h) => hooks.includes(h.id)) : drawHooks(rng);

  // Pre-generated prose from the local model: an array of variants per pair,
  // so the same nation+pedigree does not always open the same way.
  const raw = FLAVOUR[`${chosenNation}.${pedKey}`];
  const variants = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  const aiFlavour = variants.length ? variants[Math.floor(rng() * variants.length)] : null;

  return {
    nation: chosenNation,
    nationTier: namePool.tier,
    secondNation: dual,
    city: chosenCity,
    diaspora,
    texture: pick(rng, namePool.textures),
    pedigree: pedKey,
    pedigreeLabel: ped.label,
    pedigreeFlavour: aiFlavour || ped.flavour,
    background: bg.id,
    backgroundLabel: bg.label,
    backgroundNote: bg.note,
    hooks: chosenHooks,
    hype: ped.hype,
    expectation: ped.expectation,
    scrutiny: ped.scrutiny,
    name,
    start: {
      tier: ped.tier,
      wage: ped.wage,
      belief: ped.belief,
      reputation: Math.round(ped.hype / 4),
      trust: 55,
    },
    randState: rng.state,
  };
}

export function describeOrigin(origin) {
  const dual = origin.secondNation ? ` · dual nationality (${origin.secondNation})` : '';
  return `${origin.name} — ${origin.city}, ${origin.nation}${dual}\n${origin.pedigreeLabel} · ${origin.backgroundLabel}\n${origin.expectation}`;
}
