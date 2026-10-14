# GÓI AI B — 24 phong cách, vật liệu, nội thất, 3D và trải nghiệm BMH

Vai trò cố định: **B**. Cửa sổ dự kiến: vlam1889797@gmail.com / cửa sổ B hiện tại.
Nhánh mục tiêu: `codex/b-v1-24`. Tiến độ: `docs/team-v1/PROGRESS-B.md`.
6 nhóm việc, 24 điểm độ khó dự kiến. Tận dụng code A/B đã ghép; không viết lại toàn app.

## B1 — 24 phong cách và vật liệu phù hợp (4 điểm)
- Tiếp tục inventory `evidence/B/B1-style-inventory.json`; đủ đúng 24 ID, không thêm phong cách.
- Hồ sơ mỗi phong cách gồm mái/mặt đứng/chi tiết/tỷ lệ/bảng màu/nội thất, ví dụ duyệt và giới hạn áp dụng.
- Ma trận vai trò mái/mặt ngoài/cửa/sàn/tường/trần/gỗ/vải/khu ướt/thang; SKU/spec/đơn vị/texture đúng tỷ lệ/nguồn/quyền dùng, theo khí hậu và ngân sách.
- Gợi ý tiết kiệm/nâng cấp; product selection dùng chung showroom/model/BOQ, gửi bridge cho A2/A4. Không biến bề mặt generic thành exact SKU.
- Đạt: 24 hồ sơ dữ liệu/ma trận đủ, B3 có thư viện để dựng, A dùng được vai trò/quy cách và trạng thái giá.

## B2 — Chỉnh nội thất từng món (5 điểm)
- Chọn từng giường/sofa/tủ/bàn/ghế/thiết bị/bàn thờ hỗ trợ ở 2D/3D để kéo, xoay góc 0–360°, xóa, undo/redo và khóa.
- Cùng ID/pose/kích thước/material/SKU trong `project.plan.furniture` theo contract A1; state/migration/history ở file A phải được ghép đồng bộ.
- Đồ đã xóa không tự sinh lại; đổi tab/scene/phong cách hoặc mở lại giữ lựa chọn khách. Đồ chuyển động theo phòng đúng phạm vi.
- Va chạm/vượt phòng/xuyên tường/chắn cửa/lối đi xét góc thực; gửi hướng/pose cho tư vấn phong thủy A, không tự dời lại.
- Adapter `roomFurnitureLayout()` và exports/models dùng một nguồn; giữ camera/renderer phản hồi nhanh, góc không vuông phải hiển thị đúng.
- Ready B2: thao tác visible desktop/mobile, lưu/mở/undo, xoay 37° và xóa riêng một món; editor/adapter/pose thật khớp 2D và mô hình hiện có. Bàn giao ID/quantity/material bridge để A3/A4 triển khai, không chờ A4.
- Đồng bộ bảng kê/BOQ và hồ sơ cuối được nghiệm thu cùng A4 ở G4; không dùng điều kiện đó để chặn handoff B2.

## B3 — 3D nhà thật cho 24 phong cách (5 điểm)
- Hoàn thiện hình khối mái/mặt tiền/cửa/nội thất theo hồ sơ B1 và bản vẽ A3; đủ ngoại thất và phòng cần dùng.
- PBR/texture đúng tỷ lệ và chọn vật liệu; bề mặt chưa có asset ghi đúng mức mô phỏng. Ánh sáng/camera đúng để khách hình dung nhà.
- Giữ xem nhanh; render vật lý/Gemini khi khách yêu cầu, đo hiệu năng thiết bị và giữ hình học/camera/pose đã chỉnh.
- GLB/PNG và ảnh tham chiếu không thay nguồn số đo; không dùng ảnh AI làm mô hình có thể chỉnh vật thể.
- Đạt: ảnh ngoại thất/nội thất riêng 24/24 được duyệt; GLB/mesh khớp revision/kích thước/tầng/cửa/thang/furniture. Không tính có tên style là đạt thẩm mỹ.

## B4 — Luồng 10 tab, đồ họa và giao diện (3 điểm)
- Giữ tab đầu lấy dữ liệu, thay ảnh minh họa khi cần, không bỏ công dụng vật liệu/ngân hàng.
- Luồng: hồ sơ đầu vào → đất/gia đình → bản vẽ/vật liệu → 3D → dự toán → ngân hàng → bàn giao → giám sát.
- Tab 9 bàn giao hồ sơ, tab 10 thi công/giám sát. Remap chỉ số/link/deep-link/migration, cập nhật toàn bộ override bị ảnh hưởng; A thay tiêu chí completeness/export.
- Giảm nút và lựa chọn luôn hiện; đặt công cụ sâu trong phần nâng cao, nhưng vẫn tìm thấy. Desktop/mobile/keyboard dễ dùng.
- Đạt: khách đi xuyên 10 tab, không mất dữ liệu hoặc chức năng; bảng chi phí/vay và đầu ra A được hiển thị đúng trạng thái.

## B5 — Vận hành trả phí và lưu nhiều thiết bị (4 điểm)
- Tận dụng cloud/auth/order/quota hiện có; lưu đồ/ảnh/tệp và project revision, quyền truy cập, conflict/migration/backup/phục hồi.
- Hoàn thiện giao dịch thử, phục hồi đơn, cấp quyền/quota và theo dõi chi phí AI; xác minh dịch vụ production trước thông báo hoạt động.
- Giữ secrets server-side, kiểm thử quyền dự án/người khác/lỗi mạng, không tạo đơn hoặc tiêu tiền thật trong QA.
- Thiếu credential/quyền cấu hình: ghi blocker thực và hoàn thiện phần độc lập còn lại; không hứa cloud/payment hoạt động chỉ vì code đã có.
- Đạt: thao tác liên thiết bị/ảnh/tệp/quyền/đơn/quota kiểm tra được; cấu hình công khai khớp dịch vụ thực, cơ chế khôi phục có bằng chứng.

## B6 — Giao diện giám sát và nghiệm thu cuối (3 điểm)
- Dùng contract A6 cho nhật ký/ảnh theo vị trí-hạng mục, người phụ trách, nghiệm thu/lỗi/xử lý, thay đổi, dòng tiền, hoàn công/bảo hành.
- Checklist tự đánh dấu khác với biên bản/nguồn người giám sát; UI không tự biến đánh dấu thành chứng nhận kỹ thuật.
- Kiểm tra preview ghép: 24 hồ sơ hình, 2D/3D/vật liệu/BOQ/vay/ZIP, lưu nhiều thiết bị và trước/sau bàn giao.
- B ghi nghiệm thu; A triển khai theo quyền đã được giao; B xác minh đúng commit và thao tác live, phối hợp rollback nếu lỗi.
- Đạt: các cổng commercial trong scope có bằng chứng/duyệt; A6+B6 cùng đóng G6. Không chờ production mới bắt đầu test preview.

## Công cụ và skill phù hợp
Áp dụng `bmh-3d`, `bmh-images`, `bmh-ui-design`, `bmh-graphic-design`, `bmh-webapp-quality`; phối hợp `bmh-drawings` để kiểm 2D/3D. Reuse Three.js/glTF/GLB và asset/test hiện có. Figma dùng khi cần thiết kế UI có file cụ thể; imagegen cho minh họa, không dùng cho bản vẽ chính xác. Chỉ bổ sung công cụ giúp đầu ra cụ thể, kiểm quyền thương mại/nguồn và chi phí trước dùng.

## File B sở hữu
Danh sách chính thức nằm ở `work-plan.json → ownership.B`: style/material/scene/renderer; UI/editor adapter; cloud/auth/ảnh/tệp/đơn/quota; asset/CSS và các test B. A sở hữu schema/planner/quantities/drawings/BOQ/vay/build. B không sửa `10_state.js`, `30_planner.js`, `93_measured_cost.js` hay build trực tiếp; gửi schema/adapter/module patch cho A trong sổ B.

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


## Dòng bắt đầu / tiếp tục để dán vào AI B

> Nhận vai trò AI B của BMH. Lấy repo vlam1881997-ops/build-my-home và main mới nhất; đọc AGENTS.md, docs/team-v1/TASK-B.md, README.md, work-plan.json, contracts.md, PROGRESS-B.md trên nhánh B đang làm và INTEGRATION.md. Tiếp tục task/substep đang dở; hiện B1 đã có inventory, hãy làm phần nhận diện/ma trận vật liệu tiếp theo. Giữ checkpoint source+tiến độ trên nhánh B để phiên sau chỉ cần “làm tiếp”. Không làm lại task đã nghiệm thu, không sửa file A, không tự nhận đã hoàn thành khi thiếu bằng chứng. Thực hiện phần việc có thể làm ngay và cập nhật kết quả thực.
