# Assets needed — a real camel model

v3 was built in an environment whose network policy blocked Sketchfab, the Smithsonian 3D site, Poly Haven,
ambientCG and Wikimedia Commons, so no photographic model could be downloaded. The page therefore ships:

* **Textures:** nothing more is needed. The sand, gravel, silt-crust, rock and bark textures in `assets/tex/` are
  photographs from [Babylon.js Assets](https://github.com/BabylonJS/Assets) (CC BY 4.0), re-encoded to WebP
  (a 1024 px set for computers, a 512 px `_lo` set for phones). They are credited in the Sources chapter.
* **The camel:** the procedural, SDF-sculpted camel (pushed further in v3: bony knees, tendon grooves, ribs, neck
  folds, cracked calluses, coat zones). It stays the fallback forever, and it keeps driving the anatomy layers.

The code is already wired to load a real model from `assets/camel/`. Download **one** of the models below, put it
there, and write the small `camel.json` next to it. Nothing else has to change.

## 1. Download one model (check the licence on the page before you download)

The licences below are what the Sketchfab listings reported when this file was written; Sketchfab lets authors
change them, so confirm "CC Attribution" (or CC0) on the page itself. Do not use a "Standard/Editorial" or
"NonCommercial" model.

| # | Model | Author | Licence (per listing) | Notes | Page |
|---|---|---|---|---|---|
| A (first choice) | Camel | eb78 (@E.A.Cornell) | CC BY 4.0 | dromedary, animated, made in Blender (Sept 2024) | https://sketchfab.com/3d-models/camel-99af7daa5baf450ea7b809937937e6d5 |
| B | Camel | local.yany | CC BY 4.0 | tagged dromedary / arabian (July 2024) | https://sketchfab.com/3d-models/camel-4431e22e592c4cf1a126c11c3771a811 |
| C | Camel (Download the original glb) | kenchoo (after yankobe) | CC BY 4.0 | ships the original GLB | https://sketchfab.com/3d-models/camel-download-the-original-glb-05a0854fb54d4e34a100016545cc69e5 |

On the model page choose **Download 3D Model → glTF → "glb"** (the auto-converted glb is fine).

Optional, not wired yet: the museum scan of a real dromedary skeleton — Natural History Museum, University of
Pisa, specimen C 2832 (structured-light scan) — https://sketchfab.com/3d-models/dromedary-3c74cf294cf04a53b23a2c78a41df762
(also on Wikimedia Commons as `Camelus_dromedarius_3d_scan_Natural_History_Museum_University_of_Pisa_C_2832.stl`).
Check its licence on the page before any use.

## 2. Compress it (recommended)

Downloaded models are often 20–100 MB. Shrink geometry with meshopt and textures to WebP — the page loads the
meshopt decoder from the same three.js release, so no extra setup is needed. Draco and KTX2 are *not* wired.

```bash
npx @gltf-transform/cli optimize camel_download.glb camel.glb \
  --compress meshopt --texture-compress webp --texture-size 2048
# a lighter copy for phones (optional)
npx @gltf-transform/cli optimize camel_download.glb camel_lo.glb \
  --compress meshopt --texture-compress webp --texture-size 1024 --simplify-ratio 0.5
```

Aim for ≤ 8 MB for `camel.glb` and ≤ 3 MB for `camel_lo.glb`.

## 3. Put the files here

```
assets/
  camel/
    camel.glb        ← required
    camel_lo.glb     ← optional, used on phones and the "low" quality tier
    camel.json       ← required (below)
```

## 4. `assets/camel/camel.json`

```json
{
  "file": "camel.glb",
  "fileLow": "camel_lo.glb",
  "title": "Camel",
  "author": "eb78 (@E.A.Cornell)",
  "license": "CC BY 4.0",
  "url": "https://sketchfab.com/3d-models/camel-99af7daa5baf450ea7b809937937e6d5",
  "forward": "+Z",
  "up": "+Y",
  "yawDeg": 0,
  "scale": "auto",
  "offset": [0, 0, 0],
  "boneMap": null
}
```

* `forward` / `up`: the model's own axes (`+X`, `-X`, `+Y`, `-Y`, `+Z`, `-Z`). Most Sketchfab glTF exports face
  `+Z` with `+Y` up. If the camel appears sideways or backwards, change `forward` (or add `yawDeg`).
* `scale: "auto"` makes the top of the hump match the rig (≈ 2.1 m); a number forces a scale factor.
* `offset`: metres, in the camel's frame (+X forward, +Y up, +Z her left), if the model sits off the rig.
* `title`, `author`, `license`, `url` are shown automatically in the Sources chapter (CC BY requires credit).
* `boneMap` (optional): if the model is rigged, map the page's bones to the model's bone names so the model moves
  with the rig (walk, pace, couching, drinking, sandstorm). Our bones:
  `root, pelvis, chest, hump, neck0…neck3, head, jaw, lip, earL, earR, tail0…tail2,
  scapL/R, humL/R, radL/R, mcL/R, pasL/R, toeL/R, femL/R, tibL/R, mtL/R, hpasL/R, htoeL/R`.
  Example: `{ "pelvis": "Hips", "chest": "Spine2", "neck0": "Neck1", "head": "Head", "radL": "ForeArm.L", … }`.
  With no map, common rig names are guessed; if fewer than six bones match — or the model has no skeleton — the
  page skins the model to its own rig automatically, using the sculpt's primitives to weight each vertex.

## 5. Check

Open the page. The console prints a warning if the model could not be loaded, and the procedural camel stays.
With the model loaded it replaces the "Skin & coat" layer; the muscle, organ, skeleton and thermal layers keep the
procedural body, which is aligned to the same rig. For the published artifact the three files must be uploaded
with the page (same relative paths).
