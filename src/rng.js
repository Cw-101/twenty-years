/**
 * Seeded RNG (mulberry32). A career is reproducible from its seed, which makes
 * tests deterministic and lets a career be saved as JSON: the generator's
 * internal state is exposed so a reload can resume the exact same stream.
 */
export function makeRng(seed) {
  let a = seed >>> 0;
  const rng = function rng() {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  Object.defineProperty(rng, 'state', {
    get: () => a,
    set: (v) => { a = v >>> 0; },
  });
  rng.setState = (v) => { a = v >>> 0; };
  rng.getState = () => a;
  return rng;
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export function intBetween(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Weighted choice. items: [{ weight, ... }] */
export function weightedPick(rng, items) {
  const total = items.reduce((sum, i) => sum + (i.weight ?? 1), 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight ?? 1;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

export function chance(rng, p) {
  return rng() < p;
}
