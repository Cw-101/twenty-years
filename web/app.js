/**
 * The browser player. Thin: it renders what the engine says and stores a save.
 * All story logic lives in ../src, shared with the CLI and the tests.
 */
import {
  newGame, currentScene, currentChapter, availableChoices, choose,
  advanceChapter, isFinished, biography, epilogue, memories,
} from '../src/game.js';
import { listCampaigns, getCampaign } from '../src/campaigns.js';
import { chapterOpening } from '../src/beats.js';
import { publicStory, chantFor } from '../src/world.js';
import { toggleAmbient } from './audio.js';
import { play, setEnabled as setSfx, cueForScene } from './sfx.js';
import { toJSON, fromJSON } from '../src/save-core.js';

const SAVE_KEY = 'twenty-years-save-v1';
const $ = (id) => document.getElementById(id);

let game = null;
let cardShowing = false;
let renderedChapter = -1;

/* ---------------------------------------------------------------- helpers */

function show(which) {
  for (const s of ['start', 'chapter', 'scene', 'end']) {
    $(s).classList.toggle('hidden', s !== which);
  }
  $('bar').classList.toggle('hidden', which === 'start' || which === 'end');
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
  reader.timer = setInterval(() => {
    i = Math.min(text.length, i + 3);
    el.textContent = text.slice(0, i);
    if (i >= text.length) {
      clearInterval(reader.timer);
      reader.typing = false;
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
  reader = { pages: splitPages(text), i: 0, typing: false, timer: null, el: null, full: '' };
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
  $('prose').classList.remove('pagein');
  void $('prose').offsetWidth;
  $('prose').classList.add('pagein');
  typeInto(el, page);

  const total = reader.pages.length;
  const last = reader.i >= total - 1;
  $('pageNum').textContent = total > 1 ? `${reader.i + 1} / ${total}` : '';
  $('choices').classList.toggle('ahead', !last);
  $('hint').textContent = last
    ? (game.whispers > 0
        ? `${game.whispers} instinct${game.whispers === 1 ? '' : 's'} left · press 1–${$('choices').querySelectorAll('.choice').length}`
        : 'Nothing left in him this chapter. Only silence, until the next one.')
    : 'Click, space or → to read on';
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

function toast(message, { big = false, ms = 2400 } = {}) {
  const t = $('toast');
  t.textContent = message;
  t.classList.toggle('big', big);
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), ms);
}

function paintBar() {
  if (!game) return;
  $('barName').textContent = game.name;
  $('barMeta').textContent = `age ${game.age} · ${game.campaignTitle || 'a career'}`;
  const total = 3;
  const dots = $('chapterDots');
  if (dots) {
    dots.innerHTML = Array.from({ length: 6 }, (_, i) => {
      const cls = i < game.chapter ? 'done' : i === game.chapter ? 'now' : '';
      return `<span class="dot ${cls}"></span>`;
    }).join('');
  }

  const left = game.whispers;
  $('whispers').innerHTML = Array.from({ length: total }, (_, i) =>
    `<i class="${i < left ? '' : 'spent'}">◆</i>`).join('');
}

function save() {
  try { localStorage.setItem(SAVE_KEY, toJSON(game)); } catch (e) { /* never block play */ }
}

/* ------------------------------------------------------------- rendering */

function renderChapterCard(then) {
  const ch = currentChapter(game);
  $('chapterNum').textContent = `Chapter ${game.chapter + 1} of 6`;
  $('chapterTitle').textContent = ch.title;
  $('chapterBeat').textContent = chapterOpening(game);
  $('chapterAges').textContent = `ages ${ch.ageStart}–${ch.ageEnd}`;
  const city = publicStory(game);
  $('chapterCity').textContent = `The city says: ${city.line}`;
  show('chapter');
  renderedChapter = game.chapter;
  cardShowing = true;

  const proceed = () => {
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

function renderScene() {
  if (isFinished(game)) return renderEnd();
  const scene = currentScene(game);

  if (!scene) {
    const { finished } = advanceChapter(game);
    save();
    if (finished) return renderEnd();
    return renderChapterCard();
  }

  const text = typeof scene.text === 'function' ? scene.text(game) : scene.text;
  openScene(text, scene);

  const opts = availableChoices(game, scene);
  $('choices').innerHTML = opts.map((o) => `
    <button class="choice" data-index="${o.index}" ${o.available ? '' : 'disabled'}>
      <span><span class="key">${o.index + 1}</span>${escapeHtml(o.label)}</span>
      <span class="cost">${o.whisper ? (o.available ? 'instinct' : 'spent') : 'silence'}</span>
    </button>`).join('');

  for (const btn of $('choices').querySelectorAll('.choice')) {
    btn.addEventListener('click', () => pick(Number(btn.dataset.index)));
  }

  show('scene');
  paintBar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function pick(index) {
  if (!game || cardShowing) return;
  if ($('choices').classList.contains('ahead')) { nextPage(); return; }
  finishTyping();
  const scene = currentScene(game);
  if (!scene) return;
  const choice = availableChoices(game, scene)[index];
  if (!choice || !choice.available) return;

  const entry = choose(game, scene, index);
  save();
  paintBar();


  if (entry.failed) {
    play('fail');
    toast('nothing changed');
  } else if (entry.remembered && entry.remembered.length) {
    play('mark');
    toast('he will remember that', { big: true, ms: 3200 });
  }

  // show what he did before moving on
  const note = `<p class="said${entry.failed ? ' failed' : ''}">${escapeHtml(entry.note)}</p>`;
  $('prose').insertAdjacentHTML('beforeend', note);
  $('choices').innerHTML = '<button class="choice" id="nextScene"><span>Continue</span><span class="cost">→</span></button>';
  $('nextScene').addEventListener('click', () => { renderScene(); });
  $('nextScene').focus();
  $('hint').textContent = 'Press Enter to continue';
}

function renderEnd() {
  game.finished = true;
  save();
  show('end');
  $('endName').textContent = game.name;
  $('bio').innerHTML = paragraphs(biography(game));

  const mem = memories(game);
  $('memoryList').innerHTML = mem.length
    ? mem.map((m) => `<li><span class="age">${m.age}</span><span class="what">${escapeHtml(m.note)}</span></li>`).join('')
    : '<li><span class="age">—</span><span class="what">Nothing carried. He decided everything alone.</span></li>';

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

  game = newGame({ campaign: campaignId, firstName: first, lastName: last });
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
    toast('That save could not be read');
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

$('prose').addEventListener('click', () => nextPage());
$('stage').addEventListener('click', (e) => {
  if (e.target.closest('.choice') || e.target.closest('button') || e.target.closest('.card')) return;
  if (!game || cardShowing || isFinished(game)) return;
  if ($('scene').classList.contains('hidden')) return;
  nextPage();
});

$('begin').addEventListener('click', beginNew);
$('again').addEventListener('click', () => {
  localStorage.removeItem(SAVE_KEY);
  game = null;
  show('start');
  $('continue').classList.toggle('hidden', true);
});

$('continue').addEventListener('click', resumeSaved);

$('sound').addEventListener('click', () => {
  const on = toggleAmbient();
  setSfx(on);
  if (on) play('mark');
  $('sound').textContent = on ? '◉ sound on' : '◍ sound off';
  $('sound').setAttribute('aria-pressed', String(on));
});

document.addEventListener('keydown', (e) => {
  if (!game || cardShowing || isFinished(game)) return;
  if ($('scene').classList.contains('hidden')) return;
  if (e.target.matches('input, select, textarea')) return;

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

initCampaignSelect();
if (localStorage.getItem(SAVE_KEY)) $('continue').classList.remove('hidden');
show('start');
