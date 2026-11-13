/**
 * Save / resume.
 *
 * A game is a plain JSON object: origin, chapter, scene index, stats, flags,
 * log and memories. The RNG state travels with it, so a resumed career continues
 * the same random stream rather than starting a fresh one.
 *
 * Browser-safe helpers are kept separate from the Node file helpers.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { toJSON, fromJSON, toObject, fromObject } from './save-core.js';

export { toJSON, fromJSON, toObject, fromObject };

export function defaultSavePath(game) {
  const slug = (game.campaign || game.name || 'career').toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  return path.join(os.homedir(), '.twenty-years', `${slug}.json`);
}

export function saveGame(game, file) {
  const target = file || defaultSavePath(game);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, toJSON(game));
  return target;
}

export function loadGame(file) {
  return fromJSON(fs.readFileSync(file, 'utf8'));
}

export function listSaves() {
  const dir = path.join(os.homedir(), '.twenty-years');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      return { file: full, name: f.replace(/\.json$/, ''), modified: stat.mtime };
    })
    .sort((a, b) => b.modified - a.modified);
}
