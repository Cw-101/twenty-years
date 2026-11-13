#!/usr/bin/env node
/**
 * Generate spoken audio for every whisper line in the game.
 *
 * Why: the whole fantasy is that he *hears* you. Reading your intervention in
 * italics is fine; hearing it in a flat, slightly robotic voice is the game.
 *
 * Uses the existing soniac TTS chain (Edge Sonia + the sci-fi filter chain) so
 * the voice matches Hermes. Build-time only: the output is a folder of MP3s and
 * an index the browser fetches. No model runs during play.
 *
 *   node scripts/generate-whisper-audio.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { CHAPTERS } from '../src/story.js';
import { HOOK_SCENES } from '../src/hook-scenes.js';
import { CAMPAIGNS } from '../src/campaigns.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'web', 'audio');
const TTS = path.join(process.env.HOME || '', '.hermes', 'bin', 'tts-soniac.py');
const TTS_PY = path.join(process.env.HOME || '', '.hermes', 'bin', 'tts-venv', 'bin', 'python');

const stub = {
  name: 'Jintao Lu',
  age: 22,
  chapter: 2,
  trust: 55,
  belief: 55,
  conscience: 65,
  nation: 'Hong Kong',
  secondNation: 'England',
  flags: {},
  origin: { city: 'Derby', nation: 'Hong Kong', secondNation: 'England' },
};

function slug(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h * 33) ^ text.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function collect() {
  const phrases = new Map(); // text -> file
  const add = (say) => {
    if (!say) return;
    const text = typeof say === 'function' ? say(stub) : say;
    if (!text || text.length < 3 || text.length > 180) return;
    if (typeof say === 'function' && /undefined/.test(text)) return;
    phrases.set(text, `whisper-${slug(text)}.mp3`);
  };

  const walk = (scenes) => {
    for (const scene of scenes || []) {
      for (const choice of scene.choices || []) {
        if (choice.whisper) add(choice.say);
      }
    }
  };

  for (const chapter of CHAPTERS) walk(chapter.scenes);
  for (const chapterScenes of Object.values(HOOK_SCENES)) walk(chapterScenes);
  for (const campaign of Object.values(CAMPAIGNS)) {
    for (const chapterScenes of Object.values(campaign.scenes || {})) walk(chapterScenes);
  }
  return phrases;
}

function main() {
  if (!fs.existsSync(TTS)) {
    console.error(`TTS script not found at ${TTS}`);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  const phrases = collect();
  console.log(`  ${phrases.size} unique whisper line(s)`);

  const index = {};
  const tmp = fs.mkdtempSync('/tmp/whisper-');
  let made = 0;
  let skipped = 0;

  for (const [text, file] of phrases) {
    const target = path.join(outDir, file);
    if (fs.existsSync(target) && fs.statSync(target).size > 1000) { skipped++; index[text] = `./web/audio/${file}`; continue; }

    const textFile = path.join(tmp, 'line.txt');
    fs.writeFileSync(textFile, text);
    const res = spawnSync(TTS_PY, [TTS, textFile, target], { encoding: 'utf8' });
    if (res.status === 0 && fs.existsSync(target) && fs.statSync(target).size > 1000) {
      made++;
      index[text] = `./web/audio/${file}`;
    } else {
      console.warn(`  failed: ${text.slice(0, 40)}… (${(res.stderr || '').slice(0, 80)})`);
    }
    process.stdout.write(`\r  ${made} made, ${skipped} cached, ${phrases.size} total   `);
  }

  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2));
  console.log(`\n  wrote ${Object.keys(index).length} entries to web/audio/index.json`);
}

main();
