/**
 * The browser player. Thin: it renders what the engine says and stores a save.
 * All story logic lives in ../src, shared with the CLI and the tests.
 */
import {
  newGame, currentScene, currentChapter, availableChoices, choose,
  advanceChapter, isFinished, biography, epilogue, memories,
  availableTopics, learnTopic, insightBonus,
} from '../src/game.js?v=20261113u';
import { listCampaigns, getCampaign } from '../src/campaigns.js?v=20261113u';
import { chapterOpening } from '../src/beats.js?v=20261113u';
import { CHAPTERS } from '../src/story.js?v=20261113u';
import { publicStory, chantFor } from '../src/world.js?v=20261113u';
import { toggleAmbient } from './audio.js?v=20261113u';
import { play, setEnabled as setSfx, cueForScene, setAmbience, ambienceFor } from './sfx.js?v=20261113u';
import { drawBackdrop } from './pixelart.js?v=20261113u';
import { toJSON, fromJSON } from '../src/save-core.js?v=20261113u';
import {
  FOOTBALL, ATTRIBUTES, SKILL_MAX, START_MAX, START_BASE, START_POINTS,
  spendPoint, refundPoint, personality, skillSummary, personalityModifier,
  suggestedAllocation, blankAllocation, pointsLeft, canRaise, canLower, normaliseAllocation,
} from '../src/skills.js?v=20261113u';
import { snapshot, restore, spendInspiration, INSPIRATION_PER_CHAPTER } from '../src/game.js?v=20261113u';

const SAVE_KEY = 'twenty-years-save-v1';
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
  $('prose').classList.remove('pagein');
  void $('prose').offsetWidth;
  $('prose').classList.add('pagein');
  typeInto(el, page);

  // keep whatever he has already found out on screen as the pages advance
  for (const line of (reader.learned || [])) {
    $('prose').insertAdjacentHTML('beforeend', `<p class="learned">${escapeHtml(line)}</p>`);
  }

  const total = reader.pages.length;
  const last = reader.i >= total - 1;
  $('pageNum').textContent = total > 1 ? `${reader.i + 1} / ${total}` : '';
  $('choices').classList.toggle('ahead', !last);
  $('hint').textContent = last
    ? `press 1–${$('choices').querySelectorAll('.choice').length} · ${game.inspiration ?? 0} inspiration left to reroll`
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

function clearToast() {
  const t = $('toast');
  clearTimeout(t._timer);
  t.classList.remove('show', 'big');
  t.textContent = '';
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
}

function save() {
  try { localStorage.setItem(SAVE_KEY, toJSON(game)); } catch (e) { /* never block play */ }
}

/* ------------------------------------------------------------- rendering */

function renderChapterCard(then) {
  clearToast();
  const ch = currentChapter(game);
  $('chapterNum').textContent = `Chapter ${game.chapter + 1} of 6`;
  $('chapterTitle').textContent = ch.title;
  $('chapterBeat').textContent = chapterOpening(game);
  $('chapterAges').textContent = `ages ${ch.ageStart}–${ch.ageEnd}`;
  const city = publicStory(game);
  $('chapterCity').textContent = `The city says: ${city.line}`;
  paintBar();      // the chapter dot advances with the chapter, not with the first scene
  paintBackdrop(game.chapter, 'story');
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

/* ----------------------------------------------------- skills and profile */

function attrRows(game, { interactive }) {
  return FOOTBALL.map((a) => {
    const v = game.skills[a.key] ?? 0;
    const capped = interactive ? SKILL_MAX : START_MAX;
    const pips = Array.from({ length: capped }, (_, i) => `<i class="${i < v ? 'on' : ''}"></i>`).join('');
    const mod = v - 5;
    const plus = interactive
      ? `<button class="plus" data-key="${a.key}" ${game.skillPoints > 0 && v < SKILL_MAX ? '' : 'disabled'}>+</button>`
      : '';
    return `<li><span class="aname">${a.label}</span><span class="pips">${pips}</span>
      <span class="mod">${mod >= 0 ? '+' : '−'}${Math.abs(mod)}</span>${plus}</li>`;
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

function renderProfile() {
  if (!game) return;
  $('profileName').textContent = game.name;
  $('profileSkills').textContent =
    `Age ${game.age} · ${game.skillPoints || 0} point${(game.skillPoints || 0) === 1 ? '' : 's'} unspent · ${skillSummary(game)}`;
  $('profileAttrs').innerHTML = attrRows(game, { interactive: false });
  $('profileAxes').innerHTML = axisRows(game);
  $('profile').classList.remove('hidden');
}

function renderScene() {
  if (isFinished(game)) return renderEnd();
  const scene = currentScene(game);

  if (!scene) {
    const { finished, pointsAwarded } = advanceChapter(game);
    save();
    if (finished) return renderEnd();
    if (pointsAwarded > 0) return renderTraining(pointsAwarded, renderChapterCard);
    return renderChapterCard();
  }

  paintBackdrop(game.chapter, scene.kind || 'story');
  const text = typeof scene.text === 'function' ? scene.text(game) : scene.text;
  openScene(text, scene);
  renderOptions(scene);

  show('scene');
  paintBar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
    btn.addEventListener('click', () => pick(Number(btn.dataset.index)));
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
let stopBackdrop = null;

/** Swap the pixel-art backdrop for the chapter (and the kind of scene). */
function paintBackdrop(chapter, kind = 'story') {
  setAmbience(ambienceFor(chapter, kind));
  const canvas = $('backdrop');
  if (!canvas) return;
  if (stopBackdrop) stopBackdrop();
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  stopBackdrop = drawBackdrop(ctx, { chapter, kind, animate: !reduce });
}

function pick(index) {
  if (!game || cardShowing) return;
  if ($('choices').classList.contains('ahead')) { nextPage(); return; }
  finishTyping();

  const scene = currentScene(game);
  if (!scene) return;
  const choice = availableChoices(game, scene)[index];
  if (!choice || !choice.available) return;

  pending = { snapshot: snapshot(game), scene, index };
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
  const dice = c.rolls && c.rolls.length > 1 ? `d20 ${c.rolls.join('/')}` : 'd20';

  play('page');
  $('prose').insertAdjacentHTML('beforeend', `
    <div class="rollcard ${cls} rolling">
      <span class="die" id="dieFace">20</span>
      <span class="maths">${dice} ${sign}${Math.abs(c.mod)} = <b>${c.total}</b> vs ${c.dc}</span>
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
  show('end');
  $('endName').textContent = game.name;
  $('bio').innerHTML = paragraphs(biography(game));

  const mem = memories(game);
  $('memoryList').innerHTML = mem.length
    ? mem.map((m) => `<li><span class="age">${m.age}</span><span class="what">${escapeHtml(m.note)}${
        m.witnessName ? `<em class="by">${escapeHtml(m.witnessName.replace(' will remember that', ''))}</em>` : ''
      }</span></li>`).join('')
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

$('profileBtn').addEventListener('click', renderProfile);
$('profileClose').addEventListener('click', () => $('profile').classList.add('hidden'));
$('profile').addEventListener('click', (e) => {
  if (e.target === $('profile')) $('profile').classList.add('hidden');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') $('profile').classList.add('hidden');
});

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
  paintBackdrop(0, 'title');
show('start');
  $('continue').classList.toggle('hidden', true);
});

$('continue').addEventListener('click', resumeSaved);

$('sound').addEventListener('click', () => {
  const on = toggleAmbient();
  setSfx(on);
  if (on) {
    play('mark');
    setAmbience(ambienceFor(game ? game.chapter : 0, 'story'));
  } else {
    setAmbience(null);
  }
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
renderAllocation();
if (localStorage.getItem(SAVE_KEY)) $('continue').classList.remove('hidden');
paintBackdrop(0, 'title');
show('start');
