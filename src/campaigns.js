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
    defaultName: 'Dafydd Llewellyn',
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
};

export function getCampaign(id) {
  return CAMPAIGNS[id] || null;
}

export function listCampaigns() {
  return Object.values(CAMPAIGNS).map(({ id, title, blurb, nation }) => ({ id, title, blurb, nation }));
}
