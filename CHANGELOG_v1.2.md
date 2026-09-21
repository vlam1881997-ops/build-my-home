# v1.2 — thay đổi so với v1.1

- Thay bộ dự toán và trả nợ frontend bằng adapter engine chung; CI so byte bundle với source.
- Tính diện tích hợp trên từng tầng; phân đoạn tường dùng chung; hỗ trợ cao/dày tường, cửa đi/cửa sổ, trừ diện tích cửa. Hình học chưa đúng có nhãn draft thay vì báo đã hợp lệ.
- Giải ngân khoản vay theo tháng, phí giải ngân, giữ lại bảo hành và dòng tiền toàn kỳ. Không cộng hạn mức vay vào tiền mặt đầu kỳ rồi cộng lại khi nhận.
- Nhập/sửa/export/import báo giá có nguồn, ngày, đơn vị, vùng, thuế và hao hụt. Nguồn nhập chưa được hệ thống xác minh.
- Snapshot cùng engine version được dùng cho UI, CSV, HTML/PDF, SVG và OBJ. ZIP hồ sơ tạo trong trình duyệt bằng UTF-8/CRC32.
- Hình khối 3D thực với tọa độ XYZ, tường có lỗ cửa, xoay/zoom/chọn tầng và OBJ. Chưa có ảnh phối cảnh hoàn thiện.
- Kết nối AI server-only qua Responses API; kiểm tra output, evidenceIds và snapshot. Có luồng JSON khi dùng web tĩnh. Chưa gọi live provider trong môi trường bàn giao.
- Giữ 10 bước, thao tác phòng, checklist, sổ chi, lưu phương án, backup JSON. Bản lưu cũ không bị xóa; phương án cũ được tính lại bằng engine mới có nhãn.
- Cache offline tăng phiên bản v12 và bổ sung các script mới.

Không thêm thông tin nhà thầu giả, QR thu tiền hoặc đánh giá chuyên gia giả. Các hợp đồng API/database giai đoạn đầu vẫn nằm trong domain-kit để phát triển sau.

## Vercel deployment hotfix

- Thêm `vercel.json` để Vercel build từ gốc repository nhưng xuất bản đúng thư mục `dist/`.
- Khắc phục tình trạng deployment báo Ready nhưng `/app.js` và `/styles.css` trả 404 khiến trang trắng.
- Thêm `VERCEL_DEPLOY.md` với cấu hình import/redeploy và checklist HTTP 200.
- Không thay đổi UI, công thức tính, 10 bước nghiệp vụ hay dữ liệu mẫu.

## v1.2.1 — Vercel static output hardening
- Tạo bước build riêng `npm run build:vercel`.
- Sao chép toàn bộ `dist/` sang `public/` trước khi Vercel publish.
- Đổi `outputDirectory` sang `public` để tránh trường hợp chỉ `index.html` được phục vụ nhưng `app.js`, `styles.css` và `manifest.webmanifest` bị 404.
- Xác minh 61/61 test pass và kiểm tra đủ toàn bộ entrypoint static.

## v1.3.0 — Mobile resilience
- Tối ưu bảng nhiều cột cho thao tác vuốt ngang trên màn hình dọc, có vùng cuộn có thể focus.
- Thêm nút chụp ảnh trực tiếp bằng camera ở Bước 5 bên cạnh chọn ảnh/PDF từ thư viện.
- Tăng độ bền lưu dữ liệu: lưu sau nhập liệu, khi ẩn tab, pagehide/beforeunload và hiển thị thời điểm lưu.
- Thêm chế độ 3D nhẹ: tự dùng ảnh phối cảnh tĩnh khi WebGL không ổn định, thiết bị di động cấu hình thấp hoặc thời gian dựng vượt 3 giây; vẫn có nút thử 3D.
- Tăng độ tương thích tải tệp iOS: tải bằng anchor gắn DOM và dùng Web Share cho CSV/Excel/ZIP khi khả dụng.
- Thêm xuất Excel tương thích (.xls XML) ở Bước 8 và Bước 10; PDF vẫn dùng luồng in/lưu PDF của trình duyệt.
- Bổ sung safe-area, kích thước nút chạm, cỡ chữ input 16px để tránh Safari tự zoom.
- Nâng cache service worker lên v13-mobile để tránh giữ asset cũ.


## v1.7.0 — Product Suite (hợp nhất V1.3 → V1.7)
- Rebuild lớp UI 10 bước bằng `product-suite.css/js`, bám bộ PNG chốt: hero, flow cards, stepper, tài chính/DTI, vị trí, đất/phong thủy, bản vẽ, vật liệu, 3D/AI, dự toán, giám sát, bàn giao.
- Thêm Project Store v17 trên localStorage với full state, revision, snapshot id và tương thích state v1.2/v1.3.
- Nâng floor planner: room templates, thêm/giảm tầng, kéo + resize bằng handle, live takeoff tường/sơn/cửa/diện tích; giữ SVG/OBJ/snapshot đồng bộ.
- Nâng tài chính: selector kịch bản ngân hàng **minh họa**, DTI, cashflow, lịch trả nợ/giải ngân dùng cùng engine. Không tuyên bố lãi suất hiện hành.
- Nâng vật liệu: catalog UX ba mức, thay đổi mức hoàn thiện làm dự toán DEMO cập nhật; bảng nguồn giá có source/date/region/URL vẫn là nguồn quyết định cho báo giá thật.
- Nâng 3D/AI: day/night UI, local evidence-based review, cloud AI qua `/api/review` khi Vercel có `OPENAI_API_KEY`/`OPENAI_MODEL`, không đưa key vào frontend.
- Giữ Mobile Resilience: horizontal tables, camera input, autosave lifecycle, iOS file flows, 3D fallback, safe-area.
- Nâng service-worker cache lên `bmh-interface-v17-product-suite`; Vercel output bắt buộc có product-suite assets.
- 65/65 automated tests PASS; HTTP static smoke test `/`, `/app.js`, `/styles.css`, `/product-suite.js`, `/product-suite.css`, `/manifest.webmanifest` trả 200 trên local server.


## v1.7.1 — Design Polish theo mockup + dữ liệu có nguồn
- Nâng global visual system: stepper/tick/current state, card shadow/radius, sticky footer ngân sách, loại bỏ sidebar summary trùng lặp.
- Bước 1: ảnh hero/flow card local sắc nét và bố cục A/B/C ít chữ hơn.
- Bước 2: logo ngân hàng, nguồn/ngày dữ liệu, stress +3 điểm %, cảnh báo lãi suất tương lai có thể vượt dự tính; xuất lịch trả nợ Excel.
- Bước 3: Leaflet/OpenStreetMap + Nominatim geocoding theo thao tác người dùng.
- Bước 4: Người đồng hành + con cái + ba mẹ; soil cards; compass rõ nét.
- Bước 5: furniture symbols và chú thích kỹ thuật trên SVG ý tưởng.
- Bước 6: material gallery có ảnh/sản phẩm/nguồn; không gán giá giả khi chưa có báo giá.
- Bước 7: room/facade visual selector + AI callout, giữ 3D geometry mode.
- Bước 8: paywall VietQR 99.000đ thành card nổi bật; QR chỉ là demo không nhận tiền cho tới khi có recipient/webhook thật.
- Bước 9: blur/lock khi chưa có entitlement; không giả webhook.
- Bước 10: premium PDF/Excel lock; SVG/OBJ giữ miễn phí; SpreadsheetML Excel có công thức.
- Cache service worker nâng `bmh-interface-v171-design-polish`.
- 67/67 automated tests pass; smoke test local các entrypoint và asset chính trả HTTP 200.
- Browser/device visual QA vẫn cần chạy trên link production, đặc biệt iPhone Safari, Facebook/Zalo in-app browser.


## v2.0.0 — Design & Planner Stabilization
- Vá paywall: Bước 9 + Bước 10 dùng cùng entitlement, Stepper khóa cả hai; DEV unlock chỉ local.
- Xóa banner 3D khỏi mọi bước trừ Bước 7; Ngày/Đêm chỉ áp dụng canvas 3D.
- Hộ gia đình động: người đồng hành, tối đa 8 hồ sơ con và 6 người thân trong UI; snapshot core fingerprint có household chi tiết.
- Planner: snap grid, collision prevention, validator ranh đất/cầu thang/khu ướt/mặt thoáng/nhu cầu phòng ngủ, gara, layer phong thủy tham khảo và ký hiệu cửa mở 90°.
- Ngân hàng auto-fill dữ liệu công khai có nguồn khi đủ căn cứ; thêm stress +2/+3/+5.
- Vật liệu hiển thị delta trước/sau bằng cùng snapshot engine.
- 3D thêm timeline hao mòn 0/3/5/10 và chi phí bảo trì dự kiến; vẫn tách phối cảnh tham khảo khỏi geometry thật.
- Bước 8 nâng paywall above-the-fold + copy account/content; production fail-closed nếu chưa có entitlement verified.
- Sidebar collapse/icon rail, location thống nhất từ Bước 3, map tile fallback.
- Sửa bug mapping key/label của checklist Bước 9.
- Thêm `v2.js`, `v2.css`, `V2_RELEASE_NOTES.md`, `V2_QA.md`, `PAYMENT_V2_SETUP.md`.
- 69/69 automated tests PASS. Browser/device visual QA vẫn cần chạy trên production.
