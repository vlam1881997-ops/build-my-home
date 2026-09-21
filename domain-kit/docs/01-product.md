# Làm rõ sản phẩm Build My Home

## 1. Câu trả lời sản phẩm phải mang lại

Người dùng chính là người dự định xây hoặc sửa nhà, muốn biết: mình có thể làm phương án nào, khoản nào còn thiếu, tiền phải trả khi nào, và cần chuẩn bị gì để làm việc với người thiết kế/nhà thầu. Bản đầu ưu tiên xây mới nhà ở riêng lẻ; cải tạo là nhánh mở rộng có thêm khảo sát hiện trạng, tháo dỡ và nhu cầu lưu trú tạm.

Đơn vị dữ liệu chính là **một dự án nhà**, có nhiều **phương án**. Mỗi phương án liên kết tài chính, khu đất, mặt bằng, vật liệu và bản dự toán có phiên bản. Người dùng so sánh phương án A/B mà không mất thiết kế ban đầu.

Ba lớp tính năng cần phân biệt:

| Lớp | Vai trò | Không được nhầm với |
|---|---|---|
| Công thức / quy tắc | Tính khối lượng, tiền, dòng tiền; kiểm tra dữ liệu | LLM tự nghĩ số tiền |
| AI hỗ trợ | Đọc tài liệu, gợi ý phong cách, giải thích kết quả | Kết luận kỹ thuật đã được chuyên gia phê duyệt |
| Chuyên môn có người duyệt | Thiết kế kết cấu, xác nhận chỉ dẫn kỹ thuật, review bản vẽ | Avatar chuyên gia giả hoặc điểm an toàn tự sinh |

Ưu tiên thị trường Việt Nam và VND ở bản đầu. Thiết kế dữ liệu cho nhiều quốc gia nhưng chưa gắn cờ “hỗ trợ” nơi không có dữ liệu giá/quy tắc. Không cần đối tác để dùng chức năng cốt lõi.

## 2. Chốt hành trình 10 bước

### Bước 1 — Khởi tạo dự án

Ba lối vào: `reference_photo` (ảnh nhà thích), `floor_plan` (bản vẽ), `guided` (chưa có gì). Tạo cùng loại Project; khác cách thu nhận đầu vào chứ không tách ba app.

- Nhập tên dự án; chọn xây mới/cải tạo (cải tạo hiển thị chưa hỗ trợ ở MVP).
- Ảnh mẫu: JPG/PNG tối đa 10 tệp, 20 MB/tệp; xác nhận có quyền sử dụng. Ảnh chỉ là tham chiếu phong cách.
- Bản vẽ: JPG/PNG/PDF tối đa 20 MB/tệp; PDF chọn trang/tầng, giới hạn trang được cấu hình ở backend. Không chạy script trong PDF.
- Chưa có gì: chọn nhu cầu và bộ mẫu. Cho dùng thử trước đăng nhập; mời đăng nhập khi cần đồng bộ/khôi phục trên máy khác.
- Thấy ngay danh sách file đã nhận, tải lỗi, đang phân tích, cần bổ sung dữ liệu. Cho xóa và thay file.

Đầu ra: Project ID, nhánh khởi tạo và Assets có mục đích sử dụng. Ảnh mẫu từ bước 1 phải xuất hiện lại đúng ở bước 5. Tải ảnh không tự tạo số phòng hoặc mét vuông.

### Bước 2 — Tài chính và khoản vay

Nhập tiền mặt hiện có, quỹ khẩn cấp gia đình, thu nhập ròng, chi phí sinh hoạt, khoản trả nợ đang có. Thu nhập trước khấu trừ là trường riêng nếu muốn hiển thị DTI theo định nghĩa tổng thu nhập. Không gọi tỷ lệ trên thu nhập ròng là DTI ngân hàng.

Khoản vay có: số tiền dự kiến, trạng thái `hypothetical/approved/disbursed`, kỳ hạn, phương pháp gốc đều/niên kim, lịch thay đổi lãi, lịch giải ngân. Ngân hàng là nguồn thông tin sản phẩm, không phải bằng chứng app đã đánh giá “uy tín nhất”. Mọi gói vay thật cần nguồn, ngày hiệu lực và điều kiện; chưa có nguồn thì người dùng tự nhập kịch bản.

Kết quả cần có:

- Lịch từng tháng: dư nợ đầu kỳ, lãi suất, gốc, lãi, phí, tổng trả, dư nợ cuối kỳ.
- Tháng đầu; tháng bắt đầu đổi lãi; tháng trả cao nhất; tổng lãi; tổng tiền trả.
- Tiền còn lại = thu nhập ròng − sinh hoạt − nợ hiện có − khoản vay mới. Ảnh số 2 thiếu trừ 8 triệu sinh hoạt khi hiển thị tiền còn lại; code không chép số đó.
- Vốn có thể phân bổ = tiền mặt − quỹ khẩn cấp + khoản vay trong kịch bản. Tách rõ vốn vay chưa duyệt; không ghi “đã có tiền”.
- Dự phòng công trình tính trong dự toán, không đồng thời trừ khỏi vốn rồi cộng vào tổng chi lần hai.
- Stress test có thể thay lãi suất, giảm thu nhập và lùi tiến độ. Ngưỡng 35%/50% nếu dùng chỉ là cấu hình cảnh báo của app, không phải cam kết cho vay hay bảo đảm an toàn.

Code hiện có tính lãi theo tháng, giải ngân khoản vay một lần; bộ tính khoản vay giải ngân nhiều đợt/lãi theo ngày/phí trả trước nằm ở backlog. Không lấy lịch giải ngân tiến độ rồi gắn nhãn như đã tính lãi khoản vay nhiều đợt.

### Bước 3 — Vị trí, khí hậu và dữ liệu giá

Chọn quốc gia, đơn vị hành chính theo danh mục có phiên bản, địa chỉ tùy chọn, tọa độ nếu người dùng đồng ý. Không hardcode danh sách địa phương hay cấp hành chính từ ảnh cũ. GPS/địa chỉ cụ thể không bắt buộc để thử app.

Mỗi thông tin khu vực cần `source`, `observedAt`, `validUntil`, độ phủ. Các yếu tố nắng, ngập, ven biển, gió và điều kiện vận chuyển có trạng thái: được người dùng khai báo / có nguồn / chưa biết. Bản đồ là ngữ cảnh, không thay khảo sát lô đất.

Giá vật tư theo SKU, đơn vị, vùng giao hàng, thời điểm, nhà cung cấp, VAT, vận chuyển và điều kiện mua. Khi không có giá: cho nhập báo giá thủ công hoặc dùng dữ liệu demo có nhãn; không tự gọi đó là “giá hiện có”. Giá cũ vẫn xem được nhưng cần cảnh báo và xác nhận khi tạo bản dự toán mới.

Đổi vị trí phải làm cũ bảng giá, dự toán, gợi ý và mô phỏng; không làm mất thiết kế đã vẽ. Không tự áp hệ số +5% từ ảnh số 3 cho mọi công trình.

### Bước 4 — Khu đất, địa chất, gia đình và phong thủy

Thông tin bắt buộc: hình đất/kích thước, hướng đo, số tầng dự kiến, khoảng lùi do người dùng/đơn vị thiết kế cung cấp, nhu cầu phòng và khả năng tiếp cận công trường.

Thông tin có thể chưa biết: lịch sử san lấp, nền đất, mực nước, hiện trạng công trình liền kề, kết quả khảo sát. Có nút “chưa biết”; phân biệt tự khai với hồ sơ được kỹ sư xác nhận.

App tạo danh sách câu hỏi cần khảo sát và kịch bản chi phí móng có giả định. Không tự chọn móng băng/cọc hay chiều sâu cọc từ địa chỉ, ảnh, loại đất trong dropdown. Người dùng hoặc kỹ sư có thể nhập phương án đã xác nhận; từ đó mới bóc chi phí phương án đó.

Gia đình: số người, người lớn tuổi, trẻ nhỏ, nhu cầu tiếp cận, phòng làm việc, xe, cách nấu ăn, phong cách, khả năng mở rộng. Hỏi dần tại bước liên quan, không buộc khai toàn bộ lúc mở app.

Phong thủy là tùy chọn văn hóa: bật/tắt; chọn trường phái/quy tắc; năm sinh và dữ liệu cần thiết cho từng người phải tự nguyện, nêu mục đích. Lưu hướng theo độ và nguồn đo. Gợi ý cửa, bếp, ban thờ, phòng từng thành viên kèm giải thích; xung đột với tiếp cận, thoát nạn, thông gió hoặc nhu cầu gia đình phải được nêu rõ. Không quy thành bảo đảm sức khỏe/tài lộc; không cộng vào điểm an toàn kỹ thuật. Phần tính Bát trạch chưa triển khai, cần bộ quy tắc được duyệt và test riêng.

### Bước 5 — Thiết kế từng tầng, từng phòng

Đây là module lớn, không phải một nút “AI tạo nhà”. Gồm ba tác vụ:

1. **Nhập bản vẽ:** chọn trang, xác lập đơn vị, đặt hai điểm có khoảng cách thật, kiểm tra tỷ lệ từng tầng. Kết quả OCR là ứng viên có độ tin cậy; người dùng xác nhận trước khi dùng tính tiền.
2. **Editor ý tưởng 2D:** tầng, phòng, tường dùng chung, lỗ cửa, cửa đi/cửa sổ, cầu thang, khoảng thông tầng, ban công, nội thất. Thêm/xóa/di chuyển/đổi kích thước, zoom, lưới, undo/redo, lưu tự động, lịch sử phương án.
3. **Gợi ý 3–5 phương án:** lọc theo kích thước đất, ngân sách kịch bản, số phòng, tiếp cận và phong cách. Giải thích vì sao phù hợp; nếu không có phương án đáp ứng thì nói rõ ràng, cho đổi yêu cầu.

Đầu ra là DesignVersion: hình học theo mét, từng tầng và các thực thể có ID ổn định. 2D, 3D, khối lượng và ảnh xuất phải dùng cùng phiên bản hình học. Không cộng chu vi từng phòng thành chiều dài tường vì tường chung bị tính đôi. Tổng diện tích phòng sử dụng khác tổng diện tích sàn xây dựng.

Có thể mô tả chi tiết không gian cho từng phòng, từng tầng; bản vẽ kết cấu thi công và hồ sơ xin phép là tuyến chuyên môn riêng. Không xuất tệp có nhãn “bản vẽ thi công đã duyệt” khi chỉ có mặt bằng ý tưởng.

### Bước 6 — Vật liệu và chi phí thay đổi

Ba preset tiết kiệm / tiêu chuẩn / cao cấp chỉ là cấu hình ban đầu; cho thay từng hạng mục, từng phòng. Danh mục gồm phần thô, mái, chống thấm, sơn, sàn, cửa, điện nước, thiết bị vệ sinh và nội thất trong phạm vi dự toán.

Mỗi SKU cần đơn vị, quy cách, thông số có nguồn, xuất xứ/tài liệu nếu có, tương thích sử dụng, bảo hành, giá và phạm vi giao hàng. Giá cao không tự suy ra chất lượng tốt, giá thấp không tự suy ra tuổi thọ kém.

Hiển thị chênh lệch khi đổi vật liệu, khoản nào bị ảnh hưởng và chênh lệch chi phí vòng đời theo giả định. Không tự nâng gói hoặc tự thêm sản phẩm sau cảnh báo; đề xuất cần người dùng áp dụng. Sản phẩm tài trợ nếu có phải gắn nhãn riêng, không tự tăng điểm kỹ thuật.

### Bước 7 — Mô phỏng 3D, vòng đời và đánh giá

**3D:** giai đoạn đầu xem khối hình từ mặt bằng + tầng + cửa; xoay, zoom, tách tầng, đổi bề mặt. Sau đó mới nâng walkthrough/nội thất/ánh sáng. Ảnh minh họa AI phải ghi đúng loại, không gọi là mô hình 3D khớp kích thước. Thiết bị yếu có chế độ 2D thay thế.

**Vòng đời:** so sánh năm 0/1/3/5/10 theo kịch bản bảo trì, giá năng lượng, cách sử dụng, môi trường và lạm phát. Hiện giả định cho mỗi khoản sửa chữa. Vệt ố/nứt minh họa không được trình bày như dự đoán chắc chắn hoặc xác nhận kết cấu sẽ hỏng. LCC không cộng lại gốc vay sau khi đã tính tiền xây.

**Đánh giá:** đề xuất bộ trọng số phiên bản 1: ngân sách 25, công năng 20, khí hậu 15, lựa chọn vật liệu 15, ánh sáng/thông gió 10, thẩm mỹ theo sở thích 10, khả năng cải tạo 5. Đây là đề xuất chốt để thay các bộ điểm không nhất quán trong tài liệu. Phong thủy tách riêng; kết cấu chuyên môn hiển thị “cần đánh giá” thay cho điểm tự sinh.

Mỗi tiêu chí cần đầu vào đủ, rule ID, phiên bản, bằng chứng và gợi ý. Thiếu dữ liệu ghi chưa đánh giá, không cho mặc định 80 điểm. Có thể hiển thị điểm tạm tính trên phần đã đủ dữ liệu và tỷ lệ độ phủ, nhưng không gọi là điểm toàn bộ. AI viết nhận xét từ kết quả quy tắc; không thay giá, không xác nhận thi công an toàn.

Chỉ hiển thị nhận xét KTS khi có review thật: người nhận xét, thời gian, phạm vi, phiên bản thiết kế và trạng thái xác nhận. Bỏ avatar/tên người giả của mockup khỏi sản phẩm.

### Bước 8 — Dự toán và gói hồ sơ

Bảng tổng quan miễn phí: hạng mục, khối lượng/đơn vị, vật liệu, nhân công, máy móc, vận chuyển, thuế, hao hụt, chi phí khác, dự phòng; ghi rõ đã gồm/chưa gồm. Các chi phí khảo sát, thiết kế, thủ tục, tháo dỡ, điện nước tạm, xử lý nền, sân/cổng, đồ rời, chỗ ở tạm đều có trường đánh dấu áp dụng hoặc loại trừ. Không mặc định mọi mục bằng 0 rồi gọi dự toán đầy đủ.

Tách 3 mức dữ liệu: ước tính theo diện tích; bóc tách sơ bộ từ mặt bằng; khối lượng do chuyên gia/nhà thầu xác nhận. Chỉ mức có đủ thông tin mới liệt kê khối lượng cụ thể tương ứng. Thiếu giá/khối lượng thì báo thiếu, không âm thầm tính bằng 0.

Thanh toán là module bật sau: mức 99.000 VND trong ảnh là **giá dự kiến**, backend cấu hình giá sản phẩm và lưu vào đơn; không lấy số tiền từ trình duyệt. Đề xuất gói theo một dự án, cho xuất lại các phiên bản dự án đó; nếu cần hạn mức AI/3D phải ghi rõ trước khi bán.

Luồng chuẩn: tạo Order → payment provider → QR động → backend xác minh webhook → giao dịch DB cấp Entitlement → UI đọc trạng thái → mở chức năng. Return URL, ảnh biên lai hay nút “đã chuyển” không mở khóa. Gửi thiếu/thừa/sai mã cần đối soát, hết hạn không tự mất tiền; thanh toán trễ đưa về kiểm tra. Có hoàn tiền/hỗ trợ và nhật ký.

Ở đợt thử miễn phí: `PAYWALL_ENABLED=false` do server quyết định; bước 9–10 mở theo chính sách thử nghiệm, không tạo giao dịch giả. Khi chưa kết nối provider thì không hiển thị QR thật hoặc nút nhận tiền.

### Bước 9 — Theo dõi thi công và checklist

Tên thực tế nên là **Theo dõi thi công**, vì app không tự giám sát công trường. Bảy nhóm: móng, kết cấu, tường, mái, MEP, hoàn thiện, nội thất/bàn giao. Mỗi công việc có ngày dự kiến/thực tế, người phụ trách, ảnh/tài liệu, ghi chú, ngân sách, thanh toán và vấn đề cần xử lý.

Checklist có trạng thái chưa kiểm tra / đạt / không đạt / không áp dụng, người kiểm tra, ngày và chứng cứ. Hoàn tất công việc khác nghiệm thu kỹ thuật. Tự tick đủ ô không thay xác nhận của người có trách nhiệm.

Thông số MEP phải là template có phiên bản, căn cứ, phạm vi và người duyệt. Các số đường kính ống, tiết diện dây, áp lực thử trong ảnh không được sao chép thành chuẩn chung. Giữ placeholder “theo thiết kế đã được xác nhận” cho tới khi có nội dung chuyên môn phù hợp.

Ghi nhận phát sinh bằng ChangeOrder: trước/sau, chi phí, lý do, ảnh hưởng thời gian và người chấp thuận. Không sửa âm thầm bảng dự toán đã chốt. Hỗ trợ in checklist để dùng tại công trường.

### Bước 10 — Hồ sơ, giải ngân và bàn giao

Trung tâm tải: PDF tổng hợp, Excel dự toán, mặt bằng ý tưởng, bảng vật liệu, checklist, mẫu biên bản, lịch trả nợ và dòng tiền, ZIP tổng hợp. Mỗi tệp có project/scenario/revision, ngày, nguồn giá, giả định và trạng thái tài liệu. Excel cần công thức, đơn vị và phân biệt ô nhập/ô tính; PDF phải nhất quán số tiền với snapshot.

Gói dự toán có thể tải ngay sau khi đủ dữ liệu/quyền; không bắt đợi nhà xây xong. Hồ sơ thi công/bàn giao có trạng thái nháp cho tới khi chứng cứ hoàn tất. Tải file không tự đặt công trình thành “đã bàn giao”.

Lịch thanh toán gắn mốc công việc, điều kiện nghiệm thu, hạn dự kiến, số thực trả và số còn lại. Tổng các mốc bao gồm phần giữ lại phải đúng 100%. Tỷ lệ/độ dài giữ lại bảo hành do hợp đồng nhập, không mặc định 5%/12 tháng là bắt buộc. Hiển thị người xác nhận bàn giao và các tồn đọng.

## 3. Chức năng nền ngoài 10 màn hình

| Nhóm | Tính năng cần có |
|---|---|
| Hồ sơ và tài khoản | Đăng nhập, quên mật khẩu, đồng bộ, xuất/xóa dữ liệu cá nhân, phiên đăng nhập |
| Dự án | Tạo/sao chép/lưu nháp/lưu trữ, nhiều phương án, lịch sử sửa, khôi phục, chia sẻ có quyền |
| Thư viện mẫu | Lọc diện tích, tầng, phòng, phong cách; quyền sử dụng mẫu và phiên bản |
| Nội dung/kiến thức | Bài giải thích có nguồn, phiên bản và ngày review; tìm kiếm theo bước |
| Quản trị giá | Import, kiểm tra đơn vị, phát hiện bất thường, duyệt, nguồn, hết hạn, lịch sử |
| Quản trị quy tắc | Mẫu checklist, điểm đánh giá, giả định vòng đời, danh mục địa phương; duyệt trước phát hành |
| Quản trị vận hành | Job lỗi/retry, hạn mức AI, đơn hàng/đối soát, hỗ trợ, nhật ký thao tác |
| Thông báo | Lỗi tác vụ, hồ sơ đã xuất, giá cũ, mốc thanh toán; người dùng chọn kênh |
| Trải nghiệm | Mobile, bàn phím, tương phản, trạng thái tải/lỗi/rỗng, không mất dữ liệu khi đổi bước |

Marketplace/nhà thầu giữ trong kiến trúc nhưng **tắt ở MVP**. Không tạo nhà thầu, review hoặc tài trợ giả. Sau này chỉ chia sẻ hồ sơ với đối tác được chọn và sự đồng ý riêng của khách; đồng ý dùng app không phải đồng ý bán thông tin.

## 4. Những điểm mockup cần sửa khi code

| Ảnh / nội dung | Điểm chưa chặt | Cách triển khai |
|---|---|---|
| 2 → 8 → 9 → 10 | 800 triệu tiền mặt + 500 triệu vay, dự toán 5,3 tỷ, thi công 1,5 tỷ, bàn giao 2,45 tỷ | Dùng cùng project/scenario; khác số chỉ khi có phiên bản/phát sinh rõ ràng |
| 2 | Lãi tháng sau ưu đãi và số dư còn lại là số minh họa | Tính từ lịch vay cụ thể và trừ đủ chi phí |
| 3 | Header TP.HCM trong khi chọn Đà Nẵng | Header địa điểm lấy từ dự án đang mở |
| 4 | Chốt móng chỉ theo loại đất | Trạng thái khảo sát và chuyên gia xác nhận |
| 5 | Từ ảnh phối cảnh suy diện tích/phòng chính xác | Chỉ tham chiếu phong cách; yêu cầu kích thước/bản vẽ |
| 6 | Tuổi thọ >50 năm hoặc chênh lệch bảo trì không có căn cứ | Gắn nguồn/giả định; không suy tuổi thọ nhà từ gạch |
| 7 | Điểm AI, review KTS, phong thủy hòa chung | Rule minh bạch, review thật, phong thủy riêng |
| 8 | QR/tài khoản minh họa có thể bị hiểu là thật | Chỉ sinh QR từ đơn máy chủ qua provider đã cấu hình |
| 9 | Checklist và trạng thái thanh toán đều có dấu đạt sẵn | Trạng thái lấy dữ liệu thật và kiểm tra quyền trên server |
| 10 | Vừa vào bước đã hoàn thành công trình | Phân biệt tải hồ sơ thiết kế với nghiệm thu bàn giao |

## 5. Hướng thương mại có thể bật dần

Làm hữu ích trước: miễn phí thử phương án, tài chính, xem dự toán và báo cáo cơ bản. Khi bộ hồ sơ có chất lượng ổn định mới bán gói chi tiết/tiện ích theo dõi. Sau khi có người dùng và đối tác thật mới thử lead có đồng ý, tài trợ có nhãn, và tài khoản đơn vị thiết kế. Giá 99k–199k hay phí thuê bao trong bản trao đổi là giả thuyết kinh doanh cần kiểm chứng, không được ghi là doanh thu chắc chắn.
