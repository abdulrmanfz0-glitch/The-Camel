# هندسة الناقة · The Engineering of the Camel

مختبر تفاعلي ثلاثي الأبعاد يشرح كيف صُمّم جسد الناقة وحيدة السنام (*Camelus dromedarius*) للصحراء. لا تقرأ عن الناقة، بل تشغّلها: حرّك الشمس عبر يوم صيفي، اسقِها، أطلق عليها عاصفة رملية، وافتح جسدها طبقةً طبقة.

An interactive 3D explorable of how the dromedary’s body is built for the desert. Drag the sun through a summer day and watch her body temperature climb instead of sweating water away, give her a drink, send in a sandstorm, and open her up layer by layer.

## Run it

Open `index.html` in a modern browser. It is one self-contained file: three.js r128 loads from cdnjs (with a jsDelivr fallback) and the fonts come from Google Fonts. Nothing else is fetched.

## What you can do

| | |
|---|---|
| **Timeline** | Drag the sun (or the chart) through the day. Sky, light, shadows, air and body temperature follow. |
| **Water lost** | Dehydrate her, as % of body weight. Her daily temperature swing widens from ~2 °C to over 6 °C. |
| **Hump reserve** | The hump is fat, not water: empty it and it shrinks and flops to one side. |
| **Drink** | About 100 L in ~10 minutes (sped up), with a magnifier on her oval red cells. |
| **Sandstorm** | Nostrils seal, lashes interlock, the third eyelid sweeps the eye. |
| **Layers** | Skin · Heat (thermal view) · Organs (X-ray, explodable) · Skeleton. |
| **Hotspots** | Hump, eye, nose, lip, blood, stomach, kidneys, foot, chest and knee pads. |

Keyboard: `Space` play · `← →` time · `1–4` layers · `L` next layer · `X` explode · `D` drink · `S` sandstorm · `R` reset camera · `H` how it works · `/` hide the interface · `Esc` close.

## The science

The live numbers come from a simplified model built on published measurements. Every claim on the page is listed with its sources in the “How it works” panel; the main ones are:

- Schmidt-Nielsen et al. (1956) *Water balance of the camel*, and (1957) *Body temperature of the camel and its relation to water economy*, American Journal of Physiology.
- Schmidt-Nielsen, Schroter & Shkolnik (1981) *Desaturation of exhaled air in camels*, Proceedings of the Royal Society B.
- Perk (1966) *Osmotic hemolysis of the camel’s erythrocytes*, Journal of Experimental Zoology.
- Fowler (2008) *Camelids are not ruminants*.

The camel, dunes, acacia and anatomy are built procedurally from maths (lofted sections, lathes and tubes). There are no model files. The anatomy is a simplified sculpture, not a clinical model.
