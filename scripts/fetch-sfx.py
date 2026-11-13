#!/usr/bin/env python3
"""Fetch free recordings from Wikimedia Commons, with strict matching.

The first attempt taught the lesson: text search alone gives you a dial-up modem
for "phone" and a Dutch pronunciation for "thud". Every candidate must now match
a required word in its title AND the licence must be public domain or CC0,
because this ships publicly and a licence we cannot honour is worse than a
synthesised cue.

Usage:  python3 scripts/fetch-sfx.py [cue ...]
"""
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

OUT = "web/sfx"
WORK = "/tmp/sfxdl"
CREDITS = "web/sfx/CREDITS.md"
UA = "twenty-years-game/1.0 (personal project; github.com/Cw-101)"
OK_LICENCES = {"cc0", "public domain", "pd", "cc-zero", "cc0 1.0", "pd-self", "pd-us"}

# cue name -> (queries, words that must appear in the title, max seconds)
WANTED = {
    "whistle":    (["referee whistle", "football referee whistle"], r"whistle", 3.0),
    "crowd":      (["crowd cheering stadium", "stadium crowd ambience"], r"crowd|spectator|cheer", 6.0),
    "kick":       (["football kick ball", "soccer ball kick"], r"kick|ball", 2.0),
    "paper":      (["paper rustle", "paper handling sound"], r"paper", 2.5),
    "heart":      (["heartbeat sound", "heart beat audio"], r"heart", 3.0),
    "door":       (["door closing sound", "door slam"], r"door", 2.5),
    "steps":      (["footsteps walking", "footsteps on pavement"], r"footstep|step|walk", 4.0),
    "birds":      (["birds chirping garden", "birdsong"], r"bird", 5.0),
    "rain":       (["rain ambience", "rain falling"], r"rain", 6.0),
    "dog":        (["dog barking"], r"dog|bark", 3.0),
    "camera":     (["camera shutter sound"], r"shutter|camera", 2.0),
    "kettle":     (["kettle boiling", "electric kettle"], r"kettle", 4.0),
    "wind":       (["wind ambience", "wind blowing"], r"wind", 6.0),
    "gate":       (["gate creaking", "metal gate"], r"gate", 3.0),
    "car":        (["car passing by", "traffic passing"], r"car|traffic|vehicle", 5.0),
    "phoneRing":  (["telephone ring", "ringing telephone"], r"ring|telephone|phone", 4.0),
}

# Commons is full of spoken-Wikipedia and pronunciation files. They pass a
# keyword search and are useless here: "Nl-kick-offmeeting.ogg" is a Dutch
# pronunciation of a meeting, not a football being kicked.
BAD_WORDS = re.compile(
    r"dial.?up|modem|pronunciation|spoken|wikipedia|speech|voice of|"
    r"^(Nl|De|Fr|Es|It|Pl|Sv|Ja|Zh|Ru|Pt|En|Ca)-|"
    r"meeting|offmeeting|word|vocabulary", re.I)


LAST_CALL = [0.0]
MIN_GAP = float(os.environ.get("SFX_GAP", "4"))  # shared infrastructure; do not hammer it


def _get(url, timeout=30, tries=4):
    """One polite GET: throttle every call, back off hard on 429."""
    for attempt in range(tries):
        wait = MIN_GAP - (time.monotonic() - LAST_CALL[0])
        if wait > 0:
            time.sleep(wait)
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                LAST_CALL[0] = time.monotonic()
                return r.read()
        except urllib.error.HTTPError as e:
            LAST_CALL[0] = time.monotonic()
            if e.code == 429:
                backoff = 20 * (attempt + 1)
                print(f"    rate limited; waiting {backoff}s")
                time.sleep(backoff)
                continue
            raise
    raise RuntimeError("gave up after repeated rate limiting")


def api(params):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    return json.loads(_get(url))


def search(query, limit=12):
    try:
        d = api({
            "action": "query", "format": "json", "generator": "search",
            "gsrsearch": f"filetype:audio {query}", "gsrnamespace": 6, "gsrlimit": limit,
            "prop": "imageinfo", "iiprop": "url|size|extmetadata|mediatype",
            "iiextmetadatafilter": "LicenseShortName|Artist|Credit|ImageDescription",
        })
    except Exception as e:
        print(f"    search failed: {e}")
        return []
    out = []
    for p in (d.get("query", {}).get("pages") or {}).values():
        ii = p["imageinfo"][0]
        md = ii.get("extmetadata", {})
        lic = (md.get("LicenseShortName", {}).get("value") or "").strip().lower()
        if lic not in OK_LICENCES:
            continue
        if ii["size"] > 8_000_000:
            continue
        out.append({
            "title": p["title"], "url": ii["url"], "size": ii["size"], "licence": lic,
            "artist": re.sub(r"<[^>]+>", "", md.get("Artist", {}).get("value") or "").strip(),
            "desc": re.sub(r"<[^>]+>", " ", md.get("ImageDescription", {}).get("value") or "").strip()[:120],
            "page": f"https://commons.wikimedia.org/wiki/{urllib.parse.quote(p['title'].replace(' ', '_'))}",
        })
    out.sort(key=lambda f: f["size"])
    return out


def download(url, path, title=None):
    """The direct upload host now rate-limits hard (429); Special:FilePath does not."""
    if title:
        name = title.split(":", 1)[1] if title.startswith("File:") else title
        url = "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(name)
    with open(path, "wb") as f:
        f.write(_get(url, timeout=90))


def probe(path):
    p = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nw=1:nk=1", path], capture_output=True, text=True)
    try:
        return float(p.stdout.strip())
    except ValueError:
        return 0.0


def loudness(path):
    p = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "volumedetect",
                        "-f", "null", "-"], capture_output=True, text=True)
    for line in p.stderr.splitlines():
        if "mean_volume:" in line:
            try:
                return float(line.split("mean_volume:")[1].split("dB")[0].strip())
            except ValueError:
                pass
    return -99.0


def convert(src, dst, seconds):
    fade = min(0.4, seconds * 0.25)
    subprocess.run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", src,
        "-t", f"{seconds:.2f}",
        "-af", f"afade=t=in:st=0:d=0.04,afade=t=out:st={max(0.1, seconds - fade):.2f}:d={fade:.2f}"
               ",loudnorm=I=-18:TP=-2:LRA=7",
        "-ac", "1", "-ar", "44100", "-b:a", "80k", dst,
    ], capture_output=True)
    return os.path.exists(dst) and os.path.getsize(dst) > 2000


def main():
    os.makedirs(WORK, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[1:]
    accepted = []
    for name, (queries, must, max_s) in WANTED.items():
        if only and name not in only:
            continue
        if os.path.exists(f"{OUT}/{name}.mp3"):
            print(f"{name}: already have one")
            continue
        must_re = re.compile(must, re.I)
        print(f"{name}: looking for /{must}/")
        time.sleep(MIN_GAP)
        picked = None
        for q in queries:
            for cand in search(q):
                if not must_re.search(cand["title"]):
                    continue
                if re.search(r"\.(mid|midi|svg|pdf|tif|png|jpg)$", cand["title"], re.I):
                    continue   # sheet music and scores are not sounds
                if BAD_WORDS.search(cand["title"]) or BAD_WORDS.search(cand["desc"]):
                    continue
                raw = f"{WORK}/{name}.src"
                try:
                    download(cand["url"], raw, cand["title"])
                except Exception as e:
                    print(f"    download failed: {e}")
                    continue
                dur = probe(raw)
                if dur < 0.4:
                    print(f"    too short ({dur:.1f}s): {cand['title']}")
                    continue
                lvl = loudness(raw)
                if lvl < -45:
                    print(f"    silent ({lvl:.0f} dB): {cand['title']}")
                    continue
                seconds = min(max_s, dur)
                if convert(raw, f"{OUT}/{name}.mp3", seconds):
                    picked = dict(cand, duration=round(dur, 1), used=round(seconds, 1),
                                  mean_db=round(lvl, 1))
                    break
            if picked:
                break
        if picked:
            kb = round(os.path.getsize(f"{OUT}/{name}.mp3") / 1024)
            print(f"    OK {picked['title'][:60]} [{picked['licence']}] {picked['used']}s -> {kb}KB")
            accepted.append(dict(cue=name, **picked))
        else:
            print("    nothing suitable; the synth keeps this one")

    # the game asks this once instead of firing a 404 per missing cue
    have = sorted(f[:-4] for f in os.listdir(OUT) if f.endswith(".mp3"))
    index = {name: True for name in have}
    with open(f"{OUT}/index.json", "w") as f:
        json.dump(index, f, indent=2)
    print(f"index.json: {len(index)} recording(s)")

    if accepted:
        existing = []
        if os.path.exists(CREDITS):
            existing = json.loads(open(CREDITS).read().split("<!--json\n")[1].split("\n-->")[0]) \
                if "<!--json" in open(CREDITS).read() else []
        merged = {c["cue"]: c for c in existing}
        for c in accepted:
            merged[c["cue"]] = c
        rows = sorted(merged.values(), key=lambda c: c["cue"])
        md = ["# Sound credits", "",
              "Recordings from Wikimedia Commons. Only public domain and CC0 files are used,",
              "so nothing here requires attribution — it is listed anyway, because knowing",
              "where a sound came from is part of keeping it.", "",
              "| cue | source file | licence | used |", "|---|---|---|---|",
              ]
        for r in rows:
            md.append(f"| `{r['cue']}` | [{r['title'].replace('|', '/')}]({r['page']}) | {r['licence']} | {r['used']}s |")
        md += ["", "Every other sound in the game is synthesised by `web/sfx.js`.", "",
               "<!--json", json.dumps(rows, indent=2), "-->"]
        open(CREDITS, "w").write("\n".join(md))
        print(f"\n{len(accepted)} accepted, {len(rows)} total; credits written")


if __name__ == "__main__":
    main()
