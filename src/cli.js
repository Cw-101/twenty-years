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
import { listCampaigns } from './campaigns.js';
import { chapterOpening } from './beats.js';
import { saveGame, loadGame, defaultSavePath, listSaves } from './save.js';
import { memories } from './game.js';

const args = process.argv.slice(2);
const auto = args.includes('--auto');
const seedArg = args.indexOf('--seed');
const seed = seedArg >= 0 ? Number(args[seedArg + 1]) : Date.now();
const nameArg = args.indexOf('--name');
const name = nameArg >= 0 ? args[nameArg + 1] : undefined;
const nationArg = args.indexOf('--nation');
const pedigreeArg = args.indexOf('--pedigree');
const cityArg = args.indexOf('--city');
const campaignArg = args.indexOf('--campaign');
const campaign = campaignArg >= 0 ? args[campaignArg + 1] : undefined;
const firstArg = args.indexOf('--first');
const lastArg = args.indexOf('--last');
const resumeArg = args.indexOf('--resume');
const saveArg = args.indexOf('--save');

if (args.includes('--list-campaigns')) {
  console.log('\nAuthored campaigns (fixed origin, bespoke scenes, you choose the name):\n');
  for (const c of listCampaigns()) console.log(`  ${c.id.padEnd(10)} ${c.title}  —  ${c.blurb}\n`);
  process.exit(0);
}

let game;
if (resumeArg >= 0) {
  const file = args[resumeArg + 1];
  game = loadGame(file);
  console.log(`\n  resumed ${game.name} — chapter ${game.chapter + 1}, age ${game.age}`);
} else {
  game = newGame({
    seed,
    name,
    firstName: firstArg >= 0 ? args[firstArg + 1] : undefined,
    lastName: lastArg >= 0 ? args[lastArg + 1] : undefined,
    campaign,
    nation: nationArg >= 0 ? args[nationArg + 1] : undefined,
    pedigree: pedigreeArg >= 0 ? args[pedigreeArg + 1] : undefined,
    city: cityArg >= 0 ? args[cityArg + 1] : undefined,
  });
}
const savePath = saveArg >= 0 ? args[saveArg + 1] : defaultSavePath(game);

function originBlock(g) {
  const o = g.origin;
  const dual = o.secondNation ? `, dual nationality (${o.secondNation})` : '';
  const hooks = (o.hooks || []).map((h) => `  · ${h.text}`).join('\n');
  return [
    `  ${o.name}${g.campaignTitle ? `   [campaign: ${g.campaignTitle}]` : ''}`,
    o.diaspora
      ? `  ${o.city}, England — ${o.nation} family${g.club ? `   · ${g.club}` : ''}`
      : `  ${o.city}, ${o.nation}${dual}${g.club ? `   · ${g.club}` : ''}`,
    `  ${o.pedigreeLabel} · ${o.backgroundLabel}`,
    `  ${o.expectation}`,
    '',
    `  ${o.pedigreeFlavour}`,
    hooks ? `\n${hooks}` : '',
  ].join('\n');
}

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

  if (resumeArg < 0) {
    console.log(`\n${'═'.repeat(78)}\nORIGIN\n${'═'.repeat(78)}\n`);
    console.log(originBlock(game));
  }
  if (!auto) {
    console.log('\n  (different draw: re-run with another --seed; or force one with');
    console.log('   --nation England --pedigree prodigy --city Leeds)');
    await ask('\n  Press Enter to begin. ');
  }

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
      const beat = chapterOpening(game);
      if (beat) console.log(`\n  ${beat}\n`);
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
    if (entry.remembered && entry.remembered.length) console.log('  ✦ he will remember that.');
    try { saveGame(game, savePath); } catch (e) { /* saving must never stop play */ }
  }

  if (rl) rl.close();

  const carried = memories(game);
  if (carried.length) {
    console.log(`\n${'─'.repeat(78)}\nWHAT HE CARRIES\n${'─'.repeat(78)}\n`);
    for (const m of carried) console.log(`  age ${String(m.age).padStart(2)}  ${wrap(m.note, 70)}`);
  }

  console.log(`\n${'═'.repeat(78)}\nBIOGRAPHY\n${'═'.repeat(78)}\n`);
  console.log(wrap(biography(game)));
  console.log(`\n${'─'.repeat(78)}\n`);
  console.log(wrap(epilogue(game)));
  console.log();
}

main().catch((err) => { console.error(err); process.exit(1); });
