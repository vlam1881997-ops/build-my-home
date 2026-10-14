# C08 — validation scope, 09/10/2026

Software review checkpoint; chưa nghiệm thu commercial/thi công. Source A based C0719a8453, B imported ce28e327; checkpoint SHA lấy từ PR37/git log. `source-hashes.json` ghi source/test/build inputs của patch.

| Kiểm tra | Kết quả | Giới hạn |
|---|---|---|
| npm test/build/syntax Node22.23.3 |457/457;0fail/skip/cancel|source C08, synthetic/mocked providers; không thay chuyên môn/hình24style|
| Native editor desktop/mobile |đạt|lượt B90 trước ce guard/timestamp/UI wording; editor log có excerpt|
| Commercial desktop/mobile final Bce+A |đạt1440×1000 và390×844;0pageerrors/no overflow|lượt tái xuất cuối Node24.19.0 sau môi trường phục hồi; các lượt22 trước cũng đã đạt|
| PDF/SVG |32A3 vector420×297mm, chữ/revision,32SVG,10outputhashes khớp|từng trang được render và decode; không KTS/KS duyệt công trình|
| DXF |3files, INSUNITS4/176m²/6vertices,37°chair,0auditerrors/0fixes|ezdxf1.4.4 check-only; chưa LibreCAD manualmeasure|
| Native B GLB |parseactualgeometry,8chairmeshes/worldbounds/inverse37°/localdims/3unequallevels/IDs/revision đạt|GLBbinary12MB chưapublish, validationSHA+cách tái tạo được lưu|
| Privacy |default publicpack không có synthetic privatefinance/ownerBirth/rawsurvey; publicquote allowlist có ca unit|specific canaries, không phải exhaustiveprivacy/securityaudit|
| Security |0matches45changed source files cho mẫu token/privatekey được nêu; audit1moderate dev esbuild|CodexSecurity officialpreflight unavailable; scan chưa hoàn tất|
| Vercel live |blocked403 quyềnproject/team|temporarybypass retry qua connection khác bị automaticapprovalreview từ chối; không workaround/protectionchange|

Manual PDF layout review trên8montages của bản native cuối: tất cả trang1–32 đã xem, không thấy cắt mép/đè chữ/lỗi font. Trang1–4 cover/site/plans;5–17 schedules/plans;18–23 elevations/sections;24–27 stairs/lift/roof;28–31 toàn bộBOQ;32 technicalmissing register. Bảng đồ có ID37°/localsize, BOQmissing và notice chưa thi công hiện rõ. Bản render cũ khác pixel nên đã xem lại32trang cuối, không suy acceptance từ pixelcompare. Renderer từng trả PNGtruncated mặc dù exit0; page28 được render riêng lại và kiểm decode thành công. PNG/montages là QA scratch; ZIP chứa nativevectorPDF để reviewer xem/in100%.

Reproduce (QA dependencies có sẵn, không thêm appdependency):

```sh
# Node22 runtime, existing npm dependencies
npm test
npm run build
# QA environment supplies Playwright/Chromium and its installed renderer/fonts
BMH_BROWSER_OUTPUT=/tmp/bmh-task-a node tests/team-a-commercial.browser.cjs
python tests/team-a-export-qa.py /tmp/bmh-task-a --render
```

`tests/team-a-commercial.browser.cjs` blocks external/paid writes, uses native B resolver and GLTFLoader; no defaultfurniture injection. Outputfolder generated only, package reset to avoid files from previous exports. GLB can be recreated here; sourcefixture defined in test and A1-fixture.json, raw fixture/private finance canaries excluded from publishedZIP.

Missing KS/MEP/model lift/quotes/Bắc/planning/bankterms remain unknown/provisional/awaiting-review. Code gates và dữ liệuprofessional/signoff/config/visual phải đóng riêng. Bảnh70blobs imported byte-for-byte;48stylePNGs vẫn candidate pending, không chứng minh24style được duyệt.
