# NOTES — uncertainties, conflicts and deliberate omissions

Mission scope: research only, written exclusively inside `research/`. No other file in the project was
modified or read in full.

## 1. Workspace findings that affected the work

* **No project codebase was present.** The working directory `research-mission-dromedary-camel-physiology-dataset`
  contained only `outputs/` and `work/`, there was no `.git` directory anywhere under
  `C:\Users\abdof\Documents`, and no files matched `camel`, `organ` or `physiolog`. There was therefore
  nothing to grep for the project's existing organ ids (the mission allowed grepping for ids but forbade
  reading code files in full).
  * **Assumption made:** organ ids were invented as clean lowercase English slugs
    (`heart`, `lungs`, `trachea`, `nasal_passages`, `esophagus`, `stomach_c1`, `stomach_c2`, `stomach_c3`,
    `small_intestine`, `large_intestine`, `liver`, `pancreas`, `spleen`, `kidneys`, `bladder`, `hump`,
    `brain`, plus `mouth`, `salivary_glands`, `blood`, `skin`). If the real project already uses other ids,
    they should be mapped instead of regenerated.
  * **Consequence for git:** with no repository and no configured remote, the requested branch
    `claude/camel-engineering-3d-ro7l51` had to be created locally by initialising a repository in the
    mission folder. A push is impossible from this machine (no remote, and outbound network is blocked in
    the sandbox). The commit is left in place; see the final report.
* **Network:** the sandbox blocks outbound sockets, so all reading was done through the in-app browser.
  Publisher pages behind a bot check (for example the Slovenian Veterinary Research article page) could not
  be opened, and that is recorded below rather than guessed around.

## 2. `environment` pseudo-node

`mouth`, `nasal_passages`, `skin` and `large_intestine` exchange material with the outside world. The
deliverable's flows require organ ids, so the pseudo-node `environment` is used for "outside the body"
(food coming in, air coming in and out, sweat, urine, faeces leaving). It is not an organ and has no entry
in `organs`.

## 3. Source conflicts and how they were handled

1. **Three stomach compartments or four?** Most of the literature used here describes the dromedary
   stomach as **three-chambered (C1, C2, C3) because there is no omasum** (S12 university teaching;
   S13 FAO AGRIS record; S44 Arabic reference work; S07 notes the "currently predominant opinion" of three
   compartments). A review found during the search
   ("Morphology of the dromedary camel stomach with reference to physiological adaptation", Slovenian
   Veterinary Research) was reported to state that *some* authors record four compartments (C1-C4) and that
   the Bactrian camel stomach has been described as a single cavity. **That article could not be opened**
   (the site returned a robot check), so its argument is recorded here as an unresolved disagreement and
   **no four-compartment claim was added** to `physiology.json`. Same for the widely repeated "C1/C2/C3 =
   rumen/reticulum/abomasum" mapping, which is a functional analogy rather than a settled nomenclature.
2. **Selective brain cooling.** S24 (review) describes selective brain cooling in the camel via the carotid
   rete and cooled nasal venous blood. S23 (experimental, heat-stressed camels) found brain temperature
   usually **0.2-0.5 °C above** body temperature with only occasional reversals, and concluded that
   turbinate vasoconstriction in a hot environment **prevents** brain cooling by the carotid rete. Both are
   reported; `brain` is therefore `medium` confidence and the conflict is stated inside the entry.
3. **Nasal moisture recovery — how large?** S21 reports a saving of about **60 %** of respiratory water
   relative to exhaling saturated air at body temperature, and exhaled humidity falling to about **75 %**
   at night. S23, working under different (chamber) conditions, found exhaled air "almost always
   unsaturated" with no systematic effect of dehydration. The two agree that water is reclaimed; the
   magnitude clearly depends on conditions, and the 60 % figure is presented as a measurement from one
   research group, not as a constant.
4. **The hump and "water sacs" myths.** The idea that the hump stores water, and the older idea that the
   saccules of C1 are "water sacs", are both contradicted by the sources used (S38/S39 for hump fat
   composition; S44 stating explicitly that the water-sac idea was disproved; S12 for the saccule
   histology). The dataset presents the hump as a fat store and C1 saccules as absorptive/fermentative
   structures. Metabolic water from fat oxidation is a real phenomenon but is described as water produced
   on demand, not stored water.
5. **Dehydration tolerance.** S44 states the camel can lose about 25 % of body mass without severe harm and
   can drink roughly 100 L in under a quarter of an hour; the experimental paper S04 reports about **97 L
   within a few minutes** after 11 days of water deprivation. The experimental figure is used in the data
   file (97 L) because it is a direct measurement for dromedaries; the ~100 L statement is retained in
   `NOTES.md` only as corroboration.
6. **Body temperature range.** 34-41 °C comes from the Arabic reference work S44 and is consistent with
   S20's report of fluctuations up to 7 °C in dehydrated camels. S25 discusses the same heterothermy in
   arid-zone mammals generally. It is a daily range, not a fixed set point, and the dataset says so.

## 4. Numbers policy compliance

Every number in `physiology.json` was traced back to a source that states it **for dromedaries** (or, where
noted, for camelids/camels generally). Figures that are estimates from very small samples are flagged in
the entry itself:

* heart weight `3.1 ± 0.189 kg` — **six hearts** (S26); no body weights reported, so no "relative to body
  size" ratio was computed.
* tracheal rings `66-75` and mucosal + submucosal thickness `517.2 ± 61.6 µm` — S15, 20 samples.
* pancreatic body thickness `3.60 ± 0.24 cm` — S40, 14 young camels of 22 animals total.
* rumination figures (`8.3 h/day`, `67 boluses/h`, `45 s/bolus`, `68 chews/min`) — S01, five camels.
* saliva flow `2 L/h` on day 11 of water deprivation — S04.
* blood-cell area `~15 µm²` in 0.9 % NaCl, intact down to `0.25 %` NaCl — S29, three camels.

## 5. Facts deliberately left out (not verifiable in the sources reached)

* **Resting heart rate / respiratory rate reference values for dromedaries.** The searches surfaced either
  ostrich data, retracted papers (see below), or non-authoritative web pages. Because the numbers policy
  forbids borrowing general-mammal values, `animation_cues` describe rhythm rather than a rate. The
  respiratory-frequency range 4-28/min is only used where S20 states it for camels under its experimental
  conditions, and is not presented as a normal resting value.
* **Urine osmolality / specific gravity numbers.** The concentration phenomenon is well supported (S32,
  S44), but no camel-specific osmolality figure was reached from an authoritative source.
* **Bladder capacity** — no sourced value found.
* **Small-intestine and total gut length in metres.** Only proportional data (S11: caecum = 3.2 % of large
  intestine length, 1 % of combined small + large intestine) were available.
* **Stomach compartment volumes in litres.** Searches for compartment volume returned no citable primary
  measurement, so only the qualitative "C1 is the largest, C2 the smallest" statement is given.
* **Rumen/forestomach fluid volume in litres** — S04 reports changes in forestomach fluid volume during
  water deprivation but the abstract does not give absolute volumes; only the percentage changes
  (dilution rate to 31 %, mean retention to 189 %, hay intake to 9.6 % of control) were extracted.
* **Camel lung weight or volume in adults.** S19 gives fetal lung weight/volume regressions against body
  length, not an adult absolute size, so lung size is described qualitatively.

## 6. Sources deliberately excluded

* **Retracted work:** "Physiological stage dependent hematobiochemical and echocardiographic changes in
  dromedary camels" (BMC Vet Res 2025) carries a retraction notice in BMC Vet Res 2026. It was excluded
  from the source list entirely, even though it appeared high in the search results and would have provided
  convenient heart-rate numbers.
* **Blogs, content farms, forums, social posts and AI-generated pages** — excluded as instructed (several
  appeared in the top web results for camel heart rate and nasal moisture).
* **ResearchGate / Scribd copies** of otherwise good papers — excluded in favour of the publisher or PubMed
  record for the same work.
* **Arabic-language material.** The mission asked for reputable Arabic academic sources "where relevant".
  Two Arabic university PDFs were found (Hama University, Faculty of Agriculture: camel production and
  camel behaviour/husbandry lectures) but their text could not be extracted — they are scanned documents and
  the sandbox has no network access for local PDF parsing. They are therefore **not cited for any claim**,
  and are mentioned here only for transparency. The Arabic sources actually used are:
  * **S44** الموسوعة العربية (هيئة الموسوعة العربية) — an Arabic reference work used for camel-specific
    statements (three-chambered stomach, no gallbladder, oval red cells, hump as fat store, 25 % mass loss,
    ~100 L intake, 34-41 °C body temperature, concentrated urine, dry faeces).
  * **S47** King Faisal University — Camel Research Center (Arabic institutional page) and **S48** FAO Arabic
    camelid portal: both are Arabic-language official/institutional sources, but they describe camels and
    camelid production in general terms only. They are listed in `SOURCES.md` as **context only** and are
    not attached to any anatomical or physiological claim (the validator reports them as declared-but-unused,
    which is intentional).
* The full Arabic text in `physiology.json` was written as original Modern Standard Arabic prose for a
  general audience, not as a literal translation of the English.

## 7. Things a reviewer should double-check first

1. Whether the project's real organ ids match the slugs chosen here.
2. The `brain` entry — it is the only entry where two high-quality sources disagree about direction of
   effect, and it is rated `medium` for that reason.
3. The `heart` numbers — six hearts, no body weights; useful but weak.
4. Whether the project wants `blood`, `salivary_glands` and `skin` as nodes at all; they were added because
   the water, blood and air journeys need them.
5. The three-vs-four compartment question, if a copy of the Slovenian Veterinary Research review can be
   obtained.

---

# Round 2 — inventory, id map, 19 new organs, and the fact-check

Round 2 had four jobs: (A) inventory the project atlas and map it to the round-1 research ids,
(B) research every project organ that had no research entry, (C) fact-check the project's organ texts,
and (D) — lower priority — look at the disease cards. Everything below was written to `research/` only.

## 1. What round 2 added

* `research/ID_MAP.json` — the full project inventory: **39 organs in 10 systems** with the atlas's own
  ids and names, the sex toggle (`testes`, `dulla`, `pollGlands` male-only; `uterus`, `ovaries`, `udder`
  female-only), and a one-to-one mapping to research ids. `physiology.json` now holds **40 organ
  entries**: the 21 from round 1 plus 19 new ones (`larynx`, `vessels`, `teeth`, `ureters`, `uterus`,
  `ovaries`, `udder`, `testes`, `dulla`, `eyes`, `ears`, `poll_glands`, `adrenals`, `thyroid`,
  `lymph_nodes`, `skeleton`, `muscles`, `coat`, `pads`).
* `research/AUDIT.md` — 75 claim-level verdicts (43 verified, 17 partially correct, 2 incorrect,
  13 unsupported) over the 39 organ cards and the 11 anatomy-chapter topics.
* `research/SOURCES.md` — S49 to S87 appended, with round-2 usage notes.

## 2. Assumptions and decisions

1. **New research ids follow the round-1 slug style** (`poll_glands`, `lymph_nodes`, `pads`, …) and are
   mapped to the project's camelCase ids in `ID_MAP.json`. The mapping is exact for most organs and
   "equivalent/partial" for a handful where the scopes differ.
2. **`salivary_glands` and `environment` remain research-only.** The atlas has no salivary-gland organ
   (saliva is folded into `mouth`) and `environment` is the outside-of-the-body pseudo-node, not an organ.
3. **`colon` maps to the round-1 `large_intestine`**, which covers the caecum and the colon. The project
   has no separate caecum organ, so the mapping is marked "partial" rather than "exact".
4. **`nose` maps to `nasal_passages`**; the atlas id is the outer organ, the research entry is the
   passage itself. Same structure, different granularity.
5. **Existing entries were not rewritten.** Where an existing entry needed a comment (for example the
   round-1 `nasal_passages.connected_organs` includes the non-organ id `environment`), it is recorded in
   `AUDIT.md` as a structural finding instead of being edited.
6. **Numbers policy unchanged.** Every number in the new entries is stated for dromedaries unless the
   entry says otherwise (Bactrian or guanaco). Where a number rests on a small sample it is flagged in
   the entry text.

## 3. Conflicts found in round 2

1. **Spleen shape (new — genuine conflict).** The atlas calls the spleen *sickle-shaped*. The
   peer-reviewed anatomy of 25 adult dromedary spleens describes it as **rectangular with a triangular
   cross-section**, rounded edges and a smooth, shiny surface (S30). The round-1 `spleen` entry already
   follows S30, so the atlas text is the outlier. Correction given in `AUDIT.md`.
2. **Hydatid cysts (new — the atlas is wrong).** The atlas says the liver is the "second commonest site
   of hydatid cysts"; in 152 slaughtered dromedaries the **lungs held 87.87 %** of infections and the
   **liver 9 %** ("liver infections were rare") (S86). The round-1 dataset had no hydatid figures at all.
   Correction given in `AUDIT.md` (it also applies to the `hydatid` disease card).
3. **Poll-gland secretion colour.** The atlas describes a brown secretion turning black and tarry. The
   dromedary source reached (S64) covers rutting-season histochemistry, while the camelid studies that
   describe the secretion itself (S65, S66) are on the **Bactrian** camel and describe a **pale-yellow,
   watery** fluid. The "tar-black" wording is therefore not supported for the dromedary.
4. **Three vs four stomach compartments.** Unchanged from round 1: the sources used still describe three
   compartments (S12, S13, S44); the Slovenian Veterinary Research review that raises the four-compartment
   reading could still not be opened. No four-compartment claim was added.
5. **Selective brain cooling.** Unchanged from round 1: S24 describes it, S23 found brain temperature
   usually above body temperature in heat-stressed camels. Both are reported and the entry stays
   `medium` confidence; the project's wording ("the question is not settled") matches the sources.

## 4. What could not be verified (round-2 gaps)

These are in `AUDIT.md` as `unsupported` or `partially correct`. None of them means the project is wrong;
they are claims the sources reached this round do not settle:

1. **Thoracic, lumbar, sacral and caudal vertebral counts** (12 / 7 / 5 / 15–20). Only the **seven
   cervical vertebrae** could be verified for dromedaries (S81, plus the neck ≈ 46.7 % of the vertebral
   column). The rest of the formula in the atlas and in `anatomy.js` has no source reached.
2. **Jugular groove / venipuncture site** on the neck — no source reached in round 2.
3. **Lymph node length "about 9 cm"** — no camel measurement reached.
4. **The shorn-camel "about 50 % more water" figure** — the atlas tags it to the project's hair-follicle
   source, which does not contain it; the 1956 water-balance paper could not be re-opened.
5. **Cheek papillae**, **two rows of eyelashes and a third eyelid**, **hair-lined pinna folded back in a
   storm**, **callus pads on chest/elbows/knees/stifles**, **lung fissures and the right accessory lobe**,
   **the heart's low position between the elbows**, and **swallowed plastic/rope impaction of C1** — all
   plausible camel anatomy or clinical observation, but no source reached in round 2.
6. **"*Haemonchus longistipes* is the camel's most important worm"** — the location (glandular C3 /
   abomasum equivalent) is consistent with the literature, but the "most important" ranking, and the
   plastic-impaction and caseous-lymphadenitis organ links, still rest on project source keys that were
   not re-opened this round.
7. **Uterine laterality "≈ 95 % in the left horn"** — no source reached gives a camel-specific figure.
8. **Resting heart rate and respiratory rate** — still not verifiable from an authoritative dromedary
   source (unchanged from round 1).

## 5. Source-quality notes for round 2

* Three of the new sources describe the **Bactrian** camel, not the dromedary: S65 and S66 (poll-gland
  metabolism in the rut) and S68 (adrenal zonation). They are used only for the mechanism, and every
  entry that uses them says so or is rated `medium` confidence.
* S76 describes the **guanaco** digital cushion and is used only as the camelid comparison behind the
  `pads` entry; the dromedary foot material is S78.
* S81 and S83 are *Journal of Camel Practice and Research* papers whose **abstracts** were read from
  publisher metadata; the full texts are paywalled. They are used only for what the abstract states.
* S53 is a conference paper in an MDPI proceedings journal, but it is open access and is based on a
  month-by-month follow-up of 70 dromedaries. It is the **only** source reached that prints the full
  dromedary dental formula; the audit records that it is a single moderate-authority source.
* The IVIS chapters (S54, S85) are institution-hosted veterinary teaching chapters and were read in full
  on the open web page.
* **How the sources were reached.** The default sandbox blocks outbound sockets (`Invoke-WebRequest`
  failed with a socket-permission error). Reading was done with explicit, approved network access to the
  PubMed E-utilities API, the Europe PMC REST API, the Crossref REST API, IVIS, FAO AGRIS and PMC. MDPI
  and some other publishers returned HTTP 403, and the usual web-search pages were unusable (bot checks
  or region-dependent junk results), so literature was located through the PubMed/Europe PMC/Crossref
  APIs rather than through a search engine. Two paywalled items (the Springer large-camelids chapter S42
  and the *J Camel Pract Res* full texts) could not be read beyond abstracts/metadata.

## 6. Health content (Part D)

Part D was deliberately kept light. All 21 disease cards were checked mechanically: every one ends its
treatment line with a referral to a veterinarian or the veterinary authorities, and none contains a dose
or a numeric treatment protocol. Six cards (`surra`, `camelpox`, `brucellosis`, `mers`, `mange`,
`hydatid`) were spot-read for cause, transmission, signs and prevention and were consistent with the
project's own sources. The full claim-by-claim disease audit is not done and is the first item of round 3.

## 7. Round-3 checklist (supersedes the round-1 list)

1. Full disease-card audit (Part D), starting with the six cards already spot-read.
2. Source the unsupported claims listed in §4 above, beginning with the vertebral formula and the
   jugular groove, since those are anatomical facts the build team will want to keep.
3. Re-open the project source keys that this round could not (`plastic`, `haem`, `entero`, `calfD`,
   `cla`, `cchf`, `dehyd`, `nasalBot`, `legs`) and either confirm or replace them with S-numbered
   sources from `SOURCES.md`.
4. The three-vs-four compartment question, if the Slovenian Veterinary Research review can be obtained.

---

# Round 3 — health audit, topography, physiology rates, misconceptions, glossary

Round 3 had five jobs: (A, highest priority) audit all 21 disease cards, (B) build a topography file for
the 3D placement, (C) find dromedary physiology rates for the animation, (D) list misconceptions, and
(E) build an Arabic glossary. All five were delivered; what follows is what could not be settled.

## 1. What round 3 added

* `AUDIT.md` → new **Health** section: **136 claim rows** over the 21 cards — 111 verified,
  24 partially correct, **0 incorrect**, 1 unsupported — plus the project-wide re-check that every card
  still ends with a vet referral and that no card contains a dose or a protocol.
* `TOPOGRAPHY.json` → all 39 project organ ids with position, orientation, shape, approximate size and
  in-life colour/texture, each field carrying its own confidence and source ids.
* `physiology.json` → three verified rates written into the matching `animation_cues` (heart, C1, C2,
  mouth); the round-2 summary in `AUDIT.md` was updated after two rows were upgraded.
* `MISCONCEPTIONS.json` → 21 beliefs with the truth, the organ id and sources.
* `GLOSSARY.json` → all 39 organs with standard, alternative and (where sourced) traditional Arabic terms.
* `SOURCES.md` → S88–S110 (WHO fact sheets, the Saudi animal-health guide, ten camel papers, and the
  papers behind the project's own v3 keys).

## 2. Part C — the rates, and what was not found

| rate | value found | source | action |
|---|---|---|---|
| resting heart rate | **35–45 bpm at rest** | S108 (review of normal echocardiographic findings) | written into `heart.animation_cues` |
| forestomach C1/C2 contraction cycle | **cycle ≈ 5 min with 7 A-type and 5 B-type contractions and a pause of ≈ 2.3 min** | S05 (dromedaries) | written into `stomach_c1` and `stomach_c2` |
| rumination cycle | **8.3 h/day, ≈ 67 boluses/h, ≈ 45 s per bolus, ≈ 68 chews/min** | S01 (five camels) | written into `mouth.animation_cues` |
| resting respiratory rate | **not found** as a dromedary reference range | S20 gives 4–28/min only under its experimental conditions; S108 reports 10/min in one clinical case | **no number added**; the animation should keep describing rhythm, not a rate |

The resting respiratory rate remains the one gap. A 2025 preprint on vital signs in Sudanese dromedaries
(Research Square, `10.21203/rs.3.rs-5812412/v1`) appeared in the search but is **not peer reviewed**, so it
was not used under the mission's standards — it is noted here as a lead for round 4.

## 3. Retries on the round-2 "unsupported" rows

* **Upgraded to verified:** the lungs' lack of deep fissures and the right accessory lobe (S108).
* **Upgraded to partially correct:** the heart's position — S108 puts it between the 3rd and 6th ribs
  (3rd–5th intercostal spaces) against the **ventral third** of the chest wall, with the apex caudal and
  slightly left; "between the elbows" is still in no source.
* **Still unsupported after an explicit retry:** the thoracic/lumbar/sacral/caudal vertebral counts
  (12/7/5/15–20); the jugular groove as a venipuncture site; the lymph node "about 9 cm"; the shorn-camel
  "about 50 % more water"; the cheek papillae; the two rows of eyelashes and the third eyelid; the
  hair-lined pinna folded back in a storm; the callus pads on chest/elbows/knees/stifles; the withers
  spines of the first thoracic vertebrae; the uterine "≈ 95 % left horn"; and the "*Haemonchus
  longistipes* is the camel's most important worm" ranking. Search terms tried included "camel vertebral
  formula", "camel jugular venipuncture", "camel lymph node size", "shorn camel water", "camel
  eyelash/nictitating membrane" and "camel ear pinna anatomy" (the last two return the pinna and inner-ear
  papers already used, which do not contain the missing details).

## 4. Conflicts and findings from the health audit

1. **Heart weight conflict (new).** Round 1 recorded 3.1 ± 0.189 kg from six hearts (S26); S108 states
   "approximately 4–6 kg, about 0.7 % of body weight". These are probably different measurements
   (ventricular mass vs whole organ including epicardial fat), but it is a conflict and is listed on the
   `heart` row of `TOPOGRAPHY.json` and in `AUDIT.md` for the build team to reconcile.
2. **Mastitis pathogens.** S110 (390 lactating camels) shows *Streptococcus* spp. 26.1 % and *E. coli*
   25 % as the commonest isolates, with *S. agalactiae* the least frequent (5.5 %). The card names only
   staphylococci and streptococci; the correction is in `AUDIT.md`.
3. **Hydatid.** S104 (6,416 camels at Sharkia) gives lungs 78.2 % vs liver 21.8 %, which agrees with the
   round-2 correction (S86: lungs 87.87 %) and confirms that the liver is **not** the second commonest
   site in the sense the card used.
4. **Nasal bot season.** S103 found the highest infestation rate in **winter**, so the card's "fly
   season" advice should be phrased carefully.
5. **Ringworm.** The paper behind the project's own `ringworm` key (S107) is paywalled; only its
   title/metadata could be reached, so the card's two *Trichophyton* species remain **unsupported**.
6. **MERS.** WHO (S88) confirms dromedary camels are the primary reservoir, that infected camels usually
   show no signs, that there is no licensed vaccine or specific treatment, and that the project's human
   advice matches WHO's wording for people at greater risk.
7. **Impaction.** S101 confirms the card's numbers (more than 30,000 camels evaluated since 2008, 300
   documented deaths, gastroliths 6.2–53.6 kg) and adds an estimated ~1 % regional mortality.
8. **Camelpox, brucellosis and rabies** are on the Saudi notifiable-disease list (S93), which supports the
   cards' "inform the authorities" lines.

## 5. Source-access notes for round 3

* **The Saudi Ministry of Health web pages could not be opened from this environment.** The MOH awareness
  URLs tried returned HTTP 404, and the MOH sitemap (`sitemap0.xml`, 82 KB) contains no MERS, COVID or
  brucellosis awareness page. The human-health advice was therefore verified against **WHO fact sheets**
  (S88–S92) and the **Saudi national animal-health guide** issued by the Ministry of Environment, Water
  and Agriculture / Weqaya (S93). Round 4 should retry the MOH site, which appears to have been
  restructured.
* MDPI serves HTTP 403 to this environment, so open-access MDPI papers were read through their PubMed or
  PMC records where available.
* The classical Arabic chapter (`فقه اللغة وسر العربية`, الباب الخامس عشر) loaded on Wikisource but its
  body text could not be extracted this round, so the traditional terms in `GLOSSARY.json` come from the
  Arabic Encyclopedia (S44), the FAO Arabic camelid page (S48) and the IVIS soft-palate chapter (S85);
  three terms (الغارب، الثفنات، الكركرة) are marked `project:atlas.js` because they come from the project's
  own Arabic text and still need an independent lexical source.
* Everything else was read through approved network access to PubMed E-utilities, Europe PMC, Crossref,
  WHO, the FAO AGRIS record and the Saudi national documents portal.

## 6. Caveats on Parts B, D and E

* **TOPOGRAPHY.json** is honest about its weakest field: colour/texture in life is marked `low` almost
  everywhere because no dromedary source reached states organ colour. Position fields are `high` only
  where a dromedary source gives landmarks (heart, lungs, spleen, pancreas, uterus, ovaries, udder,
  testes, kidneys, nasal cavity, eye, ear, skeleton); the rest are `medium` or `low` and should be
  treated as modelling estimates.
* **MISCONCEPTIONS.json** has 21 items, but they cluster on 12 organs — that reflects where the evidence
  is, not an attempt to cover every organ.
* **GLOSSARY.json** is confident on standard terms and deliberately sparse on traditional ones, because
  a reputable herder-lexicon source was not reached. That is a round-4 task.

## 7. Round-4 checklist

1. Retry the Saudi MOH pages (MERS, brucellosis) and find the official Saudi brucellosis/MERS guidance.
2. Find a reputable Arabic source for traditional camel anatomical vocabulary (hers: classical lexicons,
   Saudi dictionaries, or the King Faisal University camel centre publications).
3. Source the remaining unsupported rows: the vertebral formula, the jugular groove, the lymph-node size,
   the shorn-camel figure, the eyelashes/third eyelid, the pinna hair-lining, the callus pads and the
   withers spines.
4. Obtain the full text of S107 (camel dermatophytosis, Qassim) to settle the *Trichophyton* species.
5. The four long-standing questions: three-vs-four stomach compartments; selective brain cooling; uterine
   laterality percentage; and the complete dromedary vertebral formula.
