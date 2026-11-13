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

```bash
npm start                 # interactive, in the terminal
npm start -- --seed 42    # reproducible career
npm start -- --auto       # watch a full career play itself
```

## Test

```bash
npm test
```

## Structure

```
src/rng.js        seeded RNG (careers are reproducible from a seed)
src/story.js      all content: 6 chapters, 28 scenes, as data
src/game.js       chapter/scene engine, whispers, stat clamps, choice log
src/biography.js  turns flags + log into prose
src/cli.js        terminal player
tests/            determinism, whisper economy, stat bounds, full playthrough
```

Design notes and non-goals are in `DESIGN.md`.

## Status

Playable core. No browser UI yet — that's next, along with save/resume and a
"he will remember that" notice when a choice sets a long-tail flag.
