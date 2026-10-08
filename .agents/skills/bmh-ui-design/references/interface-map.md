# BMH source and interaction map

Resolve current repository vlam1881997-ops/build-my-home and live https://www.huiminhbach.id.vn/. Do not assume an old scratch path exists.

| Area | Source / contract |
|---|---|
| Build | scripts/build.cjs concatenates explicit JS/CSS lists; register modules/styles and retain local pinned Three. |
| State | src/10_state.js, src/82_customer_projects.js; automatic saves, designStudio restore and project isolation. |
| Shell | src/60_app.js, src/70_v60_product_ui.js; BMH.header/stepper/footer/navigateTo/SCREENS, ten visible numeric routes. Routes 1/2/3 are ideas/land/family; do not infer their mapping from screen function suffixes. |
| Planner | Route 4, effective BMH.screen5; src/30_planner.js, 75_completion.js, 76_architecture.js, 78_design_workflow.js, 79_stair_design.js, 81_design_studio.js, 87_elevator_design.js. |
| 3D | Route 6, effective BMH.screen7; 45_studio3d.js, 46_architectural_render.js, 81_design_studio.js, 85_interior_collections.js, 86_visual_materials.js, 88_customer_studio.js. |
| Dossier | Route 10, BMH.screen10; sheets in 75_completion.js, design-only ZIP in 88_customer_studio.js. Printable HTML is not a PDF binary. |
| Guided UI | If present, 89_guided_interface.js owns final simplified shell/workspace wrappers and guided-interface.css its responsive styles. Read final overrides. |
| Materials, finance and construction | Routes 5/7/8/9 must remain visible in main navigation. Route 5 has the supplier showroom; route 8 has cash/loans, bank picker and repayment exports. Customer orders use 84_customer_service.js and actual /api/config flags. |

Preserve #plannerSvg, #studio3dStage, #studio3dCanvas, [data-v6-room], [data-visual-material-select], room/floor selections, [data-sharp-download], [data-studio-glb] and [data-client-package], plus their real domain handlers.

Use fresh fixture/browser contexts and existing proxy support for production checks. Never log credentials or edit actual user projects/orders as a test fixture.
