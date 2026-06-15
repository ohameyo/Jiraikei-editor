# Jirai Editor V3 P1 - Dual Tone Pipeline

## Goal

Add an opt-in WebGL2 passthrough tone renderer with automatic CPU fallback, shared by preview and export, without changing the default production output.

## Phases

1. [complete] Review P0, the approved V3 design, and the production tone/render/export paths.
2. [complete] Create branch `codex/v3-p1-dual-tone-pipeline`.
3. [complete] Add failing tests for the request contract, eligibility, selection, fallback, and diagnostics.
4. [complete] Implement the WebGL2 passthrough renderer and resource lifecycle.
5. [complete] Connect the selector at the existing production tone boundary.
6. [complete] Verify CPU default, GPU opt-in, preview/export reuse, fallback, visuals, and browser console.
7. [complete] Update evidence, review the diff, and commit P1.

## Decisions

- GPU remains off by default in P1.
- GPU opt-in uses the internal `v3gpu=1` URL query or `jirai-v3-gpu=1` local storage flag.
- P1 GPU eligibility is limited to the exact original-filter state with no active blush, HSL, overlay, or protection effect.
- Any non-migrated effect uses the unchanged CPU renderer.
- WebGL2 initialization, shader, context, render, or output failure falls back to CPU in the same call.
- Preview and export already share `renderToneBaseCanvas()`, so the selector is integrated only at that boundary.
- No UI control is added for the internal switch.

## Errors Encountered

| Error | Attempt | Resolution |
| --- | --- | --- |
| The first browser passthrough appeared correct but diagnostics showed CPU fallback. | 1 | Activated the linked WebGL program before setting its sampler uniform, then strengthened the browser harness to require `selectedRenderer: gpu`. |
| The existing `4176` server stopped and the browser retained a cached page. | 1 | Started a fresh static server from the V3 directory and used the standalone browser harness as the authoritative GPU signal. |
