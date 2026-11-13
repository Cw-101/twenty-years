/**
 * Audio: the whisper you actually hear, and a room tone under the scene.
 *
 * Whisper clips are pre-generated MP3s (see scripts/generate-whisper-audio.mjs)
 * indexed by their exact text. Ambient is synthesised in the browser with
 * WebAudio — no asset, no licence, no download.
 *
 * Everything fails soft: no clip, no speechSynthesis, no AudioContext, and the
 * game carries on silently rather than throwing.
 */

let ctx = null;
let ambientNodes = null;
let ambientOn = false;
let index = null;

export async function loadWhisperIndex() {
  if (index) return index;
  try {
    const res = await fetch('./web/audio/index.json');
    index = res.ok ? await res.json() : {};
  } catch (e) {
    index = {};
  }
  return index;
}

function audioContext() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Play the spoken version of a whisper, if we have one. */
export async function playWhisper(text) {
  if (!text) return false;
  const map = await loadWhisperIndex();
  const file = map[text];
  if (file) {
    try {
      const audio = new Audio(file);
      audio.volume = 0.9;
      await audio.play();
      return true;
    } catch (e) { /* fall through to speech synthesis */ }
  }
  if ('speechSynthesis' in window) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.pitch = 0.9;
      u.volume = 0.85;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      return true;
    } catch (e) { /* silent */ }
  }
  return false;
}

function buildAmbient(context) {
  const master = context.createGain();
  master.gain.value = 0.0;
  master.connect(context.destination);

  // two low drones a fifth apart
  const freqs = [55, 82.5];
  const oscs = freqs.map((f, i) => {
    const osc = context.createOscillator();
    osc.type = i === 0 ? 'sine' : 'triangle';
    osc.frequency.value = f;
    const g = context.createGain();
    g.gain.value = i === 0 ? 0.22 : 0.1;
    osc.connect(g).connect(master);
    osc.start();

    // slow swell
    const lfo = context.createOscillator();
    lfo.frequency.value = 0.03 + i * 0.017;
    const lfoGain = context.createGain();
    lfoGain.gain.value = i === 0 ? 0.1 : 0.05;
    lfo.connect(lfoGain).connect(g.gain);
    lfo.start();
    return [osc, lfo];
  });

  // filtered noise — the room
  const len = context.sampleRate * 4;
  const buffer = context.createBuffer(1, len, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.2;
  }
  const noise = context.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const lp = context.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 420;
  const ng = context.createGain();
  ng.gain.value = 0.12;
  noise.connect(lp).connect(ng).connect(master);
  noise.start();

  return { master, oscs, noise };
}

/** Turn the room tone on or off. Returns the new state. */
export function toggleAmbient() {
  const context = audioContext();
  if (!context) return false;

  if (!ambientNodes) ambientNodes = buildAmbient(context);

  ambientOn = !ambientOn;
  const now = context.currentTime;
  ambientNodes.master.gain.cancelScheduledValues(now);
  ambientNodes.master.gain.linearRampToValueAtTime(ambientOn ? 0.16 : 0.0, now + 1.2);
  return ambientOn;
}

/** Duck the room tone while a whisper plays, so the words sit above it. */
export async function withDuck(fn) {
  if (!ambientNodes || !ambientOn) return fn();
  const context = audioContext();
  const g = ambientNodes.master.gain;
  const now = context.currentTime;
  g.cancelScheduledValues(now);
  g.linearRampToValueAtTime(0.05, now + 0.25);
  try {
    return await fn();
  } finally {
    const t = context.currentTime;
    g.cancelScheduledValues(t);
    g.linearRampToValueAtTime(0.16, t + 1.4);
  }
}

export function ambientState() {
  return ambientOn;
}
