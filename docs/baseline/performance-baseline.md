# V3 P0 Performance Baseline

Date: 2026-06-16

## Static Size

| Item | Baseline |
| --- | ---: |
| `index.html` | 220 lines |
| `styles.css` | 2,895 lines |
| `src/app.js` | 7,133 lines |
| `src/vision-skill.js` | 205 lines |
| `src/main.js` | 352 lines |
| Asset files | 125 |
| Asset directory | approximately 52 MB |

The largest payloads are full font files. The two largest are approximately 16 MB each.

## CPU Rendering Hotspots

The current tone and portrait pipeline repeatedly reads and writes full pixel buffers:

- `applyTonePipeline()` starts near `src/app.js:1928`.
- Full image reads occur through `getImageData()`.
- Full image writes occur through `putImageData()`.
- Blush, overlay color correction, dark protection, and dark smoothing add further pixel passes.
- Preview composition begins in `renderToneBaseCanvas()`.
- Layer composition begins in `drawLayerStack()`.
- Final preview composition begins in `renderEditedCanvas()` and `renderCanvas()`.

This is the CPU reference implementation. Later WebGL stages must match its visual output before replacing any pass.

## Existing Performance Protections

- Several slider and render paths use `requestAnimationFrame` to combine updates.
- Layer controls use a DOM overlay rather than drawing selection UI into the exported bitmap.
- Some direct-manipulation paths retain a temporary preview before the final canvas render.
- Export uses asynchronous `toBlob()` where available.

## Known Costs And Risks

- CPU pixel loops share the browser main thread with pointer input and UI updates.
- Multiple full-size Canvas buffers can coexist during preview and export.
- Export contains several synchronous `toDataURL()` compatibility fallbacks.
- Large font assets increase cold-load cost.
- The central `src/app.js` couples state, rendering, gestures, and export, increasing regression risk.

## Repeatable P1 Measurements

The first WebGL phase must measure the same fixture in CPU and GPU modes:

1. Record source dimensions and preview dimensions.
2. Drag one representative filter slider for 60 input events.
3. Record input events, scheduled renders, completed renders, and long tasks.
4. Measure P50 and P95 preview render duration.
5. Record peak JavaScript heap where supported.
6. Export once at production resolution and record duration and output dimensions.
7. Repeat export three times and check retained Canvas and texture resources.
8. Compare CPU and GPU output pixels.

Target devices:

- Desktop Chrome at `1440 x 900`.
- macOS Safari.
- iPhone Safari at a `390 x 844` class viewport.
- Android Chrome at a `430 x 932` class viewport.

## P0 Verified

- Empty project loads at all three baseline viewports.
- Application console contains no page errors.
- No control clipping is visible in the empty project screenshots.
- Source files remain byte-identical to the production deployment.

## P0 Not Verified

- Slider frame rate with a real photo.
- Gesture latency with a selected layer.
- Peak memory during tone processing.
- Full-resolution export time.
- Physical phone performance.

P0 intentionally records the method and hotspots without changing the production implementation.

