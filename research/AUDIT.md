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
| verified | 36 | 7 | 43 |
| partially correct | 14 | 3 | 17 |
| incorrect | 2 | 0 | 2 |
| unsupported | 12 | 1 | 13 |
| **total claims checked** | **64** | **11** | **75** |

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
| lungs | Spongy, without deep external fissures; the right lung has a small accessory lobe | unsupported | None reached in round 2 (S46 is an ultrasound review; the fissure/lobe detail was not in it) | Cite a lung anatomy or imaging source, or drop the fissure/lobe sentence. AR: «الرئتان تحتاجان مصدرًا تشريحيًّا لوصف الشقوق والفصّ الإضافي». |
| lungs | The lung is the camel organ most often affected by hydatid cysts | verified | S86 — in 152 slaughtered dromedaries the lungs held 87.87 % of hydatid infections | none |
| heart | It lies low in the chest between the elbows | unsupported | S26 (sectional anatomy of the ventricles) does not state the topographic position in the paper reached | Cite S26 or an ultrasound/cadaveric topography source. |
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
| lungs | Her lungs are spongy and lack the deep external fissures that divide the lobes in many mammals, but the right lung has a small accessory lobe around the caudal vena cava | unsupported | No source reached in round 2 | Same correction as the lungs organ card: cite an anatomy/imaging source or drop it |
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
