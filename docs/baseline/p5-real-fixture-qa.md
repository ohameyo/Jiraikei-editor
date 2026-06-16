# V3 P5 Real Fixture QA Baseline

Date: 2026-06-16
Branch: `codex/v3-p5-real-fixture-qa`

## Completed

- Added curated photo-like fixtures for:
  - Fair skin with black hair.
  - Medium skin with dark clothes.
  - Deep skin with red lips.
- Added P5 visual QA scenarios for:
  - Skin and lip HSL.
  - Whitening and heavy blush.
  - Black hair and dark clothes protection.
  - Combined preview/export parity.
- Added a bounded app QA hook: `window.__JIRAI_V3_QA__`.
- Added `?v3p5qa=1` app mode that loads fixtures into the real editor, applies advanced filters, activates the HSL panel, and exports a PNG data URL.
- Added browser entry: `tests/browser/p5-real-fixture-qa.html`.

## Verification

- `node --test tests/p0/*.test.mjs tests/p1/*.test.mjs tests/p2/*.test.mjs tests/p3/*.test.mjs tests/p4/*.test.mjs tests/p5/*.test.mjs`
  - 38 tests passed.
- Browser QA on current branch:
  - URL: `http://127.0.0.1:4179/tests/browser/p5-real-fixture-qa.html`
  - Redirected to `http://127.0.0.1:4179/index.html?v3gpu=1&v3p5qa=1`.
  - `passed: true`.
  - 3 fixtures, 4 scenarios, 10 fixture-scenario cases.
  - Each case loaded an image, activated `filters` and `HSL`, exposed 11 HSL channels, selected CPU, and reported `effects-not-migrated`.
  - Preview and export PNG data URLs matched for every case.
  - No browser console errors.

## Not Yet Complete

- The fixtures are curated generated test images, not actual user photos.
- Physical iPhone/Android performance is still unverified.
- Advanced tone effects still intentionally run on CPU until shader parity exists.

## Next Gap

P6 should either:

- import a small real-photo fixture set, if available locally and safe to commit, or
- begin a narrow shader migration spike for non-face-dependent HSL while keeping P5 as the regression gate.
