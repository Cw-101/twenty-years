#!/usr/bin/env node
/**
 * Generate origin flavour text with the LOCAL model, once, then freeze it.
 *
 * Why this shape: an LLM is good at two sentences of atmosphere and bad at being
 * a dependency. So the game never calls a model at runtime — this script asks
 * the local Qwen3-8B (:8111) for a line per nation × pedigree combination, and
 * writes the results into src/flavour.js. The game imports that file, so it
 * stays offline, deterministic, and fast.
 *
 * Re-run only when you want to regenerate the prose.
 *
 *   node scripts/origin-flavour.mjs [--model qwen3-8b] [--url http://127.0.0.1:8111/v1]
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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(root, 'src', 'flavour.js');

async function flavourFor(nation, pedigreeKey) {
  const ped = PEDIGREES[pedigreeKey];
  const prompt = [
    `Write ONE sentence (max 30 words) of atmospheric prose for a football narrative game.`,
    `Setting: a 16-year-old ${ped.label.toLowerCase()} coming through in ${nation}.`,
    `Use concrete sensory detail (weather, sound, place). No clichés like "dreams of glory".`,
    `No quotation marks. No second person. Just the sentence.`,
  ].join(' ');

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 80,
      temperature: 0.9,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const text = (data?.choices?.[0]?.message?.content || '').trim().replace(/^"|"$/g, '');
  return text.split('\n')[0].trim();
}

async function main() {
  const entries = {};
  let count = 0;
  for (const nation of Object.keys(NATIONS)) {
    for (const ped of Object.keys(PEDIGREES)) {
      const key = `${nation}.${ped}`;
      try {
        const line = await flavourFor(nation, ped);
        if (line.length > 20) { entries[key] = line; count++; }
        process.stdout.write(`\r  ${count}/30 generated…`);
      } catch (err) {
        console.error(`\n  ${key} failed: ${err.message}`);
      }
    }
  }
  const body = `/**
 * Origin flavour lines, generated once by scripts/origin-flavour.mjs using the
 * local Qwen3-8B. Reviewed, then frozen — the game does not call a model at
 * runtime, so play stays offline and reproducible.
 *
 * ${count} of 30 combinations. Missing keys fall back to the template prose in
 * origin.js, so a partial file is safe.
 */
export const FLAVOUR = ${JSON.stringify(entries, null, 2)};
`;
  fs.writeFileSync(outFile, body);
  console.log(`\n  wrote ${outFile} with ${count} line(s)`);
}

main().catch((err) => { console.error(err); process.exit(1); });
