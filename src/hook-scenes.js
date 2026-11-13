/**
 * Hook-reactive scenes.
 *
 * These only exist for careers that carry the matching hook, so two playthroughs
 * diverge in *shape* rather than just in phrasing. Keyed by chapter index and
 * appended after the shared scenes; the engine already skips scenes whose `if`
 * fails, so an unmatched scene costs nothing.
 *
 * Rules for writing these: the hook must be load-bearing — the scene should be
 * impossible for a player without that fact — and the silence option should be
 * genuinely tempting, not obviously worse.
 */

export const HOOK_SCENES = {
  // chapter 1 — first team, 19-22
  1: [
    {
      id: 'the-noise',
      if: (g) => g.origin.hooks.some((h) => h.id === 'deafEar'),
      text: (g) => `The manager screams an instruction from the touchline and ${g.name} does not turn. He never turns. The bench notices. By Tuesday the story is that he is arrogant.\n\nThe truth is simpler and he has never told anyone.`,
      choices: [
        {
          label: 'Tell the manager about his ear.',
          whisper: true,
          effects: { conscience: +5, trust: +4, belief: +2 },
          flag: 'toldAboutEar',
          log: 'He told the manager about his ear. The man was embarrassed and never shouted at him again.',
        },
        {
          label: 'Keep it quiet and learn to read lips.',
          whisper: true,
          effects: { belief: +4, conscience: -2, trust: -2 },
          flag: 'hidTheDeafness',
          log: 'He hid it and learned to watch mouths. It worked for years.',
        },
        { label: 'Stay out of it.', effects: { belief: -3 }, flag: 'hidTheDeafness', log: 'Nobody explained anything. The arrogance story stuck.' },
      ],
    },
    {
      id: 'the-praise',
      if: (g) => g.origin.hooks.some((h) => h.id === 'thinConfidence'),
      text: (g) => `The manager says it in front of everyone: "${g.name} was the best player on the pitch." It is the nicest thing anyone at the club has said to him.\n\nHe goes home and cannot sleep. He is convinced it was a warning.`,
      choices: [
        {
          label: 'It was true, and that he should say it to himself.',
          whisper: true,
          effects: { belief: +7, trust: +4 },
          flag: 'learnedToTakePraise',
          log: 'You taught him to repeat it to himself. He still does.',
        },
        {
          label: 'The manager is just managing him.',
          whisper: true,
          effects: { belief: -4, conscience: +2 },
          log: 'He decided the praise was management. He stopped trusting it entirely.',
        },
        { label: 'Say nothing. He will work it out.', effects: { belief: -3 }, log: 'He lay awake and decided it was a warning.' },
      ],
    },
    {
      id: 'the-words',
      if: (g) => g.origin.hooks.some((h) => h.id === 'stammer'),
      text: () => `First television interview. Live. The reporter asks an easy question and the stammer arrives before the answer does.\n\nThe producer is talking in his earpiece. The camera does not blink.`,
      choices: [
        {
          label: 'Slow down and finish the sentence.',
          whisper: true,
          effects: { belief: +5, trust: +4 },
          flag: 'ownedTheStammer',
          log: 'He slowed down and finished it. The clip was shared approvingly.',
        },
        {
          label: 'Say nothing and walk away.',
          whisper: true,
          effects: { belief: -2, conscience: +1 },
          flag: 'walkedFromInterview',
          log: 'He walked off. The press called it arrogance.',
        },
        { label: 'Say nothing.', effects: { belief: -5 }, log: 'He got through it in pieces. They used the worst four seconds.' },
      ],
    },
    {
      id: 'the-sunday-ritual',
      if: (g) => g.origin.hooks.some((h) => h.id === 'hkFamily'),
      text: (g) => `Every Sunday at nine, the call comes from Sham Shui Po. Today there is a session at ten and the manager has started noticing who is late.\n\n${g.name} takes the call in the car park with the engine running.`,
      choices: [
        {
          label: 'Take the call, every week, and tell the manager why.',
          whisper: true,
          effects: { conscience: +6, trust: +4 },
          flag: 'keptTheCall',
          log: 'He told the manager why Sundays matter. The manager moved the session to eleven.',
        },
        {
          label: 'Cut it short and get inside.',
          whisper: true,
          effects: { belief: +3, conscience: -5 },
          flag: 'cutTheCall',
          log: 'He cut the call to four minutes. His grandmother stopped asking questions.',
        },
        { label: 'Say nothing.', effects: { conscience: -2 }, flag: 'cutTheCall', log: 'He took it in the car park, hurried, and was still late.' },
      ],
    },
    {
      id: 'the-translator',
      if: (g) => g.origin.hooks.some((h) => h.id === 'twoLanguages'),
      text: (g) => `A new signing from Guangzhou speaks no English and the club have nobody. ${g.name} finds himself translating a medical, then a contract, then an argument about a flat.\n\nIt is not in his job description and it is taking his afternoons.`,
      choices: [
        {
          label: 'Keep doing it. The kid has nobody.',
          whisper: true,
          effects: { conscience: +7, trust: +3, belief: -2 },
          flag: 'becameTheTranslator',
          log: 'He translated everything for a season. The kid calls him brother.',
        },
        {
          label: 'Tell the club to hire someone.',
          whisper: true,
          effects: { conscience: +2, belief: +3 },
          flag: 'pushedItBack',
          log: 'He pushed it back to the club. It took them four months.',
        },
        { label: 'Say nothing.', effects: {}, log: 'He kept doing it and said nothing about the cost.' },
      ],
    },
  ],

  // chapter 2 — the knee, 23-26
  2: [
    {
      id: 'the-hospital-call',
      if: (g) => g.origin.hooks.some((h) => h.id === 'sisterIll'),
      text: () => `His sister is back in hospital. It is the third time this year. He is in the middle of rehabilitation and the club have said, gently, that absences are noticed.\n\nHe is already in the car park with the engine running.`,
      choices: [
        {
          label: 'Go. Whatever it costs.',
          whisper: true,
          effects: { conscience: +7, trust: +5, belief: -2 },
          flag: 'choseFamily',
          log: 'He went. He lost eight weeks of rehab and did not care.',
        },
        {
          label: 'The rehab is for her too.',
          whisper: true,
          effects: { belief: +3, conscience: -4, trust: -3 },
          flag: 'choseCareer',
          log: 'He stayed and trained. He never forgave himself for the Tuesday.',
        },
        { label: 'Say nothing. It is not your family.', effects: { conscience: -2 }, flag: 'choseCareer', log: 'He stayed, because nobody told him not to.' },
      ],
    },
    {
      id: 'the-red-mist',
      if: (g) => g.origin.hooks.some((h) => h.id === 'temper'),
      text: () => `A reserve-team opponent says something about his mother. The referee is twenty yards away. There is a moment — a real one — where his hand closes into a fist and the whole career hangs on the next two seconds.`,
      choices: [
        {
          label: 'Walk away right now.',
          whisper: true,
          effects: { conscience: +6, belief: +2 },
          flag: 'walkedAway',
          log: 'He walked away. It took everything he had.',
        },
        {
          label: 'Make it count — but on the pitch.',
          whisper: true,
          effects: { belief: +5, conscience: -2 },
          flag: 'answeredOnPitch',
          log: 'He scored twice and said nothing. It nearly went the other way.',
        },
        { label: 'Say nothing.', effects: { conscience: -5 }, flag: 'threwThePunch', log: 'He threw it. Six weeks, and a reputation he never shook.' },
      ],
    },
  ],

  // chapter 3 — the move, 27-31
  3: [
    {
      id: 'the-twin',
      if: (g) => g.origin.hooks.some((h) => h.id === 'twinReleased'),
      text: (g) => `The draw puts ${g.name} against his brother's club. His twin has spent eight years in the lower leagues, one bad knee and no luck, and today he is marking him.\n\nNeither of them has said a word about it all week.`,
      choices: [
        {
          label: 'Play his brother properly.',
          whisper: true,
          effects: { conscience: +5, belief: +3 },
          flag: 'playedItStraight',
          log: 'He played it straight. His brother respected it and it cost them both something.',
        },
        {
          label: 'Go easy — it is his brother.',
          whisper: true,
          effects: { conscience: -3, trust: +2 },
          flag: 'wentEasyOnTwin',
          log: 'He went easy. His brother knew, and hated it.',
        },
        { label: 'Say nothing.', effects: {}, log: 'They played each other like strangers. Afterwards they shook hands for a long time.' },
      ],
    },
    {
      id: 'the-paperwork',
      if: (g) => g.origin.hooks.some((h) => h.id === 'carer'),
      text: () => `The contract is forty pages and his parents cannot read the English in it. He is twenty-eight, he has done this for the family since he was sixteen, and tonight he is doing it again at the kitchen table with a pen.`,
      choices: [
        {
          label: 'Get a lawyer instead of doing it himself.',
          whisper: true,
          effects: { conscience: +4, belief: +3 },
          flag: 'gotLawyer',
          log: 'He hired someone. His father was quietly hurt and said nothing.',
        },
        {
          label: 'He is the only one who can protect them.',
          whisper: true,
          effects: { trust: +5, conscience: -2, belief: -3 },
          flag: 'carriedItAlone',
          log: 'He signed for all of them, again, alone, at the kitchen table.',
        },
        { label: 'Say nothing.', effects: {}, log: 'He did it himself, as always.' },
      ],
    },
    {
      id: 'the-father-call',
      if: (g) => g.origin.hooks.some((h) => h.id === 'fatherLeft'),
      text: (g) => `His father rings — the second of his two calls this year, but on the wrong date. He wants to talk about "opportunities". ${g.name} listens in the hallway for eleven minutes without saying much.`,
      choices: [
        {
          label: 'Say what he has never said.',
          whisper: true,
          effects: { conscience: +5, belief: +4 },
          flag: 'confrontedFather',
          log: 'He said it. His father hung up. He slept better than he had in years.',
        },
        {
          label: 'Keep the peace and lend the money.',
          whisper: true,
          effects: { conscience: -3, trust: -2 },
          flag: 'paidFather',
          log: 'He sent the money. It was the last time they spoke for a while.',
        },
        { label: 'Let him handle his father alone.', effects: { conscience: -1 }, flag: 'paidFather', log: 'He listened, agreed to nothing, and sent money anyway.' },
      ],
    },
    {
      id: 'the-derby-return',
      if: (g) => g.origin.hooks.some((h) => h.id === 'derbyBorn'),
      text: (g) => `The draw sends him back to Pride Park in the away dressing room. He knows which step in the tunnel is uneven. He knows the steward on the corner by name.\n\nThe home end sings the song he grew up singing.`,
      choices: [
        {
          label: 'Celebrate if he scores. He is allowed.',
          whisper: true,
          effects: { belief: +5, conscience: +2 },
          flag: 'celebratedAtDerby',
          log: 'He scored and did not celebrate, then cried in the coach. Worth it either way.',
        },
        {
          label: 'Keep his head down all afternoon.',
          whisper: true,
          effects: { conscience: +4, belief: -2 },
          flag: 'keptQuietAtDerby',
          log: 'He kept his head down. The home end applauded him anyway.',
        },
        { label: 'Say nothing. It is one match.', effects: {}, log: 'He played it like any other, and nobody believed him.' },
      ],
    },
  ],

  // chapter 4 — the body, 32-35
  4: [
    {
      id: 'the-superstition',
      if: (g) => g.origin.hooks.some((h) => h.id === 'superstitious'),
      text: () => `The physio has moved his boot bag. It has been in the same place on the same peg for fourteen years, and the boy who moved it is nineteen and did not know.\n\nHe cannot explain why this matters. He knows how it sounds.`,
      choices: [
        {
          label: 'Tell them, and let them laugh.',
          whisper: true,
          effects: { conscience: +3, belief: +3 },
          flag: 'ownedTheRitual',
          log: 'He told the squad why the bag matters. They laughed, then they respected it.',
        },
        {
          label: 'Grow up — he is thirty-two.',
          whisper: true,
          effects: { belief: -4, conscience: -2 },
          log: 'He told himself to grow up. Something small went out of him.',
        },
        { label: 'Say nothing.', effects: {}, log: 'He moved the bag back himself, quietly, and said nothing to anyone.' },
      ],
    },
    {
      id: 'the-funeral',
      if: (g) => g.origin.hooks.some((h) => h.id === 'grandadCoach'),
      text: () => `His grandfather dies on a Thursday. The car park where he used to stand with a whistle is now a click-and-collect bay with a yellow line painted through it.\n\nThe funeral is the same day as an away game.`,
      choices: [
        {
          label: 'There is no decision here.',
          whisper: true,
          effects: { conscience: +7, belief: +3, trust: +5 },
          flag: 'wentToFuneral',
          log: 'He went to the funeral and missed the game. Nobody at the club argued.',
        },
        {
          label: 'The old man would want him to play.',
          whisper: true,
          effects: { belief: +4, conscience: -4 },
          flag: 'playedInstead',
          log: 'He played, and scored, and did not celebrate.',
        },
        { label: 'Say nothing.', effects: { conscience: -3 }, flag: 'playedInstead', log: 'He played. He has never been sure he was right.' },
      ],
    },
  ],
};
