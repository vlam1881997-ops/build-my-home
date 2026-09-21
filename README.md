# Build My Home FULL V2.1 — Architectural Planner Upgrade

V2.1 kế thừa toàn bộ Design Polish/V2.0 và nâng mạnh Bước 5 thành **mặt bằng kiến trúc sơ bộ** với workspace lớn, chế độ bản vẽ kỹ thuật, tường/cửa/kích thước/ruler/trục tham chiếu/full-screen; đồng thời 3D khối có thể focus theo phòng và đổi bảng màu theo vật liệu đã chọn. Nền V2.0 vẫn giữ **khóa chung Bước 9–10, hộ gia đình động nhiều con/người thân, planner snap/collision/validator, ngân hàng có nguồn + stress test, delta vật liệu, timeline hao mòn 3D, sidebar collapse và Mobile Resilience**. `dist/core.js` vẫn được sinh từ `domain-kit/src/home.mjs`; UI và các file xuất dùng cùng một snapshot tính toán.

## Chạy ngay

Mở `dist/index.html` bằng Chrome/Edge để dùng các công cụ offline. Cách ưu tiên với Node.js 22+:

```bash
npm start
```

Mở http://localhost:8080. Không cần npm install cho bản đã đóng gói. Chỉ server cục bộ mới có route AI. Dữ liệu dự án vẫn lưu trên trình duyệt, chưa có tài khoản hoặc đồng bộ đám mây.





## V2.1 — Architectural Planner Upgrade

- Bước 5 tự thu sidebar thành icon rail, dành phần lớn màn hình cho bản vẽ. Có **Toàn màn hình**, zoom 70–240%, Fit, undo, upload bản vẽ tham chiếu.
- Hai chế độ: **Bản vẽ** (kỹ thuật sơ bộ) và **Dễ dùng** (room layout cũ).
- Bản vẽ kỹ thuật hiển thị lưới phụ 0,2m + lưới chính 1m, ruler, trục A–C / 1–5, ranh đất, footprint phương án, tường theo geometry chung, cửa đi/cửa sổ, kích thước tổng thể/phòng, Bắc, thước tỷ lệ và title block.
- Nội thất vector cho phòng khách, bếp, ngủ, WC, cầu thang, gara; thêm template Hành lang/Ban công.
- Inspector bên phải cho tên/loại/X/Y/rộng/sâu, chiều cao tầng, dày tường và công cụ thêm cửa.
- Validator tiếp tục kiểm tra chồng lấn, cầu thang liên tầng, vùng ướt, mặt thoáng, nhu cầu phòng ngủ; bổ sung cảnh báo thiếu cửa/cửa sổ.
- Vùng hướng tốt từ Bước 4 có thể bật/tắt ngay trên bản vẽ; đây chỉ là tham khảo văn hóa.
- Tải **SVG kỹ thuật** riêng cho tầng hiện tại; report/ZIP vẫn lấy cùng snapshot.
- 3D khối V2.1 nhận màu vật liệu theo lựa chọn Bước 6 và hỗ trợ focus **toàn nhà / tầng / từng phòng**. Đây vẫn là render khối mô phỏng, chưa phải phối cảnh PBR/photoreal.
- Paywall 9–10, household nhiều con/người thân, ngân hàng/stress test, vật liệu có nguồn, lifecycle 3D và Mobile Resilience của V2.0 được giữ nguyên.

Xem `V2.1_RELEASE_NOTES.md` và `V2.1_QA.md`.

## V2.0 — nền ổn định được giữ trong V2.1

- Paywall Step 9 + Step 10 dùng chung entitlement; click trực tiếp Step 10 không còn lách được luồng UI. DEV unlock chỉ chạy local.
- Banner phối cảnh/callout AI chỉ còn ở Bước 7; Ngày/Đêm chỉ điều khiển mô hình 3D.
- Hộ gia đình động: người đồng hành, nhiều con và ba/mẹ/người thân; snapshot đổi theo cấu hình hộ gia đình.
- Planner V2: snap grid 0,1/0,2/0,5 m, chống chồng, validator liên tầng/khu ướt/mặt thoáng/nhu cầu phòng ngủ, gara và ký hiệu cửa mở.
- Bước 2: ngân hàng tự điền dữ liệu công khai có nguồn khi đủ căn cứ; stress +2/+3/+5 điểm %, vẫn cho sửa tay.
- Bước 6: hiện chênh lệch chi phí ngay khi đổi gói/vật liệu.
- Bước 7: timeline Hiện tại/Năm 3/Năm 5/Năm 10 + wear overlay/bảo trì dự kiến.
- Bước 8: paywall gọn above-the-fold, sao chép số tài khoản/nội dung khi đã cấu hình.
- Sidebar có icon-rail; location chỉ lấy từ Bước 3.
- Sửa mapping checkbox Checklist MEP ở Bước 9.

Xem `V2_RELEASE_NOTES.md`, `V2_QA.md` và `PAYMENT_V2_SETUP.md`. **Paywall thương mại thật vẫn cần webhook + entitlement server-side + file premium có kiểm quyền backend; V2 không giả phần này khi chưa có thông tin nhà cung cấp thanh toán.**

## Design Polish v1.7.1 — vòng hoàn thiện giao diện hiện tại

- Nâng stepper 10 bước: số lớn hơn, bước hiện tại nổi bật, bước đã đi qua có dấu ✓ rõ ràng.
- Gom thông tin ngân sách vào sticky footer; bỏ lặp lại ngân sách/kích thước ở sidebar.
- Bước 1 dùng ảnh tham chiếu sắc nét và 3 luồng A/B/C trực quan.
- Bước 2 dùng logo ngân hàng và dữ liệu công khai có nguồn/ngày; không tự bịa lãi sau ưu đãi khi nguồn không công bố; thêm kịch bản stress lãi suất và cảnh báo dự tính không phải cam kết.
- Bước 3 thêm Leaflet + OpenStreetMap, ghim vị trí bằng tìm kiếm có chủ đích.
- Bước 4 đổi thành “Người đồng hành”, thêm con cái/ba mẹ ở chung, thẻ loại đất và la bàn bát trạch sắc nét.
- Bước 5 bổ sung ký hiệu nội thất tối giản và lớp chú thích kỹ thuật; vẫn ghi rõ đây là mặt bằng ý tưởng, không thay hồ sơ thi công.
- Bước 6 thay placeholder bằng ảnh vật liệu minh họa/thông tin sản phẩm có nguồn; nơi chưa có báo giá chính thức thì hiển thị “cần báo giá” thay vì tạo giá giả.
- Bước 7 cho chọn Ngoại thất/Phòng khách/Bếp/Phòng ngủ/WC, hiển thị phối cảnh tương ứng và AI callout; vẫn giữ mô hình 3D khối theo geometry thật.
- Bước 8 đưa paywall VietQR 99.000đ thành card lớn. QR hiện tại là **DEMO, không có tài khoản nhận và không được dùng để chuyển tiền** cho tới khi backend/webhook thật được cấu hình.
- Bước 9 khóa bằng blur overlay nếu chưa có entitlement thanh toán thật; không có nút “mở khóa giả”.
- Bước 10 PDF/Excel premium khóa theo entitlement; SVG/OBJ vẫn xuất được; Excel dùng SpreadsheetML có công thức tổng.
- Thêm `design-polish.js`, `design-polish.css`, ảnh local, cache service worker v1.7.1 và bộ QA riêng.

Xem `DESIGN_POLISH_V171_QA.md` và `SOURCE_CREDITS_V171.md` trước khi chốt production.

## Product Suite v1.7 — 5 nhóm nâng cấp đã ghép vào một bản

| Roadmap | Đã triển khai trong bản này | Giới hạn minh bạch |
|---|---|---|
| **V1.3 Official UI** | Làm lại 10 màn theo art direction đã chốt: hero, sidebar/stepper, luồng A/B/C, tài chính, vị trí, đất/phong thủy, bản vẽ, vật liệu, 3D/AI, dự toán, giám sát, bàn giao; thêm CSS responsive riêng `product-suite.css` | Chưa phải pixel-perfect 100% trên mọi trình duyệt; cần QA trực tiếp trên link production |
| **V1.4 Core Data & Logic** | Thêm `BMHStore` version 17, lưu full project + revision + snapshot id vào `localStorage`; tiếp tục tương thích `bmh-v12`; mọi thay đổi phòng/tài chính/vật liệu đi qua cùng snapshot engine | Chưa có tài khoản/cloud sync; dữ liệu vẫn theo trình duyệt/thiết bị |
| **V1.5 Bản vẽ & mô hình nhà** | Thêm room templates, thêm/giảm tầng, kéo phòng, resize trực tiếp bằng handle, sửa tọa độ/kích thước, tường/cửa, khối lượng live, SVG/OBJ đồng bộ | Mặt bằng vẫn dùng hình chữ nhật theo tim tường; chưa BIM/IFC, tường cong, mái/phần kết cấu chi tiết |
| **V1.6 Tài chính & vật liệu** | Kịch bản ngân hàng minh họa, DTI, lịch vay/giải ngân, cashflow; catalog vật liệu 3 mức; nguồn giá/ngày/vùng/URL; chi phí vòng đời 10 năm | Lãi suất/catalog mặc định là **minh họa**, không phải giá/lãi hiện hành; nguồn giá thật phải do người dùng nhập hoặc tích hợp provider sau |
| **V1.7 AI + 3D** | 3D khối theo cùng geometry, day/night UI, OBJ, mobile fallback; rule-based review có evidenceIds; thêm Vercel Function `/api/review` tùy chọn nếu cấu hình AI server-side | AI cloud chưa hoạt động nếu chưa cấu hình biến môi trường; 3D chưa photoreal/walkthrough và không xác nhận an toàn kỹ thuật |

### File mới quan trọng
- `dist/product-suite.js`: 5 nhóm nâng cấp sản phẩm và Project Store.
- `dist/product-suite.css`: lớp UI chính thức desktop/mobile.
- `api/review.js`: endpoint AI tùy chọn trên Vercel, không lộ API key ra trình duyệt.
- `PRODUCT_V17_QA.md`: checklist QA sản phẩm sau deploy.

## Sáu nhóm nâng cấp đã thực hiện

| Nhóm | Phần chạy được | Phạm vi còn lại |
|---|---|---|
| Bộ tính chung | UI, dự toán, trả nợ, báo cáo đọc cùng core; kiểm tra bundle không lệch source | Schema/database cũ vẫn là thiết kế, chưa có backend tài khoản |
| Mặt bằng & khối lượng | Diện tích hợp không cộng phần chồng lấn; tường chung tính một lần; cao/dày tường; cửa đi/cửa sổ gắn đoạn tường; trừ ô cửa; cảnh báo cửa không còn khớp | Hình chữ nhật theo tim tường; chưa đất đa giác, thang kỹ thuật, nối giao tường chuẩn BIM, mái/MEP/thép/móng |
| Dòng tiền | Vay nhiều đợt, lãi trên dư nợ đã giải ngân, phí giải ngân, thu nhập stress, chi thi công theo tháng, giữ lại bảo hành, tháng hụt tiền/quỹ | Giải ngân đầu tháng, chi xây chia đều theo thời gian nhập; chưa lịch nghiệm thu tùy ý, lãi theo ngày, ân hạn/tất toán sớm |
| Giá có nguồn | Sửa/import/export bảng giá, nguồn/URL/ngày/vùng/đơn vị, thuế/hao hụt; thiếu giá không tự bằng 0; cảnh báo vùng khác/giá cũ | Chưa tự lấy giá thị trường; báo giá thủ công chưa xác minh nhà cung cấp |
| Hồ sơ nhất quán | Một snapshot cho dự toán, trả nợ, dòng tiền, SVG, OBJ, HTML/PDF; ZIP 9 tệp với cùng mã snapshot | PDF qua In → Lưu PDF; CSV chưa phải XLSX có công thức; không phải hồ sơ thi công |
| AI & 3D | 3D khối có camera xoay/zoom/chọn tầng, lỗ cửa, OBJ; nhận xét quy tắc + OpenAI adapter server và nhập/xuất JSON AI | Chưa phối cảnh photoreal/walkthrough; AI cần key/model ở máy chủ, chưa live-test provider |

## Dùng các tính năng mới ở đâu?

1. **Bước 5:** giữ thao tác kéo/sửa phòng. Cuộn xuống “Tường, cửa & khối lượng chung”, nhập chiều cao/dày tường, thêm cửa theo đoạn tường. Tên đoạn gồm tầng, phương, tọa độ và chiều dài.
2. **Bước 2:** cuộn xuống “Tiền theo tiến độ thi công”. Nhập thời gian xây, phần giữ lại, phí vay và hệ số thu nhập. “Sửa lịch nhận tiền vay”: mỗi dòng `tháng,phần trăm`, tổng 100%.
3. **Bước 6:** sửa giá từng hạng mục. Chọn DEMO hoặc báo giá người dùng nhập; điền nguồn, ngày và địa phương. Để trống đơn giá nghĩa là chưa có giá; nhập 0 nghĩa là giá bằng 0 có chủ đích.
4. **Bước 7:** kéo mô hình 3D để xoay, lăn chuột/+/− để zoom, chọn tầng. Có mô phỏng chi phí sở hữu 10 năm với lạm phát/vận hành/bảo trì do người dùng nhập.
5. **Bước 8:** xem tổng và cảnh báo theo snapshot. Phòng chồng nhau/cửa sai làm hồ sơ có nhãn BẢN NHÁP; thiếu giá làm tổng có nhãn CHƯA ĐỦ GIÁ.
6. **Bước 10:** “Tải ZIP hồ sơ” gồm `snapshot.json`, `du-toan.csv`, `tra-no.csv`, `dong-tien.csv`, `khoi-luong.csv`, `mat-bang.svg`, `mo-hinh.obj`, `bao-cao.html`, `DOC_TOI.txt`. Mở HTML và in để lưu PDF.

Khi thay đổi đầu vào, mã snapshot đổi; nhận xét AI cũ được đánh dấu cũ. Mã dùng nhận biết phiên bản dữ liệu, không phải chữ ký xác thực hay mã bảo mật.

## Cấu hình AI thật trên máy ông

1. Sao chép `.env.example` thành `.env` ở gốc dự án.
2. Điền `OPENAI_API_KEY` và `OPENAI_MODEL` của tài khoản có quyền gọi Responses API và Structured Outputs. Bộ code không cố định một model hoặc tuyên bố mọi model đều hỗ trợ.
3. Chạy `npm start`, vào bước 7, bấm “Gửi dữ liệu kiểm tra cho AI”. App hỏi trước khi gửi.
4. Server chỉ gửi các nhận xét dữ liệu ngân sách/hình học/dòng tiền/nguồn giá và mã snapshot. Không gửi tên, địa chỉ, năm sinh, file bản vẽ hoặc API key cho trình duyệt.

Server local nhận tối đa một yêu cầu cùng lúc, 5/phút, 32KB/request, kiểm tra Origin và Host; có timeout. Khóa API chỉ nằm trong `.env` của máy chủ, bị gitignore và không đưa vào dist. Không có key/model thì báo chưa cấu hình, không giả kết quả.

**Giới hạn triển khai:** server hiện chỉ bind `127.0.0.1`, dành cho ông chạy cục bộ. Chưa phải dịch vụ AI công khai có đăng nhập/quota từng khách. GitHub Pages không chạy Node server; trên Pages dùng “Tải yêu cầu AI” rồi nhập JSON nhận xét, hoặc chạy bản local. Không đưa key vào app.js để cố chạy AI trực tiếp trên Pages.

Adapter dùng [Responses Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses). Đã test adapter bằng response giả lập; chưa gọi live bằng API key. AI có thể giải thích sai; kiểm tra mã bằng chứng chỉ bảo đảm tham chiếu tồn tại, không bảo đảm mọi câu nhận xét đúng chuyên môn. AI không sửa công thức/giá và không xác nhận công trình an toàn.

## GitHub Pages

Đưa toàn bộ nội dung thư mục dự án lên gốc repository. Settings → Pages → Source → GitHub Actions. Push nhánh main hoặc chạy workflow thủ công. Workflow kiểm tra source/bundle/tests rồi chỉ xuất bản **dist/**.

```bash
git init
git add .
git commit -m "Upgrade Build My Home to shared engine v1.2"
git branch -M main
git remote add origin https://github.com/YOUR_ACCOUNT/build-my-home.git
git push -u origin main
```

Thay YOUR_ACCOUNT. Chưa có repository/website được tạo hoặc triển khai thay ông. Hướng dẫn chính thức: [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Sửa code và kiểm tra

```bash
npm run build
npm test
```

- `domain-kit/src/home.mjs`: engine được UI dùng — hình học, dự toán, nguồn giá, dòng tiền, snapshot, xác nhận AI.
- `domain-kit/src/finance.mjs`, `estimate.mjs`, `lifecycle.mjs`: hàm nghiệp vụ chung; hàm khoản vay giải ngân một lần cũ vẫn giữ cho tương thích thư viện.
- `scripts/build-core.cjs`: sinh `dist/core.js`. Sau khi sửa domain hãy chạy build và commit core.js; CI kiểm tra bundle trùng source.
- `dist/app.js`: khung giao diện gốc, thao tác phòng, lưu dự án. Bộ tính dự toán/vay độc lập cũ đã bỏ.
- `dist/upgrade.js`: adapter/UI mới, báo cáo, giá, cửa và AI.
- `dist/scene3d.js`: hình học khối, camera phối cảnh Canvas, OBJ.
- `scripts/serve.cjs`, `ai-provider.cjs`: server local và kết nối AI.

69/69 test tự động đã đạt cho Build My Home V2.0. Kiểm tra HTTP và ZIP ở `RELEASE_VALIDATION.json`. **Chưa có QA trình duyệt thật**: tải Chromium bị timeout. Không diễn giải kiểm thử Canvas giả lập thành kiểm tra hình ảnh/chuột/chạm trên thiết bị thực.

## Dữ liệu v1.1 và lưu phương án

Bản mới ưu tiên `bmh-v12`; nếu chưa có, đọc và kiểm tra `bmh-v1`. Không xóa bản lưu v1 cũ. Có thể nhập JSON v1; các trường giá/tường/cửa/dòng tiền mới được bổ sung mặc định. Phương án cũ tính lại bằng engine 1.2 và vẫn hiển thị tổng lịch sử để thấy khác biệt. Tổng v1.2 có thể khác v1.1 do đổi mô hình khối lượng, không phải cam kết giữ giá cũ.

Sao lưu JSON trước khi nâng cấp hoặc đổi tên miền. Ảnh/PDF tham chiếu vẫn chỉ giữ trong phiên, không nằm trong JSON. Dữ liệu không được đồng bộ nhiều thiết bị.

## Những phần chưa thể gọi là hoàn chỉnh thương mại

Giá mặc định là DEMO. Người dùng có thể nhập báo giá thật nhưng phần mềm chưa kiểm chứng tính thật/đầy đủ của báo giá. Dòng kết cấu vẫn là dự trù theo diện tích, không phải bóc thép/bê tông/móng. Hình học mới theo tim tường, chưa xử lý thể tích nút giao theo chuẩn thi công. Chưa tính đủ mái/MEP/nội thất/giấy phép; trạng thái concept_estimate không có nghĩa tổng chi phí đã đầy đủ. Không có tài khoản, thanh toán, nguồn giá tự động, chuyên gia thẩm định, phong thủy tính toán hoặc nhà thầu kết nối.

Tài liệu trong `domain-kit/docs/` và `docs/WEB_V1_GUIDE.md` là đặc tả/lịch sử trước nâng cấp. **README này và CHANGELOG_v1.2.md mô tả trạng thái hiện tại.**

## Vercel

Repository dùng `npm run build:vercel` để tạo `public/` từ `dist/`; Vercel publish `public/`. Khi import vào Vercel, giữ Root Directory ở gốc repository và dùng Framework Preset `Other`. Chi tiết xem `VERCEL_DEPLOY.md`.


## Vercel hotfix 1.2.1

Vercel dùng `npm run build:vercel` để tạo thư mục `public/` từ toàn bộ `dist/`, tránh trường hợp HTML lên được nhưng `app.js`, `styles.css` và manifest bị 404.

### Mobile resilience (giữ nguyên trong Product Suite v1.7)
Bản v1.3 bổ sung tối ưu trình duyệt điện thoại/in-app: bảng vuốt ngang, safe-area, camera upload, autosave khi đổi tab/reload, 3D fallback 3 giây và xuất Excel/iOS share. Khi test trên iPhone, PDF được lưu bằng thao tác In → Chia sẻ → Lưu vào Tệp; Excel/CSV/ZIP ưu tiên Web Share nếu Safari hỗ trợ.
