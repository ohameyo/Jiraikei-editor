# Progress

## 2026-06-16

- Confirmed the user-approved P2 scope: brightness, contrast, saturation, temperature, tint, fade, overlay strength/color, shader-only slider preview, parameter extrema checks, and shared preview/export.
- Inspected the exact CPU formulas and their operation order.
- Inspected the slider preview path and identified the existing CSS approximation to remove only for migrated controls.
- Created branch `codex/v3-p2-basic-filters`.
- Defined deterministic browser pixel tolerances and retained CPU fallback for all non-migrated effects.
- Added red tests for production parameter bounds, migrated eligibility, shader uniforms, source texture identity, resource diagnostics, and transient slider integration.
- Implemented normalized basic tone parameters and hexadecimal overlay color parsing.
- Migrated production-equivalent brightness, contrast, saturation, temperature, tint, fade, and luminance-weighted overlay formulas to GLSL.
- Added uniform location caching, source texture reuse, and renderer resource diagnostics.
- Replaced the CSS approximation with requestAnimationFrame-driven transient GPU renders for eligible migrated controls; store state still commits once on release.
- Exposed the previously defined contrast, temperature, and tint controls in the Basic panel.
- Browser matrix passed all 21 parameter endpoints plus combined preview/export with maximum channel difference `0`.
- Resource verification recorded one program build, one texture upload, and 21 uniform updates.
- P1 passthrough and forced-failure browser verification still passes.
- Final verification passed 23 Node tests, JavaScript syntax checks, `git diff --check`, the P2 browser matrix, the P1 browser fallback matrix, and full editor loading with no console warnings or errors.
