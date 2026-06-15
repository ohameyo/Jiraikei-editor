# Jirai Editor V3 P0 - Production Baseline

## Goal

Create an isolated V3 repository from the exact production deployment, freeze reproducible visual and functional baselines, and finish with one verified Git commit without changing product behavior.

## Phases

1. [complete] Identify the exact production deployment and source commit.
2. [complete] Create the isolated V3 repository and `codex/v3-p0-baseline` branch.
3. [complete] Add design, implementation plan, provenance, and baseline verification.
4. [complete] Capture desktop and mobile visual baselines from the isolated V3.
5. [complete] Record functional and performance baselines for editing and export paths.
6. [complete] Run final verification, review the diff, and commit P0.

## Decisions

- Production authority is `https://jirai.pages.dev`.
- The production HTML, JavaScript, and CSS match Git commit `1e5ab7220bf320e5943f3b86cb1c32025fcda660`.
- V3 is an independent repository at `/Users/meyo/Documents/New project/jirai-editor-v3-lab`.
- The production source remote is fetch-only; its push URL is disabled.
- P0 does not change rendering, interaction, UI, assets, or deployment.
- CPU rendering remains the behavioral reference for later WebGL phases.

## Errors Encountered

| Error | Attempt | Resolution |
| --- | --- | --- |
| `git switch --detach <hash>` reported an unreadable tree immediately after cloning | Switch by raw local hash | Switched through the cloned `origin/main` reference, which resolves to the same verified commit |
| `dooo0t.pages.dev` returned an unrelated Paper Dots application | Treated remembered domain as production | Queried Cloudflare Pages projects and identified `jirai.pages.dev` as the current production project |
| Final `127.0.0.1` HTTP check briefly failed while the browser-owned server was still bound | Checked the numeric loopback address after browser capture | Confirmed the listener and verified `http://localhost:4176/` returns HTTP 200 |
| Process listing was denied by the local sandbox | Used `ps` as an additional server check | Used `lsof` and the successful HTTP response instead |
| A background HTTP server could not start inside the default command sandbox | Started the server and request in one shell command | Re-ran the bounded local-only check with approved permissions and received HTTP 200 |
