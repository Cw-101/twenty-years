# Twenty Years

A narrative game about one footballer's career, seen from the perspective of the
voice in his head.

You are not his agent. You are the thing he hears when he is alone — at sixteen,
when the trial letter arrives, and at thirty-six, when he asks what you were.
You have **three whispers per chapter**. Every intervention costs one. Silence is
always free and sometimes correct.

The game ends with his biography: what he won, what he hid, who he helped, and
what he concluded about the voice.

## Play

**In a browser** (recommended):

```bash
npm run serve        # then open http://localhost:8140
```

or play the published build: <https://Cw-101.github.io/twenty-years/>

**In a terminal:**

```bash
npm start                                    # interactive
npm start -- --campaign hkderby              # the authored Hong Kong–Derby story
npm start -- --campaign hkderby --first Marcus --last Ng
npm start -- --seed 42                       # reproducible career
npm start -- --auto                          # watch a full career play itself
npm start -- --resume ~/.twenty-years/*.json # continue a saved career
npm start -- --list-campaigns
```

## Stories

- **The Other Side of the World** (`hkderby`) — Jintao Lu, born in Derby to a
  family out of Guangdong by way of Hong Kong. Derby academy, two federations
  asking, and a name with four different pronunciations. Base name `Jintao Lu`;
  first and last can be changed independently.
- **The Valley** (`valley`) — Dafydd Llewellyn, Merthyr Tydfil, Cardiff Academy.

Any other career is drawn from the seed: one of eleven nations, five pedigrees,
and two or three personal hooks that shape which scenes you get.

## Test

```bash
npm test             # 31 tests: engine, origins, campaigns, hooks, save/resume
```

## Structure

```
index.html            browser shell
web/app.js            browser player (renders engine output, localStorage saves)
web/style.css         cinematic styling
src/story.js          shared scenes, six chapters
src/hook-scenes.js    scenes that exist only for certain hooks
src/campaigns.js      authored careers with fixed origins and bespoke scenes
src/origin.js         nations, pedigrees, hooks, seeded generation
src/beats.js          chapter-opening prose
src/world.js          clubs, rivals, places, terrace colour
src/game.js           engine: whispers, stats, choices, memories
src/biography.js      flags -> prose
src/save-core.js      save format (browser and tests)
src/save.js           save format + filesystem helpers (Node)
src/cli.js            terminal player
```

Design notes and non-goals are in `DESIGN.md`.

## On generated prose

The local Qwen3-8B is used **at build time only**, never during play: the
`scripts/origin-flavour.mjs` generator writes variants into `src/flavour.js`,
which the game imports. Two attempts to have it write chapter openings and
terrace dialogue failed a quality bar (numbered output, no concrete detail,
clichés), so those are hand-written — see the note in `src/world.js`.

## Status

Playable end to end in the browser and the terminal: six chapters, hook-reactive
scenes, remembered consequences, biography, autosave and resume. Not yet done:
sound, real-device mobile testing, and more authored campaigns for the other
main nations.
