# B3 measured model bridge

Shared furniture ID/pose/size comes from B.resolvedFurniture, rendered at plan centre (x,y)->Three(x,z), negative Three rotationY for plan-positive angle, with cumulative level base supplied by the existing studio. Parametric furniture receives measured local width/depth/height; fallback GLBs normalize actual bounds to the same dimensions instead of a constant assumed scale.
Model selection/drag uses real Raycaster + floor plane; camera gestures remain available away from furniture. Drag updates the existing object without a new renderer; final commit uses B2 validation/history. GLB includes stable furnitureId and measured furniture snapshot; customer design export carries same pose.

A3 request: include plan.furniture in drawingRevision and measuredDesignIdentity. Current A94 revision omits this new schema, although B model invalidation keys already include it. Drawing/DXF consumers must use B.furnitureFootprint for arbitrary angles. Current authored room drag/rotation/proposal migration still requires A1 integration.

All reusable model assets remain the existing repo assets/parametric code; no downloaded unlicensed textures. Styles use B1 generic profiles, not exact manufacturer samples. The 24 image contact sheets are candidates for product-owner review, never auto-approved. A3 new fixtures + exact SKU asset licensing + review pending.
