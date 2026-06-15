# Jirai Editor V3 P2 Basic Filters Design

Date: 2026-06-16

## Goal

Move the seven global tone controls to WebGL2 while preserving the production CPU renderer as the default and fallback.

## Migrated Controls

| Control | UI minimum | Default | UI maximum |
| --- | ---: | ---: | ---: |
| Brightness | 0.6 | 1 | 1.3 |
| Contrast | 0.7 | 1 | 1.4 |
| Saturation | 0.3 | 1 | 1.2 |
| Temperature | -100 | 0 | 100 |
| Tint | -100 | 0 | 100 |
| Fade | 0 | 0 | 0.5 |
| Overlay strength | 0 | 0 | 0.45 |

Overlay color is supplied as the existing hexadecimal color value.

## Shader Order

The fragment shader mirrors the CPU pipeline:

1. Multiply RGB by brightness.
2. Apply contrast around `128 / 255`.
3. Apply saturation around production luma.
4. Blend temperature color with alpha `abs(value / 100) * 0.16`.
5. Blend tint color with alpha `abs(value / 100) * 0.14`.
6. Blend fade color `rgb(245, 239, 246)` by fade.
7. Apply luminance-weighted overlay and highlight lift.

Transparent pixels retain their source alpha and do not receive fill effects.

## Eligibility And Fallback

The GPU path accepts any value of the migrated controls after normalization. It rejects active skin whitening, blush, black protection, HSL adjustments, and unknown non-neutral tone effects. Rejected or failed requests use the unchanged CPU path once.

## Slider Interaction

For migrated controls:

- Pointer movement updates transient filter values.
- A requestAnimationFrame callback renders the transient state through the GPU tone runtime.
- The CSS filter approximation is not applied.
- Store state and history are committed once on release.
- The source texture and linked shader program are reused for the same image and render dimensions, so repeated eligible previews update uniforms without recompiling or re-uploading.

Non-migrated controls retain the current interaction behavior.

Presets containing active portrait, HSL, or black-protection effects remain CPU-rendered until those passes are migrated. P2 does not weaken that fallback boundary.

## Preview And Export

Both use `renderToneBaseCanvas()` and `toneRuntime.render()`. Export supplies the same normalized parameters at export resolution; it does not have a separate shader or formula.

## Verification

- Unit tests cover normalization, eligibility, uniforms, and integration boundaries.
- A browser fixture compares CPU reference pixels with GPU pixels at minimum, default, and maximum for every migrated parameter.
- Preview and export dimensions and pixels are compared for the same source and filter state.
- P0 and P1 regression tests remain green.
- GPU remains off by default.
