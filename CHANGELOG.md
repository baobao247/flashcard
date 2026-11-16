# Flashcard Pro — Changelog & Architecture Report

## 1. Deep Audit & Bugs Fixed
- **Trình phân tích CSV/TSV chuẩn RFC**: Bổ sung hàm `parseCsvLine` có khả năng xử lý các chuỗi chứa dấu phẩy bên trong dấu ngoặc kép `""`, tự động phân biệt dấu phân tách phẩy (`,`), chấm phẩy (`;`), tab (`\t`), gạch đứng (`|`).
- **Auto-seed kho thẻ ban đầu**: Nếu người dùng lần đầu mở ứng dụng với kho dữ liệu trống, hệ thống tự động khởi tạo bộ thẻ mẫu từ vựng IELTS để có thể học ngay mà không gặp màn hình trống.
- **Sửa lỗi tính ngày ôn tập (SRS interval cap)**: Giới hạn khoảng cách ôn tối đa trong 30 ngày cho các bộ thẻ học ngắn hạn để duy trì chu kỳ ghi nhớ tốt nhất.

---

## 2. Kiến trúc Tái Cấu Trúc (Architecture Refactoring)
Bóc tách toàn diện từ 1 file khổng lồ gần 100 KB thành các module kiến trúc chuẩn:
```
flashcard/
├── css/
│   └── style.css            # Toàn bộ theme, biến CSS, card lật 3D, thanh tiến độ & modal
├── js/
│   ├── app.js               # Quản lý State chung, Web Audio FX, Web Speech TTS, Keyboard shortcuts
│   ├── srs-engine.js        # Thuật toán Spaced Repetition (SuperMemo SM-2 rút gọn), Ease Factor, Card CRUD
│   ├── deck-manager.js      # Quản lý bộ thẻ, 3 bộ thẻ mẫu, Sao lưu & Khôi phục Full JSON Backup
│   └── study-session.js     # Điều phối phiên học: Trắc nghiệm (MCQ), Gõ đáp án (Typing), Lật thẻ (Flip)
├── index.html               # File HTML5 ngữ nghĩa, gọn gàng và tương thích cao
└── CHANGELOG.md             # Tài liệu kiểm toán và hướng dẫn sử dụng
```

---

## 3. Cải tiến UI/UX & Hiệu năng
- **Hệ thống phím tắt toàn diện**:
  - Phím `Space`: Lật thẻ trong chế độ Flip.
  - Phím `1`, `2`, `3`, `4`: Chọn nhanh đáp án trắc nghiệm (MCQ) hoặc đánh giá độ khó (Lại / Khó / Tốt / Dễ).
  - Phím `S`: Gắn / Bỏ sao thẻ hiện tại.
  - Phím `Ctrl + K`: Tìm kiếm nhanh thẻ.

---

## 4. Tính năng mới bổ sung
1. **📑 Nhân bản bộ thẻ (Clone Deck)**: Nút nhân bản nhanh giúp tạo bản sao bộ thẻ để tùy biến mà không ảnh hưởng bộ gốc.
2. **💾 Sao lưu & Phục hồi Full Backup JSON**: Xuất toàn bộ kho dữ liệu, tiến độ học, thống kê ra file JSON và khôi phục nguyên vẹn 1-click.
3. **✨ 3 Bộ thẻ mẫu phong phú sẵn có**:
   - 🇬🇧 100 Từ Vựng IELTS Cốt Lõi.
   - 💻 Thuật Ngữ Web Development & IT.
   - 🎯 Thành Ngữ Tiếng Anh Thông Dụng.