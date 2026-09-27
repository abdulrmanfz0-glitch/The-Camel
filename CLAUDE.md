# The Camel: notes for Claude

A 3D atlas of the dromedary: static site, no build step. GitHub Pages serves this branch under `/The-Camel/`, so **every path must be relative**.

## Fixed rules
- three.js **r170** from CDN (`index.html` import map, fallbacks in `js/main.js`). Never bundle it or change its version casually.
- No build step, no npm deps. Plain ES modules.
- **Every module imports shared names from `js/app.js`** (the hub). The hub re-exports all modules **in the original execution order**; that order matters, since top-level code runs in that sequence. New module → add it to `js/app.js` in the right place, export what others use.
- Imports are read-only: to reassign a shared `let` from another file, use its setter (`setLANG`, `setRenderer`, `setScene`, `setCamera`, `setPost`, `setSky`, `setRig`).
- Bilingual text: `L('عربي', 'English')` makes a pair and `tt(x)` picks the current language (`LANG`). Numbers go through `num()`, `pct()` and `digits()` (Arabic-Indic digits in `ar`). Arabic is the default and the page is RTL.
- The page is an **anatomy lab**: no hash opens `#anatomy` with the organs layer. `CHAPTERS` entries with `more: true` live in the "More" menu (`#moreMenu`, `moreMenu()` in `js/ui/core.js`); don't delete them.
- Research lives in `research/` (read-only for the build). Organ content comes from `js/data/organ-lab.js`, **generated** by `python3 tools/organ-data.py`; edit the research or the script's curation rules, never the output by hand. Research sources are `S01`–`S87` in `SOURCES` (group `res`) and can be used in any `src` list.
- Deep links: `#chapter` or `#chapter.topic`, e.g. `#health.mers`, `#anatomy.stomach`, `#anatomy.o-pancreas` (atlas organ = `o-` + id).
- Quality tiers `low | medium | high` (`TIERS` in `js/core.js`), forced with `?q=low`. Language is forced with `?lang=en`.
- Health content: no doses, no home protocols, a vet on every card.

## File map
- `index.html`: markup, import map, loads `css/app.css` and `js/main.js`.
- `css/app.css`: all styles.
- `js/main.js`: loads three.js (import map, then CDN fallbacks), then `app.js`. `js/three.js` holds `THREE`.
- `js/app.js`: hub, lists modules in execution order.
- `js/core.js`: math helpers, noise, `ENV`, quality tiers, `Q`.
- `js/state.js`: `LANG`, `num`/`pct`/`clock`, `STATE`, `BUS`, `L`, `tt`.
- `js/data/model.js`: `MODEL` physiology formulas, `SUN`.
- `js/data/ui-text.js`: `UI` strings, `CHAPTERS`, `HOME`.
- `js/data/anatomy.js` (`ANATOMY`), `chapters.js` (`MOVEMENT`, `CLIMATE`, `LIFE`), `health.js` (`HEALTH`, `PREVENT`), `sources.js` (`SOURCES`), `tour.js` (`TOUR`), `atlas.js` (`ATLAS` organs), `dis-map.js` (`DIS_MAP` disease→organs), `health-v3.js` (`HEALTH_V3`), `symptoms.js` (`SYMPTOMS`), `organ-lab.js` (generated: `ORGAN_LAB`, `FLOW_NODES`, `JOURNEYS`, `SOURCES_RES`), `merge-v3.js` (`SOURCES_V3`, the research sources, and merging v3/lab data into the v2 sets; sets `ATLAS.organs[id].lab`).
- `js/render/renderer.js`: shared `renderer`/`scene`/`camera`/`post`/`sky`/`rig` plus setters, sun shadows.
- `js/render/post.js`: `Post`, the HDR post pipeline. `sky.js`: `ATM`, sky shader, day palette, lens. `camera.js`: `Rig` orbit camera.
- `js/world/terrain.js`: `TEX` textures, terrain, footprints, sand material. `foliage.js`: acacia and shrubs. `props.js`: rocks, far land, trough, dust, motes. `world.js`: `WORLD` scene assembly and light.
- `js/camel/sdf-kernel.js`: SDF sculpt worker (`SDFKERNEL` is serialized into a Worker, so it must stay self-contained). `spec.js`: `camelSpec` shape and stages. `materials.js`: camel shaders and `CU` uniforms. `camel.js`: `Camel` mesh. `rig.js`: `CamelRig` gaits. `anatomy.js`: organ and skeleton specs, `ANAT`. `model3d.js`: optional GLB model (`ASSETS_NEEDED.md`).
- `js/ui/core.js`: `U` state, language, chapter nav `go()`, view framing, scene setters, `HL`. `panels.js`: panel rendering, organ cards, symptom finder. `topics.js`: topics and callout labels. `widgets.js`: day dock, gait diagram, insets, search, tour, keys.
- `js/boot.js`: `initUI`, keyboard `ACT`, `frame()` loop, `boot()`.

## Reading rules (keep context small)
- Don't read `assets/` or `docs/` (binary textures and screenshots).
- Only read `js/data/*` when editing content. Grep them for ids first.
- Grep for a name, then read only the file that defines it. No file is over ~12K tokens, but still read by line range.

## Run and verify
- `npx serve .` (or `npx http-server .`), open `http://localhost:3000/?q=low`.
- In the sandbox the CDN is blocked: clone three.js at tag `r170` (sparse `build/`) and route the CDN URL to it in Playwright.
- Check: zero console errors (a 404 for `assets/camel/camel.json` is expected, since the model is optional), the page opens on the lab with organs, an organ card opens and its connected chips fly, the More menu works, `#health.mers` opens MERS, the language toggle works.
- Take at most one screenshot per session.
