# Sound credits

Recordings from Wikimedia Commons. Only public domain and CC0 files are used, so
nothing here requires attribution — it is listed anyway, because knowing where a
sound came from is part of keeping it.

| cue | source file | licence | used |
|---|---|---|---|
| `whistle` | [File:218318 splicesound referee-whistle-blow-gymnasium.wav](https://commons.wikimedia.org/wiki/File%3A218318_splicesound_referee-whistle-blow-gymnasium.wav) | CC0 | 3.0s |
| `rain` | [File:Rain and thunder.ogg](https://commons.wikimedia.org/wiki/File%3ARain_and_thunder.ogg) | public domain | 6.0s |
| `kettle` | [File:Electric kettle and a gastherme.ogg](https://commons.wikimedia.org/wiki/File%3AElectric_kettle_and_a_gastherme.ogg) | public domain | 4.0s |

Every other sound in the game is synthesised by `web/sfx.js`.

## How these were chosen

`scripts/fetch-sfx.py` searches Commons, keeps only public domain / CC0 files,
requires the cue's keyword to appear in the filename, rejects silent decodes, and
then trims, fades and normalises to 44.1k mono at 80 kbps. Filenames that look
like spoken-Wikipedia or pronunciation files are rejected — a keyword search for
"phone" otherwise returns a dial-up modem, and "kick" returns a Dutch
pronunciation of "kick-off meeting".

Re-running the script is safe: anything already present is skipped, and it
rewrites `index.json`.
