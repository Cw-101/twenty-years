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

import { nameOf } from './cast.js';

import { EXTRA_TOPICS } from './extra-topics.js';
import { formLine } from './stats.js';

export const CHAPTERS = [
  {
    id: 'trial',
    title: 'The Trial',
    ageStart: 16,
    ageEnd: 18,
    scenes: [
      {
        id: 'the-call',
        backdrop: 'kitchen',
        meets: ['mother'],
        witness: 'mother',
        text: (g) => `The letter arrives on a Thursday and it is thinner than it should be: one sheet, a crest, and a date at the top in a font borrowed from a bank.

${nameOf(g, 'mother')} — Mei Lu, forty-four, who came to Derby from Sham Shui Po in 2003 and has worked nights at the care home on Osmaston Road for eleven of the twenty years since — reads it twice, holding it further away the second time. Then she puts it flat on the table, squares the corners with two fingers, and says, without looking up, "Two days. They want you for two days."

She has worked until six all week. There is a cardigan over her shoulders that she has not taken off since Tuesday.

"Bring your own boots," she reads. "You've got boots."

The boots are two sizes too big. He has been wearing them since October with a second pair of socks, and the man in the shop told him he would grow into them, and he has not grown into them.

${hookLine(g.origin, 'family')}

She looks at him properly then. "You'll go," she says. "And you'll come back and tell me what they said. All of it."`,
        topics: [
          {
            id: 'askMother',
            label: 'Ask her what she would do.',
            effects: { trust: +2 },
            flag: 'motherPushedHim',
            text: (g) => `He asks it badly, half into the fridge. She thinks about it for longer than he expects.

"Me?" she says. "I'd go. Every mile of it, and I'd hate the drive, and I'd still go."

Then she does the thing she does, which is to put her hand flat on the table and make it practical. "But you listen to me. If they say nothing at the end of the two days, that is not the same as no. They say nothing to everyone."`,
          },
          {
            id: 'askSister',
            cast: ['sister'],
            label: 'Ask your sister if she would go.',
            effects: { conscience: +1 },
            flag: 'sisterJoked',
            text: (g) => `${nameOf(g, 'sister')} is in the doorway with her coat already on, and answers before he has finished the question.

"Go," she says. "If you go, I get your room. If you don't go, I get your room anyway, because you'll be in there being sad about it."

She is sixteen and funnier than anyone else in the house, and she does not say the other thing, which is that she knows exactly what this letter cost.`,
          },
          {
            id: 'readLetter',
            label: 'Read the letter again, properly.',
            effects: {},
            flag: 'readTheSmallPrint',
            text: () => `Second read, with a pen.

Nine until three, both days. Lunch provided. Bring boots, shin pads and a change of clothes.

Nothing about travel. Nothing about money. It is two days in a building in another city and the letter assumes a family with a car and a day to spare, and he reads that sentence three times before he understands that it is not an accident.`,
          },
        ],
        choices: [
          { label: 'Say it out loud: he belongs there.', whisper: true, flag: 'saidItOutLoud',
          memory: 'He stood in the kitchen and said he belonged there, and she believed him.',  effects: { belief: +6, trust: +4 }, say: 'You belong there.', log: 'He said it out loud in an empty room, and slept for nine hours.' },
          { label: 'Enjoy it and expect nothing.', whisper: true, flag: 'expectedNothing',
          memory: 'He went off to the trial expecting nothing, which she thought was sensible.',  effects: { belief: +2, conscience: +2 }, say: 'Just enjoy it.', log: 'He went in without expectations, and came out with a place.' },
          { roll: false, label: 'Put it on the fridge, where she will see it.',
          memory: 'He put the letter on the fridge with a magnet, and she had to look at it all week.', effects: { belief: +1 }, log: 'He put the letter on the fridge with a magnet and went upstairs, and it stayed there all week.' },
        ],
      },
      {
        id: 'the-coach',
        backdrop: 'training',
        witness: 'coach',
        text: (g) => `Day one, and the training ground is smaller than it looks on television: two pitches, a portakabin, a fence somebody has painted badly.

He is the last of eleven boys to arrive and the only one whose kit does not match. ${nameOf(g, 'coach')} — Bramley, forty-one, an ex-semi-professional who played two hundred games in the Conference and mentions it less than you would expect — is a compact man in a club coat with a whistle he clearly enjoys. Twelve minutes in, he stops a session, walks over, and says it to his face rather than to the group.

"You run like you're carrying a wardrobe." He says it without malice, which is worse. "Who taught you to run?"

Nobody answers.

"Right. When we get to the boxes, I want you on the shoulder of the last man, and I want you there early. If you're late, I'll know before you do."

Two of the older boys laugh — the kind of laugh that is not really about the joke. A striker with a shaved head does an impression of it behind the coach's back. The others watch to see what the new lad will do.

${g.name} looks at his boots. The boots look back, enormous, bought by a woman who works nights.

The whistle goes. For the next hour every pass he makes is slightly too careful, and he can feel the morning closing around him like a door.`,
        topics: [
          {
            id: 'askCoachStandard',
            label: 'Ask him what the standard actually is.',
            cast: ['coach'],
            effects: { conscience: +1 },
            flag: 'knowsTheStandard',
            text: () => `Bramley leans on the whiteboard column. "The standard is: can you do it on a Tuesday in February when it's four degrees and nobody's watching."

He taps the column. "Half of these lads can do it in July. That's not a footballer. That's a summer."`,
          },
          {
            id: 'askCoachFuture',
            label: 'Ask him if there is a place here for you.',
            cast: ['coach'],
            effects: { confidence: +2 },
            flag: 'coachSawSomething',
            text: (g) => `He looks at you for a moment longer than he means to.

"Ask me again in six weeks." Then, quieter, so the room behind him does not hear it: "I've seen worse come through that door. Don't tell anyone I said that."`,
          },
        ],
        choices: [
          { label: 'Treat it as a test, not a verdict.', whisper: true, flag: 'tookItAsTest',  effects: { belief: +5, trust: +3 }, say: 'He is testing you. Do not fold.', log: 'He decided it was a test. He was right, and he scored twice before the hour was out.' },
          { label: 'Say something back to the coach.', whisper: true, flag: 'answeredBack',
          memory: 'He answered Bramley back on his first morning, in front of everyone.',  effects: { conscience: -3, belief: +3 }, say: 'Say something back.', log: 'He answered back. The coach liked it. The dressing room did not.' },
          { roll: false, label: 'Get there early tomorrow, before anyone else.', effects: { belief: +2 }, log: 'He was first through the door at half seven, before the lights were on, and did the whole warm-up alone.' },
        ],
      },
      {
        id: 'trial-match',
        backdrop: 'training',
        kind: 'match',
        witness: 'coach',
        text: (g) => `A practice match on the far pitch, bibs against skins, and Bramley watching from the touchline with his arms folded because there is nowhere to sit.

Nobody is keeping score, which is a lie. Everyone is keeping score.

The lad marking him is called Ellis, who is nineteen and has been here two years and plays every one of these like it is the cup final, because for him it is.

The ball comes across, chest high, and there is a moment where he can either take it down and be tidy, or go and win something.`,

        choices: [
          { label: 'Take it down. Keep it.', approach: 'craft', attribute: 'touch', dc: 10, memory: 'He took it down in a practice match like it was a cup final.', effects: { belief: +2 }, flag: 'tidyInTraining', log: 'He killed it dead and laid it back, and Bramley said nothing, which from Bramley is a compliment.' },
          { label: 'Go and win it.', approach: 'bold', attribute: 'power', dc: 12, memory: 'He went in hard on Ellis in a practice match.', effects: { belief: +4 }, flag: 'wonItInTraining', log: 'He got there first and Ellis went over the top of him and landed badly and got up laughing.' },
          { label: 'Play the simple ball.', approach: 'graft', attribute: 'engine', dc: 9, memory: 'He did the dull thing well, all morning.', effects: { conscience: +2 }, log: 'He played it back where it came from and ran the next ten yards, and did it again, and again.' },
        ],
      },
      {
        id: 'the-first-week',
        backdrop: 'training',
        meets: ['coach'],
        witness: 'coach',
        text: (g) => `Five mornings a week now, and the mornings have a shape: in at half seven, boots on the radiator to warm them, the same six lads in the same corner of the changing room.

${nameOf(g, 'coach')} runs the under-18s like a man who has been told twice that his job depends on it. There is a whiteboard with names on it in a column, and being moved up that column is the only currency in the building.

By Thursday ${g.name} is fourth from the top, which is not a compliment, and above a lad called Ellis who has been there since he was nine and has stopped speaking to him.

The sessions are all the same: rondo, shape, a small-sided game where the losing team runs. Nobody explains the rules because everyone already knows them, and not knowing them is the thing that marks you out.`,

        topics: [
          {
            id: 'askEllis',
            label: 'Ask Ellis what he did wrong.',
            cast: ['coach'],
            effects: { conscience: +1 },
            flag: 'ellisToldHim',
            text: () => `Ellis does not look up from lacing his boots.

"Didn't do anything wrong. That's the thing nobody tells you." He pulls the lace tight. "You can do everything right here and still be the one who goes."`,
          },
          {
            id: 'askColumn',
            label: 'Ask what the column on the whiteboard is.',
            cast: ['coach'],
            effects: { belief: +1 },
            flag: 'knowsTheColumn',
            text: () => `"That's the list for Saturday," Ellis says. "Twelve names. Fourteen of us."

He nods at the bottom of it, where a name has been rubbed out and written again. "That's you, by the way. Don't get excited. It gets rubbed out every week."`,
          },
        ],
        choices: [
          { label: 'Ask Ellis what he did wrong.', approach: 'honest', dc: 10, effects: { conscience: +3, trust: +1 }, flag: 'askedEllis', log: 'He asked Ellis, straight out, and Ellis told him, and neither of them enjoyed it.' },
          { label: 'Go quiet. Finish top of the column.', approach: 'graft', dc: 11, effects: { belief: +4, conscience: -2 }, flag: 'climbedTheColumn', log: 'He stopped talking to anyone and by Friday he was second.' },
          { roll: false, label: 'Stay quiet. Learn the building first.', effects: { belief: +1 }, log: 'He kept his head down and learned where everything was.' },
        ],
      },
      {
        id: 'mei-nights',
        backdrop: 'bedroom',
        meets: ['mother'],
        witness: 'mother',
        text: (g) => `Mei gets in at eleven, most nights, from the care home on Osmaston Road where she does the late shift and the personal care and the paperwork nobody counts.

She is forty-four. She left Sham Shui Po in 2003 with two suitcases and a husband who lasted four years, and she has not been back. She keeps her English careful and exact, because she has spent twenty years being corrected and has decided to be the one who is right.

He is still up, because he wants to be, and she sits down at the table without taking her coat off and puts her hands flat on it like she has done all day with somebody else's.

"You know what they said to me at the home today?" she says. "They said, 'Your son's the footballer.' As if I've not been on my feet since two."

She is not angry. That is the thing about her — she says these things in the same voice she uses for the shopping list.

Then she looks at his boots, drying on the radiator, and says the other thing. "You'll not be doing this at thirty-five with your knees and no education. So you take the college day. I don't care what the club says about the schedule."`,

        topics: [
          {
            id: 'askMeiLetter',
            label: 'Ask her what she really thinks of the letter.',
            cast: ['mother'],
            effects: { trust: +2 },
            flag: 'meiWorried',
            text: () => `She dries her hands on the tea towel, which is what she does when she is deciding how honest to be.

"Your father would have signed it before he'd finished reading it." A pause. "I'd like you to be the sort of person who reads it twice."

She hangs the towel back on the rail, exactly straight, the way she does everything.`,
          },
          {
            id: 'askMeiWages',
            label: 'Ask her what the money would mean.',
            cast: ['mother'],
            effects: { conscience: +1 },
            flag: 'knowsTheMoney',
            text: () => `"It would mean the boiler," she says, immediately, and then looks annoyed at herself for being that quick about it.

"It would mean going to see your nan in the spring instead of at Christmas." She turns the tap off. "It's not nothing, that. You don't get to pretend it's nothing."`,
          },
        ],
        choices: [
          { label: 'Promise her the college day.', approach: 'honest', dc: 10, effects: { trust: +4, conscience: +3 }, flag: 'promisedCollege', log: 'He promised her the college day, and wrote it on the back of his hand for a while.' },
          { label: 'Tell her the truth: the club decides now.', approach: 'careful', dc: 11, effects: { conscience: +1, trust: -2 }, flag: 'toldHerClubDecides', log: 'He told her the club decided now. She went to bed without saying goodnight.' },
          { roll: false, label: 'Wash up, so she can sit down.', effects: { conscience: +2 }, log: 'He washed up without being asked, and she sat down for the first time that evening.' },
        ],
      },
      {
        id: 'the-brother',
        backdrop: 'street',
        meets: ['brother'],
        witness: 'brother',
        text: (g) => `Saturday morning, and there is a car outside with the engine running and two people in it he has known since primary school.

${nameOf(g, 'brother')} leans on the horn — not angrily, just once, the way you do when you have been waiting long enough to make a point. The window comes down.

"Two towns over," he says. "Everyone's going. Kieran's got the keys off his dad and he's already lied about it twice."

"There's a session at ten."

"I know there's a session at ten." He says it like a man being reasonable, which is how he always wins arguments. "It's the last one before they decide. So come or don't, but stop standing in the hall like a coat."

The kitchen clock is the loudest thing in the house. Mei is asleep, because she worked until six.

He stands in the hallway with a bag on his shoulder that could mean either thing.`,
        topics: [
          {
            id: 'askBrotherWhy',
            label: 'Ask him why he is really going.',
            cast: ['brother'],
            effects: { conscience: +1 },
            flag: 'knowsBrotherWhy',
            text: (g) => `${nameOf(g, 'brother')} shrugs, then answers properly, which he almost never does.

"Because Kieran's going, and if I don't go I'm the lad who didn't go." He picks at the steering wheel. "You get to be somebody in this town by playing. I get to be somebody by knowing you."

He says it lightly. It is not a light thing to say.`,
          },
          {
            id: 'askBrotherTrial',
            label: 'Ask him what he thinks of the trial.',
            cast: ['brother'],
            effects: { trust: +2 },
            flag: 'brotherBacksHim',
            text: () => `"You'll be fine," he says, and then, because he is your brother and cannot leave it alone: "Two days, though. They'll have forty lads like you and four of them will be any good."

He turns the radio down. "If they say no, you'll still be my brother. That's the whole thing. That's all I'm saying."`,
          },
        ],
        choices: [
          { label: 'Go with his brother.', whisper: true, effects: { trust: +5, belief: -2 }, flag: 'wentWithBrother', say: 'Go with your brother.', log: 'He got in the car. The coach noticed, and said nothing, and noticed.' },
          { label: 'Finish the session.', approach: 'honest', whisper: true, effects: { belief: +4, conscience: +2 }, flag: 'brotherResent', say: 'Finish the session.', log: 'He let the car go. His brother did not ring for three weeks.' },
          { label: 'Let him choose.', approach: 'careful', roll: false, effects: { conscience: +1 }, flag: 'wentWithBrother', log: 'He chose the car, and told himself it did not matter.' },
        ],
      },
      {
        id: 'the-offer',
        backdrop: 'office',
        meets: ['mother'],
        witness: 'mother',
        text: (g) => `Derby County offer him two years. There is a form on the table with his name typed on it, and a pen that has been used by other people before him.

The club man is Farley, the academy director, forty-nine and twice divorced, and he talks about "the pathway" the way a man talks about a road he has never driven. "Two years," he says. "Scholar's terms. We'd want him in full time from July."

${nameOf(g, 'mother')} has the college letter in her hand and the mortgage in her face. She waits until Farley has finished, and then she asks the only question that matters, and she asks it of him, not of Farley.

"And if it doesn't work out?"

Farley says something about education packages. She does not look at him.

The thing nobody puts on the table: if he signs, the exams stop mattering, and if he does not sign, this whole building forgets him by August. He is sixteen. He has been alive for eight thousand days and this is the first one that will be quoted back at him for the rest of his life.

He reads the form twice. It is not long.`,

        topics: [
          {
            id: 'askFarley',
            label: 'Ask Farley what happens if it does not work out.',
            flag: 'askedFarley',
            effects: {},
            text: () => `Farley smiles the way men smile when they have been asked this before.

"There's an education package," he says. "College one day a week. Most lads don't take it up — training's full time and the schedule's unforgiving — but it's there."

He says "it's there" twice, and the second time he is looking at the form rather than at either of them.`,
          },
          {
            id: 'askMotherOffer',
            label: 'Ask her, straight out, what she wants him to do.',
            effects: { trust: +3 },
            flag: 'motherWasHonest',
            text: (g) => `She puts the college letter down and takes a second before she answers, which is not her habit.

"I want you to sign," she says. "And I want you to know that I'd have said the same if it was your sister, and I'd have been wrong then, too."

Then, quieter: "Two years is not very long. Ask them what happens in the second one."`,
          },
          {
            id: 'askSisterOffer',
            cast: ['sister'],
            label: 'Ask your sister what she would do with the money.',
            effects: { conscience: +1 },
            flag: 'sisterPractical',
            text: (g) => `${nameOf(g, 'sister')} does the sums out loud on the back of an envelope, badly, and arrives at a number that is wrong by a factor of ten.

"Doesn't matter," she says, when he tells her. "The point is it's a wage. Nobody in this house has ever had a decision that came with a wage."`,
          },
        ],
        choices: [
          { label: 'Sign it.', whisper: true, effects: { belief: +5, trust: +3 }, flag: 'signedAt16', say: 'Sign it.', log: 'He signed at sixteen. The college letter went in a drawer and stayed there.' },
          { label: 'Finish school first.', whisper: true, flag: 'stayedInSchool',
          memory: 'He said he wanted to finish school first, and she did not argue.',  effects: { conscience: +4, belief: -2 }, say: 'Finish school first.', log: 'He stayed in school. The club kept the door open, just, and never let him forget the hesitation.' },
          { roll: false, label: 'Ask for a day to think about it.', effects: { belief: +1 }, log: 'He asked for a day. Terry said a day was fine, which surprised him more than a no would have.' },
        ],
      },
      {
        id: 'the-first-night',
        backdrop: 'street',
        text: (g) => `The night before the induction, he cannot sleep, so he does what he always does: he lies in the dark and makes a list.\n\nThings he is afraid of, in order. That the others will be faster. That his boots will be noticed. That Mei will have to keep working nights if this does not come off. That he will get what he wants and find out he is ordinary. That he will be here, in this room, at thirty, still making lists.\n\nOutside, a car goes past and someone laughs and a door closes. The house settles.\n\nIn the morning there is a form to hand in and a coach to look in the eye, and none of the list will help with either.`,

        topics: [
          {
            id: 'textBrother',
            label: 'Text him: what is it actually like?',
            cast: ['brother'],
            effects: { trust: +1 },
            flag: 'brotherToldTruth',
            text: () => `The reply takes a while, which is not like him.

"Cold. Fast. Everyone's better than you think and then you get used to it." Then, a second message, four minutes later: "It's alright though. You'll see."`,
          },
          {
            id: 'readList',
            label: 'Read the list again.',
            effects: { conscience: +1 },
            flag: 'readTheList',
            text: () => `It is a list a sixteen-year-old wrote on the back of a school letter, in biro, and it is four lines long.

Be first. Be quiet. Do the basics. Don't look at the stand.

The fourth one is underlined twice.`,
          },
        ],
        choices: [
          { label: 'Let him take the fear with him.', approach: 'graft', whisper: true, flag: 'wentInAfraid',  effects: { belief: +5, trust: +3 }, say: 'Take it with you. Do not wait to stop being afraid.', log: 'He went in afraid and did it anyway. That is most of what courage is.' },
          { label: 'Be someone else in there.', approach: 'craft', whisper: true, flag: 'builtPersona',  effects: { belief: +3, conscience: -2 }, say: 'In there, be someone else.', log: 'He built a version of himself for the building. It worked, and it cost something.' },
          { roll: false, label: 'Text his brother instead.', effects: { belief: +1 }, log: 'He texted his brother from the corridor and got an answer in four seconds, and it helped more than the list did.' },
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
        backdrop: 'tunnel',
        witness: 'manager',
        text: (g) => `Derby County, League One, a Tuesday in August, away at Burton Albion in the League Cup first round.

The Pirelli holds six thousand and there are four thousand in it. The manager, Hughes, reads the team out in a room with a tactics board and a smell of deep heat, and ${g.name} hears his own name go in at number eleven, and the room does the thing rooms do — one or two lads look up, most do not.

In the tunnel the concrete is wet and the Burton end is already singing something about Derby that rhymes with "county". The captain, Vaughan, thirty-four and going bald, tells him to keep his head up, and means it in the way men with eight months left of this mean things.

Ten minutes in he miscontrols a pass and the home crowd makes that noise — not a boo exactly, a collective intake of breath, the sound of people revising an opinion.

By half-time he has touched the ball four times and it is 0-0.`,

        choices: [
          { label: 'Play like he is unknown.', whisper: true, effects: { belief: +6 }, say: 'Play like nobody knows you.', log: 'He played like nobody knew him. They know him now.' },
          { label: 'Be selfish — shoot.', whisper: true, effects: { belief: +3, conscience: -2 }, say: 'Shoot whenever you can.', log: 'He shot from everywhere. One went in.' },
          { label: 'Let the noise be the noise.', effects: {}, log: 'He had a quiet debut. Nobody remembers it.' },
        ],
      },
      {
        id: 'match-day',
        backdrop: 'firstteam',
        kind: 'match',
        witness: 'manager',
        text: (g) => `Derby County against Nottingham Forest. League One, Saturday, twenty past three, and the ground is full in a way it is only ever full for this.

Forest are top and Derby are eleventh. The full-back opposite him is called Aden Childs, he is thirty-one, he has played two hundred games in this division, and he talks the whole time — to the referee, to his centre-half, to ${g.name}, who he has decided is a boy.

It is 0-0 in the seventy-first minute. The ball arrives at his feet with Childs already committed, and there is a decision to make in about a third of a second.

The bench is up. ${nameOf(g, 'coach')} has his hands out of his pockets for the first time all season.${formLine(g) ? `\n\n${formLine(g)}` : ''}`,

        choices: [
          { label: 'Go at him. Take the outside.', approach: 'bold', memory: 'He took on a full-back twenty years older and went past him.', attribute: 'power', dc: 12, effects: { belief: +7, trust: +3 }, flag: 'tookOnFullBack', say: '', log: 'He went outside him, and the ground made a noise he had only heard on television.' },
          { label: 'Play the pass. Someone is arriving.', approach: 'honest', memory: 'He played the pass nobody else in the ground saw.', attribute: 'vision', dc: 11, effects: { belief: +4, trust: +5, conscience: +2 }, flag: 'playedThePass', log: 'He played it first time into the runner, and the move ended in a corner and a pat on the head.' },
          { label: 'Keep it. Slow it down.', approach: 'careful', memory: 'He turned back and kept the ball, and the crowd groaned.', attribute: 'touch', dc: 10, effects: { belief: +2, conscience: +1 }, flag: 'keptIt', log: 'He kept it, turned back, and the crowd groaned at a safe pass.' },
        ],
      },
      {
        id: 'two-countries',
        backdrop: 'pressroom',
        if: (g) => Boolean(g.secondNation),
        text: (g) => `Two federations write in the same week. ${g.nation} have watched him since he was fifteen. ${g.secondNation || 'The other country'} have a grandmother on file and a coach who rings his father directly.\n\n"Can you play for both?" he says, to the room, to nobody. "What do I say?"`,
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
          { roll: false, label: 'Say nothing. It is his family, not yours.', effects: { conscience: -1 }, flag: 'delayedNation', log: 'He decided alone, and told you afterwards.' },
        ],
      },
      {
        id: 'first-drink',
        backdrop: 'street',
        text: () => `The senior lads are out and it is the third time this month, and the third time is the one that matters, because the first two could be politeness and this one is a test.\n\nThere is a car outside with the window down and a song playing out of a phone, and the physio has already gone home so nobody official exists between now and Sunday.\n\nHe is nineteen. The wage is £900 a week and appears on his statement under the word "remuneration", which sounds to him like a joke somebody else is in on.\n\nHis hand is on the door handle. In the kitchen his tea is going cold and there is a note on the fridge from Mei that says SEE YOU SUNDAY.`,
        choices: [
          { label: 'Go home.', whisper: true, effects: { conscience: +4, trust: +2 }, flag: 'wentHome', say: 'Go home.', log: 'He went home. They noticed.' },
          { label: 'One night is fine.', whisper: true, effects: { conscience: -4, belief: +2 }, flag: 'stayedOut', say: 'One night will not hurt.', log: 'He stayed out until four and trained badly for a week.' },
          { roll: false, label: 'Say nothing.', effects: { conscience: -2 }, flag: 'stayedOut', log: 'He went. Nobody stopped him.' },
        ],
      },
      {
        id: 'the-agent',
        backdrop: 'office',
        meets: ['agent'],
        witness: 'agent',
        text: () => `The man in the good coat is called Terry Vance. He has a car that is not leased, which in this car park is basically a reference, and a watch that is doing the same work.\n\nHe talks for forty minutes. Ten per cent. A driver when needed. An "introduction" to a club he will not name but describes by its stand. He says the word "project" eleven times and never once says what the project is.\n\nThe club's own man is cheaper and duller and has never bought anybody a coffee, and the captain says, without looking up from his boots, that the good coat will be there in a year too.\n\nHe has until Friday. He has never negotiated anything more complicated than a phone contract.`,
        topics: [
          {
            id: 'askCaptain',
            cast: ['captain', 'agent'],
            label: 'Ask the captain what he knows about Terry.',
            flag: 'captainOnTerry',
            effects: { conscience: +1 },
            text: (g) => `The captain does not look up from his boots.

"Terry?" he says. "Terry took thirty per cent off a lad here in 2014. Lad never played again, and Terry still sends him a Christmas card."

He laces the boot, and then, because he is not a cruel man: "That's not a reason not to sign. It's a reason to read it twice."`,
          },
          {
            id: 'askMother',
            label: 'Ring your mother about it.',
            effects: { trust: +2 },
            flag: 'motherOnContract',
            text: (g) => `She listens to all of it without interrupting, which is her way of taking something seriously.

"Don't sign anything today," she says. "Not because he's a bad man. Because they'll still be there tomorrow and you won't get the money back if it's wrong."`,
          },
          {
            id: 'readContract',
            label: 'Read the contract properly.',
            flag: 'readTheContract',
            text: () => `Ten per cent, and it says "of gross" in a font two points smaller than everything else on the page.

Three years of exclusivity, which means any club that rings him rings Terry first. There is a line about expenses and a line about termination and no line at all about what happens if Terry stops returning calls.`,
          },
        ],
        choices: [
          { label: 'Sign — money is real.', whisper: true, effects: { trust: -2, conscience: -3 }, flag: 'sharkAgent', say: 'Take it. Money is real.', log: 'He signed with the man in the good coat.' },
          { label: 'Wait a year.', whisper: true, effects: { trust: +5, conscience: +3 }, say: 'Wait a year.', log: 'He waited. The good coat went elsewhere.' },
          { label: 'Let him decide.', effects: { conscience: +1 }, flag: 'sharkAgent', log: 'He signed the same week.' },
        ],
      },
      {
        id: 'hide-it',
        backdrop: 'training',
        text: () => `The knee has been swelling since November and by Thursday it is the size of a fist. The physio drains it, tapes it, and uses the word "manage", which is a word people use when they have stopped hoping something will fix itself.\n\nThere is a cup tie in nine days. There is also, in the stand, a man from a club two divisions up with a seat number and a notebook, and everybody in the building knows he is coming.\n\nRest means missing it. Playing means the knee remembers this season for the next fifteen years.\n\nHe is nineteen, so the arithmetic feels obvious to him and does not feel obvious to the physio.`,
        choices: [
          { label: 'Rest it.', whisper: true, effects: { conscience: +5, belief: -2 }, flag: 'restedKnee', say: 'Rest it.', log: 'He rested. He missed the cup tie.' },
          { label: 'Strap it and play.', whisper: true, effects: { belief: +4, conscience: -4 }, flag: 'hidInjury', say: 'Strap it and play.', log: 'He played. The scout wrote his name down.' },
          { roll: false, label: 'Say nothing.', effects: { conscience: -1 }, flag: 'hidInjury', log: 'He played, because nobody told him not to.' },
        ],
      },
      {
        id: 'the-interview',
        backdrop: 'pressroom',
        meets: ['reporter'],
        witness: 'reporter',
        text: (g) => `The reporter is Rachel Dunn, twenty-three, local, and has been sent to do a piece about the academy because the first team lost on Saturday.\n\nShe asks where he is from. She asks whether he thinks he has made it, and he laughs at the corridor ceiling, which is the wrong thing to do on camera.\n\n${g.flags.sharkAgent ? 'Terry has left him three bullet points on a card. They are not lies exactly — they are the truth with the interesting parts removed.' : 'There is nobody behind her to tell him what to say, and no card in his pocket, and he can hear his own voice coming back off the corridor.'}\n\nIt will run on Thursday. People he has not spoken to in years will send it to each other.`,
        choices: [
          { label: 'Be honest.', whisper: true, effects: { conscience: +4, trust: +3 }, flag: 'honestInterview', say: 'Tell them the truth.', log: 'He told the truth about the estate. It went everywhere.' },
          { roll: false, label: 'Say nothing at all.', whisper: true, effects: { conscience: -1, belief: +1 }, say: 'Give them nothing.', log: 'He gave them clichés. They printed them.' },
          { roll: false, label: 'Stay out of it.', effects: {}, log: 'He answered on his own. It was fine.' },
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
        backdrop: 'injury',
        meets: ['physio'],
        witness: 'physio',
        text: (g) => `${g.flags.hidInjury ? 'He has been strapping this knee since he was nineteen and telling everybody it was fine, and the scan has an opinion about that.\n\n' : ''}The room has a light box on the wall and a poster about hamstrings that somebody has had since 2011.\n\nThe consultant is called Mr Okafor and he is kind in the way of people who do this forty times a week. He turns the light box on and points at the white line with the end of a pen.

"That's your anterior cruciate," he says. "It's gone. Not torn — gone." He says it without drama, which is somehow worse. "We can reconstruct it. You'd be walking in a fortnight and running in five months, and back on a pitch in nine if everything behaves."

"And if it doesn't?"

"Then we do it again," he says, "and you lose another year." He clicks the pen. "You're twenty-three. I'd take the surgery. But it's your knee and your year, so it's your call, and I'll do either." \n\nNobody in the room is looking at the scan. They are all looking at him, and he is looking at the poster about hamstrings.\n\nHe is twenty-three. He has played forty-one professional games and he was, until approximately four minutes ago, going to be worth something.`,
        choices: [
          { label: 'He will come back.', whisper: true, effects: { belief: +8, trust: +4 }, say: 'You will come back from this.', log: 'He wrote it on the back of his hand and read it every morning for a year.' },
          { label: 'The truth — it might not be the same.', whisper: true, effects: { belief: -6, trust: +6, conscience: +3 }, say: 'It might not be the same. I am sorry.', log: 'He heard the truth and hated it, and repeated it to himself in month six.' },
          { roll: false, label: 'Say nothing.', effects: { belief: -8 }, log: 'Nobody said anything. He stared at the screen.' },
        ],
      },
      {
        id: 'training-block',
        backdrop: 'trial',
        kind: 'training',
        witness: 'physio',
        text: (g) => `Week nine of the rehab, and the session is the same as week eight: cones, a rubber band, and a physio who counts out loud.

${nameOf(g, 'physio')} has a clipboard and the face of a man who has done this four hundred times. "Same again," he says. "Unless you want to tell me something."

The knee is not right. It is not wrong either. It is the kind of not-right that a footballer talks himself out of in a car park.

There is an hour of this left, and then a pool session nobody will watch.`,
        choices: [
          { label: 'Push it. Find the edge today.', approach: 'bold', attribute: 'power', dc: 12, effects: { belief: +6, conscience: -3 }, flag: 'pushedRehab', log: 'He pushed past the point the clipboard allowed, and the knee held, and the physio said nothing.' },
          { label: 'Do the work exactly as written.', approach: 'careful', attribute: 'composure', dc: 10, effects: { belief: +3, trust: +3, conscience: +2 }, flag: 'didTheWork', log: 'He did the session exactly as written, all of it, and went home.' },
          { label: 'Stay late on the ball instead.', approach: 'craft', attribute: 'touch', dc: 11, effects: { belief: +4, trust: +1 }, flag: 'stayedLate', log: 'He stayed an hour after the physio left and worked on his left foot in the dark.' },
        ],
      },
      {
        id: 'the-dark',
        backdrop: 'street',
        text: (g) => `Month four, and the flat is dark at two in the afternoon.\n\nThere are three letters from the club on the mat, unopened, and two from the hospital, and one from a company that wants to know about his car finance. The bins are full. Somebody has left a plate by the sink with something on it that is no longer food.\n\nHe has not answered Mei for eleven days. He knows the number of days. He counts them the way you count laps.\n\n${hookLine(g.origin, 'money') || hookLine(g.origin, 'mind')}`,
        choices: [
          { label: 'Ring Mei.', whisper: true, effects: { belief: +5, conscience: +5 }, flag: 'calledMother', say: 'Call your mother.', log: 'He called her. She drove up that night.' },
          { label: 'Push through alone.', whisper: true, effects: { belief: -4, conscience: -3 }, flag: 'pushedAlone', say: 'Get through it on your own.', log: 'He got through it alone, and it cost him something.' },
          { roll: false, label: 'Say nothing. Let him sink or stand.', effects: { belief: -6 }, log: 'He sank for a while. Then he stood up on his own.' },
        ],
      },
      {
        id: 'the-pills',
        backdrop: 'injury',
        meets: ['physio'],
        witness: 'physio',
        text: () => `The physio is Ian Meacham, fifty-six, eighteen years at this club and a photograph on the wall of him taping somebody's ankle in 2011. He does not look like a man offering a nineteen-year-old anything illegal. That is what makes it hard.\n\nHe puts a strip of tablets on the table between them and does not look up. "Everyone does it. You'll be back in six weeks instead of twelve. They don't test here."\n\nThe tablets are white and small and unremarkable, and the room smells of strapping and Dettol and somebody's lunch.\n\nHe looks at the door. Then at the tablets. Then, for a while, at nothing.`,
        choices: [
          { label: 'Refuse.', whisper: true, effects: { conscience: +8, trust: +4 }, flag: 'refusedPills', say: 'Do not take them.', log: 'He pushed them back across the table.' },
          { label: 'Nobody would ever know.', whisper: true, effects: { belief: +3, conscience: -10 }, flag: 'tookPills', say: 'Nobody would know.', log: 'He took them. He was back in seven weeks.' },
          { roll: false, label: 'Say nothing.', effects: { conscience: -4 }, flag: 'tookPills', log: 'He took them, because nobody said no.' },
        ],
      },
      {
        id: 'the-return',
        backdrop: 'training',
        text: () => `Fifteen months after the scan, he plays for the reserves on a Tuesday in February in front of forty-one people and a dog.\n\nNinety minutes of a game that means nothing, against a team from a town he has never heard of, on a pitch that has been cut too short.\n\nThe first fifty-fifty comes in the ninth minute. He sees it early, the way you are taught to, and there is a fraction of a second where the whole body asks a question about the knee.\n\nHe goes in with his eyes open.`,
        choices: [
          { label: 'Take his time.', whisper: true, effects: { belief: +4, conscience: +3 }, say: 'Take your time.', log: 'He took his time. He finished the ninety.' },
          { label: 'Go and win it.', whisper: true, effects: { belief: +6, conscience: -2 }, say: 'Go and win it.', log: 'He went in hard, and won it, and got up.' },
          { roll: false, label: 'Say nothing.', effects: {}, log: 'He played within himself.' },
        ],
      },
      {
        id: 'the-comeback-game',
        backdrop: 'firstteam',
        kind: 'match',
        witness: 'manager',
        text: (g) => `Nine months after the scan, a reserve game on a Tuesday afternoon in front of two hundred people and a dog.

The pitch is heavy. His knee is strapped. The physio has told him forty-five minutes, no more, and has told the manager the same thing in a different tone of voice.

The first time he goes into a challenge he hears himself decide to do it, which is not how it used to be.`,

        choices: [
          { label: 'Go into the first one properly.', approach: 'bold', attribute: 'power', dc: 13, memory: 'He went into a challenge nine months after a reconstruction.', effects: { belief: +6 }, flag: 'trustedTheKnee', log: 'He went in and it held, and something in his chest let go that had been tight since March.' },
          { label: 'Play within himself.', approach: 'careful', attribute: 'composure', dc: 10, memory: 'He protected the knee and did the simple things.', effects: { belief: +2, conscience: +2 }, log: 'He kept it simple, passed and moved, and got to forty-five minutes without a scare.' },
          { label: 'Ask to stay on.', approach: 'honest', attribute: 'engine', dc: 12, memory: 'He argued with the physio about forty-five minutes.', effects: { belief: +4 }, flag: 'stayedOnPast45', log: 'He told the physio he was fine, which was a lie, and played seventy minutes, which was not.' },
        ],
      },
      {
        id: 'the-mirror',
        backdrop: 'injury',
        text: () => `The rehab room has a mirror along one wall, because the physios need to watch the knee, and so for two hours a day he watches himself do something badly.\n\nA year ago he could not walk up a slope. Last week he could not jump. Today he can hop ten metres without holding the bar, and it feels like being six years old in a car park with a whistle.\n\nIn the mirror he is thinner than he has ever been, and his face has gone the way faces go when nothing happens for a year. There is nobody else in the room to explain it to. There is only the version of himself on the other side of the glass, doing the same thing at the same time, and he has started talking to it, out loud, the way people do when they are alone for long enough.`,
        choices: [
          { label: 'Tell the mirror the truth: he might not come back.', whisper: true, effects: { belief: +6, trust: +5, conscience: +3 }, say: 'You might not come back the same. Do it anyway.', log: 'He said it to the glass, and then he hopped twenty metres.' },
          { label: 'Tell the mirror it will all be worth it.', whisper: true, effects: { belief: +3, conscience: -2 }, say: 'It will all be worth it.', log: 'He told himself it would be worth it. Some days it is.' },
          { roll: false, label: 'Say nothing. Let the mirror stay a mirror.', effects: { belief: -3 }, log: 'He finished the session without saying a word to anyone.' },
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
        backdrop: 'office',
        witness: 'agent',
        text: (g) => `The offer arrives as a PDF on a Sunday, which is how these things always arrive, and the number on it is the sort of number that makes a room go quiet.\n\nDouble the money. A club that finishes in the top four most years. A bench that is warmer than the one he has, and a manager who has already said the phrase "squad rotation" in a tone that means something else.\n\nHis agent says it is a no-brainer, and uses that phrase, and then says it again.\n\nHe is ${g.age}. He has one move of this size left in him. Somewhere in the house his phone is face-down on the arm of a chair and has been for an hour.`,
        choices: [
          { label: 'Take it.', whisper: true, effects: { belief: +5, conscience: -2 }, flag: 'tookBigMove', say: 'Take it.', log: 'He took the move. He won things. He also sat down a lot.' },
          { label: 'Stay where he is loved.', whisper: true, effects: { trust: +6, conscience: +3 }, flag: 'stayedLoyal', say: 'Stay where you are loved.', log: 'He stayed. They sang his name for four more years.' },
          { roll: false, label: 'Say nothing. It is his life.', effects: {}, flag: 'stayedLoyal', log: 'He stayed, quietly, without being told.' },
        ],
      },
      {
        id: 'the-brother-returns',
        backdrop: 'street',
        witness: 'brother',
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
        backdrop: 'dressing',
        meets: ['captain', 'kid'],
        witness: 'captain',
        text: (g) => `${g.flags.answeredBack ? 'He has a reputation in this building for answering back, which means the room will be watching him more closely than it watches anyone else this morning.\n\n' : ''}The captain has been doing it for weeks and it has got worse, and today it happens in the changing room with the door open so that the corridor can hear.\n\nThe young player — nineteen, from the under-23s, called up because of an injury — is doing the thing that people do when they are being laughed at, which is standing very still and pretending to look for something in his bag.\n\nThe captain is Vaughan — thirty-four, eight months left on his contract, a man who has decided that being feared is the same as being respected. He has been doing this to somebody every season for nine years, and the room has always let him.

"Problem?" Vaughan says, without turning round. Two of the senior players are laughing. One is not. The kit man has left the room.\n\nEverybody is waiting to see what the senior players will do, and everybody in the room knows that the senior players are waiting to see the same thing.`,
        topics: [
          {
            id: 'askVaughan',
            label: 'Ask Vaughan what the kid did.',
            cast: ['captain'],
            effects: { conscience: +1 },
            flag: 'askedVaughan',
            text: () => `Vaughan does not look up. "Nothing. He's nineteen and he's got a good engine and he's sitting in my seat."

He laces the boot. "You want to know what he did? He came in here and he was better than me on Tuesday. That's what he did."`,
          },
          {
            id: 'askRoom',
            label: 'Ask the room what they think of it.',
            cast: ['captain', 'kid'],
            effects: { conscience: +2 },
            flag: 'askedTheRoom',
            text: () => `Nobody answers at first. Then the kit man, who is not supposed to be part of this, says it from the doorway without turning round.

"It's been like this since he got the armband."

Vaughan hears it. Everyone hears it. The kit man picks up the bag and goes.`,
          },
        ],
        choices: [
          { label: 'Say something now, in front of all of them.', whisper: true, effects: { conscience: +6, trust: +3 }, flag: 'spokeUp', say: 'Say it now, in the room.', log: 'He said something. The room went quiet, and stayed quiet.' },
          { roll: false, label: 'Say nothing now. Find the kid afterwards.', whisper: true, effects: { conscience: +4, belief: +1 }, flag: 'quietWord', say: 'Not in the room. Find him after.', log: 'He found the kid in the car park and told him it was not about him.' },
          { label: 'Take it to the manager.', whisper: true, effects: { conscience: +3, trust: -3 }, flag: 'wentToManager', say: 'Take it upstairs.', log: 'The manager had a word with the captain. The captain knew where it had come from.' },
          { label: 'Make the room laugh, on his terms.', whisper: true, requires: { presence: 6 }, effects: { conscience: +3, trust: +5 }, flag: 'defusedRoom', say: 'Take the air out of it. Make them laugh with you, not at him.', log: 'He said one thing, quietly, and the room laughed with him instead of at the kid.' },
          { roll: false, label: 'Not his fight. Not his room.', effects: { conscience: -4 }, log: 'Nobody said anything, and it kept happening.' },
        ],
      },
      {
        id: 'the-first-derby',
        backdrop: 'move',
        kind: 'match',
        witness: 'manager',
        text: (g) => `The derby, away, and the away end has been on its feet since the teams came out.

It is the kind of ground where the corner flags look too close. Everything is quick here, quicker than he is used to, and for twenty minutes he is a spectator in his own match.

Then the ball comes to him on the halfway line with space in front and the whole stand behind him deciding what kind of player he is going to be.${formLine(g) ? `\n\n${formLine(g)}` : ''}`,

        choices: [
          { label: 'Run at them.', approach: 'bold', attribute: 'power', dc: 14, memory: 'He ran at them in a derby, on his own.', effects: { belief: +7, trust: +3 }, flag: 'ranTheDerby', log: 'He went past two of them and the third one took him down and got booked, and the away end sang his name.' },
          { label: 'Find the runner.', approach: 'craft', attribute: 'vision', dc: 12, memory: 'He found the pass in a derby nobody else saw.', effects: { belief: +4, trust: +4 }, flag: 'derbyAssist', log: 'He slid it between the centre-half and the full-back and the runner did the rest.' },
          { label: 'Keep it. Take the sting out.', approach: 'careful', attribute: 'composure', dc: 11, memory: 'He slowed a derby down and kept his head.', effects: { conscience: +3 }, log: 'He kept it, turned back, took the throw, and the game settled into something he could play.' },
        ],
      },
      {
        id: 'the-scandal',
        backdrop: 'pressroom',
        text: (g) => g.flags.tookPills
          ? `A journalist has the physio's records from ${g.age - 6} years ago. The tablets. The seven-week return. She rings for comment.`
          : `The Sun has a story about a night out in Nottingham that ended badly. It is exaggerated but not invented, and Rachel Dunn rings the club for comment at ten past nine on a Tuesday.`,
        choices: [
          { label: 'Front up and apologise.', whisper: true, effects: { conscience: +6, trust: +3 }, flag: 'frontedUp', say: 'Tell them the truth and apologise.', log: 'He fronted up. It was over in a week.' },
          { label: 'Deny everything.', whisper: true, effects: { conscience: -7, belief: +2 }, flag: 'deniedScandal', say: 'Deny it.', log: 'He denied it. It followed him for years.' },
          { roll: false, label: 'Say nothing.', effects: { conscience: -3 }, flag: 'deniedScandal', log: 'His people handled it. Badly.' },
        ],
      },
      {
        id: 'the-clause',
        backdrop: 'office',
        witness: 'agent',
        text: () => `Contract talks happen in a room with a long table and a jug of water nobody drinks, and are conducted almost entirely by two men who enjoy this.\n\nHis agent wants the money up front. The club wants a clause: a percentage of any future sale, which sounds like a technicality and is in fact the difference between a good career and a fortune.\n\nThe page with the clause on it is page eleven. Nobody puts page eleven in front of a footballer without hoping he will not read it properly.\n\nHe has a pen in his hand and a pen is a decision.`,
        choices: [
          { label: 'Protect the clause.', whisper: true, effects: { conscience: +4 }, flag: 'smartClause', say: 'Read the clause. Protect yourself.', log: 'He kept the sell-on. It paid out years later.' },
          { label: 'Take the cash now.', whisper: true, effects: { belief: +2, conscience: -3 }, flag: 'tookCash', say: 'Take the money.', log: 'He took the cash. The clause went to the club.' },
          { roll: false, label: 'Say nothing about money.', effects: {}, log: 'He signed what his agent put in front of him.' },
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
        backdrop: 'dressing',
        meets: ['manager'],
        witness: 'manager',
        text: (g) => g.flags.tookBigMove
          ? `He is thirty-two and the club that bought him has bought a twenty-three-year-old from Portugal. He has started four games this season.`
          : `He is thirty-two and the legs are a half-second late. The manager tells him, kindly, that he is now a squad player.`,
        choices: [
          { label: 'Learn to play again, differently.', whisper: true, effects: { belief: +5, trust: +3 }, flag: 'reinvented', say: 'Learn a new position. You have two years left and you can spend them well.', log: 'He learned to play deeper. It bought him two more years.' },
          { roll: false, label: 'Let it be true. The legs have gone.', effects: { belief: -4, conscience: +1 }, flag: 'acceptedDecline', log: 'He accepted it, and the lads liked him more for it than he expected.' },
        ],
      },
      {
        id: 'the-kid',
        backdrop: 'dressing',
        meets: ['kid'],
        witness: 'kid',
        text: () => `The new lad is Ellis Mott, seventeen, signed from the under-18s in the summer, and he has been given the shirt number. He is doing the thing that new lads do, which is arriving early and being polite and trying not to look at anybody's legs.\n\nHe is in the same seat, in the same corner of the same changing room, doing the same nervous things with his socks.\n\nIt is like watching a recording of himself at that age, except that this one has better boots and a worse haircut.

"Are you going to be here next season?" Ellis asks, and then goes red, because it is not a question you are allowed to ask.

"Depends," he says, "on whether you keep taking my shirt." \n\nThe squad are watching to see how the old one behaves, because that is how these things are decided.`,
        choices: [
          { label: 'Help the kid.', whisper: true, effects: { conscience: +7, belief: +2 }, flag: 'mentoredKid', say: 'Help him.', log: 'He took the kid under his wing. The kid remembers it to this day.' },
          { label: 'Freeze the kid out.', whisper: true, effects: { conscience: -6, belief: +1 }, say: 'Make him earn it the hard way.', log: 'He froze the kid out. The kid never forgave him.' },
          { label: 'Let the dressing room sort itself.', effects: {}, log: 'Nothing was said. Nothing changed.' },
        ],
      },
      {
        id: 'the-body',
        backdrop: 'injury',
        text: (g) => g.flags.hidInjury
          ? `The knee he strapped at nineteen has opinions now. Some mornings he cannot bend it before nine o'clock, and the specialist has used the word "manage".`
          : `Afternoons, his back seizes. The medical staff have stopped using the word "recovery" and started using "management".`,
        choices: [
          { label: 'Go while he can still walk.', whisper: true, effects: { conscience: +4, belief: +2 }, flag: 'retiredEarly', say: 'Stop now, while it is your choice.', log: 'He set a date. He went out on his own terms.' },
          { label: 'Keep playing anywhere.', whisper: true, effects: { belief: +3, conscience: -2 }, flag: 'keptGoing', say: 'Play as long as anyone will have you.', log: 'He went abroad for two more seasons. The money was good. The football was not.' },
          { roll: false, label: 'Say nothing.', effects: {}, flag: 'keptGoing', log: 'He kept going until nobody called.' },
        ],
      },
      {
        id: 'the-farewell',
        backdrop: 'firstteam',
        meets: ['mother'],
        text: () => `The testimonial is on a Sunday in May against a team of old friends, and the club has printed a programme with two photographs on the cover: him at nineteen, all wrists and bad skin, and him at thirty-three.\n\nMei is flying in. She has told everybody on Osmaston Road.\n\nIn the tunnel, the ground staff — men he has nodded at twice a week for eleven years and never once asked the names of — are lined up in club polo shirts.\n\nSomebody hands him a microphone. The crowd stops talking in that way a crowd does when it is about to be asked to feel something.`,
        choices: [
          { label: 'Say thank you properly.', whisper: true, effects: { trust: +5, conscience: +4 }, flag: 'gracefulFarewell', say: 'Thank the people who came.', log: 'He thanked the ground staff by name. The room stood up.' },
          { label: 'Skip the fuss.', whisper: true, effects: { conscience: -3, belief: +1 }, say: 'Skip it. It is a circus.', log: 'He skipped it. The club never quite forgave him.' },
          { roll: false, label: 'Say nothing.', effects: {}, log: 'He came, said little, and left early.' },
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
        backdrop: 'firstteam',
        meets: ['manager'],
        witness: 'manager',
        text: (g) => `It is the last home game of the season and everybody in the ground knows what it is, even though nobody has said it.\n\nHis name is on the bench. The manager looks at him once during the warm-up and then looks away, which is his way of saying it is up to him.\n\nAt seventy-one minutes the fourth official puts the board up. His number. The ground stands up before the board is even legible.\n\nThere are eleven minutes left of the thing he has done since he was six years old.`,
        choices: [
          { label: 'Go on. Take the eleven minutes.', whisper: true, effects: { belief: +6, conscience: +2 }, flag: 'playedLastGame', say: 'Go on. You will want to have done it.', log: 'He went on for eleven minutes and touched the ball four times and the ground sang his name.' },
          { label: 'Stay on the bench. Let the last one be the good one.', whisper: true, effects: { belief: +2, conscience: +4 }, flag: 'watchedFromBench', say: 'Let it end on the good one.', log: 'He stayed seated. The manager understood, and the crowd did not.' },
          { label: 'Ask for the ball. Take the shot.', whisper: true, requires: { composure: 6 }, effects: { belief: +7, conscience: +1 }, flag: 'tookTheShot', say: 'Ask for it. Take the shot.', log: 'He asked for it, and took it, and the ground made a noise he will hear for the rest of his life.' },
          { label: 'Tell him it does not matter.', effects: { belief: -2 }, log: 'He shrugged and stayed where he was, and the eleven minutes went by without him.' },
        ],
      },
      {
        id: 'the-testimonial',
        backdrop: 'firstteam',
        kind: 'match',
        witness: 'captain',
        text: (g) => `A testimonial, in the end, because the club offered and he did not have it in him to say no.

Half the ground is full. The away team has agreed to a gentle first half and does not honour it.

He is thirty-four, and for ninety minutes he is exactly as good as he was, which is the cruellest thing the body does.`,

        choices: [
          { label: 'Play it properly.', approach: 'bold', attribute: 'power', dc: 12, memory: 'He played his own testimonial like a league game.', effects: { belief: +6 }, log: 'He played it properly and scored, and the ground sang his name one last time and he did not look up.' },
          { label: 'Tell them the club should be built around him.', approach: 'bold', attribute: 'power', dc: 13, needs: { goals: 6 }, memory: 'He told a room full of men to build the club around him.', effects: { belief: +8, conscience: -2 }, flag: 'askedToBeTheTeam', log: 'He said it out loud in a room with the chairman in it, and nobody laughed.' },
          { label: 'Give the ball to the kid.', approach: 'honest', attribute: 'vision', dc: 11, memory: 'He spent his testimonial setting up a nineteen-year-old.', effects: { conscience: +4, belief: +3 }, flag: 'gaveItToTheKid', log: 'He spent the second half giving it to the nineteen-year-old on the left, who scored twice and will remember it forever.' },
          { label: 'Take it all in.', approach: 'careful', attribute: 'composure', dc: 9, memory: 'He stood in the middle of his own testimonial and listened.', effects: { belief: +2, conscience: +4 }, flag: 'tookItIn', log: 'He walked slowly, listened to the noise, and did not pretend it was a normal game.' },
        ],
      },
      {
        id: 'retirement',
        backdrop: 'bedroom',
        text: (g) => `He announces it on a Tuesday, in a statement shorter than his first contract. That evening he sits in the garden with his phone face-down and says, out loud, to nobody: "What now?"`,
        choices: [
          { label: 'Coach.', whisper: true, effects: { belief: +5, conscience: +3 }, flag: 'wentIntoCoaching', say: 'Teach it to someone else.', log: 'He took his badges. He is good at it.' },
          { label: 'Leave football entirely.', whisper: true, effects: { belief: +2, conscience: +2 }, flag: 'leftFootball', say: 'Leave it behind.', log: 'He did not watch a match for two years.' },
          { roll: false, label: 'Say nothing.', effects: {}, log: 'He drifted for a while, then found something.' },
        ],
      },
      {
        id: 'the-last-good-game',
        backdrop: 'firstteam',
        kind: 'match',
        witness: 'manager',
        text: (g) => `His back goes in the warm-up. Not dramatically — it goes the way it goes at thirty-two, quietly, halfway through a stretch.

He plays anyway, because it is April and there are six games left and he can feel the whole thing ending.

For an hour he is the best player on the pitch. He knows it while it is happening, which is the strange part.`,

        choices: [
          { label: 'Play until it goes.', approach: 'bold', attribute: 'power', dc: 14, memory: 'He played an hour on a back that had already gone.', effects: { belief: +6 }, flag: 'playedThroughTheBack', log: 'He played until the seventy-eighth minute and then could not turn, and came off to an ovation he pretended not to hear.' },
          { label: 'Manage it. Pick his moments.', approach: 'craft', attribute: 'vision', dc: 12, memory: 'He picked his moments and made them count.', effects: { belief: +4, conscience: +2 }, flag: 'managedTheBack', log: 'He stopped running for the sake of it and only moved when it mattered, and it mattered three times.' },
          { label: 'Tell the bench early.', approach: 'honest', attribute: 'composure', dc: 10, memory: 'He told them his back had gone before kick-off.', effects: { conscience: +3, belief: -2 }, flag: 'toldTheBench', log: 'He told them before kick-off and they played him anyway, and he lasted fifty minutes.' },
        ],
      },
      {
        id: 'the-garden',
        backdrop: 'garden',
        text: (g) => `${g.name} is thirty-six and the garden is small and there is a football under the hedge that has been there since the children next door lost it in the summer.\n\nHe does not sit down. He stands in the middle of the lawn the way he used to stand at the edge of the box, waiting for something to be delivered, and the evening does not deliver it.\n\nOn the phone earlier Mei asked whether he was all right, and he said yes, in the tone that makes people stop asking. Somewhere in the house a kettle goes on and a voice he loves says something to somebody else.\n\nHe picks up the ball. It is flat. He holds it anyway.`,
        choices: [
          { label: 'He did it himself. All of it.', whisper: true, effects: { belief: +8, trust: +4 }, say: 'You did all of this yourself.', log: 'He put the ball back under the hedge and went inside, and slept.' },
          { label: 'He was never alone in any of it.', whisper: true, effects: { trust: +6, conscience: +3 }, say: 'You were never on your own. Not once.', log: 'He stood in the dark for a while, and it was not a sad sort of standing.' },
          { roll: false, label: 'Say nothing. Let the evening be an evening.', effects: {}, log: 'He stood on the grass until it got cold, then went in.' },
        ],
      },
    ],
  },
];

/* Topics the local model wrote into src/extra-topics.js. Anything that fails the
 * shape check is ignored, so a bad generation is a no-op rather than a crash. */
for (const chapter of CHAPTERS) {
  for (const scene of chapter.scenes) {
    const extra = EXTRA_TOPICS[scene.id];
    if (!Array.isArray(extra)) continue;
    const existing = new Set((scene.topics || []).map((t) => t.id));
    const clean = extra.filter((t) =>
      t && typeof t.id === 'string' && !existing.has(t.id) &&
      typeof t.label === 'string' && t.label.length < 80 &&
      typeof t.text === 'string' && t.text.length > 80);
    if (clean.length) scene.topics = [...(scene.topics || []), ...clean];
  }
}
