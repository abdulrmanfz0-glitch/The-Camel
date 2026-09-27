# Progress

## Current state (2026-09-27)
- v3 content is complete: 8 chapters, 38-organ atlas, organ↔disease map, symptom finder, sources, 2-minute tour, bilingual AR/EN.
- The old single `index.html` (~155K tokens) has been split into `css/app.css` plus 36 ES modules under `js/`, with no behavior change. Code moved by script from line ranges. The only edits are 7 setter calls, because imports are read-only, and two long SVG template strings split into concatenated parts that produce identical strings.
- Verified in headless Chromium against the pre-split page: identical boot, chapter nav, deep link `#health.mers`, language toggle, search and tour. The CDN was blocked in that sandbox, so this ran against a three.js stub.
- 2026-09-27, real rendering check: a desktop report said `?q=high` rendered black ground, a white sky and no camel after the split. It was checked with real three.js r170 (cloned from GitHub at tag `r170`, CDN request routed to the local copy by the test harness; `index.html` unchanged) in Chromium with SwiftShader WebGL. Pre-split `f6caadf` and the split `6a5a0fa` were rendered at hour 16.6 from the same pinned camera on `low`, `medium` and `high`, and the default tier (8 cores, DPR 2) was checked too. **The bug did not reproduce.** All tiers match the pre-split render: mean pixel difference 0.7 to 0.9 out of 255, all from animated dust. The console at every level shows only the expected 404 for `assets/camel/camel.json`.
- Static checks on the split found nothing broken. Code joined back in `js/app.js` order matches the old inline script except for the 7 setters. No module assigns to an imported binding. ESLint `no-undef` finds no missing imports. All fetch and texture paths are page-relative. Both versions run in strict mode. **No code changed.**

## Next steps
1. If the desktop `?q=high` problem still shows on the live site, first do a hard reload (cached files from before the split) and clear `camel-q` in localStorage. Then record the browser, GPU (`chrome://gpu`) and the full console at the Verbose level. SwiftShader can't show GPU- or driver-specific failures.
2. Hash changes after load (e.g. editing the URL hash) don't navigate. There is no `hashchange` listener. Decide whether that's wanted.
3. Optional: drop in a photographic GLB model (see `ASSETS_NEEDED.md`).
4. Keep sessions to one topic: grep, read one module, edit, verify, commit.
