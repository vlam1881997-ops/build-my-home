# Deploy Build My Home v1.7 lên Vercel

## Project Settings
- Root Directory: `./`
- Framework Preset: `Other`
- Build Command: `npm run build:vercel`
- Output Directory: `public`
- Install Command: **để mặc định** hoặc `npm install`; tuyệt đối không đặt `./`.

`vercel.json` đã khai báo build/output và optional function `api/review.js`. Khi build, `scripts/prepare-vercel.cjs` sao chép toàn bộ `dist/` sang `public/` và kiểm tra các entrypoint bắt buộc.

## Sau deploy phải kiểm tra
- `/`
- `/app.js`
- `/styles.css`
- `/mobile-resilience.js`
- `/product-suite.js`
- `/product-suite.css`
- `/manifest.webmanifest`

Tất cả phải HTTP 200 và Console không được có asset 404.

## GitHub / Hobby
Nếu repo Private trên Vercel Hobby, commit author phải khớp tài khoản có quyền với project. Với repo `build-my-home`, nên cấu hình Git **local** cho repo thay vì đổi global của repo khác.

## AI tùy chọn trên Vercel
Trong Project → Settings → Environment Variables:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

Không cấu hình thì nút AI cloud phải báo `AI_NOT_CONFIGURED`; app vẫn có phân tích cục bộ theo rule/evidence. Không đưa key vào `dist/`, `public/` hay GitHub.

## Domain
DNS/domain độc lập với code. Khi Vercel báo `Valid Configuration`, không chỉnh DNS chỉ để sửa lỗi JS/CSS. Nếu UI trắng, kiểm tra Console và các URL asset ở trên trước.
