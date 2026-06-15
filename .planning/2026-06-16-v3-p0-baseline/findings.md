# Findings

## Production Source

- Cloudflare Pages project: `jirai`
- Production URL: `https://jirai.pages.dev`
- Production source commit: `1e5ab7220bf320e5943f3b86cb1c32025fcda660`
- Commit date: `2026-05-30 21:53:12 +0800`
- Commit message: `Revert "Improve drag start responsiveness"`

## Production Hashes

- `index.html`: `8bca0c72faa382fc1bc9209ac8524bf5f94373d1942736cd9cb3d86f78141b92`
- `src/app.js`: `6fd022275eb3a3f324bc8aae86b9fa2b99e827b07e3b35ab778d1c39f772a80c`
- `styles.css`: `fd3926cc09c802903ca233c4a2b17f658321d49ad1fa46d4318213767c57ab07`

The three deployed hashes match commit `1e5ab72`. The uncommitted changes in the production working directory are not deployed and were not copied into V3.

## Current Architecture

- Static HTML and CSS shell.
- Native JavaScript application logic.
- Canvas 2D preview and export composition.
- CPU pixel processing through `getImageData()` and `putImageData()`.
- DOM overlay for selected-layer controls and direct manipulation.
- Cloudflare Pages static hosting with a Pages Function for analytics.

## P0 Boundaries

- No WebGL implementation.
- No UI alignment changes.
- No feature migration.
- No production or Lab deployment.
- No copying of uncommitted production work.

## Visual Baseline

- Desktop `1440 x 900`: four-column layout complete, no empty-state clipping.
- Mobile `390 x 844`: fixed canvas, seven-item navigation, and blush controls complete.
- Mobile `430 x 932`: same content order and no empty-state clipping.
- Application console logs were empty at all inspected viewports.

## Performance Baseline

- `src/app.js` is 7,133 lines and owns state, CPU tone processing, Canvas composition, gestures, history, and export.
- The tone pipeline performs multiple full-buffer pixel reads and writes.
- Existing `requestAnimationFrame` scheduling and DOM overlay logic should be preserved and strengthened rather than replaced.
- Full photo, gesture, memory, and export timings require a controlled fixture in P1.
