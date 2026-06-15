# V3 P0 Functional Inventory

Date: 2026-06-16

## Product Surfaces

| Area | Current production behavior | P0 verification |
| --- | --- | --- |
| Import | File input in the desktop content panel and upload target on the canvas | Controls present |
| Filters | Presets plus detailed filter parameters | Entry and parameter container present |
| Blush | Automatic placement, manual region editing, preview, reset, and an extra pair | Four controls present |
| Mosaic | Frosted, grid, circular, and heart variants | Four entry controls present |
| Stickers | Multiple sticker packs with canvas layers | Material container present |
| Polaroid | Portrait and landscape frames with photo adjustment | Material container present |
| Text | Text layer creation, presets, fonts, color, stroke, background, and shadow | Entry and preset container present |
| Layers | Selection, visibility, ordering, deletion, and property editing | Overlay, property, and list containers present |
| History | Undo and redo | Toolbar controls present |
| Compare | Press-and-hold original comparison with click fallback | Toolbar control and event path present |
| Export | Preview modal and PNG save paths | Export entry and application path present |

## Shared Rendering Flow

```text
Image upload
  -> editor state
  -> base image canvas
  -> CPU tone pipeline
  -> blush and protection passes
  -> mosaic, sticker, text, and Polaroid composition
  -> visible Canvas 2D preview
```

Export runs a separate high-resolution render through the same broad product rules, followed by PNG encoding and several compatibility fallbacks.

## Direct Manipulation

- The visible bitmap is drawn on `#editorCanvas`.
- Selection controls are placed in the DOM-based `#overlayLayer`.
- Pointer events cover movement and control handles.
- `requestAnimationFrame` is already used to merge some slider, preview, interaction, and render updates.
- Existing overlay logic is the starting point for the later “CSS preview during movement, one state commit on release” optimization.

## Source Boundaries

- `index.html`: product structure and control inventory.
- `styles.css`: desktop/mobile layout and interaction visuals.
- `src/app.js`: state, tone processing, Canvas rendering, layers, gestures, history, and export.
- `src/vision-skill.js`: portrait detection and blush assistance.
- `src/main.js`: auxiliary application behavior.
- `functions/analytics.js`: Cloudflare analytics endpoint.

## Automated P0 Coverage

- Production hashes.
- Seven navigation items.
- Canvas and overlay surfaces.
- Desktop and canvas upload controls.
- Property and layer containers.
- Compare and export entry paths.
- JavaScript syntax.
- Empty-state desktop and mobile rendering.

## Manual Coverage Required Later

- Real photo import and EXIF rotation.
- Filter output at minimum, default, typical, and maximum parameters.
- Manual blush movement and resizing.
- Single-pointer layer movement.
- Two-pointer scale and rotation.
- Selection frame and control buttons at all canvas edges.
- Preview/export pixel consistency.
- Repeated replacement, undo/redo, comparison, and export.

