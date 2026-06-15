# Progress

## 2026-06-16

- Read the completed P0 plan, approved V3 WebGL design, and active production rendering paths.
- Confirmed `renderToneBaseCanvas()` is the narrow shared preview/export integration point.
- Created branch `codex/v3-p1-dual-tone-pipeline`.
- Defined the opt-in passthrough and automatic CPU fallback boundary.
- Added a normalized preview/export tone request, feature switch, renderer selector, WebGL2 passthrough renderer, diagnostics, and deterministic CPU fallback.
- Converted the production entry script to an ES module and replaced the single shared tone call inside `renderToneBaseCanvas()`.
- Kept the default renderer on the unchanged CPU pipeline; GPU requires `?v3gpu=1` or local storage key `jirai-v3-gpu=1`.
- Added a forced-failure switch `?v3gpuFail=1` for local fallback testing.
- Passed 14 Node tests across the P0 production contract and P1 renderer behavior.
- Passed the browser pixel harness: GPU selected for neutral passthrough, RGBA pixels matched, effects returned to CPU, and forced GPU failure returned to CPU exactly once with matching pixels.
- Confirmed the full editor loads as an ES module without browser console errors.
- Noted that the production CPU pipeline includes unconditional face/lip protection work even at neutral controls. P1 remains an opt-in passthrough experiment; later effect migration requires dedicated image-difference thresholds before expanding eligibility.
