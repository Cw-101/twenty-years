import { hookLine } from './origin.js';

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
        text: (g) => `The letter arrives on a Thursday and it is thinner than it should be: one sheet, a crest, and a date at the top in a font that looks borrowed from a bank.\n\n${g.origin.city}, in February, is a place of wet buses and orange light. In the kitchen, the radiator ticks. His mother reads it twice, holding it further away the second time, as if distance might change the wording. His brother reads it upside down and says nothing at all, which is how you know he has understood it.\n\nThe letter says he is invited to a two-day trial. It says the club will provide lunch. It says please bring your own boots.\n\nHis boots are two sizes too big. He has been wearing them since October with a second pair of socks, and the boy at the sports shop told him he would grow into them, and he has not grown into them.\n\n${hookLine(g.origin, 'family')}\n\nUpstairs, he puts the letter on the bed and looks at it for a long time, and the house makes its usual noises around him, and nothing about the afternoon feels like the beginning of anything. That is the strange part about beginnings. Nobody tells you.`,

        choices: [
          { label: 'Say it out loud: he belongs there.', whisper: true, flag: 'saidItOutLoud',  effects: { belief: +6, trust: +4 }, say: 'You belong there.', log: 'He said it out loud in an empty room, and slept for nine hours.' },
          { label: 'Enjoy it and expect nothing.', whisper: true, flag: 'expectedNothing',  effects: { belief: +2, conscience: +2 }, say: 'Just enjoy it.', log: 'He went in without expectations, and came out with a place.' },
          { label: 'Say nothing. Let the fear do its work.', effects: { belief: -2 }, log: 'He lay awake until three, reading the letter by the light of the landing.' },
        ],
      },
      {
        id: 'the-coach',
        text: (g) => `Day one, and the training ground is smaller than it looks on television: two pitches, a portakabin, a fence that somebody has painted badly.\n\nHe is the last of eleven boys to arrive and the only one whose kit does not match. The coach is a compact man in a club coat with a whistle he clearly enjoys. Twelve minutes in, he stops a session to say, to everyone and to no one, that the new lad runs like he is carrying a wardrobe.\n\nTwo of the older boys laugh — the kind of laugh that is not really about the joke. One of them, a striker with a shaved head, does an impression of it behind the coach's back. The others watch to see what the new lad will do.\n\n${g.name} looks at his boots. The boots look back, enormous, ridiculous, bought by a mother who works nights.\n\nThe coach blows the whistle. The session goes on. For the next hour every pass he makes is slightly too careful, and he can feel the morning closing around him like a door.`,

        choices: [
          { label: 'Treat it as a test, not a verdict.', whisper: true, flag: 'tookItAsTest',  effects: { belief: +5, trust: +3 }, say: 'He is testing you. Do not fold.', log: 'He decided it was a test. He was right, and he scored twice before the hour was out.' },
          { label: 'Say something back to the coach.', whisper: true, flag: 'answeredBack',  effects: { conscience: -3, belief: +3 }, say: 'Say something back.', log: 'He answered back. The coach liked it. The dressing room did not.' },
          { label: 'Say nothing. Let him find his own way.', effects: { belief: -3 }, log: 'He took it in silence and barely touched the ball again.' },
        ],
      },
      {
        id: 'the-brother',
        text: (g) => `Saturday morning, and there is a car outside with the engine running and two people in it he has known since primary school.\n\nHis brother leans on the horn — not angrily, just once, the way you do when you have been waiting long enough to make a point. There is a party two towns over. There is also, in ninety minutes, the last session before the club decides.\n\nThe kitchen clock is the loudest thing in the house. His mother is asleep, because she worked until six.\n\nHe stands in the hallway with a bag on his shoulder that could mean either thing, and the shape of the next twenty years is, briefly, a decision about a car.`,

        choices: [
          { label: 'Go with his brother.', whisper: true, effects: { trust: +5, belief: -2 }, flag: 'wentWithBrother', say: 'Go with your brother.', log: 'He got in the car. The coach noticed, and said nothing, and noticed.' },
          { label: 'Finish the session.', whisper: true, effects: { belief: +4, conscience: +2 }, flag: 'brotherResent', say: 'Finish the session.', log: 'He let the car go. His brother did not ring for three weeks.' },
          { label: 'Let him choose.', effects: { conscience: +1 }, flag: 'wentWithBrother', log: 'He chose the car, and told himself it did not matter.' },
        ],
      },
      {
        id: 'the-offer',
        text: (g) => `They offer him two years. There is a form on the table with his name typed on it, and a pen that has been used by other people before him.\n\nHis mother has the college letter in her hand and the mortgage in her face. She asks him what he thinks, once, in the way that means she has already thought about it for a week and does not want to say the wrong thing.\n\nThe thing nobody puts on the table: if he signs, the exams stop mattering, and if he does not sign, this whole building forgets him by August. He is sixteen. He has been alive for eight thousand days and this is the first one that will be quoted back at him for the rest of his life.\n\nHe reads the form twice. It is not long.`,

        choices: [
          { label: 'Sign it.', whisper: true, effects: { belief: +5, trust: +3 }, flag: 'signedAt16', say: 'Sign it.', log: 'He signed at sixteen. The college letter went in a drawer and stayed there.' },
          { label: 'Finish school first.', whisper: true, flag: 'stayedInSchool',  effects: { conscience: +4, belief: -2 }, say: 'Finish school first.', log: 'He stayed in school. The club kept the door open, just, and never let him forget the hesitation.' },
          { label: 'Say nothing. Let him hold the pen.', effects: {}, log: 'He signed, because nobody said not to.' },
        ],
      },
      {
        id: 'the-first-night',
        text: (g) => `The night before the induction, he cannot sleep, so he does what he always does: he lies in the dark and makes a list.\n\nThings he is afraid of, in order. That the others will be faster. That his boots will be noticed. That his mother will have to keep working nights if this does not come off. That he will get what he wants and find out he is ordinary. That he will be here, in this room, at thirty, still making lists.\n\nOutside, a car goes past and someone laughs and a door closes. The house settles.\n\nIn the morning there is a form to hand in and a coach to look in the eye, and none of the list will help with either.`,

        choices: [
          { label: 'Let him take the fear with him.', whisper: true, flag: 'wentInAfraid',  effects: { belief: +5, trust: +3 }, say: 'Take it with you. Do not wait to stop being afraid.', log: 'He went in afraid and did it anyway. That is most of what courage is.' },
          { label: 'Be someone else in there.', whisper: true, flag: 'builtPersona',  effects: { belief: +3, conscience: -2 }, say: 'In there, be someone else.', log: 'He built a version of himself for the building. It worked, and it cost something.' },
          { label: 'Say nothing. He has his list.', effects: { belief: -2 }, log: 'He took the list with him and did not look up all day.' },
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
        text: (g) => `Nineteen, and the manager reads the team out in a room with a tactics board and a smell of deep heat, and ${g.name} hears his own name go in at number eleven.\n\nIn the tunnel the concrete is wet and the away end is already singing something about his mother that rhymes with her name. The captain, thirty-four and going bald, tells him to keep his head up and means it in the way that men who have eight months left of this mean things.\n\nTen minutes in, he miscontrols a pass and the home crowd makes that noise — not a boo exactly, more a collective intake of breath, the sound of people revising an opinion.\n\nBy half-time he has touched the ball four times.`,
        choices: [
          { label: 'Play like he is unknown.', whisper: true, effects: { belief: +6 }, say: 'Play like nobody knows you.', log: 'He played like nobody knew him. They know him now.' },
          { label: 'Be selfish — shoot.', whisper: true, effects: { belief: +3, conscience: -2 }, say: 'Shoot whenever you can.', log: 'He shot from everywhere. One went in.' },
          { label: 'Let the noise be the noise.', effects: {}, log: 'He had a quiet debut. Nobody remembers it.' },
        ],
      },
      {
        id: 'two-countries',
        if: (g) => Boolean(g.secondNation),
        text: (g) => `Two federations write in the same week. ${g.nation} have watched him since he was fifteen. ${g.secondNation} have a grandmother on file and a coach who rings his father directly.\n\n"Can you play for both?" he says, to the room, to nobody. "What do I say?"`,
        choices: [
          {
            label: (g) => `Choose ${g.nation}.`,
            whisper: true,
            effects: { belief: +4, conscience: +2 },
            flag: 'choseHomeNation',
            say: (g) => `Choose ${g.nation}.`,
            log: (g) => `He chose ${g.nation}. His father's side of the family did not come to the first cap.`,
          },
          {
            label: (g) => `Choose ${g.secondNation}.`,
            whisper: true,
            effects: { belief: +3, conscience: +3 },
            flag: 'choseSecondNation',
            say: (g) => `Choose ${g.secondNation}.`,
            log: (g) => `He chose ${g.secondNation}. It was the harder room to walk into.`,
          },
          {
            label: 'Wait — the decision can keep.',
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
        text: () => `The senior lads are out and it is the third time this month, and the third time is the one that matters, because the first two could be politeness and this one is a test.\n\nThere is a car outside with the window down and a song playing out of a phone, and the physio has already gone home so nobody official exists between now and Sunday.\n\nHe is nineteen. The wage is £900 a week and appears on his statement under the word "remuneration", which sounds to him like a joke somebody else is in on.\n\nHis hand is on the door handle. In the kitchen his tea is going cold and there is a note on the fridge from his mother that says SEE YOU SUNDAY.`,
        choices: [
          { label: 'Go home.', whisper: true, effects: { conscience: +4, trust: +2 }, flag: 'wentHome', say: 'Go home.', log: 'He went home. They noticed.' },
          { label: 'One night is fine.', whisper: true, effects: { conscience: -4, belief: +2 }, flag: 'stayedOut', say: 'One night will not hurt.', log: 'He stayed out until four and trained badly for a week.' },
          { label: 'Say nothing.', effects: { conscience: -2 }, flag: 'stayedOut', log: 'He went. Nobody stopped him.' },
        ],
      },
      {
        id: 'the-agent',
        text: () => `The man in the good coat is called Terry and he has a car that is not leased, which in this car park is basically a reference.\n\nHe talks for forty minutes. Ten per cent. A driver when needed. An "introduction" to a club he will not name but describes by its stand. He says the word "project" eleven times and never once says what the project is.\n\nThe club's own man is cheaper and duller and has never bought anybody a coffee, and the captain says, without looking up from his boots, that the good coat will be there in a year too.\n\nHe has until Friday. He has never negotiated anything more complicated than a phone contract.`,
        choices: [
          { label: 'Sign — money is real.', whisper: true, effects: { trust: -2, conscience: -3 }, flag: 'sharkAgent', say: 'Take it. Money is real.', log: 'He signed with the man in the good coat.' },
          { label: 'Wait a year.', whisper: true, effects: { trust: +5, conscience: +3 }, say: 'Wait a year.', log: 'He waited. The good coat went elsewhere.' },
          { label: 'Let him decide.', effects: { conscience: +1 }, flag: 'sharkAgent', log: 'He signed the same week.' },
        ],
      },
      {
        id: 'hide-it',
        text: () => `The knee has been swelling since November and by Thursday it is the size of a fist. The physio drains it, tapes it, and uses the word "manage", which is a word people use when they have stopped hoping something will fix itself.\n\nThere is a cup tie in nine days. There is also, in the stand, a man from a club two divisions up with a seat number and a notebook, and everybody in the building knows he is coming.\n\nRest means missing it. Playing means the knee remembers this season for the next fifteen years.\n\nHe is nineteen, so the arithmetic feels obvious to him and does not feel obvious to the physio.`,
        choices: [
          { label: 'Rest it.', whisper: true, effects: { conscience: +5, belief: -2 }, flag: 'restedKnee', say: 'Rest it.', log: 'He rested. He missed the cup tie.' },
          { label: 'Strap it and play.', whisper: true, effects: { belief: +4, conscience: -4 }, flag: 'hidInjury', say: 'Strap it and play.', log: 'He played. The scout wrote his name down.' },
          { label: 'Say nothing.', effects: { conscience: -1 }, flag: 'hidInjury', log: 'He played, because nobody told him not to.' },
        ],
      },
      {
        id: 'the-interview',
        text: (g) => `The reporter is twenty-three, local, and has been sent to do a piece about the academy because the first team lost on Saturday.\n\nShe asks where he is from. She asks whether he thinks he has made it, and he laughs at the corridor ceiling, which is the wrong thing to do on camera.\n\n${g.flags.sharkAgent ? 'Terry has left him three bullet points on a card. They are not lies exactly — they are the truth with the interesting parts removed.' : 'There is nobody behind her to tell him what to say, and no card in his pocket, and he can hear his own voice coming back off the corridor.'}\n\nIt will run on Thursday. People he has not spoken to in years will send it to each other.`,
        choices: [
          { label: 'Be honest.', whisper: true, effects: { conscience: +4, trust: +3 }, flag: 'honestInterview', say: 'Tell them the truth.', log: 'He told the truth about the estate. It went everywhere.' },
          { label: 'Say nothing at all.', whisper: true, effects: { conscience: -1, belief: +1 }, say: 'Give them nothing.', log: 'He gave them clichés. They printed them.' },
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
        text: (g) => `${g.flags.hidInjury ? 'He has been strapping this knee since he was nineteen and telling everybody it was fine, and the scan has an opinion about that.\n\n' : ''}The room has a light box on the wall and a poster about hamstrings that somebody has had since 2011.\n\nThe consultant is kind in the way of people who do this forty times a week. He points at the white line on the scan with the end of a pen and uses the word ligament, and then the word reconstruction, and then a number: nine months, possibly twelve.\n\nNobody in the room is looking at the scan. They are all looking at him, and he is looking at the poster about hamstrings.\n\nHe is twenty-three. He has played forty-one professional games and he was, until approximately four minutes ago, going to be worth something.`,
        choices: [
          { label: 'He will come back.', whisper: true, effects: { belief: +8, trust: +4 }, say: 'You will come back from this.', log: 'He wrote it on the back of his hand and read it every morning for a year.' },
          { label: 'The truth — it might not be the same.', whisper: true, effects: { belief: -6, trust: +6, conscience: +3 }, say: 'It might not be the same. I am sorry.', log: 'He heard the truth and hated it, and repeated it to himself in month six.' },
          { label: 'Say nothing.', effects: { belief: -8 }, log: 'Nobody said anything. He stared at the screen.' },
        ],
      },
      {
        id: 'the-dark',
        text: (g) => `Month four, and the flat is dark at two in the afternoon.\n\nThere are three letters from the club on the mat, unopened, and two from the hospital, and one from a company that wants to know about his car finance. The bins are full. Somebody has left a plate by the sink with something on it that is no longer food.\n\nHe has not answered his mother for eleven days. He knows the number of days. He counts them the way you count laps.\n\n${hookLine(g.origin, 'money') || hookLine(g.origin, 'mind')}`,
        choices: [
          { label: 'Call his mother.', whisper: true, effects: { belief: +5, conscience: +5 }, flag: 'calledMother', say: 'Call your mother.', log: 'He called her. She drove up that night.' },
          { label: 'Push through alone.', whisper: true, effects: { belief: -4, conscience: -3 }, flag: 'pushedAlone', say: 'Get through it on your own.', log: 'He got through it alone, and it cost him something.' },
          { label: 'Say nothing. Let him sink or stand.', effects: { belief: -6 }, log: 'He sank for a while. Then he stood up on his own.' },
        ],
      },
      {
        id: 'the-pills',
        text: () => `The physio is called Ian and he has been at the club eighteen years and he does not look like a man offering a nineteen-year-old anything illegal. That is what makes it hard.\n\nHe puts a strip of tablets on the table between them and does not look up. "Everyone does it. You'll be back in six weeks instead of twelve. They don't test here."\n\nThe tablets are white and small and unremarkable, and the room smells of strapping and Dettol and somebody's lunch.\n\nHe looks at the door. Then at the tablets. Then, for a while, at nothing.`,
        choices: [
          { label: 'Refuse.', whisper: true, effects: { conscience: +8, trust: +4 }, flag: 'refusedPills', say: 'Do not take them.', log: 'He pushed them back across the table.' },
          { label: 'Nobody would ever know.', whisper: true, effects: { belief: +3, conscience: -10 }, flag: 'tookPills', say: 'Nobody would know.', log: 'He took them. He was back in seven weeks.' },
          { label: 'Say nothing.', effects: { conscience: -4 }, flag: 'tookPills', log: 'He took them, because nobody said no.' },
        ],
      },
      {
        id: 'the-return',
        text: () => `Fifteen months after the scan, he plays for the reserves on a Tuesday in February in front of forty-one people and a dog.\n\nNinety minutes of a game that means nothing, against a team from a town he has never heard of, on a pitch that has been cut too short.\n\nThe first fifty-fifty comes in the ninth minute. He sees it early, the way you are taught to, and there is a fraction of a second where the whole body asks a question about the knee.\n\nHe goes in with his eyes open.`,
        choices: [
          { label: 'Take his time.', whisper: true, effects: { belief: +4, conscience: +3 }, say: 'Take your time.', log: 'He took his time. He finished the ninety.' },
          { label: 'Go and win it.', whisper: true, effects: { belief: +6, conscience: -2 }, say: 'Go and win it.', log: 'He went in hard, and won it, and got up.' },
          { label: 'Say nothing.', effects: {}, log: 'He played within himself.' },
        ],
      },
      {
        id: 'the-mirror',
        text: () => `The rehab room has a mirror along one wall, because the physios need to watch the knee, and so for two hours a day he watches himself do something badly.\n\nA year ago he could not walk up a slope. Last week he could not jump. Today he can hop ten metres without holding the bar, and it feels like being six years old in a car park with a whistle.\n\nIn the mirror he is thinner than he has ever been, and his face has gone the way faces go when nothing happens for a year. There is nobody else in the room to explain it to. There is only the version of himself on the other side of the glass, doing the same thing at the same time, and he has started talking to it, out loud, the way people do when they are alone for long enough.`,
        choices: [
          { label: 'Tell the mirror the truth: he might not come back.', whisper: true, effects: { belief: +6, trust: +5, conscience: +3 }, say: 'You might not come back the same. Do it anyway.', log: 'He said it to the glass, and then he hopped twenty metres.' },
          { label: 'Tell the mirror it will all be worth it.', whisper: true, effects: { belief: +3, conscience: -2 }, say: 'It will all be worth it.', log: 'He told himself it would be worth it. Some days it is.' },
          { label: 'Say nothing. Let the mirror stay a mirror.', effects: { belief: -3 }, log: 'He finished the session without saying a word to anyone.' },
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
        text: (g) => `The offer arrives as a PDF on a Sunday, which is how these things always arrive, and the number on it is the sort of number that makes a room go quiet.\n\nDouble the money. A club that finishes in the top four most years. A bench that is warmer than the one he has, and a manager who has already said the phrase "squad rotation" in a tone that means something else.\n\nHis agent says it is a no-brainer, and uses that phrase, and then says it again.\n\nHe is ${g.age}. He has one move of this size left in him. Somewhere in the house his phone is face-down on the arm of a chair and has been for an hour.`,
        choices: [
          { label: 'Take it.', whisper: true, effects: { belief: +5, conscience: -2 }, flag: 'tookBigMove', say: 'Take it.', log: 'He took the move. He won things. He also sat down a lot.' },
          { label: 'Stay where he is loved.', whisper: true, effects: { trust: +6, conscience: +3 }, flag: 'stayedLoyal', say: 'Stay where you are loved.', log: 'He stayed. They sang his name for four more years.' },
          { label: 'Say nothing. It is his life.', effects: {}, flag: 'stayedLoyal', log: 'He stayed, quietly, without being told.' },
        ],
      },
      {
        id: 'the-brother-returns',
        text: (g) => g.flags.wentWithBrother || g.flags.brotherResent
          ? `His brother is at the door with a business plan on two sides of A4 and a number that is not small. There is history in the room.`
          : `An old friend from the estate turns up with a business plan on two sides of A4 and a number that is not small.`,
        choices: [
          { label: 'Help — it is family.', whisper: true, effects: { conscience: +3, trust: +2 }, flag: 'helpedBrother', say: 'Help them.', log: 'He put the money in. Half of it came back.' },
          { label: 'Say no.', whisper: true, effects: { conscience: -2, trust: -3 }, flag: 'refusedBrother', say: 'Say no.', log: 'He said no. It was never mentioned again.' },
          { label: 'Let him decide.', effects: {}, flag: 'helpedBrother', log: 'He wrote the cheque without being asked.' },
        ],
      },
      {
        id: 'the-captain',
        text: (g) => `${g.flags.answeredBack ? 'He has a reputation in this building for answering back, which means the room will be watching him more closely than it watches anyone else this morning.\n\n' : ''}The captain has been doing it for weeks and it has got worse, and today it happens in the changing room with the door open so that the corridor can hear.\n\nThe young player — nineteen, from the under-23s, called up because of an injury — is doing the thing that people do when they are being laughed at, which is standing very still and pretending to look for something in his bag.\n\nTwo of the senior players are laughing. One is not. The kit man has left the room.\n\nEverybody is waiting to see what the senior players will do, and everybody in the room knows that the senior players are waiting to see the same thing.`,
        choices: [
          { label: 'Say something now, in front of all of them.', whisper: true, effects: { conscience: +6, trust: +3 }, flag: 'spokeUp', say: 'Say it now, in the room.', log: 'He said something. The room went quiet, and stayed quiet.' },
          { label: 'Say nothing now. Find the kid afterwards.', whisper: true, effects: { conscience: +4, belief: +1 }, flag: 'quietWord', say: 'Not in the room. Find him after.', log: 'He found the kid in the car park and told him it was not about him.' },
          { label: 'Take it to the manager.', whisper: true, effects: { conscience: +3, trust: -3 }, flag: 'wentToManager', say: 'Take it upstairs.', log: 'The manager had a word with the captain. The captain knew where it had come from.' },
          { label: 'Not his fight. Not his room.', effects: { conscience: -4 }, log: 'Nobody said anything, and it kept happening.' },
        ],
      },
      {
        id: 'the-scandal',
        text: (g) => g.flags.tookPills
          ? `A journalist has the physio's records from ${g.age - 6} years ago. The tablets. The seven-week return. She rings for comment.`
          : `A tabloid has a story about a night out that ended badly. It is exaggerated, but not invented. She rings for comment.`,
        choices: [
          { label: 'Front up and apologise.', whisper: true, effects: { conscience: +6, trust: +3 }, flag: 'frontedUp', say: 'Tell them the truth and apologise.', log: 'He fronted up. It was over in a week.' },
          { label: 'Deny everything.', whisper: true, effects: { conscience: -7, belief: +2 }, flag: 'deniedScandal', say: 'Deny it.', log: 'He denied it. It followed him for years.' },
          { label: 'Say nothing.', effects: { conscience: -3 }, flag: 'deniedScandal', log: 'His people handled it. Badly.' },
        ],
      },
      {
        id: 'the-clause',
        text: () => `Contract talks happen in a room with a long table and a jug of water nobody drinks, and are conducted almost entirely by two men who enjoy this.\n\nHis agent wants the money up front. The club wants a clause: a percentage of any future sale, which sounds like a technicality and is in fact the difference between a good career and a fortune.\n\nThe page with the clause on it is page eleven. Nobody puts page eleven in front of a footballer without hoping he will not read it properly.\n\nHe has a pen in his hand and a pen is a decision.`,
        choices: [
          { label: 'Protect the clause.', whisper: true, effects: { conscience: +4 }, flag: 'smartClause', say: 'Read the clause. Protect yourself.', log: 'He kept the sell-on. It paid out years later.' },
          { label: 'Take the cash now.', whisper: true, effects: { belief: +2, conscience: -3 }, flag: 'tookCash', say: 'Take the money.', log: 'He took the cash. The clause went to the club.' },
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
          { label: 'Learn to play again, differently.', whisper: true, effects: { belief: +5, trust: +3 }, flag: 'reinvented', say: 'Learn a new position. You have two years left and you can spend them well.', log: 'He learned to play deeper. It bought him two more years.' },
          { label: 'Let it be true. The legs have gone.', effects: { belief: -4, conscience: +1 }, flag: 'acceptedDecline', log: 'He accepted it, and the lads liked him more for it than he expected.' },
        ],
      },
      {
        id: 'the-kid',
        text: () => `The new lad is seventeen and has been given the shirt number, and is doing the thing that new lads do, which is arriving early and being polite and trying not to look at anybody's legs.\n\nHe is in the same seat, in the same corner of the same changing room, doing the same nervous things with his socks.\n\nIt is like watching a recording of himself at that age, except that this one has better boots and a worse haircut.\n\nThe squad are watching to see how the old one behaves, because that is how these things are decided.`,
        choices: [
          { label: 'Help the kid.', whisper: true, effects: { conscience: +7, belief: +2 }, flag: 'mentoredKid', say: 'Help him.', log: 'He took the kid under his wing. The kid remembers it to this day.' },
          { label: 'Freeze the kid out.', whisper: true, effects: { conscience: -6, belief: +1 }, say: 'Make him earn it the hard way.', log: 'He froze the kid out. The kid never forgave him.' },
          { label: 'Let the dressing room sort itself.', effects: {}, log: 'Nothing was said. Nothing changed.' },
        ],
      },
      {
        id: 'the-body',
        text: (g) => g.flags.hidInjury
          ? `The knee he strapped at nineteen has opinions now. Some mornings he cannot bend it before nine o'clock, and the specialist has used the word "manage".`
          : `Afternoons, his back seizes. The medical staff have stopped using the word "recovery" and started using "management".`,
        choices: [
          { label: 'Go while he can still walk.', whisper: true, effects: { conscience: +4, belief: +2 }, flag: 'retiredEarly', say: 'Stop now, while it is your choice.', log: 'He set a date. He went out on his own terms.' },
          { label: 'Keep playing anywhere.', whisper: true, effects: { belief: +3, conscience: -2 }, flag: 'keptGoing', say: 'Play as long as anyone will have you.', log: 'He went abroad for two more seasons. The money was good. The football was not.' },
          { label: 'Say nothing.', effects: {}, flag: 'keptGoing', log: 'He kept going until nobody called.' },
        ],
      },
      {
        id: 'the-farewell',
        text: () => `The testimonial is on a Sunday in May against a team of old friends, and the club has printed a programme with two photographs on the cover: him at nineteen, all wrists and bad skin, and him at thirty-three.\n\nHis mother is flying in. She has told everybody on her street.\n\nIn the tunnel, the ground staff — men he has nodded at twice a week for eleven years and never once asked the names of — are lined up in club polo shirts.\n\nSomebody hands him a microphone. The crowd stops talking in that way a crowd does when it is about to be asked to feel something.`,
        choices: [
          { label: 'Say thank you properly.', whisper: true, effects: { trust: +5, conscience: +4 }, flag: 'gracefulFarewell', say: 'Thank the people who came.', log: 'He thanked the ground staff by name. The room stood up.' },
          { label: 'Skip the fuss.', whisper: true, effects: { conscience: -3, belief: +1 }, say: 'Skip it. It is a circus.', log: 'He skipped it. The club never quite forgave him.' },
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
        id: 'the-last-match',
        text: (g) => `It is the last home game of the season and everybody in the ground knows what it is, even though nobody has said it.\n\nHis name is on the bench. The manager looks at him once during the warm-up and then looks away, which is his way of saying it is up to him.\n\nAt seventy-one minutes the fourth official puts the board up. His number. The ground stands up before the board is even legible.\n\nThere are eleven minutes left of the thing he has done since he was six years old.`,
        choices: [
          { label: 'Go on. Take the eleven minutes.', whisper: true, effects: { belief: +6, conscience: +2 }, flag: 'playedLastGame', say: 'Go on. You will want to have done it.', log: 'He went on for eleven minutes and touched the ball four times and the ground sang his name.' },
          { label: 'Stay on the bench. Let the last one be the good one.', whisper: true, effects: { belief: +2, conscience: +4 }, flag: 'watchedFromBench', say: 'Let it end on the good one.', log: 'He stayed seated. The manager understood, and the crowd did not.' },
          { label: 'Tell him it does not matter.', effects: { belief: -2 }, log: 'He shrugged and stayed where he was, and the eleven minutes went by without him.' },
        ],
      },
      {
        id: 'retirement',
        text: (g) => `He announces it on a Tuesday, in a statement shorter than his first contract. That evening he sits in the garden with his phone face-down and says, out loud, to nobody: "What now?"`,
        choices: [
          { label: 'Coach.', whisper: true, effects: { belief: +5, conscience: +3 }, flag: 'wentIntoCoaching', say: 'Teach it to someone else.', log: 'He took his badges. He is good at it.' },
          { label: 'Leave football entirely.', whisper: true, effects: { belief: +2, conscience: +2 }, flag: 'leftFootball', say: 'Leave it behind.', log: 'He did not watch a match for two years.' },
          { label: 'Say nothing.', effects: {}, log: 'He drifted for a while, then found something.' },
        ],
      },
      {
        id: 'the-garden',
        text: (g) => `${g.name} is thirty-six and the garden is small and there is a football under the hedge that has been there since the children next door lost it in the summer.\n\nHe does not sit down. He stands in the middle of the lawn the way he used to stand at the edge of the box, waiting for something to be delivered, and the evening does not deliver it.\n\nOn the phone earlier his mother asked whether he was all right, and he said yes, in the tone that makes people stop asking. Somewhere in the house a kettle goes on and a voice he loves says something to somebody else.\n\nHe picks up the ball. It is flat. He holds it anyway.`,
        choices: [
          { label: 'He did it himself. All of it.', whisper: true, effects: { belief: +8, trust: +4 }, say: 'You did all of this yourself.', log: 'He put the ball back under the hedge and went inside, and slept.' },
          { label: 'He was never alone in any of it.', whisper: true, effects: { trust: +6, conscience: +3 }, say: 'You were never on your own. Not once.', log: 'He stood in the dark for a while, and it was not a sad sort of standing.' },
          { label: 'Say nothing. Let the evening be an evening.', effects: {}, log: 'He stood on the grass until it got cold, then went in.' },
        ],
      },
    ],
  },
];
