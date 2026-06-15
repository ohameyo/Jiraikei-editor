# Jirai Editor V3 P2 - Basic Filter Migration

## Goal

Migrate brightness, contrast, saturation, temperature, tint, fade, and overlay color processing to the opt-in WebGL2 tone renderer, with shader-only slider previews and one shared preview/export implementation.

## Phases

1. [complete] Confirm scope, inspect CPU formulas, slider scheduling, preview cache, and P1 renderer boundaries.
2. [complete] Create branch `codex/v3-p2-basic-filters`.
3. [complete] Add failing tests for parameter bounds, GPU eligibility, shader uniforms, and slider-preview integration.
4. [complete] Implement normalized GPU filter parameters and shader math.
5. [complete] Replace CSS previews for migrated sliders with transient GPU previews.
6. [complete] Add browser pixel comparisons for every parameter at minimum, default, and maximum.
7. [complete] Verify preview/export reuse, CPU fallback, full regressions, browser console, and commit P2.

## Decisions

- GPU remains opt-in through the P1 switch.
- The migrated controls are brightness, contrast, saturation, temperature, tint, fade, overlay strength, and overlay color.
- HSL, skin whitening, blush, black protection, and any future unknown tone parameter remain CPU-only.
- Slider preview state is transient and does not create history entries until pointer release.
- Migrated slider previews do not use the existing CSS approximation.
- Shader formulas mirror the production CPU ordering: basic RGB transforms, temperature, tint, fade, then luminance-weighted overlay.
- Browser comparison uses deterministic color fixtures. Each parameter is checked at the production UI minimum, default, and maximum.
- GPU/CPU per-channel tolerance is 2 for basic transforms and solid fills, and 3 for the luminance-weighted overlay because of browser rounding.
- No deployment is part of P2.
- Presets with active portrait, HSL, or black-protection effects remain on CPU; P2 migrates the global pass, not complete presets.
- One image and render size reuse one linked program and one uploaded source texture; eligible slider frames update uniforms only.

## Errors Encountered

| Error | Attempt | Resolution |
| --- | --- | --- |
| P2 tests failed because the parameter module, uniforms, eligibility, and transient preview path did not exist. | 1 | Implemented the minimal P2 contract after confirming the expected red test state. |
