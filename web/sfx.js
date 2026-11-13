/**
 * Sound effects.
 *
 * Two sources, in priority order:
 *   1. a real recording at ./web/sfx/<name>.mp3 — drop files in and they win
 *   2. a synthesised fallback, built with WebAudio, so the game is never silent
 *
 * Nothing here needs a download, a licence or a network request, and a missing
 * recording is not an error. Everything fails soft.
 */

let ctx = null;
let master = null;
let enabled = false;
const bufferCache = new Map();
const missing = new Set();

function context() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function setEnabled(on) {
  enabled = Boolean(on);
  if (enabled) context();
  return enabled;
}

export function isEnabled() {
  return enabled;
}

/* ------------------------------------------------------------- synthesis */

function noiseBuffer(c, seconds) {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function env(c, node, peak, attack, decay) {
  const g = c.createGain();
  const t = c.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  node.connect(g);
  return g;
}

const SYNTH = {
  /* referee's whistle: two bursts, high, slightly detuned */
  whistle(c) {
    for (const [delay, dur] of [[0, 0.18], [0.26, 0.24]]) {
      const o = c.createOscillator();
      const vib = c.createOscillator();
      const vibGain = c.createGain();
      o.type = 'sine';
      o.frequency.value = 2350;
      vib.frequency.value = 28;
      vibGain.gain.value = 90;
      vib.connect(vibGain).connect(o.frequency);
      const g = env(c, o, 0.16, 0.01, dur);
      g.connect(master);
      const t = c.currentTime + delay;
      o.start(t); vib.start(t);
      o.stop(t + dur + 0.1); vib.stop(t + dur + 0.1);
    }
  },

  /* a crowd rising and falling */
  crowd(c) {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 3);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 700;
    bp.Q.value = 0.6;
    const g = c.createGain();
    const t = c.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22, t + 1.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
    src.connect(bp).connect(g).connect(master);
    src.start(t); src.stop(t + 3);
  },

  /* a body hitting the ground / a bad moment */
  thud(c) {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(110, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(42, c.currentTime + 0.3);
    const g = env(c, o, 0.5, 0.005, 0.35);
    g.connect(master);
    o.start(); o.stop(c.currentTime + 0.5);
  },

  /* a phone ringing twice */
  phone(c) {
    for (const delay of [0, 0.9]) {
      for (const f of [440, 480]) {
        const o = c.createOscillator();
        o.type = 'sine';
        o.frequency.value = f;
        const g = env(c, o, 0.09, 0.01, 0.55);
        g.connect(master);
        const t = c.currentTime + delay;
        o.start(t); o.stop(t + 0.7);
      }
    }
  },

  /* paper, a letter, a contract */
  paper(c) {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.4);
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2600;
    const g = c.createGain();
    const t = c.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.15, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    src.connect(hp).connect(g).connect(master);
    src.start(t); src.stop(t + 0.4);
  },

  /* two heartbeats */
  heart(c) {
    for (const delay of [0, 0.34]) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = 58;
      const g = env(c, o, 0.4, 0.01, 0.18);
      g.connect(master);
      const t = c.currentTime + delay;
      o.start(t); o.stop(t + 0.3);
    }
  },

  /* a choice that lands: soft bell */
  mark(c) {
    for (const [f, delay] of [[880, 0], [1320, 0.06]]) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = env(c, o, 0.1, 0.01, 0.9);
      g.connect(master);
      const t = c.currentTime + delay;
      o.start(t); o.stop(t + 1.2);
    }
  },

  /* a choice that does not land */
  fail(c) {
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(300, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(110, c.currentTime + 0.5);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const g = env(c, o, 0.2, 0.01, 0.6);
    o.connect(lp).connect(g).connect(master);
    o.start(); o.stop(c.currentTime + 0.8);
  },
};

/* ------------------------------------------------------------- playback */

async function tryFile(c, name) {
  if (missing.has(name)) return false;
  try {
    if (!bufferCache.has(name)) {
      const res = await fetch(`./web/sfx/${name}.mp3`);
      if (!res.ok) { missing.add(name); return false; }
      const data = await res.arrayBuffer();
      bufferCache.set(name, await c.decodeAudioData(data));
    }
    const src = c.createBufferSource();
    src.buffer = bufferCache.get(name);
    src.connect(master);
    src.start();
    return true;
  } catch (e) {
    missing.add(name);
    return false;
  }
}

/** Play a cue. Silently does nothing when sound is off or unavailable. */
export async function play(name, { gain = 1 } = {}) {
  if (!enabled) return false;
  const c = context();
  if (!c) return false;

  if (await tryFile(c, name)) return true;
  const fn = SYNTH[name];
  if (!fn) return false;
  try { fn(c); return true; } catch (e) { return false; }
}

/** Which cue belongs to a scene, by id prefix where no exact match exists. */
export function cueForScene(sceneId) {
  const exact = {
    'the-call': 'paper',
    'the-coach': 'whistle',
    'the-brother': 'heart',
    'the-offer': 'paper',
    'the-first-night': 'heart',
    'debut': 'crowd',
    'first-drink': 'heart',
    'the-agent': 'paper',
    'hide-it': 'thud',
    'the-interview': 'paper',
    'the-scan': 'thud',
    'the-dark': 'heart',
    'the-pills': 'heart',
    'the-return': 'whistle',
    'the-mirror': 'heart',
    'the-big-club': 'paper',
    'the-brother-returns': 'paper',
    'the-captain': 'thud',
    'the-scandal': 'phone',
    'the-clause': 'paper',
    'dropped': 'thud',
    'the-kid': 'crowd',
    'the-body': 'thud',
    'the-farewell': 'crowd',
    'the-return-hk': 'crowd',
    'the-flat': 'heart',
    'the-garden': 'heart',
    'the-sunday-call': 'phone',
    'the-name': 'crowd',
    'the-foreign-lad': 'crowd',
    'the-noise': 'whistle',
    'the-praise': 'mark',
    'the-words': 'heart',
    'the-hospital-call': 'phone',
    'the-red-mist': 'thud',
    'the-twin': 'whistle',
    'the-paperwork': 'paper',
    'the-father-call': 'phone',
    'the-superstition': 'thud',
    'the-funeral': 'heart',
    'car-park': 'paper',
    'the-flag': 'crowd',
    'the-money': 'phone',
    'the-return': 'crowd',
    'the-derby-return': 'crowd',
    'the-sunday-ritual': 'phone',
    'the-translator': 'paper',
    'two-countries': 'phone',
    'two-federations-campaign': 'phone',
  };
  return exact[sceneId] || null;
}
