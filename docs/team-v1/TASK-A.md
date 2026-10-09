# GÓI AI A — Thiết kế đo đạc, chi phí, vốn và hồ sơ BMH

Vai trò cố định: **A**. Cửa sổ dự kiến: vlam1881997@gmail.com.
Nhánh mục tiêu: `codex/a-v1-24`. Tiến độ: `docs/team-v1/PROGRESS-A.md`.
6 nhóm việc, 24 điểm độ khó dự kiến. Tận dụng code A/B đã ghép; không viết lại toàn app.

## A1 — Hồ sơ đầu vào, đất và hợp đồng (4 điểm)
- Giữ tab đầu lấy dữ liệu; chuẩn hóa nhà mới/hiện trạng, phong cách, vị trí, ranh/số đo/hướng, gia đình/công năng từng tầng, vốn sẵn có/thu nhập/dự phòng/ngân sách.
- Phân biệt thông tin khách khai, khảo sát, map và nguồn quy hoạch. Dữ liệu thiếu không nhận giá trị mặc định là xác nhận.
- Chốt schema chung với B: element/room/opening/furniture/SKU/revision; thêm migration đồ nội thất vào state và snapshot/history ở file A sở hữu.
- Bàn giao fixture đo đạc, hợp đồng và giới hạn loại đất/công năng được hỗ trợ.
- Đạt: sửa/lưu/mở lại dữ liệu và dữ liệu cũ giữ nguyên; lỗi/đơn vị/nguồn thiếu được thể hiện; B dùng được contract.

## A2 — Phương án phù hợp toàn bộ hồ sơ (5 điểm)
- Bộ tạo/so phương án phải dùng đất, công năng, phong cách và khả năng tài chính; liên kết profile/vật liệu B1 thay cho đổi tên mẫu.
- Cân nhắc khí hậu/vị trí/ánh sáng/thông gió/lối đi; tư vấn phong thủy riêng theo hướng/nguồn và lựa chọn khách.
- Khách tự chọn phòng theo tầng, vị trí thờ/giường/bếp. Không âm thầm dời/bỏ công năng để tăng điểm.
- Vượt diện tích/tiền/ràng buộc thì giải thích, đưa phương án giảm/thay tương ứng để khách chọn.
- Đạt: fixture đổi đất, ngân sách, công năng hoặc hướng có kết quả khả thi/xếp hạng/lý do rõ; không đòi mọi phong cách phải có mặt bằng khác nhau.

## A3 — Bản vẽ và hồ sơ kỹ thuật (4 điểm)
- Giữ đo đạc thống nhất: mặt bằng, mái, mặt đứng/mặt cắt, cửa, cầu thang/thang máy, cao tầng riêng và furniture pose từ B2.
- Kích thước/trục/nét/bảng thống kê/chi tiết kiến trúc đủ đọc, file A3 PDF/SVG/DXF đúng đơn vị.
- Quản lý đầu vào/phạm vi review kết cấu/MEP, người/tài liệu/revision và trạng thái stale. Không suy tiết diện/thép/móng từ mẫu không có nguồn.
- Ready A3: kiểm tra số đo và xuất trên fixture chung, geometry contract và furniture adapter thật bàn giao cho B3; hồ sơ chuyên môn thiếu vẫn giữ đúng trạng thái. Không chờ mô hình hoàn thiện B3 mới giao A3.
- Đối chiếu mô hình B3 cuối với bản vẽ được nghiệm thu ở G3 sau khi B3 có output.

## A4 — BOQ đầy đủ, báo giá và tối ưu vốn (5 điểm)
- Nối khối lượng element và furniture với vai trò vật liệu/SKU từ B; đủ nhóm áp dụng cho toàn công trình.
- Hỗ trợ đơn vị/định mức có dữ liệu: m²/m³/kg/mét/bộ/cái/lít; nguồn giá/vùng/ngày/hạn/quy cách, VAT/nhân công/vận chuyển/hao hụt.
- Dùng hồ sơ chuyên môn cung cấp cho kết cấu/MEP; không chuyển dòng thiếu thành 0.
- So vật liệu tương đương theo contract B1; giữ phong cách và giải thích tác động chi phí. Xóa furniture không còn mua phải đổi bảng kê/chi phí có nguồn, không trừ lần nữa nếu đã nằm trong gói.
- Đạt: nguồn khối lượng/giá truy được, tổng/phần chưa biết rõ; thay kích thước/SKU/đồ cập nhật đúng, không cộng trùng.

## A5 — Vay vốn và dòng tiền (3 điểm)
- Nối dự toán có phạm vi với vốn tự có/quỹ dự phòng/thu nhập và khoản cần vay.
- Đưa phương thức gốc đều/trả góp và các kỳ lãi/giải ngân/ân hạn/phí được hỗ trợ vào UI qua contract; dùng điều kiện ngân hàng nhập/xác nhận.
- Nối dòng tiền xây theo tháng, tiền giải ngân và trả nợ; kịch bản lãi tăng/thiếu vốn quay lại tối ưu A2/A4.
- Đạt: lịch gốc/lãi/dư nợ/phí/dòng tiền kiểm tra được; không tự tuyên bố ngân hàng đã duyệt khoản vay.

## A6 — Bàn giao, dữ liệu giám sát và tích hợp (3 điểm)
- Tách đủ bàn giao thiết kế trước khởi công với đủ hoàn công sau thi công; chỉnh tiêu chí completeness và hợp đồng export.
- Gói bản vẽ/vật liệu/BOQ/vốn/review cùng revision, sổ vấn đề còn thiếu và các quyết định khách.
- Cấp data contract cho B6: WBS, nhật ký/ảnh/vị trí, trách nhiệm, nghiệm thu, lỗi/xử lý, thay đổi, chi phí/thanh toán/giải ngân và hoàn công/bảo hành.
- Sở hữu build/dependency và tích hợp A+B tuần tự. Đăng ký module B ngay khi nhận interface để B không mắc chờ build.
- Đạt: preview ghép sẵn cho B6 kiểm tra; G6 chỉ đóng khi cả hai có bằng chứng. Triển khai main/website theo quyền đã được chủ sản phẩm giao và xác minh đúng commit; giữ rollback.

## Công cụ và skill phù hợp
Áp dụng skill hiện có `bmh-drawings`, `bmh-construction-design`, `bmh-webapp-quality`; phối hợp `bmh-3d` ở biên hình học. Dùng code/parser/export/test đang có. Đọc tài liệu chính thức khi thay API/ngân hàng/chuẩn kỹ thuật; thông tin có nguồn nhưng chưa xác nhận phải giữ trạng thái. Không cài thêm plugin để thay cho đầu ra.

## File A sở hữu
Danh sách chính thức nằm ở `work-plan.json → ownership.A`: state/data engine/AI research; geometry/planner; tính chi phí/BOQ/vay; dossier/drawings/export; các API nguồn/vị trí/ngân hàng; build/dependency và sổ tích hợp. B sở hữu phần UI/3D/material/cloud. A không sửa `99_customer_design.js` hoặc `75_completion.js` trực tiếp; gửi B yêu cầu adapter/biên UI. Trước sửa helper chung, chốt owner.

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


## Dòng bắt đầu / tiếp tục để dán vào AI A

> Nhận vai trò AI A của BMH. Lấy repo vlam1881997-ops/build-my-home và main mới nhất; đọc AGENTS.md, docs/team-v1/TASK-A.md, README.md, work-plan.json, contracts.md, PROGRESS-A.md trên nhánh A đang làm và INTEGRATION.md. Tiếp tục task/substep đang dở; nếu chưa bắt đầu thì làm A1. Giữ checkpoint source+tiến độ trên nhánh A để phiên sau chỉ cần “làm tiếp”. Không làm lại task đã nghiệm thu, không sửa file B, không tự nhận đã hoàn thành khi thiếu bằng chứng. Thực hiện phần việc có thể làm ngay và cập nhật kết quả thực.
