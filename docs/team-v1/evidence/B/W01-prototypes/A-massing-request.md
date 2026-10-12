# W01 — yêu cầu phối hợp mặt bằng / hình khối

Owner xử lý planner/schema: A. B chưa sửa source A hoặc thay lựa chọn của khách.

Bằng chứng: result.json và exterior-baseline.jpg. Nhà phố 5.4 × 20 m/3 tầng được tạo bằng generateDesignKits + applyDesignKit B. Phòng ngủ tầng 3 trong fixture neo có kích thước 3.98 × 12.38 m; khối trước của ba tầng trùng nhau. Nhà rộng 14 × 20 m/2 tầng vẫn thành hộp chữ nhật. Đây là fixture, chưa phải lỗi của mọi dự án.

Cần phương án có căn cứ: chia phần diện tích dư theo công năng khách chọn; đề xuất loggia/hiên/khoảng lùi tầng phù hợp bề ngang, nhu cầu và giới hạn xây dựng. Không tự sinh ban công/cột chịu lực trên renderer.

Hợp đồng cần giữ: planSnapshot → preview với kích thước/diện tích thay đổi → directPlanError → khách áp dụng → commitDirectPlan; khóa phòng/tầng, cửa nối phòng, stairs/elevator, furniture ID/pose/tombstone, undo/redo/lưu-mở. Chỉ xóa/thay phòng khi được chấp nhận. B sẽ dựng cùng phòng/cửa/mái và phối vật liệu, kiểm ảnh exterior/living/bed.

W01 chưa đạt hình khối thương mại; không dùng số lượng ảnh hay unit test để đóng gate.
