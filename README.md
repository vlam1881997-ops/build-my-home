# Build My Home — Official V3.1

Bản dựng lại theo bộ 10 mockup chính thức: giao diện được coi là spec, còn các tính năng cốt lõi được cắm vào đúng component thay vì patch DOM chồng lớp.

## Runtime production

`public/` chỉ có một bundle JavaScript (`app.js`) và một stylesheet (`styles.css`) cùng asset tĩnh. Không có `v2.js`, `v21.js`, `design-polish.js` hay lớp patch legacy.

## 10 bước hiện có

1. Khởi tạo theo 3 luồng: ảnh mẫu / bản vẽ / bắt đầu từ đầu.
2. Tài chính, lịch trả nợ, DTI và stress test lãi suất.
3. Vị trí + Leaflet/OpenStreetMap, fallback tọa độ cục bộ.
4. Đất, địa chất, household động nhiều con/người thân, Bát Trạch tham khảo.
5. Mặt bằng kiến trúc sơ bộ: grid, dimension, furniture, cửa/cửa sổ, drag/resize, collision, SVG export.
6. Gói vật liệu: ảnh thật/local, lựa chọn vật liệu, tác động dự toán.
7. 3D phương án dạng khối + phối cảnh tham khảo + timeline hao mòn 0/3/5/10 năm.
8. Dự toán + Paywall 99.000đ UI. Production mặc định khóa cho tới khi có xác nhận thanh toán server-side.
9. Giám sát thi công + checklist MEP.
10. Hồ sơ bàn giao + XLS/SVG/JSON/ZIP.

## Chạy local

```bash
npm test
npm run build
python3 -m http.server 8090 -d dist
```

Trong local có thể mở trực tiếp một bước để QA: `?step=5`. Thêm `&unlock=1` để kiểm Bước 9–10.

## Deploy Vercel

- Build Command: `npm run build:vercel`
- Output Directory: `public`
- Install Command: mặc định (`npm install`), không đặt `./`.

## Ranh giới production

- Bản vẽ là **mặt bằng kiến trúc sơ bộ**, không thay hồ sơ thi công do KTS/kỹ sư kiểm tra và chịu trách nhiệm.
- Lãi suất ngân hàng trong app là kịch bản tham khảo, không phải cam kết hiện hành.
- Thanh toán production cần cấu hình tài khoản nhận tiền + provider/webhook và entitlement server-side; không dùng localStorage làm quyền truy cập.
