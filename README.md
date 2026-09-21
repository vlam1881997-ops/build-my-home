# Build My Home V2.2 — Refactored Core

Bản V2.2 dừng hoàn toàn cách vá chồng file của V2/V2.1 và chuyển về một runtime sạch.

## Kiến trúc deploy

`src/*.js` -> `npm run build` -> `dist/app.js`

`src/styles.css` -> `dist/styles.css`

Vercel chạy `npm run build:vercel` và copy bản build sạch sang `public/`.

### Public runtime chỉ còn

- `index.html`
- `app.js`
- `styles.css`
- `sw.js`
- `manifest.webmanifest`
- `assets/`

Không còn `v2.js`, `v21.js`, `design-polish.js`, `product-suite.js`, `mobile-resilience.js`, `upgrade.js`, `core.js` hoặc nhiều lớp CSS ghi đè nhau.

## Controller duy nhất

- State: `BMH.state`
- Điều hướng: `BMH.navigateTo(step)`
- Paywall: `BMH.state.access.paid`
- Planner pointer controller: một `pointerdown`, một `pointermove`, một `pointerup`
- Render lifecycle: `BMH.render()` duy nhất

## Điểm đã sửa từ V2.1

- Banner 3D chỉ tồn tại ở Bước 7; Bước 1 và Bước 5 không render component này.
- Bình Dương cố định đúng tọa độ trung tâm `11.160, 106.650`; Leaflet có `invalidateSize()` và fallback khi tile lỗi.
- La bàn Bát trạch quay lại Bước 4; thành viên gia đình hỗ trợ nhiều con và nhiều người thân.
- Planner Bước 5 bỏ watermark đè bản vẽ; có grid 0,2m, kích thước, cửa đi, cửa sổ, nội thất, collision và snap.
- Timeline Năm 3/5/10 thay đổi hình ảnh minh họa bằng overlay/filter chứ không chỉ đổi chữ.
- Bước 8 khóa nút Next nếu chưa thanh toán; Bước 9 và Bước 10 dùng cùng entitlement.
- Production không có nút giả mở khóa. Nút DEV chỉ hiện trên localhost.

## Chạy local

```bash
npm run build
PORT=8093 npm start
```

Mở `http://127.0.0.1:8093`.

## Test

```bash
npm test
```

Bộ test gồm domain-kit deterministic logic và các kiểm tra refactor runtime.

## Giới hạn cố ý

- Chưa kết nối thanh toán thật / webhook ngân hàng.
- QR hiện là QR demo và ghi rõ demo.
- Bản vẽ Bước 5 là **mặt bằng kiến trúc sơ bộ**, không phải hồ sơ thi công.
- 3D ở Bước 7 là mô hình khối liên kết mặt bằng + ảnh phối cảnh tham khảo, chưa phải render photoreal/PBR.
- Không dùng AI API trong runtime V2.2.
