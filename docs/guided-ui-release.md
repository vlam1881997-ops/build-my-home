# Guided BMH design interface

The project navigation exposes all ten functions: Ý tưởng, Khu đất, Gia đình, Bản vẽ, Vật liệu, 3D, Dự toán, Ngân hàng, Thi công and Bàn giao. Every entry opens its original route. Routes 2/3 retain the land/family mapping. Next and Back visit adjacent functions, including the showroom, estimates and banking. On phones all ten entries fit in two rows. Công cụ khác contains utility actions; project management and app installation remain in Dự án.

The family page uses two desktop columns for land and household fields, with the reference table across the page. Phone fields stack, and wide tables scroll inside their own container.

The bank picker remains open during asynchronous rate updates, so a response cannot interrupt bank selection. Selecting a bank, clicking outside or pressing Escape closes it.

The planner uses floor/view selectors and a Thêm phòng menu, including elevators. Precise position, openings, alignment, dimensions and the full door table are expandable. Selected elevators show their own settings. Locks and geometry errors remain visible. Native disclosure controls keep the current WebGL renderer and camera; their open state survives edits and reloads.

The studio offers three view tabs, one collection selector with all ten collections, and four surface selectors. Sample rooms are labelled. Image settings, saved cameras, presentation, GLB, comparison galleries and AI remain accessible through secondary controls. The default image download is raster sharpening; it does not call AI or start light transport.

Hồ sơ provides the design-only ZIP and printable A3 drawings. Moving from 3D to Hồ sơ copies the settled displayed frame, bounded to 960 px, without another 3D render. A cover is accepted only for the same project object, drawing revision, finish signature and camera. Pending/stale frames and images from other projects are omitted. The snapshot still excludes finance, household, account and payment data.

## Verification

- Existing three-floor elevator/living-room fixture: visible planner buttons 44 → 4; visible studio buttons 57 → 6. Counts cover each complete workspace and exclude controls in closed native groups; selectors and disclosure summaries remain visible.
- 200 automated tests and production build passed.
- Real desktop/390 px phone flow covers floor/drawing selectors, measured elevator edits and A3, collection/surface changes, retained camera, disclosure persistence, readable phone selectors and contained door-table overflow.
- All ten routes, their selected tab and sequential Next/Back are exercised on both devices. Showroom product selection, banking selection, manually entered loan scenarios and a 60-month repayment workbook use real controls. Material/bank choices and loan values survive reload; configured-provider flags and rate-provider requests are mocked, with rates remaining unverified.
- Exports are inspected: daylight PNG pixels and dimensions, parsed GLB geometry/metres, ZIP sheets/DXF/materials, current cover and exclusion of private fixture data. AI requests are mocked for stale-camera checks.
- Browser suite: `node tests/customer-studio.browser.cjs`. Optional `BMH_CHROMIUM_EXECUTABLE`, `BMH_BROWSER_OUTPUT` and `BMH_BROWSER_URL` select a browser, screenshots and production target. Production proxy credentials come from the environment and must not be logged.

This remains preliminary architectural design. Professional construction documents, elevator installation approval and enabled cloud/payment services require their existing separate configuration and review.
