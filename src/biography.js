/**
 * Biography generator.
 *
 * The point of the whole game: a career that reads as prose, built from the
 * flags and choices rather than from a scoreboard. Two playthroughs should read
 * like two different people.
 */

function has(g, flag) {
  return g.flags[flag] === true;
}

function joinSentences(parts) {
  return parts.filter(Boolean).join(' ');
}

export function writeBiography(game) {
  const name = game.name;
  const spoken = game.spokenCount;
  const silent = game.silentCount;
  const paras = [];

  // --- opening
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

  // --- where he came from / who he played for
  if (game.origin) {
    const { city, nation, secondNation, pedigreeLabel, backgroundLabel } = game.origin;
    const dual = secondNation ? ` He could have played for ${secondNation} as well, and the family argument about it ran for years.` : '';
    const chose = has(game, 'choseSecondNation') && secondNation
      ? ` In the end he chose ${secondNation}, which cost him a grandmother's approval and gained him a different anthem.`
      : has(game, 'choseHomeNation')
        ? ` He chose ${nation}, as everyone expected, and never quite explained why it felt like a compromise.`
        : '';
    paras.push(`He came out of ${city}, ${nation} — ${pedigreeLabel.toLowerCase()}, ${backgroundLabel.toLowerCase()}.${dual}${chose}`);
  }

  // --- what he brought with him
  if (game.origin && Array.isArray(game.origin.hooks) && game.origin.hooks.length) {
    paras.push(`He carried other things into it. ${game.origin.hooks.map((h) => h.text).join(' ')}`);
  }

  // --- the body
  if (has(game, 'tookPills')) {
    paras.push(`The knee went when he was twenty-three, and he came back faster than anyone expected. What nobody wrote down was how. He was twenty-seven when the records surfaced, and ${has(game, 'frontedUp') ? 'he told the truth about it in one afternoon and took the hit' : 'his people denied it for a decade and it never quite went away'}.`);
  } else if (has(game, 'hidInjury')) {
    paras.push(`He strapped a bad knee at nineteen and played a cup tie nobody remembers. The knee remembered. It shaped every contract after that, and the way he walked when he was thirty.`);
  } else {
    paras.push(`He was lucky with his body until he was thirty, and then he was not — which is the ordinary story, and no less hard for being ordinary.`);
  }

  // --- the move
  if (has(game, 'tookBigMove')) {
    paras.push(`At twenty-seven he took the big move. He won things, and sat down a lot, and learned that a medal weighs the same whether or not you played.`);
  } else if (has(game, 'stayedLoyal')) {
    paras.push(`At twenty-seven he could have gone and did not. They sang his name for four more years, and he still hears it in small rooms.`);
  }

  // --- the dressing room
  if (has(game, 'mentoredKid')) {
    paras.push(`When a seventeen-year-old took his shirt number, he taught him how to warm up properly, and the kid has told that story in three different interviews since.`);
  } else if (has(game, 'spokeUp')) {
    paras.push(`He was the one who said something in the dressing room when it mattered, and the room went quiet, and the kid stayed.`);
  } else if (has(game, 'refusedBrother') || has(game, 'helpedBrother')) {
    paras.push(has(game, 'helpedBrother')
      ? `Family money went out of the door more than once. Some of it came back.`
      : `He said no to the people from the estate, and it cost him something he never talked about.`);
  }

  // --- the end
  if (has(game, 'retiredEarly')) {
    paras.push(`He stopped at thirty-three, while it was still his choice to make, and played no more games.`);
  } else if (has(game, 'keptGoing')) {
    paras.push(`He played until nobody rang, two countries later, and the last contract was for a fraction of the first.`);
  } else {
    paras.push(`He retired at thirty-six, on a Tuesday, in a statement shorter than his first contract.`);
  }

  if (has(game, 'wentIntoCoaching')) {
    paras.push(`He took his badges and now teaches children who are two sizes too big for their boots.`);
  } else if (has(game, 'leftFootball')) {
    paras.push(`He did not watch a match for two years afterwards. Then he did, and it was fine.`);
  }

  // --- the shape of him, inferred rather than announced
  const steadiness = game.belief >= 65
    ? `He was steadier than people gave him credit for. The people who knew him best said he had a way of deciding things quietly and then never mentioning them again.`
    : game.belief >= 40
      ? `He was neither confident nor fragile, which is the ordinary condition of a professional footballer and the hardest one to write about.`
      : `He never quite believed any of it, even at the end, even with the medals in a box in the spare room.`;
  paras.push(steadiness);

  return paras.join('\n\n');
}

export function writeEpilogue(game) {
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
