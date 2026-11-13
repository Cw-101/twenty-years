/**
 * Authored campaigns — the "pre-done career" mode.
 *
 * A campaign fixes the origin (nation, city, pedigree, family situation, hooks),
 * the starting club, and adds its own scenes on top of the shared chapters. The
 * player sets only the name. The point is depth: these scenes can reference the
 * player's family and history because they know what it is.
 *
 * Structure: `scenes` is keyed by chapter index, and appended after the shared
 * scenes for that chapter, so a campaign is additive — it never has to
 * reimplement the whole arc.
 */

export const CAMPAIGNS = {
  valley: {
    id: 'valley',
    title: 'The Valley',
    nation: 'Wales',
    blurb: 'Merthyr Tydfil, a grandfather with a whistle, and an academy offer from over the border. Fixed path; the choices are still yours.',
    defaultFirst: 'Dafydd',
    defaultLast: 'Llewellyn',
    startingClub: 'Cardiff Academy',
    origin: {
      nation: 'Wales',
      city: 'Merthyr Tydfil',
      pedigree: 'nonleague',
      background: 'working',
      hooks: ['grandadCoach', 'debt', 'thinConfidence'],
    },
    scenes: {
      // chapter 1 — the car park, and what the grandfather wants
      0: [
        {
          id: 'car-park',
          text: (g) => `Every Sunday until he was fourteen, his grandfather stood in the corner of a supermarket car park with a whistle and a bag of balls, shouting at him to use his left foot.\n\nNow the academy letter is on the table and the old man has not said a word about it. He is outside, sitting in the car, engine off.`,
          choices: [
            {
              label: 'Tell him to go and sit with his grandfather.',
              whisper: true,
              effects: { trust: +5, conscience: +3, belief: +2 },
              flag: 'satWithGrandad',
              log: 'He sat in the car for an hour. Neither of them said much. It helped.',
            },
            {
              label: 'Tell him the old man is jealous, and to ignore it.',
              whisper: true,
              effects: { belief: +3, conscience: -4, trust: -2 },
              log: 'He ignored his grandfather. The old man stopped coming to watch.',
            },
            { label: 'Say nothing. Some things are not yours.', effects: { conscience: -1 }, log: 'Nobody spoke to the old man. He drove home alone.' },
          ],
        },
      ],

      // chapter 2 — the international choice, made local and specific
      1: [
        {
          id: 'the-flag',
          if: () => true,
          text: (g) => `Wales want him for the under-21s. England have also written, because of a grandmother and a school he attended for two years.\n\nHis grandfather has an opinion about this. So does his agent, who has never been to Merthyr.`,
          choices: [
            {
              label: 'Tell him to wear the red shirt.',
              whisper: true,
              effects: { conscience: +4, belief: +4, trust: +3 },
              flag: 'choseHomeNation',
              log: 'He chose Wales. His grandfather wore a tie to the first match.',
            },
            {
              label: 'Tell him to pick England — better career.',
              whisper: true,
              effects: { belief: +6, conscience: -4, trust: -3 },
              flag: 'choseSecondNation',
              log: 'He chose England. The valley did not forgive it for years.',
            },
            { label: 'Stay out of it. It is his family.', effects: { conscience: -1 }, flag: 'delayedNation', log: 'He took weeks over it and chose in private.' },
          ],
        },
      ],

      // chapter 3 — the knee, and the family money
      2: [
        {
          id: 'the-money',
          text: (g) => `The injury has stopped the wage. The family borrowed for the boots, the petrol and the coach fares, and the total has never been said out loud.\n\nA club in the Gulf will pay four times what he was on to sit on a bench and be forgotten.`,
          choices: [
            {
              label: 'Tell him to take the money. Family first.',
              whisper: true,
              effects: { conscience: +5, trust: +4, belief: -2 },
              flag: 'tookMoney',
              log: 'He took the Gulf money. The debt went away. So did the career he had planned.',
            },
            {
              label: 'Tell him to stay and fight for his place.',
              whisper: true,
              effects: { belief: +5, conscience: -2 },
              flag: 'stayedAndFought',
              log: 'He stayed. The family borrowed for another year.',
            },
            { label: 'Say nothing. He knows the numbers better than you.', effects: {}, log: 'He decided alone, and never told you which way.' },
          ],
        },
      ],

      // chapter 5 — coming home
      5: [
        {
          id: 'the-return',
          text: (g) => `The last contract is finished. He is thirty-six and there is a car park in Merthyr where his grandfather used to stand with a whistle.\n\nThe old man died four years ago. The car park is still there.`,
          choices: [
            {
              label: 'Tell him to go and stand in it.',
              whisper: true,
              effects: { belief: +5, conscience: +3 },
              flag: 'wentHome',
              log: 'He stood in the car park for twenty minutes, then drove home.',
            },
            {
              label: 'Tell him to leave it in the past.',
              whisper: true,
              effects: { belief: -2, conscience: -2 },
              log: 'He never went back. He says he does not think about it.',
            },
            { label: 'Say nothing.', effects: {}, log: 'He went, alone, and told nobody.' },
          ],
        },
      ],
    },
  },
  hkderby: {
    id: 'hkderby',
    title: 'The Other Side of the World',
    nation: 'Hong Kong',
    blurb: 'Born in Derby to a family that came out of Guangdong by way of Hong Kong. In the Derby academy since he was eight, and asked by two places to decide what he is.',
    defaultFirst: 'Jintao',
    defaultLast: 'Lu',
    startingClub: 'Derby County Academy',
    origin: {
      nation: 'Hong Kong',
      secondNation: null,
      city: 'Derby',
      pedigree: 'academy',
      background: 'immigrant',
      hooks: ['derbyBorn', 'hkFamily', 'twoLanguages'],
    },
    scenes: {
      // chapter 1 — the name, the crowd, the first home start
      0: [
        {
          id: 'the-name',
          text: (g) => `First home start. The teamsheet has his name on it in capitals — ${g.name.toUpperCase()} — and the announcer takes a run at it, gets the tone wrong, and half of Pride Park repeats the mistake back at him as though it were his own idea.\n\nAt home the name has three syllables and a shape his grandmother gave it in Cantonese. At school it was shortened by a teacher in 2011 and never recovered. Now there is a fourth version, belonging to a stadium.\n\nHis father is in the East Stand with a flask, and he has heard all four.\n\nThe ball is at the feet of a boy who does not yet know which one he is.`,
          choices: [
            {
              label: 'Tell him to correct it, publicly, after the match.',
              whisper: true,
              effects: { belief: +6, conscience: +3, trust: +3 },
              flag: 'correctedName',
              log: 'He said it, slowly, into a microphone. The club printed it correctly ever after.',
            },
            {
              label: 'Tell him it is only a name — let it go.',
              whisper: true,
              effects: { belief: -3, conscience: -3 },
              flag: 'swallowedName',
              log: 'He let it go. It grated for years and he never said why.',
            },
            { label: 'Say nothing. Read the crowd.', effects: {}, flag: 'swallowedName', log: 'He let it go. His father said nothing on the way home.' },
          ],
        },
        {
          id: 'the-sunday-call',
          text: (g) => `His grandmother rings from Sham Shui Po, as she does every Sunday. This time she is in a hospital bed and the fan is off and the room sounds wrong.\n\nThere is a play-off semi-final on Friday, and the manager has already used the word "rotation".`,
          choices: [
            {
              label: 'Tell him to get on the plane.',
              whisper: true,
              effects: { conscience: +8, trust: +5, belief: -2 },
              flag: 'flewToHongKong',
              log: 'He flew on the Tuesday and missed the semi-final. His grandmother knew who he was.',
            },
            {
              label: 'Tell him to play the semi-final first.',
              whisper: true,
              effects: { belief: +4, conscience: -6 },
              flag: 'stayedForPlayoff',
              log: 'He stayed and won the semi-final. He has never watched the recording.',
            },
            { label: 'Say nothing. This is not a football decision.', effects: { conscience: -2 }, flag: 'stayedForPlayoff', log: 'He stayed. The club never knew the reason for his face that week.' },
          ],
        },
      ],

      // chapter 2 — first team, the federations
      1: [
        {
          id: 'two-federations-campaign',
          text: (g) => `Hong Kong call him up for a friendly at the Hong Kong Stadium. England have asked a question about his eligibility in the same fortnight, through a man who has never been to Derby.\n\nHis grandmother is watching on a phone. His manager says "decide for your career".`,
          choices: [
            {
              label: (g) => 'Tell him to wear Hong Kong.',
              whisper: true,
              effects: { conscience: +6, belief: +5, trust: +3 },
              flag: 'choseHomeNation',
              log: 'He chose Hong Kong. The flight is thirteen hours and he slept on the floor of his grandmother\'s flat.',
            },
            {
              label: 'Tell him to take the England route.',
              whisper: true,
              effects: { belief: +7, conscience: -5, trust: -4 },
              flag: 'choseSecondNation',
              log: 'He chose England. Some of the family came round, eventually.',
            },
            { label: 'Let the family decide.', effects: { conscience: -1 }, flag: 'delayedNation', log: 'He let it drift. Both federations noticed.' },
          ],
        },
        {
          id: 'the-foreign-lad',
          text: (g) => `Derbyshire Live runs it under "the Hong Kong winger". ${g.name} was born in the Royal Derby Hospital and has a Derbyshire accent he is slightly embarrassed about.\n\nA section of the away end has a chant about it on Saturday.`,
          choices: [
            {
              label: 'Tell him to score on Saturday and say nothing.',
              whisper: true,
              effects: { belief: +6, conscience: +2 },
              flag: 'answeredWithGoals',
              log: 'He scored twice and walked past the away end without looking.',
            },
            {
              label: 'Tell him to speak to the press and explain.',
              whisper: true,
              effects: { conscience: +4, belief: +2 },
              flag: 'explainedHimself',
              log: 'He explained, patiently, where he was born. Half of them read it.',
            },
            { label: 'Say nothing. Let them be wrong.', effects: {}, flag: 'saidNothingAboutIt', log: 'He never answered it, and the chant stayed.' },
          ],
        },
      ],

      // chapter 5 — the body
      4: [
        {
          id: 'the-flat',
          text: (g) => `At thirty-three he is back in Sham Shui Po, in the flat with the fan, and his knees do not like the humidity.\n\nA club in the HK Premier League will have him, but it means being a foreigner in the place the family called home.`,
          choices: [
            {
              label: 'Tell him to take it. Finish the circle.',
              whisper: true,
              effects: { belief: +5, conscience: +4, trust: +2 },
              flag: 'finishedInHK',
              log: 'He signed in Hong Kong and played two seasons in front of his grandmother.',
            },
            {
              label: 'Tell him to go home to Derby.',
              whisper: true,
              effects: { belief: +3, conscience: +2 },
              flag: 'returnedToDerby',
              log: 'He went back to Derby, where he still is.',
            },
            { label: 'Say nothing.', effects: {}, flag: 'driftedAfterFootball', log: 'He did neither, for a while.' },
          ],
        },
      ],
    },
  },
};

export function getCampaign(id) {
  return CAMPAIGNS[id] || null;
}

export function listCampaigns() {
  return Object.values(CAMPAIGNS).map(({ id, title, blurb, nation }) => ({ id, title, blurb, nation }));
}
