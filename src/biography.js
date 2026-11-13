/**
 * Biography generator.
 *
 * The point of the whole game: a career that reads as prose, built from the
 * flags and choices rather than from a scoreboard. Two playthroughs should read
 * like two different people.
 *
 * Paragraphs are assembled in life order — beginning, body, money, dressing
 * room, decline, the last match, afterwards — because a biography that jumps
 * around reads like a bug rather than a style.
 */

import { skillSummary, personalityLine } from './skills.js';

function has(g, flag) {
  return g.flags[flag] === true;
}

import { careerStats } from './stats.js';

export function writeBiography(game) {
  const name = game.name;
  const paras = [];

  // 1. the beginning
  const pedigree = game.origin ? game.origin.pedigree : null;
  const start = pedigree === 'prodigy'
    ? `He was in the first team at seventeen, which is a sentence that sounds like luck and is mostly other people's decisions.`
    : pedigree === 'nonleague'
      ? `He came out of a pitch with a slope and a manager who worked weekdays, and for a long time nobody outside the ground knew his name.`
      : pedigree === 'lateloomer'
        ? `He was released at fifteen and picked up again at eighteen, so his career began twice and never quite trusted itself.`
        : pedigree === 'emigrant'
          ? `He left at fifteen for a country where the football was faster and the language was not his, and came back with an accent people could not place.`
          : has(game, 'signedAt16')
            ? `He signed at sixteen, and the school corridor stopped being his world the same week.`
            : `He signed young enough that he never had to find out what he would have been otherwise.`;
  paras.push(`${name} played professional football for two decades. ${start}`);

  // 2. where he came from
  if (game.origin) {
    const { city, nation, secondNation, pedigreeLabel, backgroundLabel } = game.origin;
    const dual = secondNation ? ` He could have played for ${secondNation} as well, and the family argument about it ran for years.` : '';
    const chose = has(game, 'choseSecondNation') && secondNation
      ? ` In the end he chose ${secondNation}, which cost him a grandmother's approval and gained him a different anthem.`
      : has(game, 'choseHomeNation')
        ? ` He chose ${nation}, as everyone expected, and never quite explained why it felt like a compromise.`
        : has(game, 'delayedNation')
          ? ` He never did choose between them, and both federations quietly moved on.`
          : '';
    paras.push(`He came out of ${city}, ${nation} — ${pedigreeLabel.toLowerCase()}, ${backgroundLabel.toLowerCase()}.${dual}${chose}`);
  }

  // 3. what he carried in
  if (game.origin && Array.isArray(game.origin.hooks) && game.origin.hooks.length) {
    paras.push(`He carried other things into it. ${game.origin.hooks.map((h) => h.text).join(' ')}`);
  }
  if (has(game, 'expectedNothing')) {
    paras.push(`He had gone into the whole thing at sixteen expecting nothing, which is a strange way to begin a career and possibly the best one.`);
  }

  // 4. the body
  if (has(game, 'tookPills')) {
    paras.push(`The knee went when he was twenty-three, and he came back faster than anyone expected. What nobody wrote down was how. He was twenty-seven when the records surfaced, and ${has(game, 'frontedUp') ? 'he told the truth about it in one afternoon and took the hit' : 'his people denied it for a decade and it never quite went away'}.`);
  } else if (has(game, 'hidInjury')) {
    paras.push(`He strapped a bad knee at nineteen and played a cup tie nobody remembers. The knee remembered. It shaped every contract after that, and the way he walked when he was thirty.`);
  } else {
    paras.push(`He was lucky with his body until he was thirty, and then he was not — which is the ordinary story, and no less hard for being ordinary.`);
  }
  if (has(game, 'refusedPills')) {
    paras.push(`A physio offered him something to shorten the comeback and he said no, and the man never forgave him for it. He was slower for it and never pretended otherwise.`);
  } else if (has(game, 'restedKnee')) {
    paras.push(`He rested the knee when the cup tie was on, lost the tie, and never once claimed it had been the right call.`);
  }
  if (has(game, 'calledMother')) {
    paras.push(`He rang his mother from the car park in the worst year of it, and it was the only sensible thing he did that season.`);
  } else if (has(game, 'pushedAlone')) {
    paras.push(`He did the dark months alone and told people afterwards that it had been fine.`);
  }

  // 5. the move
  if (has(game, 'tookBigMove')) {
    paras.push(`At twenty-seven he took the big move. He won things, and sat down a lot, and learned that a medal weighs the same whether or not you played.`);
  } else if (has(game, 'stayedLoyal')) {
    paras.push(`At twenty-seven he could have gone and did not. They sang his name for four more years, and he still hears it in small rooms.`);
  }

  // 6. money and family
  if (has(game, 'smartClause')) {
    paras.push(`He read page eleven of a contract at twenty-eight and insisted on the clause, which paid him for the following twenty years.`);
  } else if (has(game, 'tookCash')) {
    paras.push(`He took the money up front at twenty-eight. It was the honest choice and the expensive one.`);
  }
  if (has(game, 'helpedBrother')) {
    paras.push(`Family money went out of the door more than once. Some of it came back.`);
  } else if (has(game, 'refusedBrother')) {
    paras.push(`He said no to the people from the estate, and it cost him something he never talked about.`);
  }

  // 7. the dressing room
  if (has(game, 'spokeUp')) {
    paras.push(`He was the one who said something in the room when it mattered, and the room went quiet, and the kid stayed.`);
  } else if (has(game, 'quietWord')) {
    paras.push(`He never said anything in the room. He said it in the car park afterwards, which turned out to matter more.`);
  } else if (has(game, 'wentToManager')) {
    paras.push(`He went upstairs about it once. The captain knew where the complaint had come from and never quite forgave the paperwork.`);
  }
  if (has(game, 'defusedRoom')) {
    paras.push(`There was a morning in the dressing room when he took the air out of a bad situation with one sentence, and the young lads never forgot who did that.`);
  }
  if (has(game, 'tookTheShot')) {
    paras.push(`His last touch as a professional was a shot he had no right to take. It went in.`);
  }
  if (has(game, 'answeredBack')) {
    paras.push(`He answered back once, in his first season, and the dressing room decided about him that afternoon and never revisited it.`);
  }
  if (has(game, 'mentoredKid')) {
    paras.push(`When a seventeen-year-old took his shirt number, he taught him how to warm up properly, and the kid has told that story in three different interviews since.`);
  }
  if (has(game, 'honestInterview')) {
    paras.push(`He was honest with the press at twenty, which is why they were gentler with him at thirty-five than he deserved.`);
  }
  if (has(game, 'builtPersona')) {
    paras.push(`The version of him in the building was not the version of him at home, and in the end the two never met.`);
  } else if (has(game, 'saidItOutLoud')) {
    paras.push(`He had said, at sixteen, in an empty room, that he belonged there. It turned out to be the most useful thing anybody ever told him.`);
  }

  // 8. the decline
  if (has(game, 'reinvented')) {
    paras.push(`At thirty-two he learned to play a second position, and it bought him two years he had not budgeted for.`);
  } else if (has(game, 'acceptedDecline')) {
    paras.push(`The last two years he took as they came, and the dressing room liked him more for it than he ever expected.`);
  }

  // 9. the last one
  if (has(game, 'playedLastGame')) {
    paras.push(`His last eleven minutes were a substitute's cameo on a Tuesday, and the ground stood for all of it.`);
  } else if (has(game, 'watchedFromBench')) {
    paras.push(`He did not play the last one. He watched from the bench with his coat on, and that was its own kind of decision.`);
  }
  if (has(game, 'gracefulFarewell')) {
    paras.push(`He left with a lap of honour and a microphone and did not cry until he was in the car.`);
  }

  // 10. the end
  if (has(game, 'retiredEarly')) {
    paras.push(`He stopped at thirty-three, while it was still his choice to make, and played no more games.`);
  } else if (has(game, 'keptGoing')) {
    paras.push(`He played until nobody rang, two countries later, and the last contract was for a fraction of the first.`);
  } else {
    paras.push(`He retired at thirty-six, on a Tuesday, in a statement shorter than his first contract.`);
  }

  // 11. afterwards
  if (has(game, 'wentIntoCoaching')) {
    paras.push(`He took his badges and now teaches children who are two sizes too big for their boots.`);
  } else if (has(game, 'leftFootball')) {
    paras.push(`He did not watch a match for two years afterwards. Then he did, and it was fine.`);
  }

  // 12. what kind of player, and what kind of man
  paras.push(`What he was, in the end, was ${skillSummary(game)}.`);

  // 13. the shape of him
  if (has(game, 'wentInAfraid')) {
    paras.push(`He was frightened on the first morning and did it anyway. Most of what people call courage is that, repeated.`);
  }
  paras.push(game.belief >= 65
    ? `He was steadier than people gave him credit for. The people who knew him best said he had a way of deciding things quietly and then never mentioning them again.`
    : game.belief >= 40
      ? `He was neither confident nor fragile, which is the ordinary condition of a professional footballer and the hardest one to write about.`
      : `He never quite believed any of it, even at the end, even with the medals in a box in the spare room.`);

  paras.push(`People who write about him settle on one word, and the word is "${personalityLine(game).toLowerCase()}".`);

  return paras.join('\n\n');
}

export function writeEpilogue(game) {
  const record = careerStats(game);
  const numbers = record.apps
    ? `${record.apps} appearances, ${record.goals} goals, ${record.assists} assists, an average of ${record.avgRating.toFixed(1)}.`
    : null;

  const f = game.flags || {};
  const lines = [];

  if (f.wentIntoCoaching) {
    lines.push('He took his badges at thirty-seven and now stands on a cold pitch on Sunday mornings, telling somebody else to use their left foot.');
  } else if (f.leftFootball) {
    lines.push('He did not watch a match for two years. Then one Saturday he did, in a pub, with his hood up, and nobody recognised him.');
  } else if (f.returnedToDerby) {
    lines.push('He went back to Derby, which is where he still is, and the people there have decided to be pleased about it.');
  } else if (f.finishedInHK) {
    lines.push('He finished in Hong Kong, two seasons, in front of a grandmother who told everyone in the building that the boy was hers.');
  } else {
    lines.push('Afterwards he drifted for a while, the way most of them do, and then found something that was not football and did not talk about it much.');
  }

  if (game.conscience >= 75) {
    lines.push('The people he helped along the way have been quiet and consistent about it, which is the only kind of reputation worth having.');
  } else if (game.conscience <= 40) {
    lines.push('There are things in his file that never made the interviews, and one or two people who will not say his name.');
  } else {
    lines.push('He was neither a saint nor a scandal, and the internet has never quite known what to do with him.');
  }

  if (game.belief >= 65) {
    lines.push('He is all right, by the way. He was all right before the football stopped, which is rarer than it sounds.');
  } else if (game.belief <= 35) {
    lines.push('He still keeps a list, in the dark, of the things he is afraid of. It is shorter than it used to be. It is not empty.');
  }

  return lines.join('\n\n');
}
