# Kiến trúc triển khai

## 1. Cấu trúc ứng dụng mục tiêu

Đề xuất modular monolith: một backend phân module, một PostgreSQL; không tách microservice từ đầu. Giao diện Next.js/TypeScript, worker riêng cho PDF/OCR/AI/export, kho tệp private. Đây là kiến trúc dự kiến, chưa có các dịch vụ đang chạy trong bộ mã nguồn này.

```text
apps/web/             Trang, component, editor 2D/3D, API routes
apps/worker/          OCR, AI review, export jobs
packages/domain/     Lõi hiện tại từ src/; công thức và quy tắc thuần
packages/contracts/  Schema request/response dùng chung
packages/data/       Repository, migrations, transaction
packages/providers/  Payment, AI, geocoding, giá, lưu tệp
```

Code lõi dùng ES modules để chạy độc lập không cần cài framework. Có thể import trực tiếp vào TypeScript; thêm khai báo hàm/typing khi chuyển vào monorepo. File `contracts/domain.ts` mô tả dữ liệu đích, không phải khai báo type tự động cho mọi hàm hiện có.

## 2. Nguồn dữ liệu thống nhất

Project → Scenario → DesignVersion + MaterialSelection → EstimateSnapshot → Review/Lifecycle/Exports. FinanceProfile và Location/Site thuộc Project; Scenario có thể ghi đè giả định để so sánh. Bản dự toán đã chốt là bất biến. Mỗi snapshot giữ inputRevision, designVersion, priceSnapshot, ruleVersion, assumptions và hash.

| Khi thay đổi | Tính lại / đánh dấu cũ | Giữ nguyên |
|---|---|---|
| Tiền, vay, thu nhập | Dòng tiền, khả năng chi trả, gợi ý theo ngân sách, báo cáo | Hình học và giá đã chụp |
| Địa điểm | Giá phù hợp vùng, vận chuyển, khí hậu, dự toán, vòng đời, review | Các phòng người dùng đã vẽ |
| Kích thước đất / tầng | Kiểm tra thiết kế, khối lượng, dự toán, 3D, review | Bản thiết kế cũ trong lịch sử |
| Phòng/tường/cửa | Khối lượng, mô hình, dự toán, review | Dữ liệu tài chính |
| Vật liệu | Chi phí, bề mặt, mô phỏng và review | Hình học |
| Giao dịch thanh toán | Entitlement | Giá và nội dung snapshot đã mua |

Không cho tải báo cáo “mới nhất” nhưng dùng kết quả cũ. Cho tải bản lịch sử với nhãn ngày/phiên bản hoặc tạo job tính lại. Mọi tác vụ dài phải so sánh revision lúc trả kết quả; nếu người dùng đã sửa thì giữ kết quả theo revision cũ, không ghi đè hiện tại.

Lưu tự động: debounce ở frontend, PATCH có `expectedRevision`, server update `WHERE revision = expectedRevision`; không khớp trả 409. UI giữ bản người dùng đang sửa và cho giải quyết xung đột, không tự nuốt lỗi.

## 3. Dữ liệu chính và ranh giới

| Entity | Chủ sở hữu / quan hệ | Dữ liệu nổi bật |
|---|---|---|
| User, ProjectMember | Tài khoản/quyền dự án | Owner/editor/viewer, revoke |
| Project | Owner | Tên, vùng, tiền tệ, trạng thái, revision |
| Scenario | Project | Phương án A/B, giả định và lựa chọn |
| Asset | Project | Private object key, MIME, kích thước, trang, mục đích, quét file |
| FinanceProfile | Project/revision | Tiền mặt, quỹ dự phòng, thu nhập, sinh hoạt, nợ |
| LoanScenario | Scenario | Phương pháp, lịch lãi, lịch giải ngân, phí, giả định |
| SiteProfile | Project/revision | Biên đất, khoảng lùi, hướng, đường vào, nguồn khảo sát |
| Household | Project | Nhu cầu ở, phong cách, tùy chọn phong thủy |
| DesignVersion | Scenario, bất biến khi chốt | Tầng, tường, cửa, phòng, thang, đơn vị mét |
| PriceRecord | SKU + vùng | Giá/đơn vị, VAT, ngày, nguồn, vận chuyển, trạng thái duyệt |
| EstimateSnapshot | Scenario + revision | Từng dòng, nguồn khối lượng, nguồn giá, tổng, loại trừ |
| Evaluation | Design/Estimate | Rule ID, evidence, thiếu dữ liệu, độ phủ |
| Simulation | Scenario | Giả định năm, bảo trì, năng lượng, sửa chữa |
| Order / PaymentEvent | User + Project | Giá máy chủ, provider ref, trạng thái, idempotency |
| Entitlement | User + Project | Quyền gói, nguồn order, active/revoked |
| Task / ChecklistItem | Project | Trạng thái, chứng cứ, người kiểm tra, phiên bản checklist |
| ChangeOrder | Project | Chi phí trước/sau, phê duyệt, ảnh hưởng tiến độ |
| Milestone / ActualPayment | Project | Số dự kiến, thực chi, điều kiện, giữ lại |
| ExportJob | Project + snapshot | Loại file, revision, trạng thái, lỗi, đường tải có hạn |
| AuditLog | Actor + đối tượng | Thao tác, thời gian, revision; không ghi secret |

Tiền VND dùng số nguyên ở code, BIGINT trong DB; khối lượng dùng DECIMAL. Rate là số thập phân, tỷ lệ phân kỳ dùng basis points (10000 = 100%). Mỗi đơn giá phải có đơn vị; chuyển đổi phải tường minh. Địa phương có code/version/validity, không lấy tên hiển thị làm khóa.

## 4. Tính tiền và phạm vi bộ lõi

- `loanSchedule`: niên kim tính lại tại mỗi kỳ đổi lãi trên dư nợ thực và số kỳ còn lại; gốc đều giữ khoản gốc cơ sở. Trả kỳ cuối cân bằng sai số làm tròn. Chưa tính lãi theo ngày, ân hạn, trả trước, giải ngân nhiều đợt.
- `financialSummary`: committedLoan chỉ được truyền từ khoản được chấp nhận trong kịch bản; UI phải phân biệt vốn giả định. `peakNetDebtRatio` khác `peakGrossDTI`.
- `cashflow`: số dư đầu + thu nhập + tiền giải ngân thực − sinh hoạt − nợ − thi công. Vay chỉ cộng ở tháng nhận. Công thức này không tự tạo lịch lãi cho khoản vay nhiều lần giải ngân.
- `estimate`: mỗi dòng khối lượng đã xác nhận × (1 + hao hụt) × đơn giá chưa thuế; thuế theo dòng; cộng dự phòng một lần. Nhân công/vận chuyển/phí khác là các dòng riêng để tránh bị giấu trong đơn giá rồi cộng lại.
- `roomAreas`: phòng chữ nhật không chồng lấn và không vượt biên; chỉ tính diện tích thông thủy sơ bộ. Chưa tính tường chung/cửa/sàn/mái/kết cấu.
- `lifecycle`: chi phí sở hữu tài sản, không cộng lại gốc vay. Toàn bộ tuổi thọ/sửa chữa do kịch bản đầu vào; không có cơ sở dữ liệu dự báo đã được xác thực.
- `milestonePlan`: tổng tỷ lệ 100% bao gồm phần giữ lại. Làm tròn phân bổ theo lũy kế để tổng tiền luôn bằng hợp đồng.

## 5. AI pipeline có kiểm soát

**Đọc bản vẽ:** upload private → kiểm tra file → chọn trang → OCR/detection → kết quả ứng viên có bounding boxes/source page/confidence → hiệu chuẩn → người dùng sửa/xác nhận → DesignVersion. Không dùng OCR chưa xác nhận để tạo khối lượng đã duyệt.

**Gợi ý:** hard constraints (đất, phòng, nhu cầu) → lọc mẫu → tính dự toán bằng engine → xếp hạng → AI giải thích. Không đủ phương án thì trả ít phương án hoặc nêu không tìm thấy; không tự tạo mẫu “đúng ngân sách” với giá bịa.

**Nhận xét:** engine trả facts/rules/missing inputs → AI xuất JSON theo schema gồm claim, evidenceIds, suggestion, limitations. Bộ kiểm tra loại claim không có bằng chứng hoặc sai số tiền. Không có AI key thì hiển thị chưa tích hợp; có thể dùng nhận xét rule-based với nhãn chính xác.

**Tác vụ AI:** queued/running/needs_confirmation/succeeded/failed/cancelled; timeout, giới hạn chi phí, retry có số lần, idempotency và prompt/model version. File người dùng chỉ là dữ liệu, không là chỉ dẫn hệ thống. Không gửi số tài khoản, số điện thoại hoặc tài chính không cần thiết vào prompt.

## 6. Thanh toán và quyền truy cập

1. Người dùng đăng nhập tạo order cho project thuộc quyền mình; server đọc giá product. Chốt amount/currency/product version vào order.
2. Provider tạo link/QR; backend giữ secret. UI chỉ thấy link, mã đơn và trạng thái.
3. Webhook phải qua kiểm tra chữ ký theo SDK/tài liệu provider, đúng merchant, amount, currency, provider order và trạng thái thành công. Chưa có adapter này trong code.
4. Trong transaction DB: khóa order; insert PaymentEvent với unique providerEventId; nếu trùng trả thành công mà không cấp thêm; paid + cấp Entitlement + audit/outbox cùng transaction.
5. API bước 9, chi tiết gói và tải file đều kiểm tra user, project ownership/membership và entitlement trên server. `canAccessStep` chỉ là quy tắc thuần, không phải middleware bảo mật.
6. Return URL chỉ kích hoạt đọc lại order. Sửa localStorage không đổi entitlement. Order bị refund/revoke phải phản ánh đúng theo chính sách đã công bố.

Rủi ro cần kiểm thử: webhook giả, phát lại, đồng thời, tiền thiếu/thừa, đơn hết hạn, thanh toán tới trễ, timeout provider, refund, người khác đoán ID dự án. Phần paywall có feature flag server; client không tự truyền flag để vượt quyền.

## 7. Lưu tệp, export và riêng tư

Tệp private theo project; upload bằng URL ngắn hạn, giới hạn MIME qua nội dung, dung lượng, số trang, cách ly PDF trước xử lý. Không nhúng bí mật/địa chỉ người dùng vào filename công khai. Link tải kiểm tra quyền rồi ký thời hạn ngắn. Xóa dự án xử lý cả asset, output và job còn chờ theo chính sách lưu giữ đã công bố.

Export worker đọc snapshot cố định. Retry job cùng key không tạo nhiều lần thu phí. PDF/Excel/ZIP cần đánh dấu tài liệu ý tưởng, nguồn giá, thiếu dữ liệu; biên bản mẫu không có chữ ký giả. Tách export dự toán khỏi bộ hồ sơ nghiệm thu thực tế.

## 8. Frontend cụ thể

10 bước nằm trong một workspace, giữ sidebar như ảnh trên desktop; mobile là tiêu đề bước, tiến độ gọn và menu. Có lưu nháp, quay lại, đổi phương án, xem thay đổi chi phí. Nút tiếp tục kiểm tra yêu cầu riêng của bước; vẫn cho xem bước sau ở trạng thái thiếu dữ liệu, nhưng khóa hành động cần dữ liệu/quyền.

Dashboard hiển thị dự án gần đây, bản sửa mới, việc cần bổ sung. Bước 8 không ép user đi hết mô phỏng để xem dự toán sơ bộ. Bước 10 cho tải phần sẵn có và chỉ rõ phần chưa có. Không dùng ảnh tĩnh của mockup làm nút tương tác giả.

## 9. Triển khai production

CI: test lõi → type/lint → migration trên DB tạm → integration quyền/webhook → E2E 10 bước → build → staging. Secrets chỉ trên server. Có backup + diễn tập restore, giám sát lỗi/job, giới hạn request, log không chứa thông tin riêng tư, và rollback schema/source tương thích. Bộ hiện tại mới có CI test lõi; các gate khác phải triển khai khi thêm app/backend.
