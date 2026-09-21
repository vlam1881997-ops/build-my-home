# Quyết định giao diện Build My Home

## Mục tiêu

Để người chưa rành kiến trúc thử bố trí nhà theo nhu cầu và nhìn rõ ngân sách. Giữ ngôn ngữ hình ảnh của 10 ảnh đã cung cấp, nhưng biến thành không gian thao tác thực tế.

## Hệ thống hình ảnh

- Olive #526848 là màu hành động và trạng thái lựa chọn.
- Xanh đậm #263B30 dùng cho khu vực mở đầu; đất nung #B6795F tạo điểm nhấn.
- Nền #F5F6F2; thẻ trắng; đường phân cách #E3E7DF.
- Segoe UI/system font để hiển thị tiếng Việt không phụ thuộc tải font.
- Khoảng cách chính 16–24 px; bo góc 10–17 px; bóng nhẹ, ưu tiên tương phản và không gian làm việc.
- Không có logo ngân hàng, lời chứng thực kiến trúc sư giả, nhà thầu giả, đánh giá sao hoặc thanh toán giả.

## Hành trình

1. Khởi tạo: ảnh mẫu / bản vẽ / bắt đầu từ đầu.
2. Tài chính: đầu vào bên trái, ảnh hưởng hàng tháng bên phải.
3. Vị trí: thông tin nhập và tình trạng nguồn dữ liệu tách rõ.
4. Khu đất: hình học, nhu cầu gia đình, sở thích cá nhân.
5. Thiết kế: danh sách phòng → mặt bằng → thuộc tính. Trên mobile ba vùng xếp dọc, không ép thu nhỏ toàn bộ giao diện desktop.
6. Vật liệu: chọn gói nhanh, sau đó điều chỉnh từng hạng mục.
7. Không gian: sơ đồ 2.5D từ dữ liệu, ảnh tham khảo riêng, giả định bảo trì có thể chỉnh.
8. Dự toán: ngân sách và chi phí thống nhất, liệt kê phạm vi chưa đủ dữ liệu.
9. Theo dõi: checklist bắt đầu chưa hoàn tất; sổ chi thực tế bắt đầu trống.
10. Hồ sơ: có thể tải trước khi thi công, không mặc định công trình đã hoàn thành.

Thanh ngân sách luôn ở cuối màn hình; mọi bước có thể mở trực tiếp. Tên dự án, địa điểm, số tầng và giá trị cùng dùng một state. Upload chỉ là tài liệu đối chiếu, không tự chuyển thành bản vẽ chính xác.

## Thiết kế tương tác đã chọn

Chọn phòng trên hình hoặc danh sách; sửa rộng/sâu/vị trí; kéo phòng trong ranh đất. Thay đổi diện tích ảnh hưởng dự toán ngay. Chồng lấn tạo cảnh báo để không che giấu diện tích bị tính trùng. Lưu phương án trước khi thử một cách bố trí mới. Hoàn tác trong phiên dành cho thao tác phòng; giảm số tầng hoặc kích thước đất hỏi lại vì có thể mất phòng.

## Những việc cần làm tiếp để trở thành sản phẩm thật

1. Chuẩn hóa mô hình hình học: tường, cửa, cửa sổ, cao độ, kết nối tầng, khoảng thông tầng, phần diện tích ngoài phòng, kiểm tra lối đi.
2. Tạo mesh 3D từ cùng mô hình; ánh sáng, vật liệu, camera ngoại thất và từng phòng. Không dùng ảnh minh họa thay cho kết quả 3D.
3. Bóc tách khối lượng theo dữ liệu được kiểm chứng, lưu nguồn giá/ngày/đơn vị và các khoản chưa xác định. Cần chuyên gia rà soát.
4. Backend tài khoản, dự án/phiên bản, tệp, đồng bộ nhiều thiết bị và quyền riêng tư.
5. Kết nối dữ liệu địa phương, nguồn vật tư thật, lãi suất có nguồn. Tách dữ liệu đã xác minh khỏi giả định.
6. Sau khi kiểm chứng giá trị sử dụng mới quyết định gói trả phí và thanh toán. Không đưa marketplace/lead nhà thầu vào bản đầu.

## Tiêu chí nghiệm thu bản giao diện

Đi đủ 10 bước; sửa phòng thấy dự toán thay đổi; dữ liệu không nhảy từ dự án khác; không có nội dung hứa hẹn dữ liệu thị trường thật; mobile không tràn ngang toàn trang; xuất dữ liệu sử dụng được; tải lại vẫn giữ dự án cục bộ.
