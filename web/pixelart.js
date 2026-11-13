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
  fade:   { sky: ['#5a5e66', '#676c75', '#767c86', '#878e99'], ground: '#2a3138', light: '#f2e6d2', far: '#3a414a' },
  garden: { sky: ['#182034', '#1f2942', '#283452', '#334063'], ground: '#151b22', light: '#ffd9a0', far: '#1c2331' },
  warm:   { sky: ['#2a2118', '#332820', '#3d3026', '#473a2e'], ground: '#221a14', light: '#ffcf94', far: '#2c241c' },
  neon:   { sky: ['#141426', '#1b1b33', '#222341', '#2a2b4f'], ground: '#171726', light: '#ffd2f0', far: '#1d1d30' },
  steam:  { sky: ['#2c3230', '#343b38', '#3d4541', '#47504c'], ground: '#232a27', light: '#dff0e4', far: '#2a312e' },
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
    ctx.fillStyle = i % 2 ? '#3a4a5b' : '#2f3c4b';
    ctx.fillRect(Math.floor((W / 8) * i), y, Math.ceil(W / 8), H - y);
  }
  // a goal, so the ground reads as a football pitch
  ctx.strokeStyle = '#6b7d92';
  ctx.lineWidth = 1;
  ctx.strokeRect(58, y + 12, 44, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(58, y + 12, 44, 10);
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
        if (rand() > 0.55) {
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
    // a car waiting with its lights on
    ctx.fillStyle = '#0b0f15';
    ctx.fillRect(66, 64, 18, 6);
    ctx.fillRect(69, 61, 11, 3);
    ctx.fillStyle = pal.light;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(83, 65, 2, 2);
    ctx.globalAlpha = 1;
    floodlight(ctx, 34, 56, pal, 16);
    floodlight(ctx, 126, 56, pal, 16);
    lightPool(ctx, 34, 56, pal, 24);
    lightPool(ctx, 126, 56, pal, 24);
  },

  /* first team: a proper ground at night */
  firstteam(ctx, pal, rand) {
    bandSky(ctx, pal);
    stars(ctx, rand, 34);
    floodlight(ctx, 20, 58, pal, 34);
    floodlight(ctx, 140, 58, pal, 34);
    // two tiers, with a roof line
    stand(ctx, 20, 54, 120, 24, pal, rand);
    ctx.fillStyle = SILHOUETTE;
    ctx.fillRect(20, 30, 120, 3);
    stand(ctx, 28, 30, 104, 10, pal, rand);
    // scoreboard hanging under the roof
    ctx.fillStyle = '#05070b';
    ctx.fillRect(72, 33, 16, 8);
    ctx.fillStyle = pal.light;
    ctx.globalAlpha = 0.75;
    ctx.fillRect(74, 35, 12, 1);
    ctx.fillRect(74, 38, 5, 1);
    ctx.globalAlpha = 1;
    pitch(ctx, 58, pal);
    lightPool(ctx, 20, 58, pal, 36);
    lightPool(ctx, 140, 58, pal, 36);
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
    // fluorescent strip on the ceiling
    ctx.fillStyle = pal.light;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(48, 24, 44, 2);
    ctx.globalAlpha = 0.10;
    ctx.fillRect(40, 26, 60, 14);
    ctx.globalAlpha = 1;
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
    floodlight(ctx, 8, 56, pal, 38);
    floodlight(ctx, 152, 56, pal, 38);
    stand(ctx, 0, 52, W, 30, pal, rand);
    ctx.fillStyle = SILHOUETTE;
    ctx.fillRect(0, 36, W, 4);
    stand(ctx, 8, 28, 144, 14, pal, rand);
    ctx.fillStyle = SILHOUETTE;
    ctx.fillRect(0, 24, W, 4);
    stand(ctx, 18, 16, 124, 12, pal, rand);
    pitch(ctx, 56, pal);
    lightPool(ctx, 8, 56, pal, 40);
    lightPool(ctx, 152, 56, pal, 40);
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

/* ---------------------------------------------------------------- more places */

/* the kitchen: the table, the window over the sink, the kettle */
SCENES.kitchen = (ctx, pal, rand) => {
  // wall
  ctx.fillStyle = '#241d16';
  ctx.fillRect(0, 0, W, H);
  // wallpaper stripes
  for (let x = 0; x < W; x += 6) {
    ctx.fillStyle = 'rgba(255,255,255,0.018)';
    ctx.fillRect(x, 0, 3, H);
  }
  // window over the sink, night outside
  ctx.fillStyle = '#0d1220';
  ctx.fillRect(96, 12, 44, 30);
  ctx.fillStyle = '#1a2237';
  for (let y = 12; y < 42; y += 6) ctx.fillRect(96, y, 44, 3);
  ctx.fillStyle = '#e8c98a';
  ctx.globalAlpha = 0.5;
  ctx.fillRect(116, 32, 2, 2);
  ctx.globalAlpha = 1;
  // frame
  ctx.strokeStyle = '#15100b';
  ctx.lineWidth = 1;
  ctx.strokeRect(96, 12, 44, 30);
  ctx.fillStyle = '#15100b';
  ctx.fillRect(117, 12, 1, 30);
  // counter and sink
  ctx.fillStyle = '#2b2318';
  ctx.fillRect(90, 42, 60, 4);
  ctx.fillStyle = '#1b1610';
  ctx.fillRect(96, 46, 44, 10);
  // table, in the foreground
  ctx.fillStyle = '#33261a';
  ctx.fillRect(10, 62, 92, 4);
  ctx.fillStyle = '#241a11';
  ctx.fillRect(14, 66, 3, 12);
  ctx.fillRect(95, 66, 3, 12);
  // an unopened letter on the table
  ctx.fillStyle = '#d8cfbc';
  ctx.globalAlpha = 0.75;
  ctx.fillRect(28, 58, 9, 4);
  ctx.globalAlpha = 1;
  // kettle on the counter
  ctx.fillStyle = '#3a3a3c';
  ctx.fillRect(120, 36, 7, 6);
  ctx.fillRect(126, 37, 3, 2);
};

/* the street: terraces, a lamp, a car with the engine on */
SCENES.street = (ctx, pal, rand) => {
  bandSky(ctx, pal);
  stars(ctx, rand, 14);
  houses(ctx, 58, pal, rand, 8);
  // pavement and road
  ctx.fillStyle = '#1b1b1e';
  ctx.fillRect(0, 58, W, 10);
  ctx.fillStyle = '#141416';
  ctx.fillRect(0, 68, W, H - 68);
  // lamp post
  ctx.fillStyle = '#0c0f14';
  ctx.fillRect(38, 34, 2, 34);
  ctx.fillRect(34, 32, 10, 2);
  ctx.fillStyle = pal.light;
  ctx.globalAlpha = 0.95;
  ctx.fillRect(37, 33, 6, 3);
  ctx.globalAlpha = 0.20;
  ctx.beginPath(); ctx.moveTo(34, 36); ctx.lineTo(46, 36); ctx.lineTo(58, 68); ctx.lineTo(22, 68); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  // a car, idling, headlights on
  ctx.fillStyle = '#0b0e13';
  ctx.fillRect(96, 64, 30, 9);
  ctx.fillRect(102, 59, 17, 5);
  ctx.fillStyle = pal.light;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(124, 66, 3, 2);
  ctx.globalAlpha = 0.18;
  ctx.fillRect(127, 66, 20, 3);
  ctx.globalAlpha = 1;
  // wet road reflection
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = pal.light;
  ctx.fillRect(96, 74, 30, 1);
  ctx.globalAlpha = 1;
};

/* the agent's office: blinds, a desk, two chairs, a lamp */
SCENES.office = (ctx, pal, rand) => {
  ctx.fillStyle = '#20242b';
  ctx.fillRect(0, 0, W, H);
  // blinds
  for (let y = 8; y < 46; y += 5) {
    ctx.fillStyle = '#2b313a';
    ctx.fillRect(14, y, 58, 3);
  }
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(12, 6, 62, 2);
  ctx.fillStyle = pal.light;
  ctx.globalAlpha = 0.12;
  ctx.fillRect(14, 8, 58, 38);
  ctx.globalAlpha = 1;
  // desk
  ctx.fillStyle = '#2a2018';
  ctx.fillRect(6, 60, 120, 5);
  ctx.fillStyle = '#1b1611';
  ctx.fillRect(12, 65, 4, 18);
  ctx.fillRect(112, 65, 4, 18);
  // papers and a pen
  ctx.fillStyle = '#d9d2c2';
  ctx.globalAlpha = 0.8;
  ctx.fillRect(22, 56, 14, 4);
  ctx.fillRect(40, 57, 10, 3);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#0f0f10';
  ctx.fillRect(60, 58, 8, 1);
  // a chair facing him
  ctx.fillStyle = '#191d23';
  ctx.fillRect(84, 62, 16, 3);
  ctx.fillRect(88, 65, 2, 12);
  ctx.fillRect(96, 65, 2, 12);
  ctx.fillRect(84, 48, 3, 14);
  // a lamp on the desk
  ctx.fillStyle = pal.light;
  ctx.globalAlpha = 0.5;
  ctx.fillRect(100, 52, 5, 3);
  ctx.globalAlpha = 0.08;
  ctx.beginPath(); ctx.moveTo(100, 55); ctx.lineTo(106, 55); ctx.lineTo(116, 60); ctx.lineTo(92, 60); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
};

/* the dressing room: benches, pegs, shirts on hangers */
SCENES.dressing = (ctx, pal, rand) => {
  ctx.fillStyle = '#1c2026';
  ctx.fillRect(0, 0, W, H);
  for (let y = 18; y < H; y += 7) {
    ctx.fillStyle = 'rgba(255,255,255,0.012)';
    ctx.fillRect(0, y, W, 1);
  }
  // pegs and shirts
  ctx.fillStyle = '#12161b';
  ctx.fillRect(0, 34, W, 2);
  for (let x = 6; x < W; x += 18) {
    ctx.fillStyle = '#0e1216';
    ctx.fillRect(x, 30, 2, 5);
    ctx.fillStyle = x % 36 ? '#2a3038' : '#343b45';
    ctx.fillRect(x - 3, 36, 9, 14);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x - 3, 44, 9, 2);
  }
  // bench
  ctx.fillStyle = '#2a2019';
  ctx.fillRect(0, 66, W, 5);
  ctx.fillStyle = '#1a1410';
  ctx.fillRect(10, 71, 3, 12);
  ctx.fillRect(60, 71, 3, 12);
  ctx.fillRect(110, 71, 3, 12);
  // boots on the floor
  ctx.fillStyle = '#0f1114';
  ctx.fillRect(40, 84, 6, 4);
  ctx.fillRect(48, 85, 6, 3);
  // a strip light
  ctx.fillStyle = pal.light;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(50, 10, 56, 2);
  ctx.globalAlpha = 0.07;
  ctx.fillRect(40, 12, 76, 18);
  ctx.globalAlpha = 1;
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

const PALETTE_FOR_SCENE = {
  kitchen: 'warm', street: 'neon', office: 'warm', dressing: 'steam',
  injury: 'cold', garden: 'garden', move: 'bright', firstteam: 'night', decline: 'fade', trial: 'dusk',
};

export function backdropFor(chapter = 0, kind = 'story', explicit = null) {
  if (kind === 'title') return { name: 'firstteam', palette: 'night', weather: { crowd: true } };
  const index = Math.max(0, Math.min(5, chapter));

  if (explicit && SCENES[explicit]) {
    return {
      name: explicit,
      palette: PALETTE_FOR_SCENE[explicit] || PALETTE_BY_CHAPTER[index],
      weather: WEATHER[index],
    };
  }

  const name = kind === 'match' ? (index >= 2 ? 'move' : 'firstteam') : CHAPTER_SCENE[index];
  return { name, palette: kind === 'match' ? (index >= 2 ? 'bright' : 'night') : PALETTE_BY_CHAPTER[index], weather: WEATHER[index] };
}

/**
 * Paint a backdrop into a 2D context and keep its weather moving.
 * Returns a stop() function.
 */
export function drawBackdrop(ctx, { chapter = 0, kind = 'story', animate = true, scene = null } = {}) {
  const { name, palette, weather } = backdropFor(chapter, kind, scene);
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
