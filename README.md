# هندسة الناقة · The Engineering of the Camel

أطلس تفاعلي ثلاثي الأبعاد للناقة وحيدة السنام (*Camelus dromedarius*): التشريح وأطلس الأعضاء، والحركة، والحرّ والبرد، ومراحل العمر، والصحة والأمراض، والوقاية والتطعيم. الناقة منحوتة بالرياضيات داخل المتصفح، في صحراء نجد تحت شمس الرياض الحقيقية، تمشي وترهو وتبرك وتشرب، وتُفتح طبقةً طبقة.

An interactive 3D atlas of the dromedary: anatomy and a full organ atlas, movement, heat and cold, life stages, a health atlas linked organ by organ, and prevention. The camel is sculpted in maths inside your browser and stands in a Najd desert under the real sun of Riyadh; she walks, paces, couches, drinks, and opens up layer by layer.

## Run it

Serve the folder (for example `npx serve .`) and open `index.html` in a browser with WebGL2. The page is `index.html` plus plain ES modules in `js/` (no build step), `css/app.css`, and the photographic textures in `assets/tex/`. three.js r170 loads as an ES module from jsDelivr (with an unpkg fallback) and the fonts come from Google Fonts. Opened straight from disk the textures cannot load; the page then falls back to procedural detail.

Quality adapts to the device. Force a tier with `?q=low`, `?q=medium` or `?q=high`, and the language with `?lang=en`. Deep links work, for example `#anatomy.stomach`, `#anatomy.o-pancreas` (an atlas organ) or `#health.hydatid`.

A real, photographic camel model can be dropped in without touching the code: see [ASSETS_NEEDED.md](ASSETS_NEEDED.md).

## Chapters

| | |
|---|---|
| **Anatomy lab** (opens first) | The page's heart. Organs showing inside the body; tap one or pick it from the atlas. Each card: what it does, how it works step by step, what is special in the camel, more from the research (where it sits, size and shape), connected organs you can fly to, the diseases that affect it, and sources, with a badge on medium-confidence content. Movement, heat and cold, life stages, prevention and the welcome screen are in the **More** menu. |
| **Anatomy** | Skin and coat, muscles, organs (X-ray), a full skeleton that moves with the rig. Sections, an exploded view, a peel-away window. **Organ atlas:** 38 organs in ten systems — respiratory, circulation and blood, digestive, urinary, reproductive (female/male switch), nerves and senses, glands, lymph nodes, skeleton-muscle-skin, fat — each with a camera fly-to, what it does, what is peculiar in the camel, and the diseases that affect it. Tap an organ to open its card. |
| **Movement** | Walk and pace with slow motion, colour-coded side pairs, a live footfall diagram, pads that spread under load and footprints that keep their shape. Couching and rising, drinking, and a sandstorm. |
| **Heat and cold** | A summer day and a winter night, water loss and hump reserve, a thermal camera, and an illustrative safe / caution / danger status. |
| **Life stages** | Newborn, juvenile, adult and old, each re-sculpted, with classical Arabic age names and age from the teeth. |
| **Health atlas** | Twenty-one conditions (v3 adds ringworm, nasal bot, hydatid cysts, caseous lymphadenitis, enterotoxaemia and plastic/sand impaction). Each card names the organs involved and shows them on the body — inflamed tissue, pox, mange and ringworm patches, cysts, abscessed nodes, a plastic mass in C1 — never gory. A **symptom finder** lists the conditions that share the signs you see, with a firm reminder that only a vet can diagnose. No doses, no home protocols, a vet referral on every card, official public-health advice on zoonoses. |
| **Prevention** | A lifetime timeline, which vaccines exist and which do not, and care beyond vaccines. No invented schedules. |
| **Sources** | Every study, official source, texture and model credit, grouped by topic. |

Keyboard: `/` search · `1–8` chapters · `Space` play the day · `← →` time · `W` walk/pace/stand · `K` couch or rise · `D` drink · `S` sandstorm · `X` explode · `L` next layer · `P` hide panel · `T` tour · `Esc` close.

## How it is built

- **The camel**, her organs and her skeleton are signed-distance sculptures meshed with narrow-band surface nets in a Web Worker, which also bakes skin weights, coat colour and length, ambient occlusion, thickness and morph targets (hump, thirst, closed nostrils, male body). v3 re-sculpted the body — a narrow deep chest, a hump that rises behind visible withers, lean legs with flat bony carpal joints, tendon grooves, cushioned two-toed feet, a longer face — and draws fine anatomy in the shader: ribs under the flank, loose skin folds on the neck, creases at the knees, cracked grey calluses, coat zones (paler belly, darker hump, dusty lower legs) and moist lips.
- **Light** comes from one atmosphere model: the Preetham daylight sky (as in the three.js Sky example) for the sky's shape and colour, with sun and sky energy from Rayleigh and desert-dust optical depths and air mass, the sun placed for Riyadh (24.7° N) on the solstice of the chosen season. The same numbers drive the sun, the image-based light, aerial perspective, auto-exposure and a scotopic night — no per-hour colour grade.
- **Rendering**: AgX tone mapping, sun shadows with physical penumbrae (PCSS), a second sun-aligned shadow map for the trees, shrubs, rocks and dunes, contact occlusion under the pads and barrel, SSAO, a lens that changes with distance (≈35 mm wide, 50 mm for the animal, ≈100 mm close-ups) with matching depth of field, heat shimmer and dust in the light.
- **The desert**: photographic sand grain, gravel, silt crust, rock and bark textures ([Babylon.js Assets](https://github.com/BabylonJS/Assets), CC BY 4.0), procedural wind ripples, acacias with layered branches and alpha leaf cards, arfaj and thumam tussocks, varnished rocks, sandstone outcrops and a far escarpment.

## Accuracy

Numbers come from published studies, veterinary references and official bodies, listed in the Sources chapter. Where researchers disagree the page says so, and where a schedule could not be verified (vaccination), the page gives principles instead of dates. The health chapter and the symptom finder are for awareness, not diagnosis: consult a licensed veterinarian.
