---
name: bmh-images
description: Create and improve architectural and interior images for Build My Home (BMH), preserving the measured camera view, selected interior collection, colours and material scale. Use for BMH room renders, exterior perspectives, visual material previews, image quality improvements and Gemini image prompt integration.
---

# BMH architectural images

Read [render-contract.md](references/render-contract.md) before editing the image pipeline.

1. Identify the requested deliverable: a precise image of the current measured 3D, an illustrative AI perspective, a catalog preview or an edit of an existing photograph. Preserve that distinction in the output and UI.
2. Inspect the source image before an edit. For native image creation/editing, use the available image-generation tool and its reference-image and transparency instructions. Do not simulate image generation with Python. For accurate technical drawings, use the BMH drawing workflow instead.
3. Capture the actual current camera, plan and selected finishes. Use the quick 3D/high-resolution raster export when geometry accuracy or speed matters. Reserve path tracing for explicitly requested lighting/reflection refinement; keep cancellation, progress and immediate export usable.
4. Assemble a complete image brief: room/exterior, dimensions, visible openings, camera, collection name, wall/floor/accent/fabric colours, material texture and scale, lighting, furniture and required preserved elements. Do not truncate the selected palette. For a photograph, specify allowed edits and preserve existing building structure unless the user requests a redesign.
5. Generate only the requested number of images. Use a mock or cached response to test backend integration; do not make paid provider calls merely to test unrelated code. In BMH, keep provider secrets on the server and validate body size, reference image, output MIME and failure states.
6. Inspect the result against the reference and finish brief. Reject invented doors/windows, altered room proportions, a different collection, stale camera views and unexplained material substitutions. Keep AI images labelled as illustrations. Do not use visual realism as evidence of structural feasibility or a real supplier product.
7. Deliver the image through the native image result mechanism, or export the accurate raster image through BMH. For a separate requested file, follow the available persistent-file workflow. Report actual resolution and measured export latency rather than claiming universal speed.

Installing this skill adds a reusable Work workflow. It does not install an image provider, change the BMH backend, purchase a subscription or enable an account integration by itself.
