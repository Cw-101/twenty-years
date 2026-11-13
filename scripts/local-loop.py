#!/usr/bin/env python3
"""Autonomous beta work loop, driven by the local model.

Runs until /tmp/football-agent.stop exists or `systemctl --user stop` is called.

Each cycle:
  1. runs scripts/qa.mjs and picks the highest-value job, cycling so the list
     never runs dry
  2. asks the local Qwen3-8B for ONE conversation topic as JSON
  3. validates it hard (shape, length, duplicate ids, banned phrases)
  4. appends it to src/extra-topics.js
  5. node --check + npm test; anything red is reverted, never committed
  6. commits locally, pushes every third success

Every 30 minutes it sends a DM through `hermes send`, which uses the gateway's
bot token and no language model — the whole loop costs no cloud tokens.
"""
import json
import os
import random
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime

REPO = "/home/Evan/Projects/hermes/projects/football-agent"
STOP = "/tmp/football-agent.stop"
LOG = "/tmp/football-agent-loop.log"
LOCAL = "http://127.0.0.1:8111/v1/chat/completions"
MODEL = "qwen3-8b"
REPORT_EVERY = 30 * 60
BANNED = re.compile(r"testament|resilience|delve|tapestry|in conclusion|furthermore|journey", re.I)

state = {"cycle": 0, "commits": 0, "pushed": 0, "applied": [], "rejected": [], "last": datetime.now()}


def log(msg):
    print(f"{datetime.now():%H:%M:%S} {msg}", flush=True)


def run(cmd, timeout=180, cwd=REPO):
    p = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True, timeout=timeout)
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def qa_jobs():
    code, out = run("node scripts/qa.mjs", timeout=60)
    if code != 0:
        log(f"qa failed: {out[:200]}")
        return []
    try:
        return json.loads(out).get("jobs", [])
    except json.JSONDecodeError:
        return []


def ask_local(prompt, timeout=240):
    body = json.dumps({
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "You write quiet, grounded British prose for a football narrative game. You answer with JSON only, no commentary."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.85,
        "max_tokens": 700,
        "response_format": {"type": "json_object"},
    }).encode()
    req = urllib.request.Request(LOCAL, data=body, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = json.load(r)
    return data["choices"][0]["message"]["content"]


def extract_json(text):
    start = text.find("{")
    end = text.rfind("}")
    if start < 0 or end <= start:
        return None
    chunk = text[start:end + 1]
    try:
        return json.loads(chunk)
    except json.JSONDecodeError:
        return None


def valid(topic, scene_id, existing_ids):
    if not isinstance(topic, dict):
        return "not an object"
    if not isinstance(topic.get("id"), str) or not re.fullmatch(r"[a-zA-Z][a-zA-Z0-9]{2,40}", topic["id"]):
        return "bad id"
    if topic["id"] in existing_ids:
        return "duplicate id"
    label = topic.get("label")
    if not isinstance(label, str) or not (8 <= len(label) <= 78):
        return "bad label"
    text = topic.get("text")
    if not isinstance(text, str) or not (140 <= len(text) <= 900):
        return "bad text length"
    if len(re.findall(r"[.!?](\s|$)", text)) < 2:
        return "needs at least two sentences"
    if BANNED.search(text) or BANNED.search(label):
        return "banned phrasing"
    return None


def add_topic(scene_id, topic):
    path = os.path.join(REPO, "src/extra-topics.js")
    src = open(path).read()
    entry = json.dumps({scene_id: [topic]}, indent=2)
    inner = entry.strip()[1:-1].strip()
    if "EXTRA_TOPICS = {\n};" in src:
        src = src.replace("EXTRA_TOPICS = {\n};", f"EXTRA_TOPICS = {{\n{inner},\n}};")
    else:
        src = src.replace("\n};", f"\n{inner},\n}};")
    open(path, "w").write(src)


def existing_topic_ids():
    code, out = run("node -e \"import('./src/story.js').then(m=>{const ids=[];for(const c of m.CHAPTERS)for(const s of c.scenes)for(const t of (s.topics||[]))ids.push(t.id);console.log(JSON.stringify(ids))})\"")
    try:
        return set(json.loads(out.strip().splitlines()[-1]))
    except Exception:
        return set()


def report(force=False):
    if not force and (datetime.now() - state["last"]).total_seconds() < REPORT_EVERY:
        return
    state["last"] = datetime.now()
    lines = [f"Twenty Years · local model update ({state['cycle']} cycles)"]
    lines.append(f"{state['commits']} commits, {state['pushed']} pushed, {len(state['rejected'])} generations rejected")
    if state["applied"]:
        lines.append("latest: " + ", ".join(state["applied"][-3:]))
    code, out = run("git log --oneline -1")
    if code == 0 and out.strip():
        lines.append("HEAD " + out.strip()[:80])
    msg = "\n".join(lines)
    code, out = run(f"hermes send --to telegram {json.dumps(msg)}", timeout=60)
    log(f"report sent ({'ok' if code == 0 else out[:80]})")


def cycle(jobs, offset):
    job = jobs[offset % len(jobs)]
    if job.get("kind") != "topic":
        return
    scene = job["scene"]
    cast = ", ".join(job.get("cast") or []) or "the people in the room"
    prompt = f"""Write ONE conversation topic for a scene in a British football novel set between 2005 and 2026.

Scene id: {scene}
Chapter: {job.get('chapter')} ({job.get('title')})
The people present: {cast}
The scene, roughly: {job.get('excerpt') or '(no excerpt)'}
Things he can already do here: {'; '.join(c for c in (job.get('choices') or []) if isinstance(c, str))}

The topic is something the player can ask — a small, awkward, specific question that reveals character. Not a plot beat.

Example of the shape and tone (do not copy the content):
{{"id":"askAboutTheBoots","label":"Ask whose boots those are.","text":"He nods at the pair by the door, laces gone grey, soles worn through at the ball of the foot.\n\n\"They were your uncle's,\" she says, and does not offer anything else, and he does not ask."}}

Rules:
- "id": camelCase, 3-40 characters, unique
- "label": what the player taps, under 78 characters, a sentence fragment, no question mark needed
- "text": one or two short paragraphs, 150-600 characters. Two or three sentences of speech and action. First person is banned; write "he" and the other person's speech in quotes. Concrete objects and specific numbers. No weather as a metaphor.
- Never use the words testament, resilience, delve, tapestry, journey.
- No em dashes. British spelling.

Answer with JSON only:
{{"id": "...", "label": "...", "text": "..."}}"""
    try:
        raw = ask_local(prompt)
    except Exception as e:
        log(f"model error: {e}")
        return
    topic = extract_json(raw)
    problem = valid(topic, scene, existing_topic_ids())
    if problem:
        state["rejected"].append(f"{scene}:{problem}")
        log(f"rejected {scene}: {problem} :: {raw[:150]!r}")
        return

    add_topic(scene, topic)
    code, out = run("node --check src/extra-topics.js && node --check src/story.js && npm test --silent")
    if code != 0:
        run("git checkout -- src/extra-topics.js")
        state["rejected"].append(f"{scene}:tests")
        log(f"tests failed, reverted ({out.strip().splitlines()[-1][:90] if out.strip() else ''})")
        return

    run('git add -A && git -c user.name="Cw-101" -c user.email="172491667+Cw-101@users.noreply.github.com" '
        f'commit -q -m "content: {scene} — topic written by the local model"')
    state["commits"] += 1
    tid = (topic or {}).get("id", "?")
    state["applied"].append(f"{scene}:{tid}")
    log(f"committed {scene}:{tid}")
    if state["commits"] % 3 == 0:
        code, _ = run("git push -q origin main", timeout=180)
        if code == 0:
            state["pushed"] += 1
            log("pushed")


def main():
    os.chdir(REPO)
    if os.path.exists(STOP):
        os.remove(STOP)
    log("loop starting")
    offset = 0
    while not os.path.exists(STOP):
        try:
            jobs = [j for j in qa_jobs() if j.get("kind") == "topic"]
            if not jobs:
                log("no jobs; waiting")
                time.sleep(120)
                continue
            cycle(jobs, offset)
            offset += 1
            state["cycle"] += 1
            report()
        except KeyboardInterrupt:
            break
        except Exception as e:
            log(f"cycle error: {e}")
            time.sleep(30)
        time.sleep(max(20, random.randint(25, 55)))
    log("loop stopped")


if __name__ == "__main__":
    main()
