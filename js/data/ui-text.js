import { L } from '../app.js';

const UI = {
  title: L('هندسة الناقة', 'The Engineering of the Camel'),
  sceneAria: L('مشهد ثلاثي الأبعاد لناقة وحيدة السنام في الصحراء. اسحب للدوران، وقرّب بالعجلة أو بإصبعين.', 'A 3D scene of a dromedary in the desert. Drag to orbit; scroll or pinch to zoom.'),
  homeAria: L('العودة إلى المقدمة', 'Back to the introduction'),
  chaptersAria: L('الفصول', 'Chapters'),
  search: L('ابحث', 'Search'), searchTitle: L('ابحث في الأطلس', 'Search the atlas'), searchPh: L('ابحث عن عضو أو مرض أو فكرة…', 'Search an organ, a disease, an idea…'),
  searchNone: L('لا نتائج. جرّب كلمة أخرى.', 'Nothing found. Try another word.'),
  tour: L('جولة', 'Tour'), tourExit: L('إنهاء', 'Exit'), prev: L('السابق', 'Back'), next: L('التالي', 'Next'), done: L('انتهت', 'Done'),
  keysTitle: L('الاختصارات', 'Keyboard shortcuts'), panelTitle: L('إظهار اللوحة أو إخفاؤها', 'Show or hide the panel'), sheetAria: L('اسحب لتغيير حجم اللوحة', 'Drag to resize the panel'),
  loading: L('نجهّز القافلة…', 'Saddling up the caravan…'),
  ldTex: L('الصور الفوتوغرافية للرمل والصخر', 'Photographic textures'),
  ldSteps: [L('نحمّل المحرّك', 'Loading the engine'), L('نرسم الكثبان', 'Drawing the dunes'), L('ننحت الناقة', 'Sculpting the camel'), L('نشدّ العظام والأوتار', 'Rigging bones and tendons'), L('نضبط الضوء', 'Setting the light')],
  errThree: L('تعذّر تحميل مكتبة الرسم ثلاثي الأبعاد. تحقّق من الاتصال ثم أعد تحميل الصفحة.', 'The 3D library could not be loaded. Check your connection and reload the page.'),
  errGL: L('متصفحك لا يدعم WebGL2، وهو لازم لهذا الأطلس.', 'Your browser does not support WebGL2, which this atlas needs.'),
  roBody: L('حرارة جسمها', 'Her body'), roAir: L('الهواء', 'Air'), roSaved: L('عرقٌ لم يُنفَق', 'Sweat saved'), roStatus: L('الحالة', 'Status'),
  playAria: L('تشغيل اليوم أو إيقافه', 'Play or pause the day'), dayAria: L('ساعة اليوم', 'Time of day'), backDay: L('رجوع للنهار', 'Back to daytime'),
  deg: L('°م', '°C'), litre: L('لتر', 'L'), dawn: L('فجر', 'dawn'), noon: L('ظهر', 'noon'), dusk: L('غروب', 'dusk'), midnight: L('منتصف الليل', 'midnight'),
  st: [L('آمنة', 'Safe'), L('انتباه', 'Caution'), L('خطر', 'Danger')],
  showMore: L('اقرأ', 'Read'), sources: L('المصادر', 'Sources'),
  vet: L('للتشخيص والعلاج: راجع طبيبًا بيطريًا مرخّصًا. لا تعطِ أي دواء أو جرعة دون إشرافه.', 'For diagnosis and treatment, consult a licensed veterinarian. Do not give any medicine or dose without their supervision.'),
  zoo: L('ينتقل إلى الإنسان', 'Can infect people'), zooAdvice: L('احمِ نفسك', 'Protect yourself'),
  flags: { vaccine: L('له لقاح', 'Vaccine exists'), novax: L('لا لقاح مرخّص', 'No licensed vaccine') },
  hdr: { cause: L('السبب', 'Cause'), spread: L('كيف ينتقل', 'How it spreads'), signs: L('العلامات', 'Signs'), dx: L('كيف يُشخَّص', 'How it is diagnosed'), prev: L('الوقاية', 'Prevention'), tx: L('ما يفعله الطبيب البيطري عادةً', 'What a veterinarian typically does') },
  toast: {
    drink: L('تشرب… نحو مئة لتر في عشر دقائق (مُسرَّعة)', 'Drinking… about 100 L in ten minutes (sped up)'),
    storm: L('عاصفة رملية: المنخران يُغلقان والجفن الثالث يمسح العين', 'Sandstorm: nostrils seal, the third eyelid sweeps the eye'),
    couch: L('تبرك: الرسغان أولًا، ثم الخلفيتان، ثم الصدر', 'Couching: carpi first, then the hind legs, then the chest'),
    rise: L('تنهض: الخلفيتان أولًا، ثم الأماميتان', 'Rising: hind legs first, then the front'),
    adult: L('الأطلس التشريحي مبنيّ على ناقة بالغة', 'The anatomy atlas is built on an adult female'),
    building: L('نبني الأعضاء والهيكل…', 'Building organs and skeleton…'),
    quality: L('خفّضنا جودة الرسم ليبقى المشهد سلسًا', 'Lowered render quality to keep things smooth'),
    link: L('نُسخ الرابط', 'Link copied'),
  },
  keys: [['/', L('البحث', 'Search')], ['1–8', L('الفصول', 'Chapters')], ['Space', L('تشغيل اليوم', 'Play the day')], ['← →', L('تحريك الساعة', 'Move the clock')], ['W', L('مشي / رهوان / وقوف', 'Walk / pace / stand')], ['K', L('بروك أو نهوض', 'Couch or rise')], ['D', L('اشرب', 'Drink')], ['S', L('عاصفة رملية', 'Sandstorm')], ['X', L('تفكيك الأعضاء', 'Explode organs')], ['L', L('الطبقة التالية', 'Next layer')], ['P', L('إخفاء اللوحة', 'Hide the panel')], ['T', L('الجولة', 'Tour')], ['Esc', L('إغلاق', 'Close')]],
  close: L('إغلاق', 'Close'),
  illustrative: L('العتبات هنا وسائل تعليمية تقريبية، لا حدود طبية.', 'These thresholds are rough teaching aids, not clinical limits.'),
};

/* the anatomy lab is the page; the other chapters sit in a secondary menu (more: true) */
const CHAPTERS = [
  { id: 'anatomy', n: '01', name: L('مختبر التشريح', 'Anatomy lab') },
  { id: 'health', n: '02', name: L('الصحة والأمراض', 'Health atlas') },
  { id: 'sources', n: '03', name: L('المصادر', 'Sources') },
  { id: 'movement', n: '04', name: L('الحركة', 'Movement'), more: true },
  { id: 'climate', n: '05', name: L('الحرّ والبرد', 'Heat & cold'), more: true },
  { id: 'life', n: '06', name: L('مراحل العمر', 'Life stages'), more: true },
  { id: 'prevention', n: '07', name: L('الوقاية والتطعيم', 'Prevention'), more: true },
  { id: 'home', n: '08', name: L('عن الأطلس', 'About'), more: true },
];
const MORE = L('المزيد', 'More');

const HOME = {
  kicker: L('أطلس تفاعلي', 'An interactive atlas'),
  hook: L('يعرف الجميع أن الناقة تصبر على العطش. قليلون يعرفون كيف. هذا الأطلس يفتح جسدها طبقةً طبقة: كيف تخزّن الحرّ، وتمشي على الرمل، وتكبر، وتمرض، وكيف نحميها.',
    'Everyone knows the camel can go without water. Few know how. This atlas opens her body layer by layer: how she banks heat, walks on sand, grows up, falls ill — and how we keep her well.'),
  start: L('ابدأ الجولة (دقيقتان)', 'Take the 2-minute tour'), explore: L('افتح مختبر التشريح', 'Open the anatomy lab'),
  what: L('في هذا الأطلس', 'Inside'),
  list: [
    [L('مختبر التشريح', 'Anatomy lab'), L('تسعة وثلاثون عضوًا: وظيفة كلٍّ منها وكيف يعمل وما يميّزه في الناقة، مع مصادره، مربوطةً بالأمراض التي تصيبه.', 'Thirty-nine organs: what each does, how it works and what is special in the camel, with sources, linked to the diseases that affect it.')],
    [L('الحركة', 'Movement'), L('المشي والرهوان بالتصوير البطيء، والبروك والنهوض.', 'Walk and pace in slow motion; couching and rising.')],
    [L('الحرّ والبرد', 'Heat & cold'), L('يوم صيفي وليلة شتوية، وحرارة جسمها لحظةً بلحظة.', 'A summer day and a winter night, her body temperature moment by moment.')],
    [L('العمر والصحة', 'Age & health'), L('من الحُوار إلى المُسنّة، وأطلس للأمراض والوقاية.', 'From newborn to old age, a health atlas, and prevention.')],
  ],
  howto: L('اسحب للدوران، وقرّب بالعجلة أو بإصبعين. اضغط / للبحث.', 'Drag to orbit; scroll or pinch to zoom. Press / to search.'),
  model: L('الناقة هنا منحوتة بالرياضيات: أنثى بالغة، نحو ١٫٨٥ م عند الغارب، في رمال الدهناء تحت شمس الرياض الحقيقية. التشريح مبسّط للتعلّم وليس مرجعًا سريريًا.',
    'The camel here is sculpted in maths: an adult female, about 1.85 m at the withers, on the red sands east of Riyadh under the real sun. The anatomy is simplified for learning, not a clinical reference.'),
};

export { UI, CHAPTERS, HOME, MORE };
