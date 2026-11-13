/**
 * Audio wiring tests.
 *
 * These do not listen to anything — they catch the failures that actually
 * happen: a scene pointing at a cue that no longer exists, a trim for a cue
 * that was renamed, a place with no soundscape at all.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { cueNames, cueGains, sceneSoundFor, cueForScene } from '../web/sfx.js';

const cues = new Set(cueNames());

test('the synth has a useful number of cues', () => {
  assert.ok(cues.size >= 60, `expected at least 60 cues, found ${cues.size}`);
});

test('every scene accent points at a cue that exists', async () => {
  const { SCENES_BY_PLACE } = await import('./helpers/places.mjs');
  for (const place of SCENES_BY_PLACE) {
    const spec = sceneSoundFor(place);
    assert.ok(spec, `no soundscape for ${place}`);
    assert.ok(spec.bed, `${place} has no bed`);
    for (const accent of spec.accents) {
      assert.ok(cues.has(accent), `${place} wants "${accent}", which the synth does not have`);
    }
  }
});

test('a scene cue mapping points at real cues', () => {
  const scenes = ['the-call', 'match-day', 'training-block', 'the-last-match', 'retirement', 'the-garden'];
  for (const id of scenes) {
    const cue = cueForScene(id);
    if (cue) assert.ok(cues.has(cue), `scene ${id} maps to missing cue "${cue}"`);
  }
});

test('every trim belongs to a real cue', () => {
  for (const name of Object.keys(cueGains())) {
    assert.ok(cues.has(name), `trim for "${name}", which the synth does not have`);
  }
});

test('trims stay within a sane range', () => {
  for (const [name, gain] of Object.entries(cueGains())) {
    assert.ok(gain > 0.5 && gain <= 4, `${name} trimmed by ${gain}, which is outside 0.5-4`);
  }
});

test('no place shares its exact soundscape with another', async () => {
  const { SCENES_BY_PLACE } = await import('./helpers/places.mjs');
  const seen = new Map();
  for (const place of SCENES_BY_PLACE) {
    const spec = sceneSoundFor(place);
    const key = spec.bed + '|' + spec.accents.slice().sort().join(',');
    assert.ok(!seen.has(key), `${place} sounds exactly like ${seen.get(key)}`);
    seen.set(key, place);
  }
});
