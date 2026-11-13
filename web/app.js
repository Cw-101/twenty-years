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

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function toast(message) {
  const t = $('toast');
  t.textContent = message;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

function paintBar() {
  if (!game) return;
  $('barName').textContent = game.name;
  $('barMeta').textContent = `age ${game.age} · ${game.campaignTitle || 'a career'}`;
  const total = 3;
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
  $('prose').innerHTML = paragraphs(text);

  const opts = availableChoices(game, scene);
  $('choices').innerHTML = opts.map((o) => `
    <button class="choice" data-index="${o.index}" ${o.available ? '' : 'disabled'}>
      <span><span class="key">${o.index + 1}</span>${escapeHtml(o.label)}</span>
      <span class="cost">${o.whisper ? (o.available ? 'whisper' : 'none left') : 'silence'}</span>
    </button>`).join('');

  for (const btn of $('choices').querySelectorAll('.choice')) {
    btn.addEventListener('click', () => pick(Number(btn.dataset.index)));
  }

  $('hint').textContent = game.whispers > 0
    ? `${game.whispers} whisper${game.whispers === 1 ? '' : 's'} left this chapter · press 1–${opts.length}`
    : 'No whispers left. Only silence, until the next chapter.';

  show('scene');
  paintBar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function pick(index) {
  if (!game || cardShowing) return;
  const scene = currentScene(game);
  if (!scene) return;
  const choice = availableChoices(game, scene)[index];
  if (!choice || !choice.available) return;

  const entry = choose(game, scene, index);
  save();
  paintBar();

  if (entry.remembered && entry.remembered.length) toast('he will remember that');

  // show what he did before moving on
  const note = `<p class="said">${escapeHtml(entry.note)}</p>`;
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
    ? mem.map((m) => `<li><b>AGE ${m.age}</b>${escapeHtml(m.note)}</li>`).join('')
    : '<li>Nothing carried. He decided everything alone.</li>';

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

$('begin').addEventListener('click', beginNew);
$('again').addEventListener('click', () => {
  localStorage.removeItem(SAVE_KEY);
  game = null;
  show('start');
  $('continue').classList.toggle('hidden', true);
});

$('continue').addEventListener('click', resumeSaved);

document.addEventListener('keydown', (e) => {
  if (!game || cardShowing || isFinished(game)) return;
  if ($('scene').classList.contains('hidden')) return;
  if (e.target.matches('input, select, textarea')) return;

  if (e.key === 'Enter') {
    if ($('nextScene')) { e.preventDefault(); renderScene(); }
    return;
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
