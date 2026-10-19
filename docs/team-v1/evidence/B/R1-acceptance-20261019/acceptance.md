# Biên bản nghiệm thu bản nâng cấp 1 · Modern

Ngày lập: 19/10/2026 (Asia/Saigon), theo yêu cầu lúc09:31. Người yêu cầu: Văn Lâm.

Yêu cầu: “nghiệm thu bản 1 đi còn làm bản 2”.

**Kết luận: chấp nhận bản phát hành phần mềm hiện tại làm mốc chuyển sang bản 2, có bảo lưu các cổng chưa đủ bằng chứng bên dưới.** Đóng vòng triển khai bản 1 tại PR72; giữ nguyên kết quả đã đạt. Đây là kết luận kiểm tra phần mềm do Codex tổng hợp, không ghi thay quyết định duyệt hình hay chữ ký chuyên môn của khách/KTS/KS.

## Bản được nghiệm thu

- Website: https://www.huiminhbach.id.vn/
- PR phát hành: https://github.com/vlam1881997-ops/build-my-home/pull/72
- Main: `a7ce3e837590b7f76126d691dbe2d5dcd6bb63aa`.
- Source được kiểm tra: `fc8370ad11948c6ba485678a04f8f998f3604ad1`.
- Tree source và merge giống nhau: `833fb33337f07d225b5fdca0eee6a1f8df776e01`.
- Vercel production: `dpl_5bmnABYcWhmp93xTnkAwpdcoW5pn`, READY, đúng main và tên miền trên.
- CI Node22: run `39189668658`, npm test và Team coordinator đạt.

Phạm vi là một căn Modern theo quyết định ưu tiên gần nhất. Kết quả các ca đo đạc và xuất hồ sơ dùng dữ liệu mẫu có nhãn; chưa phải khảo sát công trình thật.

## Kết quả đối chiếu

| Hạng mục | Kết quả | Bằng chứng đã có |
|---|---|---|
| Nhu cầu và tự vẽ trên đất trống | Đạt các ca đã kiểm | PR67/68; giữ yêu cầu, xóa phòng cuối, nhập tọa độ/kích thước, undo/redo và tải lại; W31/W35 workflow |
| Bếp và phòng ngủ | Đạt thao tác và dữ liệu đo đạc | W26/W30: thêm bộ có xem trước, sửa riêng vị trí/cao độ/góc/vật liệu, xóa/khôi phục, lịch sử và lưu/mở lại |
| Một nguồn 2D/3D cho đồ và ô mở | Đạt các ca hình học đã kiểm | ID/pose/kích thước cùng plan; W31 góc thực/cao độ/tombstone; W33 cắt tường nhất quán và giữ cửa chung |
| Lựa chọn vật liệu và camera | Đạt bảo toàn dữ liệu trong các ca đã kiểm | Giữ lựa chọn riêng, camera, buffer đo đạc và nội dung model export; W35 có19 kiểm tra model presentation |
| Xem nhẹ và tải PNG khi thiếu WebGL | Đạt | Preview và production PR72 cho cùng PNG1280×1081,188574bytes, SHA256 `0ef52b682862a9a13a966e2dbfe6a6d62f0cdb7f798659b99a6158022045ee68`; ảnh ghi rõ khối theo số đo |
| Hồ sơ xuất mẫu | Đạt bố cục và revision của mẫu đã kiểm | W32/W33: ZIP CRC đạt,30SVG,2DXF mm và PDF30 trang A3; kiểm tra toàn bộ contact sheets và các trang chi tiết |
| Tối ưu phần xử lý xem vật liệu | Đạt ở mức CPU/lifecycle | W35 bỏ dựng lớp kỹ thuật đang ẩn, cache đúng cảnh, cập nhật đồ tải muộn và giải phóng lớp cũ;48 kiểm tra liên quan đạt |
| GitHub/Vercel và website | Đạt | PR72 merged; tree khớp; CI Node22 đạt; production READY; mã đang tải, đổi chế độ và tải PNG đã kiểm trên tên miền chính |

## Bảo lưu bắt buộc

| Mã | Cổng còn mở | Điều kiện đóng |
|---|---|---|
| R1-GPU | Chưa nghiệm thu hình ảnh/hiệu năng WebGL trên máy tính và điện thoại thật |8 góc facade/toàn nhà/khách/bếp/ngủ/tắm/thang/sân thượng cùng revision; thời gian mở hình/đổi vật liệu/xuất, kích thước ảnh và kiểm tra tài nguyên trên thiết bị có GPU |
| R1-OUTDOOR | Thiếu thông số/nguồn xác nhận lan can, thoát nước, chống thấm và kết cấu sân thượng | Hồ sơ/số đo có nguồn, cạnh áp dụng, revision và review phù hợp qua contract hiện có; phần chưa có tiếp tục giữ unknown |
| R1-VISUAL | Chưa có bản ghi chủ sản phẩm duyệt đủ bộ hình cuối | Quyết định duyệt hình thực tế kèm revision và hình được duyệt |

Trình duyệt cloud báo GL_VENDOR/GL_RENDERER Disabled. Ảnh khối nhẹ, render offline và test xanh không thay bằng chứng GPU. Số54,15→1,42ms là trung vị xử lý presentation trên fixture CPU500mesh; không phải tốc độ mở mô hình trên thiết bị thật. Vật liệu generic không được nâng thành SKU hay giá đã xác minh.

## Mốc chuyển bản 2

1. Đóng vòng phát hành bản1 tại main nêu trên; không sửa lại phần đã đạt chỉ vì có yêu cầu “tiếp tục”.
2. Mang nguyên ba bảo lưu sang danh sách tồn đọng với cùng mã và bằng chứng; không đổi chúng thành “đạt” khi bắt đầu bản2. Cổng nghiệm thu thương mại/thi công tổng thể vẫn chưa đóng.
3. Khôi phục kế hoạch bản2 đã được chốt trước khi triển khai; giữ phạm vi B và các chức năng hiện có, không tự mở thêm24 phong cách hoặc sửa nguồn A.
4. Biên bản này không thay đổi code, dự án khách, dữ liệu review, quyền, cấu hình thu tiền hay trạng thái certifiedForConstruction. Không cần phát hành lại ứng dụng hoặc chạy lại các test đã đạt cho thay đổi tài liệu này.

Bằng chứng gần nhất: `../W35-lazy-technical-layers/result.json`; tiến độ đầy đủ trong `../../../PROGRESS-B.md`.
