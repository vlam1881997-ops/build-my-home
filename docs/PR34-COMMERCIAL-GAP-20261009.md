# BMH — Đối chiếu PR #34 với luồng thương mại 24 phong cách

Ngày: 09/10/2026 (Asia/Saigon).
Bản đối chiếu: merge PR #34, commit `1f967083debdd75982f709c352a7b99c3d1974af`.
Repo: https://github.com/vlam1881997-ops/build-my-home
Website: https://www.huiminhbach.id.vn/

## Kết luận và mục tiêu

Phạm vi không chỉ là 24 hình minh họa và bảng vật liệu. Bản thương mại phải nhận hồ sơ khách hàng rồi tạo phương án phù hợp với đất, gia đình, phong cách, vị trí và khả năng tài chính; nối phương án tới 3D, dự toán, khoản vay, bàn giao thiết kế và cuối cùng là thi công/giám sát.

Luồng mục tiêu: **Đầu vào tổng hợp → bản vẽ phù hợp → vật liệu phù hợp → 3D cùng thiết kế → dự toán chi tiết và tối ưu → hỗ trợ vay vốn → bàn giao hồ sơ thiết kế → thi công/giám sát → hồ sơ hoàn công khi kết thúc.**

Ngân sách/vốn tự có được lấy ngay ở đầu vào; tính khoản vay chi tiết thực hiện sau dự toán, rồi quay lại điều chỉnh thiết kế/vật liệu nếu vượt khả năng tài chính. Mỗi vòng sửa tạo revision liên quan mới và làm mất hiệu lực các phê duyệt bị ảnh hưởng. Bàn giao thiết kế trước khởi công khác với bàn giao công trình sau thi công.

PR #34 chỉ thay đổi hai tài liệu khóa phạm vi; chức năng ứng dụng thừa hưởng các PR trước. Bản này có nền tảng đo đạc, biên tập và xuất hồ sơ đáng tiếp tục phát triển. Chưa có bằng chứng hoàn thành một luồng thương mại xây nhà đầy đủ, hoặc nghiệm thu hình ảnh của 24/24 phong cách. Không gán một phần trăm hoàn thành thiếu căn cứ.

## Bằng chứng của lần đối chiếu

- Lấy danh sách cây Git của commit trên; 249 file thuộc nguồn ứng dụng, API/server, domain-kit, test, tài liệu và catalog đã đối chiếu đúng Git blob hash. Đọc thứ tự module trong `scripts/build.cjs` và các lớp ghi đè cuối.
- Chạy bảy file kiểm tra hiện có: `customer-design`, `measured-design`, `architectural-dossier`, `parcel-feng-pricing`, `site-finance-contract`, `customer-cloud`, `feng-sources`. Kết quả 116/116, không lỗi, trên Node 24.19.0; repo khai báo Node 22.x. Đây là kiểm tra logic/hợp đồng, không thay nghiệm thu trình duyệt và hình ảnh.
- Thử bộ tạo `architectureProposal()` bằng fixture tổng hợp của `tests/customer-design.test.mjs`: cùng yêu cầu công năng, cả 24 phong cách cho cùng danh sách phòng/ô mở; đổi ngân sách 600 triệu ↔ 6 tỷ hoặc hướng nhà/năm sinh cũng không đổi danh sách đó. Fixture đã stub khung đất và một số helper, không phải ca UI/hồ sơ đất thật. Mặt bằng giống nhau giữa phong cách có thể hợp lý; kết quả này, cùng việc đọc hàm tạo phương án, cho thấy chưa có bộ chọn phương án đồng thời theo ngân sách/phong cách/phong thủy. Không có nghĩa phần mái, mặt đứng hoặc nội thất không đổi.
- Catalog đóng gói: 92 sản phẩm, 59 có SKU, 0 có giá số trong trường `price`, 12 nhóm hàng. Báo giá có thể nhập/tra thêm lúc chạy; không kết luận mọi dự án không có giá.
- Thư viện có 10 bộ nội thất; ánh xạ 24 phong cách hiện sử dụng 9 bộ. Có 17 profile bề mặt cơ bản cho sàn/tường/gỗ/vải; binding catalog ghi `exactness:'generic'`, `textureAssetId:null`. Chi tiết mặt đứng và texture mái đã có bổ sung, chưa phải bộ texture chính xác theo từng sản phẩm.
- GET công khai `/api/config` trên website ngày đối chiếu: Gemini/scan/image đã cấu hình; `cloudConfigured:false`, `paymentConfigured:false`, `guestService.enabled:false`, `placesConfigured:false`, quota theo tài khoản chưa bật. Có API Google Places chưa cấu hình không đồng nghĩa mọi nguồn vị trí/nhà cung cấp đều tắt; nguồn OSM và Search là đường riêng.
- Không gọi Gemini, Search tính phí, thanh toán, tạo đơn hay thay dữ liệu khách. Chưa chạy lại toàn bộ UI/24 mẫu hình ảnh trong lần đối chiếu này; báo cáo QA A/B trong repo là bằng chứng trước đó với giới hạn đã ghi, không phải nghiệm thu thẩm mỹ hiện tại.

## Đối chiếu theo từng khâu

| Khâu khách hàng cần | Đã có trong PR #34 | Còn phải hoàn thiện |
|---|---|---|
| Hồ sơ đầu vào | Ý tưởng/ảnh, phong cách, kích thước/ranh, vị trí, gia đình, công năng từng tầng, tiền sẵn có và ngân sách; có trạng thái nguồn | Hồ sơ yêu cầu thống nhất, phân biệt dữ liệu thiếu với mặc định; xác nhận hiện trạng/nhà mới, đơn vị, nguồn đo, hướng Bắc, khả năng chi trả; giải thích thiếu dữ liệu trước tạo phương án |
| Khu đất và phương án phù hợp | Ranh tùy chỉnh/khảo sát địa phương, diện tích đa giác, khung xây dựng, kiểm tra vượt ranh/chồng phòng; bộ bố trí theo công năng | Bộ phương án có ràng buộc và xếp hạng từ tất cả đầu vào. Hiện đất đa giác được dùng để tìm hình chữ nhật vừa trong đất, chưa tự triển khai nhà bám mọi góc đất. Khoảng lùi/quy hoạch chưa được xác nhận tự động |
| Phong thủy gia đình | Cung phi, điểm tư vấn, vị trí thờ theo tầng, hướng nội thất; runner nghiên cứu có nguồn và trường thiếu | Đo/gắn hướng giường, bếp, bàn thờ và phòng đúng tọa độ; nêu quy tắc, trường phái, nguồn và xung đột. Đưa vào so sánh phương án; khách quyết định trước áp dụng. Search cần cấu hình/quota riêng, có API key chưa chứng minh tra sách đang chạy |
| Bản vẽ 2D | Thêm/xóa/sửa phòng, cửa, cửa sổ, lối mở và bàn thờ, phòng tùy tên; undo/lock; cao tầng riêng; mặt bằng/mái/4 mặt đứng/2 mặt cắt/bảng cửa/thang; A3 PDF, SVG/DXF | Nghiệm thu bộ mẫu kiến trúc hoàn chỉnh trên đất thật có nguồn; giới hạn bộ bố trí hẹp/công năng khó phải rõ; bổ sung hồ sơ kết cấu/MEP/chi tiết thi công có chuyên môn. Không đồng nhất kích thước đúng với đủ hồ sơ thi công |
| 24 phong cách + vật liệu | Danh sách 24 ID, quy tắc mặt đứng, bộ nội thất, showroom/catalog và chọn bề mặt theo phòng | 24 hồ sơ phong cách được duyệt; vật liệu theo vai trò ngoài nhà/mái/cửa/sàn/tường/trần/gỗ/vải/khu ướt. Đồ nội thất, SKU/quy cách, texture có tỷ lệ và quyền sử dụng; gợi ý phù hợp khí hậu/ngân sách và phương án thay thế |
| 3D | Mô hình từ cùng mặt bằng/cao độ, ô mở, thang/thang máy; vật liệu, camera, xem nhanh/render vật lý/phối cảnh Gemini, PNG/GLB; giữ ảnh tham chiếu | Chất lượng nhà thật cho từng phong cách: tỷ lệ, mái/mặt tiền/nội thất/ánh sáng/texture. Duyệt ảnh ngoại thất và các phòng, giữ kích thước và vật liệu. Ảnh AI không được dùng thay chứng cứ mô hình đo đạc |
| Dự toán chi tiết / tối ưu | Khối lượng kiến trúc, nguồn/đơn vị/ngày/SKU/VAT/nhân công/vận chuyển/hao hụt; tổng phần có nguồn và dòng còn thiếu; ngân sách theo suất và so báo giá | Bóc đủ các nhóm thi công/đặt mua từ hồ sơ được cung cấp: móng, khung, mái, xây tô, MEP, chống thấm, hoàn thiện, đồ gỗ/nội thất, thang máy, sân/cổng, thiết kế/thủ tục. Bộ giá theo vùng; liên kết vật liệu từng phòng với BOQ; tối ưu nhiều SKU tương đương trong phạm vi ngân sách |
| Vay vốn ngân hàng | Nhu cầu vốn, gốc/lãi hàng tháng, ưu đãi/sau ưu đãi, mức trả cao nhất/DTI; runner tra lãi có nguồn | Tích hợp các phương thức trả nợ/giải ngân theo đợt, lãi thả nổi theo kỳ, ân hạn/phí theo điều kiện ngân hàng được nhập/xác nhận; dòng tiền xây dựng theo tháng. Library `domain-kit` có hai phương thức nhưng không có trong bundle UI hiện tại; không tính là tính năng UI đã hoàn thành |
| Bàn giao thiết kế | ZIP/PDF/DXF/GLB/bảng vật liệu/BOQ và revision; metadata rà soát kỹ thuật; cảnh báo hồ sơ phương án | Tách bàn giao thiết kế và hoàn công; sổ bản vẽ, quy cách, hồ sơ giá/vốn, vấn đề chưa giải quyết, khách/KTS/KS duyệt đúng revision. Cho tải hồ sơ sơ bộ ở mọi lúc nhưng chỉ ghi sẵn sàng thi công khi hồ sơ chuyên môn đủ |
| Thi công / giám sát cuối cùng | Giai đoạn, tiến độ tự nhập, chi phí thực tế, mốc ngân sách, checklist MEP và tệp chứng cứ cục bộ | WBS theo công trình, nhật ký/ảnh theo vị trí và hạng mục, người phụ trách, biên bản nghiệm thu, lỗi và xử lý, thay đổi thiết kế/khối lượng, đối chiếu thanh toán/giải ngân, hoàn công/bảo hành. Checklist tự đánh dấu chưa phải nghiệm thu/giám sát chuyên môn |
| Vận hành thương mại | Có mã cloud/auth/quota/đơn khách/MoMo và phục hồi cục bộ | Cấu hình và xác minh dịch vụ production, tài khoản/quyền dự án, lưu nhiều thiết bị, ảnh/tệp, backup/khôi phục, thu tiền/cấp quyền, quota chi phí AI, hỗ trợ/điều khoản và rollback; không quảng cáo dịch vụ tắt như đã dùng được |

## Bổ sung phạm vi ngày 09/10: khách chỉnh nội thất từng món

Khách được chọn, di chuyển, xoay 0–360° và xóa riêng từng món trong phòng qua 2D/3D. Phải lưu lựa chọn và giữ sau tải lại; đồng bộ bản vẽ, mô hình, bảng kê/dự toán và hồ sơ. Có hoàn tác/làm lại, kiểm tra va chạm/đường đi, giữ vật liệu và cập nhật tư vấn phong thủy theo hướng thực.

Nguồn hiện tại `src/78_design_workflow.js` sinh đồ theo `roomFurnitureLayout()` và xoay qua `furnitureRotation` của phòng. `src/99_customer_design.js` có chỉnh fixture bàn thờ riêng, chưa cung cấp bộ chỉnh độc lập cho mọi đồ nội thất. Không tính xoay toàn phòng là đã đáp ứng yêu cầu này.

Bổ sung vào gói 3, phối hợp gói 2 và 4: lưu ID/model/vị trí/góc/kích thước/SKU của từng món, trạng thái xóa không tự sinh lại; đưa cùng dữ liệu qua 2D/3D/xuất và chi phí. Nghiệm thu theo mục **Nội thất chỉnh sửa riêng từng món** trong tài liệu phạm vi v1.

## Lệch luồng phải sửa trước

1. `src/89_guided_interface.js` đang đặt tab 9 **Thi công**, tab 10 **Bàn giao**. Giữ 10 tab nhưng đổi luồng mục tiêu thành tab 9 **Bàn giao hồ sơ**, tab 10 **Thi công & giám sát**; remap trạng thái điều hướng/link cũ và kiểm tra các override dùng chỉ số.
2. `dossierCompleteness()` trong `src/35_dossier.js`, được bổ sung trong `src/93_measured_cost.js`, tính tiến độ 100% và checklist MEP hiện trường vào độ hoàn chỉnh hồ sơ. Điều này trộn hai thời điểm: phải tách **đủ bàn giao thiết kế** với **đủ hoàn công**. Hiện vẫn tải ZIP hồ sơ sơ bộ được; không kết luận nút xuất đang bị khóa đến thi công xong.
3. Tiền đầu vào phải tham gia lọc/xếp hạng phương án và vật liệu trước chốt; bảng dự toán không chỉ thông báo vượt tiền sau khi dựng xong. Tính khoản vay cuối có thể đưa khách quay về vòng tối ưu.
4. Cùng revision xuyên 2D/3D/BOQ/giá/phương án vay/bàn giao. Các hợp đồng revision đã có nền; cần kiểm tra cả đường giá, vốn, hồ sơ đã xuất và trạng thái phê duyệt thay vì chỉ đồng bộ hình học.

## Công việc còn lại và điều kiện kết thúc

### Gói 1 — Hoàn thiện bộ chọn phương án từ hồ sơ tổng hợp
- Chuẩn hóa đầu vào xác nhận và dữ liệu thiếu; khóa phạm vi đất/số tầng/công năng được hỗ trợ.
- Tạo phương án đáp ứng ranh/khoảng lùi có nguồn, công năng từng tầng, lối đi, khí hậu/vị trí, ngôn ngữ phong cách và ngân sách.
- So phương án bằng công năng/chi phí/ánh sáng/thông gió/tư vấn phong thủy riêng. Giữ yêu cầu khách; đề xuất đổi công năng phải được khách chọn.
- Đạt khi đổi đất, tiền hoặc nhu cầu làm thay đổi phương án khả thi hoặc giải thích rõ vì sao không thể đáp ứng; không giả vờ tạo thành công.

### Gói 2 — Bộ 24 phong cách và vật liệu thương mại
- Hoàn thiện 24 hồ sơ nhận diện; tuyển chọn thư viện dùng chung nhưng chi tiết kết quả đúng từng phong cách.
- Gắn vai trò vật liệu → sản phẩm/quy cách/đơn vị → texture/tỷ lệ → khối lượng/giá. Có lựa chọn tiết kiệm/nâng cấp.
- Đạt khi mỗi phong cách có ngoại thất/nội thất đã duyệt, danh sách vật liệu đủ vai trò, dữ liệu thiếu ghi rõ và chọn/lưu/mở lại không bị thay thế.

### Gói 3 — Bản vẽ và 3D đủ chất lượng bàn giao
- Hoàn thiện quy cách nét/trục/kích thước/bảng thống kê/chi tiết kiến trúc; bảo đảm sửa trực tiếp và tầng/thang/ô mở khớp.
- Hoàn thiện chất lượng mô hình, đồ nội thất, texture và ánh sáng theo 24 hồ sơ; giữ xem nhanh rồi tùy chọn render.
- Đạt khi số đo/ID/revision khớp ở SVG/PDF/DXF/GLB và ảnh 3D; duyệt hình từng phong cách. Phần kết cấu/MEP cần hồ sơ người phụ trách cung cấp và rà soát.

### Gói 4 — BOQ đầy đủ và tối ưu theo vốn
- Mở rộng từ ba nhóm sàn/sơn/cửa tới mọi nhóm áp dụng, hỗ trợ đơn vị thực (m²/m³/kg/mét/bộ/cái/lít) và quy đổi có quy cách.
- Nhập/bóc kết cấu/MEP theo hồ sơ chuyên môn, bổ sung giá vùng và điều kiện thương mại; tránh chồng lớp/bóc trùng.
- So các vật liệu/SKU tương đương, giữ phong cách và chất lượng, báo khoản tiết kiệm rõ. Không nhận tổng toàn công trình nếu còn hạng mục thiếu.
- Đạt khi từng dòng truy được nguồn khối lượng/giá, thiếu giữ null, đổi sản phẩm/hình học cập nhật đúng tổng và phương án thay thế.

### Gói 5 — Vay vốn và dòng tiền nối với dự toán
- Dùng tổng có phạm vi rõ và vốn tự có/quỹ dự phòng để tính khoản cần vay; nhập/xác nhận điều kiện ngân hàng.
- Nối lịch giải ngân, trả nợ, chi phí xây theo tháng; hỗ trợ gốc đều/trả góp, các kỳ lãi, ân hạn/phí áp dụng và kịch bản lãi tăng.
- Đạt khi lịch trả nợ/dư nợ/tổng phí và dòng tiền đối chiếu được theo điều kiện đầu vào; dữ liệu nguồn thiếu không được gọi là khoản vay được ngân hàng phê duyệt.

### Gói 6 — Bàn giao trước thi công và giám sát cuối
- Sửa thứ tự và tách độ hoàn chỉnh thiết kế/hoàn công; quản lý revision duyệt, thay đổi thiết kế và hồ sơ cấp cho nhà thầu.
- Thêm nhật ký/hạng mục/ảnh/biên bản/lỗi/chi phí/giải ngân/hoàn công; quyền chủ nhà, người thiết kế và người giám sát.
- Đạt khi dự án nhận bàn giao thiết kế lúc chưa khởi công; tiến độ hiện trường sau đó không thay bằng chứng phê duyệt thiết kế; kết thúc có bộ hoàn công riêng.

### Gói 7 — Bật dịch vụ và nghiệm thu tích hợp
- Hoàn thiện cấu hình lưu cloud/ảnh/tệp/auth/quota và thu tiền/cấp quyền; thực hiện giao dịch thử trước bật thu thật.
- Kiểm tra desktop/mobile, dự án cũ, lưu/mở giữa thiết bị, lỗi mạng, quyền truy cập, phục hồi, file xuất và đúng commit trên website.
- Đạt khi 24 phong cách có hồ sơ nghiệm thu riêng, các ca đất/công năng/nhiều tầng/thang/giá/vay/bàn giao được kiểm tra trên bản ghép, chủ sản phẩm duyệt hình và người chuyên môn duyệt phạm vi hồ sơ xây dựng.

Các gói là nhóm việc, không phải bảy đợt tăng số phiên bản. Nên hoàn thiện xuyên suốt một dự án đại diện trước để chốt hợp đồng; sau đó nhân phạm vi nhận diện/vật liệu ra đủ 24 phong cách. Các ca đất/phong thủy/ngân sách kiểm tra nhiều đầu vào khác nhau, không buộc tạo cùng một nhà cho 24 phong cách.

Nếu chia A/B tiếp: A giữ đất/hình học/bản vẽ/khối lượng; B giữ 24 phong cách/vật liệu/3D/giao diện. Các biên ngân sách, SKU-BOQ, vay, cloud, bàn giao và nghiệm thu tích hợp cần người sở hữu rõ; không được coi nằm ngoài nhiệm vụ cả hai. Việc gộp code không thay thế các cổng nghiệm thu.

## Nguồn mã cần làm tiếp

- Đầu vào/nghiên cứu: `src/10_state.js`, `src/18_ai_copilot.js`, `server/_design_research.mjs`, `server/_feng_sources.mjs`, `server/_site_intelligence.mjs`.
- Đất/hình học/công năng: `src/30_planner.js`, `src/76_architecture.js`, `src/92_measured_design.js`, `src/94_architectural_design.js`, `src/99_customer_design.js`.
- Phong cách/vật liệu/3D: `src/44_house_styles.js`, `src/75_completion.js`, `src/85_interior_collections.js`, `src/86_visual_materials.js`, `src/45_studio3d.js`, `src/101_visual_studio.js`, `src/102_architectural_identity.js`, `src/103_real_house.js`, `src/104_style_reference.js`, `assets/materials/official-catalog.json`.
- Dự toán/vay: `src/20_calc.js`, `src/93_measured_cost.js`, `src/97_project_dashboard.js`, `api/bank-rate.mjs`, `domain-kit/src/finance.mjs` (library chưa tích hợp vào bundle UI).
- Bàn giao/thi công/vận hành: `src/35_dossier.js`, `src/89_guided_interface.js`, `src/95_architectural_documents.js`, `src/91_customer_cloud.js`, `src/84_customer_service.js`, `server/_customer_config.mjs`, `api/config.mjs`.
