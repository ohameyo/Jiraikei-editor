# Findings

## CPU Order

The production CPU pipeline applies:

1. Brightness multiplication.
2. Contrast around byte midpoint 128.
3. Saturation around luma using coefficients `0.299`, `0.587`, `0.114`.
4. Temperature source-atop fill at up to `0.16` alpha.
5. Tint source-atop fill at up to `0.14` alpha.
6. Fade source-atop fill toward RGB `245, 239, 246`.
7. Overlay color using dark guard, midtone boost, normal interpolation, and a highlight lift.

## Slider Path

- Most filter sliders use `commitOnEnd`, so `onPreview` currently stores `sliderPreviewFilters` and applies a CSS approximation.
- Migrated controls can replace that approximation with a transient render using the existing shared tone boundary.
- Pointer release already performs one state commit and clears transient slider state.
- HSL and portrait controls must retain the existing CPU/CSS behavior in P2.

## Compatibility Boundary

- The CPU path includes portrait-aware lip and green-speck protection even when the migrated global controls are the only visible changes.
- P2 browser fixtures therefore test exact global color math without face metadata.
- The GPU switch remains internal and off by default until portrait-aware differences are characterized.

## Verification Findings

- All 21 minimum/default/maximum cases selected GPU.
- The maximum and mean byte-channel difference were both `0`.
- The combined preview-size and export-size cases both selected GPU and matched their CPU references exactly.
- Across the 21-case matrix, the renderer built one program, uploaded one source texture, and updated uniforms 21 times.
- The real filter panel exposes brightness, contrast, saturation, temperature, tint, and fade in original mode. Overlay controls remain tied to non-original presets by the existing product rules.
- The editor and browser harness produced no page console warnings or errors.
