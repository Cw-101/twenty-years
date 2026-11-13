# Sound

Two sources, in priority order:

1. a real recording at `web/sfx/<cue>.mp3`
2. a synthesised cue in `web/sfx.js`

Anything without a recording falls back to the synth, so the game is never
silent and a partial set of recordings is fine. `index.json` lists which
recordings exist, so the game asks once instead of firing a 404 per missing cue.

## How a place sounds

`SCENE_SOUND` in `web/sfx.js` maps each backdrop to:

- **a bed** — a continuous loop: `rain`, `crowd`, `outdoor`, `night`, or one of
  the six room flavours (`kitchen`, `office`, `dressing`, `injury`, `pressroom`,
  `tunnel`). Beds are layered (body + air + sometimes a low rumble) and drift
  slowly, so they never sit dead still.
- **accents** — short sounds that arrive at random intervals (3–17s depending on
  the place), each with its own pitch, level and stereo position, so a scene you
  sit in keeps changing.

The kitchen, for example, has a kettle, a mug on the worktop, a radio and
television through walls, crockery, and voices you cannot quite follow.

## Checking that it works

Open the game with `?audio=audit`. Every cue is rendered offline and measured —
peak, RMS, how long it is audible — and the console prints either
`AUDIT OK: 100 cues, none silent, none clipping` or a failure list. A cue that
throws is obvious; a cue that renders silence is not, which is why the audit
measures the signal instead of trusting that nothing threw.

`tests/audio.test.js` covers the wiring: every accent points at a cue that
exists, every trim belongs to a cue that exists, and no two places share an
identical soundscape.

## Getting more recordings

```bash
python3 scripts/fetch-sfx.py            # everything missing
python3 scripts/fetch-sfx.py crowd door # just these
```

It searches Wikimedia Commons, keeps only public domain / CC0 files, requires
the cue's keyword to appear in the filename (the first version happily fetched a
dial-up modem for "phone"), checks the decoded file is not silent, then trims,
fades and normalises it to 44.1k mono. Credits land in `CREDITS.md`.

Commons rate-limits aggressively: the script throttles every request and backs
off on 429, so a full run takes several minutes. It is safe to re-run — anything
already downloaded is skipped.

## Where else to look

- **Kenney** (kenney.nl → Assets → Audio) — CC0, no attribution. Site blocks
  automated download, needs a browser click.
- **Freesound** — filter by CC0; needs a free account and API key.
- **OpenGameArt** — CC0 packs, direct downloads.

## Licence note

Whatever is dropped in must be CC0 or otherwise cleared for public distribution —
this site is published at <https://Cw-101.github.io/twenty-years/>. `CREDITS.md`
records what came from where.
