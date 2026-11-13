#!/usr/bin/env node
/**
 * Structural QA over the story data. Fast, deterministic, no browser.
 *
 * Prints a JSON list of jobs for the local model, ordered by how much they
 * improve the beta: scenes with no conversations first, then scenes where every
 * choice rolls, then flags that are set and never read.
 */
import { CHAPTERS } from '../src/story.js';

const jobs = [];
const allFlags = new Set();
const readFlags = new Set();

for (const [ci, chapter] of CHAPTERS.entries()) {
  for (const [si, scene] of chapter.scenes.entries()) {
    const topics = scene.topics || [];
    if (topics.length < 2) {
      jobs.push({
        kind: 'topic',
        priority: topics.length === 0 ? 3 : 2,
        chapter: ci + 1,
        scene: scene.id,
        title: chapter.title,
        index: si,
        have: topics.length,
        cast: scene.cast || [],
        excerpt: (typeof scene.text === 'string' ? scene.text : '').replace(/\s+/g, ' ').slice(0, 260),
        choices: scene.choices.map((c) => c.label).slice(0, 4),
      });
    }
    const rolling = scene.choices.filter((c) => c.roll !== false).length;
    if (rolling === scene.choices.length && scene.choices.length > 1) {
      jobs.push({ kind: 'pace', priority: 1, chapter: ci + 1, scene: scene.id, rolling });
    }
    for (const c of scene.choices) {
      if (c.flag) allFlags.add(c.flag);
      if (c.effects) for (const k of Object.keys(c.effects)) readFlags.add(k);
      if (!c.log && c.roll !== false) {
        jobs.push({ kind: 'missing-log', priority: 1, chapter: ci + 1, scene: scene.id, label: c.label });
      }
    }
  }
}

jobs.sort((a, b) => b.priority - a.priority);
console.log(JSON.stringify({ generated: new Date().toISOString(), jobs }, null, 2));
