# BMH — Phân công nâng cấp cho hai tài khoản

Ngày chuẩn bị: 04/10/2026. Nguồn đối chiếu: main `fdc57d471fe8019440aefa594af7a64544621bb6`.
Trạng thái: đã lập yêu cầu, chia file và chuẩn bị skill/mission; chưa chạy các nhiệm vụ nâng cấp bằng hai tài khoản trên máy Windows.

## Mục tiêu và phần phải giữ

Nâng BMH hiện có thành sản phẩm lập phương án nhà: nhận đúng đầu vào → bản vẽ có số đo → 3D cùng thiết kế/phong cách/vật liệu → khối lượng/chi phí → tiến độ và hồ sơ bàn giao. Đầu ra phải truy ngược được về lựa chọn của khách và nguồn số liệu.

Màn khởi tạo là màn trước mười tab. Giữ nguyên thông tin vị trí/tài chính/gia đình, nhà mới/nhà thô, validator, lưu dữ liệu và Next/Back. Chỉ thay hình minh họa/presentation cho đẹp, có quyền sử dụng thương mại. Tạo asset riêng để không làm đổi ảnh đang dùng trong tab khác.

Mười tab giữ đủ:
1. Ý tưởng
2. Khu đất
3. Gia đình
4. Bản vẽ
5. Vật liệu
6. 3D
7. Dự toán
8. Ngân hàng
9. Thi công
10. Bàn giao

Tabs 7–10 giữ giao diện và nghiệp vụ hiện tại. Nâng các adapter dữ liệu/sửa regression do tab1–6 gây ra khi cần; không thiết kế lại chúng. Không ẩn vật liệu/ngân hàng vào menu phụ.

## Vai trò hai tài khoản

TK1 là tài khoản thứ nhất trong BMH Team (`worker one`): phụ trách thông tin, nghiên cứu có nguồn, khu đất, tư vấn gia đình, vật liệu và giao diện chung. Đồng thời là chủ sở hữu state/normalization, persistence và đăng ký module build.

TK2 là tài khoản thứ hai (`worker two`): phụ trách hình học, direct editor, hồ sơ kiến trúc, 3D, xuất và hiệu năng. Đọc contract từ TK1, không tự tạo một model hoặc bộ vật liệu độc lập.

Dùng GPT-6.1 Sol + High cho TK1; TK2 có thể chọn GPT-6 Astra + High khi tài khoản có quyền. Đây là cấu hình đề nghị, không phải bằng chứng hai tài khoản đã thực thi model. Hết quota hoặc model không hỗ trợ thì giữ báo lỗi và phần việc; không tự hạ model/đổi tài khoản.

Hai tài khoản làm hai worktree độc lập. Mỗi file có một người sửa trong cùng đợt. Kết quả ghép vào nhánh tích hợp và kiểm tra trước khi đi tiếp.

## Các việc đã có để nâng lên

Bản đối chiếu đã có phân tích ảnh/video/PDF, nhà mới/nhà thô, 24 phong cách, bản đồ ghim và polygon/GeoJSON, phòng theo tầng/phòng giặt/phòng tự đặt tên, chọn/vẽ/xóa phòng/cửa/cửa sổ/lối mở, undo/redo/khóa, thang máy xuyên tầng, bốn mặt đứng/hai mặt cắt, PDF vector A3/SVG/DXF và mô hình 3D.

Vì vậy nâng chất lượng các đường đang có. Không lập lại bản vẽ bằng ảnh AI, không viết lại app sang React/Next.js chỉ để đổi giao diện.

Catalog hiện có 92 sản phẩm, 12 nhóm, 13 hãng và 59 sản phẩm có SKU; catalog lưu sẵn chưa có giá niêm yết. Ưu tiên nguồn giá/đơn vị/quy cách và liên kết vật liệu 3D thay vì chỉ tăng số thẻ.

## Yêu cầu và nghiệm thu từng phần

| Phần | TK1 | TK2 | Điều kiện nghiệm thu |
| --- | --- | --- | --- |
| Màn khởi tạo | Thay minh họa, crop desktop/phone đẹp | Đối chiếu giữ luồng | Cùng dữ liệu tạo cùng hồ sơ; các trường/validator/điều hướng không đổi. |
| Tab1: Ý tưởng | Nhận biết khách đang có gì; nghiên cứu mẫu có nguồn theo loại nhà/số đo/tầng/ngân sách/phong cách | Bàn giao khả năng hình học/phong cách thực tế | Nhiều mẫu, nguồn/ngày/lý do phù hợp; chọn mẫu không tự đổi đất/phòng/ngân sách; lỗi AI vẫn dùng 24 mẫu cũ. |
| Tab2: Khu đất | Ghim, nhập ranh/số đo, nguồn quy hoạch và supplier gần địa điểm | Kiểm polygon/envelope và ánh xạ vào mặt bằng | Tách bản đồ với khảo sát; nguồn áp dụng đúng thửa/phạm vi/ngày; thiếu quy hoạch ghi chưa xác minh; phòng/tường/mái không vượt ranh hợp lệ. |
| Tab3: Gia đình | Nguồn sách, hướng nhà/phòng/giường/bếp/thờ, gợi ý có coverage | Dùng bố trí thực để kiểm lối đi và vị trí | Khách chọn phòng/tầng tự do; tư vấn không tự dịch phòng/cửa; có nguồn cho nhận định, không bịa chương/trang. |
| Tab4: Bản vẽ | Cung cấp dữ liệu/sources, giữ schema | Thao tác trực tiếp, số đo, nét/ký hiệu/mặt đứng/mặt cắt/PDF | Thêm/xóa/undo giữ ID; kích thước theo ranh; thang/giếng/lối đi hợp lệ; PDF/DXF lấy từ model đo hiện tại. |
| Tab5: Vật liệu | SKU/quy cách/giá/nguồn/ngày/khu vực/phong cách, visual bindings | Đọc bindings vào bề mặt thực | Giá thiếu không thành 0; chọn đúng style/ngân sách; texture đúng scale hoặc ghi mô phỏng; không mất lựa chọn riêng của khách. |
| Tab6: 3D | Bàn giao phong cách/SKU/palette/licence | Toàn nhà/tầng/tách tầng/walk, camera/ánh sáng/vật liệu/export | Số phòng/cửa/mái/thang đúng bản vẽ; phong cách thể hiện cả hình khối và vật liệu; chuyển vật liệu giữ camera, xuất PNG/GLB thực. |
| Tabs7–10 | Nối giá/khối lượng/persistence, giữ tài chính/tiến độ | Đồng bộ hồ sơ xuất, kiểm chức năng | Dự toán/ngân hàng/thi công/bàn giao còn đủ; dữ liệu mới cập nhật đúng khoản, không cộng trùng; mốc dự toán cũ được giữ. |

### Tab1 — biết khách đã có gì

Tổng hợp nhà mới/nhà thô, ảnh/video/PDF đã nộp, số đo được xác nhận, phong cách/ý tưởng, tầng/ngân sách, cấu kiện hiện có và điều chưa xác nhận. Kết quả đọc ảnh của AI là nhận định cần đối chiếu, không biến thành khảo sát công trình.

Tìm mẫu theo bề ngang, số tầng, khí hậu/ngân sách, trạng thái nhà mới/nhà thô và phong cách. Hiển thị nguồn/ngày/lý do/giới hạn. Dùng ảnh đã có quyền sử dụng; một URL ảnh công khai không đủ chứng minh quyền thương mại. Lựa chọn mẫu là ý định thiết kế, không thay số đo hay mặt bằng tự động.

### Tab2 — ranh đúng và quy hoạch có căn cứ

Giữ ghim bản đồ, ranh thửa, cạnh mặt tiền, hướng Bắc và số đo tách biệt. Cho nhập tài liệu/số đo khảo sát/GeoJSON với CRS và nguồn. Từ chối polygon tự cắt; khi thiếu dữ liệu địa chính, giữ nguồn “khách cung cấp” hoặc “bản đồ tham khảo”.

Quy hoạch phải có nguồn cơ quan có thẩm quyền, phạm vi thửa/khu vực, quyết định/ngày và điều còn chưa xác minh. Không suy phần được xây chỉ từ màu nền, ghim hoặc kết quả Gemini. Khoảng lùi mặc định hiện có là giả định phương án; người dùng/nguồn xác minh có thể thay đổi. Thông tin hết hiệu lực khi địa điểm hoặc tài liệu nền đổi.

Supplier quanh vị trí có tên/địa chỉ/nguồn/khoảng cách và ngày kiểm. Gemini key không thay thế Google Places key hoặc quyền API riêng. Không tự bật dịch vụ/billing khi thiếu.

### Tab3 — gợi ý phong thủy và quyền lựa chọn

Nguồn sách có tên, tác giả/ấn bản xác minh được, URL và chương/trang khi thực có. Liên kết từng nguồn với gợi ý hướng/giường/bếp/phòng thờ; trình bày trường phái khác nhau khi có mâu thuẫn.

Hướng đất thiếu/không rõ thì giảm coverage, không cho điểm như đã biết. Phong thủy là tư vấn văn hóa, không chứng minh khả năng chịu lực hoặc an toàn. Gia chủ vẫn đặt phòng thờ ở khách/tầng2/tầng3, phòng giặt và phòng tự chọn. Áp dụng thay đổi bố trí chỉ khi khách quyết định.

### Tab4 — kỹ thuật đo và thao tác trực tiếp

Một bộ công cụ gọn: chọn, phòng/lối đi, cửa, cửa sổ, lối mở và xóa. Hiện thao tác theo đối tượng đang chọn; numeric inputs là tùy chọn precision. Giữ lock, shared walls, inverse SVG transform, undo/redo và trạng thái đang làm.

Bản vẽ có kích thước tổng/phân đoạn/cửa, nét tường, ký hiệu, floor/north/scale/revision, cao độ, mặt đứng/mặt cắt và bảng phòng/cửa/fixtures. Mặt bằng–mặt đứng–mặt cắt–3D dùng chung hình học. Mái, giếng và thang không bị model độc lập làm sai.

Móng/cột/dầm/vách chịu lực/thép là đợt phối hợp kỹ thuật riêng: nhận kích thước/hồ sơ được cung cấp, ghi trạng thái sơ bộ khi còn thiếu, không chọn tiết diện/thép chỉ từ số phòng. `suggestedColumns` hiện tự đặt ký hiệu 0,22 m theo góc phòng phải được phân biệt với cấu kiện thiết kế thực.

### Tab5 — vật liệu và chi phí

Mỗi sản phẩm có SKU khi có, quy cách, đơn vị, ảnh/quyền sử dụng, giá tham khảo hoặc báo giá, nguồn/ngày/khu vực, thuế/nhân công/vận chuyển và phạm vi bao gồm.

Giữ lựa chọn của khách; gợi ý phù hợp style/khí hậu/ngân sách không tự thay. Liên kết SKU với bề mặt/texture và tỷ lệ thực để TK2 dựng; profile generic khác mẫu hãng xác minh. Báo giá thiếu không thành 0. Đổi vật liệu cập nhật đúng phần dự toán và ghi phần chưa có giá.

### Tab6 — 3D dùng để hình dung căn nhà thật

Thể hiện hình khối/phong cách: mái, mặt tiền, ban công, tỷ lệ ô cửa, màu, vật liệu và nội thất; không chỉ thay màu trên cùng một mẫu. Giữ cùng số đo/phòng/cửa/thang/mái với bản vẽ và lựa chọn bề mặt của khách.

Có góc toàn nhà, từng tầng, tách tầng và vào phòng; mặc định xoay/xem nhanh. Thay vật liệu không dựng lại scene/camera khi không cần. Hiển thị nhanh bằng raster; path tracing tùy chọn có tiến độ/hủy. PNG từ model hiện tại là phối cảnh đo; ảnh AI bổ sung có nhãn minh họa.

## Bảy đợt làm việc song song

Mỗi đợt có đúng hai nhiệm vụ. File allowlist, nội dung và selected checks ở `docs/BMH-UPGRADE-ROUNDS.json`. Nếu một đợt vượt giới hạn lượt chạy, chia nhỏ phạm vi trước khi bắt đầu; giữ cùng chủ sở hữu.

| Đợt | TK1 làm | TK2 làm | Kết quả cần đạt |
| --- | --- | --- | --- |
| 1 | Mẫu nhà/ý tưởng có nguồn theo hồ sơ | Direct editor gọn, thêm/xóa/undo dễ | Hai thay đổi có thể dùng và nhìn thấy ngay. |
| 2 | Nguồn khu đất/supplier, state/persistence contract | Polygon/envelope/thang/revision | Đất và mặt bằng dùng cùng ranh có nguồn. |
| 3 | SKU/giá/nguồn/style/texture bindings | Bản vẽ và PDF/DXF kiến trúc | Hồ sơ đo và vật liệu đủ metadata cho bước3D. |
| 4 | Thư mục sách và gợi ý gia đình/phong thủy | 3D toàn nhà đúng hình khối/style/material | Chọn đầu vào thấy đúng trong đầu ra. |
| 5 | Minh họa intake và hierarchy tab1–6 | Phòng tự thêm theo tầng, walk/persistence | Đẹp/dễ dùng; intake và10tab giữ chức năng. |
| 6 | Hồ sơ đầu vào kỹ thuật và trạng thái rà soát | Cấu kiện đo/section/model phối hợp | Có gói kiến trúc và danh mục đầu vào kỹ sư; không bịa kết cấu. |
| 7 | Dự toán/giá/mốc/tiến độ/persistence | Hiệu năng và gói2D/3D/xuất đồng nhất | Bản nghiệm thu bằng dữ liệu và kết quả thật. |

BMH Team hiện bắt đầu mỗi job từ `origin/main`, tạo nhánh mới và không tự push/merge/deploy. Vì vậy đợt sau phụ thuộc đợt trước cần nguồn đã tích hợp vào main, hoặc một luồng tiếp tục trên nhánh đã được điều chỉnh/cho phép. Chọn thư mục kết quả cục bộ của job cũ không làm công cụ tự tiếp tục trên code đó. Không hứa bảy đợt tự chạy liên tục bằng bản điều phối hiện tại.

Đợt1 dùng tệp `BMH-MISSION-01.txt`: dán toàn bộ vào ô Mục tiêu BMH Team. Các tệp hướng dẫn/skill đang nằm trên nhánh review cho đến khi tích hợp; brief đợt1 đã tự chứa phạm vi nên có thể dùng với main hiện tại.

Đợt2 dùng `BMH-MISSION-02.txt`; đợt3 dùng `BMH-MISSION-03.txt`. Mỗi tệp có brief và contract tối thiểu tự chứa, exact ownership cho hai worker, nghiệm thu và selected checks. Dán một tệp mỗi job; không gộp hai đợt vào cùng mục tiêu. Các đợt phụ thuộc phải dùng nguồn đã tích hợp kết quả đợt trước. BMH Team v1.1.3 có thể tiếp tục cùng job bị ngắt từ báo cáo/worktree hợp lệ trước commit/gộp; chức năng này không tự chuyển sang đợt kế tiếp.

## File giao nhau và cách tránh sửa chồng

| Chủ sở hữu | File quan trọng |
| --- | --- |
| TK1 — state/persistence | `src/10_state.js`, `src/82_customer_projects.js` |
| TK1 — UI/API thông tin | `src/60_app.js`, `src/70_v60_product_ui.js`, `src/75_completion.js`, `api/ai.mjs`, các server adapter tìm nguồn |
| TK1 — style/material provider | `src/44_house_styles.js`, `src/85_interior_collections.js`, `src/86_visual_materials.js`, catalog/asset hợp lệ |
| TK1 — cost/build | `src/20_calc.js`, `src/93_measured_cost.js`, `scripts/build.cjs` |
| TK2 — hình học/editor | `src/30_planner.js`, `src/76_architecture.js`, `src/79_stair_design.js`, `src/87_elevator_design.js`, `src/92_measured_design.js`, `src/99_customer_design.js`, `src/100_customer_experience.js` |
| TK2 — model/export | `src/40_exports.js`, `src/43_scene_assets.js`, `src/45_studio3d.js`, `src/46_architectural_render.js`, `src/94_architectural_design.js`, `src/95_architectural_documents.js`, `src/96_vector_pdf.js`, `src/98_model_presentation.js`, `src/88_customer_studio.js` |
| Tích hợp tuần tự | `src/81_design_studio.js`, package/lock, module đăng ký mới hoặc điều chỉnh contract không có trong allowlist hiện tại |

Danh sách trên là phân công dài hạn. Khi chạy, allowlist cụ thể của đợt là giới hạn được sửa. Một file chứa nhiều tab không được tách “sửa đoạn khác” cho hai người cùng lúc. TK2 sở hữu toàn bộ99/100 vì chúng chứa cả editor, công năng, style/finish, moodboard và wrapper AI. TK1 chuyển dữ liệu qua contract, không sửa cùng file.

## Skill và công cụ dùng chung

Đã chuẩn bị bảy workflow tại `.agents/skills` để phiên Codex làm trong cùng repo có thể phát hiện; mỗi skill gồm hướng dẫn, references và asset/script gốc. Chỉ đọc skill liên quan để tiết kiệm context.

| Skill | Việc áp dụng |
| --- | --- |
| bmh-ui-design | Giữ10tab, một hành động chính, progressive disclosure, mobile/focus/labels và handlers thật. |
| bmh-graphic-design | Typography/màu/spacing/icon/cover/thumbnail nhất quán; quyền dùng asset. |
| bmh-drawings | Hình học đo, openings/thang/giếng, A3/SVG/PDF/DXF có scale/unit/revision. |
| bmh-3d | Three.js hiện có, GLB hợp lệ, cùng geometry, texture scale/camera/disposal/performance. |
| bmh-images | Phối cảnh model chính xác và ảnh AI minh họa được phân biệt; brief style/material/camera đủ. |
| bmh-construction-design | Nguồn số đo, móng/cột/dầm/vách, thiếu dữ liệu kỹ sư, review theo bộ môn và revision. |
| bmh-webapp-quality | Kiểm luồng bị đổi, persistence/export/3D, mock dịch vụ trả phí, báo kết quả thực. |

Các skill không tự cài Blender/CAD, không kết nối tài khoản khác và không cấp thêm API quota. Skill của tài khoản ChatGPT thứ nhất không tự xuất hiện trong danh mục Work của tài khoản thứ hai. Repo workflow dùng cho các phiên Codex của dự án; ChatGPT Work thứ hai có thể đọc brief này và dùng các skill được cài ở tài khoản đó. Không khẳng định đã cài vào tài khoản khác khi chưa xác minh.

Đợt tìm plugin CAD/3D chưa trả kết quả phù hợp; tiếp tục dùng SVG/vector và Three.js đang có. Không thêm plugin chỉ để tăng số công cụ hoặc tự mua subscription. Chỉ chọn tích hợp bổ sung khi nó giải quyết một khả năng thực sự thiếu, có quyền sử dụng thương mại và chi phí đã xác định.

## Gemini miễn phí và tối ưu chi phí

Google hiện liệt kê Google Search grounding của Gemini2.5 Flash/Flash-Lite có free-tier quota tới500RPD dùng chung. Các model/tier khác có điều kiện/giá khác. Đây là bảng chính sách, chưa xác minh quota của key hiện có. Không hứa mọi lần tìm hay mọi model miễn phí.

- Tái dùng transport Gemini và server API hiện có; key giữ server-side.
- Kiểm model/capability/quota/cấu hình trước khi gọi; model key được chấp nhận không chứng minh generation/search còn quota.
- Chỉ tìm khi khách yêu cầu hoặc query/đầu vào cần đổi; chống lặp, giới hạn retry/concurrency/prompt và dừng khi hết quota. Cache khi điều khoản dịch vụ cho phép.
- Ưu tiên thư viện local/nguồn đã kiểm và raster3D trực tiếp cho trải nghiệm mặc định. AI hình ảnh là thao tác có nhu cầu rõ và ngân sách riêng; không coi ảnh AI là miễn phí từ quota Search.
- Nếu không xác minh được chế độ miễn phí hoặc quota, giữ lựa chọn local và trạng thái rõ; không tự bật billing hay đổi sang model trả phí.
- Google Search grounding cung cấp nguồn web; ảnh sản phẩm, Maps/Places, dữ liệu quy hoạch và giá hãng vẫn cần năng lực/quyền tương ứng.
- Google đã công bố Gemini2.5 Flash Image ngừng ngày02/10/2026. Rà router bằng model discovery hiện có và nguồn mới; không hardcode endpoint ảnh cũ làm bằng chứng key lỗi.

Vercel Hobby hiện giới hạn dùng cá nhân/phi thương mại. Trước phát hành thu tiền, kiểm kế hoạch hosting có quyền thương mại và ngân sách/cap; không tự nâng plan thanh toán. Tối ưu bằng hiện có, ảnh/texture đúng kích thước, chia sẻ geometry, lazy load và giới hạn các thao tác AI.

## Điều kiện hoàn thành sản phẩm

1. Một dự án giữ đủ đầu vào, quyền lựa chọn theo tầng, ranh/số đo/nguồn và style/material đã chốt.
2. Bản vẽ/3D/khối lượng/xuất cùng geometry/revision; chọn phong cách thay được hình khối cần thiết, không chỉ màu.
3. Thao tác trực tiếp thêm/xóa/undo/save/reload đúng; lỗi không làm mất dự án.
4. Giá và nguồn/quy cách đủ hoặc trạng thái chưa giá rõ; không cộng trùng dự trù và chi tiết. Tài chính/ngân hàng/tiến độ7–10 giữ chức năng.
5. Gói khách có SVG/PDFvectorA3/DXF/GLB/PNG và bảng lượng/dự toán đúng phạm vi, mở được thật. Thiết kế chia sẻ giữ allowlist dữ liệu riêng.
6. Móng/cột/dầm/vách/thép cần hồ sơ và chuyên môn phù hợp. Có trạng thái thiếu/sơ bộ/chờ rà soát/đã rà soát theo bộ môn và revision; không tự dùng model/điểm phong thủy/testpass để chứng nhận xây dựng.
7. Nghiệm thu trên ít nhất nhà5×20m2tầng, thửa không chữ nhật3tầng có thang, và nhàthô có số đo khách xác nhận; provider/payment mock. Đo độ trễ thực trên thiết bị, giữ ảnh kiểm desktop/phone và gói xuất.
8. License assets/capAI/hosting/cloud persistence/order flags được xác minh theo phạm vi thương mại. Báo trạng thái thực thay vì gọi prototype đã sẵn sàng thu tiền.

Kiểm phần bị thay đổi rồi đi tiếp; không chạy lặp toàn bộ lịch sử test khi không có lỗi mới. BMH Team worker không build/test ghi dist/public; coordinator xây nguồn đã ghép và kiểm selected tests. Kiểm browser tương tác sau tích hợp; thiếu browser thì ghi rõ phần chưa được kiểm.

## Prompt cho cửa sổ ChatGPT thứ nhất

> Bạn là TK1 của dự án Build My Home. Đọc bản phân công BMH và contract dữ liệu; phụ trách đầu vào/ý tưởng có nguồn, khu đất, tư vấn gia đình, vật liệu, giao diện chung và state/persistence/build. Làm trên repo hiện có; giữ intake ngoài phần ảnh và giữ10tab, đặc biệt7–10. Trước mỗi đợt chốt exact file ownership, không sửa file TK2. Dùng các workflow UI/graphics/images/quality và construction inputs phù hợp. Bắt đầu đợt1: mẫu nhà theo hồ sơ khách, Google qua Gemini chỉ khi cấu hình/quota cho phép, nguồn/ngày/lý do rõ, library24style dự phòng; không tự ghi đè đất/phòng/ngân sách. Dùng nhiệm vụ worker one và allowlist trong BMHMISSION01. Báo kết quả đã làm/kiểm thật và bàn giao schema/SKU/sources cho TK2. Không tự hạ model/mua API/merge/deploy.

## Prompt cho cửa sổ ChatGPT thứ hai

> Bạn là TK2 của dự án Build My Home. Đọc bản phân công và contract dữ liệu; phụ trách hình học đo, direct editor, bản vẽ kiến trúc, 3D, xuất và hiệu năng. Cùng repo và cùng dữ liệu TK1, worktree/branch riêng; chỉ sửa exact allowlist của đợt. Dùng workflows drawings/3D/images/graphics/construction/quality phù hợp. Bắt đầu đợt1: direct editor tab4 gọn, chọn/thêm/xóa cửa/cửa sổ/lối mở/phòng và numeric dimensions; giữ lock/undo/ID/inverseSVG/style/material/perfloor. Dùng nhiệm vụ worker two trong BMHMISSION01. Bản vẽ–3D–khối lượng từ cùng geometry, không dùng AI để bịa hồ sơ đo hoặc móng/thép. Giữ10tab và intake. Báo kết quả thật, bàn giao schema/revision/output và phần còn thiếu chuyên môn; không tự hạ model/mua API/merge/deploy.

## Nguồn kỹ thuật và khả năng đã đối chiếu

- Google pricing: https://ai.google.dev/gemini-api/docs/pricing
- Google Search grounding: https://ai.google.dev/gemini-api/docs/google-search
- Codex repo skills: https://learn.chatgpt.com/docs/build-skills
- Codex model choice: https://learn.chatgpt.com/docs/models
- Vercel Hobby/commercial scope: https://vercel.com/docs/plans/hobby
- VSQI pile foundation register: https://tieuchuan.vsqi.gov.vn/tieuchuan/view?sohieu=TCVN+10304%3A2025
- VSQI concrete register: https://tieuchuan.vsqi.gov.vn/tieuchuan/view?sohieu=TCVN+5574%3A2018
- Nguồn BMH: docs/BMH-CUSTOMER-DESIGN.md; actual modules/tests theo allowlist.

Nguồn pricing/Codex/Vercel đã mở để đối chiếu. VSQI trả metadata qua search nhưng page mở bị timeout; chưa đọc toàn văn tiêu chuẩn hay áp dụng công thức. Khi làm tính toán kỹ thuật, cần lấy tiêu chuẩn áp dụng thực tế và cập nhật nguồn chính thức theo ngày/địa phương. Chuẩn bị brief không phải triển khai live hay kiểm thử hai phiên inference trên máy người dùng.
