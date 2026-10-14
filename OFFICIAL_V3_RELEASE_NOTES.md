# Official V3.0 — Release Notes

## Visual rebuild theo mockup

- Rebuild shell: header, sidebar, stepper, card system, typography, sticky budget footer.
- Step 1: hero + 3 luồng đúng bố cục mockup; không có 3D/AI banner thừa.
- Step 2: logo ngân hàng, khối tài chính, DTI, stress test và knowledge panel.
- Step 3: bố cục search/map/region theo mockup; tile lỗi vẫn giữ đúng tọa độ dự án.
- Step 4: 3 cột lô đất / địa chất / phong thủy + household động.
- Step 5: bố cục 3 cột như mockup; technical sheet lớn, cửa/cửa sổ, furniture, dimension, inspector và validator.
- Step 6: tier cards, catalog vật liệu, impact panel.
- Step 7: score panel + scene center + review cards + time machine.
- Step 8: dự toán và VietQR/paywall ở cùng above-the-fold.
- Step 9: stage bar + schedule + progress + checklist MEP.
- Step 10: download center + giải ngân + bàn giao + tổng quan tài chính.

## Functional upgrades

- Một state controller và một navigation guard.
- Bước 9 và 10 cùng một entitlement; Bước 8 không thể Next khi chưa paid.
- Excel export chuyển sang SpreadsheetML `.xls` thay vì chỉ CSV.
- Bundle ZIP chứa project JSON, mặt bằng SVG từng tầng, dự toán XLS, lịch trả nợ XLS.
- Service Worker cache version mới để tránh Vercel/mobile giữ bundle cũ.

## QA tự động

58/58 tests PASS, gồm finance/domain logic, planner geometry, single bundle, paywall guard, Step 7-only scene, Bình Dương coordinates, door/window objects và không có legacy patch files.
