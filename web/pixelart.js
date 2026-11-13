/**
 * Pixel-art backdrops, drawn at 160x90 and scaled up with no smoothing.
 *
 * No image files: each backdrop is a small set of rectangles, so the whole game
 * stays offline, instant, and about 8KB of code. Every scene gets weather and
 * movement — rain, drifting light, a crowd that shifts — because a still image
 * reads as a screensaver while a moving one reads as a place.
 */

const W = 160;   // the coordinate space every scene painter draws in
const H = 90;
const SW = W * 2;  // what we actually render at: 320 x 180
const SH = H * 2;

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

function stars(ctx, rand, count = 30, pal = null) {
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(rand() * (H * 0.35));
    ctx.fillStyle = rand() > 0.85 ? (pal ? pal.light : '#8a93b0') : (rand() > 0.6 ? '#5a6280' : '#3a4155');
    ctx.globalAlpha = rand() > 0.85 ? 0.7 : 0.9;
    ctx.fillRect(x, y, 1, 1);
    ctx.globalAlpha = 1;
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
  haze.addColorStop(0.45, 'rgba(255,215,160,0.05)');
  haze.addColorStop(1, 'rgba(255,215,160,0)');
  ctx.fillStyle = haze;
  ctx.fillRect(0, y - 10, W, 24);

  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, y, W, H - y);
  // mown stripes
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? '#1b2c20' : '#16241a';
    ctx.fillRect(Math.floor((W / 8) * i), y, Math.ceil(W / 8), H - y);
  }
  // a goal, so the ground reads as a football pitch
  ctx.strokeStyle = '#6b7d92';
  ctx.lineWidth = 1;
  ctx.strokeRect(58, y + 12, 44, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.fillRect(58, y + 12, 44, 10);
  // a touch of wear in the goalmouth
  ctx.fillStyle = 'rgba(120, 96, 60, 0.10)';
  ctx.fillRect(66, y + 10, 28, 4);
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

function goalNet(ctx, x, y, w = 34, h = 12) {
  // posts and crossbar, then a net you can almost see
  ctx.fillStyle = 'rgba(225, 235, 245, 0.42)';
  ctx.fillRect(x, y, 0.5, h);
  ctx.fillRect(x + w, y, 0.5, h);
  ctx.fillRect(x, y, w, 0.5);

  ctx.strokeStyle = 'rgba(200, 220, 240, 0.07)';
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  for (let i = 1; i < 7; i++) {
    ctx.moveTo(x + (w / 7) * i, y + 0.6);
    ctx.lineTo(x + (w / 7) * i, y + h);
  }
  for (let j = 1; j < 4; j++) {
    ctx.moveTo(x + 0.6, y + (h / 4) * j);
    ctx.lineTo(x + w, y + (h / 4) * j);
  }
  ctx.stroke();
}

/* a person, roughly: head, shoulders, legs. Reads as human at any size. */
function figure(ctx, x, y, colour = '#0a0d12', tall = 1) {
  ctx.fillStyle = colour;
  ctx.fillRect(x, y, 1.4, 1.6);            // head
  ctx.fillRect(x - 0.7, y + 1.8, 3, 3.4 * tall);  // body
  ctx.fillRect(x - 0.5, y + 1.8 + 3.4 * tall, 0.9, 2.6 * tall);  // legs
  ctx.fillRect(x + 1.1, y + 1.8 + 3.4 * tall, 0.9, 2.6 * tall);
}

function cones(ctx, y, count = 6) {
  for (let i = 0; i < count; i++) {
    const x = 18 + i * 22;
    ctx.fillStyle = '#c86a3a';
    ctx.fillRect(x, y - 2, 3, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x, y - 2, 3, 1);
  }
}

function puddle(ctx, x, y, w, pal) {
  ctx.fillStyle = 'rgba(140, 175, 210, 0.20)';
  ctx.fillRect(x, y, w, 2);
  ctx.fillStyle = pal.light;
  ctx.globalAlpha = 0.12;
  ctx.fillRect(x + 2, y, Math.max(2, w - 6), 1);
  ctx.globalAlpha = 1;
}

function tiers(ctx, x, y, w, rows, pal, rand) {
  for (let r = 0; r < rows; r++) {
    const ry = y - r * 6;
    ctx.fillStyle = '#0b0e14';
    ctx.fillRect(x, ry - 5, w, 5);
    for (let i = 0; i < w * 0.5; i++) {
      const px = x + Math.floor(rand() * w);
      const py = ry - 4 + Math.floor(rand() * 4);
      ctx.fillStyle = rand() > 0.86 ? pal.light : '#1a1f28';
      ctx.globalAlpha = rand() > 0.86 ? 0.45 : 0.75;
      ctx.fillRect(px, py, 1, 1);
    }
    ctx.globalAlpha = 1;
  }
}

function moon(ctx, x, y, pal) {
  ctx.fillStyle = pal.light;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(x, y, 3, 3);
  ctx.globalAlpha = 0.12;
  ctx.fillRect(x - 2, y - 1, 7, 5);
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
    cones(ctx, 68, 5);
    puddle(ctx, 40, 76, 26, pal);
    puddle(ctx, 96, 84, 20, pal);
  },

  /* first team: a proper ground at night */
  firstteam(ctx, pal, rand) {
    bandSky(ctx, pal);
    stars(ctx, rand, 34);
    floodlight(ctx, 20, 58, pal, 34);
    floodlight(ctx, 140, 58, pal, 34);
    // two tiers, with a roof line
    tiers(ctx, 20, 54, 120, 2, pal, rand);
    ctx.fillStyle = SILHOUETTE;
    ctx.fillRect(20, 42, 120, 3);
    tiers(ctx, 28, 40, 104, 2, pal, rand);
    ctx.fillStyle = SILHOUETTE;
    ctx.fillRect(20, 29, 120, 3);
    // scoreboard hanging under the roof
    ctx.fillStyle = '#05070b';
    ctx.fillRect(72, 33, 16, 8);
    ctx.fillStyle = pal.light;
    ctx.globalAlpha = 0.75;
    ctx.fillRect(74, 35, 12, 1);
    ctx.fillRect(74, 38, 5, 1);
    ctx.globalAlpha = 1;
    pitch(ctx, 58, pal);
    goalNet(ctx, 58, 52, 44, 10);
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
    /* a room built around a bed */
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

    // a drip stand, and the bag that hangs from it
    ctx.fillStyle = '#586570';
    ctx.fillRect(26, 44, 1, 34);
    ctx.fillRect(22, 44, 9, 1);
    ctx.fillStyle = 'rgba(214, 232, 240, 0.32)';
    ctx.fillRect(21, 45, 4, 9);
    ctx.fillStyle = 'rgba(214, 232, 240, 0.18)';
    ctx.fillRect(22, 54, 1, 18);

    // a bedside table with the get-well cards nobody sends
    ctx.fillStyle = '#2b3037';
    ctx.fillRect(52, 64, 18, 2);
    ctx.fillStyle = '#20252b';
    ctx.fillRect(54, 66, 2, 10);
    ctx.fillRect(66, 66, 2, 10);
    ctx.fillStyle = 'rgba(230, 200, 160, 0.30)';
    ctx.fillRect(55, 61, 5, 3);
    ctx.fillRect(62, 62, 4, 2);

    // the plastic chair somebody sat in for nine months
    ctx.fillStyle = '#333a42';
    ctx.fillRect(86, 60, 10, 2);
    ctx.fillRect(86, 62, 1, 14);
    ctx.fillRect(95, 62, 1, 14);
    ctx.fillRect(84, 50, 1, 12);
    ctx.fillRect(96, 50, 2, 12);
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
    tiers(ctx, 0, 52, W, 3, pal, rand);
    ctx.fillStyle = SILHOUETTE;
    ctx.fillRect(0, 36, W, 4);
    tiers(ctx, 8, 30, 144, 2, pal, rand);
    ctx.fillStyle = SILHOUETTE;
    ctx.fillRect(0, 24, W, 4);
    tiers(ctx, 18, 16, 124, 2, pal, rand);
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
    goalNet(ctx, 60, 46, 40, 9);
    puddle(ctx, 30, 78, 24, pal);
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
    // a fence between this garden and the next
    ctx.fillStyle = '#101519';
    for (let x = 40; x < W; x += 9) ctx.fillRect(x, 62, 1, 12);
    ctx.fillRect(40, 64, W - 40, 1);
    // lawn, with two mowing stripes
    ctx.fillStyle = '#232d23';
    ctx.fillRect(0, H - 14, W, 14);
    ctx.fillStyle = '#1e2820';
    ctx.fillRect(18, H - 14, 26, 14);
    ctx.fillRect(90, H - 14, 24, 14);
    // a bench that has not been sat on in years
    ctx.fillStyle = '#241d16';
    ctx.fillRect(58, 70, 20, 2);
    ctx.fillRect(58, 74, 20, 2);
    ctx.fillStyle = '#191410';
    ctx.fillRect(59, 72, 1, 6);
    ctx.fillRect(76, 72, 1, 6);
    // a ball under the hedge
    ctx.fillStyle = '#3a3f38';
    ctx.fillRect(96, H - 8, 3, 3);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(97, H - 8, 1, 1);
    moon(ctx, 118, 14, pal);
  },
};

/* ---------------------------------------------------------------- more places */

/* a training session: cones, a goal, puddles */
SCENES.training = (ctx, pal, rand) => {
  bandSky(ctx, pal);
  stars(ctx, rand, 10);
  houses(ctx, 48, pal, rand, 4);
  pitch(ctx, 48, pal);
  fence(ctx, 48, rand);
  goalNet(ctx, 56, 40, 32, 8);
  cones(ctx, 66, 6);
  puddle(ctx, 24, 74, 22, pal);
  puddle(ctx, 96, 80, 18, pal);
  floodlight(ctx, 12, 48, pal, 14);
  lightPool(ctx, 12, 48, pal, 22);
  // a lone figure, waiting
  figure(ctx, 84, 48, '#0a0d12', 1.1);
};

/* the press room: a table, microphones, a sponsor board */
SCENES.pressroom = (ctx, pal, rand) => {
  ctx.fillStyle = '#20252c';
  ctx.fillRect(0, 0, W, H);
  // sponsor board behind, with faint logos
  ctx.fillStyle = '#171c22';
  ctx.fillRect(8, 8, W - 16, 34);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.09)';
    ctx.fillRect(14 + i * 22, 16, 16, 6);
  }
  // table
  ctx.fillStyle = '#2c2219';
  ctx.fillRect(0, 62, W, 6);
  ctx.fillStyle = '#1b1510';
  ctx.fillRect(0, 68, W, 6);
  // microphones
  for (const x of [46, 62, 84, 102]) {
    ctx.fillStyle = '#0d0f12';
    ctx.fillRect(x, 54, 1, 8);
    ctx.fillRect(x - 2, 51, 5, 3);
    ctx.fillStyle = '#3a4048';
    ctx.fillRect(x - 2, 51, 5, 1);
  }
  // a water glass
  ctx.fillStyle = 'rgba(200, 220, 240, 0.25)';
  ctx.fillRect(28, 56, 4, 6);
  // flashes going off
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = pal.light;
    ctx.globalAlpha = 0.22 + rand() * 0.25;
    ctx.fillRect(Math.floor(rand() * W), 40 + Math.floor(rand() * 14), 1, 1);
  }
  ctx.globalAlpha = 1;
};

/* the tunnel: concrete, a bright mouth at the end */
SCENES.tunnel = (ctx, pal, rand) => {
  ctx.fillStyle = '#191d24';
  ctx.fillRect(0, 0, W, H);
  // the pitch, glimpsed at the end
  ctx.fillStyle = '#2b3f33';
  ctx.fillRect(58, 22, 44, 40);
  ctx.fillStyle = '#3a5544';
  ctx.fillRect(58, 22, 44, 12);
  ctx.fillStyle = pal.light;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(58, 22, 44, 40);
  ctx.globalAlpha = 1;
  // tunnel walls converging
  ctx.fillStyle = '#0d1015';
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(58, 22); ctx.lineTo(58, 62); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W, 0); ctx.lineTo(102, 22); ctx.lineTo(102, 62); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  // ceiling lights
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = 'rgba(255, 240, 210, 0.22)';
    ctx.fillRect(70 + i * 4, 8 + i * 3, 12, 1);
  }
  // figures in the mouth, silhouetted
  figure(ctx, 70, 42, '#06090c', 1.3);
  figure(ctx, 84, 40, '#06090c', 1.4);
};


/* the kitchen: the table, the window over the sink, the kettle */
SCENES.kitchen = (ctx, pal, rand) => {
  // wall
  ctx.fillStyle = '#302619';
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
  // a tiled splashback behind the counter
  for (let y = 52; y < 62; y += 3) {
    ctx.fillStyle = 'rgba(255, 240, 220, 0.045)';
    ctx.fillRect(4, y, 82, 1);
  }
  // the fridge, humming in the corner
  ctx.fillStyle = '#3a3f46';
  ctx.fillRect(2, 30, 16, 34);
  ctx.fillStyle = '#2b3037';
  ctx.fillRect(3, 31, 14, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(14, 34, 1, 10);
  ctx.fillRect(14, 52, 1, 8);
  // a plant on the sill, badly looked after
  ctx.fillStyle = '#2f4a32';
  ctx.fillRect(100, 9, 1, 5);
  ctx.fillRect(97, 11, 7, 3);
  ctx.fillRect(99, 7, 3, 4);
  ctx.fillStyle = '#7a4a34';
  ctx.fillRect(98, 14, 5, 3);
  // two chairs, and a mug left on the table
  ctx.fillStyle = '#33241a';
  ctx.fillRect(46, 64, 8, 2);
  ctx.fillRect(47, 66, 1, 8);
  ctx.fillRect(52, 66, 1, 8);
  ctx.fillRect(70, 64, 8, 2);
  ctx.fillRect(71, 66, 1, 8);
  ctx.fillRect(76, 66, 1, 8);
  ctx.fillStyle = '#d9c9b0';
  ctx.fillRect(60, 59, 3, 2);

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
  // bins waiting for the morning
  ctx.fillStyle = '#2a3038';
  ctx.fillRect(18, 62, 7, 12);
  ctx.fillRect(30, 64, 6, 10);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(19, 62, 5, 1);
  // a car parked under the lamp
  ctx.fillStyle = '#1b2028';
  ctx.fillRect(96, 66, 34, 8);
  ctx.fillRect(102, 61, 22, 6);
  ctx.fillStyle = 'rgba(255, 235, 200, 0.28)';
  ctx.fillRect(124, 63, 4, 2);
  ctx.fillStyle = '#12161c';
  ctx.fillRect(100, 74, 5, 3);
  ctx.fillRect(120, 74, 5, 3);
  // kerb line and a puddle with the lamp in it
  ctx.fillStyle = 'rgba(200, 210, 230, 0.10)';
  ctx.fillRect(0, 74, W, 1);
  ctx.fillStyle = 'rgba(255, 210, 150, 0.14)';
  ctx.fillRect(58, 76, 16, 2);

};

/* the agent's office: blinds, a desk, two chairs, a lamp */
SCENES.office = (ctx, pal, rand) => {
  ctx.fillStyle = '#2a2f38';
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
  // filing shelves along the wall
  ctx.fillStyle = '#2a2f36';
  ctx.fillRect(4, 26, 30, 3);
  ctx.fillRect(4, 34, 30, 3);
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = i % 3 ? '#3a4148' : '#4a5158';
    ctx.fillRect(6 + i * 3, 21, 2, 5);
  }
  // a noticeboard, with things pinned to it
  ctx.fillStyle = '#3b3128';
  ctx.fillRect(48, 14, 30, 18);
  ctx.fillStyle = 'rgba(240, 230, 210, 0.5)';
  ctx.fillRect(51, 17, 8, 6);
  ctx.fillRect(62, 18, 7, 5);
  ctx.fillRect(52, 26, 12, 4);
  // desk lamp, switched on
  ctx.fillStyle = '#c9a36a';
  ctx.fillRect(96, 44, 1, 10);
  ctx.fillStyle = 'rgba(255, 214, 150, 0.85)';
  ctx.beginPath();
  ctx.moveTo(92, 44); ctx.lineTo(100, 44); ctx.lineTo(98, 39); ctx.lineTo(94, 39);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255, 210, 150, 0.10)';
  ctx.beginPath(); ctx.arc(96, 44, 12, 0, Math.PI * 2); ctx.fill();

};

/* the dressing room: benches, pegs, shirts on hangers */
SCENES.dressing = (ctx, pal, rand) => {
  /* the room gets dressed: pegs, shirts, boots, a bag, a high window */
  ctx.fillStyle = '#252a32';
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
  // a high window, the only daylight in the building
  ctx.fillStyle = '#0e1626';
  ctx.fillRect(112, 6, 30, 14);
  ctx.fillStyle = 'rgba(180, 210, 235, 0.14)';
  ctx.fillRect(112, 6, 30, 5);
  ctx.strokeStyle = '#0a0d12';
  ctx.lineWidth = 1;
  ctx.strokeRect(112, 6, 30, 14);
  ctx.fillStyle = '#0a0d12';
  ctx.fillRect(126, 6, 1, 14);

  // bench
  ctx.fillStyle = '#3a2c20';
  ctx.fillRect(0, 66, W, 5);
  ctx.fillStyle = '#241a12';
  ctx.fillRect(0, 71, W, 2);
  ctx.fillStyle = '#1a1410';
  ctx.fillRect(10, 73, 3, 12);
  ctx.fillRect(60, 73, 3, 12);
  ctx.fillRect(120, 73, 3, 12);

  // boots under the bench
  for (const [bx, c] of [[16, '#12161b'], [24, '#191f26'], [70, '#12161b'], [128, '#191f26']]) {
    ctx.fillStyle = c;
    ctx.fillRect(bx, 60, 6, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.10)';
    ctx.fillRect(bx + 1, 60, 4, 1);
  }

  // kit bags on the bench
  ctx.fillStyle = '#20262e';
  ctx.fillRect(38, 56, 14, 10);
  ctx.fillRect(96, 58, 12, 8);
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(39, 57, 12, 1);

  // a towel, flung
  ctx.fillStyle = 'rgba(220, 225, 230, 0.12)';
  ctx.fillRect(84, 66, 9, 3);
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

function drawRain(ctx, rand, intensity, w = SW, h = SH) {
  ctx.fillStyle = '#6b7d9a';
  for (let i = 0; i < intensity; i++) {
    const x = Math.floor(rand() * w);
    const y = Math.floor(rand() * h);
    ctx.globalAlpha = 0.10 + rand() * 0.12;
    ctx.fillRect(x, y, 1, 3 + (rand() > 0.8 ? 2 : 0));
  }
  ctx.globalAlpha = 1;
}

function drawFog(ctx, t, pal, w = SW, y0 = 80) {
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = pal.light;
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(((t / 90) + i * 120) % (w + 80)) - 40;
    ctx.fillRect(x, y0 + i * 16, 80, 3);
  }
  ctx.globalAlpha = 1;
}

function drawCrowdShimmer(ctx, rand, y, w) {
  for (let i = 0; i < 40; i++) {
    const x = Math.floor(rand() * w);
    ctx.fillStyle = '#8a7452';
    ctx.globalAlpha = 0.10 + rand() * 0.12;
    ctx.fillRect(x, y + Math.floor(rand() * 24), 1, 1);
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------- detail pass
 * Every painter works in a 160x90 space and is then scaled 2x, which keeps the
 * chunky shapes but leaves them flat. These run afterwards at full 320x180 so
 * the extra resolution buys texture rather than just a bigger picture.
 */

function dGrass(ctx, rand, fromY, toY) {
  for (let i = 0; i < 260; i++) {
    const x = Math.floor(rand() * SW);
    const y = fromY + Math.floor(rand() * (toY - fromY));
    ctx.fillStyle = rand() > 0.55 ? 'rgba(150, 190, 140, 0.10)' : 'rgba(10, 20, 12, 0.14)';
    ctx.fillRect(x, y, 1, 1 + (rand() > 0.7 ? 1 : 0));
  }
}

function dCrowd(ctx, rand, y, h, w = SW) {
  for (let i = 0; i < 180; i++) {
    const x = Math.floor(rand() * w);
    const yy = y + Math.floor(rand() * h);
    ctx.fillStyle = rand() > 0.9 ? 'rgba(255, 226, 180, 0.30)' : 'rgba(20, 24, 34, 0.55)';
    ctx.fillRect(x, yy, 1, 1);
  }
}

function dSeams(ctx, rand, rows = 8) {
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  for (let i = 0; i < rows; i++) ctx.fillRect(0, 20 + i * 18, SW, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.022)';
  for (let i = 0; i < 60; i++) ctx.fillRect(Math.floor(rand() * SW), Math.floor(rand() * SH), 1, 1);
}

function dGlow(ctx, x, y, r, colour) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, colour);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function dGrain(ctx, rand) {
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.018)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(Math.floor(rand() * SW), Math.floor(rand() * SH), 1, 1);
  }
}

const DETAIL = {
  trial(ctx, rand) { dGrass(ctx, rand, 120, 180); dSeams(ctx, rand, 3); dGlow(ctx, 68, 112, 46, 'rgba(255, 214, 150, 0.10)'); dGrain(ctx, rand); },
  training(ctx, rand) { dGrass(ctx, rand, 120, 180); dGlow(ctx, 26, 96, 40, 'rgba(255, 214, 150, 0.10)'); dGrain(ctx, rand); },
  firstteam(ctx, rand) { dCrowd(ctx, rand, 40, 110); dGrass(ctx, rand, 120, 180); dGlow(ctx, 160, 96, 90, 'rgba(255, 226, 180, 0.08)'); dGrain(ctx, rand); },
  move(ctx, rand) { dCrowd(ctx, rand, 20, 120); dGrass(ctx, rand, 110, 180); dGlow(ctx, 160, 80, 110, 'rgba(255, 236, 200, 0.09)'); dGrain(ctx, rand); },
  decline(ctx, rand) { dGrass(ctx, rand, 120, 180); dSeams(ctx, rand, 2); dGrain(ctx, rand); },
  tunnel(ctx, rand) { dGrain(ctx, rand); dGlow(ctx, 160, 84, 58, 'rgba(255, 240, 205, 0.10)'); },
  pressroom(ctx, rand) { dSeams(ctx, rand, 2); dGrain(ctx, rand); },
  bedroom(ctx, rand) { dGrain(ctx, rand); dGlow(ctx, 96, 124, 74, 'rgba(255, 150, 70, 0.16)'); dGlow(ctx, 60, 100, 40, 'rgba(255, 200, 140, 0.10)'); },
  kitchen(ctx, rand) { dGrain(ctx, rand); dGlow(ctx, 210, 92, 56, 'rgba(255, 196, 120, 0.13)'); },
  office(ctx, rand) { dGrain(ctx, rand); dGlow(ctx, 200, 60, 60, 'rgba(210, 220, 255, 0.06)'); },
  dressing(ctx, rand) { dSeams(ctx, rand, 4); dGrain(ctx, rand); },
  injury(ctx, rand) { dGrain(ctx, rand); dGlow(ctx, 150, 60, 54, 'rgba(190, 220, 240, 0.09)'); },
  street(ctx, rand) { dGrain(ctx, rand); dGlow(ctx, 120, 66, 60, 'rgba(255, 208, 150, 0.12)'); },
  garden(ctx, rand) { dGrass(ctx, rand, 150, 180); dGrain(ctx, rand); dGlow(ctx, 236, 28, 40, 'rgba(220, 235, 255, 0.07)'); },
};


/* ------------------------------------------------------------------ portrait
 * A 16:9 scene cropped into a phone shows a quarter of the room and looks like
 * mud. Instead the landscape is drawn at the top and the ground is continued
 * toward the viewer with perspective, so the frame fills the screen and still
 * shows the whole composition.
 */

const GROUND_FAMILY = {
  trial: 'turf', training: 'turf', firstteam: 'turf', move: 'turf', decline: 'turf',
  kitchen: 'floor', office: 'floor', injury: 'floor', dressing: 'floor',
  pressroom: 'floor', tunnel: 'floor', bedroom: 'floor',
  street: 'road', garden: 'lawn',
};

function extendGround(ctx, scene, sceneH, totalH, name, pal, rand) {
  const family = GROUND_FAMILY[name] || 'floor';
  const bandH = totalH - sceneH;
  if (bandH <= 0) return;

  // stretch a band from just above the foreground, so a letter or a bench edge
  // in the last rows does not get smeared down the whole screen
  // sample the colour of the bottom rows and lay that down as the floor. Stretching
  // the pixels instead dragged whatever sat in those rows — a letter, a bench — down
  // the whole screen as a pale column.
  let floor = 'rgba(20, 15, 11, 1)';
  try {
    const sc2 = scene.getContext('2d');
    const d = sc2.getImageData(0, SH - 8, SW, 8).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    floor = `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`;
  } catch (e) { /* tainted canvas: fall back to a neutral floor */ }
  ctx.fillStyle = floor;
  ctx.fillRect(0, sceneH, SW, bandH);

  // darken as it comes toward the camera, so text sits on something calm
  const shade = ctx.createLinearGradient(0, sceneH - 8, 0, totalH);
  shade.addColorStop(0, 'rgba(0,0,0,0.12)');
  shade.addColorStop(0.12, 'rgba(0,0,0,0.04)');
  shade.addColorStop(0.5, 'rgba(0,0,0,0.26)');
  shade.addColorStop(1, 'rgba(0,0,0,0.58)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, sceneH, SW, bandH);

  // perspective: lines that converge on a point at the horizon are what makes
  // a flat band of colour read as ground going away from you
  const vpX = SW / 2;
  const spread = (y) => {
    const t = (y - sceneH) / bandH;
    return t * t;   // easing: slow near the horizon, fast near the camera
  };

  if (family === 'turf' || family === 'lawn') {
    // mown stripes, widening as they come toward the viewer
    const stripes = 9;
    for (let i = 0; i < stripes; i++) {
      if (i % 2) continue;
      const xTopA = vpX + ((i / stripes) - 0.5) * 40;
      const xTopB = vpX + (((i + 1) / stripes) - 0.5) * 40;
      const xBotA = vpX + ((i / stripes) - 0.5) * SW * 2.4;
      const xBotB = vpX + (((i + 1) / stripes) - 0.5) * SW * 2.4;
      ctx.beginPath();
      ctx.moveTo(xTopA, sceneH);
      ctx.lineTo(xTopB, sceneH);
      ctx.lineTo(xBotB, totalH);
      ctx.lineTo(xBotA, totalH);
      ctx.closePath();
      ctx.fillStyle = 'rgba(210, 235, 200, 0.035)';
      ctx.fill();
    }
    // turf texture that grows with distance toward the camera
    for (let i = 0; i < 420; i++) {
      const y = sceneH + Math.pow(rand(), 0.6) * bandH;
      const t = (y - sceneH) / bandH;
      const x = Math.floor(rand() * SW);
      const h = 1 + Math.floor(t * 3);
      ctx.fillStyle = rand() > 0.5 ? 'rgba(150, 195, 140, 0.10)' : 'rgba(6, 14, 9, 0.18)';
      ctx.fillRect(x, y, 1, h);
    }
  } else if (family === 'floor') {
    // boards converging toward the horizon
    for (let i = 0; i <= 12; i++) {
      const f = i / 12;
      const xTop = vpX + (f - 0.5) * 120;
      const xBot = vpX + (f - 0.5) * SW * 2.2;
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 1 + spread(totalH) * 1.5;
      ctx.beginPath();
      ctx.moveTo(xTop, sceneH);
      ctx.lineTo(xBot, totalH);
      ctx.stroke();
    }
    // a warm pool of lamp light on the boards
    const pool = ctx.createRadialGradient(vpX, sceneH + bandH * 0.28, 8, vpX, sceneH + bandH * 0.3, bandH * 0.55);
    pool.addColorStop(0, 'rgba(255, 205, 140, 0.16)');
    pool.addColorStop(1, 'rgba(255, 205, 140, 0)');
    ctx.fillStyle = pool;
    ctx.fillRect(0, sceneH, SW, bandH);
    // dust in the light
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = 'rgba(255, 235, 200, 0.06)';
      ctx.fillRect(Math.floor(rand() * SW), sceneH + Math.floor(rand() * bandH), 1, 1);
    }
  } else {
    // a road, with a kerb running away from you
    for (let i = 0; i < 3; i++) {
      const y = sceneH + Math.pow(i / 3, 1.7) * bandH;
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.fillRect(0, y, SW, 1);
    }
    ctx.strokeStyle = 'rgba(210, 215, 225, 0.10)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(vpX - 20, sceneH);
    ctx.lineTo(vpX - SW * 0.9, totalH);
    ctx.stroke();
  }

  // a foreground silhouette, out of focus, so the frame has a bottom edge
  const lipH = Math.round(totalH * 0.16);
  const lipY = totalH - lipH;

  if (family === 'turf' || family === 'lawn') {
    // grass in front of the camera
    for (let x = 0; x < SW; x += 2) {
      const h = 4 + Math.floor(rand() * lipH * 0.5);
      ctx.fillStyle = 'rgba(5, 10, 7, 0.85)';
      ctx.fillRect(x, totalH - h, 2, h);
    }
    ctx.fillStyle = 'rgba(4, 8, 6, 0.72)';
    ctx.fillRect(0, totalH - lipH * 0.35, SW, lipH * 0.35);
  } else if (family === 'floor') {
    // the edge of a table or counter, close to the lens
    ctx.fillStyle = 'rgba(6, 4, 3, 0.88)';
    ctx.fillRect(0, lipY + lipH * 0.42, SW, lipH * 0.58);
    ctx.fillStyle = 'rgba(255, 214, 160, 0.10)';
    ctx.fillRect(0, lipY + lipH * 0.42, SW, 2);
    ctx.fillStyle = 'rgba(255, 220, 170, 0.05)';
    ctx.fillRect(0, lipY + lipH * 0.30, SW, 2);
  } else {
    ctx.fillStyle = 'rgba(4, 5, 8, 0.80)';
    ctx.fillRect(0, lipY + lipH * 0.5, SW, lipH * 0.5);
  }
}

/* small, continuous movement, so the frame is never a photograph */
const MOTION = {
  kitchen(ctx, t, pal) {
    // steam off a pan, rising and thinning
    for (let i = 0; i < 3; i++) {
      const p = ((t / 90) + i * 0.33) % 1;
      ctx.globalAlpha = 0.10 * (1 - p);
      ctx.fillStyle = '#ffe9d0';
      const x = 130 + i * 6 + Math.sin(t / 40 + i) * 3;
      ctx.fillRect(x, 56 - p * 44, 3 + p * 5, 2);
    }
    ctx.globalAlpha = 1;
  },
  office(ctx, t) {
    for (let i = 0; i < 5; i++) {
      const x = ((t / 3 + i * 61) % SW);
      const y = 40 + Math.sin(t / 50 + i) * 10;
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(x, y, 1, 1);
    }
  },
  street(ctx, t) {
    // headlights sweeping past, now and then
    const cycle = (t % 520) / 520;
    if (cycle < 0.18) {
      const p = cycle / 0.18;
      ctx.globalAlpha = 0.16 * Math.sin(p * Math.PI);
      ctx.fillStyle = '#ffe6b8';
      ctx.fillRect(p * SW - 30, SH * 0.62, 60, 3);
      ctx.globalAlpha = 1;
    }
  },
  garden(ctx, t) {
    // a bird crossing, once in a while
    const cycle = (t % 900) / 900;
    if (cycle < 0.22) {
      const p = cycle / 0.22;
      const x = p * SW;
      const y = 26 + Math.sin(p * 6) * 5;
      ctx.fillStyle = 'rgba(10,12,16,0.75)';
      ctx.fillRect(x, y, 3, 1);
      ctx.fillRect(x - 2, y - 1, 2, 1);
      ctx.fillRect(x + 3, y - 1, 2, 1);
    }
  },
  firstteam(ctx, t) { flags(ctx, t); },
  move(ctx, t) { flags(ctx, t); },
  trial(ctx, t) { flags(ctx, t); },
  decline(ctx, t) { flags(ctx, t); },
  training() {},
  injury(ctx, t) {
    // a monitor blinking somewhere off screen
    const on = (Math.floor(t / 50) % 2) === 0;
    ctx.globalAlpha = on ? 0.18 : 0.06;
    ctx.fillStyle = '#9fd8ff';
    ctx.fillRect(196, 40, 2, 2);
    ctx.globalAlpha = 1;
  },
  pressroom(ctx, t) {
    if ((Math.floor(t / 40) % 7) === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(120 + Math.floor(Math.random() * 80), 30, 2, 2);
    }
  },
  tunnel(ctx, t) {
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = pal_light(t);
    ctx.fillRect(150, 60, 4, 40);
    ctx.globalAlpha = 1;
  },
  dressing() {},

  /* the fire in the bedroom: it breathes, and it answers the sound */
  bedroom(ctx, t, pal, g = {}) {
    const sx = (g.CW || SW) / SW;
    const sy = (g.sceneH || SH) / SH;
    const level = g.level || 0;
    const flare = g.flare || 0;
    const heat = Math.max(0, Math.min(1.6, level * 0.8 + flare));

    // hearth opening in scene coordinates
    const ox = 204 * sx;
    const oy = 74 * sy;
    const ow = 88 * sx;
    const oh = 40 * sy;
    const baseY = oy + oh;

    // the room warms when it flares
    const glow = ctx.createRadialGradient(ox + ow / 2, baseY - oh * 0.3, 2, ox + ow / 2, baseY - oh * 0.3, ow * 1.9);
    glow.addColorStop(0, `rgba(255, 176, 90, ${0.16 + heat * 0.16})`);
    glow.addColorStop(0.45, `rgba(255, 130, 60, ${0.06 + heat * 0.09})`);
    glow.addColorStop(1, 'rgba(255, 120, 50, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(ox - ow, oy - oh, ow * 3, oh * 4);

    // three tongues of flame, each on its own rhythm
    const tongues = [
      { x: 0.32, h: 0.85, w: 0.34, s: 0.11, c: 'rgba(255, 146, 56, 0.80)' },
      { x: 0.50, h: 1.30, w: 0.28, s: 0.07, c: 'rgba(255, 198, 96, 0.90)' },
      { x: 0.68, h: 0.75, w: 0.26, s: 0.13, c: 'rgba(255, 124, 46, 0.78)' },
    ];
    for (const f of tongues) {
      const wob = Math.sin(t * f.s) * 0.09 + Math.sin(t * f.s * 2.7) * 0.04;
      const h = Math.min(oh * 1.05, oh * f.h * (0.86 + Math.sin(t * f.s * 1.6) * 0.12 + heat * 0.22));
      const w = ow * f.w * (1 + Math.sin(t * f.s * 2.2) * 0.06);
      const cx = ox + ow * (f.x + wob);
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, baseY);
      ctx.quadraticCurveTo(cx - w * 0.55, baseY - h * 0.55, cx + wob * 6, baseY - h);
      ctx.quadraticCurveTo(cx + w * 0.55, baseY - h * 0.5, cx + w / 2, baseY);
      ctx.closePath();
      ctx.fillStyle = f.c;
      ctx.fill();
    }

    // the hot heart of it
    ctx.fillStyle = `rgba(255, 236, 180, ${0.5 + heat * 0.3})`;
    ctx.fillRect(ox + ow * 0.42, baseY - oh * 0.22, ow * 0.16, oh * 0.2);

    // embers, rising inside the hearth and a little above it — never in the sky
    const count = Math.round(4 + heat * 12);
    for (let i = 0; i < count; i++) {
      const seed = (i * 37 + Math.floor(t / 3) * 11) % 89;
      const rise = ((t * (0.35 + (seed % 5) / 14) + i * 6) % 55) / 55;   // 0..1
      const pxScene = 214 + 68 * (0.2 + ((seed % 40) / 40) * 0.6) + Math.sin(t * 0.06 + i) * 3;
      const pyScene = 114 - rise * (28 + heat * 16);
      ctx.globalAlpha = Math.max(0, 0.8 - rise * 1.1) * (0.55 + heat * 0.45);
      ctx.fillStyle = rise < 0.3 ? '#ffe2ae' : '#ff9a4a';
      ctx.fillRect(pxScene * sx, pyScene * sy, 1, 1);
    }
    ctx.globalAlpha = 1;
  },
};

function pal_light() { return '#ffe9c8'; }

function flags(ctx, t) {
  for (let i = 0; i < 4; i++) {
    const x = 40 + i * 68;
    const wob = Math.sin(t / 14 + i * 1.7) * 2;
    ctx.fillStyle = 'rgba(220, 210, 190, 0.16)';
    ctx.fillRect(x + wob, SH * 0.30, 6, 3);
  }
}


/* a bedroom with a fire in it: the warmest place in the game */
SCENES.bedroom = (ctx, pal, rand) => {
  // wall, warmer toward the fire
  const wall = ctx.createLinearGradient(0, 0, 0, 60);
  wall.addColorStop(0, '#2a1e14');
  wall.addColorStop(1, '#3a2a1b');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, 60);
  ctx.fillStyle = 'rgba(255, 190, 130, 0.05)';
  ctx.fillRect(0, 30, W, 30);

  // floorboards, running across, joints staggered
  ctx.fillStyle = '#251a12';
  ctx.fillRect(0, 60, W, H - 60);
  for (let y = 60; y < H; y += 7) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(0, y, W, 1);
    ctx.fillStyle = 'rgba(255, 200, 150, 0.04)';
    ctx.fillRect(0, y + 1, W, 1);
  }
  for (let i = 0; i < 22; i++) {
    const x = Math.floor(rand() * W);
    const y = 60 + Math.floor(rand() * (H - 60));
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(x, y, 1, 4);
  }
  // skirting
  ctx.fillStyle = '#1c140e';
  ctx.fillRect(0, 57, W, 3);

  // rug, in front of the fire
  ctx.fillStyle = '#4a2f24';
  ctx.beginPath();
  ctx.ellipse(70, 74, 46, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(198, 120, 70, 0.45)';
  ctx.beginPath();
  ctx.ellipse(70, 74, 42, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 190, 130, 0.20)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.ellipse(70, 74, 38, 5.5, 0, 0, Math.PI * 2);
  ctx.stroke();

  // window, night outside
  ctx.fillStyle = '#0a1120';
  ctx.fillRect(13, 9, 38, 27);
  ctx.fillStyle = '#141d33';
  ctx.fillRect(13, 9, 38, 8);
  for (const [sx2, sy2] of [[18, 14], [26, 12], [35, 16], [45, 13], [30, 20]]) {
    ctx.globalAlpha = 0.45 + rand() * 0.45;
    ctx.fillStyle = '#dfe8ff';
    ctx.fillRect(sx2, sy2, 1, 1);
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#191008';
  ctx.lineWidth = 1;
  ctx.strokeRect(13, 9, 38, 27);
  ctx.fillStyle = '#191008';
  ctx.fillRect(31, 9, 1, 27);
  ctx.fillRect(13, 22, 38, 1);
  // curtains, tied back
  ctx.fillStyle = 'rgba(140, 62, 48, 0.75)';
  ctx.fillRect(8, 6, 6, 33);
  ctx.fillRect(50, 6, 7, 33);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(10, 6, 1, 33);
  ctx.fillRect(54, 6, 1, 33);

  // ---- the hearth ----
  // stone surround
  ctx.fillStyle = '#2f2a25';
  ctx.fillRect(24, 40, 46, 22);
  ctx.fillStyle = '#3b342d';
  ctx.fillRect(24, 38, 46, 3);           // mantel
  ctx.fillStyle = '#241f1a';
  ctx.fillRect(28, 44, 38, 16);          // the opening
  // soot
  ctx.fillStyle = 'rgba(0,0,0,0.40)';
  ctx.fillRect(30, 44, 34, 5);
  // grate and logs
  ctx.fillStyle = '#2a1c12';
  ctx.fillRect(31, 58, 32, 2);
  ctx.fillStyle = '#432c1a';
  ctx.fillRect(33, 55, 28, 3);
  ctx.fillRect(36, 52, 22, 3);
  ctx.fillStyle = 'rgba(255, 170, 90, 0.35)';
  ctx.fillRect(38, 51, 18, 1);

  // a still fire, so the room is warm even with animation off
  const flame = (x, h, w, colour) => {
    ctx.beginPath();
    ctx.moveTo(x - w / 2, 58);
    ctx.quadraticCurveTo(x - w * 0.6, 58 - h * 0.55, x, 58 - h);
    ctx.quadraticCurveTo(x + w * 0.6, 58 - h * 0.5, x + w / 2, 58);
    ctx.closePath();
    ctx.fillStyle = colour;
    ctx.fill();
  };
  flame(42, 12, 11, 'rgba(255, 140, 50, 0.75)');
  flame(47, 16, 9, 'rgba(255, 198, 92, 0.85)');
  flame(52, 11, 10, 'rgba(255, 130, 44, 0.72)');
  // embers under
  ctx.fillStyle = 'rgba(255, 176, 90, 0.55)';
  ctx.fillRect(41, 56, 14, 2);
  // warm pool on the floor in front of it
  ctx.fillStyle = 'rgba(255, 150, 70, 0.10)';
  ctx.fillRect(26, 60, 44, 6);

  // ---- the bed, right ----
  ctx.fillStyle = '#2b1d14';
  ctx.fillRect(96, 38, 8, 26);           // headboard
  ctx.fillStyle = '#3a2a1e';
  ctx.fillRect(96, 40, 6, 22);
  ctx.fillStyle = '#3f2c20';
  ctx.fillRect(102, 48, 48, 14);         // mattress
  ctx.fillStyle = '#5c3a2b';             // quilt
  ctx.fillRect(102, 50, 48, 8);
  ctx.fillStyle = 'rgba(255, 200, 150, 0.10)';
  ctx.fillRect(102, 50, 48, 1);
  // a folded blanket across the bottom of the bed, to break the flat slab
  ctx.fillStyle = '#714634';
  ctx.fillRect(102, 55, 48, 3);
  ctx.fillStyle = 'rgba(255, 200, 150, 0.12)';
  ctx.fillRect(102, 55, 48, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';     // folds
  for (const fx of [112, 124, 136]) ctx.fillRect(fx, 51, 1, 7);
  ctx.fillStyle = '#9b6f52';             // pillow
  ctx.fillRect(104, 46, 13, 5);
  ctx.fillStyle = 'rgba(255, 220, 180, 0.20)';
  ctx.fillRect(105, 46, 11, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(104, 50, 13, 1);
  ctx.fillStyle = '#241811';             // base and legs
  ctx.fillRect(102, 62, 48, 4);
  ctx.fillRect(106, 66, 3, 6);
  ctx.fillRect(144, 66, 3, 6);

  // bedside table with a lamp
  ctx.fillStyle = '#33241a';
  ctx.fillRect(86, 54, 12, 3);
  ctx.fillRect(88, 57, 2, 9);
  ctx.fillRect(94, 57, 2, 9);
  ctx.fillStyle = '#c9a36a';
  ctx.fillRect(90, 46, 2, 6);
  ctx.fillStyle = 'rgba(255, 214, 150, 0.75)';
  ctx.beginPath();
  ctx.moveTo(87, 46); ctx.lineTo(95, 46); ctx.lineTo(93, 40); ctx.lineTo(89, 40);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255, 210, 150, 0.08)';
  ctx.beginPath(); ctx.arc(91, 45, 9, 0, Math.PI * 2); ctx.fill();

  // an armchair, turned toward the fire
  ctx.fillStyle = '#33222a';
  ctx.fillRect(70, 50, 18, 16);
  ctx.fillStyle = '#4b333d';
  ctx.fillRect(72, 52, 14, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(72, 61, 14, 1);
  ctx.fillRect(68, 48, 4, 18);           // arms
  ctx.fillRect(86, 48, 4, 18);
  ctx.fillStyle = 'rgba(255, 190, 140, 0.10)';
  ctx.fillRect(72, 52, 14, 1);

  // a cat, asleep on the rug
  ctx.fillStyle = '#241a16';
  ctx.beginPath();
  ctx.ellipse(96, 72, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#241a16';
  ctx.beginPath();
  ctx.arc(103, 70.5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#241a16';
  ctx.fillRect(101, 68, 1, 2);
  ctx.fillRect(104, 68, 1, 2);
};


/* ============================================================================
 * v5 artwork — native 320x180
 *
 * The first set was drawn in a 160x90 space and doubled, which capped the detail
 * at chunky 2px blocks. These are drawn at the full resolution, so a line is a
 * line, and use a different language: a nearer camera, three depth layers
 * (far wall / subject / a foreground edge in silhouette), and warm light falling
 * across a room rather than a flat horizon band.
 * ========================================================================== */

const R = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

const grad = (ctx, x0, y0, x1, y1, stops) => {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [at, c] of stops) g.addColorStop(at, c);
  return g;
};

const glowAt = (ctx, x, y, r, colour) => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, colour);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
};

/* a window with a real frame, glazing bars, and something outside it */
function windowFrame(ctx, x, y, w, h, { sky = '#0d1524', lit = null, bars = 2, sill = true } = {}) {
  R(ctx, x - 3, y - 3, w + 6, h + 6, '#1a120c');
  const g = grad(ctx, 0, y, 0, y + h, [[0, sky], [1, lit || '#243046']]);
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // moonlight / streetlight on the glass
  ctx.fillStyle = 'rgba(190, 215, 255, 0.10)';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.15, y);
  ctx.lineTo(x + w * 0.45, y);
  ctx.lineTo(x + w * 0.2, y + h);
  ctx.lineTo(x, y + h * 0.8);
  ctx.closePath();
  ctx.fill();
  R(ctx, x + w / bars - 1, y, 2, h, '#1a120c');
  R(ctx, x, y + h * 0.52, w, 2, '#1a120c');
  if (sill) R(ctx, x - 6, y + h + 3, w + 12, 3, '#2c2018');
}

/* floorboards running toward the viewer, with a little wear */
function boards(ctx, y0, h, base = '#241811', seam = 'rgba(0,0,0,0.30)') {
  R(ctx, 0, y0, SW, h, base);
  for (let y = y0; y < y0 + h; y += 9) {
    R(ctx, 0, y, SW, 1, seam);
    R(ctx, 0, y + 1, SW, 1, 'rgba(255, 205, 160, 0.035)');
  }
}

/* a soft pool of lamp light on the floor and wall */
function lampPool(ctx, x, y, r, colour = 'rgba(255, 190, 120, 0.13)') {
  glowAt(ctx, x, y, r, colour);
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.35, r * 0.55, r * 0.16, 0, 0, Math.PI * 2);
  ctx.fill();
}

/* ------------------------------------------------------------ chapter one */

SCENES.kitchen = (ctx, pal, rand) => {
  // far wall, warm on the left where the window is
  ctx.fillStyle = grad(ctx, 0, 0, SW, 0, [[0, '#3d2c1d'], [0.55, '#33251a'], [1, '#251a12']]);
  ctx.fillRect(0, 0, SW, 132);

  // tiled splashback behind the worktop
  for (let y = 96; y < 132; y += 8) {
    R(ctx, 0, y, SW, 1, 'rgba(255, 240, 215, 0.045)');
    const off = ((y - 96) / 8) % 2 ? 12 : 0;
    for (let x = off; x < SW; x += 24) R(ctx, x, y, 1, 8, 'rgba(255, 240, 215, 0.035)');
  }

  // window over the sink, night outside
  windowFrame(ctx, 40, 26, 74, 54, { sky: '#0b1120', lit: '#1d2740' });

  // a kettle on the sill, and steam later
  ctx.fillStyle = '#b9c3cc';
  ctx.beginPath();
  ctx.moveTo(126, 78); ctx.lineTo(146, 78); ctx.lineTo(143, 62); ctx.lineTo(129, 62);
  ctx.closePath(); ctx.fill();
  R(ctx, 126, 76, 20, 3, '#93a0aa');
  R(ctx, 146, 66, 5, 3, '#93a0aa');       // spout
  R(ctx, 131, 58, 10, 3, '#93a0aa');      // lid

  // worktop, receding
  R(ctx, 0, 132, SW, 6, '#4a3626');
  R(ctx, 0, 132, SW, 2, 'rgba(255, 220, 175, 0.14)');
  R(ctx, 0, 138, SW, 4, '#2b1f16');

  // cupboards under it, with handles
  for (let x = 8; x < SW; x += 46) {
    R(ctx, x, 142, 40, 26, '#33251a');
    R(ctx, x, 142, 40, 1, 'rgba(255, 210, 160, 0.07)');
    R(ctx, x + 30, 152, 6, 2, '#c9a86f');
  }

  // the fridge, cropped by the right edge
  R(ctx, 270, 40, 50, 100, '#3c424a');
  R(ctx, 272, 42, 46, 40, '#454c55');
  R(ctx, 300, 50, 2, 20, '#8d949c');
  R(ctx, 300, 88, 2, 20, '#8d949c');

  // a calendar with one date circled
  R(ctx, 196, 44, 34, 40, '#d8c9ae');
  R(ctx, 196, 44, 34, 7, '#8b3a34');
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) R(ctx, 200 + i * 7, 56 + j * 6, 4, 3, 'rgba(80,60,40,0.35)');
  ctx.strokeStyle = '#8b3a34';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(214, 65, 5, 4, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ---- foreground: the table, and the letter on it ----
  R(ctx, 0, 150, SW, 30, '#1d130d');
  R(ctx, 0, 150, SW, 3, '#3a281b');
  R(ctx, 0, 150, SW, 1, 'rgba(255, 215, 170, 0.22)');

  // the letter, lit from the window
  ctx.save();
  ctx.translate(96, 158);
  ctx.rotate(-0.06);
  R(ctx, 0, 0, 54, 20, '#e8dcc4');
  R(ctx, 0, 0, 54, 3, '#d3c4a6');
  for (let i = 0; i < 3; i++) R(ctx, 6, 7 + i * 4, 40 - i * 7, 1, 'rgba(90, 70, 50, 0.5)');
  ctx.restore();

  // a mug, half drunk
  R(ctx, 186, 152, 12, 14, '#c8b49a');
  R(ctx, 186, 152, 12, 2, '#e2d3bb');
  ctx.strokeStyle = '#c8b49a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(200, 159, 4, -1.2, 1.2);
  ctx.stroke();

  lampPool(ctx, 190, 120, 66, 'rgba(255, 190, 120, 0.10)');
};

SCENES.bedroom = (ctx, pal, rand) => {
  // wall, warmer toward the fire
  ctx.fillStyle = grad(ctx, 0, 0, 0, 120, [[0, '#2b1d13'], [1, '#402c1c']]);
  ctx.fillRect(0, 0, SW, 120);

  boards(ctx, 120, 60);

  // window, high and small, with the moon in it
  windowFrame(ctx, 30, 18, 54, 42, { sky: '#0b1222', lit: '#1a2440' });
  ctx.fillStyle = 'rgba(226, 236, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(68, 32, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(226, 236, 255, 0.10)';
  ctx.beginPath();
  ctx.arc(68, 32, 12, 0, Math.PI * 2);
  ctx.fill();

  // curtains, heavy and tied
  ctx.fillStyle = grad(ctx, 16, 0, 34, 0, [[0, '#5d2a24'], [1, '#3d1a16']]);
  ctx.fillRect(16, 10, 16, 58);
  ctx.fillStyle = grad(ctx, 84, 0, 98, 0, [[0, '#3d1a16'], [1, '#5d2a24']]);
  ctx.fillRect(84, 10, 14, 58);
  R(ctx, 20, 40, 8, 3, '#c9a86f');
  R(ctx, 88, 40, 8, 3, '#c9a86f');

  // ---- the hearth, right of centre ----
  R(ctx, 196, 66, 104, 60, '#2e2924');
  R(ctx, 196, 62, 104, 6, '#3d362f');
  R(ctx, 204, 74, 88, 42, '#181410');        // the opening
  R(ctx, 204, 74, 88, 8, 'rgba(0,0,0,0.45)');

  // stone courses
  for (let y = 68; y < 124; y += 8) {
    R(ctx, 196, y, 104, 1, 'rgba(0,0,0,0.18)');
    for (let x = 196 + (y % 16 ? 10 : 0); x < 300; x += 20) R(ctx, x, y, 1, 8, 'rgba(0,0,0,0.14)');
  }

  // logs
  R(ctx, 216, 108, 62, 7, '#3f2a19');
  R(ctx, 222, 101, 46, 7, '#4a3220');
  ctx.fillStyle = 'rgba(255, 170, 90, 0.30)';
  ctx.fillRect(228, 100, 34, 2);

  // a bed, left, seen from the side
  R(ctx, 12, 96, 20, 46, '#33231a');
  R(ctx, 12, 96, 20, 3, '#4a3425');
  R(ctx, 32, 104, 96, 26, '#3a281d');
  R(ctx, 32, 108, 96, 12, '#6c4437');
  R(ctx, 32, 108, 96, 2, 'rgba(255, 205, 160, 0.12)');
  // a folded blanket, and the fold shadows
  R(ctx, 32, 118, 96, 5, '#7d4f3b');
  R(ctx, 32, 118, 96, 1, 'rgba(255, 210, 165, 0.14)');
  for (const fx of [54, 76, 100]) R(ctx, fx, 110, 1, 8, 'rgba(0,0,0,0.22)');
  // pillow
  R(ctx, 36, 98, 26, 10, '#a3795b');
  R(ctx, 36, 98, 26, 2, 'rgba(255, 225, 190, 0.25)');
  // bed frame legs
  R(ctx, 34, 130, 4, 12, '#20150f');
  R(ctx, 122, 130, 4, 12, '#20150f');

  // bedside table and lamp
  R(ctx, 140, 112, 26, 4, '#33241a');
  R(ctx, 144, 116, 3, 18, '#241811');
  R(ctx, 159, 116, 3, 18, '#241811');
  R(ctx, 150, 92, 3, 20, '#b98f5a');
  ctx.fillStyle = 'rgba(255, 214, 150, 0.9)';
  ctx.beginPath();
  ctx.moveTo(142, 94); ctx.lineTo(161, 94); ctx.lineTo(158, 80); ctx.lineTo(145, 80);
  ctx.closePath(); ctx.fill();
  lampPool(ctx, 151, 96, 46, 'rgba(255, 200, 140, 0.12)');

  // rug
  ctx.fillStyle = '#4a2f24';
  ctx.beginPath();
  ctx.ellipse(150, 150, 96, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(190, 115, 70, 0.42)';
  ctx.beginPath();
  ctx.ellipse(150, 150, 86, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 195, 135, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(150, 150, 78, 11, 0, 0, Math.PI * 2);
  ctx.stroke();

  // the cat, asleep
  ctx.fillStyle = '#241a16';
  ctx.beginPath();
  ctx.ellipse(196, 148, 14, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(211, 145, 5, 0, Math.PI * 2);
  ctx.fill();
  R(ctx, 207, 139, 2, 4, '#241a16');
  R(ctx, 213, 139, 2, 4, '#241a16');
  ctx.fillStyle = 'rgba(255, 190, 140, 0.18)';
  ctx.beginPath();
  ctx.ellipse(196, 145, 12, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // ---- foreground: the near edge of the bed, out of focus ----
  R(ctx, 0, 168, SW, 12, '#140d09');
};

SCENES.street = (ctx, pal, rand) => {
  // sky with a low sodium glow from the lamp
  ctx.fillStyle = grad(ctx, 0, 0, 0, 110, [[0, '#0b1220'], [0.7, '#182236'], [1, '#2a2c3a']]);
  ctx.fillRect(0, 0, SW, 116);

  // terraces, both sides, receding to the middle
  const house = (x, w, h, y, tone, windows) => {
    R(ctx, x, y, w, h, tone);
    R(ctx, x, y, w, 3, 'rgba(255,255,255,0.05)');
    for (let wy = y + 12; wy < y + h - 10; wy += 18) {
      for (let wx = x + 8; wx < x + w - 10; wx += 20) {
        const lit = windows && rand() > 0.55;
        R(ctx, wx, wy, 10, 12, lit ? '#e8b878' : '#0e1420');
        if (lit) {
          ctx.fillStyle = 'rgba(255, 190, 110, 0.14)';
          ctx.fillRect(wx - 2, wy - 2, 14, 16);
        }
        R(ctx, wx, wy, 10, 1, 'rgba(0,0,0,0.35)');
      }
    }
  };
  house(-10, 84, 92, 34, '#1b2130', true);
  house(30, 70, 80, 46, '#202737', true);
  house(250, 90, 88, 38, '#1c2231', true);
  house(200, 68, 76, 50, '#222a3a', true);

  // pavement and wet road
  R(ctx, 0, 116, SW, 10, '#2b3340');
  R(ctx, 0, 126, SW, 54, '#151b26');
  R(ctx, 0, 126, SW, 2, 'rgba(200, 220, 255, 0.10)');

  // lamp post, mid-left
  R(ctx, 96, 44, 3, 84, '#101620');
  R(ctx, 92, 40, 11, 5, '#1a2230');
  ctx.fillStyle = 'rgba(255, 216, 150, 0.95)';
  ctx.fillRect(94, 44, 7, 3);
  glowAt(ctx, 97, 48, 74, 'rgba(255, 206, 140, 0.16)');
  // its reflection, broken up on the wet road
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = `rgba(255, 200, 130, ${0.10 - i * 0.012})`;
    ctx.fillRect(88 + Math.sin(i) * 4, 130 + i * 6, 18 - i, 2);
  }

  // the car, half in shadow on the right
  R(ctx, 214, 118, 92, 18, '#161b24');
  R(ctx, 226, 104, 58, 16, '#1c222c');
  R(ctx, 230, 108, 22, 9, '#2c3746');       // windscreen
  R(ctx, 256, 108, 22, 7, '#2c3746');
  R(ctx, 300, 112, 6, 5, 'rgba(255, 220, 160, 0.45)');
  R(ctx, 216, 122, 4, 6, '#c8102e');
  R(ctx, 222, 136, 14, 4, '#0d1118');
  R(ctx, 282, 136, 14, 4, '#0d1118');

  // bins out for the morning
  R(ctx, 24, 104, 18, 26, '#232b36');
  R(ctx, 24, 100, 18, 5, '#2c3542');
  R(ctx, 44, 110, 14, 20, '#1e2530');

  // ---- foreground: a hedge, very close and very dark ----
  ctx.fillStyle = '#080c10';
  for (let x = -10; x < SW + 10; x += 9) {
    const h = 9 + Math.sin(x * 0.3) * 4 + rand() * 4;
    ctx.beginPath();
    ctx.arc(x, 184, h, 0, Math.PI * 2);
    ctx.fill();
  }
};

SCENES.office = (ctx, pal, rand) => {
  R(ctx, 0, 0, SW, 132, '#232830');
  // blinds, with the street coming through
  for (let y = 14; y < 92; y += 7) {
    R(ctx, 150, y, 120, 4, 'rgba(190, 205, 230, 0.14)');
    R(ctx, 150, y + 4, 120, 1, 'rgba(0,0,0,0.35)');
  }
  R(ctx, 146, 8, 128, 6, '#1b2027');

  // filing shelves
  R(ctx, 6, 40, 96, 4, '#2f353d');
  R(ctx, 6, 66, 96, 4, '#2f353d');
  for (let i = 0; i < 11; i++) {
    R(ctx, 10 + i * 8, 26, 5, 14, i % 3 ? '#3c434b' : '#4a525a');
    R(ctx, 10 + i * 8, 52, 5, 14, i % 4 ? '#465059' : '#39424a');
  }

  // a noticeboard with paper on it
  R(ctx, 112, 20, 26, 26, '#3a3026');
  R(ctx, 115, 24, 9, 8, 'rgba(232, 226, 210, 0.55)');
  R(ctx, 126, 26, 8, 6, 'rgba(232, 226, 210, 0.45)');

  // the desk, coming toward the viewer
  R(ctx, 0, 132, SW, 48, '#2a1f16');
  R(ctx, 0, 132, SW, 4, '#4a3626');
  R(ctx, 0, 132, SW, 2, 'rgba(255, 220, 175, 0.16)');

  // papers, a pen, a phone
  ctx.save();
  ctx.translate(60, 140);
  ctx.rotate(0.03);
  R(ctx, 0, 0, 64, 34, '#e6dcc6');
  for (let i = 0; i < 6; i++) R(ctx, 6, 6 + i * 4, 52 - (i % 3) * 9, 1, 'rgba(70, 55, 40, 0.45)');
  ctx.restore();
  R(ctx, 140, 144, 40, 26, '#d9cdb4');
  R(ctx, 140, 144, 40, 3, '#c3b598');
  R(ctx, 176, 150, 5, 14, '#1d2029');       // pen
  R(ctx, 228, 150, 30, 14, '#151a22');      // phone
  R(ctx, 231, 153, 24, 6, '#2b3542');

  // banker's lamp, and its pool
  R(ctx, 252, 116, 2, 16, '#a8894f');
  ctx.fillStyle = '#2f6b4f';
  ctx.beginPath();
  ctx.moveTo(238, 116); ctx.lineTo(272, 116); ctx.lineTo(266, 104); ctx.lineTo(244, 104);
  ctx.closePath(); ctx.fill();
  R(ctx, 240, 114, 30, 2, 'rgba(255, 235, 190, 0.35)');
  lampPool(ctx, 256, 124, 62, 'rgba(255, 214, 150, 0.13)');

  // a chair back in the foreground, very close
  R(ctx, 0, 168, SW, 12, '#120c08');
  ctx.fillStyle = '#181009';
  ctx.beginPath();
  ctx.arc(60, 186, 34, Math.PI, 0);
  ctx.fill();
};

/* --------------------------------------------------------------- chapter two */

SCENES.training = (ctx, pal, rand) => {
  // a low evening sky over a training ground
  ctx.fillStyle = grad(ctx, 0, 0, 0, 96, [[0, '#1b2436'], [0.6, '#2d3448'], [1, '#4a4250']]);
  ctx.fillRect(0, 0, SW, 100);

  // treeline
  ctx.fillStyle = '#141a20';
  for (let x = -10; x < SW + 10; x += 11) {
    const h = 12 + rand() * 12;
    ctx.beginPath();
    ctx.arc(x, 100 - h, h * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  // floodlight pylon
  R(ctx, 52, 18, 3, 82, '#1a1f27');
  R(ctx, 42, 12, 23, 8, '#232b36');
  for (let i = 0; i < 3; i++) R(ctx, 45 + i * 7, 14, 5, 4, 'rgba(255, 232, 180, 0.9)');
  glowAt(ctx, 54, 18, 70, 'rgba(255, 226, 170, 0.14)');
  R(ctx, 268, 24, 3, 76, '#1a1f27');
  R(ctx, 258, 18, 23, 8, '#232b36');
  for (let i = 0; i < 3; i++) R(ctx, 261 + i * 7, 20, 5, 4, 'rgba(255, 232, 180, 0.9)');
  glowAt(ctx, 270, 24, 70, 'rgba(255, 226, 170, 0.12)');

  // pitch, in perspective
  ctx.fillStyle = grad(ctx, 0, 100, 0, 180, [[0, '#1d2b1f'], [0.5, '#1a271c'], [1, '#141d15']]);
  ctx.fillRect(0, 100, SW, 80);
  // the light pools fall on the ground, not a flat wash
  glowAt(ctx, 54, 118, 90, 'rgba(255, 226, 170, 0.10)');
  glowAt(ctx, 268, 120, 90, 'rgba(255, 226, 170, 0.08)');
  // mown stripes converging
  for (let i = 0; i < 8; i++) {
    const xTop = 40 + i * 30;
    const xBot = -80 + i * 62;
    ctx.beginPath();
    ctx.moveTo(xTop, 100);
    ctx.lineTo(xTop + 30, 100);
    ctx.lineTo(xBot + 62, 180);
    ctx.lineTo(xBot, 180);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? 'rgba(220, 235, 210, 0.016)' : 'rgba(0,0,0,0.05)';
    ctx.fill();
  }
  // white line across the far end
  R(ctx, 0, 100, SW, 1, 'rgba(220, 235, 220, 0.22)');

  // a goal at the far end, and cones nearer
  R(ctx, 108, 84, 3, 18, 'rgba(235, 240, 245, 0.55)');
  R(ctx, 168, 84, 3, 18, 'rgba(235, 240, 245, 0.55)');
  R(ctx, 108, 84, 63, 2, 'rgba(235, 240, 245, 0.55)');
  ctx.strokeStyle = 'rgba(220, 235, 230, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath(); ctx.moveTo(109 + i * 6.5, 86); ctx.lineTo(109 + i * 6.5, 102); ctx.stroke();
  }
  for (let j = 0; j < 4; j++) {
    ctx.beginPath(); ctx.moveTo(108, 88 + j * 4); ctx.lineTo(171, 88 + j * 4); ctx.stroke();
  }

  const cone = (x, y, s) => {
    ctx.fillStyle = '#c4642f';
    ctx.beginPath();
    ctx.moveTo(x - 4 * s, y); ctx.lineTo(x + 4 * s, y); ctx.lineTo(x + 2 * s, y - 8 * s); ctx.lineTo(x - 2 * s, y - 8 * s);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.fillRect(x - 3 * s, y - 4 * s, 6 * s, 1);
    R(ctx, x - 5 * s, y, 10 * s, 1, 'rgba(0,0,0,0.25)');
  };
  cone(64, 130, 1.2); cone(88, 138, 1.5); cone(200, 136, 1.4); cone(232, 128, 1.1);

  // puddles holding the floodlights
  ctx.fillStyle = 'rgba(180, 205, 235, 0.14)';
  ctx.beginPath(); ctx.ellipse(120, 152, 34, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(250, 164, 26, 4, 0, 0, Math.PI * 2); ctx.fill();

  // a coach, mid-ground, hands in pockets
  ctx.fillStyle = '#12161c';
  ctx.fillRect(148, 96, 8, 20);
  ctx.beginPath(); ctx.arc(152, 92, 4, 0, Math.PI * 2); ctx.fill();
  R(ctx, 146, 116, 4, 14, '#12161c');
  R(ctx, 154, 116, 4, 14, '#12161c');

  // ---- foreground: grass, out of focus ----
  ctx.fillStyle = '#0a140d';
  for (let x = 0; x < SW; x += 5) {
    const h = 10 + rand() * 14;
    ctx.fillRect(x, 180 - h, 3, h);
  }
};

SCENES.firstteam = (ctx, pal, rand) => {
  // night sky and the glow over the stand
  ctx.fillStyle = grad(ctx, 0, 0, 0, 90, [[0, '#0c1120'], [1, '#20283c']]);
  ctx.fillRect(0, 0, SW, 92);

  // the stand, rising to the left, in perspective
  ctx.fillStyle = '#0c1017';
  ctx.beginPath();
  ctx.moveTo(0, 20); ctx.lineTo(190, 66); ctx.lineTo(190, 108); ctx.lineTo(0, 132);
  ctx.closePath(); ctx.fill();
  // tiered rows of people
  for (let r = 0; r < 9; r++) {
    const y = 24 + r * 9;
    for (let x = 0; x < 190 - r * 6; x += 4) {
      const lit = rand() > 0.86;
      const jitter = rand() > 0.7 ? 1 : 0;
      ctx.fillStyle = lit ? 'rgba(255, 226, 180, 0.5)' : (rand() > 0.5 ? 'rgba(26, 32, 44, 0.92)' : 'rgba(34, 40, 54, 0.9)');
      ctx.fillRect(x + (r % 2) * 2, y + jitter, 2, 4 - jitter);
    }
  }
  // roof line
  R(ctx, 0, 14, 196, 7, '#080b11');
  for (let x = 8; x < 196; x += 22) R(ctx, x, 6, 2, 10, '#0c1017');

  // floodlights on the roof
  for (const lx of [30, 96, 162]) {
    R(ctx, lx, 0, 16, 8, '#141a24');
    for (let i = 0; i < 3; i++) R(ctx, lx + 2 + i * 5, 2, 4, 4, 'rgba(255, 236, 190, 0.95)');
    glowAt(ctx, lx + 8, 6, 56, 'rgba(255, 230, 180, 0.16)');
  }

  // pitch, right of the stand, running away
  ctx.fillStyle = grad(ctx, 0, 92, 0, 180, [[0, '#1f3122'], [0.55, '#1b2a1e'], [1, '#141d15']]);
  ctx.fillRect(0, 92, SW, 88);
  glowAt(ctx, 250, 110, 120, 'rgba(255, 230, 180, 0.09)');
  for (let i = 0; i < 9; i++) {
    const xTop = 150 + i * 20;
    ctx.beginPath();
    ctx.moveTo(xTop, 92);
    ctx.lineTo(xTop + 20, 92);
    ctx.lineTo(xTop - 40, 180);
    ctx.lineTo(xTop - 76, 180);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.022)' : 'rgba(0,0,0,0.05)';
    ctx.fill();
  }

  // a goal at the far end
  R(ctx, 150, 78, 2, 16, 'rgba(240, 245, 250, 0.55)');
  R(ctx, 206, 78, 2, 16, 'rgba(240, 245, 250, 0.55)');
  R(ctx, 150, 78, 58, 1, 'rgba(240, 245, 250, 0.55)');
  for (let i = 1; i < 9; i++) R(ctx, 150 + i * 6, 80, 1, 14, 'rgba(220, 235, 240, 0.10)');

  // a player warming up: a silhouette with a lit shirt, not a white stick
  ctx.fillStyle = 'rgba(232, 226, 216, 0.55)';
  ctx.fillRect(118, 104, 5, 9);
  ctx.fillStyle = '#0b0f14';
  ctx.beginPath(); ctx.arc(120.5, 101, 3, 0, Math.PI * 2); ctx.fill();
  R(ctx, 117, 113, 2, 7, '#0b0f14');
  R(ctx, 122, 113, 2, 7, '#0b0f14');
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(120, 121, 6, 2, 0, 0, Math.PI * 2); ctx.fill();

  // ---- foreground: the advertising board, close ----
  R(ctx, 0, 158, SW, 22, '#0b0f14');
  R(ctx, 0, 158, SW, 2, 'rgba(255, 255, 255, 0.10)');
  for (let x = 12; x < SW; x += 58) R(ctx, x, 164, 34, 8, 'rgba(200, 210, 220, 0.07)');
};

Object.assign(SCENES, {
  kitchen: SCENES.kitchen,
  bedroom: SCENES.bedroom,
  street: SCENES.street,
  office: SCENES.office,
  training: SCENES.training,
  firstteam: SCENES.firstteam,
});


/* -------------------------------------------------------- the rest, at 320 */

SCENES.trial = (ctx, pal, rand) => {
  // a wet Tuesday: low cloud, a ground with the lights on
  ctx.fillStyle = grad(ctx, 0, 0, 0, 96, [[0, '#1a2233'], [0.6, '#2b3346'], [1, '#3f4458']]);
  ctx.fillRect(0, 0, SW, 100);

  // low cloud lit from below
  for (let i = 0; i < 22; i++) {
    const x = rand() * SW, y = 10 + rand() * 44, r = 16 + rand() * 26;
    ctx.fillStyle = 'rgba(255, 226, 190, 0.035)';
    ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  }

  // a low stand on the left, a few hundred people
  ctx.fillStyle = '#12171f';
  ctx.beginPath();
  ctx.moveTo(0, 54); ctx.lineTo(104, 76); ctx.lineTo(104, 104); ctx.lineTo(0, 116);
  ctx.closePath(); ctx.fill();
  for (let r = 0; r < 4; r++) {
    const y = 58 + r * 12;
    for (let x = 0; x < 100 - r * 10; x += 5) {
      ctx.fillStyle = rand() > 0.9 ? 'rgba(255, 220, 170, 0.35)' : 'rgba(30, 36, 48, 0.85)';
      ctx.fillRect(x, y + (rand() > 0.75 ? 1 : 0), 2, 4);
    }
  }

  // pitch, wet, reflecting the lights
  ctx.fillStyle = grad(ctx, 0, 100, 0, 180, [[0, '#24382a'], [1, '#182619']]);
  ctx.fillRect(0, 100, SW, 80);
  for (let i = 0; i < 8; i++) {
    const xTop = 100 + i * 28;
    ctx.beginPath();
    ctx.moveTo(xTop, 100); ctx.lineTo(xTop + 28, 100);
    ctx.lineTo(xTop - 60, 180); ctx.lineTo(xTop - 96, 180);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? 'rgba(190, 215, 200, 0.03)' : 'rgba(0,0,0,0.05)';
    ctx.fill();
  }
  // standing water
  for (const [px, py, pr] of [[70, 132, 26], [210, 150, 34], [280, 128, 18]]) {
    ctx.fillStyle = 'rgba(150, 180, 210, 0.16)';
    ctx.beginPath(); ctx.ellipse(px, py, pr, pr * 0.14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255, 230, 190, 0.10)';
    ctx.beginPath(); ctx.ellipse(px - pr * 0.2, py - 1, pr * 0.4, pr * 0.05, 0, 0, Math.PI * 2); ctx.fill();
  }

  // a goal at the far end
  R(ctx, 120, 82, 2, 18, 'rgba(235, 240, 245, 0.5)');
  R(ctx, 186, 82, 2, 18, 'rgba(235, 240, 245, 0.5)');
  R(ctx, 120, 82, 68, 1, 'rgba(235, 240, 245, 0.5)');
  for (let i = 1; i < 11; i++) R(ctx, 120 + i * 6, 84, 1, 16, 'rgba(220, 235, 240, 0.08)');

  // two lads waiting their turn, small
  for (const [x, s2] of [[248, 1], [268, 0.9]]) {
    ctx.fillStyle = '#0d1116';
    ctx.fillRect(x, 108, 4 * s2, 11 * s2);
    ctx.beginPath(); ctx.arc(x + 2 * s2, 105, 3 * s2, 0, Math.PI * 2); ctx.fill();
  }

  // ---- foreground: the touchline barrier ----
  R(ctx, 0, 164, SW, 16, '#0a0d12');
  R(ctx, 0, 164, SW, 1, 'rgba(255,255,255,0.10)');
};

SCENES.tunnel = (ctx, pal, rand) => {
  // concrete, and the ground at the far end of it
  R(ctx, 0, 0, SW, 180, '#14171d');

  // the bright mouth
  const mouthX = 118, mouthY = 34, mouthW = 84, mouthH = 106;
  ctx.fillStyle = grad(ctx, 0, mouthY, 0, mouthY + mouthH, [[0, '#4a6b4a'], [0.5, '#33512f'], [1, '#24391f']]);
  ctx.fillRect(mouthX, mouthY, mouthW, mouthH);
  // crowd inside the mouth
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = rand() > 0.85 ? 'rgba(255, 226, 180, 0.35)' : 'rgba(20, 26, 20, 0.5)';
    ctx.fillRect(mouthX + rand() * mouthW, mouthY + 4 + rand() * 26, 1, 2);
  }
  glowAt(ctx, 160, 70, 110, 'rgba(230, 245, 210, 0.10)');

  // walls converging
  ctx.fillStyle = '#0d1015';
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(mouthX, mouthY); ctx.lineTo(mouthX, mouthY + mouthH); ctx.lineTo(0, 180);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(SW, 0); ctx.lineTo(mouthX + mouthW, mouthY); ctx.lineTo(mouthX + mouthW, mouthY + mouthH); ctx.lineTo(SW, 180);
  ctx.closePath(); ctx.fill();

  // ceiling with strip lights, receding
  for (let i = 0; i < 5; i++) {
    const t = i / 5;
    const w = 120 - t * 84;
    const x = 160 - w / 2;
    const y = 30 - t * 24;
    R(ctx, x, y, w, 3, `rgba(255, 240, 210, ${0.30 - t * 0.05})`);
    glowAt(ctx, 160, y + 2, 44 - t * 24, 'rgba(255, 235, 200, 0.07)');
  }

  // a painted wall line, and scuff marks
  R(ctx, 0, 120, mouthX, 2, 'rgba(180, 60, 50, 0.25)');
  R(ctx, mouthX + mouthW, 120, SW, 2, 'rgba(180, 60, 50, 0.25)');

  // two figures walking out, silhouetted
  ctx.fillStyle = '#05080a';
  for (const [x, s2] of [[150, 1], [172, 0.85]]) {
    ctx.fillRect(x, mouthY + 54, 7 * s2, 28 * s2);
    ctx.beginPath(); ctx.arc(x + 3.5 * s2, mouthY + 50, 5 * s2, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x + 1, mouthY + 82 * s2 * 0.8, 2, 16 * s2);
    ctx.fillRect(x + 5, mouthY + 82 * s2 * 0.8, 2, 16 * s2);
  }

  // ---- foreground: the dark of the tunnel, close ----
  R(ctx, 0, 172, SW, 8, '#070a0d');
};

SCENES.injury = (ctx, pal, rand) => {
  // a room with a window and a bed in it
  ctx.fillStyle = grad(ctx, 0, 0, 0, 120, [[0, '#222a33'], [1, '#1b222a']]);
  ctx.fillRect(0, 0, SW, 128);
  R(ctx, 0, 128, SW, 52, '#171d24');

  // window with blinds, daylight coming through in stripes
  R(ctx, 186, 20, 106, 62, '#0e1622');
  for (let y = 22; y < 80; y += 7) {
    R(ctx, 188, y, 102, 4, 'rgba(198, 220, 245, 0.16)');
    R(ctx, 188, y + 4, 102, 1, 'rgba(0,0,0,0.4)');
  }
  R(ctx, 182, 14, 114, 6, '#141a22');

  // light falling on the floor, striped by the blinds
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = 'rgba(200, 220, 245, 0.045)';
    ctx.beginPath();
    ctx.moveTo(190 + i * 20, 84);
    ctx.lineTo(206 + i * 20, 84);
    ctx.lineTo(170 + i * 26, 150);
    ctx.lineTo(146 + i * 26, 150);
    ctx.closePath();
    ctx.fill();
  }

  // the bed, side on, with someone in it
  R(ctx, 28, 112, 130, 8, '#37414c');
  R(ctx, 28, 120, 130, 14, '#232b34');
  R(ctx, 36, 128, 4, 16, '#1a2129');
  R(ctx, 146, 128, 4, 16, '#1a2129');
  // blanket
  R(ctx, 40, 104, 118, 12, '#4a5766');
  R(ctx, 40, 104, 118, 2, 'rgba(220, 235, 250, 0.16)');
  for (const fx of [70, 96, 128]) R(ctx, fx, 106, 1, 10, 'rgba(0,0,0,0.18)');
  // head on the pillow
  ctx.fillStyle = '#c8b39c';
  ctx.beginPath(); ctx.arc(52, 100, 7, 0, Math.PI * 2); ctx.fill();
  R(ctx, 46, 104, 13, 6, '#c8b39c');
  R(ctx, 42, 96, 20, 8, '#dfe6ee');

  // drip stand
  R(ctx, 176, 76, 2, 56, '#5b6874');
  R(ctx, 168, 74, 18, 2, '#5b6874');
  ctx.fillStyle = 'rgba(214, 232, 240, 0.42)';
  ctx.fillRect(166, 76, 7, 16);
  R(ctx, 169, 94, 1, 26, 'rgba(214, 232, 240, 0.22)');

  // monitor on a stand, beeping
  R(ctx, 214, 92, 22, 16, '#1b232b');
  R(ctx, 216, 94, 18, 12, '#0d1a16');
  ctx.strokeStyle = 'rgba(120, 255, 190, 0.75)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(217, 101); ctx.lineTo(222, 101); ctx.lineTo(225, 96); ctx.lineTo(228, 105); ctx.lineTo(231, 99); ctx.lineTo(233, 101);
  ctx.stroke();

  // a plastic chair, empty
  R(ctx, 248, 104, 26, 4, '#39424c');
  R(ctx, 250, 108, 2, 34, '#2c343d');
  R(ctx, 270, 108, 2, 34, '#2c343d');
  R(ctx, 244, 88, 3, 22, '#2c343d');

  // ---- foreground: the foot of the bed ----
  R(ctx, 0, 168, SW, 12, '#10151a');
};

SCENES.dressing = (ctx, pal, rand) => {
  R(ctx, 0, 0, SW, 132, '#20262e');
  // tiled walls
  for (let y = 0; y < 132; y += 12) {
    R(ctx, 0, y, SW, 1, 'rgba(255,255,255,0.025)');
    for (let x = (y % 24 ? 12 : 0); x < SW; x += 24) R(ctx, x, y, 1, 12, 'rgba(255,255,255,0.02)');
  }

  // a run of lockers
  for (let i = 0; i < 5; i++) {
    const x = 12 + i * 40;
    R(ctx, x, 46, 34, 84, '#2a313a');
    R(ctx, x + 2, 48, 30, 62, '#323a44');
    R(ctx, x + 2, 48, 30, 2, 'rgba(255,255,255,0.06)');
    R(ctx, x + 26, 70, 3, 10, '#8d949c');           // handle
    for (let v = 0; v < 4; v++) R(ctx, x + 8, 56 + v * 4, 18, 1, 'rgba(0,0,0,0.25)');
  }

  // shirts on hooks on the wall
  for (let i = 0; i < 4; i++) {
    const x = 232 + (i % 2) * 44;
    const y = 24 + Math.floor(i / 2) * 44;
    R(ctx, x, y, 3, 6, '#12171d');
    ctx.fillStyle = i % 2 ? '#d8dde3' : '#c8102e';
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 6); ctx.lineTo(x + 9, y + 6);
    ctx.lineTo(x + 11, y + 34); ctx.lineTo(x - 8, y + 34);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(x - 6, y + 28, 19, 6);
  }

  // bench
  R(ctx, 0, 132, SW, 10, '#4a3423');
  R(ctx, 0, 132, SW, 2, 'rgba(255, 215, 170, 0.16)');
  R(ctx, 0, 142, SW, 4, '#2a1c12');
  for (const x of [24, 140, 258]) R(ctx, x, 146, 4, 22, '#221710');

  // boots under it, and a bag
  for (const [bx, c] of [[40, '#151a20'], [58, '#1d242c'], [96, '#151a20'], [206, '#1d242c']]) {
    R(ctx, bx, 120, 13, 8, c);
    R(ctx, bx + 1, 120, 10, 2, 'rgba(255,255,255,0.12)');
  }
  R(ctx, 150, 112, 34, 20, '#232a33');
  R(ctx, 152, 114, 30, 2, 'rgba(255,255,255,0.07)');

  // a towel, flung on the bench
  ctx.fillStyle = 'rgba(228, 232, 238, 0.16)';
  ctx.beginPath();
  ctx.moveTo(118, 132); ctx.lineTo(140, 130); ctx.lineTo(146, 138); ctx.lineTo(122, 140);
  ctx.closePath(); ctx.fill();

  // ---- foreground: the bench edge ----
  R(ctx, 0, 168, SW, 12, '#0f0c09');
};

SCENES.pressroom = (ctx, pal, rand) => {
  R(ctx, 0, 0, SW, 132, '#1d222a');

  // sponsor board
  R(ctx, 20, 18, 280, 74, '#171c23');
  for (let i = 0; i < 6; i++) {
    const x = 32 + i * 44;
    R(ctx, x, 30, 32, 12, i % 2 ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.11)');
    R(ctx, x, 50, 24, 8, 'rgba(255,255,255,0.05)');
  }
  R(ctx, 20, 18, 280, 2, 'rgba(255,255,255,0.10)');

  // table
  R(ctx, 0, 132, SW, 48, '#2b2118');
  R(ctx, 0, 132, SW, 4, '#4a3626');
  R(ctx, 0, 132, SW, 2, 'rgba(255, 220, 175, 0.18)');
  R(ctx, 0, 150, SW, 2, 'rgba(0,0,0,0.25)');

  // microphones and a glass of water
  for (const x of [86, 112, 150, 196, 222]) {
    R(ctx, x, 108, 2, 26, '#0d1014');
    R(ctx, x - 5, 100, 12, 8, '#1b2027');
    R(ctx, x - 5, 100, 12, 2, 'rgba(255,255,255,0.15)');
    R(ctx, x - 8, 104, 18, 2, 'rgba(0,0,0,0.35)');
  }
  R(ctx, 262, 112, 10, 18, 'rgba(200, 220, 240, 0.22)');
  R(ctx, 262, 112, 10, 2, 'rgba(255,255,255,0.3)');

  // flashes going off in the dark
  for (let i = 0; i < 5; i++) {
    const x = 40 + rand() * 240, y = 96 + rand() * 24;
    glowAt(ctx, x, y, 12, 'rgba(255, 255, 255, 0.12)');
    R(ctx, x, y, 2, 2, 'rgba(255,255,255,0.5)');
  }

  // ---- foreground: the near edge of the table, and a lens hood ----
  R(ctx, 0, 172, SW, 8, '#0e0a07');
  ctx.fillStyle = '#080605';
  ctx.beginPath(); ctx.arc(30, 186, 26, Math.PI, 0); ctx.fill();
};

SCENES.decline = (ctx, pal, rand) => {
  // a grey afternoon on a ground nobody uses
  ctx.fillStyle = grad(ctx, 0, 0, 0, 110, [[0, '#5c6068'], [0.7, '#767b84'], [1, '#8b9098']]);
  ctx.fillRect(0, 0, SW, 112);

  // the stand, closed, with weeds in the seats
  // a low terrace, seen from the pitch: stepped rows, not a slab
  for (let r = 0; r < 7; r++) {
    const y = 46 + r * 9;
    const w = 220 - r * 12;
    R(ctx, 0, y, w, 9, ['#3d434b', '#373d45', '#31373f'][r % 3]);
    R(ctx, 0, y, w, 1, 'rgba(255,255,255,0.06)');
    R(ctx, 0, y + 8, w, 1, 'rgba(0,0,0,0.35)');
    for (let x = 6; x < w; x += 10) {
      if (rand() > 0.78) R(ctx, x, y - 2, 1, 3, 'rgba(120, 140, 90, 0.28)');
    }
  }
  // a few broken seats
  for (const [sx, sy] of [[60, 62], [120, 74], [170, 88]]) R(ctx, sx, sy, 6, 5, '#1e2126');

  // pitch, gone to seed
  ctx.fillStyle = grad(ctx, 0, 112, 0, 180, [[0, '#4a5540'], [1, '#3d4735']]);
  ctx.fillRect(0, 112, SW, 68);
  for (let i = 0; i < 320; i++) {
    const x = rand() * SW, y = 112 + rand() * 68;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.03)' : 'rgba(20, 30, 15, 0.06)';
    ctx.fillRect(x, y, 1, 2);
  }
  // a goal with no net
  R(ctx, 96, 96, 3, 20, 'rgba(230, 235, 240, 0.45)');
  R(ctx, 168, 96, 3, 20, 'rgba(230, 235, 240, 0.45)');
  R(ctx, 96, 96, 75, 2, 'rgba(230, 235, 240, 0.45)');
  ctx.strokeStyle = 'rgba(200, 205, 210, 0.20)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(100, 98); ctx.lineTo(150, 118);
  ctx.stroke();

  // a puddle
  ctx.fillStyle = 'rgba(150, 170, 200, 0.16)';
  ctx.beginPath(); ctx.ellipse(236, 148, 34, 6, 0, 0, Math.PI * 2); ctx.fill();

  // ---- foreground: overgrown grass ----
  ctx.fillStyle = '#2b3324';
  for (let x = 0; x < SW; x += 6) {
    const h = 10 + rand() * 16;
    ctx.fillRect(x, 180 - h, 2, h);
  }
};

SCENES.move = (ctx, pal, rand) => {
  // a big ground at night, from the edge of the pitch
  ctx.fillStyle = grad(ctx, 0, 0, 0, 90, [[0, '#0a0f1c'], [1, '#1b2334']]);
  ctx.fillRect(0, 0, SW, 94);

  // three tiers, wrapping round
  for (let tier = 0; tier < 2; tier++) {
    const y = 10 + tier * 38;
    const h = 36;
    ctx.fillStyle = ['#141a26', '#111722', '#0d131c'][tier];
    ctx.fillRect(0, y, SW, h);
    for (let x = 0; x < SW; x += 4) {
      const near = 1 - Math.abs(x - SW / 2) / (SW / 2);
      if (rand() > 0.18) {
        ctx.fillStyle = rand() > 0.94 ? 'rgba(255, 226, 180, 0.28)' : 'rgba(24, 30, 42, 0.9)';
        ctx.fillRect(x, y + 6 + Math.floor(rand() * (h - 12)), 2, 3);
      }
      if (near > 0.9 && rand() > 0.7) {
        ctx.fillStyle = 'rgba(200, 30, 50, 0.35)';
        ctx.fillRect(x, y + 8, 3, 6);
      }
    }
    R(ctx, 0, y + h - 2, SW, 2, 'rgba(0,0,0,0.35)');
  }

  // roof and lights
  R(ctx, 0, 0, SW, 10, '#080c13');
  for (const lx of [24, 96, 168, 240, 300]) {
    R(ctx, lx, 2, 14, 6, '#141a24');
    R(ctx, lx + 2, 3, 3, 4, 'rgba(255, 240, 200, 0.95)');
    R(ctx, lx + 7, 3, 3, 4, 'rgba(255, 240, 200, 0.95)');
    glowAt(ctx, lx + 7, 6, 46, 'rgba(255, 236, 190, 0.10)');
  }

  // pitch
  ctx.fillStyle = grad(ctx, 0, 94, 0, 180, [[0, '#2b4430'], [1, '#1c2f21']]);
  ctx.fillRect(0, 94, SW, 86);
  for (let i = 0; i < 9; i++) {
    const xTop = 20 + i * 36;
    ctx.beginPath();
    ctx.moveTo(xTop, 94); ctx.lineTo(xTop + 36, 94);
    ctx.lineTo(xTop - 90, 180); ctx.lineTo(xTop - 140, 180);
    ctx.closePath();
    ctx.fillStyle = i % 2 ? 'rgba(220, 240, 220, 0.025)' : 'rgba(0,0,0,0.05)';
    ctx.fill();
  }
  // centre circle, in perspective
  ctx.strokeStyle = 'rgba(230, 240, 235, 0.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(160, 150, 70, 16, 0, 0, Math.PI * 2);
  ctx.stroke();

  // ---- foreground: a corner flag and the turf, very close ----
  R(ctx, 6, 120, 2, 62, 'rgba(230, 235, 240, 0.5)');
  ctx.fillStyle = 'rgba(200, 30, 50, 0.85)';
  ctx.beginPath();
  ctx.moveTo(8, 120); ctx.lineTo(40, 128); ctx.lineTo(8, 136);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0c150e';
  for (let x = 0; x < SW; x += 7) {
    const h = 8 + rand() * 12;
    ctx.fillRect(x, 180 - h, 3, h);
  }
};

SCENES.garden = (ctx, pal, rand) => {
  // dusk in a small garden
  ctx.fillStyle = grad(ctx, 0, 0, 0, 96, [[0, '#121a2e'], [0.6, '#1c2740'], [1, '#33405c']]);
  ctx.fillRect(0, 0, SW, 100);
  // stars
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = `rgba(220, 232, 255, ${0.15 + rand() * 0.4})`;
    ctx.fillRect(rand() * SW, rand() * 70, 1, 1);
  }
  // moon
  ctx.fillStyle = 'rgba(232, 240, 255, 0.9)';
  ctx.beginPath(); ctx.arc(252, 26, 9, 0, Math.PI * 2); ctx.fill();
  glowAt(ctx, 252, 26, 34, 'rgba(220, 235, 255, 0.10)');

  // the house, left, with one window awake
  R(ctx, 0, 30, 96, 96, '#1a1e28');
  R(ctx, 0, 30, 96, 4, '#232a36');
  ctx.fillStyle = 'rgba(255, 206, 140, 0.9)';
  ctx.fillRect(22, 54, 26, 22);
  ctx.fillStyle = 'rgba(255, 200, 130, 0.12)';
  ctx.fillRect(18, 50, 34, 30);
  R(ctx, 34, 54, 1, 22, 'rgba(40, 30, 20, 0.6)');
  R(ctx, 22, 64, 26, 1, 'rgba(40, 30, 20, 0.6)');
  // roof edge
  ctx.fillStyle = '#10141c';
  ctx.beginPath();
  ctx.moveTo(-4, 30); ctx.lineTo(96, 30); ctx.lineTo(96, 22); ctx.lineTo(-4, 22);
  ctx.closePath(); ctx.fill();

  // fence and hedge
  R(ctx, 96, 78, SW - 96, 2, '#141a16');
  for (let x = 100; x < SW; x += 14) R(ctx, x, 78, 2, 26, '#10150f');
  ctx.fillStyle = '#1b2618';
  for (let x = 96; x < SW; x += 8) {
    const h = 12 + rand() * 12;
    ctx.beginPath(); ctx.arc(x, 96, h, Math.PI, 0); ctx.fill();
  }

  // lawn
  ctx.fillStyle = grad(ctx, 0, 104, 0, 180, [[0, '#39472f'], [1, '#2a3724']]);
  ctx.fillRect(0, 104, SW, 76);
  for (let i = 0; i < 300; i++) {
    const x = rand() * SW, y = 104 + rand() * 76;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(160, 200, 140, 0.06)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(x, y, 1, 2);
  }
  // a path to the door
  R(ctx, 34, 104, 26, 76, '#3a3a34');
  R(ctx, 34, 104, 2, 76, 'rgba(255,255,255,0.06)');

  // bench, weathered
  R(ctx, 148, 118, 54, 4, '#3a2c1e');
  R(ctx, 148, 126, 54, 4, '#3a2c1e');
  R(ctx, 150, 122, 2, 26, '#241a10');
  R(ctx, 198, 122, 2, 26, '#241a10');
  R(ctx, 148, 104, 54, 3, '#312619');

  // a ball, left out
  ctx.fillStyle = '#4a4f46';
  ctx.beginPath(); ctx.arc(120, 150, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath(); ctx.arc(118, 148, 2, 0, Math.PI * 2); ctx.fill();

  // ---- foreground: long grass, close ----
  ctx.fillStyle = 'rgba(14, 22, 12, 0.85)';
  for (let x = 0; x < SW; x += 7) {
    const h = 8 + rand() * 12;
    ctx.fillRect(x, 180 - h, 2, h);
  }
};

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
  training: 'dusk', pressroom: 'cold', tunnel: 'steam', bedroom: 'warm',
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
export function drawBackdrop(ctx, { chapter = 0, kind = 'story', animate = true, scene = null, audio = null } = {}) {
  const { name, palette, weather } = backdropFor(chapter, kind, scene);
  const pal = PALETTES[palette] || PALETTES.dusk;
  const paint = SCENES[name] || SCENES.trial;
  const CW = ctx.canvas.width;
  const CH = ctx.canvas.height;
  const portrait = CH > CW * 0.75;   // a phone held upright

  /* ---- 1. the scene itself, at full 320x180 detail ---- */
  const sceneCanvas = document.createElement('canvas');
  sceneCanvas.width = SW;
  sceneCanvas.height = SH;
  const sctx = sceneCanvas.getContext('2d');
  const rand = seeded(1337 + chapter * 97);
  // v5 painters draw at the full 320x180; the few still to be redrawn keep their
  // old 160x90 coordinates and are doubled, so a half-finished set still works
  // every painter draws at the full 320x180 now
  if (!SCENES[name]) sctx.setTransform(2, 0, 0, 2, 0, 0);
  paint(sctx, pal, rand);
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  // v5 art carries its own texture; the old detail overlay only fights it
  if (false) { const detail = DETAIL[name]; if (detail) detail(sctx, rand); }

  /* ---- 2. compose it into the frame we actually have ---- */
  const base = document.createElement('canvas');
  base.width = CW;
  base.height = CH;
  const bctx = base.getContext('2d');
  // the old set was drawn dark and needed lifting; the new one is drawn at the
  // level it should be seen at, and lifting it burns the greens orange
  bctx.filter = SCENES[name]
    ? 'brightness(1.08) saturate(0.94) contrast(1.04)'
    : 'brightness(1.6) saturate(1.08) contrast(1.03)';

  let horizon = 0;
  let sceneH = CH;
  if (portrait) {
    // the scene sits a little below the top: on a phone the prose panel covers
    // the upper third, and the hearth, the bed and the fire live in the middle
    sceneH = Math.round(Math.min(CH * 0.70, CW * 0.96));
    const top = Math.round(CH * 0.06);
    const sky = bctx.createLinearGradient(0, 0, 0, top + 8);
    sky.addColorStop(0, 'rgba(8, 6, 5, 1)');
    sky.addColorStop(1, (pal.sky && pal.sky[0]) || '#1a1612');
    bctx.fillStyle = sky;
    bctx.fillRect(0, 0, CW, top + 2);

    bctx.drawImage(sceneCanvas, 0, top, CW, sceneH);
    bctx.filter = 'none';
    extendGround(bctx, sceneCanvas, top + sceneH, CH, name, pal, seeded(77 + chapter * 13));
    horizon = Math.round(top + sceneH * 0.52);
  } else {
    bctx.drawImage(sceneCanvas, 0, 0, CW, CH);
    bctx.filter = 'none';
    horizon = Math.round(CH * 0.5);
  }

  // vignette, and the warm wash that makes it feel like a room you sit in
  const g2 = bctx.createRadialGradient(CW / 2, CH * 0.42, CH * 0.18, CW / 2, CH * 0.5, CH * 1.02);
  g2.addColorStop(0, 'rgba(0,0,0,0)');
  g2.addColorStop(1, portrait ? 'rgba(0,0,0,0.34)' : 'rgba(0,0,0,0.30)');
  bctx.fillStyle = g2;
  bctx.fillRect(0, 0, CW, CH);
  bctx.fillStyle = 'rgba(255, 196, 130, 0.045)';
  bctx.fillRect(0, 0, CW, CH);

  /* ---- 3. things that move ---- */
  let raf = null;
  let t = 0;
  let stop = false;
  let flare = 0;                 // a spike whenever a sound lands
  const motion = MOTION[name];

  // interiors get neither rain nor fog: the weather is happening outside the glass
  const OUTDOORS = new Set(['trial', 'training', 'firstteam', 'move', 'decline', 'street', 'garden']);
  const outside = !name || OUTDOORS.has(name);
  const hasFloodlights = new Set(['trial', 'training', 'firstteam', 'move', 'decline']).has(name);

  const frame = () => {
    if (stop) return;
    ctx.clearRect(0, 0, CW, CH);
    ctx.drawImage(base, 0, 0);
    const r = seeded(9001 + Math.floor(t / 7));

    if (weather.rain && outside) {
      drawRain(ctx, r, weather.rain * (portrait ? 3 : 2), CW, CH);
      if (Math.sin(t / 260) > 0.9993) {
        ctx.fillStyle = '#c8d8ff';
        ctx.globalAlpha = 0.14;
        ctx.fillRect(0, 0, CW, CH * 0.5);
        ctx.globalAlpha = 1;
      }
    }
    if (weather.fog && outside) drawFog(ctx, t, pal, CW, horizon - 30);
    if (weather.crowd) drawCrowdShimmer(ctx, r, horizon - 10, CW);
    if (motion) {
      motion(ctx, t, pal, {
        CW, CH, sceneH,
        level: audio ? Math.max(0, Math.min(1, audio() * 6)) : 0,
        flare,
      });
    }
    flare *= 0.93;

    // floodlights breathe, a little — only where there are floodlights
    if (hasFloodlights) {
      const flicker = 0.90 + 0.10 * Math.sin(t / 23) + 0.02 * Math.sin(t / 3);
      ctx.globalAlpha = Math.max(0.55, Math.min(1, flicker));
      ctx.fillStyle = pal.light;
      const scale = CW / SW;
      for (const lx of [40, 280, 44, 276, 24, 68, 252]) {
        ctx.fillRect(lx * scale - 4, 16 * scale, 3, 3);
      }
      ctx.globalAlpha = 1;
    }

    t += 1;
    raf = requestAnimationFrame(frame);
  };

  if (animate) frame(); else { ctx.drawImage(base, 0, 0); }

  const stopFn = () => { stop = true; if (raf) cancelAnimationFrame(raf); };
  // the audio layer can poke the scene when something is played
  stopFn.flare = (amount = 0.6) => { flare = Math.min(1.6, flare + amount); };
  return stopFn;
}


export const BACKDROP_SIZE = { width: W, height: H };
