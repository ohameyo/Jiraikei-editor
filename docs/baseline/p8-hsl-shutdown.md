# P8 HSL Shutdown Baseline

Date: 2026-06-16
Branch: `codex/v3-disable-hsl`

## Decision

HSL is retired from V3. HSL means Hue, Saturation, and Lightness: color angle, color intensity, and brightness-like light level. It is no longer shown in the editor UI, no longer affects rendering, and should not be developed or maintained as a product feature.

## Removed From Product Surface

- Removed the HSL filter tab from the frontend.
- Removed HSL channel buttons and sliders.
- Removed HSL visual QA scenarios.
- Removed the P7 HSL shader migration test and baseline.
- Removed HSL shader uniforms and shader logic.
- Removed public HSL exports from the tone module.

## Compatibility Behavior

- Legacy `hsl_*` filter keys are ignored.
- Legacy `hsl_*` keys do not force CPU fallback.
- Old presets can still contain inert HSL patch data, but `buildHslPatch()` now returns an empty object so those values do not enter active filters.

## Still Maintained

- Basic filters: brightness, contrast, saturation, temperature, tint, fade, overlay color, and overlay strength.
- Portrait effects: skin whitening, blush, black protection, and dark smoothing.
- WebGL rendering for migrated basic filters.
- Preview/export parity for maintained filters.

## Verification

- Node suite:
  - `node --test tests/p0/*.test.mjs tests/p1/*.test.mjs tests/p2/*.test.mjs tests/p3/*.test.mjs tests/p4/*.test.mjs tests/p5/*.test.mjs tests/p6/*.test.mjs tests/p8/*.test.mjs`
  - Result: 44 tests passed.
- Source scan:
  - No active source/test references to HSL UI ids, HSL shader uniforms, `hslKey`, `HSL_CHANNELS`, or `HSL_AXES`, except negative assertions in shutdown tests.
- Browser QA at `http://127.0.0.1:4182/`:
  - P2 basic filter matrix passed with `gpu` renderers and preview/export maximum difference `0`.
  - Main editor filter tabs were `基础` and `人像`; HSL tab was absent and HSL channel button count was `0`.
  - P4 advanced tone QA passed for maintained portrait scenarios.
  - P5 real fixture QA passed with 8 cases, all using the `portrait` panel.

## Next Stage

Continue performance work on maintained features only. The best next target is mask-aware portrait performance: skin whitening, blush, black protection, and dark smoothing.
