# Design contract

Bộ 10 ảnh mockup do chủ dự án chốt là visual specification. Khi thay đổi UI phải ưu tiên: hierarchy, tỷ lệ cột, spacing, tone xanh rêu/đất nung, card depth, stepper và vị trí CTA giống mockup trước khi thêm embellishment mới.

## Nguyên tắc

1. Không render component Bước 7 ở step khác.
2. Không sinh DOM bằng patch script hậu kỳ.
3. Logic cập nhật state; screen render đọc state.
4. Planner interaction chỉ đăng ký một controller pointer.
5. Mobile là layout riêng bằng responsive CSS, không scale nguyên desktop.
