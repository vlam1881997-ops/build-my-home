---
name: bmh-3d
description: Build, inspect and optimize measured 3D architecture and interior models for Build My Home (BMH) with Three.js and glTF/GLB. Use for BMH house models, furniture, stairs, elevators, material realism, camera presets, browser freezes, render speed, mobile performance and customer model exports.
---

# BMH measured 3D

Read [scene-contract.md](references/scene-contract.md). Locate the current checkout and inspect its pinned Three.js version before making changes.

1. Inspect the measured plan and current scene. Use metres internally, map plan y to Three z and derive levels from projectLevels. Preserve dimensions, wall openings, shared walls, parcel geometry and per-room finish choices. Use the same stair and elevator geometry for the plan and model.
2. Choose a usable model path: parametric Three geometry for editable measured architecture; licensed GLB furniture for reusable assets; Blender only if an actual installation/tool is available and it improves the requested model. Do not claim that this skill installs Blender, a CAD application or a remote rendering service.
3. Inspect an incoming GLB with `scripts/inspect_glb.py` and confirm its licence separately from the original publisher. Check metres, transforms, declared bounds, triangle complexity, texture sizes and extension dependencies. Never interpret a copyright string or absence of one as redistribution permission.
4. Build detailed but bounded geometry. Prefer shared immutable texture templates with scene-owned textures/materials, sensible tessellation, instancing where appropriate and lazy model loading. Keep corridors and shaft voids clear. Avoid repeatedly creating WebGL renderers for the same canvas.
5. Keep interactive raster 3D immediately available. Use high-resolution raster capture for quick crisp images, with exact camera, correct tone mapping/colour space and restored canvas/composer settings. Keep path tracing optional with progress, budgets, resume and cancellation; do not assume it is fast on phones or software GPUs.
6. Run meaningful unit geometry checks and a real browser verification on desktop and mobile. Measure first visible view, material switch and PNG export. Check JS/WebGL errors, frame dimensions, memory disposal, camera preservation, project isolation and persistence. Test a shaft/stair across multiple floors with open slab holes and accessible landing-door locations.
7. Inspect screenshots and exports, then deliver the actual model/source and verified measurements. Export GLB with a supported exporter when requested and inspect the resulting file; do not rename a PNG or JSON file to GLB. Label symbolic cabin dimensions or unconfirmed engineering details accurately.

Keep externally backed BMH code in its existing repository. Save standalone deliverables with the available persistent-file workflow. Report actual performance and unresolved limitations instead of calling a partially configured app ready for commercial deployment.
