# Jirai Editor V3 P2 Basic Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate seven global tone controls to WebGL2 with shader-only transient slider previews and one preview/export implementation.

**Architecture:** Normalize migrated filter values in a focused module, expand the existing fragment shader and renderer uniforms, widen selector eligibility only for those values, then replace the migrated controls' CSS approximation with a requestAnimationFrame-driven transient render. The existing CPU path remains unchanged and handles every unsupported state.

**Tech Stack:** Native JavaScript ES modules, Canvas 2D, WebGL2, GLSL ES 3.00, Node.js test runner, in-app Chrome.

---

### Task 1: Filter Contract And Eligibility

**Files:**
- Create: `src/tone/basicToneParameters.js`
- Create: `tests/p2/basicToneParameters.test.mjs`
- Modify: `src/tone/toneRequest.js`
- Modify: `tests/p1/toneRequest.test.mjs`

- [x] Write failing tests for every migrated control at minimum, default, and maximum.
- [x] Write failing tests that migrated values are GPU eligible while portrait, HSL, and black protection remain CPU-only.
- [x] Run `node --test tests/p2/basicToneParameters.test.mjs tests/p1/toneRequest.test.mjs` and confirm failures are caused by the missing P2 contract.
- [x] Implement normalization, hexadecimal overlay parsing, and widened eligibility.
- [x] Re-run the focused tests and confirm they pass.

### Task 2: Shader And Uniform Migration

**Files:**
- Modify: `src/tone/shaders.js`
- Modify: `src/tone/WebGLToneRenderer.js`
- Create: `tests/p2/webglBasicFilters.test.mjs`

- [x] Write failing shader contract tests for all migrated uniforms and production operation order.
- [x] Add uniform location caching and update values on every render without rebuilding the program.
- [x] Implement production-equivalent basic, temperature, tint, fade, and overlay formulas.
- [x] Run P1 and P2 renderer tests and confirm they pass.

### Task 3: Shader-Only Slider Preview

**Files:**
- Modify: `src/app.js`
- Create: `tests/p2/productionIntegration.test.mjs`

- [x] Write failing source-contract tests requiring migrated slider previews to use a transient GPU render and bypass CSS filters.
- [x] Add a migrated-control predicate and one requestAnimationFrame transient preview queue.
- [x] Render a cloned state containing `sliderPreviewFilters` without committing store history.
- [x] Keep HSL and portrait slider behavior unchanged.
- [x] Confirm pointer release still commits exactly once and preview/export still call `toneRuntime.render()` at one boundary.

### Task 4: Browser Pixel Matrix

**Files:**
- Create: `tests/browser/p2-basic-filters.html`
- Create: `tests/browser/p2-basic-filters.js`
- Create: `docs/baseline/p2-basic-filters.md`

- [x] Build a deterministic opaque and transparent color fixture.
- [x] Implement an independent CPU reference for the seven migrated formulas.
- [x] Compare GPU output at minimum, default, and maximum for each control.
- [x] Compare preview-size and export-size results for one combined filter state.
- [x] Record maximum and mean channel differences plus renderer diagnostics.

### Task 5: Regression And Commit

**Files:**
- Update P2 planning records.

- [x] Run all P0, P1, and P2 Node tests.
- [x] Run JavaScript syntax checks and `git diff --check`.
- [x] Run browser pixel verification and inspect browser console.
- [x] Verify default URL still selects CPU.
- [x] Review the staged diff and commit one complete P2 stage.
