# V3 P4 Advanced Tone QA Baseline

Date: 2026-06-16
Branch: `codex/v3-p4-advanced-tone-qa`

## Completed

- Added grouped advanced tone QA samples for light, dark, black-white, black hair, skin tone, and lip risk areas.
- Added shared P4 QA scenarios:
  - Global HSL.
  - Split-color HSL.
  - Skin and lip HSL.
  - Skin whitening and blush.
  - Black protection and dark smoothing.
  - Combined preview/export parity.
- Added a browser QA matrix at `tests/browser/p4-advanced-tone-qa.html`.
- Confirmed every advanced scenario intentionally stays on CPU when GPU is requested, preserving correctness until shader parity exists.

## Verification

- `node --test tests/p0/*.test.mjs tests/p1/*.test.mjs tests/p2/*.test.mjs tests/p3/*.test.mjs tests/p4/*.test.mjs`
  - 33 tests passed.
- Browser QA: `http://127.0.0.1:4177/tests/browser/p4-advanced-tone-qa.html`
  - `passed: true`.
  - Sample coverage ok.
  - 6 advanced scenarios tested.
  - Preview and export dimensions verified.
  - All advanced scenarios selected CPU with `effects-not-migrated`.
  - No browser console errors.

## Not Yet Complete

- This is still synthetic sample QA, not a real-photo visual review.
- Advanced tone effects are still not migrated to WebGL shader parity.
- Physical mobile-device performance for the CPU advanced path is still unverified.

## Next Gap

P5 should use real imported photos or curated fixture images to visually compare:

- Light skin, medium skin, deep skin.
- Black hair and dark clothes.
- Red lips with strong desaturation.
- Heavy blush and whitening.
- Preview versus exported PNG.
