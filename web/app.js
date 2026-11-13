/**
 * The browser player. Thin: it renders what the engine says and stores a save.
 * All story logic lives in ../src, shared with the CLI and the tests.
 */
import {
  newGame, currentScene, currentChapter, availableChoices, choose,
  advanceChapter, isFinished, biography, epilogue, memories, enterScene, knownPeople, personRecord,
  availableTopics, learnTopic, insightBonus,
} from '../src/game.js?v=20261119a';
import { listCampaigns, getCampaign } from '../src/campaigns.js?v=20261119a';
import { chapterOpening } from '../src/beats.js?v=20261119a';
import { CHAPTERS } from '../src/story.js?v=20261119a';
import { publicStory, chantFor } from '../src/world.js?v=20261119a';
import { toggleAmbient, ambientState } from './audio.js?v=20261119a';
import { careerStats, seasonStats, formWord, formModifier } from '../src/stats.js';
import { play, setEnabled as setSfx, cueForScene, setSceneAudio, stopSceneAudio, duckAmbience, startMusic, stopMusic, audioLevel, onSound } from './sfx.js?v=20261119a';
import { drawBackdrop } from './pixelart.js?v=20261119a';
import { toJSON, fromJSON } from '../src/save-core.js?v=20261119a';
import {
  FOOTBALL, ATTRIBUTES, SKILL_MAX, START_MAX, START_BASE, START_POINTS,
  spendPoint, refundPoint, personality, skillSummary, personalityModifier,
  suggestedAllocation, blankAllocation, pointsLeft, canRaise, canLower, normaliseAllocation,
} from '../src/skills.js?v=20261119a';
import { snapshot, restore, spendInspiration, INSPIRATION_PER_CHAPTER } from '../src/game.js?v=20261119a';

const SAVE_KEY = 'twenty-years-save-v1';
const SOUND_KEY = 'twenty-years-sound';

// Sound is on unless the player has turned it off. Browsers refuse to start
// audio without a gesture, so it arms on the first tap or keypress.
let soundWanted = localStorage.getItem(SOUND_KEY) !== 'off';
let audioLive = false;
const $ = (id) => document.getElementById(id);

let game = null;
let cardShowing = false;
let renderedChapter = -1;

/* ---------------------------------------------------------------- helpers */

function show(which) {
  // Derived from the DOM, so adding a screen never silently hides all of them.
  for (const el of document.querySelectorAll('.screen')) {
    el.classList.toggle('hidden', el.id !== which);
  }
  // the header carries the mute and the profile, so it stays on the ending too
  $('bar').classList.toggle('hidden', which === 'start');
  // otherwise the next screen opens wherever the last one was scrolled to, with
  // its first line hidden under the header
  window.scrollTo(0, 0);
}

function paragraphs(text, cls = '') {
  return String(text)
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((p) => {
      const isQuote = /^["“]/.test(p.trim());
      return `<p class="${cls}${isQuote ? ' dialogue' : ''}">${escapeHtml(p)}</p>`;
    })
    .join('');
}

let reader = null;   // { pages: string[], i: number, typing: bool }

/** Split scene text into visual-novel pages (one paragraph per screen). */
function splitPages(text) {
  return String(text).split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
}

/** Type one paragraph into an element. */
function typeInto(el, text, onDone) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { el.textContent = text; reader.typing = false; onDone && onDone(); return; }
  let i = 0;
  reader.typing = true;
  reader.full = text;
  reader.el = el;
  clearInterval(reader.timer);
  let ticks = 0;
  reader.timer = setInterval(() => {
    const from = i;
    // one character at ~60 a second: fast enough not to be a gimmick, slow
    // enough to read along with. It was three per 18ms, which was a blur.
    i = Math.min(text.length, i + 1);
    el.textContent = text.slice(0, i);

    // every few characters, a quiet tick; at a word break, a slightly heavier one
    const chunk = text.slice(from, i);
    if (chunk.trim().length) {
      // a tick every third character: a pen moving, not a machine gun
      if (++ticks % 3 === 0) play('type', { gain: 0.4 });
    } else if (chunk.length) {
      play('typeWord', { gain: 0.3 });
    }

    if (i >= text.length) {
      clearInterval(reader.timer);
      reader.typing = false;
      play('typeDone', { gain: 0.7 });
      if (typeof reader.onLanded === 'function') { reader.onLanded(); reader.onLanded = null; }
      // a small warm settle, so finishing a paragraph feels like arriving
      el.classList.add('settled');
      setTimeout(() => el.classList.remove('settled'), 950);
      onDone && onDone();
    }
  }, 18);
}

function finishTyping() {
  if (!reader || !reader.typing) return false;
  clearInterval(reader.timer);
  reader.el.textContent = reader.full;
  reader.typing = false;
  return true;
}

/** Open a scene as a paged reader, choices withheld until the last page. */
function openScene(text, scene) {
  if (reader && reader.timer) clearInterval(reader.timer);
  reader = { pages: splitPages(text), i: 0, typing: false, timer: null, el: null, full: '', learned: [] };
  const cue = cueForScene(scene.id);
  if (cue) setTimeout(() => play(cue), 180);

  $('choices').classList.add('ahead');
  paintPage();
}

function paintPage() {
  if (!reader) return;
  const page = reader.pages[reader.i];
  const isQuote = /^["“]/.test(page);
  $('prose').innerHTML = `<p class="${isQuote ? 'dialogue' : ''}"></p>`;
  const el = $('prose').querySelector('p');
  // the panel itself no longer fades and un-blurs on every page: re-animating the
  // container made the paragraph look like it vanished and came back
  el.classList.add('fresh');
  setTimeout(() => el.classList.remove('fresh'), 520);
  typeInto(el, page);

  // keep whatever he has already found out on screen as the pages advance
  for (const line of (reader.learned || [])) {
    $('prose').insertAdjacentHTML('beforeend', `<p class="learned">${escapeHtml(line)}</p>`);
  }

  const total = reader.pages.length;
  const last = reader.i >= total - 1;
  $('pageNum').textContent = total > 1 ? `${reader.i + 1} / ${total}` : '';
  $('choices').classList.add('ahead');
  $('choices').inert = true;
  if (last) {
    reader.onLanded = () => {
      $('choices').classList.remove('ahead');
      $('choices').inert = false;
      $('hint').textContent = `${isTouch() ? 'tap a choice' : `press 1–${$('choices').querySelectorAll('.choice').length}`} · ${game.inspiration ?? 0} inspiration to reroll`;
    };
  }
  $('hint').textContent = last
    ? `${isTouch() ? 'tap' : `press 1–${$('choices').querySelectorAll('.choice').length}`} · ${game.inspiration ?? 0} inspiration to reroll`
    : (isTouch() ? 'Tap to continue' : 'Click, space or → to read on');
}

/** Advance one page. Returns false when there is nowhere left to go. */
function nextPage() {
  if (!reader) return false;
  if (finishTyping()) return true;
  if (reader.i >= reader.pages.length - 1) return false;
  reader.i += 1;
  play('page');
  paintPage();
  return true;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function clearToast() {
  for (const id of ['toast', 'notice']) {
    const el = $(id);
    if (!el) continue;
    clearTimeout(el._timer);
    el.classList.remove('show', 'big', 'meet');
    el.textContent = '';
  }
}

function isNarrow() {
  return window.matchMedia('(max-width: 640px)').matches;
}

/**
 * One notification API, two presentations: an inline banner at the top of the
 * page on phones (so it can never cover the header or a choice), and a floating
 * chip on wider screens.
 */
function toast(message, { big = false, ms = 2400, kind = 'meet' } = {}) {
  const inline = isNarrow();
  const el = inline ? $('notice') : $('toast');

  if (inline) {
    $('toast').classList.remove('show');
    el.textContent = message;
    el.classList.toggle('meet', kind === 'meet');
    el.classList.add('show');
  } else {
    $('notice').classList.remove('show');
    el.textContent = message;
    el.classList.toggle('big', big);
    el.classList.toggle('meet', kind === 'meet');
    el.classList.add('show');
  }

  duckAmbience(0.4, ms);
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), ms);
}

function measureBar() {
  const bar = $('bar');
  if (!bar) return;
  const h = bar.classList.contains('hidden') ? 0 : Math.round(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--bar-h', `${h}px`);
}

function paintBar() {
  if (!game) return;
  $('barName').textContent = game.name;
  $('barMeta').textContent = `age ${game.age} · ch ${game.chapter + 1}/6 · ${game.campaignTitle || 'a career'}`;
  measureBar();

  const dots = $('chapterDots');
  if (dots) {
    dots.innerHTML = Array.from({ length: 6 }, (_, i) => {
      const cls = i < game.chapter ? 'done' : i === game.chapter ? 'now' : '';
      return `<span class="dot ${cls}"></span>`;
    }).join('');
  }

  const left = game.inspiration ?? 0;
  $('whispers').innerHTML = Array.from({ length: INSPIRATION_PER_CHAPTER }, (_, i) =>
    `<i class="${i < left ? '' : 'spent'}">◆</i>`).join('');

  // a gold pip when a chapter owes him points, with the count for screen readers
  const pts = game.skillPoints || 0;
  const pbtn = $('profileBtn');
  if (pbtn) {
    pbtn.classList.toggle('haspoints', pts > 0);
    pbtn.setAttribute('aria-label', pts > 0 ? `Career profile, ${pts} point${pts === 1 ? '' : 's'} to spend` : 'Career profile');
  }
}

function save() {
  try { localStorage.setItem(SAVE_KEY, toJSON(game)); } catch (e) { /* never block play */ }
}

/* ------------------------------------------------------------- rendering */

function renderChapterCard(then) {
  clearToast();
  const ch = currentChapter(game);
  $('chapterNum').textContent = `Chapter ${game.chapter + 1} of 6`;
  const sc = ch.scenes ? ch.scenes.length : 0;
  const mins = Math.max(3, Math.round(sc * 1.3));
  const seasonLine = seasonStats(game, game.chapter + 1);
  if ($('chapterSeason') && seasonLine.apps) {
    $('chapterSeason').textContent = `${seasonLine.apps} games · ${seasonLine.goals} goals · ${seasonLine.assists} assists · ${seasonLine.avgRating.toFixed(1)} average`;
  }
  if ($('chapterScope')) {
    $('chapterScope').textContent = `${sc} scenes · about ${mins} minutes${game.chapter === 0 ? ' · the finished chapter' : ''}`;
  }
  $('chapterTitle').textContent = ch.title;
  $('chapterBeat').textContent = chapterOpening(game);
  $('chapterAges').textContent = `ages ${ch.ageStart}–${ch.ageEnd}`;
  const city = publicStory(game);
  $('chapterCity').textContent = `The city says: ${city.line}`;
  play('stingChapter');
  paintBar();      // the chapter dot advances with the chapter, not with the first scene
  show('chapter');
  measureBar();
  paintBackdrop(game.chapter, 'story', 'tunnel');
  show('chapter');
  renderedChapter = game.chapter;
  cardShowing = true;

  const proceed = (ev) => {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    $('chapter').removeEventListener('click', proceed);
    document.removeEventListener('keydown', onKey);
    cardShowing = false;
    renderScene();
  };
  const onKey = (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); proceed(); }
  };
  setTimeout(() => {
    $('chapter').addEventListener('click', proceed);
    document.addEventListener('keydown', onKey);
  }, 250);
}

/* ----------------------------------------------------- skills and profile */

function attrRows(game, { interactive }) {
  return FOOTBALL.map((a) => {
    const v = game.skills[a.key] ?? 0;
    const capped = interactive ? SKILL_MAX : START_MAX;
    const pips = Array.from({ length: capped }, (_, i) => `<i class="${i < v ? 'on' : ''}"></i>`).join('');
    const mod = v - 5;
    const startVal = game.skillsStart ? game.skillsStart[a.key] : null;
    const grown = startVal !== null && v > startVal ? ` <em class="grown">+${v - startVal}</em>` : '';
    const plus = interactive
      ? `<button class="plus" data-key="${a.key}" ${game.skillPoints > 0 && v < SKILL_MAX ? '' : 'disabled'}>+</button>`
      : '';
    return `<li><span class="aname">${a.label}</span><span class="pips">${pips}</span>
      <span class="mod">${mod >= 0 ? '+' : '−'}${Math.abs(mod)}${grown}</span>${plus}</li>`;
  }).join('');
}

function axisRows(game) {
  return personality(game).map((ax) => {
    const pos = Math.round(((ax.value + 100) / 200) * 100);
    const mod = personalityModifier(game, ax.key);
    return `<li class="axis">
      <span class="axleft">${ax.left}</span>
      <span class="track"><i style="left:${pos}%"></i></span>
      <span class="axright">${ax.right}</span>
      <b class="axlabel">${ax.label}</b>
      <span class="axmod">${mod >= 0 ? '+' : '−'}${Math.abs(mod)}</span>
    </li>`;
  }).join('');
}

function renderTraining(pointsAwarded, then) {
  clearToast();   // the memory beat belongs to the scene, not to this screen
  const finishedChapter = CHAPTERS[game.chapter - 1] || currentChapter(game) || {};
  const nextChapter = currentChapter(game);
  const span = nextChapter ? ` The next one starts at ${nextChapter.ageStart}.` : '';
  $('trainKicker').textContent = `${pointsAwarded > 0 ? pointsAwarded : 0} point${pointsAwarded === 1 ? '' : 's'} earned`;
  $('trainTitle').textContent = 'The training ground';
  $('trainLede').textContent = `${finishedChapter.title} is over — the weeks nobody films, the ones that decide what he actually is.${span}`;

  function repaint() {
    $('attrList').innerHTML = attrRows(game, { interactive: true });
    $('axisList').innerHTML = axisRows(game);
    paintPoints();
    for (const btn of $('attrList').querySelectorAll('.plus')) {
      btn.addEventListener('click', () => {
        if (spendPoint(game, btn.dataset.key) === null) return;
        play('mark');
        save();
        repaint();
      });
    }
    const undo = $('trainUndo');
    if (undo) undo.disabled = !(game.skillHistory && game.skillHistory.length);
  }

  repaint();
  paintBar();
  $('trainUndo').onclick = () => {
    const key = refundPoint(game);
    if (!key) return;
    play('page');
    save();
    repaint();
  };
  $('trainDone').onclick = () => { save(); then(); };
  // the training screens happen in the building, before anyone goes home
  setSceneAudio('dressing');
  show('training');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function paintPoints() {
  const n = game.skillPoints || 0;
  $('trainPoints').textContent = n > 0
    ? `${n} point${n === 1 ? '' : 's'} left to spend — click + beside an attribute`
    : 'Every point spent. This is what he is now.';
}

let allocation = suggestedAllocation(null);

const isTouch = () => window.matchMedia('(hover: none), (pointer: coarse)').matches;

const AXIS_LABEL = { ego: 'Confidence', loyalty: 'Loyalty', openness: 'Openness', conscience: 'Conscience' };

function statLabel(option) {
  if (option.kind === 'story') return AXIS_LABEL[option.attribute] || option.attribute;
  const f = FOOTBALL.find((x) => x.key === option.attribute);
  return f ? f.label : option.attribute;
}

function renderAllocation() {
  const left = pointsLeft(allocation);
  $('allocLeft').textContent = left;
  $('allocList').innerHTML = FOOTBALL.map((f) => `
    <li>
      <span class="aname">${f.label}</span>
      <span class="pips">${Array.from({ length: START_MAX }, (_, i) => `<i class="${i < allocation[f.key] ? 'on' : ''}"></i>`).join('')}</span>
      <span class="aval">${allocation[f.key]}</span>
      <span class="stepper">
        <button class="minus" data-key="${f.key}" ${canLower(allocation, f.key) ? '' : 'disabled'}>−</button>
        <button class="plus" data-key="${f.key}" ${canRaise(allocation, f.key) ? '' : 'disabled'}>+</button>
      </span>
    </li>`).join('');

  for (const b of $('allocList').querySelectorAll('button')) {
    b.addEventListener('click', () => {
      const key = b.dataset.key;
      if (b.classList.contains('plus') && canRaise(allocation, key)) allocation[key] += 1;
      if (b.classList.contains('minus') && canLower(allocation, key)) allocation[key] -= 1;
      play('page');
      renderAllocation();
    });
  }
  $('begin').disabled = left !== 0;
}

/** One person: who they are, and every decision they were in the room for. */
function openPerson(key) {
  const person = personRecord(game, key);
  if (!person) return;
  play('page');

  $('personName').textContent = person.name;
  $('personMeta').textContent = [
    person.role,
    person.met ? `met at ${person.met.age}` : null,
    person.count ? `${person.count} thing${person.count === 1 ? '' : 's'} remembered` : 'nothing on record yet',
  ].filter(Boolean).join(' · ');
  $('personAbout').textContent = person.about;

  $('personMemories').innerHTML = person.count
    ? person.memories.map((m) => `<li><span class="age">${m.age}</span><span class="what">${escapeHtml(m.note)}${
        m.attempt ? '<i class="attempt">he tried</i>' : ''
      }</span></li>`).join('')
    : '<li><span class="age">—</span><span class="what">They have been in the room, but nothing has been decided in front of them yet.</span></li>';

  $('listView').hidden = true;
  $('personView').hidden = false;
  $('personView').scrollIntoView({ block: 'start' });
}

function showPeopleList() {
  $('personView').hidden = true;
  $('listView').hidden = false;
  play('page');
}

function renderProfile() {
  if (!game) return;
  $('profileName').textContent = game.name;
  const next = CHAPTERS[game.chapter];
  const pts = game.skillPoints || 0;
  $('profileSkills').textContent =
    `Age ${game.age} · Chapter ${game.chapter + 1} of ${CHAPTERS.length}`
    + (pts > 0 ? ` · ${pts} point${pts === 1 ? '' : 's'} to spend` : '')
    + (next ? ` · next: ${next.title}` : '');
  $('profileSkills').dataset.unspent = pts > 0 ? 'yes' : 'no';
  // the record: what he has actually done, season by season
  const career = careerStats(game);
  const season = seasonStats(game);
  const form = formWord(game);
  const mod = formModifier(game);
  const modText = mod === 0 ? 'no form to speak of' : `${mod > 0 ? '+' : ''}${mod} on match days`;
  $('profileRecord').innerHTML = career.apps
    ? `<div class="recordline big">
         <span><b>${career.apps}</b><em>apps</em></span>
         <span><b>${career.goals}</b><em>goals</em></span>
         <span><b>${career.assists}</b><em>assists</em></span>
         <span><b>${career.avgRating.toFixed(1)}</b><em>rating</em></span>
       </div>
       <div class="recordline">
         <span>${career.wins}W ${career.draws}D ${career.losses}L</span>
         <span>this season ${season.apps} apps, ${season.goals} goals, ${season.assists} assists</span>
       </div>
       <div class="recordline form ${mod > 0 ? 'hot' : mod < 0 ? 'cold' : ''}"><span>${escapeHtml(form)} · ${escapeHtml(modText)}</span></div>`
    : '<div class="recordline empty">No matches yet. The record starts on the pitch.</div>';
  $('profileAttrs').innerHTML = attrRows(game, { interactive: false });
  $('profileAxes').innerHTML = axisRows(game);
  // People grows as he meets them, and each row opens what they remember.
  const known = knownPeople(game);
  $('profilePeople').innerHTML = known.length
    ? known.map((p) => {
        const isNew = p.met && p.met.chapter === game.chapter + 1;
        const count = p.count ? `${p.count} memor${p.count === 1 ? 'y' : 'ies'}` : 'nothing yet';
        return `<li><button class="person" data-person="${p.key}">
          <b>${escapeHtml(p.name)}${isNew ? '<i class="newtag">new</i>' : ''}</b>
          <em>${escapeHtml(p.role || '')} · met at ${p.met ? p.met.age : '—'} · ${count}</em>
          <span>${escapeHtml(p.about || '')}</span>
        </button></li>`;
      }).join('')
    : '<li class="empty"><span>Nobody yet. He has not spoken to anyone worth remembering.</span></li>';

  for (const btn of $('profilePeople').querySelectorAll('.person')) {
    btn.addEventListener('click', () => openPerson(btn.dataset.person));
  }

  const tab = document.querySelector('.modaltab[data-tab="people"]');
  if (tab) tab.textContent = `People ${known.length}`;
  $('profile').classList.remove('hidden');
  applyMusic('profile');
}

function renderScene() {
  // the menu's music has had the chapter card to itself; now the place takes over
  if (musicWant) applyMusic(null);
  resolving = false;
  pending = null;
  if (isFinished(game)) return renderEnd();
  const scene = currentScene(game);

  if (!scene) {
    const { finished, pointsAwarded } = advanceChapter(game);
    save();
    if (finished) return renderEnd();
    if (pointsAwarded > 0) return renderTraining(pointsAwarded, renderChapterCard);
    return renderChapterCard();
  }

  const freshPeople = enterScene(game, scene);
  save();
  paintBackdrop(game.chapter, scene.kind || 'story', scene.backdrop || null);
  const text = typeof scene.text === 'function' ? scene.text(game) : scene.text;
  $('scene').classList.remove('scenein');
  void $('scene').offsetWidth;
  $('scene').classList.add('scenein');
  openScene(text, scene);
  renderOptions(scene);

  show('scene');
  paintBar();
  measureBar();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // somebody new walked into the room
  if (freshPeople.length) {
    const people = freshPeople.map((k) => personRecord(game, k)).filter(Boolean);
    if (people.length) {
      const line = people.length === 1
        ? `${people[0].name} — ${people[0].role}`
        : people.map((p) => p.name).join(' and ');
      setTimeout(() => toast(line, { ms: 2800, kind: 'meet' }), 900);
    }
  }
}

/** Draw the conversations still open and the decision itself. */
function renderOptions(scene) {
  const topics = availableTopics(game, scene);
  $('topics').innerHTML = topics.map((t) => `
    <button class="topic" data-topic="${t.id}">
      <span class="tmark">?</span>${escapeHtml(t.label)}
    </button>`).join('');
  $('topics').classList.toggle('empty', topics.length === 0);

  for (const btn of $('topics').querySelectorAll('.topic')) {
    btn.addEventListener('click', () => {
      play('click');
      const res = learnTopic(game, scene, btn.dataset.topic);
      if (!res) return;
      finishTyping();
      play('page');
      if (reader) reader.learned.push(res.text);
      save();
      paintBar();
      paintPage();          // redraw the page with everything he has learned kept in view
      renderOptions(scene);
      const last = $('prose').querySelector('p.learned:last-of-type');
      if (last) last.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  const insight = insightBonus(game, scene);
  $('choices').innerHTML = availableChoices(game, scene).map((o) => `
    <button class="choice" data-index="${o.index}" ${o.available ? '' : 'disabled'}>
      <span><span class="key">${o.index + 1}</span>${escapeHtml(o.label)}</span>
      <span class="cost">${o.available ? optionCost(o, insight) : o.lockedReason}</span>
    </button>`).join('');

  for (const btn of $('choices').querySelectorAll('.choice')) {
    btn.addEventListener('click', () => { play('click'); pick(Number(btn.dataset.index)); });
  }
}

function optionCost(o, insight) {
  if (!o.rolls) return 'no roll';
  const stat = statLabel(o);
  const base = o.modifier - insight;          // o.modifier already includes insight
  const mod = `${base >= 0 ? '+' : '−'}${Math.abs(base)}`;
  const bonus = insight > 0 ? ` · +${insight} insight` : '';
  return `${stat} · DC ${o.dc} ${mod}${bonus}`;
}

let pending = null;   // { snapshot, scene, index } for the roll on screen
let resolving = false; // true from the moment a choice is taken until the next scene
let stopBackdrop = null;

/** Swap the pixel-art backdrop for the chapter (and the kind of scene). */
function unlockAudio() {
  if (!soundWanted || audioLive) return;
  audioLive = true;
  const hint = document.getElementById('soundHint');
  if (hint) { hint.classList.add('gone'); setTimeout(() => hint.remove(), 600); }
  if (!ambientState()) toggleAmbient();
  setSfx(true);
  const sc = game ? currentScene(game) : null;
  setSceneAudio((sc && sc.backdrop) || (game ? 'tunnel' : 'street'));
  if (musicWant) startMusic(musicWant);
}

function paintSoundButton() {
  const on = soundWanted;
  const narrow = isNarrow();
  const label = on ? (narrow ? 'on' : 'sound on') : (narrow ? 'off' : 'sound off');
  $('sound').innerHTML = `<span class="glyph">${on ? '◉' : '◍'}</span><span class="lbl">${label}</span>`;
  $('sound').setAttribute('aria-pressed', String(on));
  $('sound').setAttribute('aria-label', on ? 'Sound on — tap to mute' : 'Sound off — tap to unmute');
  $('sound').classList.toggle('muted', !on);
}

let lastBackdrop = null;

/* The last few errors, kept so a bug report can include them. */
const ERROR_KEY = 'twenty-years-errors';
function noteError(message) {
  try {
    const rows = JSON.parse(localStorage.getItem(ERROR_KEY) || '[]').slice(-2);
    rows.push({ at: new Date().toISOString(), message: String(message).slice(0, 200) });
    localStorage.setItem(ERROR_KEY, JSON.stringify(rows));
  } catch (e) { /* storage full or blocked: never break the game over it */ }
}
window.addEventListener('error', (e) => noteError(e.message));
window.addEventListener('unhandledrejection', (e) => noteError(e.reason && e.reason.message || e.reason));

/** A mailto a person can actually send: what happened, and what build they were on. */
function feedbackHref() {
  const build = (document.querySelector('script[type=module]')?.getAttribute('src') || '').split('?v=')[1] || 'dev';
  let errors = [];
  try { errors = JSON.parse(localStorage.getItem(ERROR_KEY) || '[]'); } catch (e) {}
  const where = game ? `chapter ${game.chapter + 1}, scene ${currentScene(game)?.id || '—'}, age ${game.age}` : 'title screen';
  const body = [
    '',
    '--- tell us what happened above this line ---',
    '',
    `build: ${build}`,
    `where: ${where}`,
    `screen: ${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}x`,
    `device: ${navigator.userAgent}`,
    errors.length ? `recent errors:\n${errors.map((e) => '- ' + e.message).join('\n')}` : 'recent errors: none',
  ].join('\n');
  return `mailto:hello@twentyyears.game?subject=${encodeURIComponent('Twenty Years — beta feedback')}&body=${encodeURIComponent(body)}`;
}

$('feedback').addEventListener('click', (e) => {
  e.preventDefault();
  window.location.href = feedbackHref();
});

// any sound that lands pokes the scene; the bedroom fire is what shows it
onSound((name) => {
  if (!stopBackdrop || typeof stopBackdrop.flare !== 'function') return;
  stopBackdrop.flare(name === 'type' || name === 'typeWord' ? 0.1 : 0.5);
});

/* what the room should be humming, if the sound is on */
let musicWant = null;
function applyMusic(mode) {
  musicWant = mode;
  if (!mode) { stopMusic(); return; }
  if (soundWanted) startMusic(mode);
}
function screenId() {
  const vis = document.querySelector('.screen:not(.hidden)');
  return vis ? vis.id : null;
}

/** Size the pixel canvas to the shape of the screen, so nothing is cropped. */
function sizeBackdropCanvas(canvas) {
  const w = window.innerWidth || 390;
  const h = window.innerHeight || 780;
  const dpr = window.devicePixelRatio || 1;
  // back the canvas at the screen's real pixel count, in whole multiples of the
  // 320-wide art. At 320 the browser was upscaling ~3.6x on a phone and the
  // result was soft; at 960 every art pixel lands on whole device pixels.
  const base = 320;
  // art-space height for this exact viewport shape, then a whole-number scale
  const artH = Math.max(140, Math.min(860, Math.round(base * (h / w))));
  let scale = Math.max(1, Math.min(3, Math.round((w * dpr) / base)));
  // keep the backing store under ~1.6MP: a phone at 3x is 960x2080, which is a
  // lot of pixels to repaint sixty times a second for a background
  while (scale > 1 && artH * scale * base * scale > 1_600_000) scale -= 1;
  const CW = base * scale;
  const CH = artH * scale;
  if (canvas.width !== CW || canvas.height !== CH) {
    canvas.width = CW;
    canvas.height = CH;
  }
}

function paintBackdrop(chapter, kind = 'story', sceneName = null) {
  // every place sounds like itself: a kitchen has a kettle, a training ground
  // has studs and a struck ball, a garden has birds
  setSceneAudio(sceneName || (kind === 'match' ? 'firstteam' : 'tunnel'));
  const canvas = $('backdrop');
  if (!canvas) return;
  if (stopBackdrop) stopBackdrop();
  sizeBackdropCanvas(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  lastBackdrop = { chapter, kind, sceneName };
  // phones get the motion too; a 320-wide canvas costs almost nothing
  stopBackdrop = drawBackdrop(ctx, { chapter, kind, animate: !reduce, scene: sceneName, audio: audioLevel });
}

// leaving the tab should silence the room, and coming back should restore it
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopSceneAudio();
    stopMusic();
    return;
  }
  if (!soundWanted || !audioLive) return;
  if (lastBackdrop) setSceneAudio(lastBackdrop.sceneName || (lastBackdrop.kind === 'match' ? 'firstteam' : 'tunnel'));
  if (musicWant) startMusic(musicWant);
});

// turning the phone, or resizing a window, recomposes rather than stretching
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!lastBackdrop) return;
    paintBackdrop(lastBackdrop.chapter, lastBackdrop.kind, lastBackdrop.sceneName);
  }, 220);
});

function pick(index) {
  if (!game || cardShowing || resolving) return;   // one decision per scene, however fast you tap
  if ($('choices').classList.contains('ahead')) { nextPage(); return; }
  finishTyping();

  const scene = currentScene(game);
  if (!scene) return;
  const choice = availableChoices(game, scene)[index];
  if (!choice || !choice.available) return;

  pending = { snapshot: snapshot(game), scene, index };
  resolving = true;
  resolve({ advantage: false });
}

/** Apply the chosen option and draw the roll. */
function resolve({ advantage, rerolled = false }) {
  const { scene, index } = pending;
  const entry = choose(game, scene, index, { advantage });
  save();
  paintBar();
  drawOutcome(entry, { rerolled });
}

function drawOutcome(entry, { rerolled }) {
  // a reroll replaces the previous attempt rather than stacking on it
  for (const el of $('prose').querySelectorAll('.rollcard, .said')) el.remove();
  const c = entry.check;

  // A choice that does not roll simply happens: prose, no dice, no reroll.
  if (c.noRoll || c.natural === null) {
    $('prose').insertAdjacentHTML('beforeend', `<p class="said">${escapeHtml(entry.note)}</p>`);
    play('page');
    $('choices').innerHTML = '<button class="choice" id="nextScene"><span>Continue</span><span class="cost">→</span></button>';
    $('choices').classList.remove('ahead');
    $('nextScene').addEventListener('click', () => { pending = null; renderScene(); });
    $('nextScene').focus();
    $('hint').textContent = 'Press Enter to continue';
    return;
  }

  const cls = c.crit ? 'crit' : c.fumble ? 'fumble' : entry.success ? 'good' : 'bad';
  const sign = c.mod >= 0 ? '+' : '−';
  const dice = c.rolls && c.rolls.length > 1 ? `(${c.rolls.join('/')})` : '';

  play('page');
  $('prose').insertAdjacentHTML('beforeend', `
    <div class="rollcard ${cls} rolling">
      <span class="die" id="dieFace">20</span>
      <span class="maths">${dice ? `${dice} ` : ''}${sign}${Math.abs(c.mod)} = <b class="total">?</b> vs ${c.dc}</span>
      <span class="verdict">rolling…</span>
    </div>
    <p class="said${entry.success ? '' : ' failed'}">${escapeHtml(entry.note)}</p>`);

  const card = $('prose').querySelector('.rollcard');
  const face = $('dieFace');
  const verdict = card.querySelector('.verdict');
  const said = $('prose').querySelector('.said');
  said.style.visibility = 'hidden';

  const settle = () => {
    card.classList.remove('rolling');
    face.textContent = c.natural;
    face.classList.add('settle');
    const totalEl = card.querySelector('.total');
    if (totalEl) totalEl.textContent = c.total;
    verdict.textContent = c.crit ? 'critical' : c.fumble ? 'disaster' : entry.success ? 'success' : 'failure';
    verdict.classList.add('in');
    said.style.visibility = 'visible';
    play(entry.success ? 'mark' : 'fail');
    if (c.crit) { play('crowd'); play('roar'); }
    card.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    settle();
  } else {
    // wall-clock, not tick-count: a throttled tab must not make the die spin forever
    const started = performance.now();
    const DURATION = 650;
    let done = false;
    const finish = () => { if (done) return; done = true; settle(); };
    const frame = () => {
      if (done) return;
      const t = performance.now() - started;
      face.textContent = 1 + Math.floor(Math.random() * 20);
      if (t >= DURATION) { finish(); return; }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    setTimeout(finish, DURATION + 120);   // belt and braces if rAF never fires
  }

  const canReroll = !rerolled && !c.noRoll && (game.inspiration ?? 0) > 0;
  $('choices').innerHTML = `
    ${canReroll ? `<button class="choice reroll"><span><span class="key">↺</span>Spend inspiration — roll again, take the better</span><span class="cost">${game.inspiration} left</span></button>` : ''}
    <button class="choice" id="nextScene"><span>Continue</span><span class="cost">→</span></button>`;
  $('choices').classList.remove('ahead');

  const rr = $('choices').querySelector('.reroll');
  if (rr) rr.addEventListener('click', () => {
    restore(game, pending.snapshot);
    if (!spendInspiration(game)) return;
    save();
    paintBar();
    resolve({ advantage: true, rerolled: true });
  });

  $('nextScene').addEventListener('click', () => { pending = null; renderScene(); });
  $('nextScene').focus();
  $('hint').textContent = canReroll
    ? `${game.inspiration} inspiration left · roll again, or press Enter to accept it`
    : 'Press Enter to continue';

  // a small notification, attributed to whoever was in the room
  if (entry.witness) {
    setTimeout(() => toast(entry.witness.line, { ms: 2600 }), 900);
  }
}

function renderEnd() {
  game.finished = true;
  save();
  setSceneAudio('garden');   // wherever he ends up, it is quiet there
  show('end');
  paintBar();
  applyMusic('profile');
  $('endName').textContent = game.name;
  $('bio').innerHTML = paragraphs(biography(game));

  const mem = memories(game);
  $('memoryList').innerHTML = mem.length
    ? mem.map((m) => `<li><span class="age">${m.age}</span><span class="what">${escapeHtml(m.note)}${
        m.witnessName ? `<em class="by">${escapeHtml(m.witnessName.replace(' will remember that', ''))}</em>` : ''
      }</span></li>`).join('')
    : '<li><span class="age">—</span><span class="what">Nothing carried. He decided everything alone.</span></li>';

  const people = knownPeople(game).filter((p) => p.count > 0).sort((a, b) => b.count - a.count);
  $('endPeople').innerHTML = people.length
    ? people.map((p) => `<li><b>${escapeHtml(p.name)}</b><em>${escapeHtml(p.role || '')} · ${p.count} remembered</em>
        <span>${escapeHtml(p.memories[p.memories.length - 1].note)}</span></li>`).join('')
    : '<li class="empty"><span>Nobody was keeping count.</span></li>';

  const city = publicStory(game);
  $('endCity').textContent = `The city says: ${city.line} · they sing "${chantFor(game)}"`;
  $('epi').innerHTML = paragraphs(epilogue(game));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------------------------------------------------------------- start */

function beginNew() {
  const campaignId = $('campaign').value || undefined;
  const first = $('firstName').value.trim() || undefined;
  const last = $('lastName').value.trim() || undefined;

  game = newGame({ campaign: campaignId, firstName: first, lastName: last, allocation: normaliseAllocation(allocation) });
  renderedChapter = -1;
  save();
  paintBar();

  const chapterDef = getCampaign(campaignId || '');
  if (campaignId && !chapterDef) {
    toast('Unknown story — starting a random career');
  }
  renderChapterCard();
}

function resumeSaved() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    game = fromJSON(raw);
    paintBar();
    if (isFinished(game)) return renderEnd();
    renderChapterCard();
  } catch (e) {
    // a save we cannot read is a save we should not keep offering
    try { localStorage.removeItem(SAVE_KEY); } catch (err) {}
    $('continue').classList.add('hidden');
    toast('That save could not be read — starting fresh');
  }
}

function initCampaignSelect() {
  const sel = $('campaign');
  const campaigns = listCampaigns();
  sel.innerHTML = '<option value="">A career drawn at random</option>'
    + campaigns.map((c) => `<option value="${c.id}">${c.title} — ${c.nation}</option>`).join('');

  sel.addEventListener('change', () => {
    const c = campaigns.find((x) => x.id === sel.value);
    const def = c ? getCampaign(c.id) : null;
    $('firstName').placeholder = def ? def.defaultFirst : 'Jintao';
    $('lastName').placeholder = def ? def.defaultLast : 'Lu';
  });
  $('firstName').placeholder = 'Jintao';
  $('lastName').placeholder = 'Lu';

  // default to the Hong Kong–Derby story, since it is the authored one
  if (campaigns.some((c) => c.id === 'hkderby')) {
    sel.value = 'hkderby';
    sel.dispatchEvent(new Event('change'));
  }
}

/* ------------------------------------------------------------------ wire */

$('allocToggle').addEventListener('click', () => {
  const on = $('alloc').classList.toggle('open');
  $('allocToggle').textContent = on ? 'Hide attributes' : 'Adjust attributes';
});

$('allocSuggest').addEventListener('click', () => {
  const campaignDef = getCampaign($('campaign').value || '');
  allocation = suggestedAllocation(campaignDef ? campaignDef.origin : null);
  renderAllocation();
});
$('campaign').addEventListener('change', () => {
  const campaignDef = getCampaign($('campaign').value || '');
  allocation = suggestedAllocation(campaignDef ? campaignDef.origin : null);
  renderAllocation();
});

for (const tab of document.querySelectorAll('.modaltab')) {
  tab.addEventListener('click', () => {
    for (const t of document.querySelectorAll('.modaltab')) t.classList.toggle('on', t === tab);
    const which = tab.dataset.tab;
    $('tabStats').hidden = which !== 'stats';
    $('tabPeople').hidden = which !== 'people';
    play('page');
  });
}

$('profileBtn').addEventListener('click', renderProfile);
$('personBack').addEventListener('click', showPeopleList);
function closeProfile() {
  $('profile').classList.add('hidden');
  showPeopleList();
  applyMusic(screenId() === 'start' ? 'menu' : null);
}

$('profileClose').addEventListener('click', closeProfile);
$('profile').addEventListener('click', (e) => {
  if (e.target === $('profile')) closeProfile();
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('profile').classList.contains('hidden') && !$('personView').hidden) return showPeopleList();
  if (!$('profile').classList.contains('hidden')) closeProfile();
});

// one handler only: #prose sits inside #stage, so having both meant a single tap
// advanced two paragraphs and paragraphs were being skipped
$('stage').addEventListener('click', (e) => {
  if (e.target.closest('.choice, button, .card, .topic, .person, input, select, #chapter')) return;
  if (!game || cardShowing || isFinished(game)) return;
  if ($('scene').classList.contains('hidden')) return;
  nextPage();
});

// starting a new career would overwrite a saved one without a word, so the
// first tap asks and the second one agrees
let beginArmed = false;
let armTimer = null;
$('begin').addEventListener('click', () => {
  if (localStorage.getItem(SAVE_KEY) && !beginArmed) {
    beginArmed = true;
    $('begin').textContent = 'Tap again — this replaces your saved career';
    $('begin').classList.add('confirming');
    clearTimeout(armTimer);
    armTimer = setTimeout(() => {
      beginArmed = false;
      $('begin').textContent = 'Begin';
      $('begin').classList.remove('confirming');
    }, 5000);
    return;
  }
  beginArmed = false;
  clearTimeout(armTimer);
  $('begin').classList.remove('confirming');
  $('begin').textContent = 'Begin';
  beginNew();   // the menu bed carries on through the chapter card
});
$('again').addEventListener('click', () => {
  applyMusic('menu');
  localStorage.removeItem(SAVE_KEY);
  game = null;
  paintBackdrop(0, 'title');
show('start');
applyMusic('menu');
  $('continue').classList.toggle('hidden', true);
});

$('continue').addEventListener('click', () => { resumeSaved(); });

$('sound').addEventListener('click', (e) => {
  e.stopPropagation();
  soundWanted = !soundWanted;
  localStorage.setItem(SOUND_KEY, soundWanted ? 'on' : 'off');
  paintSoundButton();

  if (soundWanted) {
    audioLive = false;          // let the next line re-arm cleanly
    unlockAudio();
    play('mark');
  } else {
    if (ambientState()) toggleAmbient();
    stopSceneAudio();
    stopMusic();
    setSfx(false);
    audioLive = false;
  }
});

// ?audio=audit renders every cue offline and prints the table, so checking that
// the sound still works is one URL away instead of a bespoke script
if (location.search.includes('audio=audit')) {
  import('./sfx.js?v=20261119a').then((m) => m.auditCues()).then((rows) => {
    window.__audit = rows;
    const bad = rows.filter((r) => r.silent || r.threw || r.peak > 1);
    console.table(rows.map((r) => ({ cue: r.name, peak: r.peak, rms: r.rms, audibleFor: r.audibleFor })));
    console.log(bad.length ? `AUDIT FAIL: ${bad.length} cue(s)` : `AUDIT OK: ${rows.length} cues, none silent, none clipping`);
  });
}

// any first interaction arms audio, because the default is "on"
// 'click' too: assistive tech and scripted activation never send pointerdown
for (const ev of ['pointerdown', 'click', 'keydown', 'touchstart']) {
  document.addEventListener(ev, unlockAudio, { passive: true });
}

// phones suspend audio when the tab is hidden or a call comes in
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !soundWanted) return;
  audioLive = false;
  unlockAudio();
});

document.addEventListener('keydown', (e) => {
  if (!game || cardShowing || isFinished(game)) return;
  if ($('scene').classList.contains('hidden')) return;
  const t = e.target;
  if (t instanceof Element && t.closest('input, select, textarea, button, .modal')) return;

  if ([' ', 'Enter', 'ArrowRight', 'ArrowDown'].includes(e.key)) {
    if ($('nextScene')) { e.preventDefault(); renderScene(); return; }
    if (reader && (reader.typing || reader.i < reader.pages.length - 1)) {
      e.preventDefault(); nextPage(); return;
    }
  }
  const n = Number(e.key);
  if (n >= 1 && n <= 9) {
    const btn = $('choices').querySelector(`.choice[data-index="${n - 1}"]`);
    if (btn && !btn.disabled) { e.preventDefault(); btn.click(); }
  }
});

window.addEventListener('resize', measureBar);
window.addEventListener('orientationchange', () => {
  setTimeout(measureBar, 120);
  setTimeout(() => { if (lastBackdrop) paintBackdrop(lastBackdrop.chapter, lastBackdrop.kind, lastBackdrop.sceneName); }, 260);
});
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    if (lastBackdrop) setTimeout(() => paintBackdrop(lastBackdrop.chapter, lastBackdrop.kind, lastBackdrop.sceneName), 240);
  });
}

paintSoundButton();
initCampaignSelect();
renderAllocation();
try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    const s2 = JSON.parse(raw);
    const g2 = s2.game || s2;
    $('continue').classList.remove('hidden');
    if (g2 && g2.name) {
      $('continue').textContent = `Continue — ${g2.name}, chapter ${(g2.chapter || 0) + 1}, age ${g2.age || 16}`;
    }
  }
} catch (e) {
  localStorage.removeItem(SAVE_KEY);   // a save we cannot read is not a save
}
paintBackdrop(0, 'title');
show('start');
applyMusic('menu');
