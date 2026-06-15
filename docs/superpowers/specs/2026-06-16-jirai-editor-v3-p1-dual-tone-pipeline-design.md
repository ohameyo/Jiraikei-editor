# Jirai Editor V3 P1 Dual Tone Pipeline Design

Date: 2026-06-16

## Goal

Introduce the smallest safe CPU/GPU rendering boundary: WebGL2 may render an unchanged source image, while every unsupported state and every runtime failure continues through the production CPU pipeline.

## Scope

P1 includes:

- A normalized tone render request.
- An internal GPU feature switch.
- A WebGL2 passthrough renderer.
- A selector with eligibility checks and CPU fallback.
- Diagnostics for selected renderer and fallback reason.
- Preview and export integration through `renderToneBaseCanvas()`.
- Automated unit and browser verification.

P1 does not migrate brightness, contrast, saturation, HSL, portrait effects, blush, protection, smoothing, mosaic, stickers, text, or Polaroid composition.

## Data Flow

```text
renderToneBaseCanvas()
  -> normalized tone request
  -> selector
     -> CPU when switch is off
     -> CPU when effects are not migrated
     -> GPU passthrough when eligible and available
     -> CPU when GPU throws or loses context
  -> existing layer composition
  -> preview or export
```

## GPU Eligibility

The passthrough shader is eligible only when the tone state is visually identical to the source:

- Brightness, contrast, and saturation are `1`.
- Temperature, tint, skin whiten, blush strength, black protection, fade, and overlay strength are `0`.
- Every HSL adjustment is `0`.

Blush region coordinates do not block passthrough when blush strength is zero.

## Internal Switch

GPU is requested by either:

- URL query `?v3gpu=1`.
- Local storage key `jirai-v3-gpu` with value `1`.

The production default remains CPU. This is an internal migration switch, not a user setting.

## Diagnostics

The runtime records:

- Requested mode.
- Selected renderer.
- Eligibility result.
- Fallback reason.
- Input/output dimensions.
- Successful GPU render count.
- CPU fallback count.
- Last error message.

Diagnostics are exposed read-only through `window.__JIRAI_TONE_DIAGNOSTICS__()`.

## Error Handling

These conditions fall back to CPU:

- Switch disabled.
- Effects not migrated.
- WebGL2 unavailable.
- Context lost.
- Shader compile or program link failure.
- Texture, buffer, or framebuffer allocation failure.
- Draw or Canvas copy failure.

The selector does not mutate editor state.

## Acceptance

- Default URL remains byte-for-byte CPU behavior at the tone boundary.
- `?v3gpu=1` uses GPU for the original preset.
- Non-original filters still use CPU.
- Forced WebGL failure still renders through CPU.
- GPU output matches Canvas 2D source pixels for the test fixture.
- Preview and export call the same selector.
- Empty desktop/mobile UI remains aligned with P0.
- Tests, syntax checks, browser checks, and one Git commit complete the stage.
