# Findings

- `renderToneBaseCanvas()` is the shared tone base for visible preview, Polaroid photo preparation, and export.
- `applyTonePipeline()` is synchronous and already wrapped by a production fallback to the original base image.
- P1 can remain synchronous because Canvas-to-WebGL texture upload and Canvas draw-back are synchronous.
- The production page loads only `src/app.js`; changing that script to an ES module allows focused tone modules without introducing a bundler.
- The original preset is the only safe P1 GPU state. All non-default tone parameters must stay on CPU until their shader equivalents are implemented and compared.
- Existing layer composition runs after the tone base and does not need modification.
# Findings

## Rendering Boundary

- `renderToneBaseCanvas()` is the only production tone boundary used by both edited preview and export composition.
- Layer rendering, selection overlays, touch interaction, polaroid composition, text, stickers, mosaic, and export assembly remain outside the new selector.

## P1 Behavior

- GPU is disabled by default and is only requested by `?v3gpu=1` or `localStorage['jirai-v3-gpu'] = '1'`.
- Only neutral tone controls are eligible for WebGL2 passthrough.
- Active brightness, contrast, saturation, temperature, tint, skin whitening, blush, HSL, black protection, fade, or overlay settings use the original CPU pipeline.
- WebGL2 unavailability, shader/link errors, context loss, render errors, and forced test errors fall back to CPU in the same render call.

## Verification

- Node tests: 14 passed, 0 failed.
- Browser pixel harness: passed.
- Browser console on the full editor: no warnings or errors.
- The first browser run exposed an invalid WebGL uniform initialization order; the harness was tightened so CPU fallback can no longer masquerade as a GPU pass.

## Migration Risk

- The existing CPU pipeline performs face/lip color protection even with neutral visible controls. The P1 GPU path intentionally performs literal source passthrough and remains opt-in.
- P2 must establish representative portrait fixtures and image-difference thresholds before migrating visible filters or enabling GPU by default.
