/* ========== STUDY SESSION ========== */
let session = null;

function buildQueue(mode, options){
  const deck = getActiveDeck();
  let cards = deck.cards.slice();

  if (options.onlyDue) cards = cards.filter(isDue);
  if (options.onlyStarred) cards = cards.filter(c => c.starred);
  if (options.onlyWrong) cards = cards.filter(c => (c.wrongCount || 0) > 0);

  if (options.shuffle) cards = shuffle(cards);
  return cards;
}

function startSession(config){
  const mode = config.mode || 'mcq';
  const options = config.options || {};
  const queue = buildQueue(mode, options);

  if (!queue.length){
    let msg = 'Không có thẻ nào phù hợp để học.';
    if (options.onlyDue) msg = 'Không có thẻ nào đến hạn hôm nay. Hãy tắt "Chỉ ôn đến hạn" để học tất cả.';
    if (options.onlyStarred) msg = 'Không có thẻ nào được gắn sao.';
    if (options.onlyWrong) msg = 'Không có thẻ nào từng trả lời sai.';
    toast(msg, 'info');
    return;
  }

  session = {
    mode,
    queue,
    idx: 0,
    total: queue.length,
    correct: 0,
    answered: 0,
    startTime: now(),
    current: null,
    question: null,
    showAnswer: false,
    wrongIds: [],
    options
  };
  renderStudyPanel();
  loadCurrentCard();
}

function loadCurrentCard(){
  if (!session || session.idx >= session.queue.length){
    endSession();
    return;
  }
  const card = session.queue[session.idx];
  session.current = card;
  session.showAnswer = false;
  session.selectedIndex = null;
  session.userInput = null;
  session.isCorrect = null;
  session.question = buildQuestion(card, session.mode);
  renderStudyPanel();
}

function buildQuestion(card, mode){
  const deck = getActiveDeck();
  if (mode === 'mcq'){
    const others = deck.cards.filter(c => c.id !== card.id);
    const pool = new Set();
    others.forEach(c => { if (c.back !== card.back) pool.add(c.back); });
    const distractors = shuffle([...pool]).slice(0, 3);
    const fallback = ['không', 'có', 'khác', 'đúng', 'sai'];
    while (distractors.length < 3){
      const f = fallback[distractors.length % fallback.length] + (Math.random() * 100 | 0);
      if (!distractors.includes(f) && f !== card.back) distractors.push(f);
    }
    const options = shuffle([card.back, ...distractors]);
    return { options, correctIndex: options.indexOf(card.back) };
  }
  return null;
}

function markWrongAnswer(card){
  card.wrongCount = (card.wrongCount || 0) + 1;
}

function answerMcq(selectedIdx){
  if (!session || session.showAnswer) return;
  const q = session.question;
  const isCorrect = selectedIdx === q.correctIndex;
  session.selectedIndex = selectedIdx;
  session.isCorrect = isCorrect;
  session.showAnswer = true;
  if (isCorrect){
    session.correct++;
    sfx('correct');
    speak(session.current.back);
  } else {
    sfx('wrong');
    markWrongAnswer(session.current);
    session.wrongIds.push(session.current.id);
    saveState();
  }
  session.answered++;
  renderStudyPanel();
  renderCardList();
}

function answerTyping(input){
  if (!session || session.showAnswer) return;
  const correct = session.current.back.trim().toLowerCase();
  const user = input.trim().toLowerCase();
  const isCorrect = user === correct
    || levenshtein(user, correct) <= (correct.length > 6 ? 2 : 1);
  session.isCorrect = isCorrect;
  session.userInput = input;
  session.showAnswer = true;
  if (isCorrect){
    session.correct++;
    sfx('correct');
  } else {
    sfx('wrong');
    markWrongAnswer(session.current);
    session.wrongIds.push(session.current.id);
    saveState();
  }
  session.answered++;
  renderStudyPanel();
  renderCardList();
}

function answerFlip(known){
  if (!session) return;
  session.isCorrect = known;
  session.showAnswer = true;
  if (known){
    session.correct++;
    sfx('correct');
  } else {
    sfx('wrong');
    markWrongAnswer(session.current);
    session.wrongIds.push(session.current.id);
    saveState();
  }
  session.answered++;
  renderStudyPanel();
  renderCardList();
}

function rateAndNext(quality){
  if (!session || !session.showAnswer) return;
  scheduleCard(session.current, quality);

  if (quality === 1){
    session.queue.push(session.current);
    session.total++;
  }

  state.stats.totalReviews++;
  if (session.isCorrect) state.stats.totalCorrect++;
  const dateKey = new Date().toISOString().slice(0, 10);
  if (!state.stats.history[dateKey]) state.stats.history[dateKey] = { reviews: 0, correct: 0 };
  state.stats.history[dateKey].reviews++;
  if (session.isCorrect) state.stats.history[dateKey].correct++;

  updateStreak();
  saveState();

  session.idx++;
  loadCurrentCard();
}

function endSession(){
  const duration = Math.round((now() - session.startTime) / 1000);
  const final = { ...session, duration, finished: true };
  session = null;
  window._lastSummary = final;
  renderSummary(final);
  if (final.total && (final.correct / final.total) >= 0.8){
    shootConfetti();
  }
  saveState();
}

function updateStreak(){
  const today = new Date().toISOString().slice(0, 10);
  const last = state.stats.lastStudyDate;
  if (last === today) return;
  const yesterday = new Date(Date.now() - DAY).toISOString().slice(0, 10);
  if (last === yesterday) state.stats.streak = (state.stats.streak || 0) + 1;
  else state.stats.streak = 1;
  state.stats.lastStudyDate = today;
}

function levenshtein(a, b){
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const m = [];
  for (let i = 0; i <= b.length; i++) m[i] = [i];
  for (let j = 0; j <= a.length; j++) m[0][j] = j;
  for (let i = 1; i <= b.length; i++){
    for (let j = 1; j <= a.length; j++){
      m[i][j] = b[i-1] === a[j-1]
        ? m[i-1][j-1]
        : Math.min(m[i-1][j-1] + 1, m[i][j-1] + 1, m[i-1][j] + 1);
    }
  }
  return m[b.length][a.length];
}

/* ========== RENDER ========== */
function renderStudyPanel(){
  const panel = $('studyPanel');

  if (session && session.current){
    panel.innerHTML = renderSessionView();
    bindSessionEvents();
    return;
  }

  if (window._lastSummary){
    renderSummary(window._lastSummary);
    return;
  }

  panel.innerHTML = renderSetupView();
  bindSetupEvents();
}

function renderSetupView(){
  const deck = getActiveDeck();
  const cards = deck.cards;
  const due = cards.filter(isDue).length;
  const starred = cards.filter(c => c.starred).length;
  const wrong = cards.filter(c => (c.wrongCount || 0) > 0).length;
  const newCount = cards.filter(c => getCardStatus(c) === 'new').length;
  const learningCount = cards.filter(c => getCardStatus(c) === 'learning').length;
  const masteredCount = cards.filter(c => getCardStatus(c) === 'mastered').length;

  if (!cards.length){
    return `
      <div class="empty">
        <i class="fas fa-inbox"></i>
        <h3>Chưa có thẻ nào</h3>
        <p>Bắt đầu bằng cách <strong>thêm thẻ</strong> ở sidebar hoặc <strong>import</strong> từ file (DOCX, CSV, TXT, JSON).</p>
      </div>
    `;
  }

  return `
    <div class="panel-title"><i class="fas fa-graduation-cap"></i> Bắt đầu học</div>
    <p class="panel-sub">Chọn chế độ và tuỳ chọn phiên học</p>

    <div class="status-grid">
      <div class="status-card new-status">
        <div class="num">${newCount}</div>
        <div class="lbl">Mới</div>
        <div class="desc">Chưa học lần nào</div>
      </div>
      <div class="status-card learning-status">
        <div class="num">${learningCount}</div>
        <div class="lbl">Đang học</div>
        <div class="desc">Đã đúng 1-2 lần</div>
      </div>
      <div class="status-card mastered-status">
        <div class="num">${masteredCount}</div>
        <div class="lbl">Đã thuộc</div>
        <div class="desc">Đúng ≥ 3 lần</div>
      </div>
    </div>

    <div class="srs-explainer">
      <h4><i class="fas fa-brain"></i> SRS hoạt động thế nào?</h4>
      <p>
        Mỗi thẻ có <strong>lịch ôn riêng</strong>. Khi bạn trả lời đúng nhiều lần,
        thẻ sẽ "rời xa" — ít xuất hiện lại. Trả lời sai → thẻ quay lại sớm.
      </p>
      <p>
        <strong>${due} thẻ</strong> đang đến hạn hôm nay
        ${starred ? `· <strong>${starred}</strong> gắn sao` : ''}
        ${wrong ? `· <strong>${wrong}</strong> từng sai` : ''}.
      </p>
      <button class="toggle-link" id="toggleSrsDetail">Xem chi tiết lịch ôn ▾</button>
      <div class="srs-detail" id="srsDetail">
        <p><strong>Thẻ mới</strong> → luôn xuất hiện ngay lần học đầu.</p>
        <p><strong>Sau khi trả lời</strong> → bạn chọn độ khó:</p>
        <p>
          <code>Again</code> → quay lại cuối hàng ·
          <code>Hard</code> → ×1.3 ·
          <code>Good</code> → ×1.8 ·
          <code>Easy</code> → ×2.3
        </p>
        <p>Khoảng cách tối đa <strong>30 ngày</strong> — sau đó ôn lại mỗi tháng.</p>
      </div>
    </div>

    <div class="mode-grid">
      <div class="mode-card active" data-mode="mcq">
        <i class="fas fa-list-check"></i>
        <div class="name">Trắc nghiệm</div>
        <div class="desc">Chọn 1 trong 4 đáp án</div>
      </div>
      <div class="mode-card" data-mode="typing">
        <i class="fas fa-keyboard"></i>
        <div class="name">Gõ đáp án</div>
        <div class="desc">Nhập từ đúng</div>
      </div>
      <div class="mode-card" data-mode="flip">
        <i class="fas fa-rotate"></i>
        <div class="name">Lật thẻ</div>
        <div class="desc">Tự đánh giá</div>
      </div>
    </div>

    <div class="session-options">
      <label class="opt-row">
        <input type="checkbox" id="optShuffle" checked>
        <div>
          <div class="lbl">Xáo trộn thứ tự</div>
          <div class="hint">Trộn ngẫu nhiên các thẻ</div>
        </div>
      </label>
      <label class="opt-row">
        <input type="checkbox" id="optOnlyDue" ${due > 0 ? 'checked' : ''}>
        <div>
          <div class="lbl">Chỉ ôn thẻ đến hạn</div>
          <div class="hint ${due > 0 ? 'strong' : ''}">
            ${due > 0 ? `${due} thẻ cần ôn hôm nay` : 'Không có thẻ nào đến hạn'}
          </div>
        </div>
      </label>
      <label class="opt-row">
        <input type="checkbox" id="optOnlyStarred" ${starred === 0 ? 'disabled' : ''}>
        <div>
          <div class="lbl">Chỉ thẻ có sao ⭐</div>
          <div class="hint">${starred} thẻ đã gắn sao</div>
        </div>
      </label>
      <label class="opt-row">
        <input type="checkbox" id="optOnlyWrong" ${wrong === 0 ? 'disabled' : ''}>
        <div>
          <div class="lbl">Chỉ thẻ từng sai</div>
          <div class="hint">${wrong > 0 ? `${wrong} thẻ đã trả lời sai ít nhất 1 lần` : 'Chưa có thẻ nào bị sai'}</div>
        </div>
      </label>
    </div>

    <button class="btn btn-primary btn-lg btn-cta" id="btnStart">
      <i class="fas fa-play"></i> Bắt đầu học
    </button>
  `;
}

function bindSetupEvents(){
  $$('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      $$('.mode-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  const toggle = $('toggleSrsDetail');
  if (toggle){
    toggle.addEventListener('click', () => {
      const det = $('srsDetail');
      det.classList.toggle('show');
      toggle.textContent = det.classList.contains('show')
        ? 'Thu gọn ▲'
        : 'Xem chi tiết lịch ôn ▾';
    });
  }

  const btn = $('btnStart');
  if (btn){
    btn.addEventListener('click', () => {
      const mode = document.querySelector('.mode-card.active').dataset.mode;
      startSession({
        mode,
        options: {
          shuffle: $('optShuffle').checked,
          onlyDue: $('optOnlyDue').checked,
          onlyStarred: $('optOnlyStarred').checked,
          onlyWrong: $('optOnlyWrong').checked
        }
      });
    });
  }
}

function renderSessionView(){
  const s = session;
  const c = s.current;
  const pct = s.total ? Math.round((s.answered / s.total) * 100) : 0;
  const modeName = { mcq: 'Trắc nghiệm', typing: 'Gõ đáp án', flip: 'Lật thẻ' }[s.mode];

  let answerHtml = '';
  if (s.mode === 'mcq' && s.question){
    answerHtml = '<div class="answer-area">' + s.question.options.map((opt, i) => {
      let cls = 'opt-btn';
      if (s.showAnswer){
        if (i === s.question.correctIndex) cls += ' correct';
        else if (i === s.selectedIndex) cls += ' wrong';
      }
      return `<button class="${cls}" data-opt="${i}" ${s.showAnswer ? 'disabled' : ''}>
        <span class="key">${String.fromCharCode(65+i)}.</span>
        <span>${escapeHtml(opt)}</span>
      </button>`;
    }).join('') + '</div>';
  } else if (s.mode === 'typing'){
    if (s.showAnswer){
      answerHtml = `
        <div class="answer-area">
          <div class="flip-answer">
            <div class="lbl">Đáp án đúng</div>
            <div class="ans">${escapeHtml(c.back)}</div>
          </div>
          <div class="typing-input ${s.isCorrect ? 'correct' : 'wrong'}" style="pointer-events:none">
            ${s.userInput ? escapeHtml(s.userInput) : '<i style="color:var(--text-muted)">(bỏ trống)</i>'}
            ${s.isCorrect ? ' ✅' : ' ❌'}
          </div>
        </div>
      `;
    } else {
      answerHtml = `
        <div class="typing-wrap">
          <input type="text" class="typing-input" id="typingInput" placeholder="Nhập đáp án và Enter..." autocomplete="off" autofocus>
          <button class="btn btn-primary" id="btnTypingSubmit" style="align-self:center;min-width:160px">
            <i class="fas fa-check"></i> Kiểm tra
          </button>
        </div>
      `;
    }
  } else if (s.mode === 'flip'){
    answerHtml = `
      <div class="flip-answer ${s.showAnswer ? '' : 'hidden'}" id="flipAnswer">
        <div class="lbl">Đáp án</div>
        <div class="ans">${escapeHtml(c.back)}</div>
      </div>
      ${!s.showAnswer ? `<button class="btn btn-primary btn-lg btn-cta" id="btnFlip">Lật thẻ <kbd style="margin-left:6px">Space</kbd></button>` : ''}
    `;
  }

  let diffHtml = '';
  if (s.showAnswer){
    diffHtml = `
      <div class="diff-header">
        <i class="fas fa-gauge-high"></i> Thẻ này khó với bạn thế nào?
        <span class="hint">Bấm 1-4 để chọn</span>
      </div>
      <div class="diff-row">
        <button class="diff-btn again" data-q="1">
          <span class="kb">1</span>
          <span>Again</span>
          <small class="next-interval">${previewInterval(c, 1)}</small>
        </button>
        <button class="diff-btn hard" data-q="3">
          <span class="kb">2</span>
          <span>Hard</span>
          <small class="next-interval">${previewInterval(c, 3)}</small>
        </button>
        <button class="diff-btn good" data-q="4">
          <span class="kb">3</span>
          <span>Good</span>
          <small class="next-interval">${previewInterval(c, 4)}</small>
        </button>
        <button class="diff-btn easy" data-q="5">
          <span class="kb">4</span>
          <span>Easy</span>
          <small class="next-interval">${previewInterval(c, 5)}</small>
        </button>
      </div>
    `;
  }

  return `
    <div class="session-top">
      <div class="progress-wrap">
        <div class="meta">
          <span>${s.answered} / ${s.total} câu · ${modeName}</span>
          <span class="strong">${pct}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
      </div>
      <div class="session-stats">
        <span class="pill ok"><i class="fas fa-check"></i> ${s.correct}</span>
        <span class="pill bad"><i class="fas fa-times"></i> ${s.answered - s.correct}</span>
      </div>
      <button class="icon-btn" id="btnExitSession" title="Thoát"><i class="fas fa-xmark"></i></button>
    </div>

    <div class="card-front">
      <button class="tts-btn" id="btnTts" title="Đọc to"><i class="fas fa-volume-high"></i></button>
      <div class="label">${s.mode === 'flip' ? 'Mặt trước' : 'Câu hỏi'}</div>
      <div class="content">${escapeHtml(c.front)}</div>
    </div>

    ${answerHtml}
    ${diffHtml}
  `;
}

function bindSessionEvents(){
  $$('.opt-btn').forEach(btn => {
    btn.addEventListener('click', () => answerMcq(parseInt(btn.dataset.opt, 10)));
  });

  const typingInput = $('typingInput');
  const btnTyping = $('btnTypingSubmit');
  if (typingInput){
    typingInput.focus();
    typingInput.addEventListener('keydown', e => {
      if (e.key === 'Enter'){
        e.preventDefault();
        answerTyping(typingInput.value);
      }
    });
    if (btnTyping){
      btnTyping.addEventListener('click', () => answerTyping(typingInput.value));
    }
  }

  const btnFlip = $('btnFlip');
  if (btnFlip){
    btnFlip.addEventListener('click', () => {
      session.showAnswer = true;
      speak(session.current.back);
      renderStudyPanel();
    });
  }

  $$('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => rateAndNext(parseInt(btn.dataset.q, 10)));
  });

  const btnExit = $('btnExitSession');
  if (btnExit){
    btnExit.addEventListener('click', () => {
      if (confirm('Thoát phiên học? Tiến trình đã lưu sẽ được giữ.')){
        session = null;
        renderStudyPanel();
      }
    });
  }

  const btnTts = $('btnTts');
  if (btnTts){
    btnTts.addEventListener('click', () => speak(session.current.front));
  }
}

function renderSummary(s){
  const panel = $('studyPanel');
  const pct = s.total ? (s.correct / s.total) * 100 : 0;
  let rank;
  if (pct >= 90) rank = '🏆 Xuất sắc';
  else if (pct >= 80) rank = '🌟 Giỏi';
  else if (pct >= 65) rank = '👍 Khá';
  else if (pct >= 50) rank = '📚 Trung bình';
  else rank = '💪 Cần cố gắng';

  panel.innerHTML = `
    <div class="summary">
      <div class="big-score">${s.correct}/${s.total}</div>
      <div class="rank">${rank} · ${pct.toFixed(1)}%</div>
      <div class="summary-stats">
        <div class="stat-box">
          <div class="num">${s.duration}s</div>
          <div class="lbl">Thời gian</div>
        </div>
        <div class="stat-box">
          <div class="num">${s.correct}</div>
          <div class="lbl">Đúng</div>
        </div>
        <div class="stat-box">
          <div class="num">${s.total - s.correct}</div>
          <div class="lbl">Sai</div>
        </div>
      </div>
      <div class="summary-actions">
        <button class="btn" id="btnSummaryBack"><i class="fas fa-arrow-left"></i> Về trang chủ</button>
        <button class="btn btn-primary" id="btnSummaryRetry"><i class="fas fa-rotate-right"></i> Học lại</button>
      </div>
    </div>
  `;
  $('btnSummaryBack').addEventListener('click', () => {
    window._lastSummary = null;
    renderStudyPanel();
  });
  $('btnSummaryRetry').addEventListener('click', () => {
    window._lastSummary = null;
    startSession({ mode: 'mcq', options: { shuffle: true } });
  });
}

/* ========== CARD LIST ========== */
let cardFilter = 'all';
let cardSearch = '';

function renderCardList(){
  const list = $('cardList');
  const deck = getActiveDeck();
  let cards = deck.cards;

  const dueCount = deck.cards.filter(isDue).length;
  const starredCount = deck.cards.filter(c => c.starred).length;
  const wrongCount = deck.cards.filter(c => (c.wrongCount || 0) > 0).length;
  $('chipAll').textContent = deck.cards.length;
  $('chipDue').textContent = dueCount;
  $('chipStar').textContent = starredCount;
  $('chipWrong').textContent = wrongCount;
  $('cardCount').textContent = deck.cards.length;

  if (cardFilter === 'due') cards = cards.filter(isDue);
  else if (cardFilter === 'starred') cards = cards.filter(c => c.starred);
  else if (cardFilter === 'wrong') cards = cards.filter(c => (c.wrongCount || 0) > 0);

  if (cardSearch){
    const q = cardSearch.toLowerCase();
    cards = cards.filter(c =>
      c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q)
    );
  }

  if (!cards.length){
    list.innerHTML = '<div class="empty-mini">Không có thẻ nào</div>';
    return;
  }

  list.innerHTML = cards.map(c => {
    const status = getCardStatus(c);
    const due = getDueLabel(c);
    const wrongN = c.wrongCount || 0;
    const badges = [];
    badges.push(`<span class="mini-badge ${due.cls}"><i class="fas fa-clock"></i> ${due.text}</span>`);
    if (wrongN > 0){
      badges.push(`<span class="mini-badge wrong-count"><i class="fas fa-triangle-exclamation"></i> Sai ${wrongN} lần</span>`);
    }
    if (c.reps > 0){
      badges.push(`<span class="mini-badge reps"><i class="fas fa-repeat"></i> ${c.reps} lần đúng</span>`);
    }

    return `
      <div class="card-item ${c.starred ? 'starred' : ''} status-${status}" data-id="${c.id}">
        <div class="status-dot ${status}" title="${getStatusLabel(status)}"></div>
        <div class="info" data-edit="${c.id}">
          <div class="front">${escapeHtml(c.front)}</div>
          <div class="back">${escapeHtml(c.back)}</div>
          <div class="badges">${badges.join('')}</div>
        </div>
        <button class="star-btn ${c.starred ? 'on' : ''}" data-star="${c.id}" title="Gắn sao">
          <i class="fas fa-star"></i>
        </button>
      </div>
    `;
  }).join('');
}

$('cardList').addEventListener('click', e => {
  const starBtn = e.target.closest('[data-star]');
  if (starBtn){
    e.stopPropagation();
    const id = starBtn.dataset.star;
    const c = getActiveDeck().cards.find(c => c.id === id);
    if (c){ c.starred = !c.starred; saveState(); renderCardList(); renderStudyPanel(); }
    return;
  }
  const editEl = e.target.closest('[data-edit]');
  if (editEl){
    openEditCard(editEl.dataset.edit);
  }
});

/* ========== EDIT CARD ========== */
let editingCardId = null;
function openEditCard(id){
  const c = getActiveDeck().cards.find(c => c.id === id);
  if (!c) return;
  editingCardId = id;
  $('editFront').value = c.front;
  $('editBack').value = c.back;
  $('editCardModal').classList.add('open');
  setTimeout(() => $('editFront').focus(), 100);
}
$('btnSaveEdit').addEventListener('click', () => {
  const f = $('editFront').value.trim();
  const b = $('editBack').value.trim();
  if (!f || !b){ toast('Cần nhập cả 2 mặt', 'error'); return; }
  updateCard(editingCardId, { front: f, back: b });
  $('editCardModal').classList.remove('open');
  toast('Đã cập nhật thẻ', 'success');
});


