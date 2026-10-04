# Hợp đồng dữ liệu nâng cấp BMH

Phiên bản đề xuất: 1 · 04/10/2026. Đây là hợp đồng giao việc, chưa phải schema đã chạy trong sản phẩm.

## Dùng lại dữ liệu hiện tại

- `project.site`: lat/lng, `lotPoints`, `lotMode`, `useParcelGeometry`, `frontEdge`, width/depth/floors, floorHeight/slabThickness và khoảng lùi. `lat/lng` là vị trí bản đồ; không thay thế kích thước khảo sát. Giá trị mặc định về đất/khoảng lùi chỉ là giả định phương án.
- `project.plan`: phòng, cửa, lối mở, fixtures và dữ liệu thang. Giữ ID ổn định. Một vật thể bị xóa phải được xóa trong mọi đầu ra; undo phục hồi cùng ID/số đo.
- `project.materials`, bộ phong cách và lựa chọn từng phòng hiện có: tiếp tục là nguồn ý định thiết kế. Không tạo bộ phong cách độc lập trong 3D.
- `drawingRevision()` và các chữ ký hình/camera hiện có: tiếp tục dùng, bổ sung phụ thuộc còn thiếu. Hiện revision chưa bao trùm mọi khoảng lùi và đầu vào kết cấu; phải kiểm tra và mở rộng khi triển khai.
- `project.dossier`: giữ tiến độ, bằng chứng, mốc ngân sách và chi phí thực tế hiện có.
- `mergeState` hiện giữ các trường theo default. Mọi extension phải có default, normalize, migration, import/export và kiểm tra reload tương ứng.

## Extension đề xuất

TK1 là chủ sở hữu khai báo/normalize. TK2 là chủ sở hữu consumer hình học, revision và xuất. Trước khi dùng field mới, hai bên đọc cùng hợp đồng; không đổi tên/ngữ nghĩa độc lập.

| Nhóm | Các trường đề xuất | Ý nghĩa |
| --- | --- | --- |
| `project.designEvidence` | schemaVersion, research[], site[], fengSources[], materialSources[] | Chứng cứ theo loại, liên kết với ID thiết kế/vật liệu; không chứa API key. |
| Assertion/chứng cứ | id, kind, sourceUrl, sourceTitle, publisher, retrievedAt, effectiveAt, scope, sourceType, verifiedState, value, unit, notes | Phân biệt khách nhập, số đo khảo sát, tài liệu cơ quan, báo giá, đề xuất AI. Thiếu để null; URL không tự chứng minh nguồn đúng. |
| Research mẫu nhà | id, styleId, sourceUrl, retrievedAt, reasons[], constraints[], imageAssetId, imageLicence, selectedAsIntent | Chọn mẫu chỉ cập nhật ý định; không tự ghi đè đất, phòng hay ngân sách. |
| Ranh và quy hoạch | rawCoordinates, sourceCrs, transformReference, localVertices, edgeMeasurements, surveyReference, restrictionAreas[], verificationState | Dùng lại `site.lotPoints` cho giao diện bản đồ. Đỉnh local có đơn vị m chỉ khi phép chuyển/số đo đủ căn cứ; không giữ một bộ ranh cạnh tranh với hình học hiện có. |
| Giá vật liệu | productId, sku, specification, quantityUnit, amountVnd, priceType, sourceUrl, quotedAt, locationScope, includesVat, includesLabour, includesTransport, validUntil | amountVnd null là chưa có giá. Giá web tham khảo khác báo giá cho công trình. Giữ schema catalog hiện tại và thêm metadata tương thích. |
| Liên kết hiển thị vật liệu | productId, sku, styleIds[], surfaceSlot, roomId, visualProfileId, textureAssetId, realWorldScale, exactness | exactness phân biệt vật liệu generic/mô phỏng/vật liệu hãng có asset xác minh. 3D chỉ nhận liên kết còn khớp sản phẩm; không suy texture từ ảnh mờ. |
| `project.constructionDesign` | schemaVersion, inputs, elements[], reviews[], issues[] | Hồ sơ phối hợp kỹ thuật theo phiên bản; không thay thế `project.site`/`project.plan`. |
| Cấu kiện | id, semanticType, floorRange, elevation, footprintOrAxis, dimensions, materialGrade, sourceEvidenceId, status, dependsOn[] | Phân biệt móng/cột/dầm/sàn/tường chịu lực/tường ngăn. Kích thước từ hồ sơ cung cấp hoặc gắn nhãn sơ bộ. |
| Rà soát | discipline, reviewedRevision, reviewerReference, reportReference, reviewedAt, scope, unresolvedIssues[] | Hồ sơ rà soát thật theo bộ môn. Checkbox/AI/test pass không phải xác nhận chuyên môn. |

Các tên extension trên là đề xuất để triển khai trong đợt 2/6; không trình bày như tính năng đã có. Nếu tái dùng field hiện hữu tương đương, TK1 cập nhật hợp đồng trước rồi TK2 dùng cùng tên.

## Đơn vị và đầu ra

- Nội bộ m; chỉ đổi sang mm tại nhãn kích thước/DXF. Plan y ánh xạ sang Three z; tầng bắt đầu từ 0.
- Polygon bản đồ WGS84 có độ chính xác bản đồ. Dữ liệu VN-2000 cần CRS/kinh tuyến/tham số chuyển đúng nguồn; thiếu thì giữ tọa độ gốc và số đo khách nhập.
- Diện tích/quãng đường/khối lượng lấy từ hình học hiện tại. Tách ô thang/giếng, cửa/lối mở và diện tích bề mặt đúng phạm vi; không cộng trùng tường chung.
- Mọi SVG, PDF, DXF, GLB, PNG, bảng lượng và dự toán mang design revision. Giá có pricing revision/date riêng; PNG có camera/reference signature riêng.
- Đổi số đo, khoảng lùi, công năng, cấu kiện hoặc vật liệu phải làm kết quả phụ thuộc hết hiệu lực. Giữ nguyên mốc chi phí cũ để so sánh.
- Mẫu nhà/ảnh AI có nhãn minh họa. Phối cảnh dự án chính xác là ảnh từ mô hình đo hiện tại.

## Trao đổi giữa hai tài khoản

1. TK1 bàn giao schema và mẫu JSON không có dữ liệu cá nhân thực.
2. TK2 đọc JSON mẫu và các field trước khi viết consumer. Field thiếu phải tạo trạng thái chờ, không tự điền cấu kiện.
3. Ghép nhánh của đợt, chạy normalize → lưu → reload → import → xuất. Kiểm tra số đo/ID/nguồn/kiểu chọn còn giữ.
4. Khi đổi contract, sửa bên cung cấp trước; vòng tiếp theo dùng phiên bản đã ghép. Không đọc dữ liệu trên worktree đang bị tài khoản khác chỉnh.
5. Bản xuất thiết kế cho khách giữ allowlist hiện tại: loại trừ tài khoản, token, tài chính riêng và ngày sinh gia đình khỏi gói thiết kế chia sẻ.

## Điều kiện dữ liệu kỹ thuật

Hồ sơ kiến trúc có thể hoàn thiện theo số đo được cung cấp. Hồ sơ kết cấu xây dựng cần thêm khảo sát, địa chất, tải trọng, hệ chịu lực, quy cách, tiêu chuẩn áp dụng và tài liệu kỹ sư. Không tự lựa chọn móng hoặc thép từ số phòng.

Luồng trạng thái theo bộ môn: Thiếu đầu vào → Phương án sơ bộ → Chờ rà soát chuyên môn → Đã rà soát kèm hồ sơ và revision. Thay dữ liệu phụ thuộc đưa kết quả liên quan về chờ rà soát. Nhiệm vụ không được dùng `suggestedColumns` hiện có làm kết luận cột thật; ký hiệu 0,22 m theo góc phòng là ví dụ sơ đồ.
