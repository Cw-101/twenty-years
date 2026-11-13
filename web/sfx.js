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
    master.gain.value = 0.55;

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
    for (const layer of old.layers) { try { layer.src.stop(); } catch (e) {} }
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

  src.connect(filter).connect(g).connect(master);
  src.start();
  return { src, gain: g };
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
