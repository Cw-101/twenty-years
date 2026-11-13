/**
 * Story content. Data, not logic.
 *
 * A scene is shown when its `if` passes. Silence is always available and always
 * free; whisper choices cost one of the three whispers per chapter.
 *
 * Flags that matter downstream:
 *   wentWithBrother / brotherResent  → chapter 4 "the brother returns"
 *   hidInjury                        → chapter 3 severity, chapter 5 body
 *   tookPills                        → chapter 5 decline tone
 *   tookBigMove                      → chapter 4 loyalty, chapter 6 epilogue
 *   frontedUp / deniedScandal        → chapter 6 reputation lines
 *   mentoredKid                      → chapter 6 "what he became"
 */

export const CHAPTERS = [
  {
    id: 'trial',
    title: 'The Trial',
    ageStart: 16,
    ageEnd: 18,
    scenes: [
      {
        id: 'the-call',
        text: (g) => `The letter is on the kitchen table in ${g.origin.city} and ${g.name} has read it eleven times. He is sixteen, his boots are two sizes too big, and his hands will not stay still.\n\n${g.origin.expectation.charAt(0).toUpperCase() + g.origin.expectation.slice(1)}. He does not know anyone is listening yet.`,
        choices: [
          { label: 'Tell him he belongs there.', whisper: true, effects: { belief: +6, trust: +4 }, say: 'You belong there.', log: 'You told him he belonged. He slept.' },
          { label: 'Tell him to enjoy it, nothing more.', whisper: true, effects: { belief: +2, conscience: +2 }, say: 'Just enjoy it.', log: 'You told him to enjoy it.' },
          { label: 'Say nothing. Let him feel it.', effects: { belief: -2 }, log: 'You said nothing. He barely slept.' },
        ],
      },
      {
        id: 'the-coach',
        text: () => `Day one. The coach stops the session to tell everyone within earshot that the new lad runs "like he's carrying a wardrobe". Two of the older boys laugh. He does not look up from his boots.`,
        choices: [
          { label: 'Tell him the coach is testing whether he folds.', whisper: true, effects: { belief: +5, trust: +3 }, say: 'He is testing you. Do not fold.', log: 'You told him it was a test. He scored twice after.' },
          { label: 'Tell him to answer back.', whisper: true, effects: { conscience: -3, belief: +3 }, say: 'Say something back.', log: 'He answered back. The coach liked it. His teammates did not.' },
          { label: 'Stay quiet. He should find his own way.', effects: { belief: -3 }, log: 'He took it in silence and did not touch the ball again.' },
        ],
      },
      {
        id: 'the-brother',
        text: () => `Saturday. His brother is outside in the car with two friends, engine running. There is a party two towns over, and one more session to go. His brother leans on the horn.`,
        choices: [
          { label: 'Tell him family comes first — go.', whisper: true, effects: { trust: +5, belief: -2 }, flag: 'wentWithBrother', say: 'Go with your brother.', log: 'He got in the car. The coach noticed.' },
          { label: 'Tell him to finish the session.', whisper: true, effects: { belief: +4, conscience: +2 }, flag: 'brotherResent', say: 'Finish the session.', log: 'He stayed. His brother drove off without him.' },
          { label: 'Let him choose.', effects: { conscience: +1 }, flag: 'wentWithBrother', log: 'He chose the car. Nobody argued.' },
        ],
      },
      {
        id: 'the-offer',
        text: () => `The academy offers a two-year deal. It is also the year his exams matter. His mother asks him, at the table, what he thinks. He looks at the ceiling, which is where you are, more or less.`,
        choices: [
          { label: 'Tell him to sign.', whisper: true, effects: { belief: +5, trust: +3 }, flag: 'signedAt16', say: 'Sign it.', log: 'He signed at sixteen. School ended there.' },
          { label: 'Tell him to finish school first.', whisper: true, effects: { conscience: +4, belief: -2 }, say: 'Finish school first.', log: 'He stayed in school. The academy kept the door open, just.' },
          { label: 'Say nothing.', effects: {}, log: 'He signed, because nobody told him not to.' },
        ],
      },
      {
        id: 'who-are-you',
        text: () => `That night he sits on the end of the bed and speaks to the room.\n\n"Who are you?"\n\nIt is the first time he has asked out loud.`,
        choices: [
          { label: 'Tell him you are on his side.', whisper: true, effects: { trust: +8, belief: +3 }, say: 'Someone on your side.', log: 'You told him you were on his side. He nodded at the ceiling.' },
          { label: 'Tell him it does not matter.', whisper: true, effects: { trust: -3, conscience: +2 }, say: 'It does not matter what I am.', log: 'You refused to say. He stopped asking for a while.' },
          { label: 'Stay quiet.', effects: { belief: -4 }, log: 'You said nothing. He lay down and stared at the ceiling for an hour.' },
        ],
      },
    ],
  },

  {
    id: 'first-team',
    title: 'First Team',
    ageStart: 19,
    ageEnd: 22,
    scenes: [
      {
        id: 'debut',
        text: (g) => `Nineteen, and the manager reads his name out. ${g.name} is starting. In the tunnel he can hear the away end singing something unpleasant about his mother.`,
        choices: [
          { label: 'Tell him to play like he is unknown.', whisper: true, effects: { belief: +6 }, say: 'Play like nobody knows you.', log: 'He played like nobody knew him. They know him now.' },
          { label: 'Tell him to be selfish — shoot.', whisper: true, effects: { belief: +3, conscience: -2 }, say: 'Shoot whenever you can.', log: 'He shot from everywhere. One went in.' },
          { label: 'Let the noise be the noise.', effects: {}, log: 'He had a quiet debut. Nobody remembers it.' },
        ],
      },
      {
        id: 'two-countries',
        if: (g) => Boolean(g.secondNation),
        text: (g) => `Two federations write in the same week. ${g.nation} have watched him since he was fifteen. ${g.secondNation} have a grandmother on file and a coach who rings his father directly.\n\n"Can you play for both?" he asks the ceiling. "What do I say?"`,
        choices: [
          {
            label: (g) => `Tell him to choose ${g.nation}.`,
            whisper: true,
            effects: { belief: +4, conscience: +2 },
            flag: 'choseHomeNation',
            say: (g) => `Choose ${g.nation}.`,
            log: (g) => `He chose ${g.nation}. His father's side of the family did not come to the first cap.`,
          },
          {
            label: (g) => `Tell him to choose ${g.secondNation}.`,
            whisper: true,
            effects: { belief: +3, conscience: +3 },
            flag: 'choseSecondNation',
            say: (g) => `Choose ${g.secondNation}.`,
            log: (g) => `He chose ${g.secondNation}. It was the harder room to walk into.`,
          },
          {
            label: 'Tell him to wait — the decision can keep.',
            whisper: true,
            effects: { belief: -3 },
            flag: 'delayedNation',
            log: 'He waited. Both federations moved on to someone else, briefly.',
          },
          { label: 'Say nothing. It is his family, not yours.', effects: { conscience: -1 }, flag: 'delayedNation', log: 'He decided alone, and told you afterwards.' },
        ],
      },
      {
        id: 'first-drink',
        text: () => `The senior lads are out. He is nineteen and it is the third invitation this month. His hand is on the door handle of a car he should not be getting into.`,
        choices: [
          { label: 'Tell him to go home.', whisper: true, effects: { conscience: +4, trust: +2 }, flag: 'wentHome', say: 'Go home.', log: 'He went home. They noticed.' },
          { label: 'Tell him one night is fine.', whisper: true, effects: { conscience: -4, belief: +2 }, flag: 'stayedOut', say: 'One night will not hurt.', log: 'He stayed out until four and trained badly for a week.' },
          { label: 'Say nothing.', effects: { conscience: -2 }, flag: 'stayedOut', log: 'He went. Nobody stopped him.' },
        ],
      },
      {
        id: 'the-agent',
        text: () => `A man in a good coat wants to represent him. Ten per cent, a car, and a promise about "the right clubs". ${'He asks what you think, as though you have ever signed anything.'}`,
        choices: [
          { label: 'Tell him to sign — money is real.', whisper: true, effects: { trust: -2, conscience: -3 }, flag: 'sharkAgent', say: 'Take it. Money is real.', log: 'He signed with the man in the good coat.' },
          { label: 'Tell him to wait a year.', whisper: true, effects: { trust: +5, conscience: +3 }, say: 'Wait a year.', log: 'He waited. The good coat went elsewhere.' },
          { label: 'Let him decide.', effects: { conscience: +1 }, flag: 'sharkAgent', log: 'He signed the same week.' },
        ],
      },
      {
        id: 'hide-it',
        text: () => `His knee is swelling after every session. The physio says rest. There is a cup tie in nine days and a scout in the stand.`,
        choices: [
          { label: 'Tell him to rest it.', whisper: true, effects: { conscience: +5, belief: -2 }, flag: 'restedKnee', say: 'Rest it.', log: 'He rested. He missed the cup tie.' },
          { label: 'Tell him to strap it and play.', whisper: true, effects: { belief: +4, conscience: -4 }, flag: 'hidInjury', say: 'Strap it and play.', log: 'He played. The scout wrote his name down.' },
          { label: 'Say nothing.', effects: { conscience: -1 }, flag: 'hidInjury', log: 'He played, because nobody told him not to.' },
        ],
      },
      {
        id: 'the-interview',
        text: (g) => `A reporter asks where he is from and whether he thinks he has "made it". ${g.flags.sharkAgent ? 'The man in the good coat has written him an answer.' : 'Nobody has told him what to say.'}`,
        choices: [
          { label: 'Tell him to be honest.', whisper: true, effects: { conscience: +4, trust: +3 }, flag: 'honestInterview', say: 'Tell them the truth.', log: 'He told the truth about the estate. It went everywhere.' },
          { label: 'Tell him to say nothing at all.', whisper: true, effects: { conscience: -1, belief: +1 }, say: 'Give them nothing.', log: 'He gave them clichés. They printed them.' },
          { label: 'Stay out of it.', effects: {}, log: 'He answered on his own. It was fine.' },
        ],
      },
    ],
  },

  {
    id: 'injury',
    title: 'The Knee',
    ageStart: 23,
    ageEnd: 26,
    scenes: [
      {
        id: 'the-scan',
        text: () => `The scan is on the screen before anyone says a word. Anterior cruciate ligament. Nine months, maybe twelve. He is twenty-three, and the room is very quiet.`,
        choices: [
          { label: 'Tell him he will come back.', whisper: true, effects: { belief: +8, trust: +4 }, say: 'You will come back from this.', log: 'You told him he would come back. He wrote it on his hand.' },
          { label: 'Tell him the truth — it might not be the same.', whisper: true, effects: { belief: -6, trust: +6, conscience: +3 }, say: 'It might not be the same. I am sorry.', log: 'You told him the truth. He respected it later, not then.' },
          { label: 'Say nothing.', effects: { belief: -8 }, log: 'Nobody said anything. He stared at the screen.' },
        ],
      },
      {
        id: 'the-dark',
        text: () => `Month four. He has stopped answering his mother. The flat is dark at two in the afternoon and there are three unopened letters from the club.`,
        choices: [
          { label: 'Tell him to call his mother.', whisper: true, effects: { belief: +5, conscience: +5 }, flag: 'calledMother', say: 'Call your mother.', log: 'He called her. She drove up that night.' },
          { label: 'Tell him to push through alone.', whisper: true, effects: { belief: -4, conscience: -3 }, flag: 'pushedAlone', say: 'Get through it on your own.', log: 'He got through it alone, and it cost him something.' },
          { label: 'Say nothing. Let him sink or stand.', effects: { belief: -6 }, log: 'He sank for a while. Then he stood up on his own.' },
        ],
      },
      {
        id: 'the-pills',
        text: () => `A physio slides a strip of tablets across the table. "Everyone does it. You'll be back in six weeks instead of twelve." He looks at the door, then at you.`,
        choices: [
          { label: 'Tell him to refuse.', whisper: true, effects: { conscience: +8, trust: +4 }, flag: 'refusedPills', say: 'Do not take them.', log: 'He pushed them back across the table.' },
          { label: 'Tell him nobody would ever know.', whisper: true, effects: { belief: +3, conscience: -10 }, flag: 'tookPills', say: 'Nobody would know.', log: 'He took them. He was back in seven weeks.' },
          { label: 'Say nothing.', effects: { conscience: -4 }, flag: 'tookPills', log: 'He took them, because nobody said no.' },
        ],
      },
      {
        id: 'the-return',
        text: () => `Fifteen months later, the reserves, a cold Tuesday, forty people in the ground. His first tackle is a fifty-fifty and he goes in with his eyes open.`,
        choices: [
          { label: 'Tell him to take his time.', whisper: true, effects: { belief: +4, conscience: +3 }, say: 'Take your time.', log: 'He took his time. He finished the ninety.' },
          { label: 'Tell him to go and win it.', whisper: true, effects: { belief: +6, conscience: -2 }, say: 'Go and win it.', log: 'He went in hard, and won it, and got up.' },
          { label: 'Say nothing.', effects: {}, log: 'He played within himself.' },
        ],
      },
      {
        id: 'who-are-you-again',
        text: () => `"You were there the whole time," he says. "In the dark. What are you?"\n\nHe is asking properly now. He is old enough to want the real answer.`,
        choices: [
          { label: 'Tell him you are nobody — just him, thinking.', whisper: true, effects: { trust: +6, belief: +4 }, say: 'Maybe I am just you.', log: 'You told him you might be him. He found that comforting.' },
          { label: 'Tell him you do not know either.', whisper: true, effects: { trust: +4, conscience: +2 }, say: 'I do not know.', log: 'You admitted you did not know. He laughed.' },
          { label: 'Refuse to answer.', effects: { trust: -4 }, log: 'You stayed quiet. He stopped asking after that.' },
        ],
      },
    ],
  },

  {
    id: 'move',
    title: 'The Move',
    ageStart: 27,
    ageEnd: 31,
    scenes: [
      {
        id: 'the-big-club',
        text: (g) => `The offer is on the table: a club that wins things, double the money, and a bench that is warmer than the one he has. He is ${g.age} and this is the decision everyone will ask him about for the rest of his life.`,
        choices: [
          { label: 'Tell him to take it.', whisper: true, effects: { belief: +5, conscience: -2 }, flag: 'tookBigMove', say: 'Take it.', log: 'He took the move. He won things. He also sat down a lot.' },
          { label: 'Tell him to stay where he is loved.', whisper: true, effects: { trust: +6, conscience: +3 }, flag: 'stayedLoyal', say: 'Stay where you are loved.', log: 'He stayed. They sang his name for four more years.' },
          { label: 'Say nothing. It is his life.', effects: {}, flag: 'stayedLoyal', log: 'He stayed, quietly, without being told.' },
        ],
      },
      {
        id: 'the-brother-returns',
        text: (g) => g.flags.wentWithBrother || g.flags.brotherResent
          ? `His brother is at the door with a business plan on two sides of A4 and a number that is not small. There is history in the room.`
          : `An old friend from the estate turns up with a business plan on two sides of A4 and a number that is not small.`,
        choices: [
          { label: 'Tell him to help — it is family.', whisper: true, effects: { conscience: +3, trust: +2 }, flag: 'helpedBrother', say: 'Help them.', log: 'He put the money in. Half of it came back.' },
          { label: 'Tell him to say no.', whisper: true, effects: { conscience: -2, trust: -3 }, flag: 'refusedBrother', say: 'Say no.', log: 'He said no. It was never mentioned again.' },
          { label: 'Let him decide.', effects: {}, flag: 'helpedBrother', log: 'He wrote the cheque without being asked.' },
        ],
      },
      {
        id: 'the-captain',
        text: () => `The captain has been mocking a young player in the dressing room for weeks. Today it is worse, and the room is waiting to see what the senior players do.`,
        choices: [
          { label: 'Tell him to speak up.', whisper: true, effects: { conscience: +6, trust: +3 }, flag: 'spokeUp', say: 'Say something.', log: 'He said something. The room went quiet.' },
          { label: 'Tell him it is not his fight.', whisper: true, effects: { conscience: -5, belief: +1 }, say: 'Not your fight.', log: 'He said nothing. The kid left in January.' },
          { label: 'Stay out of the dressing room.', effects: { conscience: -2 }, log: 'Nobody said anything. It kept happening.' },
        ],
      },
      {
        id: 'the-scandal',
        text: (g) => g.flags.tookPills
          ? `A journalist has the physio's records from ${g.age - 6} years ago. The tablets. The seven-week return. She rings for comment.`
          : `A tabloid has a story about a night out that ended badly. It is exaggerated, but not invented. She rings for comment.`,
        choices: [
          { label: 'Tell him to front up and apologise.', whisper: true, effects: { conscience: +6, trust: +3 }, flag: 'frontedUp', say: 'Tell them the truth and apologise.', log: 'He fronted up. It was over in a week.' },
          { label: 'Tell him to deny everything.', whisper: true, effects: { conscience: -7, belief: +2 }, flag: 'deniedScandal', say: 'Deny it.', log: 'He denied it. It followed him for years.' },
          { label: 'Say nothing.', effects: { conscience: -3 }, flag: 'deniedScandal', log: 'His people handled it. Badly.' },
        ],
      },
      {
        id: 'the-clause',
        text: () => `Contract talks. His agent wants the money up front; the club wants a clause giving them a cut of any future sale. He asks you, of all people, about a percentage.`,
        choices: [
          { label: 'Tell him to protect the clause.', whisper: true, effects: { conscience: +4 }, flag: 'smartClause', say: 'Read the clause. Protect yourself.', log: 'He kept the sell-on. It paid out years later.' },
          { label: 'Tell him to take the cash now.', whisper: true, effects: { belief: +2, conscience: -3 }, flag: 'tookCash', say: 'Take the money.', log: 'He took the cash. The clause went to the club.' },
          { label: 'Say nothing about money.', effects: {}, log: 'He signed what his agent put in front of him.' },
        ],
      },
    ],
  },

  {
    id: 'decline',
    title: 'The Body',
    ageStart: 32,
    ageEnd: 35,
    scenes: [
      {
        id: 'dropped',
        text: (g) => g.flags.tookBigMove
          ? `He is 32 and the club that bought him has bought someone younger and better. He has started four games this season.`
          : `He is 32 and the legs are a half-second late. The manager tells him, kindly, that he is now a squad player.`,
        choices: [
          { label: 'Tell him to reinvent himself.', whisper: true, effects: { belief: +5, trust: +3 }, flag: 'reinvented', say: 'Learn a new position.', log: 'He learned to play deeper. It bought him two more years.' },
          { label: 'Tell him the manager is a fool.', whisper: true, effects: { belief: +3, conscience: -3 }, say: 'He is an idiot.', log: 'He told the manager exactly that.' },
          { label: 'Say nothing.', effects: { belief: -4 }, log: 'He accepted it and stopped pushing.' },
        ],
      },
      {
        id: 'the-kid',
        text: () => `A seventeen-year-old has his shirt number. The kid is terrified and pretending not to be. He is in the same position, in the same seat, doing the same nervous things.`,
        choices: [
          { label: 'Tell him to help the kid.', whisper: true, effects: { conscience: +7, belief: +2 }, flag: 'mentoredKid', say: 'Help him.', log: 'He took the kid under his wing. The kid remembers it to this day.' },
          { label: 'Tell him to freeze the kid out.', whisper: true, effects: { conscience: -6, belief: +1 }, say: 'Make him earn it the hard way.', log: 'He froze the kid out. The kid never forgave him.' },
          { label: 'Let the dressing room sort itself.', effects: {}, log: 'Nothing was said. Nothing changed.' },
        ],
      },
      {
        id: 'the-body',
        text: (g) => g.flags.hidInjury
          ? `The knee he strapped at nineteen has opinions now. Some mornings he cannot bend it before nine o'clock, and the specialist has used the word "manage".`
          : `Afternoons, his back seizes. The medical staff have stopped using the word "recovery" and started using "management".`,
        choices: [
          { label: 'Tell him to go while he can still walk.', whisper: true, effects: { conscience: +4, belief: +2 }, flag: 'retiredEarly', say: 'Stop now, while it is your choice.', log: 'He set a date. He went out on his own terms.' },
          { label: 'Tell him to keep playing anywhere.', whisper: true, effects: { belief: +3, conscience: -2 }, flag: 'keptGoing', say: 'Play as long as anyone will have you.', log: 'He went abroad for two more seasons. The money was good. The football was not.' },
          { label: 'Say nothing.', effects: {}, flag: 'keptGoing', log: 'He kept going until nobody called.' },
        ],
      },
      {
        id: 'the-farewell',
        text: () => `A testimonial has been arranged. His mother is flying in. The club have printed a programme with his face on it at nineteen and at thirty-three.`,
        choices: [
          { label: 'Tell him to say thank you properly.', whisper: true, effects: { trust: +5, conscience: +4 }, flag: 'gracefulFarewell', say: 'Thank the people who came.', log: 'He thanked the ground staff by name. The room stood up.' },
          { label: 'Tell him to skip the fuss.', whisper: true, effects: { conscience: -3, belief: +1 }, say: 'Skip it. It is a circus.', log: 'He skipped it. The club never quite forgave him.' },
          { label: 'Say nothing.', effects: {}, log: 'He came, said little, and left early.' },
        ],
      },
    ],
  },

  {
    id: 'after',
    title: 'After',
    ageStart: 36,
    ageEnd: 36,
    scenes: [
      {
        id: 'retirement',
        text: (g) => `He announces it on a Tuesday, in a statement shorter than his first contract. That evening he sits in the garden and asks the air, "What now?"`,
        choices: [
          { label: 'Tell him to coach.', whisper: true, effects: { belief: +5, conscience: +3 }, flag: 'wentIntoCoaching', say: 'Teach it to someone else.', log: 'He took his badges. He is good at it.' },
          { label: 'Tell him to leave football entirely.', whisper: true, effects: { belief: +2, conscience: +2 }, flag: 'leftFootball', say: 'Leave it behind.', log: 'He did not watch a match for two years.' },
          { label: 'Say nothing.', effects: {}, log: 'He drifted for a while, then found something.' },
        ],
      },
      {
        id: 'the-question',
        text: (g) => `${g.name} is thirty-six years old, sitting in a garden in the dark, and he asks the question he has asked three times in twenty years.\n\n"All of it. The knee. The move. The dark months. Was that you?"`,
        choices: [
          { label: 'Tell him yes.', whisper: true, effects: { trust: +6 }, say: 'Yes. It was me.', log: 'You told him the truth at last.' },
          { label: 'Tell him it was always him.', whisper: true, effects: { belief: +8, trust: +4 }, say: 'It was always you.', log: 'You told him it was always him. He believed you.' },
          { label: 'Say nothing, one last time.', effects: {}, log: 'You said nothing. He waited, then went inside.' },
        ],
      },
    ],
  },
];
