# BMH intake illustration provenance — 2026-10-07

Three distinct onboarding illustrations were generated for the rounds 3–4–5 release with the built-in `image_gen.imagegen` tool on 2026-10-07. They share warm ivory, light oak and forest green styling. No external stock photograph, customer photo, manufacturer texture, real map, or reference image was supplied to the three generation calls.

## Asset manifest

| Project asset | Dimensions | Bytes | Selected original PNG |
| --- | --- | ---: | --- |
| `assets/design/intake-location.webp` | 1120 × 630 | 172246 | `exec-7ce1b25d-1a61-495a-a453-6ebe0f829a30.png` |
| `assets/design/intake-finance.webp` | 1120 × 630 | 56172 | `exec-f2aef765-4adb-4eca-8409-dab8e6797a63.png` |
| `assets/design/intake-family.webp` | 1120 × 630 | 85212 | `exec-74ce1593-97d7-417f-96ec-0b54903920af.png` |

Original PNGs remain in the session's `generated_images` directory. The original finance generation, `exec-657caa76-758f-421b-8f27-50bfbf566e5f.png`, was retained as well. A built-in image edit removed visible calculator key labels before selecting the final finance image.

The generated 1672 × 941 originals were visually inspected, then resized to the final 1120 × 630 dimensions, stripped of ancillary metadata, and compressed with ImageMagick `convert` at WebP quality 82. Resize/compression performed no content synthesis. The WebP files were inspected after export.

## Intended use and rights scope

These are generic illustrative product assets, not measured house designs, real customer portraits, evidence of a location, construction drawings, financial quotations, or a reconstruction of a chosen project. The interface should identify them as illustrations.

The assets were generated with OpenAI's built-in image tool rather than downloaded under a third-party stock or manufacturer license. This provenance records the actual tool and inputs; it does not claim a Creative Commons/public-domain license, exclusive copyright, third-party legal clearance, or certification of commercial rights. No separate paid API/CLI generation path was used.

## Full prompts

### Location generation

```text
Use case: stylized-concept. Asset type: landscape 16:9 onboarding illustration for Build My Home, final web asset will be 1120 by 630 pixels. Create a polished photorealistic 3D editorial architectural illustration: an inviting contemporary Vietnamese home entrance in a peaceful lush residential setting, ivory plaster walls, natural light oak entry door and warm stone paving, forest green tropical planting. One discreet sculptural forest green location pin floats near the entrance as an abstract symbol, no real map or geographic data. Wide clean composition, comfortable negative space around the scene, all important elements comfortably within frame. Cozy soft daylight, realistic material texture, warm ivory/oak/forest green palette, refined approachable premium web-app visual, coherent warm architecture editorial series. No people required. No text, numbers, letters, logos, watermark, technical drawings, prices, maps, arrows or UI screenshots. Opaque background.
```

### Finance generation

```text
Use case: stylized-concept. Asset type: landscape 16:9 onboarding illustration for Build My Home, final web asset will be 1120 by 630 pixels. Create a polished photorealistic 3D editorial still life in a warm contemporary home: an elegant natural light oak table holding a generic open blank ivory budget notebook, an unbranded forest green calculator with blank display and plain unlabeled keys, and a small architecturally plausible miniature modern ivory house with oak details. A comfortable softly blurred ivory room and subtle green plant in the background. Wide balanced composition, objects comfortably within frame. Cozy soft daylight, realistic wood/paper/ceramic materials, warm ivory/oak/forest green palette, refined approachable premium web-app visual, coherent warm architecture editorial series. No text, numbers, letters, banknotes, actual prices, currency symbols, brand logos, watermark, technical drawings, charts, diagrams or UI screenshots. Opaque background.
```

### Finance targeted edit

Input: `exec-657caa76-758f-421b-8f27-50bfbf566e5f.png` — the project's own built-in generated image.

```text
Edit only the forest green calculator in this image: remove every printed or engraved number, letter and symbol from every calculator key. All keys must be completely blank smooth unmarked forest green surfaces, while the display stays blank. Preserve the calculator shape, key arrangement, color, material, position and shadows. Preserve the rest of the whole image exactly: the blank notebook, miniature house, furniture, plants, framing, warm daylight and 16:9 aspect ratio. No new text, numbers, symbols, logos or watermark.
```

### Family generation

```text
Use case: photorealistic-natural. Asset type: landscape 16:9 onboarding illustration for Build My Home, final web asset will be 1120 by 630 pixels. Create a polished photorealistic 3D editorial lifestyle illustration of a fictional Vietnamese multigeneration family enjoying a warm contemporary living room: two grandparents, two adult parents and one child seated naturally together around a low oak coffee table, relaxed affectionate conversation with natural expressions. Beautiful ivory walls, light oak furniture, forest green accents and subtle tropical houseplants, cozy modern Vietnamese home, plausible hands and faces, comfortable personal space. Wide balanced composition, everyone comfortably inside frame. Soft daylight, realistic fabric and wood textures, warm ivory/oak/forest green palette, refined approachable premium web-app visual, coherent warm architecture editorial series. These are fictional generic people, no actual customer identity. No text, numbers, letters, logos, watermark, technical drawings, prices, charts or UI screenshots. Opaque background.
```

## SHA-256

```text
7f43f9f228c2ee86866e466939096c5db58a51294a0a60e06262db01caa18151  assets/design/intake-location.webp
5b93fe234469abc0b4167edc98aa168eaf327898c20349ab027be42484f2628c  assets/design/intake-finance.webp
91dcfe032ac0851e9f28d9ed4c92a7ccf2fd419a6649a8f2c5508e163e711fc5  assets/design/intake-family.webp
```
