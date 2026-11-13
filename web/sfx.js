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
    master.gain.value = 0.72;

    // a compressor keeps stacked cues (roar + crowd + whistle) from clipping
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 24;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;

    // and a limiter as a ceiling, so nothing ever clips the output
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.08;

    master.connect(comp).connect(limiter).connect(ctx.destination);
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


/* Every accent gets its own pitch, level and place in the stereo field, so the
 * fourth time you hear the kettle it is not the first time again. */
let variance = { gain: 1, rate: 1, pan: 0 };

function output(c, node, gainScale = 1) {
  const g = c.createGain();
  g.gain.value = Math.max(0.05, variance.gain * gainScale);
  if (c.createStereoPanner) {
    const p = c.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, variance.pan));
    node.connect(g).connect(p).connect(master);
  } else {
    node.connect(g).connect(master);
  }
}

/* A trim per cue, applied after the audit showed which ones were too quiet to
 * hear on a phone speaker. Distant sounds stay distant, but audible. */
const CUE_TRIM = {
  car: 3.6, boots: 3.4, steps: 3.4, roarFar: 3.0, gate: 2.8, shout: 2.6,
  bootsGravel: 2.4, whistleBlip: 2.2, murmur: 1.5, paper: 1.4, birds: 1.3,
  hedge: 1.6, cup: 1.2, monitor: 1.3, camera: 1.2, trolley: 1.4,
  cupboard: 1.8, chant: 1.9, phoneRing: 1.7, nightfall: 1.6, page: 1.6,
  tvMuffled: 2.8, train: 2.2, seagull: 1.6, paAnnounce: 1.6, netRipple: 1.5,
  kettleClick: 3.2, keys: 2.0, page: 2.0, nightfall: 1.9, dog: 1.9, voices: 1.7,
  musicBox: 1.6, type: 1.0, typeWord: 0.9,
  washingMachine: 3.4, thunderFar: 3.2, teamTalk: 3.2, wheelchair: 3.0,
  breathIn: 2.6, breathOut: 2.6, crowdGroan: 2.4, fridgeOpen: 2.4,
  siren: 2.4, puddleStep: 2.4, gateLatch: 2.2, sprinkler: 2.4,
  mowerFar: 2.2, chair: 1.9, page: 1.7, nightfall: 1.7,
};

function roll() {
  return {
    gain: 0.82 + Math.random() * 0.36,
    rate: 0.94 + Math.random() * 0.12,
    pan: (Math.random() - 0.5) * 0.7,
  };
}

/* two tiny builders, so twenty small sounds don't become twenty copies of the
 * same eight lines */
function noiseHit(c, { dur = 0.2, type = 'bandpass', freq = 1200, q = 1, gain = 0.1, attack = 0.005, delay = 0, sweepTo = null } = {}) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, Math.max(0.12, dur + attack + 0.05));
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, c.currentTime + delay);
  if (sweepTo) f.frequency.linearRampToValueAtTime(sweepTo, c.currentTime + delay + attack + dur);
  f.Q.value = q;
  const g = c.createGain();
  const t = c.currentTime + delay;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
  src.connect(f).connect(g);
  output(c, g);
  src.start(t);
  src.stop(t + attack + dur + 0.05);
}

function toneHit(c, { freq = 440, to = null, dur = 0.2, type = 'sine', gain = 0.1, attack = 0.005, delay = 0, vib = 0, vibRate = 6 } = {}) {
  const o = c.createOscillator();
  const t = c.currentTime + delay;
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + attack + dur);
  if (vib) {
    const v = c.createOscillator();
    const vg = c.createGain();
    v.frequency.value = vibRate;
    vg.gain.value = vib;
    v.connect(vg).connect(o.frequency);
    v.start(t); v.stop(t + attack + dur + 0.2);
  }
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);
  o.connect(g);
  output(c, g);
  o.start(t); o.stop(t + attack + dur + 0.1);
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

  /* a soft page turn as the reader advances */
  page(c) {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.3);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    bp.Q.value = 1.2;
    const g = c.createGain();
    const t = c.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    src.connect(bp).connect(g).connect(master);
    src.start(t); src.stop(t + 0.3);
  },

  /* boots on concrete: three steps, uneven */
  boots(c) {
    for (const [delay, peak] of [[0, 0.22], [0.26, 0.17], [0.5, 0.2]]) {
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, 0.12);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 900;
      const g = c.createGain();
      const t = c.currentTime + delay;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      src.connect(lp).connect(g).connect(master);
      src.start(t); src.stop(t + 0.14);
    }
  },

  /* a door: latch, then weight */
  door(c) {
    const t0 = c.currentTime;
    const click = c.createBufferSource();
    click.buffer = noiseBuffer(c, 0.05);
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2200;
    const cg = c.createGain();
    cg.gain.setValueAtTime(0.0001, t0);
    cg.gain.exponentialRampToValueAtTime(0.16, t0 + 0.004);
    cg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
    click.connect(hp).connect(cg).connect(master);
    click.start(t0); click.stop(t0 + 0.06);

    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, t0 + 0.03);
    o.frequency.exponentialRampToValueAtTime(48, t0 + 0.35);
    const g = env(c, o, 0.4, 0.01, 0.35);
    g.connect(master);
    o.start(t0 + 0.03); o.stop(t0 + 0.45);
  },

  /* a boot through the ball */
  kick(c) {
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(190, t);
    o.frequency.exponentialRampToValueAtTime(70, t + 0.12);
    const g = env(c, o, 0.42, 0.004, 0.13);
    g.connect(master);
    o.start(t); o.stop(t + 0.2);

    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.1);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400;
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.2, t + 0.005);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    src.connect(bp).connect(ng).connect(master);
    src.start(t); src.stop(t + 0.1);
  },

  /* a goal: the whole ground at once */
  roar(c) {
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 3.4);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(500, t);
    bp.frequency.linearRampToValueAtTime(1100, t + 0.6);
    bp.frequency.linearRampToValueAtTime(700, t + 3);
    bp.Q.value = 0.7;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.42, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
    src.connect(bp).connect(g).connect(master);
    src.start(t); src.stop(t + 3.4);
  },

  /* studs and a bag in a changing room */
  clatter(c) {
    const t = c.currentTime;
    for (let i = 0; i < 4; i++) {
      const o = c.createOscillator();
      o.type = 'square';
      o.frequency.value = 900 + Math.random() * 1400;
      const g = env(c, o, 0.05, 0.002, 0.06 + Math.random() * 0.05);
      g.connect(master);
      const d = t + i * 0.06;
      o.start(d); o.stop(d + 0.1);
    }
  },

  /* a long whistle: full time */
  whistleLong(c) {
    const t = c.currentTime;
    for (const [delay, dur] of [[0, 0.5], [0.62, 0.75]]) {
      const o = c.createOscillator();
      const vib = c.createOscillator();
      const vibGain = c.createGain();
      o.type = 'sine';
      o.frequency.value = 2280;
      vib.frequency.value = 26;
      vibGain.gain.value = 70;
      vib.connect(vibGain).connect(o.frequency);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(0.18, t + delay + 0.02);
      g.gain.setValueAtTime(0.18, t + delay + dur - 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur);
      o.connect(g).connect(master);
      o.start(t + delay); vib.start(t + delay);
      o.stop(t + delay + dur + 0.05); vib.stop(t + delay + dur + 0.05);
    }
  },

  /* a ball into the net */
  net(c) {
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.35);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2600, t);
    bp.frequency.exponentialRampToValueAtTime(900, t + 0.3);
    bp.Q.value = 0.9;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    src.connect(bp).connect(g).connect(master);
    src.start(t); src.stop(t + 0.35);
  },

  /* a kettle coming up to the boil */
  kettle(c) {
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(600, t);
    o.frequency.exponentialRampToValueAtTime(1500, t + 1.4);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 1.8);
  },

  /* a ball bouncing on concrete, losing height */
  bounce(c) {
    for (const [delay, peak] of [[0, 0.16], [0.28, 0.10], [0.5, 0.06], [0.66, 0.035]]) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(240, c.currentTime + delay);
      o.frequency.exponentialRampToValueAtTime(120, c.currentTime + delay + 0.08);
      const g = env(c, o, peak, 0.004, 0.09);
      g.connect(master);
      o.start(c.currentTime + delay); o.stop(c.currentTime + delay + 0.12);
    }
  },

  /* a metal gate */
  gate(c) {
    const t = c.currentTime;
    for (const f of [1240, 1870, 2410]) {
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.035, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + 0.5);
    }
  },

  /* applause, the polite kind at a presentation evening */
  clap(c) {
    const t = c.currentTime;
    for (let i = 0; i < 26; i++) {
      const d = t + i * 0.055 + Math.random() * 0.04;
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, 0.05);
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1500 + Math.random() * 1400;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, d);
      g.gain.exponentialRampToValueAtTime(0.05 + Math.random() * 0.04, d + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, d + 0.05);
      src.connect(bp).connect(g).connect(master);
      src.start(d); src.stop(d + 0.06);
    }
  },

  /* a car idling outside */
  car(c) {
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(58, t);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.4);
    g.gain.setValueAtTime(0.09, t + 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2);
    o.connect(lp).connect(g).connect(master);
    o.start(t); o.stop(t + 2.1);
  },

  /* a car horn, twice, impatient but not angry */
  horn(c) {
    const t = c.currentTime;
    for (const delay of [0, 0.28]) {
      for (const f of [392, 494]) {
        const o = c.createOscillator();
        o.type = 'square';
        o.frequency.value = f;
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t + delay);
        g.gain.exponentialRampToValueAtTime(0.06, t + delay + 0.01);
        g.gain.setValueAtTime(0.06, t + delay + 0.1);
        g.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.16);
        o.connect(g).connect(master);
        o.start(t + delay); o.stop(t + delay + 0.2);
      }
    }
  },

  /* a car door: the thunk, then the latch */
  carDoor(c) {
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(52, t + 0.16);
    const g = env(c, o, 0.38, 0.005, 0.18);
    g.connect(master);
    o.start(t); o.stop(t + 0.25);
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.08);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 2200;
    const ng = c.createGain();
    ng.gain.setValueAtTime(0.0001, t + 0.05);
    ng.gain.exponentialRampToValueAtTime(0.14, t + 0.06);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    src.connect(bp).connect(ng).connect(master);
    src.start(t + 0.05); src.stop(t + 0.14);
  },

  /* a set of keys */
  keys(c) {
    const t = c.currentTime;
    for (let i = 0; i < 5; i++) {
      const o = c.createOscillator();
      o.type = 'triangle';
      o.frequency.value = 2600 + Math.random() * 1800;
      const g = c.createGain();
      const d = t + i * 0.045;
      g.gain.setValueAtTime(0.0001, d);
      g.gain.exponentialRampToValueAtTime(0.03, d + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, d + 0.09);
      o.connect(g).connect(master);
      o.start(d); o.stop(d + 0.1);
    }
  },

  /* a camera shutter */
  shutter(c) {
    const t = c.currentTime;
    for (const [delay, dur, peak] of [[0, 0.02, 0.2], [0.06, 0.03, 0.14]]) {
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, 0.06);
      const hp = c.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 2400;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t + delay);
      g.gain.exponentialRampToValueAtTime(peak, t + delay + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + delay + dur * 3);
      src.connect(hp).connect(g).connect(master);
      src.start(t + delay); src.stop(t + delay + 0.1);
    }
  },

  /* a marker on a tactics board */
  chalk(c) {
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 0.35);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 2.5;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    src.connect(bp).connect(g).connect(master);
    src.start(t); src.stop(t + 0.35);
  },

  /* the ground when it does not go his way */
  groan(c) {
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 2);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(700, t);
    bp.frequency.exponentialRampToValueAtTime(320, t + 1.6);
    bp.Q.value = 0.9;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
    src.connect(bp).connect(g).connect(master);
    src.start(t); src.stop(t + 2);
  },

  /* a still evening: almost nothing, which is the point */
  nightfall(c) {
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 2.5);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 480;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    src.connect(lp).connect(g).connect(master);
    src.start(t); src.stop(t + 2.5);
  },

  /* a soft interface tick, for buttons */
  click(c) {
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(620, t + 0.04);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.1);
  },

  /* a chapter turning: a slow swell under a bright shimmer */
  stingChapter(c) {
    const t = c.currentTime;
    const drone = c.createOscillator();
    drone.type = 'sine';
    drone.frequency.setValueAtTime(70, t);
    drone.frequency.linearRampToValueAtTime(96, t + 1.8);
    const dg = c.createGain();
    dg.gain.setValueAtTime(0.0001, t);
    dg.gain.exponentialRampToValueAtTime(0.12, t + 0.6);
    dg.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    drone.connect(dg).connect(master);
    drone.start(t); drone.stop(t + 2.7);

    for (const [f, delay] of [[1180, 0.15], [1580, 0.28], [2360, 0.42]]) {
      const o = c.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = c.createGain();
      const d = t + delay;
      g.gain.setValueAtTime(0.0001, d);
      g.gain.exponentialRampToValueAtTime(0.035, d + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, d + 1.6);
      o.connect(g).connect(master);
      o.start(d); o.stop(d + 1.7);
    }
  },

  /* a crowd rising, not a full roar */
  crowdSurge(c) {
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, 2.2);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(420, t);
    bp.frequency.linearRampToValueAtTime(900, t + 0.9);
    bp.Q.value = 0.8;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.24, t + 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.1);
    src.connect(bp).connect(g).connect(master);
    src.start(t); src.stop(t + 2.2);
  },

  /* a phone buzzing on a table */
  buzz(c) {
    const t = c.currentTime;
    for (const delay of [0, 0.5]) {
      const o = c.createOscillator();
      o.type = 'square';
      o.frequency.value = 74;
      const g = c.createGain();
      const d = t + delay;
      g.gain.setValueAtTime(0.0001, d);
      g.gain.exponentialRampToValueAtTime(0.09, d + 0.02);
      g.gain.setValueAtTime(0.09, d + 0.16);
      g.gain.exponentialRampToValueAtTime(0.0001, d + 0.22);
      o.connect(g).connect(master);
      o.start(d); o.stop(d + 0.25);
    }
  },

  /* an envelope, opened */
  letter(c) {
    const t = c.currentTime;
    for (const [delay, dur] of [[0, 0.18], [0.12, 0.22]]) {
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, 0.3);
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2000;
      const g = c.createGain();
      const d = t + delay;
      g.gain.setValueAtTime(0.0001, d);
      g.gain.exponentialRampToValueAtTime(0.09, d + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, d + dur);
      src.connect(hp).connect(g).connect(master);
      src.start(d); src.stop(d + dur + 0.05);
    }
  },


  /* ---- a house, with people in it -------------------------------------- */

  /* rain on the window, which is a different sound to rain outside */
  rainWindow(c) {
    noiseHit(c, { dur: 2.4, type: 'highpass', freq: 2400, gain: 0.055, attack: 0.5 });
    for (const d of [0.3, 0.9, 1.5]) {
      noiseHit(c, { dur: 0.05, type: 'bandpass', freq: 3400, q: 4, gain: 0.075, delay: d });
    }
  },
  /* a television in another room */
  tvMuffled(c) {
    for (const [d, f] of [[0, 300], [0.4, 420], [0.85, 340]]) {
      noiseHit(c, { dur: 0.4, type: 'lowpass', freq: f, gain: 0.075, delay: d });
    }
  },
  /* crockery in the sink */
  dishes(c) {
    toneHit(c, { freq: 1450, dur: 0.09, gain: 0.070, type: 'triangle', to: 1100 });
    noiseHit(c, { dur: 0.1, type: 'highpass', freq: 2200, gain: 0.055, delay: 0.02 });
    toneHit(c, { freq: 1900, dur: 0.06, gain: 0.045, type: 'sine', delay: 0.14 });
  },
  /* the kettle switch, before it starts */
  kettleClick(c) {
    noiseHit(c, { dur: 0.05, type: 'bandpass', freq: 1800, q: 3, gain: 0.09 });
  },
  /* a bunch of keys, picked up */
  keys(c) {
    for (const d of [0, 0.09, 0.16, 0.25]) {
      toneHit(c, { freq: 2600 + Math.random() * 1400, dur: 0.05, gain: 0.045, type: 'triangle', delay: d });
    }
  },
  /* a wooden seat taking weight */
  seatCreak(c) {
    toneHit(c, { freq: 220, to: 160, dur: 0.35, gain: 0.055, type: 'triangle', vib: 18, vibRate: 7 });
    noiseHit(c, { dur: 0.2, type: 'bandpass', freq: 700, q: 2, gain: 0.05 });
  },

  /* ---- the ground ------------------------------------------------------- */

  /* the tannoy, three syllables of a name you cannot quite hear */
  paAnnounce(c) {
    for (const [d, f] of [[0, 900], [0.35, 760], [0.7, 840]]) {
      noiseHit(c, { dur: 0.28, type: 'bandpass', freq: f, q: 1.1, gain: 0.10, delay: d });
    }
    toneHit(c, { freq: 1200, dur: 0.1, gain: 0.030, type: 'sine', delay: 0.05 });
  },
  /* a shot rustling through the grass */
  grassWhoosh(c) {
    noiseHit(c, { dur: 0.3, type: 'highpass', freq: 1800, gain: 0.075, attack: 0.03, sweepTo: 900 });
  },
  /* the ball in the side netting */
  netRipple(c) {
    noiseHit(c, { dur: 0.28, type: 'bandpass', freq: 1500, q: 0.8, gain: 0.085, sweepTo: 800 });
    toneHit(c, { freq: 160, to: 90, dur: 0.1, gain: 0.06 });
  },

  /* ---- outside --------------------------------------------------------- */

  /* a train, two streets away */
  train(c) {
    noiseHit(c, { dur: 3.0, type: 'lowpass', freq: 420, gain: 0.055, attack: 1.0, sweepTo: 240 });
    toneHit(c, { freq: 90, dur: 2.4, gain: 0.022, type: 'sine', attack: 0.8 });
  },
  /* a gull, which is what a Welsh seafront sounds like */
  seagull(c) {
    toneHit(c, { freq: 1500, to: 2100, dur: 0.16, gain: 0.045, type: 'sawtooth' });
    toneHit(c, { freq: 1700, to: 1200, dur: 0.22, gain: 0.035, type: 'sawtooth', delay: 0.18 });
  },

  /* a music box, somewhere in the house, playing three notes of something */
  musicBox(c) {
    const notes = [523.25, 659.25, 783.99];   // C5 E5 G5, a major triad
    notes.forEach((f, i) => {
      const delay = i * 0.42 + Math.random() * 0.05;
      toneHit(c, { freq: f, dur: 1.5, gain: 0.055, type: 'sine', attack: 0.01, delay });
      toneHit(c, { freq: f * 2, dur: 0.9, gain: 0.016, type: 'sine', attack: 0.01, delay });
    });
  },


  /* ---- the rest of a house --------------------------------------------- */

  /* the fridge door, which is heavier than it looks */
  fridgeOpen(c) {
    noiseHit(c, { dur: 0.18, type: 'lowpass', freq: 320, gain: 0.085 });
    noiseHit(c, { dur: 0.5, type: 'highpass', freq: 1400, gain: 0.030, delay: 0.12, attack: 0.08 });
  },
  /* the microwave: two beeps and a door */
  microwave(c) {
    toneHit(c, { freq: 1050, dur: 0.1, gain: 0.055, type: 'sine' });
    toneHit(c, { freq: 1050, dur: 0.1, gain: 0.055, type: 'sine', delay: 0.18 });
    noiseHit(c, { dur: 0.12, type: 'lowpass', freq: 420, gain: 0.07, delay: 0.34 });
  },
  /* a tap running somewhere in the house */
  tapRunning(c) {
    noiseHit(c, { dur: 1.5, type: 'highpass', freq: 1800, gain: 0.075, attack: 0.25 });
  },
  /* the washing machine going round */
  washingMachine(c) {
    for (const d of [0, 0.7, 1.4]) {
      noiseHit(c, { dur: 0.5, type: 'lowpass', freq: 260, gain: 0.075, delay: d, attack: 0.15 });
    }
  },
  /* a doorbell, two notes falling */
  doorbell(c) {
    toneHit(c, { freq: 988, dur: 0.6, gain: 0.06, type: 'sine' });
    toneHit(c, { freq: 740, dur: 0.8, gain: 0.055, type: 'sine', delay: 0.45 });
  },
  /* someone on the stairs */
  stairs(c) {
    for (const [d, f] of [[0, 240], [0.3, 210], [0.6, 260], [0.9, 200]]) {
      toneHit(c, { freq: f, to: f * 0.8, dur: 0.16, gain: 0.05, type: 'triangle', delay: d, vib: 8, vibRate: 8 });
      noiseHit(c, { dur: 0.08, type: 'lowpass', freq: 500, gain: 0.04, delay: d });
    }
  },
  /* one floorboard, in an empty house */
  floorboard(c) {
    toneHit(c, { freq: 180, to: 130, dur: 0.4, gain: 0.06, type: 'triangle', vib: 10, vibRate: 6 });
  },
  /* curtains pulled across */
  curtains(c) {
    noiseHit(c, { dur: 0.45, type: 'highpass', freq: 1600, gain: 0.06, attack: 0.06, sweepTo: 900 });
  },
  /* next door's cat, on the fence */
  catMeow(c) {
    toneHit(c, { freq: 620, to: 900, dur: 0.18, gain: 0.05, type: 'sawtooth' });
    toneHit(c, { freq: 880, to: 520, dur: 0.3, gain: 0.045, type: 'sawtooth', delay: 0.16 });
  },
  /* the television losing its signal */
  tvStatic(c) {
    noiseHit(c, { dur: 0.7, type: 'bandpass', freq: 2400, q: 0.5, gain: 0.055 });
  },

  /* ---- outside, weather and town -------------------------------------- */

  /* water off the gutter, drip by drip */
  rainGutter(c) {
    for (const d of [0, 0.34, 0.52, 0.95, 1.4, 1.75]) {
      toneHit(c, { freq: 1600 + Math.random() * 900, dur: 0.07, gain: 0.055, type: 'sine', delay: d });
    }
  },
  /* thunder, a county away */
  thunderFar(c) {
    noiseHit(c, { dur: 2.8, type: 'lowpass', freq: 220, gain: 0.10, attack: 0.5, sweepTo: 120 });
  },
  /* a gust finding the gap in the window */
  windGust(c) {
    noiseHit(c, { dur: 2.6, type: 'bandpass', freq: 800, q: 0.4, gain: 0.075, attack: 0.9, sweepTo: 480 });
  },
  /* leaves moving in a hedge */
  leavesRustle(c) {
    for (const d of [0, 0.14, 0.3, 0.44]) {
      noiseHit(c, { dur: 0.12, type: 'highpass', freq: 2800, gain: 0.055, delay: d });
    }
  },
  /* a bus pulling away */
  bus(c) {
    toneHit(c, { freq: 88, to: 70, dur: 1.8, gain: 0.05, type: 'sawtooth', attack: 0.4 });
    noiseHit(c, { dur: 1.8, type: 'lowpass', freq: 340, gain: 0.05, attack: 0.4 });
  },
  /* a siren, three streets over */
  siren(c) {
    toneHit(c, { freq: 660, to: 880, dur: 0.9, gain: 0.035, type: 'sine', attack: 0.2, vib: 4, vibRate: 0.8 });
    toneHit(c, { freq: 880, to: 660, dur: 0.9, gain: 0.030, type: 'sine', delay: 0.9, vib: 4, vibRate: 0.8 });
  },
  /* a bicycle bell */
  bikeBell(c) {
    toneHit(c, { freq: 2400, dur: 0.25, gain: 0.05, type: 'sine' });
    toneHit(c, { freq: 2400, dur: 0.2, gain: 0.045, type: 'sine', delay: 0.16 });
  },
  /* a foot in a puddle */
  puddleStep(c) {
    noiseHit(c, { dur: 0.22, type: 'bandpass', freq: 900, q: 0.8, gain: 0.075, sweepTo: 500 });
  },
  /* a garden gate latch */
  gateLatch(c) {
    noiseHit(c, { dur: 0.06, type: 'bandpass', freq: 2200, q: 2.5, gain: 0.085 });
    toneHit(c, { freq: 780, to: 620, dur: 0.12, gain: 0.04, type: 'square', delay: 0.03 });
  },

  /* ---- the ground, again ----------------------------------------------- */

  /* a ball dropped and bouncing out */
  ballBounce(c) {
    for (const [d, g] of [[0, 0.10], [0.28, 0.07], [0.5, 0.05], [0.66, 0.03]]) {
      toneHit(c, { freq: 150, to: 80, dur: 0.12, gain: g, type: 'sine', delay: d });
    }
  },
  /* off the crossbar */
  crossbar(c) {
    toneHit(c, { freq: 620, dur: 1.1, gain: 0.07, type: 'triangle' });
    toneHit(c, { freq: 930, dur: 0.7, gain: 0.035, type: 'sine', delay: 0.01 });
    noiseHit(c, { dur: 0.05, type: 'highpass', freq: 2500, gain: 0.06 });
  },
  /* forty thousand people disappointed at once */
  crowdGroan(c) {
    noiseHit(c, { dur: 1.8, type: 'bandpass', freq: 520, q: 0.8, gain: 0.09, attack: 0.2, sweepTo: 320 });
  },
  /* the manager, from the touchline */
  managerShout(c) {
    toneHit(c, { freq: 260, to: 200, dur: 0.32, gain: 0.055, type: 'sawtooth', vib: 14, vibRate: 11 });
    noiseHit(c, { dur: 0.3, type: 'bandpass', freq: 1100, q: 1.2, gain: 0.05 });
  },
  /* a team talk through a door */
  teamTalk(c) {
    for (const [d, f] of [[0, 420], [0.3, 380], [0.62, 460], [0.95, 400]]) {
      noiseHit(c, { dur: 0.26, type: 'bandpass', freq: f, q: 1.6, gain: 0.065, delay: d });
    }
  },

  /* ---- hospital and press ---------------------------------------------- */

  /* a wheelchair going down a corridor */
  wheelchair(c) {
    for (const d of [0, 0.22, 0.44, 0.66]) {
      noiseHit(c, { dur: 0.05, type: 'bandpass', freq: 2600, q: 4, gain: 0.06, delay: d });
    }
  },
  /* a curtain round a bed */
  curtainPull(c) {
    noiseHit(c, { dur: 0.5, type: 'highpass', freq: 2000, gain: 0.055, attack: 0.05, sweepTo: 1200 });
  },
  /* a pen going across a page */
  penScribble(c) {
    for (let i = 0; i < 5; i++) {
      noiseHit(c, { dur: 0.06, type: 'highpass', freq: 3200, gain: 0.04, delay: i * 0.12 });
    }
  },
  /* three cameras at once */
  cameraBurst(c) {
    for (const d of [0, 0.09, 0.2]) {
      noiseHit(c, { dur: 0.03, type: 'highpass', freq: 3000, gain: 0.10, delay: d });
      noiseHit(c, { dur: 0.04, type: 'bandpass', freq: 1500, q: 2, gain: 0.06, delay: d + 0.05 });
    }
  },

  /* ---- garden ---------------------------------------------------------- */

  /* a sprinkler, ticking round */
  sprinkler(c) {
    for (let i = 0; i < 7; i++) {
      noiseHit(c, { dur: 0.10, type: 'bandpass', freq: 2200, q: 1.2, gain: 0.05, delay: i * 0.34 });
    }
  },
  /* a mower, two gardens over */
  mowerFar(c) {
    toneHit(c, { freq: 120, dur: 2.2, gain: 0.035, type: 'sawtooth', attack: 0.6, vib: 6, vibRate: 22 });
    noiseHit(c, { dur: 2.2, type: 'lowpass', freq: 380, gain: 0.035, attack: 0.6 });
  },

  /* ---- how a scene feels ------------------------------------------------ */

  /* something going right, quietly */
  chimeGood(c) {
    toneHit(c, { freq: 784, dur: 0.5, gain: 0.06, type: 'sine' });
    toneHit(c, { freq: 1175, dur: 0.7, gain: 0.045, type: 'sine', delay: 0.1 });
  },
  /* a breath in, held */
  breathIn(c) {
    noiseHit(c, { dur: 1.1, type: 'bandpass', freq: 900, q: 0.7, gain: 0.05, attack: 0.5 });
  },
  /* and out */
  breathOut(c) {
    noiseHit(c, { dur: 1.4, type: 'bandpass', freq: 640, q: 0.7, gain: 0.045, attack: 0.2, sweepTo: 420 });
  },

  /* the small sound of words arriving: wood, not plastic */
  type(c) {
    const f = 420 + Math.random() * 260;
    toneHit(c, { freq: f, to: f * 0.72, dur: 0.035, gain: 0.055, type: 'triangle', attack: 0.002 });
    noiseHit(c, { dur: 0.022, type: 'lowpass', freq: 1400, gain: 0.030, attack: 0.001 });
  },
  /* a slightly heavier one at the end of a word */
  typeWord(c) {
    const f = 300 + Math.random() * 120;
    toneHit(c, { freq: f, to: f * 0.7, dur: 0.05, gain: 0.05, type: 'triangle', attack: 0.002 });
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

  /* ---- the room a person lives in ------------------------------------- */

  /* the kettle coming up to the boil */
  kettle(c) {
    toneHit(c, { freq: 780, to: 1420, dur: 1.5, gain: 0.055, attack: 0.35, type: 'sine' });
    noiseHit(c, { dur: 1.2, type: 'highpass', freq: 2600, gain: 0.020, attack: 0.3 });
  },
  /* a mug set down on a worktop */
  cup(c) {
    toneHit(c, { freq: 1680, dur: 0.08, gain: 0.14, type: 'triangle', to: 1200 });
    toneHit(c, { freq: 2350, dur: 0.05, gain: 0.07, type: 'sine', delay: 0.012 });
  },
  /* a radio in the next room: words you can hear but not follow */
  radio(c) {
    for (const d of [0, 0.34, 0.62, 1.05]) {
      noiseHit(c, { dur: 0.24, type: 'bandpass', freq: 620, q: 0.9, gain: 0.16, delay: d });
    }
  },
  cupboard(c) {
    noiseHit(c, { dur: 0.12, type: 'lowpass', freq: 380, gain: 0.075 });
    toneHit(c, { freq: 300, to: 170, dur: 0.22, gain: 0.030, type: 'triangle', delay: 0.04 });
  },
  /* the front door, two rooms away */
  doorSoft(c) {
    noiseHit(c, { dur: 0.14, type: 'lowpass', freq: 500, gain: 0.085 });
    toneHit(c, { freq: 140, to: 80, dur: 0.18, gain: 0.05, delay: 0.08 });
  },
  /* a car going past the window */
  car(c) {
    noiseHit(c, { dur: 1.7, type: 'bandpass', freq: 520, q: 0.7, gain: 0.045, attack: 0.5, sweepTo: 220 });
  },
  /* next door's dog */
  dog(c) {
    toneHit(c, { freq: 260, to: 190, dur: 0.11, gain: 0.045, type: 'sawtooth' });
    toneHit(c, { freq: 250, to: 180, dur: 0.13, gain: 0.040, type: 'sawtooth', delay: 0.2 });
  },
  /* footsteps on a pavement */
  steps(c) {
    for (const d of [0, 0.42, 0.84, 1.22]) {
      noiseHit(c, { dur: 0.09, type: 'lowpass', freq: 700, gain: 0.055, delay: d });
    }
  },
  /* a phone on a desk, ignored */
  phoneRing(c) {
    for (const d of [0, 0.5]) {
      toneHit(c, { freq: 1180, dur: 0.16, gain: 0.035, type: 'sine', delay: d, vib: 18, vibRate: 24 });
    }
  },
  chair(c) {
    noiseHit(c, { dur: 0.22, type: 'highpass', freq: 1500, gain: 0.035, sweepTo: 900 });
  },
  paper(c) {
    noiseHit(c, { dur: 0.16, type: 'highpass', freq: 2400, gain: 0.10 });
    noiseHit(c, { dur: 0.10, type: 'highpass', freq: 3000, gain: 0.07, delay: 0.1 });
  },
  /* a locker door, and the room it echoes in */
  locker(c) {
    noiseHit(c, { dur: 0.18, type: 'bandpass', freq: 1800, q: 1.2, gain: 0.07 });
    toneHit(c, { freq: 640, to: 520, dur: 0.25, gain: 0.030, type: 'square' });
  },
  /* studs on a corridor floor */
  boots(c) {
    for (const d of [0, 0.22, 0.44]) {
      noiseHit(c, { dur: 0.07, type: 'bandpass', freq: 1300, q: 2, gain: 0.05, delay: d });
    }
  },
  /* voices through a wall */
  voices(c) {
    for (const [d, f] of [[0, 540], [0.28, 480], [0.66, 610], [1.05, 520]]) {
      noiseHit(c, { dur: 0.32, type: 'bandpass', freq: f, q: 1.3, gain: 0.15, delay: d });
    }
  },

  /* ---- the training ground -------------------------------------------- */

  /* a ball struck, from twenty yards away */
  ballThud(c) {
    toneHit(c, { freq: 120, to: 60, dur: 0.14, gain: 0.075, type: 'sine' });
    noiseHit(c, { dur: 0.06, type: 'lowpass', freq: 900, gain: 0.045 });
  },
  /* a coach shouting something you cannot make out */
  shout(c) {
    toneHit(c, { freq: 210, to: 170, dur: 0.28, gain: 0.028, type: 'sawtooth', vib: 12, vibRate: 9 });
  },
  /* one short blast, not the full whistle */
  whistleBlip(c) {
    toneHit(c, { freq: 2300, dur: 0.14, gain: 0.035, type: 'sine', vib: 70, vibRate: 30 });
  },
  /* studs on gravel */
  bootsGravel(c) {
    for (const d of [0, 0.16, 0.3, 0.46]) {
      noiseHit(c, { dur: 0.05, type: 'highpass', freq: 2200, gain: 0.035, delay: d });
    }
  },
  /* the crowd finding one note */
  chant(c) {
    noiseHit(c, { dur: 1.4, type: 'bandpass', freq: 700, q: 0.9, gain: 0.055, attack: 0.3, sweepTo: 560 });
    toneHit(c, { freq: 196, dur: 1.1, gain: 0.014, type: 'sine', attack: 0.25 });
  },
  /* a goal somewhere else in the ground */
  roarFar(c) {
    noiseHit(c, { dur: 2.0, type: 'lowpass', freq: 900, gain: 0.055, attack: 0.5 });
  },

  /* ---- the hospital ---------------------------------------------------- */

  monitor(c) {
    toneHit(c, { freq: 990, dur: 0.07, gain: 0.09, type: 'sine' });
    toneHit(c, { freq: 990, dur: 0.07, gain: 0.09, type: 'sine', delay: 0.34 });
  },
  trolley(c) {
    for (const d of [0, 0.12, 0.24, 0.36]) {
      noiseHit(c, { dur: 0.06, type: 'bandpass', freq: 2200, q: 1.8, gain: 0.13, delay: d });
    }
  },

  /* ---- press room ------------------------------------------------------ */

  camera(c) {
    noiseHit(c, { dur: 0.03, type: 'highpass', freq: 3000, gain: 0.16 });
    noiseHit(c, { dur: 0.05, type: 'highpass', freq: 2000, gain: 0.10, delay: 0.07 });
  },
  murmur(c) {
    noiseHit(c, { dur: 1.1, type: 'bandpass', freq: 520, q: 0.9, gain: 0.13, attack: 0.25 });
  },

  /* ---- the garden ------------------------------------------------------ */

  birds(c) {
    toneHit(c, { freq: 2600, to: 3300, dur: 0.07, gain: 0.075, type: 'sine' });
    toneHit(c, { freq: 2900, to: 3500, dur: 0.06, gain: 0.060, type: 'sine', delay: 0.13 });
    toneHit(c, { freq: 2400, to: 3000, dur: 0.05, gain: 0.050, type: 'sine', delay: 0.42 });
  },
  wind(c) {
    noiseHit(c, { dur: 2.2, type: 'lowpass', freq: 700, gain: 0.17, attack: 0.7, sweepTo: 420 });
  },
  hedge(c) {
    noiseHit(c, { dur: 0.3, type: 'highpass', freq: 2500, gain: 0.10, attack: 0.08 });
  },
  /* the garden gate */
  gate(c) {
    toneHit(c, { freq: 420, to: 300, dur: 0.35, gain: 0.026, type: 'triangle', vib: 25, vibRate: 12 });
  },
};

/** Every cue the synth can play, for tests and for the audit. */
export function cueNames() {
  return Object.keys(SYNTH);
}

export function cueGains() {
  return { ...CUE_TRIM };
}


/* ------------------------------------------------------------------- music
 * A slow, generative bed: soft chords on a warm low-pass, a note dropped in
 * now and then, nothing that loops on a two-bar phrase. The menu gets the
 * fuller version, the profile a quieter one so it does not compete with reading.
 */

const MUSIC = {
  menu: {
    // Fmaj7 -> Cmaj7 -> Am7 -> G6, spread low so it feels like a room, not a tune
    chords: [[53, 57, 60, 64], [48, 52, 55, 59], [45, 48, 52, 55], [43, 47, 50, 55]],
    every: 6400,
    gain: 0.19,
    twinkleEvery: [7000, 14000],
    twinkleGain: 0.06,
  },
  profile: {
    chords: [[50, 53, 57, 60], [48, 52, 55, 59], [46, 50, 53, 57]],
    every: 7600,
    gain: 0.13,
    twinkleEvery: [9000, 18000],
    twinkleGain: 0.04,
  },
};

const music = { mode: null, timer: null, nodes: [], bus: null, step: 0 };
let levelAnalyser = null;

function midiToHz(m) {
  return 440 * Math.pow(2, (m - 69) / 12);
}

function chordVoicing(c, bus, notes, gain, seconds, spread = 0.06) {
  notes.forEach((note, i) => {
    const o = c.createOscillator();
    o.type = i === 0 ? 'triangle' : 'sine';
    o.frequency.value = midiToHz(note);
    const detune = c.createOscillator();
    const detuneGain = c.createGain();
    detune.frequency.value = 0.12 + i * 0.05;
    detuneGain.gain.value = 1.5;          // cents, so it breathes rather than beats
    detune.connect(detuneGain).connect(o.detune);

    const g = c.createGain();
    const t = c.currentTime + i * spread;
    // up, hold, then release: an exponential decay from the peak meant the chord
    // was almost gone by the time the next one arrived, so the bed read as silence
    const attackEnd = t + 1.6;
    const holdEnd = t + seconds * 0.5;
    const end = t + seconds;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, attackEnd);
    g.gain.setValueAtTime(gain, holdEnd);
    g.gain.exponentialRampToValueAtTime(0.0001, end);

    o.connect(g).connect(bus);
    o.start(t); detune.start(t);
    o.stop(t + seconds + 0.2); detune.stop(t + seconds + 0.2);
    music.nodes.push(o, detune);
  });
}

function scheduleTwinkle(c, bus, spec) {
  const [lo, hi] = spec.twinkleEvery;
  const delay = lo + Math.random() * (hi - lo);
  setTimeout(() => {
    if (music.mode === null || !enabled) return;
    const hi = [72, 74, 76, 79, 81][Math.floor(Math.random() * 5)];
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = midiToHz(hi);
    const t = c.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(spec.twinkleGain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o.connect(g).connect(bus);
    o.start(t); o.stop(t + 2.5);
    music.nodes.push(o);
    scheduleTwinkle(c, bus, spec);
  }, delay);
}

function musicStep(c, spec) {
  if (music.mode === null) return;
  const notes = spec.chords[music.step % spec.chords.length];
  chordVoicing(c, music.bus, notes, spec.gain, (spec.every / 1000) * 2.2);
  music.step += 1;
  // finished oscillators cannot be restarted; keep only the recent tail so a long
  // session does not grow an array of every note ever played
  if (music.nodes.length > 96) music.nodes = music.nodes.slice(-48);
}

/** Start (or switch) the bed. Safe to call repeatedly with the same mode. */
export function startMusic(mode = 'menu') {
  if (!enabled) { music.mode = mode; return mode; }   // remember it for unmute
  if (music.mode === mode && music.timer) return mode;
  stopMusic(true);

  const c = context();
  if (!c || !MUSIC[mode]) return music.mode;

  const spec = MUSIC[mode];
  const bus = c.createGain();
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1750;

  bus.gain.setValueAtTime(0.0001, c.currentTime);
  bus.gain.exponentialRampToValueAtTime(1, c.currentTime + 0.9);
  bus.connect(lp).connect(master);

  music.mode = mode;
  music.bus = bus;
  music.step = 0;

  musicStep(c, spec);
  music.timer = setInterval(() => musicStep(c, spec), spec.every);
  scheduleTwinkle(c, bus, spec);
  return mode;
}

/** Fade the bed out and tear it down. */
export function stopMusic(immediate = false) {
  if (!music.mode && !music.bus) { music.mode = null; return; }
  const c = ctx;
  const oldBus = music.bus;
  const nodes = music.nodes;
  clearInterval(music.timer);
  music.timer = null;
  music.bus = null;
  music.mode = null;
  music.nodes = [];

  if (c && oldBus) {
    try {
      oldBus.gain.cancelScheduledValues(c.currentTime);
      oldBus.gain.setTargetAtTime(0.0001, c.currentTime, immediate ? 0.08 : 0.5);
    } catch (e) {}
  }
  const delay = immediate ? 250 : 1600;
  setTimeout(() => {
    for (const n of nodes) { try { n.stop(); } catch (e) {} }
    try { if (oldBus) oldBus.disconnect(); } catch (e) {}
  }, delay);
}

/** RMS of whatever is coming out of the master bus, for verification. */
export function audioLevel(samples = 2048) {
  const c = ctx;
  if (!c || !master) return 0;
  if (!levelAnalyser) {
    levelAnalyser = c.createAnalyser();
    levelAnalyser.fftSize = samples;
    master.connect(levelAnalyser);
  }
  const data = new Float32Array(levelAnalyser.fftSize);
  levelAnalyser.getFloatTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
  return Math.sqrt(sum / data.length);
}

export function musicDebug() {
  return { mode: music.mode, running: Boolean(music.timer), step: music.step, voices: music.nodes.length };
}

/* ------------------------------------------------------------- playback */

let fileManifest = null;

/**
 * Which recordings actually exist, asked once.
 *
 * Without this the game fires a 404 for every cue that has no recording, which
 * is most of them, and every one of those 404s delays the synthesised sound
 * that would have played immediately.
 */
async function manifest() {
  if (fileManifest) return fileManifest;
  try {
    const res = await fetch('./web/sfx/index.json', { cache: 'force-cache' });
    fileManifest = res.ok ? await res.json() : {};
  } catch (e) {
    fileManifest = {};
  }
  return fileManifest;
}

async function tryFile(c, name) {
  if (missing.has(name)) return false;
  const have = await manifest();
  if (!have[name]) { missing.add(name); return false; }
  try {
    if (!bufferCache.has(name)) {
      const res = await fetch(`./web/sfx/${name}.mp3`);
      if (!res.ok) { missing.add(name); return false; }
      const data = await res.arrayBuffer();
      bufferCache.set(name, await c.decodeAudioData(data));
    }
    const src = c.createBufferSource();
    src.buffer = bufferCache.get(name);
    src.playbackRate.value = variance.rate;
    output(c, src);
    src.start();
    return true;
  } catch (e) {
    missing.add(name);
    return false;
  }
}

/** Play a cue. Silently does nothing when sound is off or unavailable. */
let ambience = { kind: null, layers: [], rumble: null };
let ambienceCreated = 0;      // for tests: how many beds we have ever started

/** Tear the current bed down, whatever the reason. */
function stopAmbience(c, fade = 0.18) {
  const old = ambience;
  ambience = { kind: null, layers: [], rumble: null };
  if (!old.layers || !old.layers.length) return;
  try {
    if (c) {
      for (const layer of old.layers) {
        layer.gain.gain.cancelScheduledValues(c.currentTime);
        layer.gain.gain.setTargetAtTime(0.0001, c.currentTime, fade);
      }
    }
  } catch (e) { /* the graph may already be gone */ }
  setTimeout(() => {
    for (const layer of old.layers) {
      try { layer.src.stop(); } catch (e) {}
      try { if (layer.lfo) layer.lfo.stop(); } catch (e) {}
    }
    try { if (old.rumble) old.rumble.stop(); } catch (e) {}
  }, 300);
}

/**
 * A continuous bed: 'rain', 'crowd', 'room' or 'night', or null for silence.
 *
 * Called with sound disabled it MUST still stop what is playing — the previous
 * version returned early and left the loop running, which sounded like static
 * that never went away after muting.
 */
const BED_SPECS = {
  rain: {
    body: { type: 'lowpass', freq: 700, gain: 0.030 },
    air:  { type: 'highpass', freq: 2400, gain: 0.022 },
    rumble: 46,
  },
  crowd: {
    body: { type: 'bandpass', freq: 380, q: 0.7, gain: 0.030 },
    air:  { type: 'bandpass', freq: 1400, q: 0.4, gain: 0.010 },
  },
  room: {
    body: { type: 'lowpass', freq: 260, gain: 0.026 },
    air:  { type: 'highpass', freq: 3200, gain: 0.006 },
    rumble: 50,
  },
  /* the same idea as 'room', but each building has its own noise */
  kitchen: {
    body: { type: 'lowpass', freq: 300, gain: 0.028 },
    air:  { type: 'highpass', freq: 2600, gain: 0.006 },
    rumble: 50,          // the fridge, which is always on
  },
  office: {
    body: { type: 'lowpass', freq: 240, gain: 0.022 },
    air:  { type: 'highpass', freq: 4200, gain: 0.004 },
    rumble: 100,         // the strip light
  },
  dressing: {
    body: { type: 'bandpass', freq: 300, q: 0.6, gain: 0.026 },
    air:  { type: 'highpass', freq: 2000, gain: 0.006 },
  },
  injury: {
    body: { type: 'lowpass', freq: 200, gain: 0.020 },
    air:  { type: 'highpass', freq: 3000, gain: 0.004 },
    rumble: 60,
  },
  pressroom: {
    body: { type: 'bandpass', freq: 260, q: 0.5, gain: 0.024 },
    air:  { type: 'bandpass', freq: 900, q: 0.5, gain: 0.010 },   // a crowd through a wall
  },
  tunnel: {
    body: { type: 'lowpass', freq: 180, gain: 0.030 },
    air:  { type: 'bandpass', freq: 700, q: 0.4, gain: 0.008 },   // concrete, and the ground above
    rumble: 40,
  },
  outdoor: {
    body: { type: 'lowpass', freq: 780, gain: 0.020 },
    air:  { type: 'bandpass', freq: 1750, q: 0.5, gain: 0.008 },
  },
  night: {
    body: { type: 'lowpass', freq: 420, gain: 0.014 },
    air:  { type: 'bandpass', freq: 2200, q: 1.6, gain: 0.008 },
  },
};

function buildBed(c, spec, seconds) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, seconds);
  src.loop = true;

  const filter = c.createBiquadFilter();
  filter.type = spec.type;
  filter.frequency.value = spec.freq;
  if (spec.q) filter.Q.value = spec.q;

  const g = c.createGain();
  g.gain.value = 0;
  g.gain.setTargetAtTime(spec.gain, c.currentTime, 0.5);   // fade in, never pop

  // a bed that never moves sounds like a broken fan; this drifts it slowly
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 0.03 + Math.random() * 0.06;
  lfoGain.gain.value = spec.gain * 0.35;
  lfo.connect(lfoGain).connect(g.gain);
  lfo.start();

  src.connect(filter).connect(g).connect(master);
  src.start();
  return { src, gain: g, lfo };
}

/**
 * A continuous bed: 'rain', 'crowd', 'room' or 'night', or null for silence.
 *
 * Each bed is layered — a body and a detail — and muting tears every layer down.
 * The previous version returned early when sound was disabled and left the loop
 * running, which sounded like static that never stopped.
 */
export function setAmbience(kind) {
  const wanted = enabled ? kind : null;

  if (!enabled) {
    if (ambience.layers && ambience.layers.length) stopAmbience(ctx);
    ambience.kind = null;
    return;
  }

  const c = context();
  if (!c) { ambience.kind = wanted; return; }

  if (ambience.kind === wanted && ambience.layers && ambience.layers.length) return;
  if (ambience.layers && ambience.layers.length) stopAmbience(c);
  if (!wanted) { ambience.kind = null; return; }

  const spec = BED_SPECS[wanted] || BED_SPECS.room;
  const layers = [
    buildBed(c, spec.body, wanted === 'rain' ? 5 : 7),
    buildBed(c, spec.air, wanted === 'rain' ? 3 : 5),
  ];

  let rumble = null;
  if (spec.rumble) {
    rumble = c.createOscillator();
    const humGain = c.createGain();
    rumble.type = 'sine';
    rumble.frequency.value = spec.rumble;
    humGain.gain.value = 0;
    humGain.gain.setTargetAtTime(0.014, c.currentTime, 0.6);
    rumble.connect(humGain).connect(master);
    rumble.start();
  }

  ambience = { kind: wanted, layers, rumble };
  ambienceCreated += 1;
}


/**
 * Each place sounds like itself.
 *
 * A bed underneath (rain, crowd, room, night, outdoor) and then accents that
 * arrive at random intervals, so a scene you sit in for a while keeps changing.
 * The kite is that a kitchen has a kettle and a radio through a wall, and the
 * training ground has studs, a struck ball and a coach you cannot hear properly.
 */
const SCENE_SOUND = {
  kitchen:   { bed: 'kitchen',    accents: ['kettle', 'cup', 'radio', 'cupboard', 'doorSoft', 'dishes', 'tvMuffled', 'kettleClick', 'voices', 'murmur', 'musicBox', 'fridgeOpen', 'microwave', 'tapRunning', 'washingMachine', 'doorbell', 'stairs', 'floorboard', 'curtains', 'tvStatic', 'catMeow'], every: [5, 11], gain: 0.75 },
  street:    { bed: 'outdoor', accents: ['car', 'dog', 'steps', 'doorSoft', 'wind', 'train', 'seagull', 'bus', 'siren', 'bikeBell', 'puddleStep', 'rainGutter', 'leavesRustle', 'windGust', 'thunderFar'], every: [6, 12], gain: 0.6 },
  office:    { bed: 'office',    accents: ['phoneRing', 'chair', 'paper', 'murmur', 'keys', 'penScribble', 'stairs', 'doorbell'], every: [8, 16], gain: 0.6 },
  dressing:  { bed: 'dressing',    accents: ['locker', 'boots', 'voices', 'clatter', 'keys', 'seatCreak', 'teamTalk', 'managerShout', 'curtains'], every: [5, 10], gain: 0.7 },
  training:  { bed: 'outdoor', accents: ['ballThud', 'shout', 'whistleBlip', 'bootsGravel', 'grassWhoosh', 'netRipple', 'ballBounce', 'managerShout', 'crowdGroan', 'windGust'], every: [3, 7], gain: 0.85 },
  trial:     { bed: 'rain',    accents: ['ballThud', 'shout', 'whistleBlip', 'bootsGravel', 'grassWhoosh', 'netRipple'], every: [4, 9], gain: 0.8 },
  firstteam: { bed: 'crowd',   accents: ['chant', 'roarFar', 'whistleBlip', 'ballThud', 'paAnnounce', 'netRipple', 'crossbar', 'crowdGroan', 'ballBounce', 'teamTalk', 'cameraBurst'], every: [6, 12], gain: 0.85 },
  move:      { bed: 'crowd',   accents: ['chant', 'roarFar', 'shout', 'paAnnounce', 'grassWhoosh', 'crossbar', 'crowdGroan', 'cameraBurst', 'teamTalk'], every: [6, 13], gain: 0.8 },
  decline:   { bed: 'rain',    accents: ['roarFar', 'wind', 'gate', 'seagull', 'train', 'rainGutter', 'leavesRustle', 'crowdGroan', 'thunderFar'], every: [9, 17], gain: 0.55 },
  injury:    { bed: 'injury',    accents: ['monitor', 'trolley', 'doorSoft', 'chair', 'steps', 'wheelchair', 'curtainPull', 'breathIn', 'breathOut'], every: [6, 12], gain: 0.6 },
  pressroom: { bed: 'pressroom',    accents: ['camera', 'murmur', 'chair', 'paper', 'keys', 'penScribble', 'cameraBurst', 'teamTalk'], every: [4, 10], gain: 0.7 },
  tunnel:    { bed: 'tunnel',    accents: ['steps', 'roarFar', 'boots', 'paAnnounce', 'teamTalk', 'crowdGroan', 'breathIn'], every: [5, 11], gain: 0.7 },
  garden:    { bed: 'night',   accents: ['birds', 'wind', 'hedge', 'gate', 'seagull', 'musicBox', 'leavesRustle', 'sprinkler', 'mowerFar', 'catMeow', 'windGust', 'chimeGood'], every: [5, 11], gain: 0.4 },
};

const DEFAULT_SOUND = { bed: 'room', accents: ['chair', 'paper', 'murmur'], every: [9, 18], gain: 0.5 };

let sceneTimer = null;
let sceneKey = null;
let accentCount = 0;

export function sceneSoundFor(key) {
  return SCENE_SOUND[key] || DEFAULT_SOUND;
}

function scheduleAccent(spec) {
  clearTimeout(sceneTimer);
  const [lo, hi] = spec.every;
  const wait = (lo + Math.random() * (hi - lo)) * 1000;
  sceneTimer = setTimeout(() => {
    if (!enabled || !sceneKey) return;
    const list = spec.accents || [];
    if (list.length) {
      const pick = list[Math.floor(Math.random() * list.length)];
      accentCount += 1;
      play(pick, { gain: spec.gain || 0.7 }).catch(() => {});
    }
    scheduleAccent(spec);
  }, wait);
}

/** Hand the soundscape to a place. Safe to call on every scene. */
export function setSceneAudio(key) {
  const next = key || null;
  if (next === sceneKey) return sceneKey;
  sceneKey = next;
  if (!enabled) return sceneKey;

  const spec = sceneSoundFor(next);
  setAmbience(spec.bed);
  scheduleAccent(spec);

  // let the place say hello once, shortly after you arrive
  if (spec.accents && spec.accents.length) {
    const hello = spec.accents[Math.floor(Math.random() * spec.accents.length)];
    setTimeout(() => {
      if (enabled && sceneKey === next) play(hello, { gain: (spec.gain || 0.7) * 0.8 }).catch(() => {});
    }, 1400);
  }
  return sceneKey;
}

export function stopSceneAudio() {
  clearTimeout(sceneTimer);
  sceneTimer = null;
  sceneKey = null;
  setAmbience(null);
}

export function sceneAudioDebug() {
  return { key: sceneKey, bed: ambience.kind, accents: accentCount, scheduled: Boolean(sceneTimer), layers: (ambience.layers || []).length };
}

/** Test hook: what the bed is doing, and how many times it has been started. */
/** Temporarily lower the bed (notifications, big moments). */
export function duckAmbience(amount = 0.45, ms = 900) {
  if (!ambience.layers || !ambience.layers.length) return;
  const c = context();
  if (!c) return;
  for (const layer of ambience.layers) {
    try {
      layer.gain.gain.cancelScheduledValues(c.currentTime);
      layer.gain.gain.setTargetAtTime(Math.max(0.0005, 0.03 * amount), c.currentTime, 0.12);
    } catch (e) {}
  }
  setTimeout(() => {
    const ctx2 = ctx;
    if (!ctx2 || !ambience.layers) return;
    const spec = BED_SPECS[ambience.kind];
    if (!spec) return;
    ambience.layers.forEach((layer, i) => {
      const target = i === 0 ? spec.body.gain : spec.air.gain;
      try { layer.gain.gain.setTargetAtTime(target, ctx2.currentTime, 0.5); } catch (e) {}
    });
  }, ms);
}

export function ambienceDebug() {
  return { kind: ambience.kind, playing: Boolean(ambience.layers && ambience.layers.length), layers: (ambience.layers || []).length, created: ambienceCreated };
}

export async function play(name, { gain = 1, vary = true } = {}) {
  if (!enabled) return false;
  const c = context();
  if (!c) return false;

  variance = vary ? roll() : { gain: 1, rate: 1, pan: 0 };
  variance.gain *= gain;

  try {
    if (await tryFile(c, name)) return true;
    const fn = SYNTH[name];
    if (!fn) return false;
    variance.gain *= CUE_TRIM[name] || 1;
    fn(c);
    return true;
  } catch (e) {
    return false;
  } finally {
    variance = { gain: 1, rate: 1, pan: 0 };
  }
}

/**
 * Render every cue offline and measure it.
 *
 * A cue that throws is obvious; a cue that renders silence is not. This plays
 * each one into an OfflineAudioContext and reports peak and RMS, so "it works"
 * means "it produced sound", not "it did not throw".
 */
export async function auditCues({ seconds = 3 } = {}) {
  if (!SYNTH) return [];
  const results = [];
  for (const name of Object.keys(SYNTH)) {
    const rate = 44100;
    const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Offline) return [];
    const off = new Offline(1, Math.ceil(rate * seconds), rate);
    const realCtx = ctx;
    const realMaster = master;
    const realEnabled = enabled;
    // point the synth at the offline graph for the length of one render
    ctx = off;
    master = off.createGain();
    master.gain.value = 1;
    master.connect(off.destination);
    enabled = true;
    variance = { gain: CUE_TRIM[name] || 1, rate: 1, pan: 0 };
    let threw = null;
    try { SYNTH[name](off); } catch (e) { threw = e.message; }
    let buffer = null;
    try { buffer = await off.startRendering(); } catch (e) { threw = threw || e.message; }
    ctx = realCtx;
    master = realMaster;
    enabled = realEnabled;
    variance = { gain: 1, rate: 1, pan: 0 };

    let peak = 0;
    let sum = 0;
    let count = 0;
    let loudFor = 0;
    if (buffer) {
      const d = buffer.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        const v = Math.abs(d[i]);
        if (v > peak) peak = v;
        sum += d[i] * d[i];
        count++;
        if (v > 0.002) loudFor = i / rate;
      }
    }
    results.push({
      name,
      threw,
      peak: +peak.toFixed(3),
      rms: +(Math.sqrt(sum / Math.max(1, count))).toFixed(4),
      audibleFor: +loudFor.toFixed(2),
      silent: !buffer || peak < 0.01,
    });
  }
  return results;
}

/** Which cue belongs to a scene, by id prefix where no exact match exists. */
const AMBIENCE_BY_CHAPTER = ['rain', 'crowd', 'room', 'crowd', 'rain', 'night'];

export function ambienceFor(chapter = 0, kind = 'story') {
  if (kind === 'match') return 'crowd';
  if (kind === 'training') return 'room';
  return AMBIENCE_BY_CHAPTER[Math.max(0, Math.min(5, chapter))] || 'room';
}

export function cueForScene(sceneId) {
  const exact = {
    'the-call': 'letter',
    'match-day': 'kick',
    'training-block': 'boots',
    'the-last-match': 'whistleLong',
    'mei-nights': 'kettle',
    'the-first-week': 'clatter',
    'the-brother': 'horn',
    'the-agent': 'keys',
    'the-interview': 'shutter',
    'the-first-week': 'chalk',
    'the-offer': 'carDoor',
    'the-scan': 'door',
    'retirement': 'stingChapter',
    'the-garden': 'nightfall',
    'the-big-club': 'carDoor',
    'the-return': 'bounce',
    'the-farewell': 'clap',
    'the-interview': 'clap',
    'dropped': 'whistleLong',
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
