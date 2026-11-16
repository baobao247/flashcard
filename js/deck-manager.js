/* ========== PRELOADED SAMPLE DECKS ========== */
const SAMPLE_PRESET_DECKS = [
  {
    name: '🇬🇧 100 Từ Vựng IELTS Cốt Lõi',
    emoji: '🇬🇧',
    cards: [
      { front: 'Ubiquitous (adj)', back: 'Phổ biến, có mặt ở khắp mọi nơi cùng lúc' },
      { front: 'Pragmatic (adj)', back: 'Thực tế, coi trọng tính ứng dụng và kết quả hơn lý thuyết' },
      { front: 'Resilient (adj)', back: 'Kiên cường, có khả năng phục hồi nhanh chóng sau biến cố' },
      { front: 'Meticulous (adj)', back: 'Tỉ mỉ, cẩn thận từng li từng tí, chú ý chi tiết' },
      { front: 'Persevere (v)', back: 'Kiên trì, quyết tâm vượt qua khó khăn để đạt mục tiêu' },
      { front: 'Eloquent (adj)', back: 'Có tài hùng biện, ăn nói lưu loát và thuyết phục' },
      { front: 'Ambiguous (adj)', back: 'Mơ hồ, nước đôi, có thể hiểu theo nhiều cách khác nhau' },
      { front: 'Scrutinize (v)', back: 'Xem xét kỹ lưỡng, khảo sát cẩn thận từng chi tiết' },
      { front: 'Substantiate (v)', back: 'Chứng minh, cung cấp bằng chứng xác thực' },
      { front: 'Ephemeral (adj)', back: 'Phù du, chóng tàn, chỉ tồn tại trong khoảng thời gian rất ngắn' },
      { front: 'Paradigm (n)', back: 'Mô hình, khuôn mẫu chuẩn mực mẫu mực tư duy' },
      { front: 'Exacerbate (v)', back: 'Làm trầm trọng thêm, khiến vấn đề tồi tệ hơn' },
      { front: 'Mitigate (v)', back: 'Giảm nhẹ, xoa dịu mức độ nghiêm trọng hoặc thiệt hại' },
      { front: 'Plausible (adj)', back: 'Hợp lý, đáng tin cậy, có vẻ đúng' },
      { front: 'Comprehensive (adj)', back: 'Toàn diện, bao hàm đầy đủ mọi khía cạnh' },
      { front: 'Discrepancy (n)', back: 'Sự khác biệt, sai lệch, không nhất quán giữa hai dữ liệu' },
      { front: 'Proficient (adj)', back: 'Thành thạo, điêu luyện trong một kỹ năng hay lĩnh vực' },
      { front: 'Feasible (adj)', back: 'Khả thi, có thể thực hiện thành công trong thực tế' },
      { front: 'Reconcile (v)', back: 'Hòa giải, giải quyết sự bất đồng hoặc khác biệt' },
      { front: 'Detrimental (adj)', back: 'Có hại, gây tổn hại cho sức khỏe hoặc kết quả' }
    ]
  },
  {
    name: '💻 Thuật Ngữ Web Dev & IT',
    emoji: '💻',
    cards: [
      { front: 'API', back: 'Application Programming Interface - Giao diện kết nối và trao đổi dữ liệu giữa các phần mềm' },
      { front: 'DOM', back: 'Document Object Model - Cây phân cấp đối tượng đại diện cho cấu trúc tài liệu HTML' },
      { front: 'Asynchronous (Async)', back: 'Bất đồng bộ - Tác vụ chạy nền không làm nghẽn tiến trình thực thi chính' },
      { front: 'Closure', back: 'Hàm nội bộ có khả năng ghi nhớ và truy cập các biến ở phạm vi bên ngoài nó' },
      { front: 'Responsive Design', back: 'Thiết kế web tự động thích ứng tối ưu trên mọi kích thước màn hình thiết bị' },
      { front: 'RESTful API', back: 'Kiến trúc API chuẩn sử dụng các HTTP method GET, POST, PUT, DELETE không lưu trạng thái' },
      { front: 'JWT', back: 'JSON Web Token - Chuỗi mã hóa nhỏ gọn dùng để xác thực và ủy quyền người dùng an toàn' },
      { front: 'Debounce', back: 'Kỹ thuật hoãn thực thi một hàm cho đến khi người dùng ngừng thao tác trong khoảng thời gian xác định' },
      { front: 'Event Loop', back: 'Cơ chế điều phối đơn luồng trong JS xử lý hàng đợi sự kiện call stack và task queue' },
      { front: 'LocalStorage', back: 'Bộ nhớ lưu trữ dữ liệu dạng key-value vĩnh viễn trên trình duyệt của máy khách' },
      { front: 'CSS Flexbox', back: 'Mô hình bố cục 1 chiều (theo hàng hoặc cột) giúp căn chỉnh và phân chia không gian linh hoạt' },
      { front: 'CSS Grid', back: 'Hệ thống bố cục 2 chiều (hàng và cột) mạnh mẽ cho giao diện web phức tạp' },
      { front: 'Cross-Origin (CORS)', back: 'Chính sách bảo mật trình duyệt kiểm soát tài nguyên tải từ domain khác' },
      { front: 'Single Page App (SPA)', back: 'Ứng dụng web tải một trang duy nhất và cập nhật nội dung động không cần reload' },
      { front: 'Semantic HTML', back: 'Việc dùng thẻ HTML đúng ý nghĩa ngữ nghĩa (header, nav, article, footer) hỗ trợ SEO và a11y' }
    ]
  },
  {
    name: '🎯 Thành Ngữ Tiếng Anh Phổ Biến',
    emoji: '🎯',
    cards: [
      { front: 'Piece of cake', back: 'Cực kỳ dễ dàng, dễ như ăn kẹo' },
      { front: 'Break a leg', back: 'Lời chúc may mắn (thường dùng trước buổi biểu diễn hoặc kỳ thi)' },
      { front: 'Bite the bullet', back: 'Cắn răng chịu đựng, dũng cảm đối mặt với điều khó chịu không thể tránh' },
      { front: 'Under the weather', back: 'Cảm thấy không khỏe, hơi mệt mỏi trong người' },
      { front: 'Hit the books', back: 'Bắt đầu cắm đầu vào học tập một cách nghiêm túc' },
      { front: 'Hit the nail on the head', back: 'Nói trúng phóc, đoán chính xác tuyệt đối bản chất sự việc' },
      { front: 'Cost an arm and a leg', back: 'Rất đắt đỏ, tốn kém cả gia tài' },
      { front: 'Once in a blue moon', back: 'Rất hiếm khi xảy ra, năm thì mười họa' },
      { front: 'Kill two birds with one stone', back: 'Một mũi tên trúng hai đích, đạt hai mục tiêu cùng lúc' },
      { front: 'Blessing in disguise', back: 'Trong cái rủi có cái may, thoạt đầu tưởng tệ nhưng hóa ra lại tốt' },
      { front: 'See eye to eye', back: 'Đồng quan điểm, nhất trí hoàn toàn với ai đó' },
      { front: 'Through thick and thin', back: 'Cùng nhau trải qua mọi thăng trầm, hoạn nạn gắn bó' },
      { front: 'Call it a day', back: 'Quyết định dừng công việc hôm nay và nghỉ ngơi' },
      { front: 'Burn the midnight oil', back: 'Thức khuya làm việc hoặc ôn thi tới nửa đêm' },
      { front: 'Spill the beans', back: 'Lỡ làm lộ bí mật hoặc thông tin kín' }
    ]
  }
];

function loadPresetDeck(index) {
  const preset = SAMPLE_PRESET_DECKS[index];
  if (!preset) return;
  let targetDeck = state.decks.find(d => d.name === preset.name);
  if (!targetDeck) {
    targetDeck = {
      id: 'deck_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: preset.name,
      emoji: preset.emoji,
      cards: [],
      createdAt: now()
    };
    state.decks.push(targetDeck);
  }

  let added = 0;
  preset.cards.forEach(c => {
    if (!targetDeck.cards.some(existing => existing.front.trim() === c.front.trim())) {
      targetDeck.cards.push(createCard(c.front, c.back));
      added++;
    }
  });

  state.activeDeckId = targetDeck.id;
  saveState();
  renderDecksModal();
  renderDeckSelect();
  renderCardList();
  renderStudyPanel();
  toast('Đã nạp bộ thẻ mẫu: ' + preset.name + ' (+' + added + ' thẻ mới)', 'success');
}

/* ========== DECKS ========== */
function renderDecksModal(){
  const list = $('decksList');
  list.innerHTML = state.decks.map(d => `
    <div class="card-item ${d.id === state.activeDeckId ? 'status-mastered' : ''}" data-deck="${d.id}" style="cursor:pointer;border-left-width:3px">
      <div style="font-size:20px;flex-shrink:0">${d.emoji || '📚'}</div>
      <div class="info">
        <div class="front">${escapeHtml(d.name)}</div>
        <div class="back">${d.cards.length} thẻ</div>
      </div>
      <button class="star-btn" data-clonedeck="${d.id}" title="Nhân bản bộ thẻ (Copy)">
        <i class="fas fa-copy"></i>
      </button>
      ${state.decks.length > 1 ? `
        <button class="star-btn" data-deldeck="${d.id}" title="Xóa bộ thẻ">
          <i class="fas fa-trash"></i>
        </button>
      ` : ''}
    </div>
  `).join('');
}
$('decksList').addEventListener('click', e => {
  const cloneBtn = e.target.closest('[data-clonedeck]');
  if (cloneBtn){
    e.stopPropagation();
    const id = cloneBtn.dataset.clonedeck;
    const target = state.decks.find(d => d.id === id);
    if (!target) return;
    const newDeck = {
      id: 'deck_' + Date.now(),
      name: target.name + ' (Bản sao)',
      emoji: target.emoji || '📚',
      cards: target.cards.map(c => ({ ...c, id: uid() })),
      createdAt: now()
    };
    state.decks.push(newDeck);
    state.activeDeckId = newDeck.id;
    saveState();
    renderDecksModal();
    renderDeckSelect();
    renderCardList();
    renderStudyPanel();
    toast('Đã nhân bản bộ thẻ: ' + newDeck.name, 'success');
    return;
  }

  const delBtn = e.target.closest('[data-deldeck]');
  if (delBtn){
    e.stopPropagation();
    const id = delBtn.dataset.deldeck;
    if (!confirm('Xóa bộ thẻ và toàn bộ thẻ bên trong?')) return;
    state.decks = state.decks.filter(d => d.id !== id);
    if (state.activeDeckId === id) state.activeDeckId = state.decks[0].id;
    saveState();
    renderDecksModal();
    renderDeckSelect();
    renderCardList();
    renderStudyPanel();
    toast('Đã xóa bộ thẻ', 'info');
    return;
  }
  const deckEl = e.target.closest('[data-deck]');
  if (deckEl){
    state.activeDeckId = deckEl.dataset.deck;
    saveState();
    renderDeckSelect();
    renderDecksModal();
    renderCardList();
    renderStudyPanel();
    $('decksModal').classList.remove('open');
  }
});
$('btnCreateDeck').addEventListener('click', () => {
  const name = $('newDeckName').value.trim();
  if (!name){ toast('Nhập tên bộ thẻ', 'error'); return; }
  const emojis = ['📚','📖','✏️','🎯','⭐','🌟','🔥','💡','🧠','🎨'];
  const deck = {
    id: uid(),
    name,
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
    cards: [],
    createdAt: now()
  };
  state.decks.push(deck);
  state.activeDeckId = deck.id;
  $('newDeckName').value = '';
  saveState();
  renderDeckSelect();
  renderDecksModal();
  renderCardList();
  renderStudyPanel();
  toast(`Đã tạo bộ "${name}"`, 'success');
});

function renderDeckSelect(){
  const sel = $('deckSelect');
  sel.innerHTML = state.decks.map(d =>
    `<option value="${d.id}" ${d.id === state.activeDeckId ? 'selected' : ''}>
      ${d.emoji || '📚'} ${escapeHtml(d.name)} (${d.cards.length})
    </option>`
  ).join('');
}
$('deckSelect').addEventListener('change', e => {
  state.activeDeckId = e.target.value;
  saveState();
  renderCardList();
  renderStudyPanel();
});

