# Deploy Build My Home v1.2 lên Vercel

Bản này là website static thuần HTML/CSS/JavaScript. Toàn bộ website chạy từ thư mục `dist/`.

## Cấu hình đã chốt trong mã nguồn

Tệp `vercel.json` ở gốc dự án buộc Vercel dùng:

- Framework: Other / không framework
- Build command: `npm run build`
- Output directory: `dist`

Vì vậy Vercel sẽ xuất bản `dist/index.html`, `dist/app.js`, `dist/styles.css`, `dist/core.js`, `dist/scene3d.js`, `dist/upgrade.js` và `dist/assets/*` cùng một gốc URL. Điều này tránh lỗi trang trắng do `app.js` và `styles.css` trả về 404.

## Khi import repository GitHub vào Vercel

1. Root Directory: để `./` (gốc repository).
2. Framework Preset: `Other` hoặc để Vercel đọc `vercel.json`.
3. Không đặt Output Directory thủ công sang thư mục khác. `vercel.json` đã đặt là `dist`.
4. Deploy lại commit mới nhất.

## Kiểm tra sau deploy

Mở lần lượt:

- `/`
- `/styles.css`
- `/app.js`
- `/core.js`
- `/assets/icon.svg`

Tất cả phải trả về HTTP 200. Nếu project Vercel cũ từng lưu cấu hình Override, vào Project Settings -> Build and Deployment và bỏ các override trái với `vercel.json`, sau đó Redeploy.

## Lưu ý

`npm run start` là server local dành cho chạy trên máy tính và endpoint AI cục bộ. Bản deploy Vercel hiện tại xuất bản phần static trong `dist/`; không đưa API key vào JavaScript phía trình duyệt.
