# P6 Slider Performance Baseline

Date: 2026-06-16
Branch: `codex/v3-p6-slider-performance`

## Scope

P6 is the first stage aimed at immediate perceived performance. It does not migrate every advanced effect to the shader path yet; it makes the existing accelerated path the default and lowers preview pressure while a slider is actively dragging.

GPU means Graphics Processing Unit, the graphics processor that is better suited than the main processor for parallel image work. CPU means Central Processing Unit, the main processor that runs general app logic and becomes easier to overload with full image redraws.

## Changes

- WebGL tone rendering is requested by default in V3.
- Users and tests can still opt out with `?v3gpu=0` or `localStorage.jirai-v3-gpu = "0"`.
- Slider dragging now uses the same lightweight preview sizing policy as direct canvas manipulation and text editing.
- Basic filters keep their migrated WebGL preview/export path.
- Advanced effects that are not migrated yet still fall back to CPU rendering, but slider preview redraws use smaller preview caps.

## Expected UX Impact

- Brightness, contrast, saturation, temperature, tint, fade, and overlay sliders should use the GPU path by default.
- Dragging any slider should create less render pressure because preview size is capped lower during active interaction.
- Export remains full-quality and should keep matching preview implementation for migrated basic filters.

## Verification

- `node --test tests/p0/*.test.mjs tests/p1/*.test.mjs tests/p2/*.test.mjs tests/p3/*.test.mjs tests/p4/*.test.mjs tests/p5/*.test.mjs tests/p6/*.test.mjs`
  - Result: 40 tests passed.
- App QA at `http://127.0.0.1:4180/index.html?v3p5qa=1`
  - Result: passed.
  - Advanced fixture scenarios produced `effects-not-migrated`, confirming GPU was requested by default and then intentionally fell back for unsupported advanced effects.
- Browser P2 matrix at `http://127.0.0.1:4180/tests/browser/p2-basic-filters.html`
  - Result: passed.
  - 21 basic filter cases rendered with `gpu`.
  - Preview/export maximum difference: `0`.

## Not Yet Solved

- Global and split HSL are still CPU-rendered when enabled.
- Skin, lip, black-protection, whitening, blush, and shadow smoothing are still CPU-rendered when enabled.
- Real-device mobile profiling is not included in this baseline.
- This stage reduces preview pressure but does not yet make all P3/P4 effects shader-native.

## Recommended Next Stage

P7 should migrate the highest-impact advanced color controls to the shader path, starting with global HSL and split HSL. That would reduce the remaining CPU-heavy slider path while preserving the WebGL interaction model from the fan/Gemini version.
