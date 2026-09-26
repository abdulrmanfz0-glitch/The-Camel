# هندسة الناقة · The Engineering of the Camel

أطلس تفاعلي ثلاثي الأبعاد للناقة وحيدة السنام (*Camelus dromedarius*): التشريح، والحركة، والحرّ والبرد، ومراحل العمر، والصحة والأمراض، والوقاية والتطعيم. الناقة منحوتة بالرياضيات داخل المتصفح، تمشي وترهو وتبرك وتشرب، وتُفتح طبقةً طبقة.

An interactive 3D atlas of the dromedary: anatomy, movement, heat and cold, life stages, a health atlas, and prevention. The camel is sculpted in maths inside your browser; she walks, paces, couches, drinks, and opens up layer by layer.

## Run it

Open `index.html` in a modern browser with WebGL2. It is one self-contained file. three.js r170 loads as an ES module from jsDelivr (with an unpkg fallback) and the fonts come from Google Fonts. Nothing else is fetched.

Quality adapts to the device. Force a tier with `?q=low`, `?q=medium` or `?q=high`, and the language with `?lang=en`. Deep links work, for example `#anatomy.stomach` or `#health.mers`.

## Chapters

| | |
|---|---|
| **Welcome** | A calm first screen and a two-minute guided tour. |
| **Anatomy** | Skin and coat, muscles, organs (X-ray), a full skeleton that moves with the rig. Lengthwise and cross sections, an exploded view, a peel-away window, and labels that never collide. |
| **Movement** | Walk and pace (the two-beat lateral gait) with slow motion, colour-coded side pairs, a live footfall diagram, pads that spread under load and footprints in the sand. Couching and rising in the right order, drinking, and a sandstorm. |
| **Heat and cold** | A summer day and a winter night, water loss and hump reserve, a thermal camera, and an illustrative safe / caution / danger status. |
| **Life stages** | Newborn, juvenile, adult and old, each re-sculpted with its own proportions, with classical Arabic age names and how age is read from the teeth. |
| **Health atlas** | Fifteen important conditions: cause, spread, signs, diagnosis, prevention and what a vet typically does. Zoonotic flags with official public-health advice. No doses, and a vet referral on every card. |
| **Prevention** | A lifetime timeline, which vaccines exist and which do not, and care beyond vaccines. No invented schedules. |
| **Sources** | Every study and official source used, grouped by topic. |

Keyboard: `/` search · `1–8` chapters · `Space` play the day · `← →` time · `W` walk/pace/stand · `K` couch or rise · `D` drink · `S` sandstorm · `X` explode · `L` next layer · `P` hide panel · `T` tour · `Esc` close.

## How it is built

- The camel, her organs and her skeleton are signed-distance sculptures (about 130 blended primitives for the body) meshed with narrow-band surface nets in a Web Worker. The same pass bakes skin weights, coat colour and length, ambient occlusion, thickness, and morph targets for the hump, thirst and closed nostrils.
- Each life stage is a re-sculpt with its own proportions, not a scaled copy.
- A procedural rig solves the legs with IK from a lateral-sequence walk and a pace, and plays the couching sequence from keyframes.
- Rendering: physically based coat with fur shells, image-based light from a procedural sky, soft shadows, SSAO, bloom, depth of field in close-ups, heat shimmer and ACES tone mapping in a custom HDR pipeline.

## Accuracy

Numbers come from published studies, veterinary references and official bodies, listed in the Sources chapter. Where researchers disagree the page says so, and where a schedule could not be verified (vaccination), the page gives principles instead of dates. The health chapter is for awareness, not diagnosis: consult a licensed veterinarian.
