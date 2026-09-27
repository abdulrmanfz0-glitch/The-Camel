import { ATLAS, DIS_MAP, HEALTH, HEALTH_V3, L, SOURCES } from '../app.js';

/* sources for v3 */
const SOURCES_V3 = [
  ['nasalbot', 'health', 'Nasopharyngeal myiasis due to Cephalopina titillator in southeastern Iran: prevalence, histopathology and molecular assessment (2023). PMC.', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10182203'],
  ['ringworm', 'health', 'An outbreak of dermatophytosis in camels (Camelus dromedarius) at Qassim Region, Central Saudi Arabia. Journal of Applied Animal Research.', 'https://www.tandfonline.com/doi/full/10.1080/09712119.2015.1021806'],
  ['hydatid', 'health', 'Prevalence and bacterial isolation from hydatid cysts in dromedary camels slaughtered at Sharkia abattoirs, Egypt. PMC.', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7921257/'],
  ['whoEchino', 'health', 'WHO fact sheet: Echinococcosis.', 'https://www.who.int/news-room/fact-sheets/detail/echinococcosis'],
  ['cla', 'health', 'Pathology, bacteriology and molecular studies on caseous lymphadenitis in Camelus dromedarius in the Emirate of Abu Dhabi, UAE, 2015–2020. PLOS One / PMC.', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8186769/'],
  ['entero', 'health', 'Sudden death due to enterotoxemia among Arabian camels and associated risk factors (2024). PMC.', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11415913/'],
  ['plastic', 'health', 'Eerkes-Medrano D et al. (2020). The plight of camels eating plastic waste. Journal of Arid Environments.', 'https://www.sciencedirect.com/science/article/abs/pii/S0140196320302731'],
  ['thyroid', 'phys', 'Yagil R et al. (1978). Camel thyroid metabolism: effect of season and dehydration. Journal of Applied Physiology.', 'https://pubmed.ncbi.nlm.nih.gov/711570/'],
  ['pancreas', 'anat', 'Preliminary ultrasonography study of the pancreas in the dromedary camel (2025). Frontiers in Veterinary Science / PMC.', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11836821'],
  ['lymph', 'anat', 'Abdel-Magied EM et al. (2001). The parotid, mandibular and lateral retropharyngeal lymph nodes of the camel. Anatomia, Histologia, Embryologia.', 'https://onlinelibrary.wiley.com/doi/10.1046/j.1439-0264.2001.00308.x'],
  ['udder', 'anat', 'FAO: Camels and camel milk — the udder (four quarters, teats with two orifices) and milk let-down.', 'https://www.fao.org/4/x6528e/x6528e02.htm'],
  ['poll', 'anat', 'Immunohistochemical studies on the poll gland of the dromedary camel during the rutting season. PubMed.', 'https://pubmed.ncbi.nlm.nih.gov/21855116/'],
  ['texBabylon', 'env', 'Sand, gravel, silt-crust, rock and bark textures: Babylon.js Assets (CC BY 4.0), re-encoded to WebP.', 'https://github.com/BabylonJS/Assets'],
  ['preetham', 'env', 'Preetham AJ, Shirley P, Smits B (1999). A practical analytic model for daylight (as implemented in the three.js Sky example).', 'https://github.com/mrdoob/three.js/blob/r170/examples/jsm/objects/Sky.js'],
];
SOURCES.push(...SOURCES_V3);
HEALTH.list.push(...HEALTH_V3);
HEALTH.list.forEach(d => { const m = DIS_MAP[d.id]; d.org = m ? m.org : []; d.vis = m ? m.vis : []; d.cam = m && m.cam; });
HEALTH.orgLabel = L('الأعضاء المعنيّة', 'Organs involved');
/* organ → diseases, derived */
for (const id in ATLAS.organs) { ATLAS.organs[id].id = id; ATLAS.organs[id].dis = HEALTH.list.filter(d => d.org.includes(id)).map(d => d.id); }
for (const s of ATLAS.systems) for (const o of s.organs) ATLAS.organs[o].sys = s.id;
