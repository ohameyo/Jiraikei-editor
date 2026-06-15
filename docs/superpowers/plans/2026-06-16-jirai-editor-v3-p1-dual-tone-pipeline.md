# Jirai Editor V3 P1 Dual Tone Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in WebGL2 original-image passthrough with automatic CPU fallback at the production preview/export tone boundary.

**Architecture:** Keep the existing CPU function untouched. Add focused ES modules for request normalization, feature-switch policy, renderer selection, diagnostics, and WebGL2 resource management, then call the selector from `renderToneBaseCanvas()`.

**Tech Stack:** Native JavaScript ES modules, Canvas 2D, WebGL2, GLSL ES 3.00, Node.js test runner, Chrome.

---

### Task 1: Tone Request And Eligibility

**Files:**
- Create: `src/tone/toneRequest.js`
- Create: `tests/p1/toneRequest.test.mjs`

- [x] Write failing tests for normalized requests and original-filter eligibility.
- [x] Run the focused test and confirm the module is missing.
- [x] Implement the minimal request and eligibility functions.
- [x] Run the focused test and confirm it passes.

### Task 2: Selector And Diagnostics

**Files:**
- Create: `src/tone/ToneRendererSelector.js`
- Create: `src/tone/toneFeatureSwitch.js`
- Create: `tests/p1/toneRendererSelector.test.mjs`

- [x] Write failing tests for disabled, ineligible, unsupported, failed, and successful GPU paths.
- [x] Implement selection, fallback, counters, and internal switch parsing.
- [x] Confirm every failure calls CPU exactly once.

### Task 3: WebGL2 Passthrough Renderer

**Files:**
- Create: `src/tone/WebGLToneRenderer.js`
- Create: `src/tone/shaders.js`
- Create: `tests/p1/webglToneRenderer.test.mjs`
- Create: `tests/browser/p1-tone-passthrough.html`
- Create: `tests/browser/p1-tone-passthrough.js`

- [x] Test shader contracts, lifecycle, and unsupported-context checks.
- [x] Implement a reusable canvas, program, texture, vertex array, and source upload.
- [x] Draw the WebGL result back into the requested Canvas 2D context.
- [x] Verify exact fixture pixels in Chrome.

### Task 4: Production Integration

**Files:**
- Modify: `index.html`
- Modify: `src/app.js`
- Create: `src/tone/index.js`
- Create: `tests/p1/productionIntegration.test.mjs`

- [x] Write a failing source contract test for the selector call.
- [x] Load the production app as an ES module.
- [x] Replace the direct CPU call with the selector while preserving the existing outer fallback.
- [x] Expose read-only diagnostics.

### Task 5: Browser And Regression Verification

**Files:**
- Update P1 planning records.

- [x] Verify CPU remains the default through selection tests.
- [x] Verify GPU opt-in original-preset rendering in the browser harness.
- [x] Verify an adjusted filter reports `effects-not-migrated` and uses CPU.
- [x] Verify a forced WebGL failure reports a GPU error and uses CPU.
- [x] Run P0 and P1 tests, syntax checks, and browser pixel comparison.
- [x] Review and commit P1.
