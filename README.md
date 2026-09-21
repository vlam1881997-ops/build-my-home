# Build My Home FULL v1.2.1 — bộ tính chung và hồ sơ nhất quán

Bản nâng cấp từ FULL v1.1. Giao diện 10 bước nay dùng **bộ tính chung thật** từ `domain-kit/src/home.mjs`; `dist/core.js` được sinh từ nguồn đó, không phải hai bộ tính riêng như v1.1.

## Chạy ngay

Mở `dist/index.html` bằng Chrome/Edge để dùng các công cụ offline. Cách ưu tiên với Node.js 22+:

```bash
npm start
```

Mở http://localhost:8080. Không cần npm install cho bản đã đóng gói. Chỉ server cục bộ mới có route AI. Dữ liệu dự án vẫn lưu trên trình duyệt, chưa có tài khoản hoặc đồng bộ đám mây.

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

61 test tự động + 11 kiểm tra giao diện trong DOM giả lập đã đạt trước bàn giao. Kiểm tra HTTP và ZIP ở `RELEASE_VALIDATION.json`. **Chưa có QA trình duyệt thật**: tải Chromium bị timeout. Không diễn giải kiểm thử Canvas giả lập thành kiểm tra hình ảnh/chuột/chạm trên thiết bị thực.

## Dữ liệu v1.1 và lưu phương án

Bản mới ưu tiên `bmh-v12`; nếu chưa có, đọc và kiểm tra `bmh-v1`. Không xóa bản lưu v1 cũ. Có thể nhập JSON v1; các trường giá/tường/cửa/dòng tiền mới được bổ sung mặc định. Phương án cũ tính lại bằng engine 1.2 và vẫn hiển thị tổng lịch sử để thấy khác biệt. Tổng v1.2 có thể khác v1.1 do đổi mô hình khối lượng, không phải cam kết giữ giá cũ.

Sao lưu JSON trước khi nâng cấp hoặc đổi tên miền. Ảnh/PDF tham chiếu vẫn chỉ giữ trong phiên, không nằm trong JSON. Dữ liệu không được đồng bộ nhiều thiết bị.

## Những phần chưa thể gọi là hoàn chỉnh thương mại

Giá mặc định là DEMO. Người dùng có thể nhập báo giá thật nhưng phần mềm chưa kiểm chứng tính thật/đầy đủ của báo giá. Dòng kết cấu vẫn là dự trù theo diện tích, không phải bóc thép/bê tông/móng. Hình học mới theo tim tường, chưa xử lý thể tích nút giao theo chuẩn thi công. Chưa tính đủ mái/MEP/nội thất/giấy phép; trạng thái concept_estimate không có nghĩa tổng chi phí đã đầy đủ. Không có tài khoản, thanh toán, nguồn giá tự động, chuyên gia thẩm định, phong thủy tính toán hoặc nhà thầu kết nối.

Tài liệu trong `domain-kit/docs/` và `docs/WEB_V1_GUIDE.md` là đặc tả/lịch sử trước nâng cấp. **README này và CHANGELOG_v1.2.md mô tả trạng thái hiện tại.**

## Vercel

Repository đã có `vercel.json` để deploy đúng thư mục `dist/`. Khi import vào Vercel, giữ Root Directory ở gốc repository và dùng Framework Preset `Other`. Chi tiết xem `VERCEL_DEPLOY.md`.


## Vercel hotfix 1.2.1

Vercel dùng `npm run build:vercel` để tạo thư mục `public/` từ toàn bộ `dist/`, tránh trường hợp HTML lên được nhưng `app.js`, `styles.css` và manifest bị 404.
