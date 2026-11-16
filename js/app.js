(function(){
'use strict';

/* ========== UTILS ========== */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const now = () => Date.now();
const DAY = 86400000;

function escapeHtml(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}
function shuffle(a){
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function debounce(fn, ms){
  let t; return function(...a){ clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
}
function toast(msg, type){
  const wrap = $('toastWrap');
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  const icons = {success:'fa-check-circle', error:'fa-triangle-exclamation', info:'fa-circle-info'};
  el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${escapeHtml(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastIn .3s reverse forwards';
    setTimeout(() => el.remove(), 300);
  }, 2400);
}

/* ========== SOUND / TTS ========== */
let audioCtx = null;
function sfx(type){
  if (!state.settings.sfx) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g).connect(audioCtx.destination);
    o.type = 'sine';
    if (type === 'correct'){ o.frequency.value = 880; g.gain.value = 0.08; }
    else if (type === 'wrong'){ o.frequency.value = 220; g.gain.value = 0.1; o.type = 'triangle'; }
    else { o.frequency.value = 660; g.gain.value = 0.05; }
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
    o.start();
    o.stop(audioCtx.currentTime + 0.25);
  } catch(e){}
}

let voices = [];
function loadVoices(){
  if (!('speechSynthesis' in window)) return;
  voices = speechSynthesis.getVoices();
}
if ('speechSynthesis' in window){
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}
function speak(text, langHint){
  if (!state.settings.tts || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const isVietnamese = /[àáảãạăâđêôơưÀÁẢÃẠĂÂĐÊÔƠƯ]/i.test(text);
    utt.lang = langHint || (isVietnamese ? 'vi-VN' : 'en-US');
    utt.rate = 0.95;
    const match = voices.find(v => v.lang.startsWith(utt.lang.split('-')[0]));
    if (match) utt.voice = match;
    speechSynthesis.speak(utt);
  } catch(e){}
}

/* ========== STATE ========== */
const LS_KEY = 'flashcardPro_v2';

const defaultState = {
  decks: [
    { id: 'default', name: 'Mặc định', emoji: '📚', cards: [], createdAt: now() }
  ],
  activeDeckId: 'default',
  settings: { dark: false, tts: true, sfx: true },
  stats: {
    totalReviews: 0,
    totalCorrect: 0,
    streak: 0,
    lastStudyDate: null,
    history: {}
  }
};

let state = loadState();

function migrateCard(c){
  if (typeof c.wrongCount !== 'number') c.wrongCount = c.lapses || 0;
  if (typeof c.ease !== 'number') c.ease = 2.5;
  if (typeof c.interval !== 'number') c.interval = 0;
  if (typeof c.reps !== 'number') c.reps = 0;
  if (typeof c.nextReview !== 'number') c.nextReview = 0;
  if (typeof c.starred !== 'boolean') c.starred = false;
  if (typeof c.front !== 'string') c.front = String(c.front || '');
  if (typeof c.back !== 'string') c.back = String(c.back || '');
  // Cap interval cũ về 30 ngày
  if (c.interval > 30) c.interval = 30;
  return c;
}

function loadState(){
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return JSON.parse(JSON.stringify(defaultState));
    const parsed = JSON.parse(raw);
    const s = { ...JSON.parse(JSON.stringify(defaultState)), ...parsed };
    if (!Array.isArray(s.decks) || !s.decks.length){
      s.decks = JSON.parse(JSON.stringify(defaultState.decks));
    }
    s.decks.forEach(d => {
      if (!Array.isArray(d.cards)) d.cards = [];
      d.cards = d.cards.map(migrateCard);
    });
    if (!s.decks.find(d => d.id === s.activeDeckId)){
      s.activeDeckId = s.decks[0].id;
    }
    
    // If state is empty on initial run, pre-seed with sample cards so the app is instantly ready
    if (s.decks.length === 1 && s.decks[0].cards.length === 0) {
      s.decks[0].name = 'IELTS Cốt Lõi';
      s.decks[0].emoji = '🇬🇧';
      s.decks[0].cards = [
        { id: 'c1', front: 'Ubiquitous (adj)', back: 'Phổ biến, có mặt ở khắp mọi nơi cùng lúc', wrongCount: 0, ease: 2.5, interval: 0, reps: 0, nextReview: 0, starred: true },
        { id: 'c2', front: 'Pragmatic (adj)', back: 'Thực tế, coi trọng tính ứng dụng và kết quả hơn lý thuyết', wrongCount: 0, ease: 2.5, interval: 0, reps: 0, nextReview: 0, starred: false },
        { id: 'c3', front: 'Resilient (adj)', back: 'Kiên cường, có khả năng phục hồi nhanh chóng sau biến cố', wrongCount: 0, ease: 2.5, interval: 0, reps: 0, nextReview: 0, starred: false },
        { id: 'c4', front: 'Meticulous (adj)', back: 'Tỉ mỉ, cẩn thận từng li từng tí, chú ý chi tiết', wrongCount: 0, ease: 2.5, interval: 0, reps: 0, nextReview: 0, starred: false },
        { id: 'c5', front: 'Persevere (v)', back: 'Kiên trì, quyết tâm vượt qua khó khăn để đạt mục tiêu', wrongCount: 0, ease: 2.5, interval: 0, reps: 0, nextReview: 0, starred: false }
      ];
    }

    return s;
  } catch(e){
    return JSON.parse(JSON.stringify(defaultState));
  }
}
const saveState = debounce(() => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch(e){}
}, 200);

function getActiveDeck(){
  return state.decks.find(d => d.id === state.activeDeckId) || state.decks[0];
}



/* ========== STATS ========== */
function renderStats(){
  const deck = getActiveDeck();
  const cards = deck.cards;
  const total = cards.length;
  const mastered = cards.filter(c => getCardStatus(c) === 'mastered').length;
  const learning = cards.filter(c => getCardStatus(c) === 'learning').length;
  const newCards = cards.filter(c => getCardStatus(c) === 'new').length;
  const due = cards.filter(isDue).length;
  const accuracy = state.stats.totalReviews
    ? (state.stats.totalCorrect / state.stats.totalReviews) * 100
    : 0;

  const days = [];
  for (let i = 6; i >= 0; i--){
    const d = new Date(Date.now() - i * DAY);
    const key = d.toISOString().slice(0, 10);
    const label = ['CN','T2','T3','T4','T5','T6','T7'][d.getDay()];
    days.push({ key, label, data: state.stats.history[key] || { reviews: 0, correct: 0 } });
  }
  const maxReviews = Math.max(...days.map(d => d.data.reviews), 1);

  $('statsContent').innerHTML = `
    <div class="stats-mini">
      <div class="stat-box"><div class="num">${total}</div><div class="lbl">Tổng thẻ</div></div>
      <div class="stat-box"><div class="num">${due}</div><div class="lbl">Đến hạn</div></div>
      <div class="stat-box"><div class="num">${state.stats.streak || 0}</div><div class="lbl">Streak</div></div>
    </div>

    <h4 style="font-size:.8rem;font-weight:700;color:var(--primary);text-transform:uppercase;margin-bottom:10px">
      📊 Tiến độ học
    </h4>
    <div class="stats-mini" style="margin-bottom:20px">
      <div class="stat-box"><div class="num" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">${newCards}</div><div class="lbl">Mới</div></div>
      <div class="stat-box"><div class="num" style="background:linear-gradient(135deg,#f59e0b,#d97706);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">${learning}</div><div class="lbl">Đang học</div></div>
      <div class="stat-box"><div class="num" style="background:linear-gradient(135deg,#10b981,#059669);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">${mastered}</div><div class="lbl">Đã thuộc</div></div>
    </div>

    <h4 style="font-size:.8rem;font-weight:700;color:var(--primary);text-transform:uppercase;margin-bottom:10px">
      📈 7 ngày gần nhất
    </h4>
    <div class="chart-bars">
      ${days.map(d => `
        <div class="chart-bar">
          <div class="fill" style="height:${(d.data.reviews / maxReviews) * 100}%"></div>
        </div>
      `).join('')}
    </div>
    <div class="chart-labels">${days.map(d => `<div>${d.label}</div>`).join('')}</div>

    <h4 style="font-size:.8rem;font-weight:700;color:var(--primary);text-transform:uppercase;margin-top:20px;margin-bottom:10px">
      🎯 Tổng quan
    </h4>
    <div class="stats-mini">
      <div class="stat-box"><div class="num">${state.stats.totalReviews}</div><div class="lbl">Lượt ôn</div></div>
      <div class="stat-box"><div class="num">${accuracy.toFixed(1)}%</div><div class="lbl">Chính xác</div></div>
      <div class="stat-box"><div class="num">${state.stats.totalCorrect}</div><div class="lbl">Đúng</div></div>
    </div>
  `;
}

/* ========== IMPORT MODAL ========== */
let pendingImport = [];

function renderImportPreview(){
  const pv = $('importPreview');
  if (!pendingImport.length){
    pv.style.display = 'none';
    $('btnImportConfirm').disabled = true;
    $('importCount').textContent = '';
    return;
  }
  pv.style.display = 'block';
  pv.innerHTML = pendingImport.slice(0, 20).map(p => `
    <div class="row">
      <span class="front">${escapeHtml(p.front)}</span>
      <span class="sep">→</span>
      <span>${escapeHtml(p.back)}</span>
    </div>
  `).join('') + (pendingImport.length > 20 ? `<div class="row" style="text-align:center;color:var(--text-muted)">… và ${pendingImport.length - 20} dòng khác</div>` : '');
  $('btnImportConfirm').disabled = false;
  $('importCount').textContent = `(${pendingImport.length})`;
}

$('importFile').addEventListener('change', async e => {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const pairs = await handleImportFile(f);
    if (!pairs.length){ toast('Không tìm thấy cặp từ hợp lệ', 'error'); return; }
    pendingImport = pairs;
    renderImportPreview();
    $('importText').value = '';
  } catch(err){
    toast('Lỗi đọc file: ' + err.message, 'error');
    console.error(err);
  }
});
$('importText').addEventListener('input', debounce(e => {
  const text = e.target.value;
  if (!text.trim()){ pendingImport = []; renderImportPreview(); return; }
  pendingImport = parsePairs(text);
  renderImportPreview();
}, 300));

$('btnImportConfirm').addEventListener('click', () => {
  if (!pendingImport.length) return;
  const deck = getActiveDeck();
  pendingImport.forEach(p => deck.cards.push(createCard(p.front, p.back)));
  saveState();
  renderCardList();
  renderStudyPanel();
  $('importModal').classList.remove('open');
  toast(`Đã import ${pendingImport.length} thẻ`, 'success');
  pendingImport = [];
  $('importFile').value = '';
  $('importText').value = '';
  renderImportPreview();
});

/* ========== EXPORT ========== */
function download(filename, content, type){
  const blob = new Blob([content], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
$$('[data-export]').forEach(btn => {
  btn.addEventListener('click', () => {
    const deck = getActiveDeck();
    if (!deck.cards.length){ toast('Bộ thẻ trống', 'error'); return; }
    const type = btn.dataset.export;
    const date = new Date().toISOString().slice(0, 10);
    const safeName = deck.name.replace(/[^\w\u00C0-\u024F-]+/g, '_');

    if (type === 'json'){
      const data = deck.cards.map(c => ({
        front: c.front, back: c.back,
        ease: c.ease, interval: c.interval, reps: c.reps,
        lapses: c.lapses, wrongCount: c.wrongCount,
        nextReview: c.nextReview,
        starred: c.starred, createdAt: c.createdAt
      }));
      download(`flashcards_${safeName}_${date}.json`, JSON.stringify(data, null, 2), 'application/json');
    } else if (type === 'csv'){
      const rows = ['front,back'];
      deck.cards.forEach(c => {
        rows.push(`"${c.front.replace(/"/g, '""')}","${c.back.replace(/"/g, '""')}"`);
      });
      download(`flashcards_${safeName}_${date}.csv`, rows.join('\n'), 'text/csv');
    } else {
      const lines = deck.cards.map(c => `${c.front} | ${c.back}`);
      download(`flashcards_${safeName}_${date}.txt`, lines.join('\n'), 'text/plain');
    }
    toast('Đã xuất file', 'success');
    $('exportModal').classList.remove('open');
  });
});

/* ========== THEME ========== */
function applyTheme(){
  document.body.classList.toggle('dark', state.settings.dark);
  $('themeIcon').className = state.settings.dark ? 'fas fa-sun' : 'fas fa-moon';
}
$('btnTheme').addEventListener('click', () => {
  state.settings.dark = !state.settings.dark;
  applyTheme();
  saveState();
});

/* ========== MODAL HELPERS ========== */
$$('[data-close]').forEach(b => {
  b.addEventListener('click', () => {
    const m = b.closest('.modal-backdrop');
    if (m) m.classList.remove('open');
  });
});
$$('.modal-backdrop').forEach(m => {
  m.addEventListener('click', e => {
    if (e.target === m) m.classList.remove('open');
  });
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){
    document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
  }
});

$('btnImport').addEventListener('click', () => {
  pendingImport = [];
  $('importFile').value = '';
  $('importText').value = '';
  renderImportPreview();
  $('importModal').classList.add('open');
});
$('btnExport').addEventListener('click', () => $('exportModal').classList.add('open'));
$('btnDecks').addEventListener('click', () => {
  renderDecksModal();
  $('decksModal').classList.add('open');
});
$('btnStats').addEventListener('click', () => {
  renderStats();
  $('statsModal').classList.add('open');
});
$('btnHelp').addEventListener('click', () => $('helpModal').classList.add('open'));

/* ========== ADD CARD ========== */
$('btnAddCard').addEventListener('click', () => {
  const f = $('addFront').value.trim();
  const b = $('addBack').value.trim();
  if (!f || !b){ toast('Cần nhập cả 2 mặt', 'error'); return; }
  addCard(f, b);
  $('addFront').value = '';
  $('addBack').value = '';
  $('addFront').focus();
  toast('Đã thêm thẻ', 'success');
  sfx('click');
});
$('addFront').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('addBack').focus();
});
$('addBack').addEventListener('keydown', e => {
  if (e.key === 'Enter') $('btnAddCard').click();
});

/* ========== SEARCH / FILTER ========== */
$('searchCards').addEventListener('input', debounce(e => {
  cardSearch = e.target.value;
  renderCardList();
}, 180));
$$('.filter-chips .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    $$('.filter-chips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    cardFilter = chip.dataset.filter;
    renderCardList();
  });
});

/* ========== MOBILE ========== */
function updateMobileTabsVisibility(){
  const isMobile = window.matchMedia('(max-width:900px)').matches;
  $('btnMobileMenu').style.display = isMobile ? 'grid' : 'none';
}
updateMobileTabsVisibility();
window.addEventListener('resize', debounce(updateMobileTabsVisibility, 200));

$('btnMobileMenu').addEventListener('click', () => {
  $('sidebar').classList.toggle('mobile-open');
});
$$('#mobileTabs button').forEach(b => {
  b.addEventListener('click', () => {
    $$('#mobileTabs button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    if (b.dataset.tab === 'cards') $('sidebar').classList.add('mobile-open');
    else $('sidebar').classList.remove('mobile-open');
  });
});

/* ========== KEYBOARD SHORTCUTS ========== */
document.addEventListener('keydown', e => {
  const ctrl = e.ctrlKey || e.metaKey;

  if (ctrl && e.key.toLowerCase() === 'k'){
    e.preventDefault();
    $('searchCards').focus();
    return;
  }
  if (e.key === '?' && !e.target.matches('input, textarea')){
    e.preventDefault();
    $('helpModal').classList.add('open');
    return;
  }

  if (!session) return;
  if (session.mode === 'typing' && !session.showAnswer && e.target.matches('#typingInput')) return;

  if (e.key.toLowerCase() === 's' && session.current && !session.showAnswer){
    session.current.starred = !session.current.starred;
    saveState();
    renderStudyPanel();
    renderCardList();
    toast(session.current.starred ? '⭐ Đã gắn sao' : 'Bỏ sao', 'info');
    return;
  }

  if (e.key === ' ' && !e.target.matches('input, textarea')){
    e.preventDefault();
    if (session.mode === 'flip' && !session.showAnswer){
      session.showAnswer = true;
      speak(session.current.back);
      renderStudyPanel();
    }
    return;
  }

  if (/^[1-4]$/.test(e.key)){
    if (!session.showAnswer){
      if (session.mode === 'mcq' && session.question){
        const idx = parseInt(e.key, 10) - 1;
        if (idx < session.question.options.length) answerMcq(idx);
      }
    } else {
      const map = {1:1, 2:3, 3:4, 4:5};
      rateAndNext(map[parseInt(e.key, 10)]);
    }
    return;
  }

  if (e.key === 'Enter' && session.showAnswer){
    e.preventDefault();
    rateAndNext(4);
  }
});

/* ========== CONFETTI ========== */
function shootConfetti(){
  const colors = ['#6366f1','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#0ea5e9'];
  for (let i = 0; i < 80; i++){
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.top = '-20px';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.animationDuration = (2 + Math.random() * 2) + 's';
    p.style.animationDelay = (Math.random() * 0.5) + 's';
    if (Math.random() > 0.6) p.style.borderRadius = '50%';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 4500);
  }
}

/* ========== INIT ========== */
function init(){
  applyTheme();
  renderDeckSelect();
  renderCardList();
  renderStudyPanel();
}
init();

})();