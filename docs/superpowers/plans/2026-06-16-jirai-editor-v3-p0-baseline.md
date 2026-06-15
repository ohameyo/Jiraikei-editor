# Jirai Editor V3 P0 Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Freeze the exact production editor as an isolated and reproducible V3 baseline without changing product behavior.

**Architecture:** Keep the production static HTML, CSS, JavaScript, Canvas 2D rendering, and assets untouched. Add a small Node.js verification layer, provenance metadata, visual captures, and baseline documentation around the existing application.

**Tech Stack:** HTML, CSS, native JavaScript, Canvas 2D, Node.js built-in test runner, Chrome, Cloudflare Pages.

---

### Task 1: Production Provenance

**Files:**
- Create: `docs/baseline/production-source.json`
- Create: `tests/p0/production-source.test.mjs`

- [ ] Write a failing test that requires the production URL, commit, and primary file hashes.
- [ ] Run `node --test tests/p0/production-source.test.mjs` and confirm the manifest is missing.
- [ ] Add the exact production metadata and hashes.
- [ ] Run the focused test and confirm it passes.

### Task 2: Static Application Verification

**Files:**
- Create: `scripts/verify-p0.mjs`
- Create: `tests/p0/application-contract.test.mjs`

- [ ] Write failing tests for required navigation, upload, canvas, overlay, property, comparison, and export controls.
- [ ] Run the focused tests and confirm the verifier is missing.
- [ ] Implement a dependency-free source verifier.
- [ ] Run the tests and JavaScript syntax checks.

### Task 3: Visual Baseline

**Files:**
- Create: `docs/baseline/screenshots/v3-p0-desktop-1440x900.png`
- Create: `docs/baseline/screenshots/v3-p0-mobile-390x844.png`
- Create: `docs/baseline/screenshots/v3-p0-mobile-430x932.png`
- Create: `docs/baseline/visual-baseline.md`

- [ ] Start a local static server without changing application files.
- [ ] Capture the exact baseline viewports.
- [ ] Check browser console output and visible control clipping.
- [ ] Record visual observations and known production behavior.

### Task 4: Functional And Performance Inventory

**Files:**
- Create: `docs/baseline/functional-inventory.md`
- Create: `docs/baseline/performance-baseline.md`

- [ ] Map the current import, filter, blush, mosaic, sticker, Polaroid, text, layer, history, comparison, and export paths.
- [ ] Record the current CPU pixel-processing and Canvas redraw boundaries.
- [ ] Define repeatable timing and memory measurements for later CPU/GPU comparison.
- [ ] Mark checks that require real photos or physical phones.

### Task 5: Final Verification And Commit

**Files:**
- Update: `.planning/2026-06-16-v3-p0-baseline/task_plan.md`
- Update: `.planning/2026-06-16-v3-p0-baseline/findings.md`
- Update: `.planning/2026-06-16-v3-p0-baseline/progress.md`

- [ ] Run `node --test tests/p0/*.test.mjs`.
- [ ] Run `node scripts/verify-p0.mjs`.
- [ ] Run `node --check src/app.js`.
- [ ] Confirm `git diff --name-only 1e5ab72` does not include existing production behavior files.
- [ ] Review screenshots and repository status.
- [ ] Commit the complete P0 stage.

