#!/usr/bin/env node
/**
 * Play Twenty Years in the terminal.
 *
 *   node src/cli.js                 interactive
 *   node src/cli.js --seed 42       reproducible career
 *   node src/cli.js --auto          play itself (for testing the arc)
 */
import readline from 'node:readline';
import { newGame, currentScene, currentChapter, availableChoices, choose, advanceChapter, isFinished, biography, epilogue } from './game.js';

const args = process.argv.slice(2);
const auto = args.includes('--auto');
const seedArg = args.indexOf('--seed');
const seed = seedArg >= 0 ? Number(args[seedArg + 1]) : Date.now();
const nameArg = args.indexOf('--name');
const name = nameArg >= 0 ? args[nameArg + 1] : undefined;

const game = newGame({ seed, name });

function wrap(text, width = 78) {
  return text.split('\n').map((line) => {
    if (line.length <= width) return line;
    const out = [];
    let cur = '';
    for (const word of line.split(' ')) {
      if ((cur + ' ' + word).trim().length > width) { out.push(cur.trim()); cur = word; }
      else cur += ' ' + word;
    }
    if (cur.trim()) out.push(cur.trim());
    return out.join('\n');
  }).join('\n');
}

function bar(game) {
  const w = '◆'.repeat(game.whispers) + '◇'.repeat(Math.max(0, 3 - game.whispers));
  return `whispers ${w}   trust ${game.trust}   belief ${game.belief}   conscience ${game.conscience}`;
}

function autoPolicy(game, scene) {
  const opts = availableChoices(game, scene);
  const whisper = opts.find((o) => o.whisper && o.available);
  return whisper ? whisper.index : opts[opts.length - 1].index;
}

async function main() {
  const rl = auto ? null : readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((res) => rl.question(q, res));

  let lastChapter = -1;
  let guard = 0;

  while (!isFinished(game) && guard++ < 200) {
    const scene = currentScene(game);
    if (!scene) {
      const { finished } = advanceChapter(game);
      if (finished) break;
      continue;
    }

    if (game.chapter !== lastChapter) {
      lastChapter = game.chapter;
      const ch = currentChapter(game);
      console.log(`\n${'─'.repeat(78)}\n${ch.title.toUpperCase()}  ·  age ${ch.ageStart}–${ch.ageEnd}\n${'─'.repeat(78)}`);
    }

    console.log('\n' + wrap(typeof scene.text === 'function' ? scene.text(game) : scene.text) + '\n');
    const opts = availableChoices(game, scene);
    opts.forEach((o, i) => {
      const tag = o.whisper ? (o.available ? ' [whisper]' : ' [no whispers left]') : '';
      console.log(`  ${i + 1}. ${o.label}${tag}`);
    });
    console.log(`\n  ${bar(game)}`);

    let index;
    if (auto) {
      index = autoPolicy(game, scene);
      console.log(`  → ${opts[index].label}`);
    } else {
      const answer = (await ask('\n> ')).trim();
      const n = Number(answer) - 1;
      if (!Number.isInteger(n) || !opts[n]) { console.log('  (pick a number from the list)'); continue; }
      if (!opts[n].available) { console.log('  (no whispers left this chapter)'); continue; }
      index = n;
    }

    const entry = choose(game, scene, index);
    console.log(`\n  — ${wrap(entry.note)}`);
  }

  if (rl) rl.close();

  console.log(`\n${'═'.repeat(78)}\nBIOGRAPHY\n${'═'.repeat(78)}\n`);
  console.log(wrap(biography(game)));
  console.log(`\n${'─'.repeat(78)}\n`);
  console.log(wrap(epilogue(game)));
  console.log();
}

main().catch((err) => { console.error(err); process.exit(1); });
