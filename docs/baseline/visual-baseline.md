# V3 P0 Visual Baseline

Date: 2026-06-16

## Viewports

| Viewport | Screenshot | SHA-256 |
| --- | --- | --- |
| Desktop `1440 x 900` | `screenshots/v3-p0-desktop-1440x900.png` | `185633981dd809b2b7def77359536ebbf2a7f96cce556abf1e0a221e252b1017` |
| Mobile `390 x 844` | `screenshots/v3-p0-mobile-390x844.png` | `a0fcd61e02615a6292d81248993a3da5d126fabf6ee38378f7a7a1143a04f0d0` |
| Mobile `430 x 932` | `screenshots/v3-p0-mobile-430x932.png` | `36896393490f4c7b13810a02ed50fd3834ae5dc40b94ee08a0d830dde2bd49e3` |

## Desktop Observations

- Four-column production layout is present: navigation, content panel, canvas stage, and property panel.
- `导入` is the initial active tool.
- All seven production navigation items are visible.
- The complete top toolbar is visible without clipping.
- Empty canvas framing and upload copy are centered.
- Import and blush controls remain visible in the content panel.
- The property panel is visible and empty before a photo or layer is selected.

## Mobile Observations

- The fixed canvas stage stays above the seven-item navigation.
- Toolbar copy is compact: `返回`, `重做`, `清空`, `原图`, `前后对比`.
- The logo control remains inside the upper-left canvas area.
- All seven navigation items fit at both target widths.
- Import is the initial active tool and the blush controls appear below navigation.
- No visible control is cut off in the empty project state.
- The `390 x 844` and `430 x 932` layouts preserve the same content order.

## Browser Verification

- Browser: Codex in-app Chrome surface.
- Local URL: `http://127.0.0.1:4176/`.
- Application console entries after load: none.
- The browser integration emitted unrelated internal telemetry timeout messages during the first connection; these were not page console messages and did not recur in application logs.

## Not Yet Captured

- Edited-photo desktop and mobile states.
- Layer selection at every canvas edge.
- Open filter, sticker, text, mosaic, Polaroid, layer, and export panels.
- Mobile Safari browser chrome and safe-area behavior.
- Physical iPhone and Android screenshots.

Those states require a controlled photo fixture and are part of the next functional WebGL stage rather than this source-freezing P0.

