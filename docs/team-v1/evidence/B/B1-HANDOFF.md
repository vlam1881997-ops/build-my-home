# B1 / C02 — hồ sơ phong cách và vật liệu cho A

Ngày: 09/10/2026. Nhánh nguồn: `codex/b-v1-24`. Brief revision: `style-material-brief-1`.
Đầu ra này sẵn để A review/tích hợp interface; toàn bộ B1/G1 vẫn chưa nghiệm thu.

## Nguồn và API thật

- `src/44_house_styles.js`: registry 24 ID, `styleSpecification(styleId)`, `styleMaterialMatrix(styleId)`, `styleMaterialCompatibility(product, {styleId, roleId})`, `styleMaterialSchedule(project, {products})`.
- `src/99_customer_design.js`: `customerStyleProfile().specification`, `styleDefaultPalette(roomId)` và resolver giữ manual room/collection/material intent.
- `src/86_visual_materials.js`: style/default/stale bindings cùng đọc profile thật.
- `src/90_product_polish.js`: showroom brief và nhãn compatibility; không tự chọn mã hàng.
- `B1-style-material-profiles.json`: snapshot 24 hồ sơ / 240 role rows để A đọc trước khi ghép runtime. Đây là dữ liệu gợi ý BMH, không phải nguồn chuẩn kỹ thuật hoặc xác nhận hãng.

Các hàm nằm trong module đang được build; không cần đăng ký module/dependency mới.

## A2 / A4 tiêu thụ

`styleSpecification(id)` cung cấp ý đồ mái/mặt tiền, tỷ lệ thích ứng số đo, palette/material defaults, checks khí hậu, giới hạn, hai cách tối ưu/nâng cấp và acceptance pending. `styleMaterialMatrix(id)` có 10 vai trò: mái, mặt ngoài, cửa, sàn khô, tường trong, trần, gỗ/tủ, vải/bọc, khu ướt, hoàn thiện thang. Trần và vải chưa có nhóm sản phẩm phù hợp trong danh mục hiện tại (`category:null`), không dùng vật liệu khác nhóm để giả đủ.

`styleMaterialSchedule(project, {products})` là read-only bridge: không chỉnh project, không đo thay A. Selected SKU/spec/productUnit/priceEvidence giữ nguồn hiện có; unresolved selections được ghi rõ. `quantity`, `quantityBasis`, `totalVnd` đều null. Với project khác active project, `designRevision` null; A gắn revision đã tính theo project đó. Với phong cách riêng, profile null/rows rỗng, không áp phong cách hiện tại của cửa sổ này sang dự án khác.

`category-selected` chỉ có nghĩa chọn sản phẩm của nhóm. `applicationStatus:'requires-role-confirmation'` không chứng minh vật liệu đã được dùng ở mọi vị trí. Một category selection có thể xuất hiện ở nhiều vai trò; A4 phải lấy element/room/application IDs và số đo thật để tránh cộng trùng. `quantityUnit` của role là đơn vị khối lượng dự kiến, `productUnit` là đơn vị bán hàng; không tự chuyển tấm/viên/bộ sang m² khi thiếu quy cách/định mức.

`bindings` là trạng thái lưu; cache palette không tự là ý khách. Đọc `explicitRoles`, `styleRoles`, `catalogMaterials` và resolver khi tích hợp. Màu/vật liệu legacy chưa có marker được bảo toàn. Áp riêng sàn không biến màu cache của tường/gỗ/vải thành lựa chọn khách.

Compatibility: `design-suggestion` dựa trên `product.styleIds` của danh mục, vẫn cần mẫu/quy cách; `needs-sample` không phải tương thích đã xác nhận. `different-style`/`different-role` không được tự thay sản phẩm khách đã chọn. Không coi texture generic là exact SKU; không gán giá hoặc mức tiết kiệm giả.

## Kiểm tra

- Node 22.23.3: build, syntax; 78/78 ca liên quan (10 ca B mới + 68 ca hiện có).
- Browser Chromium: desktop 1440×1040 và phone 390×844; chọn hàng và bề mặt qua UI → 3D → đổi phong cách → reload, giữ SKU và số đo, 10 tab, không overflow/JS/WebGL error. Xem `B1-browser/result.json` và ảnh.
- API/AI/thanh toán bị cô lập; không tạo giao dịch, không gọi dịch vụ tính phí.
- Ảnh phòng test chỉ chứng minh thao tác, không nghiệm thu ngoại thất/nội thất 24 phong cách.

## Yêu cầu A

- C02: review/chốt tên và semantics các API trên; dùng cho A2/A4 mà không coi giá web là project quote đã áp dụng.
- C05: thêm `tests/team-b-style-materials.test.mjs` vào script test/CI A sở hữu. Script browser chạy khi có Chromium; source browser và evidence đã có.
- C01: chốt schema/history/migration `project.plan.furniture` và fixture để B2 làm editor/adapter. B chưa sửa file state/planner/build của A.

## Còn thiếu trước khi B1 hoàn tất

Chốt supplier samples, metadata tương thích và quy cách cho từng lựa chọn; thêm đúng nhóm trần/vải; quyền dùng texture SKU nếu có; báo giá có nguồn; duyệt hình ngoại thất/nội thất 24/24 cùng B3. Budget options hiện là cách thiết kế để so sánh, chưa phải phương án đã tính savings.

## Công cụ dùng

BMH 3D/UI/quality skills và GitHub đã có; vanilla JS, Three 0.160.1, Playwright. Tận dụng tài nguyên đã pin trong repo; không thêm dependency/provider/plugin trả phí. Licence asset Poly Haven kiểm tại https://polyhaven.com/license ngày 09/10/2026: CC0 cho assets; không áp quyền đó cho ảnh example/user render/logos. Không gọi API Poly Haven hoặc thu thập thêm nội dung.
