# Progress

## Current state (2026-09-27)
- v3 content is complete: 8 chapters, 38-organ atlas, organ↔disease map, symptom finder, sources, 2-minute tour, bilingual AR/EN.
- The old single `index.html` (~155K tokens) has been split into `css/app.css` plus 36 ES modules under `js/`, with no behavior change. Code moved by script from line ranges. The only edits are 7 setter calls, because imports are read-only, and two long SVG template strings split into concatenated parts that produce identical strings.
- Verified in headless Chromium against the pre-split page: identical boot, chapter nav, deep link `#health.mers`, language toggle, search and tour. The CDN was blocked in that sandbox, so this ran against a three.js stub. **Not yet checked with real WebGL rendering.**

## Next steps
1. Open the GitHub Pages site with real three.js. Check the scene renders at `?q=low` and `?q=high` with zero console errors.
2. Hash changes after load (e.g. editing the URL hash) don't navigate. There is no `hashchange` listener. Decide whether that's wanted.
3. Optional: drop in a photographic GLB model (see `ASSETS_NEEDED.md`).
4. Keep sessions to one topic: grep, read one module, edit, verify, commit.
