# BMH — nâng cấp đợt 1 và 2

Nền phát hành: `main` tại `ca939c22fbd789f473ce275f91636aa1c23341ec`.
Giữ nguyên luồng nhập thông tin, minh họa, dự án khách hàng và 10 tab, bao gồm vật liệu và ngân hàng.

## Đợt 1: mẫu nhà và chỉnh sửa trực tiếp

- Giữ thư viện 24 phong cách và nghiên cứu mẫu nhà theo hồ sơ khách. Bổ sung đọc chứng cứ từ `model_output` của Gemini Interactions; liên kết do AI viết trong JSON không tự trở thành nguồn xác minh.
- Lưu nguồn của mẫu đã chọn vào `project.designEvidence.research`. Chọn mẫu vẫn là ý định thiết kế, không tự thay số đo, mặt bằng, vật liệu hoặc ngân sách.
- Đổi tọa độ màn hình về mét bằng inverse SVG matrix với `DOMPoint`, giữ độ chính xác khi xoay, zoom và pan.
- Hiện “Làm lại” cạnh “Hoàn tác” khi có thao tác để làm lại. Giữ chặn phòng/cửa chồng nhau, khóa phòng/tầng và nguyên tử hóa thao tác không hợp lệ.
- Giữ tay nắm góc của phòng đang chọn ở trên phòng bên cạnh. Chặn cú click phát sinh sau hai điểm chạm tạo phòng để điện thoại không tự chọn lại phòng cũ.

## Đợt 2: nguồn khu đất và hình học

- Thêm hai cấu trúc có phiên bản, đi cùng vòng đời lưu/mở/nhập dự án: `project.designEvidence` và `project.constructionDesign`.
- Tab khu đất có một mục mở rộng để nhập nguồn ranh, số đo, quy hoạch, khoảng lùi hoặc nhà cung cấp. Lưu tên tài liệu, đơn vị, URL, ngày, phạm vi, giá trị và trạng thái.
- Ranh mặt bằng theo mét chỉ được áp dụng khi có mốc đo và nguồn khách/khảo sát. Giữ dữ liệu VN-2000 gốc nếu thiếu tài liệu chuyển hệ; không suy ra tọa độ khảo sát từ ghim bản đồ.
- Kiểm tra đỉnh trùng, cạnh tự cắt, diện tích và phạm vi kích thước hiện được hỗ trợ: rộng 2–30 m, sâu 4–80 m theo cạnh mặt tiền đã chọn. Đầu vào lỗi không ghi đè dự án hoặc lịch sử.
- Đổi vị trí/địa chỉ, ranh hoặc nguồn gốc sẽ đánh dấu chứng cứ cũ và bỏ kết quả nhà cung cấp không còn cùng phạm vi. Tài liệu cũ và mốc ngân sách vẫn được giữ.
- Bản vẽ kiểm tra phòng, mặt ngoài tường và phần mái đua theo ranh/khoảng lùi đã nhập. Đổi nguồn khu đất, khoảng lùi, cạnh mặt tiền hoặc đầu vào kỹ thuật làm đổi mã phiên bản và khiến hồ sơ rà soát cũ cần đối chiếu lại.
- Kiểm tra ô thang giữa các tầng và giếng thang máy liên tục. Thông số hãng chưa có, như pit và khoảng không đỉnh, tiếp tục là `null`.
- Bản bàn giao thiết kế chỉ lấy trường được cho phép: ranh theo mét, căn cứ nguồn, khoảng lùi, hình học và khối lượng. Không đưa tài liệu gốc/ghi chú riêng, thông tin gia đình, tài khoản hoặc tài chính riêng vào bản chia sẻ thiết kế.

## Kết nối nguồn và chi phí

Google Search cho mẫu nhà yêu cầu đồng thời key/model hợp lệ và:

```dotenv
GEMINI_SEARCH_ENABLED=true
GEMINI_DESIGN_RESEARCH_ENABLED=true
GEMINI_DESIGN_RESEARCH_QUOTA=allowed
```

Nghiên cứu web khu đất yêu cầu thêm:

```dotenv
GEMINI_SITE_SEARCH_ENABLED=true
GEMINI_SITE_SEARCH_QUOTA=allowed
```

Google Places là khả năng riêng, chỉ gọi khi có key server và `BMH_GOOGLE_PLACES_ENABLED=true`. Không bật Places chỉ vì đã có key Gemini. Không thay đổi khóa hoặc bật dịch vụ có phí trong bản nâng cấp này. Khi Search chưa được phép hoặc hết hạn mức, thư viện BMH vẫn dùng được.

Danh sách OSM/Places có nguồn, ngày nhận và cơ sở khoảng cách đường chim bay. Đề xuất web phải có chứng cứ trang nguồn cho tên đơn vị; thông tin địa chỉ/điện thoại không có trong nguồn bị bỏ. Không có tọa độ thì không tính khoảng cách.

## Kiểm chứng phát hành

- `npm test`: 25 tệp kiểm tra, gồm hợp đồng đầu vào, dự án, bản vẽ, 3D, vật liệu, tài chính, SQL và các hợp đồng mới về nguồn.
- `node --test tools/bmh-team/test/*.test.mjs`: 57 kiểm tra tương thích với bộ điều phối hiện có.
- `tests/customer-design.browser.cjs`: thao tác thật trên máy tính/điện thoại; công năng từng tầng, sửa cửa/lối đi/phòng, khóa, hoàn tác/làm lại, inverse SVG matrix, vị trí cửa 3D, đổi vật liệu, 10 tab và tải lại dự án.
- `tests/design-evidence.browser.cjs`: nhập ranh 5×20, từ chối ranh tự cắt, nguồn quy hoạch/nhà cung cấp, lưu/mở/tải lại/nhập dự án và đánh dấu nguồn cũ; kiểm tra không tràn ngang trên điện thoại.
- Fixture hình học bổ sung: ranh chữ L, ba tầng, ô thang và giếng thang máy. API AI, bản đồ có phí, thanh toán và dữ liệu khách thật được chặn trong các lượt kiểm tra giao diện.

Kết quả CI và trạng thái triển khai được ghi ở checks của PR/commit. Chỉ cập nhật nguồn, cấu hình mẫu và kiểm tra; `dist`/`public` được dựng lại bởi hệ thống phát hành.

## Giới hạn đầu ra

Tài liệu quy hoạch do khách nhập chưa xác nhận diện tích được cấp phép. Các khoảng lùi là dữ liệu đầu vào cho phương án, cần đối chiếu phạm vi áp dụng. Kho dữ liệu kỹ thuật không tự sinh thiết kế móng/cột/dầm đã được duyệt. Hồ sơ để thi công vẫn cần khảo sát, đầu vào kết cấu/điện nước và rà soát chuyên môn của KTS/KS.
