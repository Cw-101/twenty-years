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
  const start = has(game, 'signedAt16')
    ? `He signed at sixteen, and the school corridor stopped being his world the same week.`
    : has(game, 'wentWithBrother')
      ? `He came to it late and sideways, the way most of them do — a car outside, a party missed, a coach who noticed anyway.`
      : `He signed young enough that he never had to find out what he would have been otherwise.`;
  paras.push(`${name} played professional football for two decades. ${start}`);

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

  // --- the voice
  const closeness = game.trust >= 70 ? 'the voice' : game.trust >= 45 ? 'something that sounded like a voice' : 'a voice he mostly ignored';
  paras.push(
    `What he never said publicly, and said once privately, was that for twenty years there had been ${closeness} — sometimes a comfort, sometimes a nagging, and never explainable. He called it, when pressed, ${game.belief >= 65 ? 'his better judgement' : 'the thing that kept him going'}.`
  );

  return paras.join('\n\n');
}

export function writeEpilogue(game) {
  const last = game.log[game.log.length - 1];
  const lines = [];

  if (last && last.said) {
    if (game.trust >= 70 && game.belief >= 60) {
      lines.push(`He walked inside, and did not look back up at the sky, because he did not need to. Whatever you were, he had decided you were his.`);
    } else if (game.trust >= 45) {
      lines.push(`He walked inside with the question unanswered, which is how most people carry the important ones.`);
    } else {
      lines.push(`He walked inside and closed the door, and that was the last time you were ever really heard.`);
    }
  } else {
    lines.push(`He walked inside without waiting for an answer, because after twenty years he had stopped expecting one.`);
  }

  const pattern = game.spokenCount > game.silentCount * 1.5
    ? `You spoke more often than you stayed quiet — ${game.spokenCount} whispers against ${game.silentCount} silences.`
    : game.silentCount > game.spokenCount * 1.5
      ? `You mostly watched. ${game.silentCount} silences against ${game.spokenCount} whispers.`
      : `You spoke and stayed quiet in nearly equal measure: ${game.spokenCount} whispers, ${game.silentCount} silences.`;
  lines.push(pattern);

  if (game.conscience >= 75) lines.push(`He kept himself. That was not only his doing, and he will never know it.`);
  else if (game.conscience <= 40) lines.push(`He did things that are in his file and not in his interviews. You were there for all of them.`);

  return lines.join('\n\n');
}
