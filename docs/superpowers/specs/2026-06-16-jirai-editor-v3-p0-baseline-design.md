# Jirai Editor V3 P0 Baseline Design

Date: 2026-06-16

## Goal

Establish V3 as an isolated, reproducible copy of the exact production editor before any WebGL migration begins.

## Source Of Truth

The production application at `https://jirai.pages.dev` is the product, visual, and behavioral authority. Its deployed entry, application script, and stylesheet match Git commit `1e5ab7220bf320e5943f3b86cb1c32025fcda660`.

V3 starts from that commit. Local uncommitted changes in the production repository are excluded.

## Repository Isolation

V3 lives in its own Git repository and branch:

- Directory: `/Users/meyo/Documents/New project/jirai-editor-v3-lab`
- Branch: `codex/v3-p0-baseline`
- Source remote: fetch-only `production-source`

The production source remote has no usable push URL. P0 is not deployed.

## P0 Scope

P0 adds only:

- Production provenance and file hashes.
- Repeatable source-integrity checks.
- Desktop and mobile baseline screenshots.
- A functional inventory for import, filters, blush, mosaic, stickers, Polaroid, text, layers, history, comparison, and export.
- A performance measurement procedure for slider input, layer movement, rendering, memory, and export.
- Planning and verification records.

P0 does not change application behavior, rendering output, UI, or assets.

## Baseline Viewports

- Desktop Chrome: `1440 x 900`.
- Mobile portrait: `390 x 844`.
- Mobile wide portrait: `430 x 932`.

The baseline captures cover the empty import screen and one representative edited image state where automation is practical.

## Verification

P0 is accepted when:

1. V3 source hashes match the production deployment for the three primary files.
2. JavaScript syntax checks pass.
3. A local static server loads the app without console errors at desktop and mobile viewports.
4. Production navigation, upload controls, canvas, property panel, and mobile layout are present.
5. Baseline screenshots and the functional/performance inventory are stored in the repository.
6. The final diff contains no modifications to existing production behavior files.
7. One Git commit records the complete P0 stage.

## Deferred

- WebGL renderer interfaces and fallback selection.
- Shader implementation.
- CPU/GPU pixel comparison.
- Touch interaction rewrites.
- V3 Lab deployment.

