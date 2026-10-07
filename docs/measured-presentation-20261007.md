# Measured house presentation — 7 October 2026

The existing whole-house view was distant, daylight washed out finish colours,
and flat roof faces shared the exact depth of the slab top. The latter caused
visible white stripes as the depth buffer alternated between both surfaces.

This release applies negative polygon depth bias to the roof finish. It does not
move the measured roof vertices, fill stair/shaft voids, change roof areas or add
a new structural thickness. The correction is for the interactive/raster
renderer; depth bias is not a portable glTF material property.

New/default exterior views use the existing facade camera, with a slight angle
to read the front. An explicit overview and saved customer camera remain
available and persist. Exploded floors retain whole-building framing. Daylight
uses a stronger directional key with less flat fill and lower exposure. Night
lighting, Neon views, finish colour values, supplier bindings and geometry retain
their existing ownership and controls. The render revision invalidates older
cached pictures from the previous lighting pipeline.

Verification uses a real 8 × 18 m, two-floor Japandi model. Desktop and phone
journeys retain the complete plan/style/material selections, compare every
flat-roof triangle area with the source takeoff and check actual roof heights.
The source area is 110.4084 m²; Float32 rendered triangles total
110.40840504798894 m². Roof screenshots with and without depth bias use exactly
the same camera and lighting and visibly show the correction.

Native raster downloads contain the current measured model: 1280 × 878 px on
desktop and 1179 × 1280 px for the phone aspect ratio. Export timings in this
software-GPU fixture were 1.940 and 2.090 seconds; they are not a promise for
customer devices. Explicit overview selection survives reload. No AI credit,
payment, external customer location, new asset or hosted service is used.

`tests/measured-presentation.browser.cjs` covers the source/mesh/photo boundary.
The existing visual journey covers all ten routes on desktop/phone, with no
horizontal overflow or page/shader errors. Relevant calculation/design/loading
tests and the existing measured-model presentation story remain the regression
checks. A full CI build/test is required before merge.

This is a focused presentation correction. It does not make a parametric house
a professionally authored architectural proposal, reproduce a manufacturer's
exact material, configure a paid service or supply reviewed structural/MEP
construction documents. The outstanding product/design work remains explicit.
