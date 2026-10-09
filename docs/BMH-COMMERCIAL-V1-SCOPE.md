# BMH — Phạm vi bản thương mại v1

Ngày khóa: 09/10/2026. Chủ sản phẩm: Văn Lâm.

Yêu cầu đã chốt: **hoàn thiện 24 phong cách hiện có, bổ sung vật liệu phù hợp với 24 phong cách đó, hoàn thiện luồng thương mại; sau khi có người dùng mới mở rộng.**

Tài liệu này là phạm vi chung cho các phiên làm việc và cả hai Codex. Khi kế hoạch cũ rộng hơn, thực hiện theo phạm vi này. Đây là khóa phạm vi và tiêu chí bàn giao, không phải thông báo phần mềm đã hoàn thành.

## 1. Phạm vi cố định

- Giữ đúng 24 ID phong cách trong bảng dưới; không thêm phong cách thứ 25, đổi ID hoặc bỏ phong cách đã có trong v1.
- Giữ luồng hiện tại: đầu vào → khu đất → gia đình/công năng từng tầng → bản vẽ → vật liệu → 3D → dự toán/ngân hàng → tiến độ → hồ sơ/bàn giao, theo điều hướng 10 tab đang có.
- Nâng cấp độ chính xác, chất lượng hình ảnh, vật liệu, thao tác và độ tin cậy của luồng đó. Không mở thêm dòng sản phẩm, bộ điều phối tài khoản hay tính năng phụ để trì hoãn đầu ra chính.
- Khách được sửa bố trí, thêm/xóa phòng, cửa, cửa sổ và chọn vật liệu. Gợi ý phong cách/phong thủy không âm thầm thay lựa chọn khách.
- Dự án cũ và phối vật liệu riêng phải tiếp tục mở được. Vật liệu khác bảng gợi ý vẫn được chọn, với phản hồi về độ phù hợp thay vì tự thay thế.
- Việc hỗ trợ 24 phong cách không phải cam kết tự động thiết kế hợp lệ mọi hình dạng đất, hệ kết cấu hay quy hoạch. Trường hợp vượt năng lực phải được nhận diện trước khi xuất hồ sơ.

## 2. Danh sách 24 phong cách và hướng vật liệu

Tên và ID lấy từ `src/44_house_styles.js` và `src/75_completion.js`. Vật liệu trong bảng là mục tiêu tuyển chọn cho v1, chưa phải danh mục SKU đã xác minh hoặc chứng nhận vật liệu xây dựng.

| ID cố định | Phong cách hiện có | Ngoại thất / mái / cửa | Nội thất / bề mặt chủ đạo |
|---|---|---|---|
| modern | Hiện đại | Sơn phẳng, đá, kính và nhôm; mái phẳng | Porcelain, gỗ, kim loại; đường nét gọn |
| minimal | Tối giản | Sơn ít màu, kính, nhôm; chi tiết tiết chế | Sơn mịn, sàn liền mạch hoặc gạch ít vân, gỗ sáng |
| contemporary | Đương đại | Đá, kính, kim loại và mảng gỗ | Đá, gỗ, vải; phối sắc và hình khối đương đại |
| classic | Cổ điển | Sơn, đá, phào, ngói theo phương án | Đá cẩm thạch, gỗ, vải và chi tiết cổ điển |
| neo | Tân cổ điển | Sơn sáng, phào tiết chế, đá, cửa cân đối | Đá, gỗ, vải; phào và kim loại vừa phải |
| indochine | Đông Dương · Indochine | Sơn, ngói, gỗ, lam và cửa phù hợp khí hậu | Gạch bông, gỗ tối, mây tre; họa tiết Đông Dương |
| mediterranean | Địa Trung Hải | Vữa/sơn hiệu ứng, đá, ngói đất nung, hiên vòm | Đá sáng, terracotta, gỗ và vải tự nhiên |
| scandi | Bắc Âu · Scandinavian | Gỗ hoặc lớp ốp phù hợp khí hậu, sơn sáng, mái dốc | Gỗ sáng, sơn sáng, len/vải và đồ gỗ thanh |
| japandi | Japandi | Sơn trung tính, gỗ, lam và đá tiết chế | Gỗ tự nhiên, vải thô, đá; sắc ấm và ít chi tiết |
| japanese | Nhật Bản | Gỗ/lam, mái và cửa theo ngôn ngữ Nhật | Gỗ, vật liệu gợi shoji/tatami có quy cách rõ, vải tự nhiên |
| tropical | Nhiệt đới | Gỗ/lam, đá, mái che, kính có giải pháp che nắng | Gỗ, mây, đá, vải thoáng; ưu tiên vật liệu hợp độ ẩm |
| artdeco | Art Deco | Đá, kim loại, nhịp hình học | Đá, gỗ, nhung và kim loại; họa tiết hình học |
| french | Pháp tỉnh lẻ | Sơn/vữa sáng, ngói, đá, cửa và chi tiết phù hợp | Gỗ, đá, vải tự nhiên; bảng màu mềm |
| spanish | Thuộc địa Tây Ban Nha | Vữa, ngói đất nung, đá, kim loại và vòm | Terracotta, gạch trang trí, gỗ và vải |
| tuscan | Tuscan · Ý | Đá, vữa sắc đất, ngói đất nung | Đá, terracotta, gỗ; bề mặt có chiều sâu |
| craftsman | Craftsman | Gỗ, đá, mái dốc và hiên có chi tiết rõ | Gỗ, đá, gạch; đồ gỗ theo ngôn ngữ Craftsman |
| tudor | Tudor | Mảng sơn sáng, nhịp gỗ tối, mái dốc | Gỗ tối, đá, vải; chi tiết nhận diện Tudor |
| barn | Modern Barn | Tôn/kim loại mái dốc, gỗ, kính | Gỗ, bê tông/gạch, kim loại; nhịp mái và kết cấu nhìn thấy theo thiết kế |
| midcentury | Mid-century Modern | Gỗ, kính, gạch/đá; đường ngang và mái thấp | Gỗ óc chó/teak phù hợp nguồn cung, da/vải, đồ chân thanh |
| industrial | Industrial | Gạch, kim loại, kính, bê tông | Gạch, bê tông, thép, gỗ, da/vải |
| brutalist | Brutalist | Bê tông hoặc hoàn thiện mô phỏng bê tông được ghi rõ | Bê tông/đá, gỗ và kim loại tiết chế |
| coastal | Coastal | Sơn sáng, gỗ/lam, mái và cửa thoáng | Gỗ sáng, đá/gạch sáng, linen và mây |
| vietnamese | Việt Nam đương đại | Ngói, gỗ/lam, đá, sơn; hiên và sân | Gỗ, gạch/đá, vật liệu địa phương phù hợp thiết kế |
| balinese | Bali | Ngói/mái và gỗ phù hợp khí hậu, đá, lam | Gỗ, đá, mây, vải tự nhiên; không gian nhiệt đới |

Không đổi vật liệu kết cấu chỉ để mô phỏng phong cách. Chi tiết mái, tải trọng, chống thấm/cháy, độ bền ngoài trời và hệ liên kết cần dữ liệu kỹ thuật phù hợp.

## 3. Bộ đầu ra phải có cho từng phong cách

Mỗi phong cách có một hồ sơ nghiệm thu, dùng cùng bản sửa đổi dự án và cùng bộ vật liệu:

1. Mẫu nhận diện ngoại thất và nội thất đã được duyệt: hình khối, mái, cửa, tỷ lệ, màu, đồ nội thất và chi tiết đặc trưng. Chia sẻ bộ nội thất chỉ khi kết quả vẫn đúng từng phong cách; đổi màu cùng một khối không đủ.
2. Bộ vật liệu đủ các vai trò áp dụng: mái, mặt ngoài, cửa/khung/kính, sàn, tường, trần, đồ gỗ, vải/da, khu ướt và cầu thang. Vai trò không áp dụng phải có lý do. Có phương án tiết kiệm và nâng cấp với tác động chi phí rõ.
3. Bản vẽ đo đạc, mô hình 3D và khối lượng cùng nguồn hình học. Đổi kích thước, tầng, phòng, cửa/cửa sổ hoặc vật liệu phải cập nhật các đầu ra liên quan; phát hiện giao cắt, vượt ranh và lỗi lối đi.
4. Ảnh chụp trực tiếp mô hình toàn nhà, ngoại thất và phòng tiêu biểu. Ánh sáng, texture đúng tỷ lệ, mái/cửa/cầu thang và nội thất đủ để khách hình dung nhà thực. Ảnh AI là phối cảnh tham khảo và phải đối chiếu với mô hình.
5. Thao tác chọn → sửa → lưu → mở lại → xuất hồ sơ giữ đúng phong cách/vật liệu. Đổi phong cách không làm mất lựa chọn vật liệu riêng hoặc dữ liệu khách.
6. Hồ sơ xuất thể hiện kích thước, bảng vật liệu, khối lượng, giá và nguồn, phiên bản dự án, hình phối cảnh và các phần còn cần xác nhận chuyên môn.

Phong cách được đánh dấu đạt chỉ khi có liên kết tới fixture, revision/commit, ảnh đầu ra, kết quả kiểm tra và người duyệt. Không đánh dấu đạt chỉ vì có ID trong danh sách hoặc test đơn vị chạy xanh.

## 4. Dữ liệu vật liệu và chi phí

- Mỗi sản phẩm cần nhà cung cấp, mã/quy cách khi có, đơn vị, vị trí dùng, thông tin kỹ thuật và nguồn tham khảo. Texture cần nguồn/quyền sử dụng và tỷ lệ thực; hình catalog không tự động là texture PBR hợp lệ.
- Phân biệt bề mặt mô phỏng, sản phẩm đã ghép mã hàng và sản phẩm đã đối chiếu dữ liệu/mẫu thực. Không gọi vật liệu chính xác SKU khi mới có màu hoặc ảnh minh họa.
- Giá cần địa bàn, ngày, nguồn, đơn vị và điều kiện vận chuyển/thuế/lắp đặt khi biết. Giá thiếu giữ trạng thái chưa có giá, không thay bằng 0 hoặc giá bịa.
- Tính khối lượng và hao hụt có công thức, phạm vi và tránh cộng trùng. Thay vật liệu cập nhật dự toán; phương án tối ưu phải nói rõ khoản tiết kiệm và tác động đến thiết kế/chất lượng.
- Gợi ý nhà cung cấp quanh đất và thông tin quy hoạch cần nguồn, thời điểm và trạng thái xác minh. Không có dữ liệu phải báo đúng trạng thái.

## 5. Các cổng nghiệm thu bản thương mại

| Cổng | Điều kiện đạt | Bằng chứng bắt buộc |
|---|---|---|
| 24 phong cách | Đủ 24 hồ sơ, mỗi hồ sơ đạt mục 3 | Danh sách 24/24 có ảnh và người duyệt |
| 2D / 3D | Cùng kích thước, tầng, cửa, mái và revision; sửa trực tiếp phản ánh ở đầu ra | Fixture đất chữ nhật, đất vát/lõm được hỗ trợ, nhiều tầng, cầu thang/thang máy khi chọn; số đo và file xuất |
| Vật liệu / dự toán | Vai trò vật liệu đủ; giá/khối lượng có nguồn hoặc trạng thái thiếu rõ; chọn lại và tối ưu đúng | Bảng SKU/bề mặt, nguồn giá, so sánh trước/sau |
| 10 tab / lưu dữ liệu | Luồng mới và dự án cũ chạy đầy đủ; mobile/desktop dễ dùng; lỗi mạng có phục hồi | Kịch bản trình duyệt xuyên suốt, lưu/mở lại và dự án cũ |
| Vận hành trả phí | Tài khoản, quyền truy cập, lưu/khôi phục dữ liệu, thanh toán và cấp quyền đúng; hỗ trợ, điều khoản và giới hạn sản phẩm rõ | Môi trường staging với giao dịch thử, cấu hình production đã xác minh, phương án rollback |
| Bàn giao khách | Hồ sơ nhất quán; giới hạn và hạng mục KTS/KS xác nhận được thể hiện đúng | Hồ sơ mẫu được chủ sản phẩm duyệt; kiểm tra chuyên môn theo phạm vi hồ sơ |

Không gắn nhãn hồ sơ sẵn sàng thi công khi phần kiến trúc/kết cấu/MEP và dữ liệu đất cần thiết chưa được người có chuyên môn xác nhận. Tiêu chí này thuộc mục tiêu ban đầu xây nhà bằng hồ sơ đáng tin cậy.

## 6. Trình tự hoàn thiện trong phạm vi đã khóa

1. Chốt một fixture nền và 24 mẫu nhận diện để so sánh trên cùng kích thước/camera; lập danh sách thiếu theo từng phong cách.
2. Làm đồng bộ hình học 2D/3D và thao tác chỉnh sửa; hoàn thiện thư viện vật liệu đúng vai trò, nguồn và đơn vị.
3. Hoàn thiện ngoại thất/nội thất/texture/ánh sáng của 24 phong cách. Nghiệm thu theo nhóm có đặc điểm gần nhau, nhưng kết quả duyệt riêng 24 mẫu.
4. Đồng bộ khối lượng, dự toán, hồ sơ xuất, lưu dữ liệu và luồng trả phí; xử lý lỗi chặn khách hàng.
5. Chạy các cổng ở mục 5 trên bản đã ghép, duyệt hình và hồ sơ thực; triển khai và xác minh đúng bản trên website.

Nếu tiếp tục chia hai Codex: A phụ trách hình học/bản vẽ/khối lượng; B phụ trách nhận diện 24 phong cách/vật liệu/3D/giao diện. Hai phần dùng cùng hợp đồng dữ liệu, fixture và revision. Đổi hợp đồng phải phối hợp trước; nghiệm thu tích hợp là nhiệm vụ bắt buộc sau ghép.

## 7. Trạng thái tại ngày khóa

Đối chiếu nguồn thấy đủ 24 ID. `src/99_customer_design.js` đã ánh xạ 24 ID sang 10 bộ nội thất; `src/102_architectural_identity.js` có nhận diện mặt đứng cho 24 ID. Đây là nền để hoàn thiện, chưa chứng minh chất lượng đầu ra của 24 mẫu đã đạt.

Chưa có bộ bằng chứng nghiệm thu đầy đủ 24/24 theo tài liệu này. Chưa đánh dấu bất kỳ cổng thương mại nào đạt chỉ bằng việc khóa phạm vi. Cập nhật kết quả thực trong các báo cáo QA, không thay tiêu chí cho khớp với tính năng đã làm.

Sau khi v1 đạt và có người dùng, thu phản hồi rồi mới lập phạm vi v2. Không tự bổ sung phong cách mới trong quá trình hoàn thiện v1.
