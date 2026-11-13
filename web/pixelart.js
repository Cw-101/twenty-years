/**
 * Pixel-art backdrops, drawn at 160x90 and scaled up with no smoothing.
 *
 * No image files: each backdrop is a small set of rectangles, so the whole game
 * stays offline, instant, and about 8KB of code. Every scene gets weather and
 * movement — rain, drifting light, a crowd that shifts — because a still image
 * reads as a screensaver while a moving one reads as a place.
 */

const W = 160;
const H = 90;

const PALETTES = {
  dusk:   { sky: ['#2a3247', '#333c54', '#3d4762', '#4a5570'], ground: '#1b2230', light: '#ffd79a', far: '#232a3a' },
  night:  { sky: ['#141a2b', '#1a2135', '#222a42', '#2b344f'], ground: '#151b26', light: '#ffe6b0', far: '#1a2130' },
  cold:   { sky: ['#252c38', '#2d3542', '#353f4d', '#3e4a5a'], ground: '#1a2029', light: '#e8f0ff', far: '#1e242d' },
  bright: { sky: ['#243047', '#2c3a55', '#354665', '#405374'], ground: '#1b2230', light: '#fff0c4', far: '#232c3d' },
  fade:   { sky: ['#3a3a3c', '#444446', '#4d4d50', '#57575a'], ground: '#222225', light: '#d8cfc0', far: '#2a2a2d' },
  garden: { sky: ['#182034', '#1f2942', '#283452', '#334063'], ground: '#151b22', light: '#ffd9a0', far: '#1c2331' },
};

const SILHOUETTE = '#0c1017';

/** Deterministic pseudo-random so a backdrop does not shimmer between redraws. */
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function bandSky(ctx, pal) {
  const bands = pal.sky.length;
  for (let i = 0; i < bands; i++) {
    ctx.fillStyle = pal.sky[i];
    const y = Math.floor((H * i) / bands);
    const next = Math.floor((H * (i + 1)) / bands);
    ctx.fillRect(0, y, W, next - y);
  }
}

function stars(ctx, rand, count = 30) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(rand() * (H * 0.35));
    ctx.fillStyle = rand() > 0.7 ? '#5a6280' : '#3a4155';
    ctx.fillRect(x, y, 1, 1);
  }
}

/* ------------------------------------------------------------------ pieces */

function floodlight(ctx, x, y, pal, height = 18) {
  ctx.fillStyle = '#0d1017';
  ctx.fillRect(x, y - height, 2, height);          // pylon
  ctx.fillRect(x - 4, y - height - 5, 10, 5);      // head
  ctx.fillStyle = pal.light;
  for (let i = 0; i < 3; i++) ctx.fillRect(x - 3 + i * 3, y - height - 4, 2, 3);
  // light cone
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = pal.light;
  ctx.beginPath();
  ctx.moveTo(x - 4, y - height);
  ctx.lineTo(x + 6, y - height);
  ctx.lineTo(x + 26, y);
  ctx.lineTo(x - 26, y);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function stand(ctx, x, y, w, h, pal, rand) {
  ctx.fillStyle = SILHOUETTE;
  ctx.fillRect(x, y - h, w, h);
  // crowd speckle
  for (let i = 0; i < w * h * 0.25; i++) {
    const px = x + Math.floor(rand() * w);
    const py = y - h + Math.floor(rand() * h);
    ctx.fillStyle = rand() > 0.85 ? pal.light : '#1b2029';
    ctx.globalAlpha = rand() > 0.85 ? 0.5 : 0.8;
    ctx.fillRect(px, py, 1, 1);
  }
  ctx.globalAlpha = 1;
}

function lightPool(ctx, x, y, pal, w = 26) {
  const g = ctx.createRadialGradient(x, y + 6, 2, x, y + 6, w);
  g.addColorStop(0, 'rgba(255, 226, 176, 0.18)');
  g.addColorStop(1, 'rgba(255, 226, 176, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - w, y, w * 2, 26);
}

function pitch(ctx, y, pal) {
  // horizon haze
  const haze = ctx.createLinearGradient(0, y - 10, 0, y + 14);
  haze.addColorStop(0, 'rgba(255,215,160,0)');
  haze.addColorStop(0.45, 'rgba(255,215,160,0.10)');
  haze.addColorStop(1, 'rgba(255,215,160,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, y - 10, W, 24);

  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, y, W, H - y);
  // mown stripes
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#2d3945' : '#25303a';
    ctx.fillRect(Math.floor((W / 8) * i), y, Math.ceil(W / 8), H - y);
  }
  // touchline
  ctx.fillStyle = '#4a5464';
  ctx.fillRect(0, y, W, 1);
}

function houses(ctx, y, pal, rand, count = 7) {
  let x = -4;
  for (let i = 0; i < count; i++) {
    const w = 12 + Math.floor(rand() * 14);
    const h = 10 + Math.floor(rand() * 12);
    ctx.fillStyle = SILHOUETTE;
    ctx.fillRect(x, y - h, w, h);
    // a few lit windows
    for (let wy = y - h + 3; wy < y - 2; wy += 4) {
      for (let wx = x + 2; wx < x + w - 2; wx += 4) {
        if (rand() > 0.7) {
          ctx.fillStyle = pal.light;
          ctx.globalAlpha = 0.35 + rand() * 0.35;
          ctx.fillRect(wx, wy, 2, 2);
          ctx.globalAlpha = 1;
        }
      }
    }
    x += w + 2;
  }
}

function fence(ctx, y, rand) {
  ctx.fillStyle = '#1a1e26';
  ctx.fillRect(0, y - 6, W, 1);
  ctx.fillRect(0, y - 3, W, 1);
  for (let x = 0; x < W; x += 6) ctx.fillRect(x, y - 7, 1, 7);
}

function portakabin(ctx, x, y) {
  ctx.fillStyle = '#20252f';
  ctx.fillRect(x, y - 12, 26, 12);
  ctx.fillStyle = '#141820';
  ctx.fillRect(x, y - 13, 26, 1);
  ctx.fillStyle = '#39414f';
  ctx.fillRect(x + 3, y - 10, 7, 5);
  ctx.fillRect(x + 14, y - 10, 8, 5);
  ctx.fillStyle = '#2b313c';
  ctx.fillRect(x + 10, y - 5, 4, 5);
}

function window_light(ctx, x, y, w, h, pal) {
  ctx.fillStyle = pal.light;
  ctx.globalAlpha = 0.22;
  ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
  ctx.globalAlpha = 0.75;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------- backdrops */

const SCENES = {
  /* the trial: a municipal training ground at dusk */
  trial(ctx, pal, rand) {
    bandSky(ctx, pal);
    stars(ctx, rand, 18);
    houses(ctx, 56, pal, rand, 5);
    pitch(ctx, 56, pal);
    fence(ctx, 56, rand);
    portakabin(ctx, 108, 56);
    floodlight(ctx, 34, 56, pal, 16);
    floodlight(ctx, 126, 56, pal, 16);
    lightPool(ctx, 34, 56, pal, 24);
    lightPool(ctx, 126, 56, pal, 24);
  },

  /* first team: a proper ground at night */
  firstteam(ctx, pal, rand) {
    bandSky(ctx, pal);
    stars(ctx, rand, 34);
    floodlight(ctx, 22, 60, pal, 30);
    floodlight(ctx, 138, 60, pal, 30);
    stand(ctx, 40, 60, 80, 16, pal, rand);
    pitch(ctx, 60, pal);
    lightPool(ctx, 22, 60, pal, 34);
    lightPool(ctx, 138, 60, pal, 34);
    // centre circle
    ctx.strokeStyle = '#2c3340';
    ctx.beginPath();
    ctx.ellipse(W / 2, 76, 20, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  },

  /* the knee: a rehab room with one window */
  injury(ctx, pal, rand) {
    bandSky(ctx, pal);
    // interior wall
    ctx.fillStyle = '#1b1f26';
    ctx.fillRect(0, 20, W, H - 20);
    for (let y = 24; y < H; y += 6) {
      ctx.fillStyle = 'rgba(255,255,255,0.012)';
      ctx.fillRect(0, y, W, 1);
    }
    window_light(ctx, 100, 28, 34, 22, pal);
    // window bars
    ctx.fillStyle = '#0f1319';
    ctx.fillRect(116, 28, 1, 22);
    ctx.fillRect(100, 38, 34, 1);
    // a chair and a bench
    ctx.fillStyle = '#141820';
    ctx.fillRect(24, 68, 26, 3);
    ctx.fillRect(27, 71, 2, 8);
    ctx.fillRect(45, 71, 2, 8);
    ctx.fillRect(70, 60, 12, 16);
    ctx.fillStyle = '#1a1f28';
    ctx.fillRect(70, 74, 12, 2);
  },

  /* the move: big lights, empty seats */
  move(ctx, pal, rand) {
    bandSky(ctx, pal);
    stars(ctx, rand, 22);
    floodlight(ctx, 14, 58, pal, 34);
    floodlight(ctx, 146, 58, pal, 34);
    stand(ctx, 6, 58, 148, 22, pal, rand);
    pitch(ctx, 58, pal);
    ctx.fillStyle = '#242b36';
    ctx.fillRect(0, 58, W, 1);
  },

  /* the body: daylight, and the ground looks smaller than it did */
  decline(ctx, pal, rand) {
    bandSky(ctx, pal);
    houses(ctx, 52, pal, rand, 8);
    pitch(ctx, 52, pal);
    fence(ctx, 52, rand);
    // long shadows
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#000';
    for (let i = 0; i < 6; i++) ctx.fillRect(20 + i * 22, 52, 3, 20);
    ctx.globalAlpha = 1;
  },

  /* after: a small garden at night */
  garden(ctx, pal, rand) {
    bandSky(ctx, pal);
    stars(ctx, rand, 26);
    // house wall on the left with one lit window
    ctx.fillStyle = '#14181f';
    ctx.fillRect(0, 24, 46, H - 24);
    window_light(ctx, 14, 40, 16, 14, pal);
    // hedge
    ctx.fillStyle = '#151b16';
    for (let x = 40; x < W; x += 3) {
      const h = 8 + Math.floor(rand() * 5);
      ctx.fillRect(x, H - 16 - h, 3, h + 16);
    }
    // lawn
    ctx.fillStyle = '#222b22';
    ctx.fillRect(0, H - 14, W, 14);
    // a ball under the hedge
    ctx.fillStyle = '#2a2f28';
    ctx.fillRect(96, H - 8, 3, 3);
  },
};

/* --------------------------------------------------------------- weather */

function drawRain(ctx, rand, intensity) {
  ctx.fillStyle = '#6b7d9a';
  for (let i = 0; i < intensity; i++) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(rand() * H);
    ctx.globalAlpha = 0.12 + rand() * 0.14;
    ctx.fillRect(x, y, 1, 2 + (rand() > 0.8 ? 1 : 0));
  }
  ctx.globalAlpha = 1;
}

function drawFog(ctx, t, pal) {
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = pal.light;
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(((t / 90) + i * 60) % (W + 40)) - 20;
    ctx.fillRect(x, 40 + i * 8, 40, 2);
  }
  ctx.globalAlpha = 1;
}

function drawCrowdShimmer(ctx, rand, y, w) {
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rand() * w);
    ctx.fillStyle = '#8a7452';
    ctx.globalAlpha = 0.10 + rand() * 0.12;
    ctx.fillRect(x, y + Math.floor(rand() * 12), 1, 1);
  }
  ctx.globalAlpha = 1;
}

const CHAPTER_SCENE = ['trial', 'firstteam', 'injury', 'move', 'decline', 'garden'];

const WEATHER = [
  { rain: 22, fog: true },   // trial — a wet February
  { rain: 0, crowd: true },  // first team — a night game
  { rain: 0, fog: false },   // injury — indoors, nothing moves but the light
  { rain: 0, crowd: true },  // move — bigger lights
  { rain: 8, fog: true },    // decline — drizzle
  { rain: 0, fog: false },   // after — a still evening
];

const PALETTE_BY_CHAPTER = ['dusk', 'night', 'cold', 'bright', 'fade', 'garden'];

export function backdropFor(chapter = 0, kind = 'story') {
  if (kind === 'title') return { name: 'firstteam', palette: 'night', weather: { crowd: true } };
  const index = Math.max(0, Math.min(5, chapter));
  const name = kind === 'match' ? (index >= 2 ? 'move' : 'firstteam') : CHAPTER_SCENE[index];
  return { name, palette: kind === 'match' ? (index >= 2 ? 'bright' : 'night') : PALETTE_BY_CHAPTER[index], weather: WEATHER[index] };
}

/**
 * Paint a backdrop into a 2D context and keep its weather moving.
 * Returns a stop() function.
 */
export function drawBackdrop(ctx, { chapter = 0, kind = 'story', animate = true } = {}) {
  const { name, palette, weather } = backdropFor(chapter, kind);
  const pal = PALETTES[palette] || PALETTES.dusk;
  const paint = SCENES[name] || SCENES.trial;

  const base = document.createElement('canvas');
  base.width = W; base.height = H;
  const bctx = base.getContext('2d');
  const rand = seeded(1337 + chapter * 97);
  paint(bctx, pal, rand);

  let raf = null;
  let t = 0;
  let stop = false;

  const frame = () => {
    if (stop) return;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(base, 0, 0);
    const r = seeded(9001 + Math.floor(t / 7));
    if (weather.rain) drawRain(ctx, r, weather.rain);
    if (weather.fog) drawFog(ctx, t, pal);
    if (weather.crowd) drawCrowdShimmer(ctx, r, 44, W);
    t += 1;
    raf = requestAnimationFrame(frame);
  };

  if (animate) frame(); else { ctx.drawImage(base, 0, 0); }

  return () => { stop = true; if (raf) cancelAnimationFrame(raf); };
}

export const BACKDROP_SIZE = { width: W, height: H };
