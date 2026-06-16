# V3 P3 Advanced Color And Blush Baseline

Date: 2026-06-16
Branch: `codex/v3-p3-advanced-color-blush`

## Completed

- Restored the advanced `HSL` filter panel beside `Basic` and `Portrait`.
- Added shared advanced tone definitions for global HSL, skin, lip, split colors, and black.
- Added lip-color and black-channel HSL handling to the existing CPU tone pipeline.
- Kept skin whitening, blush, black protection, and shadow smoothing on the shared preview/export CPU path.
- Added sample coverage records for light, dark, black-white, black hair, fair skin, medium skin, deep skin, and lip-red pixels.
- Preserved P2 WebGL behavior: migrated basic filters still use GPU when eligible, while advanced filters explicitly fall back to CPU.

## Verification

- `node --test tests/p0/*.test.mjs tests/p1/*.test.mjs tests/p2/*.test.mjs tests/p3/*.test.mjs`
  - 29 tests passed.
- Browser matrix: `http://127.0.0.1:4177/tests/browser/p2-basic-filters.html`
  - Passed.
  - 21 GPU cases used the GPU renderer.
  - Preview and export max pixel difference: `0`.
  - No browser console errors.

## Not Yet Complete

- Advanced HSL, skin whitening, blush, black protection, and dark smoothing are not migrated to WebGL shader parity yet.
- Real-photo visual QA still needs imported sample images, especially black hair, dark clothes, multiple skin tones, and heavy blush.
- Mobile physical-device performance is still unverified for the CPU advanced path.
- The HSL panel was verified in DOM on the no-image state; real click-through should be repeated after importing a photo.

## Next Gap

P4 should focus on real sample-image QA and decide whether to migrate a narrow subset of advanced effects to shader first, likely master/split-color HSL without face-dependent masks.
