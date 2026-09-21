# Vercel deploy

Project Settings → Build and Deployment:

- Framework Preset: Other
- Build Command: `npm run build:vercel`
- Output Directory: `public`
- Install Command: mặc định / `npm install`

Sau khi Push GitHub, kiểm tra Deployment mới chuyển `Building → Ready`. Nếu browser vẫn thấy UI cũ, hard refresh; Service Worker V3.1 cũng tự xóa cache cũ sau activate.
