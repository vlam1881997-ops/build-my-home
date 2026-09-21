# Deploy Build My Home v1.2.1 lên Vercel

Bản 1.2.1 dùng một thư mục output riêng `public/` cho Vercel. Khi Vercel build, lệnh `npm run build:vercel` sẽ:

1. Sinh lại `dist/core.js` từ domain core.
2. Xóa `public/` cũ.
3. Sao chép toàn bộ website trong `dist/` sang `public/`.
4. Kiểm tra bắt buộc các file `index.html`, `app.js`, `styles.css`, `core.js`, `scene3d.js`, `upgrade.js`, `manifest.webmanifest` đều tồn tại.

`vercel.json` đặt:

- Framework: Other
- Build Command: `npm run build:vercel`
- Output Directory: `public`

## Cấu hình Project trên Vercel

- Root Directory: `./`
- Không override Build Command/Output Directory trong dashboard nếu không cần.
- Nếu dashboard đang có Override cũ, tắt Override để `vercel.json` làm nguồn cấu hình.

Sau deployment mới, kiểm tra trực tiếp:

- `/`
- `/app.js`
- `/styles.css`
- `/manifest.webmanifest`

Tất cả phải trả HTTP 200.
