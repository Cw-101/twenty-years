# Sound effects

Drop real recordings in this folder and they replace the synthesised ones with no
code change. Any file not present falls back to the WebAudio synth in
`web/sfx.js`, so a partial set is fine and the game is never silent.

## Filenames

Exactly these, `.mp3`:

| name | used for | ideally |
|---|---|---|
| `whistle.mp3` | referee's whistle — trial, return match, derby | short, sharp, real |
| `crowd.mp3` | crowd swell — debut, farewell, testimonial | 2–3s rise and fall |
| `thud.mp3` | impact — injury, a bad tackle, being dropped | body/ball, low |
| `phone.mp3` | a call — the hospital, his father, the scandal | two rings |
| `paper.mp3` | letters, contracts, the clause | paper handling |
| `heart.mp3` | dread and self-doubt scenes | two slow beats |
| `mark.mp3` | a choice that lands | soft single bell |
| `fail.mp3` | a choice that does not land | descending tone |

## Where to get CC0 audio

- **Kenney** (kenney.nl > Assets > Audio) — CC0, no attribution needed. The
  *Impact Sounds*, *Interface Sounds* and *RPG Audio* packs cover all eight cues.
  The site blocks automated download, so it needs a browser click.
- **Freesound** — filter by licence *Creative Commons 0*; requires a free
  account and API key for bulk download.
- **Sonniss GDC bundles** — huge, free, but many GB.

## Converting

Whatever you download, convert to mono MP3 at 96 kbps to keep the repo small:

```bash
for f in ~/Downloads/kenney_impact-sounds/Audio/*.ogg; do
  ffmpeg -y -i "$f" -ac 1 -b:a 96k "web/sfx/$(basename "${f%.*}").mp3"
done
```

Then rename the ones you want to the eight names above. Keep each under ~200 ms
for impacts and under ~3 s for the crowd.

## Licence note

Whatever you drop in must be CC0 or otherwise cleared for public distribution —
this site is published at <https://Cw-101.github.io/twenty-years/>.
