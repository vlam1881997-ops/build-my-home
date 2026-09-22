# Mobile QA — Build My Home v1.7 (kế thừa Mobile Resilience v1.3)

## Thiết bị cần test thật
- iPhone Safari (màn hình dọc + ngang).
- Android Chrome tầm trung.
- Facebook in-app browser.
- Zalo in-app browser.

## Luồng 1 — Dữ liệu 10 bước
1. Nhập Bước 1–4, dừng ở một ô số/text khoảng 1 giây.
2. Chuyển app, khóa màn hình, quay lại.
3. Pull-to-refresh.
4. Mở lại URL.
5. Xác nhận tiền, diện tích, vị trí, năm sinh và step hiện tại còn nguyên.

## Luồng 2 — Bảng rộng
- Bước 6, 8 và bảng sổ chi ở Bước 9: vuốt ngang bằng một ngón, trang không bị kéo vỡ layout.
- Kiểm tra hint “Vuốt ngang →” chỉ xuất hiện khi bảng rộng hơn khung.

## Luồng 3 — Camera / thư viện
- Bước 5: Chọn ảnh/PDF từ thư viện.
- Bước 5: Chụp ảnh bằng camera sau.
- Tệp >20 MB hoặc định dạng không hợp lệ phải bị từ chối.

## Luồng 4 — 3D fallback
- Máy yếu / WebGL không ổn định phải thấy ảnh phối cảnh tĩnh và nút “Vẫn thử mô hình 3D”.
- Máy đủ mạnh: 3D tải dưới 3 giây.
- Nếu dựng >3 giây: tự chuyển sang ảnh tĩnh.

## Luồng 5 — Xuất file
- Bước 8/10: PDF dùng luồng In → Chia sẻ → Lưu vào Tệp trên iPhone.
- Excel (.xls) mở được trong Excel/Numbers/Sheets.
- CSV/ZIP trên iOS ưu tiên Share Sheet nếu Safari hỗ trợ Web Share files.
- Không có popup tự bật khi người dùng chưa bấm nút.

## Acceptance
- Không có scroll ngang toàn trang ở viewport 320–430 px.
- Nút thao tác chính tối thiểu ~44 px chiều cao trên mobile.
- Input không bị Safari zoom khi focus.
- Reload không làm mất dữ liệu đã nhập.
- Không có lỗi 404 với app.js, styles.css, mobile-resilience.js, product-suite.js, product-suite.css, manifest.webmanifest.
