import { L } from '../app.js';

/* symptom finder: visible signs → conditions to raise with a veterinarian */
const SYMPTOMS = {
  title: L('باحث العلامات', 'Symptom finder'),
  lede: L('اختر ما تراه على الناقة، فتظهر الأمراض التي تشترك في هذه العلامات. هذا يساعدك على وصف ما تراه للطبيب البيطري، ولا يشخّص شيئًا.', 'Pick what you can see on the camel to list the conditions that share those signs. It helps you describe what you see to a veterinarian; it diagnoses nothing.'),
  warn: L('لا يستطيع التشخيصَ إلا طبيبٌ بيطري يفحص الحيوان، وقد يحتاج إلى فحوص مخبرية. العلامات تتشابه بين أمراض كثيرة، وبعضها خطير أو ينتقل إلى الإنسان. عند النفوق المفاجئ أو صعوبة التنفّس أو تغيّر السلوك أو الشلل: اتصل بالطبيب البيطري فورًا، وأبعد الناس عن الحيوان.', 'Only a veterinarian examining the animal can diagnose, often with laboratory tests. Signs overlap between many diseases, and some are serious or pass to people. For sudden death, breathing distress, changed behaviour or paralysis: call a vet at once and keep people away from the animal.'),
  none: L('لم تختر علامة بعد.', 'No sign picked yet.'),
  match: L('علامات مطابقة', 'matching signs'), clear: L('مسح', 'Clear'),
  signs: [
    ['fever', L('حمّى وخمول', 'Fever and dullness'), ['surra', 'camelpox', 'respiratory', 'heatStress', 'enterotox', 'rabies', 'mastitis']],
    ['wasting', L('هزال وضعف', 'Weight loss, weakness'), ['surra', 'parasites', 'impaction', 'dental', 'ticks', 'mange', 'hydatid', 'cla']],
    ['pale', L('شحوب الأغشية (فقر دم)', 'Pale gums (anaemia)'), ['surra', 'parasites', 'ticks']],
    ['oedema', L('تورّم أسفل البطن أو القوائم', 'Swelling under the belly or legs'), ['surra', 'parasites']],
    ['nasal', L('سيلان من الأنف', 'Nasal discharge'), ['mers', 'respiratory', 'nasalBot', 'camelpox']],
    ['cough', L('سعال أو صعوبة في التنفّس', 'Cough or laboured breathing'), ['respiratory', 'nasalBot', 'hydatid', 'heatStress']],
    ['sneeze', L('عطس متكرّر أو شخير', 'Repeated sneezing or snoring'), ['nasalBot']],
    ['itch', L('حكّة واحتكاك', 'Itching and rubbing'), ['mange', 'ticks']],
    ['hairloss', L('تساقط الوبر وقشور', 'Hair loss and crusts'), ['mange', 'ringworm', 'camelpox']],
    ['rings', L('بقع دائرية خالية من الوبر', 'Round hairless patches'), ['ringworm']],
    ['pocks', L('بثور وقشور على الشفتين والمنخرين والجفون', 'Pocks and scabs on lips, nostrils or eyelids'), ['camelpox']],
    ['lumps', L('كتل أو خراجات تحت الجلد', 'Lumps or abscesses under the skin'), ['cla', 'camelpox']],
    ['nodes', L('تضخّم العقد اللمفاوية', 'Swollen lymph nodes'), ['cla', 'camelpox', 'surra']],
    ['ticksSeen', L('قراد ظاهر على الجلد', 'Ticks visible on the skin'), ['ticks']],
    ['diarrhoea', L('إسهال', 'Diarrhoea'), ['calfDiarrhea', 'parasites', 'enterotox', 'poison']],
    ['colic', L('انتفاخ أو مغص أو قلّة البعر', 'Bloating, colic or little dung'), ['impaction', 'enterotox', 'poison']],
    ['sudden', L('نفوق مفاجئ', 'Sudden death'), ['enterotox', 'poison', 'heatStress']],
    ['abortion', L('إجهاض أو احتباس المشيمة', 'Abortion or retained placenta'), ['brucellosis', 'surra']],
    ['udder', L('ضرع متورّم أو حليب متغيّر', 'Swollen udder or changed milk'), ['mastitis']],
    ['lame', L('عرج أو جرح في الخفّ', 'Lameness or a foot wound'), ['foot']],
    ['drool', L('سيلان اللعاب أو صعوبة المضغ', 'Drooling or difficulty chewing'), ['dental', 'rabies', 'camelpox', 'poison']],
    ['behaviour', L('تغيّر السلوك أو عدوانية أو شلل', 'Changed behaviour, aggression or paralysis'), ['rabies', 'enterotox', 'poison']],
    ['heat', L('لهاث أو انهيار في الحرّ', 'Heavy breathing or collapse in the heat'), ['heatStress']],
  ],
};

export { SYMPTOMS };
