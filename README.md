# Twenty Years

A narrative game about one footballer's career, from a trial letter at sixteen to
a retirement statement at thirty-six.

Scenes are situations, not quizzes. Before deciding you can **talk to the people
in it** — his mother, his sister, the coach, the agent, the physio — and each
conversation adds what you found out to the page. Talking never rolls a die.
Every conversation you have in a scene is **+1 to the decision you then make**
(capped at +3), so asking is how you improve your odds. Scenes offer anything
from two to five options, and not every option rolls: silence just happens.

Every scene offers **three ways to meet it** — Bold, Careful, Honest, and
sometimes Craft or Graft — and each one is a check: **d20 + an attribute
modifier against a DC**. A natural 20 always lands, a natural 1 never does.

You get **three inspiration per chapter**. Spend one after a roll to take it
again with advantage — roll twice, keep the better — and undo the outcome you
did not want. Failures are not dead ends: they cost belief and they set their own
flags, so the story bends around what he tried rather than what he achieved.

## Two kinds of stat

**Football** — Touch, Engine, Composure, Vision, Power. You place ten points across
them before the first scene (max six at sixteen), a training ground pays out three
more between chapters, and they are what the dice roll in **match-day and
training scenes**. The modifier is the attribute minus five, so 6 is +1 and 10 is
+5.

**Personality** — Confidence (self-effacing ↔ arrogant), Loyalty (loyal ↔
restless), Openness (open ↔ guarded), Conscience (straight ↔ cynical). Nobody
buys these. They are read from the choices and the repeated way you answer a
scene, they run −100 to +100, and they are what the dice roll in **story
scenes**: bold tests Confidence, careful tests Openness, honest tests Conscience.
Each axis shows its own modifier, from −5 to +5.

Both systems appear in the career profile — ◈ in the header — as one panel with
two clearly separated halves.

The game ends with his biography: what he won, what he hid, who he helped, and
what kind of player and man he turned out to be.

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
src/world.js          clubs, rivals, places, terrace colour, public story
web/audio.js          whisper playback + synthesised room tone
src/game.js           engine: chapters, checks, choices, memories
src/dice.js           d20 checks, modifiers, advantage
src/skills.js         attributes, training points, personality axes
src/biography.js      flags -> prose
src/save-core.js      save format (browser and tests)
src/save.js           save format + filesystem helpers (Node)
src/cli.js            terminal player
```

Design notes and non-goals are in `DESIGN.md`.

## People

Everybody he shares a scene with is tracked. Scenes declare who is in the room,
conversations declare who they introduce, and a notification marks the moment
someone new arrives. The **People** tab grows as he meets them — with a role, the
age he met them at, and how many things they remember — and tapping a person
opens everything they witnessed, including the attempts that failed.

The ending lists who was there and the last thing each of them remembers.

## Backdrops

Six pixel-art scenes are drawn in code (`web/pixelart.js`) at 160×90 and scaled
up with no smoothing: a municipal training ground at dusk, a floodlit ground at
night, a rehab room with one window, a big empty stadium, a grey pitch in
daylight, and a garden at night. Each carries weather — rain over the trial and
the decline, a crowd that shifts under the lights — so the scene is never
completely still. Nothing is downloaded and the whole set is about 10KB.

## Mobile

The game is built phone-first: sticky header with 44px controls, a bottom-sheet
profile, tap targets sized for a thumb, safe-area padding, and a still backdrop
under 640px to save battery. Type and spacing are checked at 320, 360, 390, 430,
768, 1024 and 1440 with no horizontal overflow on any screen.

## Sound and motion

Text reveals progressively, paragraph by paragraph, and a click (or space) skips
to the end — `prefers-reduced-motion` disables the animation entirely.

Eight sound cues fire on scenes and outcomes (whistle, crowd, thud, phone,
paper, heart, a bell for a choice that lands, a falling tone for one that does
not). They are synthesised in the browser by default, and any real recording
dropped into `web/sfx/` with the matching name takes priority — see the
licensing and filename table in `web/sfx/README.md`.

## Sound

Line readings are pre-generated: 54 MP3s in `web/audio/`, made with
the soniac voice chain via `node scripts/generate-whisper-audio.mjs`. The room
tone under the scene is synthesised in the browser with WebAudio (two low drones
and filtered noise) — no assets, toggleable with the sound button.

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
