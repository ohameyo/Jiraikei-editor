# P7 HSL Shader Migration Baseline

Date: 2026-06-16
Branch: `codex/v3-p7-hsl-shader`

## Scope

P7 migrates the highest-value HSL controls that do not depend on portrait masks into the WebGL shader path. HSL means Hue, Saturation, and Lightness: color angle, color intensity, and brightness-like light level.

## Migrated To GPU

- `master` HSL.
- Split-color HSL for `red`, `orange`, `yellow`, `green`, `cyan`, `blue`, and `purple`.
- Preview and export use the same `ToneRendererSelector` boundary.
- Shader uniforms are normalized with the same min/default/max ranges as the UI controls.

## Still On CPU

- `skin` HSL.
- `lip` HSL.
- `black` HSL.
- Skin whitening.
- Blush.
- Black protection and dark-area smoothing.

These remain on CPU because the current implementation relies on face boxes, lip/skin masks, black-tone masks, and smoothing passes. Migrating them safely needs mask-aware shader work rather than a direct uniform-only port.

## Expected UX Impact

- Dragging global HSL sliders should now avoid the heavy CPU pixel loop when no unmigrated portrait effects are active.
- Dragging red/orange/yellow/green/cyan/blue/purple split-color sliders should also use WebGL.
- Combined advanced portrait presets may still feel heavier because any active unmigrated portrait effect correctly forces CPU fallback.

## Verification

- `node --test tests/p0/*.test.mjs tests/p1/*.test.mjs tests/p2/*.test.mjs tests/p3/*.test.mjs tests/p4/*.test.mjs tests/p5/*.test.mjs tests/p6/*.test.mjs tests/p7/*.test.mjs`
  - Result: 44 tests passed.
- Browser P2 matrix at `http://127.0.0.1:4181/tests/browser/p2-basic-filters.html`
  - Result: passed.
  - Basic filter renderers: `gpu`.
  - Preview/export maximum difference: `0`.
- Browser P4 advanced tone QA at `http://127.0.0.1:4181/tests/browser/p4-advanced-tone-qa.html`
  - Result: passed.
  - `global-hsl` preview/export: `gpu`.
  - `split-color-hsl` preview/export: `gpu`.
  - Skin/lip/black/whiten/blush/combined scenarios: CPU fallback with `effects-not-migrated`.
- App P5 real fixture QA at `http://127.0.0.1:4181/index.html?v3p5qa=1`
  - Result: passed.
  - 10 fixture-scenario cases loaded.
  - Preview and export byte counts matched in every case.

## Not Yet Verified

- Physical mobile-device frame timing.
- Pixel-perfect parity between CPU HSL and GPU HSL for large real photos.
- Gesture interaction under simultaneous HSL dragging on low-end devices.

## Recommended Next Stage

P8 should add browser-level HSL pixel parity fixtures for the migrated channels, then migrate mask-aware portrait effects in this order: skin HSL, lip HSL, black HSL, skin whitening/blush, and dark smoothing.
