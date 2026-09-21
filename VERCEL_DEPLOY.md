# Deploy V2.2 lên Vercel

Project Settings:

- Framework Preset: `Other`
- Build Command: `npm run build:vercel`
- Output Directory: `public`
- Install Command: để mặc định hoặc `npm install` — KHÔNG đặt `./`

Sau khi Push GitHub, kiểm tra Build Logs phải có:

`Built V2.2`

`Prepared clean V2.2 Vercel output`

Sau deploy, thử trực tiếp:

- `/app.js` -> 200
- `/styles.css` -> 200
- `/manifest.webmanifest` -> 200

Các URL cũ như `/v21.js`, `/v2.js`, `/design-polish.js` phải trả 404. Đó là trạng thái đúng của refactor.
