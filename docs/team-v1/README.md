# Hai AI hoàn thiện BMH commercial v1 — 24 phong cách

Ngày giao: 09/10/2026. Nền trước giao: `04a661e2256828eef8ed31dc7ed4b0309e20c0a5`.
Phạm vi gốc: [BMH-COMMERCIAL-V1-SCOPE.md](../BMH-COMMERCIAL-V1-SCOPE.md).
Khoảng thiếu: [PR34-COMMERCIAL-GAP-20261009.md](../PR34-COMMERCIAL-GAP-20261009.md).

## Hai phần việc

| Mốc | AI A — dữ liệu thiết kế, chi phí và vốn | AI B — phong cách, nội thất và trải nghiệm |
|---|---|---|
| G1 | A1: đầu vào, đất, nguồn và schema chung | B1: 24 phong cách, vật liệu và bridge cho BOQ |
| G2 | A2: phương án từ công năng/đất/ngân sách/tư vấn | B2: di chuyển/xoay/xóa từng món nội thất, lưu/undo |
| G3 | A3: bản vẽ và hồ sơ kỹ thuật đo đạc | B3: 3D thực tế cho 24 phong cách |
| G4 | A4: BOQ, giá nguồn và tối ưu vốn | B4: giao diện 10 tab, bàn giao trước thi công |
| G5 | A5: vay và dòng tiền xây dựng | B5: tài khoản/cloud/ảnh/tệp/quota/thu tiền |
| G6 | A6: hồ sơ bàn giao, dữ liệu giám sát và tích hợp | B6: giao diện giám sát và nghiệm thu khách hàng cuối |

Mỗi bên 6 nhóm, 24 điểm độ khó dự kiến; điểm không phải ngày làm hay token. B2/B3 và A2/A4 là các phần nặng. Khi thực tế lệch đáng kể, A ghi đề xuất chuyển một đầu ra chưa làm và owner file rõ; B xác nhận trong sổ mình rồi mới đổi manifest. Không chia đều bằng số tab.

AI A dự kiến giao cửa sổ `vlam1881997@gmail.com`; AI B dự kiến giao `vlam1889797@gmail.com` / cửa sổ B hiện tại. Đây là nhãn phân công theo yêu cầu chủ sản phẩm, không phải xác minh đăng nhập hay đã khởi chạy hai tài khoản. Bản phân công không tự gọi phiên ChatGPT bên kia.

## Bắt đầu

- Giao [TASK-A.md](TASK-A.md) cho AI A; giao [TASK-B.md](TASK-B.md) cho AI B.
- A dùng nhánh `codex/a-v1-24`, B dùng `codex/b-v1-24`, hoặc tiếp tục nhánh WIP tương ứng nếu đã có.
- Mỗi AI phải lấy mã từ repo chính; file giao việc không chứa mã app, không giải nén/chép đè tiến độ cũ.
- Trong BMH Team nếu dùng bộ điều phối cũ: yêu cầu giữ vai trò/owner/task ID này. Không khẳng định bộ điều phối hiện đã tự đọc manifest hay tự resume; repo checkpoint là cơ chế tiếp tục được giao cho AI.

## Quy tắc làm việc và tiếp tục phiên

1. Repo chính: https://github.com/vlam1881997-ops/build-my-home . Đọc `AGENTS.md`, `docs/BMH-COMMERCIAL-V1-SCOPE.md`, `docs/PR34-COMMERCIAL-GAP-20261009.md`, `docs/team-v1/README.md`, `work-plan.json`, `contracts.md`, sổ tiến độ đúng vai trò và `INTEGRATION.md` trước khi sửa.
2. Lấy main mới nhất và tìm nhánh vai trò đang có. Nếu đã có nhánh/PR/WIP thì tiếp tục nhánh đó; không tạo lại từ đầu, không reset/chép đè/xóa thay đổi. Nếu chưa có, tạo nhánh đúng tên từ main hiện tại và worktree riêng. GitHub author/email không tự xác định vai trò hay quyền triển khai.
3. Trong sổ tiến độ, chọn task đang `in_progress`; nếu không có, chọn task chưa xong có phụ thuộc đáp ứng. Phụ thuộc là mốc hợp đồng/fixture: có thể phát triển bằng mock đã thống nhất, nhưng không nghiệm thu bằng mock thay đầu ra thật. Nếu bị chặn, ghi lý do và chuyển sang phần độc lập của gói mình, không dừng toàn bộ công việc.
4. Chỉ sửa file được giao trong `work-plan.json`. File chưa có chủ: ghi yêu cầu vào sổ của mình; A xác nhận owner trong sổ tích hợp trước khi sửa. Không tự sửa file/sổ tiến độ của bên kia. B yêu cầu A đăng ký module mới/build/dependency; A ghép thay đổi chung theo thứ tự. Giữ API và hợp đồng đang có, đọc lớp ghi đè cuối trước sửa.
5. Sau mỗi bước có kết quả và trước khi đổi task/kết thúc phiên, cập nhật sổ tiến độ: task/substep, branch/commit, file đã đổi, kiểm tra/kết quả, lỗi đang dở, việc tiếp theo và yêu cầu cho bên kia. Commit source cùng tiến độ vào nhánh vai trò và push GitHub nếu có quyền. WIP được đánh dấu WIP, không đẩy vào main như bản đạt.
6. Nếu môi trường không push được: giữ WIP và checkpoint cục bộ, báo rõ nhánh/file/commit chưa lên remote; không nói phiên khác đã nhận được. Nếu phiên dừng bất ngờ, lần sau đối chiếu checkpoint với git status/log/PR và file chưa commit trước khi làm tiếp. Không bảo đảm khôi phục phần chưa từng ghi ra file hoặc commit.
7. `ready_for_integration` cần bằng chứng và PR; `done` chỉ sau khi ghép và kiểm tra trên bản tích hợp. A ghép tuần tự; B nghiệm thu preview/website. G6: A chuẩn bị preview cho B6, B6 duyệt trước A triển khai production; không tạo vòng chờ “phải triển khai xong mới kiểm”.
8. Kiểm tra phù hợp phần đổi, mock AI/Search/thanh toán tính phí, giữ dữ liệu khách thật. Không lưu secrets, generated dist hay node_modules trong commit. Thực hiện kiểm tra release trên Node 22.x theo repo; không thêm plugin/dịch vụ tính phí nếu không có nhu cầu rõ.
9. Chỉ hoàn thiện 24 phong cách hiện có. Hồ sơ xây dựng cần đầu vào/chuyên môn có nguồn; không tự bịa giá, quy hoạch, kết cấu hay xác nhận KTS/KS. Báo trạng thái thiếu chính xác, không gắn “100%” từ số task/test xanh.

Câu “làm tiếp” trong phiên đã xác định vai trò nghĩa là đọc sổ tiến độ của vai trò đó và tiếp tục bước kế tiếp. Trong cửa sổ mới không có lịch sử, dán lại dòng giao vai trò ở cuối file này. Không cần gửi lại toàn bộ kế hoạch.


## Trạng thái và chủ sở hữu

- `PROGRESS-A.md`: chỉ A sửa.
- `PROGRESS-B.md`: chỉ B sửa.
- `INTEGRATION.md`, `contracts.md`, build/dependency: A sở hữu khi thực thi; B gửi yêu cầu và checksum/patch trong sổ B.
- `work-plan.json`: danh sách ID/phụ thuộc/owner chính thức; thay đổi phối hợp giữa A và B, có lý do.
- Các trạng thái: `not_started`, `in_progress`, `blocked`, `ready_for_integration`, `done`. Luôn giữ lỗi/việc còn thiếu ở trạng thái thật.

## Điểm nghiệm thu chung

Cùng một fixture đo đạc và revision cho 2D/3D/BOQ/hồ sơ. Bộ ca gồm đất chữ nhật, đất vát/lõm thuộc phạm vi hỗ trợ, nhiều tầng có cao tầng khác nhau, thang/thang máy, phòng tự thêm/thờ theo tầng, ngân sách khác nhau và đồ nội thất xoay góc không vuông. Hướng/Bắc/nguồn đất thực phải rõ; mock hồ sơ/giá chỉ phục vụ test.

24 phong cách có fixture/ảnh ngoại thất/nội thất/bảng vật liệu và người duyệt riêng. Ca shared kiểm tra số đo, thao tác, lưu/mở/đổi thiết bị, BOQ/vay/bàn giao/giám sát. Bàn giao hồ sơ thiết kế ở lúc chưa khởi công; hồ sơ hoàn công sau thi công. Tài khoản/quota/thu tiền phải được kiểm chứng cấu hình và thao tác, không chỉ cờ local.

Không tuyên bố tự động phù hợp mọi thửa đất hoặc hồ sơ đủ thi công khi chưa có kết cấu/MEP/người chuyên môn xác nhận. Chủ sản phẩm duyệt chất lượng hình; các phạm vi chuyên môn được rà soát bởi người phụ trách. Hai AI hoàn thiện phần mềm và giữ trung thực trạng thái hồ sơ.
