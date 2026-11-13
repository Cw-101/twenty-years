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
  ctx.fillStyle = 'rgba(225, 235, 245, 0.55)';
  ctx.fillRect(x, y, 0.6, h);
  ctx.fillRect(x + w, y, 0.6, h);
  ctx.fillRect(x, y, w, 0.6);

  ctx.strokeStyle = 'rgba(200, 220, 240, 0.16)';
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
  pressroom: 'floor', tunnel: 'floor',
  street: 'road', garden: 'lawn',
};

function extendGround(ctx, scene, sceneH, totalH, name, pal, rand) {
  const family = GROUND_FAMILY[name] || 'floor';
  const bandH = totalH - sceneH;
  if (bandH <= 0) return;

  // stretch the scene's last rows downward: the same surface, closer to you
  const stripH = 6;
  ctx.drawImage(scene, 0, SH - stripH, SW, stripH, 0, sceneH, SW, bandH);

  // darken as it comes toward the camera, so text sits on something calm
  const shade = ctx.createLinearGradient(0, sceneH, 0, totalH);
  shade.addColorStop(0, 'rgba(0,0,0,0.02)');
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
      const x = 150 + i * 22 + Math.sin(t / 40 + i) * 6;
      ctx.fillRect(x, 96 - p * 60, 3 + p * 4, 2);
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
  training: 'dusk', pressroom: 'cold', tunnel: 'steam',
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
  const CW = ctx.canvas.width;
  const CH = ctx.canvas.height;
  const portrait = CH > CW * 0.75;   // a phone held upright

  /* ---- 1. the scene itself, at full 320x180 detail ---- */
  const sceneCanvas = document.createElement('canvas');
  sceneCanvas.width = SW;
  sceneCanvas.height = SH;
  const sctx = sceneCanvas.getContext('2d');
  const rand = seeded(1337 + chapter * 97);
  sctx.setTransform(2, 0, 0, 2, 0, 0);   // painters keep their 160x90 coordinates
  paint(sctx, pal, rand);
  sctx.setTransform(1, 0, 0, 1, 0, 0);
  const detail = DETAIL[name];
  if (detail) detail(sctx, rand);

  /* ---- 2. compose it into the frame we actually have ---- */
  const base = document.createElement('canvas');
  base.width = CW;
  base.height = CH;
  const bctx = base.getContext('2d');
  bctx.filter = 'brightness(1.6) saturate(1.08) contrast(1.03)';

  let horizon = 0;
  if (portrait) {
    // the scene sits in the upper half; the ground it lands on is generated
    const sceneH = Math.round(Math.min(CH * 0.52, CW * 0.84));
    bctx.drawImage(sceneCanvas, 0, 0, CW, sceneH);
    bctx.filter = 'none';
    extendGround(bctx, sceneCanvas, sceneH, CH, name, pal, seeded(77 + chapter * 13));
    horizon = Math.round(sceneH * 0.52);
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
  const motion = MOTION[name];

  const frame = () => {
    if (stop) return;
    ctx.clearRect(0, 0, CW, CH);
    ctx.drawImage(base, 0, 0);
    const r = seeded(9001 + Math.floor(t / 7));

    if (weather.rain) {
      drawRain(ctx, r, weather.rain * (portrait ? 3 : 2), CW, CH);
      if (Math.sin(t / 260) > 0.9993) {
        ctx.fillStyle = '#c8d8ff';
        ctx.globalAlpha = 0.14;
        ctx.fillRect(0, 0, CW, CH * 0.5);
        ctx.globalAlpha = 1;
      }
    }
    if (weather.fog) drawFog(ctx, t, pal, CW, horizon - 30);
    if (weather.crowd) drawCrowdShimmer(ctx, r, horizon - 10, CW);
    if (motion) motion(ctx, t, pal, CW, CH);

    // floodlights breathe, a little
    const flicker = 0.90 + 0.10 * Math.sin(t / 23) + 0.02 * Math.sin(t / 3);
    ctx.globalAlpha = Math.max(0.55, Math.min(1, flicker));
    ctx.fillStyle = pal.light;
    const scale = CW / SW;
    for (const lx of [40, 280, 44, 276, 24, 68, 252]) {
      ctx.fillRect(lx * scale - 4, 16 * scale, 3, 3);
    }
    ctx.globalAlpha = 1;

    t += 1;
    raf = requestAnimationFrame(frame);
  };

  if (animate) frame(); else { ctx.drawImage(base, 0, 0); }

  return () => { stop = true; if (raf) cancelAnimationFrame(raf); };
}


export const BACKDROP_SIZE = { width: W, height: H };
