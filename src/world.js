/**
 * The world around the player: clubs, rivals, press, places, weather.
 *
 * Kept separate from story text so a scene can ask "give me a local press line"
 * instead of hard-coding one. This is what makes the game feel like it is set
 * somewhere rather than happening in a void.
 */

export const CLUBS = {
  derby: {
    name: 'Derby County',
    short: 'Derby',
    ground: 'Pride Park',
    nick: 'the Rams',
    city: 'Derby',
    tier: 2,
    rivals: ['Nottingham Forest', 'Leicester City', 'Burton Albion'],
    chant: 'We are Derby, super Derby',
    press: 'Derbyshire Live',
    texture: 'the A52 on a Tuesday night, the Derwent running high, the Peaks grey on the horizon',
  },
  forest: {
    name: 'Nottingham Forest',
    short: 'Forest',
    ground: 'the City Ground',
    nick: 'the Tricky Trees',
    city: 'Nottingham',
    tier: 1,
    rivals: ['Derby County', 'Leicester City'],
    chant: 'You never beat the Forest',
    press: 'Nottingham Post',
    texture: 'two bridges over the Trent and a rivalry older than anyone in the dressing room',
  },
  leicester: {
    name: 'Leicester City',
    short: 'Leicester',
    ground: 'the King Power',
    nick: 'the Foxes',
    city: 'Leicester',
    tier: 1,
    rivals: ['Derby County', 'Nottingham Forest'],
    chant: 'When you are smiling',
    press: 'Leicester Mercury',
    texture: 'the M1, a golden era nobody under thirty can quite believe happened',
  },
  burton: {
    name: 'Burton Albion',
    short: 'Burton',
    ground: 'the Pirelli',
    city: 'Burton upon Trent',
    tier: 3,
    rivals: ['Derby County'],
    chant: 'Brewers, Brewers',
    press: 'Burton Mail',
    texture: 'a brewery smell over the pitch and a ground that holds four thousand on a good day',
  },
  hk: {
    name: 'Hong Kong',
    short: 'HK',
    ground: 'Hong Kong Stadium',
    city: 'Hong Kong',
    tier: 3,
    rivals: [],
    chant: 'Hong Kong, Hong Kong',
    press: 'South China Morning Post',
    texture: 'humidity, neon, the Peak in the clouds, and a city that argues about whether it is a football place at all',
  },
};

export const PLACES = {
  derby: [
    'the Eagle Market on a Saturday',
    'the bus station steps',
    'a chippy on Normanton Road',
    'the Derwent path behind the ground',
    'the crown of the A52 at rush hour',
    'Allestree, where the parents have driveways',
  ],
  hongkong: [
    'a dai pai dong in Sham Shui Po',
    'the tram to Happy Valley',
    'a rooftop pitch in Mong Kok',
    'the MTR at eight in the morning',
    'a grandmother\'s flat with the fan on',
  ],
};

/**
 * Terrace and pub colour. Hand-written deliberately: the local 8B was asked for
 * this and returned poetic fragments with no chants and no pub talk, so the
 * texture stays authored. Generated prose earns its place in atmosphere, not in
 * dialogue that has to sound like people.
 */
export const TERRACE = {
  chants: [
    'We are Derby, super Derby',
    'Come on you Rams',
    'Red and white army',
    'You are going home in a Derbyshire ambulance',
  ],
  press: [
    'Rams youngster has the city talking',
    'Academy graduate hands Derby a decision to make',
    'A quiet lad with a loud left foot',
    'Derby boss refuses to be drawn on the interest',
    'Pride Park finally has something to be pleased about',
  ],
  pub: [
    '"He is too small, that one."',
    '"Too small, and he will still be the best player on the pitch."',
    '"My dad had a season ticket in the old ground and he says the same about every generation."',
    '"Forest will come in for him, you watch."',
    '"He is one of ours, though. That counts for something round here."',
  ],
};

export const PRESS_ANGLES = [
  (g) => `${g.name}: the local lad the big clubs keep asking about`,
  (g) => `Derby\'s ${g.age}-year-old has "a decision to make", sources say`,
  (g) => `The academy graduate nobody in the Championship wants to play against`,
  (g) => `${g.name} and the question the club will not answer`,
];


/**
 * What the city currently thinks of him.
 *
 * Not a stat — a sentence. It reads flags rather than numbers wherever it can,
 * because a rumour about tablets is more interesting than a conscience of 38.
 */
export function publicStory(game) {
  const f = game.flags || {};
  const conscience = game.conscience ?? 65;
  const trust = game.trust ?? 55;

  if (f.tookPills && !f.frontedUp) {
    return { mood: 'rumour', line: 'There is a story about the knee that nobody has printed yet.' };
  }
  if (f.deniedScandal) {
    return { mood: 'doubt', line: 'The papers have moved on. The people in the pub have not.' };
  }
  if (f.mentoredKid) {
    return { mood: 'warmth', line: 'The academy lads talk about him more than the first team do.' };
  }
  if (f.refusedPills) {
    return { mood: 'uneasy', line: 'The physio who offered him the tablets has never once said a good word about him.' };
  }
  if (f.answeredBack) {
    return { mood: 'awkward', line: 'He answered back in his first season, and the dressing room has been deciding about him ever since.' };
  }
  if (f.tookCash) {
    return { mood: 'uneasy', line: 'The money came early. Nobody at the club can quite work out where it went.' };
  }
  if (f.smartClause) {
    return { mood: 'watching', line: 'His contract is, quietly, one of the better-negotiated in the division.' };
  }
  if (f.defusedRoom) {
    return { mood: 'warmth', line: 'The young lads in that building would run through a wall for him, and none of them can say exactly why.' };
  }
  if (f.quietWord) {
    return { mood: 'warmth', line: 'The young lads in that building trust him, and none of them can explain why.' };
  }
  if (f.honestInterview) {
    return { mood: 'warmth', line: 'The press like him, which in this city is worth more than a goal in October.' };
  }
  if (f.builtPersona) {
    return { mood: 'cold', line: 'Nobody at the training ground knows what he actually thinks about anything.' };
  }
  if (f.tookItAsTest) {
    return { mood: 'watching', line: 'The coaching staff say he treats every session like an audition. It is not entirely a compliment.' };
  }
  if (f.stayedInSchool) {
    return { mood: 'watching', line: 'He is the only one of that intake with a qualification, and he mentions it more than he means to.' };
  }
  if (conscience >= 75 && trust >= 60) {
    return { mood: 'beloved', line: 'The city has decided, without being asked, that he is one of theirs.' };
  }
  if (trust < 40) {
    return { mood: 'cold', line: 'He plays well and says nothing. Nobody knows what he is thinking.' };
  }
  if (f.stayedLoyal) {
    return { mood: 'steady', line: 'He could have gone. He did not, and people remember that sort of thing here.' };
  }
  if (f.tookBigMove) {
    return { mood: 'divided', line: 'Half the ground still sings for him. The other half has stopped bothering.' };
  }
  return { mood: 'watching', line: 'A local lad, so far. That can change in a fortnight either way.' };
}

/** A chant the ground uses for him, stable within a career. */
export function chantFor(game) {
  const chants = TERRACE.chants;
  return chants[(game.seed + (game.chapter || 0)) % chants.length];
}

/** A line of local colour for the club he is at, or the city he is from. */
export function clubColour(game, which = 'derby') {
  const club = CLUBS[which] || CLUBS.derby;
  return club.texture;
}

export function localPlace(which = 'derby', rngValue = 0) {
  const list = PLACES[which] || PLACES.derby;
  return list[Math.floor(rngValue * list.length) % list.length];
}

export function pressLine(game) {
  const fn = PRESS_ANGLES[(game.age + (game.chapter || 0)) % PRESS_ANGLES.length];
  return fn(game);
}

/** A rival, weighted to whoever is closest in the table. */
export function rivalOf(clubKey = 'derby') {
  const club = CLUBS[clubKey] || CLUBS.derby;
  return club.rivals.length ? club.rivals[0] : 'no one in particular';
}

export function worldLine(game) {
  const parts = [];
  if (game.origin && game.origin.nation === 'Hong Kong') {
    parts.push(`${localPlace('hongkong', (game.age % 5) / 5)} — the other half of a family he has mostly met through a phone screen`);
  } else {
    parts.push(localPlace('derby', (game.age % 6) / 6));
  }
  return parts.join('; ');
}
