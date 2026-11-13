/**
 * Origin generation — who the player is before the game starts.
 *
 * Three player-chosen bases (nationality, location, pedigree) plus everything
 * else drawn from the seed. Choices shape the difficulty curve rather than the
 * plot: a prodigy starts with hype and belief but no room to fail; a non-league
 * kid starts with nothing and time.
 *
 * Dual nationality is deliberately common, because it becomes a decision later:
 * at 21 the two countries come calling and he has to pick one.
 */
import { makeRng, pick, intBetween, chance } from './rng.js';
import { FLAVOUR } from './flavour.js';

export const NATIONS = {
  England: {
    first: ['Callum', 'Jude', 'Ollie', 'Reece', 'Mason', 'Dominic', 'Harvey', 'Kieran'],
    last: ['Whitmore', 'Ashworth', 'Belling', 'Hartley', 'Rowan', 'Sutcliffe', 'Doyle', 'Kemp'],
    cities: ['Leeds', 'Bristol', 'Newcastle', 'Croydon', 'Salford', 'Norwich'],
    flavour: 'rain on the training pitches, scouts in anoraks, and a pathway that eats sixteen-year-olds',
  },
  Brazil: {
    first: ['Vinícius', 'Gabriel', 'Lucas', 'Matheus', 'Pedro', 'Rafael', 'Thiago', 'João'],
    last: ['Rocha', 'Barbosa', 'Nascimento', 'Oliveira', 'Cardoso', 'Ribeiro', 'Almeida', 'Moraes'],
    cities: ['São Paulo', 'Salvador', 'Porto Alegre', 'Recife', 'Belo Horizonte', 'Curitiba'],
    flavour: 'futsal courts, bare feet, and a country that has produced this story ten thousand times',
  },
  Portugal: {
    first: ['Rúben', 'Diogo', 'Tiago', 'Gonçalo', 'André', 'Nuno', 'Bernardo', 'Vasco'],
    last: ['Ferreira', 'Costa', 'Moutinho', 'Almeida', 'Sousa', 'Carvalho', 'Neves', 'Teixeira'],
    cities: ['Porto', 'Braga', 'Setúbal', 'Coimbra', 'Faro', 'Aveiro'],
    flavour: 'seafront pitches, a small country with a habit of exporting its best, and an old fear of being forgotten',
  },
  Nigeria: {
    first: ['Ade', 'Chidi', 'Emeka', 'Tunde', 'Ifeanyi', 'Kelechi', 'Segun', 'Obi'],
    last: ['Okafor', 'Adeyemi', 'Mensah', 'Balogun', 'Eze', 'Okonkwo', 'Adebayo', 'Nwosu'],
    cities: ['Lagos', 'Enugu', 'Ibadan', 'Port Harcourt', 'Kano', 'Benin City'],
    flavour: 'dust, noise, and a talent pool so deep that being good is not yet the same as being seen',
  },
  Japan: {
    first: ['Haruto', 'Ren', 'Sota', 'Kaito', 'Yuki', 'Riku', 'Daiki', 'Sho'],
    last: ['Tanaka', 'Sato', 'Kobayashi', 'Watanabe', 'Ito', 'Nakamura', 'Yamamoto', 'Kondo'],
    cities: ['Osaka', 'Yokohama', 'Sapporo', 'Nagoya', 'Fukuoka', 'Sendai'],
    flavour: 'high-school tournaments on television, brutal training camps, and a country still arguing about whether it belongs',
  },
  Spain: {
    first: ['Mateo', 'Álvaro', 'Iker', 'Hugo', 'Sergio', 'Pablo', 'Nico', 'Adrián'],
    last: ['Vargas', 'Serrano', 'Iglesias', 'Cabrera', 'Delgado', 'Reyes', 'Molina', 'Cano'],
    cities: ['Seville', 'Bilbao', 'Valencia', 'Zaragoza', 'Málaga', 'Vigo'],
    flavour: 'concrete pitches under a hard sun, and a style of play that either fits him or does not',
  },
};

export const PEDIGREES = {
  prodigy: {
    label: 'Prodigy at a giant',
    hype: 88,
    tier: 1,
    wage: 2.4,
    belief: 72,
    expectation: 'everyone in the building already knows your name',
    scrutiny: true,
    flavour: 'A first-team debut at seventeen, a photograph on the wall, and a contract that assumes you will not fail.',
  },
  academy: {
    label: 'Academy at a mid club',
    hype: 55,
    tier: 2,
    wage: 0.9,
    belief: 58,
    expectation: 'the coaches rate you, the crowd has never heard of you',
    scrutiny: false,
    flavour: 'A tidy academy, a realistic pathway, and a manager who will give you fifteen minutes if you earn them.',
  },
  nonleague: {
    label: 'Non-league, searching',
    hype: 20,
    tier: 4,
    wage: 0.35,
    belief: 45,
    expectation: 'nobody is watching, which is either freedom or a warning',
    scrutiny: false,
    flavour: 'A pitch with a slope, a manager who works weekdays, and a bus to away games that leaves at eight.',
  },
  lateloomer: {
    label: 'Late developer',
    hype: 32,
    tier: 3,
    wage: 0.6,
    belief: 48,
    expectation: 'you are older than the other prospects and nobody has decided about you yet',
    scrutiny: false,
    flavour: 'Released at fifteen and picked up at eighteen — the body arrived late and nobody is sure what to do with it.',
  },
  emigrant: {
    label: 'Moved abroad young',
    hype: 62,
    tier: 2,
    wage: 1.2,
    belief: 52,
    expectation: 'a long way from home, and nobody here can read your face',
    scrutiny: false,
    flavour: 'A move at fifteen to a country where the football is faster, the language is not yours, and the phone calls home get shorter.',
  },
};

const BACKGROUNDS = [
  { id: 'working', label: 'Working-class household', note: 'The money matters from the first contract.' },
  { id: 'comfortable', label: 'Comfortable family', note: 'There is something to fall back on, which changes what risk means.' },
  { id: 'single-parent', label: 'Raised by one parent', note: 'The parent is the loudest voice in the room, apart from you.' },
  { id: 'large-family', label: 'One of five children', note: 'You are not the only person in this family with needs.' },
  { id: 'immigrant', label: 'Parents came from somewhere else', note: 'Two countries are watching, and they do not agree.' },
];

/** Build an origin. Any field may be supplied; everything else is drawn. */
export function makeOrigin({ seed = Date.now(), nation, secondNation, city, pedigree, background } = {}) {
  const rng = makeRng(seed);
  const nationKeys = Object.keys(NATIONS);
  const chosenNation = nation && NATIONS[nation] ? nation : pick(rng, nationKeys);

  // dual nationality: common on purpose, because it becomes a later decision
  let dual = secondNation;
  if (dual === undefined) {
    dual = chance(rng, 0.45) ? pick(rng, nationKeys.filter((n) => n !== chosenNation)) : null;
  }
  if (dual === chosenNation) dual = null;

  const cityList = NATIONS[chosenNation].cities;
  const chosenCity = city && cityList.includes(city) ? city : pick(rng, cityList);

  const pedKey = pedigree && PEDIGREES[pedigree] ? pedigree : pick(rng, Object.keys(PEDIGREES));
  const ped = PEDIGREES[pedKey];

  const bg = background ? BACKGROUNDS.find((b) => b.id === background) || pick(rng, BACKGROUNDS) : pick(rng, BACKGROUNDS);

  const namePool = NATIONS[chosenNation];
  const name = `${pick(rng, namePool.first)} ${pick(rng, namePool.last)}`;

  // Pre-generated prose from the local model, when a line exists for this pair.
  // Falls back to the hand-written template so a partial flavour file is safe.
  const aiFlavour = FLAVOUR[`${chosenNation}.${pedKey}`];

  return {
    nation: chosenNation,
    secondNation: dual,
    city: chosenCity,
    pedigree: pedKey,
    pedigreeLabel: ped.label,
    pedigreeFlavour: aiFlavour || ped.flavour,
    background: bg.id,
    backgroundLabel: bg.label,
    backgroundNote: bg.note,
    hype: ped.hype,
    expectation: ped.expectation,
    scrutiny: ped.scrutiny,
    name,
    // what the start does to the numbers
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

/** Human-readable summary for the setup screen and the CLI. */
export function describeOrigin(origin) {
  const dual = origin.secondNation ? ` · dual nationality (${origin.secondNation})` : '';
  return `${origin.name} — ${origin.city}, ${origin.nation}${dual}\n${origin.pedigreeLabel} · ${origin.backgroundLabel}\n${origin.expectation}`;
}
