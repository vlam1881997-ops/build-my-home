# Product QA — Build My Home v1.7

## 1. Official UI 10 bước
- Mở lần lượt Bước 1 → 10 trên desktop 1440/1920px; không có card tràn, text cắt, stepper đè nhau.
- Kiểm tra Bước 1 đủ Luồng A/B/C; Bước 2 DTI/bank scenario; Bước 5 editor; Bước 6 material catalog; Bước 7 3D/AI; Bước 8 estimate; Bước 9 checklist; Bước 10 exports.
- Trên mobile 320–430px, kiểm tra thêm theo `MOBILE_QA.md`.

## 2. Project Store v17 / autosave
1. Nhập tiền, khu đất, năm sinh, đổi vật liệu, sửa phòng.
2. Reload/pull-to-refresh/chuyển tab rồi mở lại.
3. Kiểm tra `localStorage` có `bmh-project-store-v17` và dữ liệu khôi phục đúng.
4. Tải backup JSON, import lại; dữ liệu cốt lõi phải khớp.

## 3. Floor planner / quantities
- Thêm room template; kéo phòng; resize bằng handle góc phải dưới; phím mũi tên dịch 0,1m.
- Thêm tầng, giảm tầng; đảm bảo phòng tầng bị xóa không còn trong SVG/3D.
- Tạo 2 phòng chồng lấn để xác nhận cảnh báo; undo khôi phục.
- Thêm cửa/cửa sổ; kiểm tra `doorArea/windowArea`, SVG và OBJ cùng snapshot.

## 4. Finance / materials
- Đổi khoản vay, thu nhập, reserve và bank scenario; DTI/lịch trả nợ/cashflow phải thay đổi ngay.
- Chọn Tiết kiệm/Tiêu chuẩn/Cao cấp và material cards; dự toán DEMO thay đổi.
- Thay một dòng giá thành manual quote có source/date/region; xác nhận tier không nhân báo giá thủ công.
- Export CSV và so tổng với Bước 8.

## 5. AI / 3D
- Local review: bấm “Phân tích cục bộ”, phải có evidenceIds và không khẳng định an toàn kỹ thuật.
- Cloud AI không cấu hình: phải báo chưa sẵn sàng, không tạo response giả.
- Nếu cấu hình Vercel Environment Variables: test `/api/review` qua UI; không xuất key trong Network/HTML/JS.
- 3D: rotate/zoom/floor filter; mobile yếu chuyển fallback; OBJ tải được.

## 6. Vercel / production smoke
- Deployment source: GitHub `main`, status Ready.
- `/`, `/app.js`, `/styles.css`, `/product-suite.js`, `/product-suite.css`, `/manifest.webmanifest` HTTP 200.
- Custom domain Valid Configuration; không còn asset 404 trong Console.
- Service worker cache name: `bmh-interface-v17-product-suite`.

## Acceptance hiện tại
- Automated tests: 65/65 PASS.
- Static HTTP smoke: PASS local.
- Device/browser QA thật: vẫn phải chạy trên iPhone Safari, Android Chrome, Facebook/Zalo in-app browser sau khi deploy.
