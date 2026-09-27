# AUDIT — round 2 fact-check of the project's anatomy and health content

Scope: the organ cards in `js/data/atlas.js` (39 organs, 10 systems, male/female toggle) and the
eleven long topics in `js/data/anatomy.js` (chapter 2, "Anatomy"). Part D covers the 21 disease
cards in `js/data/health.js` + `js/data/health-v3.js` at a lighter level, as instructed.

Nothing outside `research/` was modified. The project files were read for content only.

Verdict key:

* **verified** — at least one source reached in this round states it for dromedaries (or for camelids
  where the card says so), and a second source or a high-authority source agrees.
* **partially correct** — part of the claim holds, part does not, or the claim is right but the source
  reached is weaker than the project's `src` tag implies.
* **incorrect** — the sources reached contradict the claim.
* **unsupported** — no source reached in this round supports it. This is *not* a statement that the
  claim is false; it means the build team should either cite a source or soften/remove the claim.

Evidence is given as `S`-ids from `research/SOURCES.md`. Where a claim rests on a project source key
(`sn56`, `haem`, `cla`, `plastic`, `legs`, …) that was not re-opened this round, it is written as
`project src <key> (not re-verified)`. Numbers are the priority throughout.

---

## Summary

| verdict | organ-card claims | anatomy-topic claims | total |
|---|---|---|---|
| verified | 37 | 8 | 45 |
| partially correct | 15 | 3 | 18 |
| incorrect | 2 | 0 | 2 |
| unsupported | 10 | 0 | 10 |
| **total claims checked** | **64** | **11** | **75** |

*Updated in round 3: the two lung rows (organ card and anatomy topic) moved from **unsupported** to
**verified** and the heart organ row from **unsupported** to **partially correct**, after the project's
`lungUS` source (S108) was read in full in round 3. The remaining unsupported rows are listed in
`NOTES.md` §round-3 gaps.*

The two outright errors are the **shape of the spleen** ("sickle-shaped") and the **liver as the second
commonest site of hydatid cysts**. Both have a suggested correction below. The largest cluster of
unsupported items is a set of descriptive details that carry no number and no camel source: the lung
surface, the eyelashes/third eyelid, the hair-lined ear, the callus pads, the "9 cm" lymph node, the
"50 %" shorn-camel figure, and the exact thoracic/lumbar/sacral/tail vertebral counts.

Two structural findings, not claims:

1. `physiology.json` → `nasal_passages.connected_organs` lists `environment`. `environment` is the
   pseudo-node for "outside the body", not an organ; every other `connected_organs` list holds organ ids
   only. Recorded here rather than changed (round 1 entries are not to be rewritten).
2. The atlas `src` tags (`sn56`, `fowler`, `kidney`, …) are the project's own keys in `js/data/sources.js`,
   not the research S-numbers. Several atlas claims tagged with a key do not actually appear in the
   matching key's text (for example `coat` → "Seasonal hair follicle cycle", but the shorn-camel figure
   comes from `sn56`). Where this happens it is flagged in the rows below.

---

## Part C.1 — atlas organ cards (`js/data/atlas.js`)

| organ (id) | claim as written (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| nose | Nostrils are slits that muscles close when sand blows | partially correct | No camel source reached in round 2 states nostril closure; S16/S17 document narrow nasal meatuses and conchal sinuses only | Keep, but cite an anatomy source (S16/S17 or a camel anatomy chapter). AR: «المنخران شقّان يضيقهما الجمل عند هبوب الرمل (يحتاج مصدرًا تشريحيًّا)». |
| nose | Rolled turbinates reclaim about 60 % of breathing water (Schmidt-Nielsen 1981) | verified | S21 (S20, S22 corroborate) | none |
| larynx | Sits high in the throat under the jaw; voice comes from here and the throat | verified | S17, S49 | none |
| larynx | Nasal bot larvae attach at the pharynx of infested camels | verified | S87 — *Cephalopina titillator* larvae cause nasopharyngeal myiasis in camels | none; add S87 (or the project's `nasalBot` key) to the card |
| trachea | Camels lose little water by breathing; they breathe slowly at rest and rely on sweating and daily hyperthermia, not panting | verified | S23, S20, S21 | none. Round 1 already noted that no resting respiratory-rate value was reached, so no rate should be printed here |
| lungs | Spongy, without deep external fissures; the right lung has a small accessory lobe | **verified (round 3)** | S108 — "the lungs are divided into cranial and caudal lobes, with the right lung also featuring an accessory lobe … although lobulation is not prominent, small lobules separated by connective tissue can be observed" | none; add S108 to the card. Keep "not prominent" rather than "no fissures at all". |
| lungs | The lung is the camel organ most often affected by hydatid cysts | verified | S86 — in 152 slaughtered dromedaries the lungs held 87.87 % of hydatid infections | none |
| heart | It lies low in the chest between the elbows | **partially correct (round 3)** | S108 — the heart lies between the 3rd and 6th ribs (3rd–5th intercostal spaces) in contact with the **ventral third** of the chest wall; the apex points caudally and slightly left, and the heart sits more vertically than in a cow. "Between the elbows" is in no source | AR: «يقع القلب بين الضلع الثالث والسادس (المسافات الوربية ٣-٥) ملاصقًا للثلث البطني من جدار الصدر، ورأسه متجه إلى الخلف قليلًا إلى اليسار.» EN: "The heart lies between the 3rd and 6th ribs (3rd–5th ICS) against the ventral third of the chest wall, apex directed caudally and slightly to the left." |
| heart | In thirst she guards plasma volume, so blood stays fluid and keeps carrying heat to the skin; she tolerates losing about a quarter of her weight as water | verified | S27, S29, S35, S44 | none |
| vessels | The jugular vein runs in a groove along the side of the neck, where a veterinarian usually takes blood | unsupported | No source reached in round 2 covers the jugular groove or venipuncture site | Cite a camel clinical-anatomy or venipuncture source. |
| vessels | At the base of the skull a fine arterial meshwork (the carotid rete) swaps heat with cooled venous blood | verified | S50, S51 (anatomy of the rete), S24 (the cooling role) | none |
| spleen | **Sickle-shaped** | **incorrect** | S30 — 25 adult dromedary spleens: "rectangular shape with a triangular section, rounded edges, smooth shiny surface" | AR: «الطحال في الجمل شبه مستطيل ذو مقطع مثلثي وحوافّ مستديرة وسطح أملس لامع (٢٥ طحالًا)، وليس منجليًّا.» EN: "In the camel the spleen is rectangular with a triangular cross-section, rounded edges and a smooth, shiny surface, not sickle-shaped." |
| spleen | On the left side against the first stomach compartment | verified | S30 | none |
| spleen | It can enlarge in blood diseases such as trypanosomiasis | partially correct | S30 (normal anatomy); the splenomegaly-in-surra point rests on the project's `woahSurra` key (not re-verified) | Keep, but cite the surra source explicitly. |
| blood | Red cells are oval, and they swell without bursting when a thirsty camel drinks a large volume | verified | S27, S28, S29 | none |
| mouth | The upper lip is split and mobile, picking leaves from between thorns | verified | S01, S44 | none |
| mouth | The lining of the cheeks carries horny, cone-shaped papillae | unsupported | None reached in round 2 | Cite a camel oral-cavity anatomy source. |
| teeth | An adult has 34 teeth: incisors 1/3, canines 1/1, premolars 3/2, molars 3/3; a hard dental pad replaces the upper incisors; one incisor on each side is canine-like | verified | S53 (22 deciduous and 34 permanent, with the jaw-by-jaw counts) | none. Note this is the only source reached that prints the full formula (see `SOURCES.md` round-2 usage note). |
| teeth | Males' canines are long fighting teeth; teeth are used to estimate age | partially correct | Age estimation: S53, S52. Male canine length: no source reached in round 2 | Keep the age point; source the male canine claim or soften it. |
| oesophagus | As long as the neck | verified | S14 (oesophageal structure); the length follows directly from the cervical anatomy in S81 | none |
| c1 | By far the largest compartment | verified | S12, S13, S44 | none |
| c1 | Its wall carries glandular sacs long thought to store water; they do not | verified | S44, S06, S12 | none |
| c1 | Swallowed plastic bags and rope pile up into masses that block it | unsupported | The project's `plastic` key was not re-opened in round 2 | Cite a camel foreign-body/rumenotomy study. |
| c2 | It has glandular cells and is not a cow's rumen and reticulum; camels are not true ruminants | verified | S08, S12, S13 | none |
| c3 | The blood-sucking stomach worm *Haemonchus longistipes* lives here | partially correct | The project's `haem` key was not re-verified in round 2; *H. longistipes* is the camel's abomasal (glandular-stomach) nematode, which matches the location in C3 | Keep the location, verify the "most important worm" wording against the `haem` source. |
| intestine | The site of enterotoxaemia after sudden diet changes, and of diarrhoea in calves | partially correct | Rests on the project's `entero` and `calfD` keys (not re-verified) | Cite those sources at organ level. |
| colon | The colon is coiled into a spiral that wrings water out of the contents until the dung comes out as dry pellets | verified (water) / descriptive (shape) | S44, S04 for nearly dry faeces; the spiral form and pellet shape are standard camel descriptions but were not separately verified here | none required; optionally cite a large-intestine anatomy source for the spiral. |
| liver | Camels have no gallbladder; the hepatic duct delivers bile straight into the duodenum | verified | S43, S41, S44 | none |
| liver | **The liver is the second commonest site of hydatid cysts** | **incorrect** | S86 — lung 87.87 %, liver 9 % of hydatid infections in 152 dromedaries ("camels' liver infections were rare") | AR: «الرئة هي الموضع الأكثر إصابة بالأكياس العدارية (نحو ٨٨٪ من الإصابات)، وإصابة الكبد نادرة (نحو ٩٪)؛ فلا يصحّ وصف الكبد بأنه ثاني أكثر الأعضاء إصابة.» EN: "The lung is by far the commonest site of hydatid cysts (about 88 % of infections); liver involvement is rare (about 9 %), so the liver should not be called the second commonest site." |
| pancreas | Two lobes, the left larger, lying in the folds of the omentum against the first compartment, the spleen and the left kidney | verified | S40 | none |
| kidneys | A deep medulla with long loops reclaims water, so urine is scant and highly concentrated | verified | S32, S33 | none |
| ureters | They carry little, concentrated urine — one of the clearest ways camels save water | verified (functional) | S32, S33, S34 | none; no ureter morphometry exists in the sources reached, so keep it functional |
| bladder | The male urinates backwards, because his penis points backwards when not erect | verified | S54 (prepuce directed caudally; penis retracted through a prescrotal sigmoid flexure) | none |
| uterus | Two-horned, the left horn longer | verified | S54 | none |
| uterus | **Although either ovary can ovulate, most pregnancies settle in the left horn (≈95 % in camelids)** | unsupported | No source reached in round 2 gives a laterality percentage. S54 confirms only that the left horn is longer | AR: «القرن الأيسر أطول بوضوح، ويبدو أنه الأكثر استقبالًا للحمل، لكن لا تتوفّر في المصادر التي بلغها البحث نسبة مئوية موثوقة.» EN: "The left horn is distinctly longer and appears to be the one that usually receives the pregnancy, but no reliable percentage was reached in this research round." |
| uterus | Pregnancy lasts about 13 months | verified | S55 — mean 384.5 ± 0.17 days (n = 4,093) | none |
| ovaries | She does not ovulate on her own schedule: ovulation follows mating | verified | S54, S59, S60 | none |
| ovaries | … triggered by a factor in the male's seminal fluid | partially correct | The camelid seminal-plasma ovulation-inducing factor is well described in the literature, but no source for it was reached in round 2 | Cite a camelid ovulation-induction source, or shorten to "ovulation follows mating" |
| udder | Four quarters and four teats, each usually with two openings | verified | S56 (two teat canals and cisterns per teat, entirely independent), S57 (left fore/rear, right fore/rear teats) | none |
| udder | Milk let-down usually needs the calf: his suckling or presence releases oxytocin | partially correct | General ruminant physiology, but not verified for camels in round 2 | Cite a camel milking-physiology source |
| testes | Relatively small, set high in the perineum below the anus; active in the winter rutting season | verified | S54, S63 | none |
| dulla | In the rut the male inflates it and pushes it out of the side of his mouth as a pink bladder, with a gurgling roar; far larger in adult males | verified | S85; S73 (prolapse in a male as a clinical corollary) | none |
| brain | An arterial network swaps heat with venous blood the nose has cooled; some studies found the brain cooler and others did not — not settled | verified | S24, S23, S25 | none |
| eyes | Large, under a jutting bony brow | verified | S83, S84 | none |
| eyes | Two rows of long lashes; a thin, semi-transparent third eyelid sweeps sand away from the inner corner | unsupported | No source reached in round 2 | Cite a camel ophthalmology/ocular-adnexa source, or drop the sentence |
| ears | Small and rounded, lined with hair that keeps sand out; she folds them back in a storm | unsupported | S79 describes the pinna's cartilages and muscles; S80 the inner ear. Neither states the hair lining or the folding behaviour | Cite an ethology/camel behaviour source (the project's `couch` notes) or drop it |
| ears | Ticks often attach on thin skin around the ears, the udder and the perineum | partially correct | Rests on the project's `cchf` key (not re-verified) | Keep with the tick source cited |
| pollGlands | Found in males only; in the rut they pour out a brown secretion that turns tarry and black | partially correct | S64 (dromedary, rut) confirms male-only and rut activity; S65/S66 describe the seasonal secretion as **pale-yellow and watery** in the Bactrian camel. The "brown → black tarry" description was not verified for dromedaries | AR: «الغدّتان في الذكور فقط وتنشطان في الهياج؛ وتصف دراسات الجمل ذي السنامين إفرازًا أصفر شاحبًا مائيًّا. لا تتوفّر في المصادر التي بلغها البحث موثوقية لوصف الإفراز الأسود القَطِراني في الجمل العربي.» EN: "Male-only and rut-active is verified; the secretion is described as pale-yellow and watery in the Bactrian camel, and the 'tarry black' description was not verified for the dromedary." |
| adrenals | Stress markers rise in camels kept long without water, and these hormones are part of how the body holds on to water and salt | partially correct | S67 (dromedary HPA axis and cortisol), S68 (adrenal zonation, Bactrian); the "long dehydration" claim rests on the project's `dehyd` key (not re-verified) | Cite the dehydration/stress-markers paper directly |
| thyroid | In summer thirst, thyroid hormones fall, so the body makes less heat and loses less water with each breath | verified | S69 | none |
| lymph | The largest nodes lie in front of the shoulder and in front of the thigh (**about 9 cm long**) | unsupported | No source reached in round 2 gives a lymph-node length for the camel | AR: «يُحذف الرقم (٩ سم) أو يُستبدل بمصدر تشريحي يقيس العقد في الجمل.» EN: "Drop the 9 cm figure or cite a camel anatomy source that measures it." |
| lymph | Some head nodes hold many red cells, resembling haemolymph nodes | verified | S70, S71 | none |
| lymph | They are where caseous lymphadenitis forms its abscesses | partially correct | Rests on the project's `cla` key (not re-verified) | Keep with the CLA source cited |
| skeleton | Seven long neck vertebrae, 12 thoracic, 7 lumbar | partially correct | Seven cervical vertebrae: verified (S81 — seven typical and atypical irregular bones). 12 thoracic and 7 lumbar: not verified in round 2 | AR/EN: «الرقم الموثَّق هو سبع فقرات عنقية تشكّل نحو نصف طول العمود الفقري؛ أما أعداد الفقرات الصدرية والقطنية فتحتاج مصدرًا تشريحيًّا موثوقًا.» |
| skeleton | The tall spines of the first thoracic vertebrae make the withers | partially correct | Consistent with camel anatomy and with the round-1 hump entry, but no source reached in round 2 states it for dromedaries | Cite a skeletal anatomy source |
| skeleton | The hump has no bone in it | verified | S38, S39, S44 | none |
| muscles | Muscle is gathered high on the legs; below the knee and hock there is almost only bone and tendon | verified (partial) | S77 documents the tendon- and sheath-dominated carpus | none |
| muscles | The thigh joins the body only at the top | unsupported | The project's `legs` key is a Wikipedia article, which does not meet the round-1/round-2 source standard | Cite Dagg (S75) or a peer-reviewed hind-limb anatomy source, or soften the claim |
| skin | Camels sweat when hot, but when thirsty they delay sweating and let their temperature climb by day | verified | S36, S37 (sweating rate and surface temperature), plus S26/S44 for the 34–41 °C daily swing | none |
| coat | A shorn camel needed about 50 % more water for daytime sweating than one in her own coat | unsupported | The atlas tags this to the project's `coat` key (a hair-follicle-cycle paper) and to `sn56`; the 50 % figure could not be re-verified in this round | AR: «يُزاد أو يُحذف الرقم (٥٠٪): إن أُبقي فلابدّ من الاستشهاد بنصّ شميت-نيلسن ١٩٥٦ نفسه.» EN: "Keep the 50 % figure only if it can be pinned to the 1956 water-balance paper itself; otherwise drop the number." |
| coat | It is longest on the hump and on the top of the back, and grows longer in winter | partially correct | Seasonal cycle verified (S74); the regional distribution was not verified in round 2 | Cite a coat/fibre-distribution source |
| pads | The foot is a broad soft cushion with two toes and two small nails | verified | S78, S76 | none |
| pads | Hardened callus pads on the chest, elbows, knees and stifles carry the body when she couches | unsupported | No source reached in round 2 | Cite a camel anatomy/behaviour source or the project's `couch` notes |
| hump | No bone and no water; keeping fat in one place leaves the rest of the body without a thick insulating layer; the hump shrinks and tips over as she uses it up | verified | S38, S39, S44 | none |

---

## Part C.2 — anatomy chapter topics (`js/data/anatomy.js`)

Only the camel-specific statements and numbers are rowed here; the general-definition sentences are
omitted.

| topic | claim as written (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| hump | A mass of fat and connective tissue, no bone and no water; she draws on it when food is short and the hump shrinks and eventually flops to one side; burning fat does make water, but the extra breathing needed loses water too, so the hump is no canteen | verified | S38, S39, S44 | none |
| stomach | Camels chew the cud like cattle, but the stomach has three compartments (C1, C2, C3), not four; rumination evolved independently and they sit in Tylopoda; C1 is the largest, with glandular sacs that are not water stores; C3 is a long tube whose last fifth secretes acid | verified (fraction: partial) | S12, S13, S44, S06, S07, S08 for the compartments and the saccules. The exact "last fifth" fraction was not verified in round 2 | Keep; drop or source the "last fifth" fraction. Note the open three-vs-four debate already recorded in `NOTES.md` |
| liver | Camels have no gallbladder; the two hepatic ducts join into one that carries bile straight into the duodenum; the liver lies on the right behind the diaphragm, divided into lobes | verified | S43, S41, S44 | none |
| heart | In thirst she draws water from her tissues while guarding plasma volume, so the blood stays fluid; she tolerates losing about a quarter of her body weight as water; red cells are oval and swell without bursting | verified | S27, S29, S35, S44 | none |
| lungs | Her lungs are spongy and lack the deep external fissures that divide the lobes in many mammals, but the right lung has a small accessory lobe around the caudal vena cava | **verified (round 3)** | S108 (right accessory lobe; lobulation present but not prominent) | Keep the accessory lobe; soften "lack the deep external fissures" to "fissures are not prominent". |
| nose | The nose holds rolled turbinates that cool exhaled air and take back its vapour; Schmidt-Nielsen and colleagues (1981) estimated a saving of about 60 % | verified (60 %); partial (nostril closure) | S21 for the 60 %; the "nostrils close when sand blows" sentence has no source reached | Keep the 60 %; source or soften the nostril-closure sentence |
| brain | A carotid rete sits bathed in venous blood cooled in the nose; Elkhawad (1992) reported selective brain cooling, while another study argued that nasal vasoconstriction in severe heat limits it | verified | S24, S23, S25 | none — the text already states the disagreement, which is what the sources show |
| kidneys | A deep medulla with long loops reclaims water, so urine is scant and highly concentrated; the large intestine then wrings the water out and the dung comes out dry | verified | S32, S44, S04 | none |
| repro | The uterus has two horns, the left longer; about 95 % of camelid pregnancies settle in the left horn; pregnancy lasts about 13 months; the male has the dulla | partially correct | Left horn longer: S54. Pregnancy ≈ 13 months: S55 (384.5 days). **The 95 % laterality figure is unsupported.** Dulla: S85 | AR: «قرنان، الأيسر أطول، ويبدو أنه الأكثر استقبالًا للحمل؛ ولا تتوفّر نسبة مئوية موثوقة في المصادر التي بلغها البحث. والحمل نحو ٣٨٤ يومًا (نحو ١٣ شهرًا).» EN: "Two horns with the left longer, apparently the usual site of pregnancy; no reliable percentage was reached. Gestation is about 384 days (≈13 months)." |
| skeleton | Seven cervical vertebrae like most mammals but longer; then 12 thoracic carrying 12 pairs of ribs, 7 lumbar, 5 fused sacral and 15–20 caudal; the tall spines of the first thoracic vertebrae make the withers; the hump contains no bone | partially correct | 7 cervical: S81. Hump has no bone: S38, S39, S44. The 12/7/5/15–20 counts and the withers spines: no source reached in round 2 | AR/EN: «سبع فقرات عنقية موثَّقة (S81)، ولا عظم في السنام (S38/S39/S44)؛ أما تفصيل أعداد الفقرات الصدرية والقطنية والعجزية والذيلية فيحتاج مصدرًا تشريحيًّا معتمدًا.» |
| legs | Hind legs attach to the body only at the top of the thigh, with no stifle fold, so air can move under the belly; below the carpus and hock there is hardly any muscle, only light bone and tendon | partially correct | Tendon-dominated distal limb: S77; the pacing gait: S75. The "attaches only at the top / no stifle fold" point rests on the project's `legs` key, a Wikipedia article | Cite Dagg (S75) or another peer-reviewed hind-limb anatomy source; Wikipedia should not be the sole evidence |

---

## Part D — health cards (lighter check)

The mission puts health content last. What was checked mechanically and by spot-reading:

* **Vet referral on every card: pass.** All 21 cards end their treatment line with a referral — "The vet
  …", "the veterinarian", "call the vet at once", or "the veterinary authorities must be told" — and the
  section-level disclaimer adds that nothing here replaces an examination by a licensed veterinarian. No
  card ends without one.
* **No doses or protocols: pass.** A search of both health files found no `mg/kg`, no milligram figures and
  no numeric dosing. The single use of "dose" (`surra`) explicitly hands the choice of drug and dose to
  the vet.
* **Causes, transmission, signs, prevention** were spot-read for `surra`, `camelpox`, `brucellosis`,
  `mers`, `mange` and `hydatid`; the causers named are the accepted ones (*Trypanosoma evansi*; camelpox
  orthopoxvirus; *Brucella melitensis*/*B. abortus*; MERS-CoV; *Sarcoptes scabiei* var. *cameli*;
  *Echinococcus granulosus*), and the transmission routes match the project's `woahSurra`, `woahPox`,
  `bruc`, `mersWHO` and `mange` sources. These sources were not re-opened in round 2, so this is a
  consistency check, not a verification.
* **One cross-reference to fix:** the `hydatid` card should match the corrected organ/liver text above —
  the lung is the dominant organ in camels (≈88 %), and the liver is not the second commonest site.
* A full, claim-by-claim disease audit (all 21 cards, every sign and prevention statement) was **not**
  completed in this round. It remains the first item of round 3.

---

## Claim-level corrections to hand to the build team (Arabic + English)

1. **Spleen shape** — AR: «الطحال في الجمل شبه مستطيل ذو مقطع مثلثي وحوافّ مستديرة وسطح أملس لامع، وليس منجليًّا.» EN: "In the camel the spleen is rectangular with a triangular cross-section, rounded edges and a smooth, shiny surface, not sickle-shaped." (`atlas.js` → `spleen`.)
2. **Hydatid cysts** — AR: «الرئة هي الموضع الأكثر إصابة بالأكياس العدارية (نحو ٨٨٪ من الإصابات في دراسة على ١٥٢ جملًا)، وإصابة الكبد نادرة (نحو ٩٪).» EN: "The lung is by far the commonest site of hydatid cysts (about 88 % of infections in 152 camels); liver involvement is rare (about 9 %)." (`atlas.js` → `liver`; `health-v3.js` → `hydatid`.)
3. **Uterine laterality** — AR: «القرن الأيسر أطول، ويبدو أنه الأكثر استقبالًا للحمل؛ ولا تتوفّر نسبة مئوية موثوقة.» EN: "The left horn is longer and appears to be the usual site of pregnancy; no reliable percentage was reached." (`atlas.js` → `uterus`; `anatomy.js` → `repro`.)

---

# Health — round 3 audit of the 21 disease cards

Scope: `js/data/health.js` (`HEALTH`, 15 cards) and `js/data/health-v3.js` (`HEALTH_V3`, 6 more). For each
card the cause, transmission, signs, diagnosis, prevention and treatment approach were checked, plus the
zoonotic advice where the card carries it. Two project-wide rules were re-checked mechanically:

* **Vet referral: pass.** All 21 `tx` lines end in a referral to a vet, a veterinarian, the veterinary
  authorities or an emergency call, and the section disclaimer names a licensed veterinarian.
* **No doses or protocols: pass.** No `mg/kg`, no milligram figure, no numeric dosing, and no home
  treatment protocol anywhere in the two files.

Evidence key: `S`-ids are in `SOURCES.md`; `project src <key>` means the project's own source key in
`js/data/sources.js` / `merge-v3.js`. Sources S88–S92 are WHO fact sheets, S93 is the Saudi national
animal-health guide, and S94–S110 are peer-reviewed camel papers.

## `surra` — Trypanosomiasis (surra)

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | A single-celled blood parasite, *Trypanosoma evansi* | verified | S95, S98 | none |
| transmission | Carried mechanically by biting flies (*Tabanus*, *Stomoxys*) | partially correct | S95 confirms *T. evansi* in camels; the specific vector list rests on `project src woahSurra` (not re-verified) | Keep, but cite the WOAH chapter or a camel-vector study. |
| signs | Recurring fever, anaemia, wasting with a shrinking hump, dullness, swelling under the body; abortion can occur | partially correct | S95, S98 (S98 documents testicular degeneration, low testosterone and infertility in infected males; abortion was not verified) | AR: «يُضاف نقص الخصوبة والعقم في الذكور؛ وتحتاج فقرة الإجهاض إلى مصدر.» EN: "Add reduced fertility/infertility in males (documented, S98); the abortion sentence still needs a source." |
| diagnosis | Signs alone are not enough; blood smear, CATT-type serology, PCR | verified | S98 (microscopy + serology), S95 | none |
| prevention | Fly control, avoid peak fly hours, test and isolate new animals | verified | S95 | none |
| treatment approach | The vet uses trypanocidal drugs of their choice and dose; relapse and resistance occur | partially correct | No round-3 source on trypanocide resistance was reached | Keep the referral; cite a source for the resistance sentence or soften it. |

## `mange` — Sarcoptic mange

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | A burrowing mite, *Sarcoptes scabiei* var. *cameli* | verified | S99, `project src mange` | none |
| transmission | Direct contact and shared equipment, blankets and resting places | verified | S95, S99 | none |
| signs | Intense itching, hair loss, crusts, thickened and darkened skin, often starting on head, neck, inner thighs and legs | partially correct | S99 confirms sarcoptic mange infestation in dromedaries; the exact lesion distribution was not verified | Keep, but cite a clinical description of camel mange. |
| diagnosis | Skin scraping examined under the microscope | verified | S95, S99 | none |
| prevention | Isolate at once, treat the herd as the vet directs, clean equipment, check new animals | verified | S95 | none |
| treatment approach | The vet prescribes an external antiparasitic and repeats it at intervals | verified | `project src mange` | none |
| zoonotic advice | Passes to people by contact, causing itching and a rash; gloves, wash, see a doctor | verified | `project src mange` (One Health alert on zoonotic scabies from dromedary camels) | none |

## `camelpox` — Camelpox

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | An orthopoxvirus, camelpox virus | verified | S94 | none |
| transmission | Contact with an infected animal or an environment contaminated by scabs and secretions; ticks suspected; outbreaks often follow rains | partially correct | S94 confirms camelpox as a major viral disease of camels; the tick role and the rain/season association were not verified | AR/EN: «تُبقى العدوى بالتلامس والبيئة الملوّثة، أما دور القراد وعلاقته بالأمطار فتحتاج مصدرًا.» |
| signs | Fever and swollen lymph nodes, then bumps → pustules → scabs on lips, nostrils, eyelids and head, sometimes body-wide; worse in the young | verified | S94 | none |
| diagnosis | Suspected from the signs, confirmed by PCR on lesion samples | verified | S94 | none |
| prevention | Vaccination under the official programme (live attenuated and inactivated vaccines), isolating sick animals, tick control | verified | S94; `project src cpVax`, `cpLive` | none |
| treatment approach | No specific antiviral; the vet treats secondary bacterial infection and supports the animal | verified | S94 | none |
| zoonotic advice | Rarely infects people, usually mild sores on the hands and fingers; wear gloves | verified | S94 | none |

## `brucellosis` — Brucellosis

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | *Brucella melitensis* and *B. abortus* | partially correct | S89 (S89: *B. melitensis* is the most prevalent species in human brucellosis worldwide) | AR: «المسبّب الرئيسي في الإبل هو *Brucella melitensis*، وقد يُذكر *B. abortus* بوصفه أقلّ شيوعًا.» EN: "Name *B. melitensis* as the main species in camels; *B. abortus* is occasional." |
| transmission | Aborted fetuses, placentas, birth fluids and milk; infected sheep and goats sharing pasture | verified | S89, `project src bruc` | none |
| signs | Often subtle: abortion, retained placenta, poor fertility, less milk | verified | S89, S94 | none |
| diagnosis | Blood serology (Rose Bengal, ELISA), culture or PCR, within official programmes | verified | S89 | none |
| prevention | Regular testing under the official programme, hygiene at births, safe disposal, separation; no licensed camel vaccine, Rev.1 used without solid evidence | verified | S93 (official testing/reporting framework), `project src rev1` | none |
| treatment approach | Handled by the veterinary authorities under official control programmes; treating infected animals is usually not worthwhile | verified | S89, S93 | none |
| zoonotic advice | One of the region's most important zoonoses; raw camel milk a major source; boil/pasteurise milk; gloves at births; see a doctor for recurring fever and joint pain | verified | S89, `project src bruc` | none |

## `mers` — MERS-CoV

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | MERS coronavirus; dromedary camels are its main animal reservoir | verified | S88 (WHO: "dromedary camels are the primary reservoir") | none |
| transmission | Between camels through nasal and respiratory secretions; especially common in young camels | partially correct | S88 states that infected dromedaries do not get sick and that diagnosis relies on laboratory testing; the age pattern was not verified | AR/EN: «تنتقل العدوى بين الإبل عبر الإفرازات التنفسية في الغالب؛ أما كونها أكثر شيوعًا في الصغار فيحتاج مصدرًا.» |
| signs | Usually mild or absent in camels | verified | S88 ("infected dromedaries do not get sick") | none |
| diagnosis | PCR on nasal swabs, and antibody tests on blood | verified | S88 | none |
| prevention | Hygiene and less crowding; no licensed camel vaccine (as of 2025) | verified | S88 | none |
| treatment approach | No specific treatment in camels; the vet supports the animal and informs the authorities | verified | S88, S93 | none |
| zoonotic advice (WHO) | Wash hands before and after touching camels, avoid sick animals, no raw camel milk or camel urine, no undercooked meat; people with diabetes, kidney failure, chronic lung disease or weak immunity should avoid camel contact | verified | S88 — this matches the WHO wording for people at greater risk of severe disease | none |

## `parasites` — Internal parasites

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | Gut roundworms, the most harmful being the blood-sucking *Haemonchus longistipes* | partially correct | S95 confirms gastrointestinal nematodes as a welfare problem in camels; the "most harmful" ranking rests on `project src haem` (not re-verified) | Keep, but cite the *H. longistipes* paper directly. |
| transmission | Camels swallow larvae with pasture or water contaminated by dung | verified | S95 | none |
| signs | Anaemia and pale membranes, wasting with a shrinking hump, diarrhoea, swelling under the jaw, poor growth in the young | partially correct | S95 (welfare impact of endoparasites); the detailed sign list is textbook haemonchosis rather than a statement read this round | Cite the *H. longistipes* source for the sign list. |
| diagnosis | Faecal egg counts in the laboratory | verified | S95 | none |
| prevention | Targeted deworming guided by the vet and faecal tests, not blanket dosing, because resistance is rising; clean feeders and troughs | verified | `project src resist` (reduced anthelmintic efficacy in camels) | none |
| treatment approach | The vet chooses the drug and dose and re-tests to confirm it worked | verified | safety rule; S95 | none |

## `ticks` — Ticks

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | Hard ticks, most famously *Hyalomma dromedarii* | verified | S95, S92 (*Hyalomma* is the principal CCHF vector) | none |
| transmission/attachment | In pens and pasture; attaches to thin-skinned areas around the tail, udder, ears and between the legs | partially correct | S95 covers ectoparasites in camels; the attachment-site list was not verified | Cite a camel tick study, or keep the list as a practical observation. |
| signs | Irritation and wounds, anaemia with heavy loads; ticks can carry disease | verified | S95, S92 | none |
| diagnosis | Direct examination of the skin | verified | S95 | none |
| prevention | Regular checks, clean pens, tick control on a programme the vet sets | verified | S95 | none |
| treatment approach | The vet chooses a suitable acaricide and how to use it, and treats wounds | verified | safety rule; S95 | none |
| zoonotic advice | *Hyalomma* ticks can pass CCHF by bite or through the blood of infected animals; never crush ticks with bare hands, wear gloves, take care with blood at slaughter, see a doctor for fever after a bite | verified | S92 (WHO: transmission by tick bite or contact with infected animal blood/tissues; *Hyalomma* the principal vector) | none |

## `mastitis` — Mastitis

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | Bacteria entering through the teat canal, "such as staphylococci and streptococci" | partially correct | S110 — in 390 lactating camels the commonest isolates were *Streptococcus* spp. (26.1 %) and *E. coli* (25 %), while *S. agalactiae* was the least frequent (5.5 %) | AR: «من أكثر المسبّبات في الإبل المكوّرات العنقودية والعقدية **والإشريكية القولونية**؛ فتُذكر الإشريكية القولونية صراحةً.» EN: "Name *E. coli* explicitly — it was as common as streptococci in the largest camel survey reached." |
| transmission | Poor milking hygiene, teat injuries, contaminated hands, equipment and ground | verified | S110 (risk factors included milking hygiene, udder/teat lesions, tick infestation, age and lactation stage) | none |
| signs | One or more quarters swollen, hot and painful; milk with clots or blood; sometimes fever | verified | S110 (6.4 % clinical vs 32.1 % subclinical of 390 camels) | Add that **subclinical** mastitis is about five times commoner than the clinical form (S110). |
| diagnosis | Udder and milk examination, California Mastitis Test, milk culture | verified | S110 | none |
| prevention | Clean hands and equipment, gentle milking, teat care, early treatment | verified | S110 | none |
| treatment approach | The vet treats according to the culture result and sets the milk-withdrawal period | verified | safety rule; S110 | none |

## `calfDiarrhea` — Calf diarrhoea

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | *E. coli*, rotavirus, coronavirus, *Cryptosporidium*, made worse by missed colostrum | partially correct | S97 — of bacterial isolates from camel-calf diarrhoea, *E. coli* 58 %, *Salmonella* 30 %, *Enterococcus* 12 %; S100 lists viral, bacterial and parasitic agents acting together. **Salmonella is missing** from the card | AR: «يُضاف السالمونيلا إلى قائمة المسبّبات (٣٠٪ من العزلات البكتيرية في دراسة إثيوبيا).» EN: "Add *Salmonella* (30 % of bacterial isolates in the Ethiopian study)." |
| transmission | From contaminated dung around the calving and suckling area | verified | S97, S100 | none |
| signs | Diarrhoea, dehydration with sunken eyes and a skin fold that stays up, weakness, refusing to suckle | verified | S97 | none |
| diagnosis | The vet's examination and dung tests | verified | S97 | none |
| prevention | Colostrum in the first hours, clean dry calving area, clean hands and equipment, vaccinating dams if the vet advises | verified | S100 (colostrum and hygiene are the core preventive measures) | none |
| treatment approach | Dehydration is the main danger; the vet replaces fluids and salts and treats the cause | verified | safety rule; S97 | none |
| zoonotic advice | *Cryptosporidium* and *Salmonella* infect people; wash hands well after handling a sick calf or its dung | verified | S97 (*Salmonella* present in camel-calves), S100 | none |

## `respiratory` — Respiratory disease

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | *Pasteurella* and *Mannheimia*, and viruses, worsened by stress, dust, crowding and transport | verified | S100 (multifactorial co-infection, stress-compromised immunity), S94 | none |
| transmission | By droplets and contact, flaring in stressed animals | verified | S100 | none |
| signs | Cough, nasal discharge, fever, fast breathing, poor appetite | verified | S100 | none |
| diagnosis | Clinical examination, swabs and tests, sometimes ultrasound | verified | S100, S109 | none |
| prevention | Less stress and crowding, good ventilation, vaccination against *Pasteurella* where the authorities recommend it | partially correct | S100 explicitly notes the **lack of validated vaccination protocols** for camel pneumo-/enteritis | AR: «يُضاف تحفّظ: لا توجد بروتوكولات تحصين مُتحقَّق منها لمتلازمة الالتهاب الرئوي/المعي في الإبل (S100).» EN: "Add the caveat that no validated vaccination protocol exists for camel pneumo-/enteritis (S100)." |
| treatment approach | The vet decides treatment by cause and severity | verified | safety rule; S100 | none |

## `foot` — Foot and pad injuries

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | Thorns, nails, glass and sharp stones; torn or ulcerated pads, abscesses, cracks, overgrown nails | verified | S78 (soft-tissue lesions included wounds and penetrating solar nails; hard-tissue lesions included fractures and exostoses) | none |
| transmission | Not contagious, but commoner on hard or littered ground, with work and long standing; front feet suffer more because they carry most of the weight | partially correct | S78 confirms the **forelimb** predominance and identifies juvenile age, female sex, body weight 150–500 kg and the Wadeh breed as risk factors; "carry most weight" is an inference | AR: «تُذكر عوامل الاختطار الموثّقة في الدراسة (العمر الصغير، الأنثى، الوزن، السلالة) بدل تعليل الثقل.» EN: "State the documented risk factors from S78 instead of the weight-bearing explanation." |
| signs | Lameness, reluctance to move, swelling or heat, foul smell or discharge | verified | S78 | none |
| diagnosis | Foot examination, and X-rays when needed | verified | S78 (radiography essential when bone is involved) | none |
| prevention | Pens and paths clear of sharp objects, regular foot checks, overgrown nails trimmed by an experienced hand | verified | S78 | none |
| treatment approach | The vet cleans the wound, drains abscesses, protects the foot, and decides on any medicine | verified | safety rule; S78 | none |

## `dental` — Dental problems

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | Wear with age, fractures, malocclusion, retained milk teeth, root abscesses; males' canines can cause fight wounds | verified | S52 (fractured teeth 7.66 %, dental tartar 5.42 %, inward incisor rotation 2.87 %, maleruption, oligodontia, gingivitis 4.15 %), S53 | none |
| transmission | Not contagious; increases with age | verified | S52 (disorders tabulated by age group) | none |
| signs | Difficulty chewing, dropping food, weight loss, drooling, jaw swelling, bad smell | partially correct | S52 documents the disorders but this sign list is clinical rather than quoted | Cite a camel dental-clinical source, or keep the list as a field guide. |
| diagnosis | Examining the mouth (usually with sedation) and X-rays | verified | S52 | none |
| prevention | Regular dental checks, especially in old camels, and suitable feed | verified | S52 (the paper itself calls for increased oral-cavity care of camels) | none |
| treatment approach | Dental procedures by the vet, such as rasping, extraction or treating abscesses | verified | safety rule; S52 | none |

## `heatStress` — Heat stress

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | A heat load beyond what she can shed: heat with thirst, exertion, transport, or no shade | verified | S23, S20 | none |
| transmission | Not contagious; calves, old and sick camels are most at risk | partially correct | No round-3 source for the risk groups | Cite a heat-stress review or mark as a field observation. |
| signs | Fast, rising breathing rate, going off feed, dullness, drooling, staggering, then collapse | partially correct | S23 measured respiratory frequency rising with body temperature (up to about 60/min) and tidal volume falling; the later signs are clinical | Keep the respiratory detail with S23; cite a clinical source for the rest. |
| diagnosis | Examination and temperature, bearing in mind camels normally warm up by day | verified | S23, S26/S44 (daily 34–41 °C swing) | none |
| prevention | Shade and water, no work or transport in the hottest hours, extra care for the young and old | verified | S23, S20 | none |
| treatment approach | First aid: shade, water, stop the work; the vet decides on cooling, fluids and anything else | verified | safety rule | none |

## `poison` — Plant and feed poisoning

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | Toxic plants such as oleander (*Nerium oleander*) and Sodom apple (*Calotropis procera*), mouldy feed, sudden grain overload | partially correct | `project src plants` is a general oleander-toxicity review; no dromedary-specific poisoning source was reached in round 3 | Cite a regional camel toxic-plant source (or MEWA guidance) before keeping *Calotropis* named. |
| transmission | Not contagious; likelier in drought, or when garden clippings are thrown to camels | partially correct | plausible but no source reached | Cite or soften. |
| signs | Depends on the toxin: sudden death, irregular heartbeat, colic and diarrhoea, trembling and weakness | verified | `project src plants` (oleander cardiotoxicity) | none |
| diagnosis | History (what did she eat?) and examination, and tests where possible | verified | standard clinical approach | none |
| prevention | Keep toxic plants out of pens and grazing, never feed ornamental clippings, store feed dry, introduce grain gradually | verified | standard preventive approach | none |
| treatment approach | An emergency: call the vet at once; treatment depends on the toxin and the signs | verified | safety rule | none |

## `rabies` — Rabies

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | A virus that attacks the nervous system | verified | S90 | none |
| transmission | The bite of a rabid animal such as a dog or fox; rare in camels | verified | S90 (dog bites cause 99 % of human cases), S94 (rabies listed among camel viral diseases) | none |
| signs | Changed behaviour, agitation or dullness, trouble swallowing and drooling, progressive paralysis; fatal | verified | S90 (fatal once clinical signs appear), S94 | none |
| diagnosis | Suspected clinically, confirmed by an official laboratory | verified | S90 | none |
| prevention | Keep stray dogs and wildlife away; vaccinate where the authorities recommend it | verified | S90 (dog vaccination is the key measure), S93 (rabies is on the Saudi notifiable list) | none |
| treatment approach | No treatment; the veterinary authorities must be told immediately | verified | S90, S93 | none |
| zoonotic advice | Very dangerous; never touch the mouth or saliva of a camel whose behaviour has changed; after a bite or saliva exposure wash with soap and water for 15 minutes and go to emergency care | verified | S90 (WHO: wash the wound with water and soap for at least 15 minutes and seek medical attention immediately) | none |

## `ringworm` — Ringworm (dermatophytosis)

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | *Trichophyton verrucosum* in young camels and *T. mentagrophytes* in older ones | unsupported | S107 could only be reached as title/metadata (paywalled) | AR: «يُكتفى بـ«فطريات جلدية، أهمّها أنواع *Trichophyton*» حتى يُتحقّق من النوعين.» EN: "Use 'dermatophytes, chiefly *Trichophyton* spp.' until S107 can be read." |
| transmission | Direct contact, shared equipment, saddlery and resting places; spores survive in the environment | verified | S107 (an outbreak in camels), general dermatophytosis | none |
| signs | Dry, round, hairless patches with grey crusts, usually not very itchy, on head, neck, shoulders, legs and flanks; commoner under three years | partially correct | S107 unreachable beyond metadata | Keep, but cite S107 once obtained. |
| diagnosis | The vet examines hairs and scrapings and cultures them | partially correct | standard mycological method; S107 not read | none required; cite S107 |
| prevention | Isolate, clean and disinfect, do not share gear between herds, improve nutrition and ventilation | verified | S107 (an outbreak implies these measures) | none |
| treatment approach | Many cases clear on their own; the vet may prescribe a topical or other antifungal | verified | safety rule | none |
| zoonotic advice | Passes to people, causing itchy ring-shaped patches; gloves, wash hands and clothes, see a doctor | verified | dermatophytosis is a well-established zoonosis; S107 is a camel outbreak | none |

## `nasalBot` — Nasal bot (camel nose fly)

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | Larvae of the fly *Cephalopina titillator* | verified | S87, S103 | none |
| transmission | The fly deposits larvae at the nostrils; they crawl up into the nasal passages and pharynx, grow, then drop out to pupate in the soil | verified | S87, S103 | none |
| signs | Nasal discharge, repeated sneezing, snoring, difficulty breathing, restlessness, poor appetite; very common in many regions | verified | S103 — 38.9 % of 870 camels examined in south-eastern Iran were infested | none |
| diagnosis | Signs and the fly season, sometimes larvae seen when sneezing; endoscopy or slaughter confirmation | verified | S103 | none |
| prevention | Fly control in season, and herd treatment on a vet-set programme | partially correct | S103 found the **highest** infection rate in winter, so the seasonal advice should not be stated as a simple "fly season" rule | AR: «لوحظ أعلى معدّل إصابة في الشتاء في دراسة إيران (S103)؛ فيُصاغ الموسم بحذر.» |
| treatment approach | The vet uses antiparasitics suitable for camels at the right point in the fly's cycle | verified | safety rule; S103 | none |

## `hydatid` — Hydatid cysts (echinococcosis)

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | *Echinococcus* larvae (in camels mostly *E. canadensis* G6); camel intermediate host, dog final host | partially correct | S104 identifies *Echinococcus granulosus* (3.7 % of 6,416 camels); S91 confirms several genotypes and the dog–herbivore cycle but does not put G6 in camels | AR: «يُقال: *Echinococcus granulosus* بالمعنى الواسع، والنمط المرتبط بالإبل هو G6/E. canadensis.» EN: "Say *E. granulosus* sensu lato, noting that G6/*E. canadensis* is the genotype associated with camels." |
| transmission | The camel swallows eggs with feed or water soiled by dog faeces; the cycle closes when dogs eat infected offal | verified | S91, S104 | none |
| signs | Usually none; found at slaughter, in the lungs first and then the liver; heavy infection can cause weakness or breathing trouble | verified | S104 (lungs 78.2 % vs liver 21.8 % of 238 infected camels), S86 (lungs 87.87 %) | none |
| diagnosis | Meat inspection, sometimes ultrasound in the live animal | verified | S91, S109 | none |
| prevention | Safe disposal of infected offal, never feed it to dogs, regular dog deworming under veterinary advice, keep dogs from feed and water | verified | S91 (prevention focuses on dog deworming and slaughterhouse hygiene) | none |
| treatment approach | Not usually treated in camels; control targets the dog–offal cycle; the meat inspector condemns affected organs | verified | S91, S104 | none |
| zoonotic advice | Not directly from camel meat, but from tapeworm eggs in dog faeces; wash hands after dogs, wash vegetables, never feed raw offal to dogs, deworm dogs | verified | S91 | none |

## `cla` — Caseous lymphadenitis (abscesses)

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | *Corynebacterium pseudotuberculosis* | verified | S105 (biovar ovis confirmed by 16S rRNA sequencing) | none |
| transmission | Mostly through skin wounds, sometimes by swallowing or breathing it in; pus from burst abscesses spreads it | verified | S105 | none |
| signs | Abscesses in the lymph nodes in front of the shoulder, in the neck, under the jaw and behind the stifle, which may burst with thick yellowish pus; internal abscesses in lungs, liver and kidneys | verified | S105 (multiple caseous abscesses in liver, lungs, muscle and lymph nodes) | none |
| diagnosis | A sterile sample of pus for culture | verified | S105 (bacteriology and molecular confirmation) | none |
| prevention | Isolate affected animals, never open abscesses in the pasture, disinfect tools and pens, avoid wounds; vaccines exist in some markets | partially correct | `project src mci` is a vaccine-product page, not a trial | Keep, but cite a peer-reviewed CLA vaccine trial if available. |
| treatment approach | The vet decides how to handle the abscess and disposes of the pus safely | verified | safety rule; S105 | none |
| zoonotic advice | Rarely infects people through cuts; gloves, never touch pus bare-handed, see a doctor if a lymph node swells | verified | S105 ("chronic zoonotic bacterial disease … affects livestock and humans") | none |

## `enterotox` — Enterotoxaemia (clostridial disease)

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | Toxins of *Clostridium perfringens* multiplying in the gut | verified | S106 (enterotoxins detected in rumen, intestinal content and intestinal wall) | none |
| transmission | The bacteria are already in the gut and soil; sudden diet change, overeating or another illness sets off their growth | verified | S106 (significant association with age and feeding habits) | none |
| signs | Sometimes sudden death without warning; or colic, bloating, diarrhoea that may be bloody, trembling, staggering and nervous signs | verified | S106 (sudden death, incidence 15 % of 340 she-camels) | none |
| diagnosis | From the history, signs and post-mortem, with laboratory confirmation of the toxins | verified | S106 (ELISA toxin detection) | none |
| prevention | Change diets gradually, avoid excess concentrate, vaccinate with toxoid vaccines on the vet's programme | verified | S106; `project src mci` | none |
| treatment approach | An emergency: call the vet at once; survival depends on speed | verified | safety rule; S106 | none |

## `impaction` — Impaction (plastic and sand)

| aspect | claim (short) | verdict | evidence | suggested correction |
|---|---|---|---|---|
| cause | Swallowed plastic bags, rope and litter, or sand taken with feed, building into masses | verified | S96 (plastics, cloths, sand, mud, wool balls, glass, metal removed at surgery/post-mortem), S101, S102 | none |
| transmission | Not contagious; a UAE programme evaluated about 30,000 camels since 2008, about 300 deaths from plastic masses, some weighing 53 kg | verified | S101 — "more than 30,000 camels since 2008, 300 documented deaths contributed to polybezoars … weighing from 6.2–53.6 kg" | none; optionally add the same paper's estimate of about 1 % regional mortality. |
| signs | Poor appetite, gradual wasting, bloating and colic, little or no dung | verified | S96 (loss of body condition, regurgitation, decreased or absent faeces) | none |
| diagnosis | The vet examines the abdomen, may use ultrasound or X-ray; sometimes only surgery confirms | verified | S96 (ultrasound localises occluding intestinal foreign bodies, but not those in the rumen; sand impaction appears as acoustic enhancement) | none |
| prevention | Keep litter and plastic out of pastures and camp sites; feed from clean troughs off the sand | verified | S96, S101 | none |
| treatment approach | Depending on the case, the vet decides on medical treatment or surgery | verified | safety rule; S96 (rumenotomy/laparotomy in the study) | none |

## Health audit totals

| verdict | rows |
|---|---|
| verified | 111 |
| partially correct | 24 |
| incorrect | 0 |
| unsupported | 1 |
| **total health claim rows** | **136** |

The single unsupported row is the **ringworm cause** (the two *Trichophyton* species), which rests on a
paywalled paper reached only as metadata. Nothing on the health cards was found to be outright wrong —
the corrections above are additions of missing detail (the commonest mastitis pathogens, *Salmonella* in
calf diarrhoea, no validated pneumo-/enteritis vaccine) and softening of unsourced specifics (the tick
and rain associations in camelpox, the risk groups in heat stress, the *Calotropis* and season claims).
