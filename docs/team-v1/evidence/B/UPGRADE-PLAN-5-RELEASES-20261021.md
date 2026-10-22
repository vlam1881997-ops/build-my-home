# BMH — Kế hoạch 5 bản nâng cấp từ PR74 / PR75
Ngày lập: 21/10/2026 (Asia/Saigon). Trạng thái: kế hoạch theo yêu cầu chủ sản phẩm; chưa ghi nhận nghiệm thu các bản dưới đây.
Nền website: PR74, main ad575e578eaeb2b0cb054760d408d07195ef0224.
Nền mã nguồn mới: PR75, e73e0afbc85d4596c806882d8af1d6af10f5ea75, Node22 CI39525474492 PASS; preview dpl_Bj6W4nUE5XRa4VCo4kVtTaeJHnyr READY. PR75 vẫn draft, chưa có native QA cho phần mới.
Kế hoạch này chia trình tự thực hiện, không thu hẹp tiêu chí 10 tab / một căn Hiện đại trước / đủ 24 phong cách cuối cùng.

## Nền được giữ và dùng tiếp
- Giữ website PR74 trong lúc chuẩn bị bản mới. Tiếp tục PR75, không mở lại từ bản mã cũ.
- Giữ phần đã có trong PR75: lưu mẫu trong Vật liệu, chủ động mở 3D, đúng phòng/SKU, xem lớn, giữ mẫu khi áp lại cùng sản phẩm, sao lưu/import ảnh theo dự án, bảng ảnh trong hồ sơ, chặn dữ liệu đổi lúc xuất. CI PASS là bằng chứng mã nguồn; native QA còn phải làm.
- Dùng planner, mô hình, furniture ID/pose/history, phép đo, BOQ/tài chính, xuất hồ sơ,10 tab, thư viện24 style/17 surface và cloud/MoMo hiện có. Chỉ sửa khi có thiếu sót/lỗi được tái hiện; không viết lại các hệ này để hoàn thành kế hoạch.
- 103 mục catalog và17 surface không được tính là ảnh SKU đã duyệt.24 style ID không được tính là24bộ hình đã nghiệm thu.
- Giữ đúng ownership A/B trong work-plan.json: A phụ trách dữ liệu/hình học/bản vẽ/khối lượng/tài chính/build/tích hợp; B phụ trách UI/vật liệu/3D/media/cloud/payment. Kế hoạch không tự khởi chạy agent hay tài khoản khác.

## Cách tránh chồng chéo và làm lại
1. Một hạng mục có một bản chịu trách nhiệm bên dưới. Bản sau gọi/dùng kết quả của bản trước; không lập engine hay kho dữ liệu thứ hai.
2. Phân ranh rõ: bản 1 chịu trách nhiệm ảnh và liên kết vật liệu; bản 2 chịu trách nhiệm nhu cầu/đất/công năng/hình học và sửa đồ; bản 3 chịu trách nhiệm tiền/hồ sơ/nghiệp vụ giám sát; bản 4 chịu trách nhiệm tài khoản/cloud/thu tiền/vận hành; bản 5 chịu trách nhiệm23 style còn lại và nghiệm thu/phát hành toàn bộ.
3. Một phòng, món đồ, SKU và revision dùng xuyên suốt. Bản 3 tiêu thụ lựa chọn bản 1 và hình học bản 2; không tự thay chúng. Bản 4 đồng bộ cùng dự án, không tạo bản thiết kế song song.
4. Mục đã duyệt giữ bằng chứng. Chỉ mở lại khi thay đổi ảnh hưởng đến mục đó, có regression hoặc bằng chứng cũ không áp dụng cho bản đang kiểm. Không lặp toàn bộ kiểm tra sau mỗi sửa nhỏ; vẫn thực hiện các gate bắt buộc của repo và bản tích hợp cuối.
5. Checklist của từng bản chỉ đóng khi có đầu ra và bằng chứng; CI/READY không tự đóng gate native, hình ảnh, cấu hình dịch vụ hoặc chuyên môn.
6. Mỗi bản được checkpoint/preview riêng. Chỉ đưa bản đủ nghiệm thu lên production; không bắt buộc merge lên website mỗi khi hoàn thành một phần nội bộ.
7. Ước lượng thời gian trước đây là khung sơ bộ, không phải deadline. Chốt lịch dựa trên vòng kiểm tra thực tế và thời gian nhận ảnh/cấu hình/duyệt; không tự hứa ngày khi các đầu vào này chưa có.

## Bản 1 — Hoàn tất vật liệu bằng ảnh, đóng phần đang làm ở PR75
Mục tiêu: khách chọn bằng hình trong tab 5, có bộ phối đúng phòng, rồi chủ động xem 3D.
Dùng lại: toàn bộ bản sửa mẫu/backup/handover trong e73e0af; thư viện và pipeline vật liệu hiện có.
Chủ trì: B; A chỉ tiếp nhận bridge đã có nếu phát hiện thiếu ở consumer, không sửa công thức trong bản 1.

- **1.1** Gỡ blocker truy cập đúng preview/đúng commit qua quyền hợp lệ. Lỗi GitHub404 trên trình duyệt chủ sản phẩm phải xử lý tài khoản/quyền kho riêng tư; không tạo lại repo. Vercel403/quyết định từ chối kiểm tra trang đã ghi nhận phải được giải quyết đúng quyền, không đổi route hoặc tắt bảo vệ để né.
- **1.2** Lập danh sách SKU cho bộ Hiện đại theo các vai trò thực tế: sàn/tường/cửa/tủ/đèn/thiết bị/khu ướt và phần khác có trong thiết kế. Tận dụng catalog hiện có; chỉ bổ sung mục thực sự thiếu.
- **1.3** Đối chiếu từng ảnh với SKU/quy cách/nguồn/quyền sử dụng. Phân biệt ảnh sản phẩm, mẫu bề mặt và mô phỏng; không dùng chung hình nhóm để duyệt nhiều SKU. Mã chưa có ảnh hợp lệ vẫn được xem/chọn tham khảo với trạng thái thiếu; chưa được xác nhận đã chốt sản phẩm. Giá thiếu vẫn cho chọn mẫu, không báo tổng đã chốt.
- **1.4** Hoàn thiện xem lớn, so sánh mẫu, phạm vi phòng/ngoại thất và bộ phối trên UI hiện có. Catalog photo không tự chuyển thành texture; texture cần đúng bề mặt, hướng và tỷ lệ.
- **1.5** Kiểm native: chọn SKU/ảnh -> lưu trong Vật liệu -> xem lớn -> mở 3D -> đổi phòng -> tải lại -> backup/import -> bảng ảnh xuất. SKU/profile bị đổi hoặc phòng bị xóa không dùng nhầm ảnh. Chỉ sửa lỗi phát hiện; không viết lại các chức năng PR75 đã có.

Đầu ra: bộ phối Hiện đại có danh sách SKU/ảnh/trạng thái rõ; các mã được mở cho chốt đều có ảnh đúng; PR75 có native QA và bằng chứng ảnh/mẫu đi đúng phạm vi. Bộ Hiện đại được duyệt để bản 2 dùng.
Chưa phải đầu ra bản 1: dựng lại hình học, sửa giá/vay, bật cloud/payment hoặc duyệt24 style.
Gate: không tự chuyển tab khi lưu mẫu; đúng ảnh/SKU/phòng/scale sau reload và backup/import; dữ liệu thiếu không thành dữ liệu đã duyệt; không nhận ảnh mô phỏng là ảnh sản phẩm.
Phụ thuộc ngoài mã: quyền preview hợp lệ; ảnh sản phẩm và quyền sử dụng được xác minh.

## Bản 2 — Hoàn thiện một căn Hiện đại: đầu vào, bản vẽ và 3D cùng thiết kế
Mục tiêu: thiết kế Hiện đại có thể sửa được và giữ đúng ý khách.
Dùng lại: bộ phối bản 1; planner/geometry/drawings/furniture/state/history/render hiện có.
Chủ trì: A cho đầu vào/hình học/bản vẽ, B cho UI/renderer/editor. Không sửa file thuộc role kia; ghi handoff nếu cần tích hợp.

- **2.1** Chốt một fixture Hiện đại dùng xuyên các bản: ID dự án/phòng/tầng/đồ, kích thước, hướng, nhu cầu, đồ có sẵn và ngân sách có nguồn. Phân biệt fixture giả định với khảo sát và quyết định khách thật.
- **2.2** Kiểm tab 1–3: nhu cầu/đất/hướng/tầng/vị trí/phòng theo tầng/cầu thang/thang máy/phòng thờ/giặt. Ranh được phép thiết kế đúng; quy hoạch/khoảng lùi chưa xác minh hiển thị rõ; nhận diện trường hợp không hỗ trợ. AI và phong thủy chỉ đề xuất, khách chọn áp dụng mới thay phương án.
- **2.3** Kiểm/sửa chỗ thiếu ở tab 4: thêm/xóa/sửa phòng và ô mở, vẽ trên đất trống; mặt bằng/mái/mặt đứng/mặt cắt/cửa/thang/kích thước dùng một hình học. Chặn/cảnh báo vượt ranh, chồng lấn và lối đi lỗi.
- **2.4** Kiểm/sửa tab6: tầng/mái/cửa/thang/đồ theo bản vẽ; chọn riêng món, di chuyển/xoay góc bất kỳ/xóa/undo/redo. Giữ camera, khóa và lựa chọn khách; đồ đã xóa không tự sinh lại.
- **2.5** Lưu/mở lại bằng cơ chế local hiện có, kiểm thiết bị máy tính/điện thoại GPU thực và ghi thời gian mở/sửa/lưu. Bản 2 chịu trách nhiệm số đo/pose; ảnh/scale vật liệu dùng kết quả bản 1, cloud nằm ở bản 4.

Đầu ra: một thiết kế Hiện đại có đầu vào rõ, bản vẽ và 3D khớp, chỉnh được, giữ dữ liệu sau mở lại; chủ sản phẩm duyệt hình/trải nghiệm; người chuyên môn rà soát hình học theo phạm vi.
Gate: đối chiếu kích thước/tầng/cửa/thang/đồ bằng đầu ra thật; một món xoay góc 37° hoặc góc tùy chọn, xóa/undo/redo và reload giữ đúng; AI không tự ghi đè quyết định khách.
Chưa phải đầu ra bản 2: tổng dự toán đã chốt, bộ hồ sơ bàn giao cuối, cloud/payment hay23 style còn lại.

## Bản 3 — Một căn Hiện đại đi đủ 10 tab: dự toán, vốn, bàn giao và thi công
Mục tiêu: đóng mốc nghiệm thu Hiện đại đầu tiên đã khóa.
Dùng lại: thiết kế bản 2, lựa chọn bản 1; engine BOQ/tài chính/export và supervisionAdapter hiện có.
Chủ trì: A cho tính toán/hồ sơ/nghiệp vụ; B cho UI/luồng và native QA.

- **3.1** Tab 7: khối lượng lấy từ thiết kế; sửa đúng adapter/lỗi được phát hiện; nguồn/ngày/địa bàn/đơn vị/VAT/nhân công/vận chuyển rõ; không cộng trùng; thiếu giá giữ trạng thái thiếu. Đổi/xóa vật liệu hoặc đồ cập nhật các dòng liên quan, không tạo một tổng tiền mới tách engine.
- **3.2** Tab 8: vốn theo tổng BOQ đủ dữ liệu và vốn đã khai; kiểm lịch gốc/lãi/phí/lãi thay đổi/trả trước/thiếu vốn. Không coi tổng một phần là tổng đủ, không kết luận ngân hàng duyệt vay.
- **3.3** Tab 9: xuất PDF A3/SVG/DXF/bảng vật liệu/khối lượng/dự toán/phối cảnh theo cùng revision. Kiểm mở và đọc từng tệp thật; bao gồm ảnh/SKU từ bản 1. Hồ sơ mặc định không chứa tài chính cá nhân; bàn giao thiết kế diễn ra trước khởi công. Phần kỹ thuật chưa được người có chuyên môn duyệt vẫn ghi chưa duyệt.
- **3.4** Tab 10: hoàn thiện khoảng trống trên nghiệp vụ hiện có: giai đoạn, người phụ trách, nhật ký/ảnh theo vị trí-hạng mục, lỗi/xử lý, tiến độ/chi phí thực tế và hoàn công; dữ liệu lấy cùng dự án. Checklist không thành chứng nhận kỹ thuật.
- **3.5** Chạy một kịch bản Hiện đại xuyên10 tab, sửa thiết kế/vật liệu/đồ rồi đối chiếu số tiền/hồ sơ; lưu/mở lại; thử xuất thất bại/mất mạng mà vẫn giữ dự án và tải được bản sao. Thu bằng chứng trên desktop/phone; không thay dữ liệu thật bằng fixture rồi gọi là khách đã duyệt.

Đầu ra: một căn Hiện đại hoàn thành đủ 10 tab với bộ hồ sơ mở được và bằng chứng lưu/mở lại, commit/revision/kiểm tra/người duyệt. Đây là nghiệm thu chức năng Hiện đại, chưa là bản thương mại đầy đủ 24 style hoặc đã xác minh dịch vụ trả phí.
Gate: số đo -> SKU/đồ -> khối lượng -> tiền/vốn -> hồ sơ nhất quán; dữ liệu thiếu hiện rõ; hồ sơ/chuyên môn được duyệt đúng phạm vi.

## Bản 4 — Tài khoản, lưu nhiều thiết bị và vận hành thu tiền
Mục tiêu: vận hành với khách thử thật trên bộ Hiện đại đã đạt, xác minh dịch vụ thay vì chỉ có mã.
Dùng lại: cùng project/revision, local backup, API cloud/auth/entitlement/quota/MoMo hiện có.
Chủ trì: B; người sở hữu xác nhận đúng tài khoản dịch vụ và nhập secrets qua cấu hình bảo mật, không gửi vào chat/commit.

- **4.1** Xác định đúng Supabase BMH và môi trường test/production; cấu hình auth/database/media/URL phù hợp. Hai dự án đang thấy INACTIVE chưa được phép tự quy là BMH hoặc tận dụng dự án trọ. Chỉ điều chỉnh schema/migration khi có chênh lệch cần thiết với source hiện có.
- **4.2** Kiểm đăng nhập/đăng xuất/khôi phục tài khoản; khách A không đọc/sửa ảnh hay thiết kế khách B; quyền trên API/storage được thực thi phía server.
- **4.3** Kiểm cùng dự án trên2 thiết bị: ảnh/SKU/pose/revision giữ đúng; xung đột được phát hiện và giải quyết rõ; cloud/mạng lỗi vẫn giữ local và backup. Không xuất hiện thông báo lưu thành công khi ghi chưa hoàn tất.
- **4.4** Cấu hình MoMo sandbox, kiểm giao dịch thành công/thất bại/hủy/timeout, webhook hoặc phản hồi lặp/mất phản hồi; đối soát/phục hồi đơn; cấp đúng quyền/quota và không cấp trùng. Giữ luồng khách mua đã có; không thêm bước đăng nhập bắt buộc vào guest checkout.
- **4.5** Chốt giá dịch vụ, phạm vi hồ sơ, giới hạn/quota, điều khoản/quyền riêng tư, hỗ trợ và xử lý đơn; kiểm cấu hình production và sao lưu/khôi phục vận hành bằng bằng chứng, không tạo giao dịch thu tiền thật để thử.

Đầu ra: bộ Hiện đại đủ điều kiện chạy thí điểm có kiểm soát sau các duyệt liên quan; tài khoản/cloud/media/MoMo và phục hồi đơn có bằng chứng thực. Không gọi thí điểm là đã hoàn thiện24 style.
Gate: kiểm cách ly2 khách,2 thiết bị và khôi phục; chứng từ giao dịch thử/cấp quyền/không cấp trùng; nguồn cấu hình và người chịu trách nhiệm vận hành rõ.
Chưa phải đầu ra bản 4: thiết kế lại giao diện10 tab hay tạo bộ phong cách mới.

## Bản 5 — Hoàn thiện 24/24 phong cách và phát hành thương mại cuối
Mục tiêu: toàn bộ phạm vi thương mại đã khóa.
Dùng lại: Hiện đại đã duyệt và toàn bộ nền của bản 1–4;24profile/style matrix hiện có.
Chủ trì: B cho nhận diện/asset/render/trải nghiệm; A tích hợp và kiểm phần hình học/kỹ thuật/khối lượng bị ảnh hưởng. Chủ sản phẩm duyệt hình/trải nghiệm; người chuyên môn duyệt đúng phần hồ sơ.

- **5.1** Lập danh sách thiếu của23 style còn lại trên profile hiện có. Bổ sung đúng phần khác biệt: mái/mặt tiền/cửa/tỷ lệ/chi tiết/nội thất/ánh sáng và vật liệu; không đổi màu một khối rồi tính đủ style.
- **5.2** Mỗi style có bộ ảnh ngoại thất/nội thất, bộ vật liệu đúng vai trò/nguồn/SKU theo quy trình bản 1, mô hình có thể sửa và hồ sơ tương ứng. Không viết lại pipeline ảnh/material/render/export cho từng style.
- **5.3** Duyệt từng style riêng và giữ bằng chứng. Hiện đại giữ kết quả trước, chỉ kiểm lại phần bị ảnh hưởng do thay đổi chung; trạng thái đạt phải trỏ tới đúng fixture/revision/commit/ảnh/tệp/kiểm tra/người duyệt.
- **5.4** Kiểm desktop/phone GPU thực và ghi thời gian cho các đầu ra mới: mở mô hình, chọn vật liệu, chỉnh đồ, lưu/tải lại/xuất; giải quyết treo/mất dữ liệu/lỗi đầu ra. Phần kiến trúc/kết cấu/MEP/đất/chống thấm/chi tiết thi công được người chuyên môn rà soát theo phạm vi, không tự đánh dấu.
- **5.5** Khóa bản tích hợp, chạy các gate cuối bắt buộc và một vòng khách hàng xuyên suốt; triển khai đúng bản đã kiểm lên www.huiminhbach.id.vn; giữ deployment production cũ để rollback, xác minh bản live/khả năng khôi phục và theo dõi lỗi ban đầu.

Đầu ra:24/24 style có kết quả duyệt riêng; dịch vụ bản 4 hoạt động; hồ sơ cùng dữ liệu; production đúng commit đã kiểm và có phương án khôi phục. Chỉ đóng nhãn thương mại hoàn thiện khi toàn bộ tiêu chí người dùng có bằng chứng.
Gate: không còn blocker chặn luồng đã cam kết; đủ 24review; không có dữ liệu/ảnh/giá/chuyên môn giả; đúng bản live.

## Bằng chứng tối thiểu và trạng thái thực hiện
Mỗi bản ghi: danh sách thay đổi, nền kế thừa, commit/revision, kịch bản và thiết bị thực, thời gian đo, ảnh/tệp đầu ra, kết quả/giới hạn, người duyệt và vấn đề còn mở. Lưu trong repo; không gửi nhiều ZIP/file rời cho chủ sản phẩm.
- Bản 1: đang làm / chờ quyền preview và ảnh SKU hợp lệ; PR75 mới đạt CI.
- Bản 2–5: chưa nghiệm thu theo kế hoạch này; không suy từ mã nguồn sẵn có.
Thứ tự: 1 → 2 → 3 (mốc Hiện đại đủ 10 tab) → 4 (dịch vụ/khách thử) → 5 (24 style/production cuối).
Chuẩn bị nguồn ảnh/quyền dịch vụ và lịch người duyệt có thể làm sớm; việc này không tự đóng gate của bản sau.
Bước thi hành kế tiếp: bản 1, mục 1.1 và1.2; tiếp tục nguồn PR75, chỉ kiểm/sửa chỗ chưa đạt.

