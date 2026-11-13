#!/usr/bin/env node
/**
 * Generate origin flavour text with the LOCAL model, once, then freeze it.
 *
 * v2 — built for variety, because v1 gave almost every England line rain:
 *   - three variants per nation x pedigree, so the same origin does not always
 *     open the same way (origin.js picks one using the career seed)
 *   - each variant gets a different subject (morning / walk home / empty pitch /
 *     changing room / car journey) and one nation-specific texture
 *   - banned phrases are rejected and retried
 *
 * Output goes to src/flavour.js as arrays. The game never calls a model at
 * runtime, so play stays offline, instant and reproducible.
 *
 *   node scripts/origin-flavour.mjs [--variants 3]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NATIONS, PEDIGREES } from '../src/origin.js';

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};

const URL = arg('--url', 'http://127.0.0.1:8111/v1') + '/chat/completions';
const MODEL = arg('--model', 'qwen3-8b');
const VARIANTS = Number(arg('--variants', '3'));

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(root, 'src', 'flavour.js');

const SUBJECTS = [
  'the first morning at the training ground',
  'the walk home after being told he is not ready',
  'the pitch before anyone else arrives',
  'the changing room at half-time in winter',
  'the car journey to an away game',
];

const BANNED = ['scent of', 'scented', 'dreams of glory', 'heart pounding', 'heart races'];

const pick = (arr, i) => arr[i % arr.length];

async function one(nation, pedKey, variant) {
  const nationData = NATIONS[nation];
  const ped = PEDIGREES[pedKey];
  const texture = pick(nationData.textures, variant);
  const subject = pick(SUBJECTS, variant + nation.length + pedKey.length);
  const weatherRule = (nation === 'England' || nation === 'Wales')
    ? 'Weather may be wet, but do not use the word "rain".'
    : 'Do not mention rain, drizzle or wet weather.';

  const prompt = [
    'Write ONE sentence of atmospheric prose for a literary football game.',
    `Subject: ${subject}.`,
    `Character: a 16-year-old ${ped.label.toLowerCase()}, from ${nation}.`,
    `Ground it in one concrete texture: ${texture}.`,
    weatherRule,
    'No clichés. No second person. No quotation marks. Present tense. Max 26 words.',
    'Output only the sentence.',
  ].join(' ');

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 70,
      temperature: 1.0,
      top_p: 0.95,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  let text = (data?.choices?.[0]?.message?.content || '').trim().replace(/^["']|["']$/g, '');
  return text.split('\n')[0].trim();
}

function acceptable(text) {
  if (!text || text.length < 25 || text.length > 220) return false;
  const low = text.toLowerCase();
  return !BANNED.some((b) => low.includes(b));
}

async function main() {
  const entries = {};
  const nations = Object.keys(NATIONS);
  const peds = Object.keys(PEDIGREES);
  const total = nations.length * peds.length * VARIANTS;
  let made = 0;
  let attempted = 0;

  for (const nation of nations) {
    for (const ped of peds) {
      const key = `${nation}.${ped}`;
      const lines = [];
      for (let v = 0; v < VARIANTS; v++) {
        let ok = false;
        for (let tryN = 0; tryN < 2 && !ok; tryN++) {
          attempted++;
          try {
            const line = await one(nation, ped, v + tryN);
            if (acceptable(line)) { lines.push(line); ok = true; made++; }
          } catch (err) {
            process.stdout.write(`\n  ${key}: ${err.message}\n`);
          }
        }
        process.stdout.write(`\r  ${made}/${total} lines…  (${key})            `);
      }
      if (lines.length) entries[key] = lines;
    }
  }

  const body = `/**
 * Origin flavour variants, generated once by scripts/origin-flavour.mjs using
 * the local model, reviewed, then frozen. Arrays so a career seed can pick a
 * different opening each play. The game never calls a model at runtime.
 *
 * ${made} line(s) across ${Object.keys(entries).length} combinations
 * (${attempted} requests). Missing keys fall back to the templates in origin.js.
 */
export const FLAVOUR = ${JSON.stringify(entries, null, 2)};
`;
  fs.writeFileSync(outFile, body);
  console.log(`\n  wrote ${outFile}: ${made} lines, ${Object.keys(entries).length} combos`);
}

main().catch((err) => { console.error(err); process.exit(1); });
