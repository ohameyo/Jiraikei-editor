# V3 P2 Basic Filter Baseline

Date: 2026-06-16

## Scope

P2 migrates brightness, contrast, saturation, temperature, tint, fade, overlay strength, and overlay color to the opt-in WebGL2 renderer.

## Parameter Matrix

The browser fixture checks the production UI minimum, default, and maximum for every numeric parameter. It uses opaque black, gray, white, primary colors, a skin-like color, and a transparent pixel.

## Acceptance Threshold

- Basic and fill operations: expected per-channel difference at most 2.
- Overlay and combined operations: expected per-channel difference at most 3.
- Every case must report `selectedRenderer: gpu`.
- Preview-size and export-size fixtures use the same runtime and shader.
- Repeated values for one source build one program, upload one texture, and update uniforms once per render.

## Observed Result

- Endpoint cases: 21 passed.
- Maximum channel difference: `0`.
- Mean channel difference: `0`.
- Combined preview-size difference: `0`.
- Combined export-size difference: `0`.
- Program builds across endpoint matrix: `1`.
- Texture uploads across endpoint matrix: `1`.
- Uniform updates across endpoint matrix: `21`.
- Browser console warnings/errors: none.
- Default renderer without the internal GPU switch: CPU with `gpu-disabled`.

## Deferred

- Portrait-aware lip and green-speck protection.
- Skin whitening, blush, HSL, and black protection.
- GPU enabled by default.
- Physical iPhone and Android performance measurements.
- Presets with active portrait, HSL, or black-protection effects remain on CPU. P2 does not claim full-preset GPU migration.
