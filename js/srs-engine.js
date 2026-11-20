/* ========== UNIVERSAL UTILS & SRS ENGINE ========== */
if (typeof window !== 'undefined') {
  window.$ = window.$ || (id => document.getElementById(id));
  window.$$ = window.$$ || (sel => document.querySelectorAll(sel));
  window.uid = window.uid || (() => Date.now().toString(36) + Math.random().toString(36).slice(2, 7));
  window.now = window.now || (() => Date.now());
  window.DAY = window.DAY || 86400000;
}

/* ========== CARD STATUS HELPERS ========== */
function getCardStatus(card){
  if (!card.reps || card.reps === 0) return 'new';
  if (card.reps < 3) return 'learning';
  return 'mastered';
}
function getStatusLabel(status){
  return { new: 'Mới', learning: 'Đang học', mastered: 'Đã thuộc' }[status];
}
function isDue(card){
  if (getCardStatus(card) === 'new') return true;
  return !card.nextReview || card.nextReview <= now();
}
function getDueLabel(card){
  if (getCardStatus(card) === 'new') return { text: 'Mới', cls: 'due-now' };
  const diff = card.nextReview - now();
  if (diff <= 0) return { text: 'Đến hạn', cls: 'due-now' };
  const hours = diff / 3600000;
  if (hours < 1) return { text: Math.round(diff / 60000) + ' phút nữa', cls: 'due-soon' };
  if (hours < 12) return { text: Math.round(hours) + ' giờ nữa', cls: 'due-soon' };
  if (hours < 24) return { text: 'Hôm nay', cls: 'due-soon' };
  const days = Math.round(diff / DAY);
  if (days === 1) return { text: 'Ngày mai', cls: 'due-later' };
  if (days < 7) return { text: days + ' ngày nữa', cls: 'due-later' };
  const weeks = Math.round(days / 7);
  return { text: weeks + ' tuần nữa', cls: 'due-later' };
}

/* ========== SRS — Ladder ngắn hạn, cap 30 ngày ========== */
function scheduleCard(card, quality){
  // quality: 1=Again, 3=Hard, 4=Good, 5=Easy
  if (quality < 3){
    card.reps = 0;
    card.interval = 0;
    card.lapses = (card.lapses || 0) + 1;
    card.nextReview = 0;
    return card;
  }

  const reps = card.reps || 0;
  let newInterval;

  // Ladder 3 cấp đầu — khoảng cách cố định, hợp lý cho ôn thi
  const LADDER = {
    0: { 3: 1, 4: 1, 5: 2 },   // Lần đúng đầu
    1: { 3: 2, 4: 3, 5: 5 },   // Lần đúng thứ 2
    2: { 3: 4, 4: 7, 5: 10 }   // Lần đúng thứ 3
  };

  if (reps < 3){
    newInterval = LADDER[reps][quality] || 1;
  } else {
    // Từ lần thứ 4 trở đi mới nhân hệ số
    const mult = quality === 3 ? 1.3 : quality === 4 ? 1.8 : 2.3;
    newInterval = Math.round(card.interval * mult);
  }

  // Cap ở 30 ngày
  const MAX_INTERVAL = 30;
  newInterval = Math.min(MAX_INTERVAL, Math.max(1, newInterval));

  // Đảm bảo tăng ít nhất 1 ngày nếu chưa đạt cap
  if (newInterval <= card.interval && newInterval < MAX_INTERVAL){
    newInterval = card.interval + 1;
  }

  card.interval = newInterval;
  card.reps = reps + 1;
  card.nextReview = now() + newInterval * DAY;
  return card;
}

function previewInterval(card, quality){
  const clone = { ...card };
  scheduleCard(clone, quality);
  if (quality < 3) return '< 1 phút';
  const days = clone.interval;
  if (days === 1) return '1 ngày';
  if (days < 7) return days + ' ngày';
  if (days === 7) return '1 tuần';
  if (days < 30) return Math.ceil(days / 7) + ' tuần';
  return '1 tháng';
}

/* ========== CARD CRUD ========== */
function createCard(front, back){
  return {
    id: uid(),
    front: String(front).trim(),
    back: String(back).trim(),
    ease: 2.5,
    interval: 0,
    reps: 0,
    lapses: 0,
    wrongCount: 0,
    nextReview: 0,
    starred: false,
    createdAt: now()
  };
}

function addCard(front, back){
  if (!front || !back) return false;
  getActiveDeck().cards.push(createCard(front, back));
  saveState();
  renderCardList();
  renderStudyPanel();
  return true;
}

function deleteCard(id){
  const deck = getActiveDeck();
  deck.cards = deck.cards.filter(c => c.id !== id);
  saveState();
  renderCardList();
  renderStudyPanel();
}

function updateCard(id, patch){
  const c = getActiveDeck().cards.find(c => c.id === id);
  if (!c) return;
  Object.assign(c, patch);
  saveState();
  renderCardList();
}

/* ========== IMPORT ========== */

// Robust CSV parser supporting quotes, commas, semicolons, and tabs
function parseCsvLine(line, preferredSep) {
  let sep = preferredSep;
  if (!sep) {
    const tabs = (line.match(/\t/g) || []).length;
    const semicolons = (line.match(/;/g) || []).length;
    const commas = (line.match(/,/g) || []).length;
    const pipes = (line.match(/\|/g) || []).length;
    sep = tabs > commas && tabs > semicolons ? '\t' : (semicolons > commas ? ';' : (pipes > commas ? '|' : ','));
  }
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === sep && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

function parsePairs(text){
  const pairs = [];
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  for (let line of lines){
    line = line.trim();
    if (!line) continue;
    let m = line.match(/^(.+?)\s*\|\s*(.+)$/);
    if (!m) m = line.match(/^(.+?)\s*\t\s*(.+)$/);
    if (!m) m = line.match(/^(.+?)\s*[=:]\s*(.+)$/);
    if (!m) m = line.match(/^(.+?)\s+[-–—]\s+(.+)$/);
    if (!m) m = line.match(/^(.+?)\s*,\s*(.+)$/);
    if (m){
      const front = m[1].trim();
      const back = m[2].trim();
      if (front && back) pairs.push({ front, back });
    }
  }
  return pairs;
}

function parseFileContent(text, ext){
  ext = (ext || '').toLowerCase();
  if (ext === 'json'){
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data)){
        return data.map(item => ({
          front: item.front || item.eng || item.question || item.q || item.term || '',
          back: item.back || item.vi || item.answer || item.a || item.definition || ''
        })).filter(p => p.front && p.back);
      }
      return [];
    } catch(e){ throw new Error('JSON không hợp lệ'); }
  }
  if (ext === 'csv' || ext === 'tsv'){
    const sep = ext === 'tsv' ? '\t' : null;
    const lines = text.replace(/\r\n?/g, '\n').split('\n').filter(Boolean);
    const pairs = [];
    let start = 0;
    if (lines[0] && /^(front|eng|question|term)\s*[,;\t|]/i.test(lines[0])) start = 1;
    for (let i = start; i < lines.length; i++){
      const parts = parseCsvLine(lines[i], sep);
      if (parts.length >= 2 && parts[0] && parts[1]){
        pairs.push({ front: parts[0], back: parts[1] });
      }
    }
    return pairs;
  }
  return parsePairs(text);
}

async function handleImportFile(file){
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'docx'){
    const ab = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: ab });
    return parsePairs(result.value);
  }
  const text = await file.text();
  return parseFileContent(text, ext);
}

