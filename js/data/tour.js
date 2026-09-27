import { L } from '../app.js';

/* ─────────────────────────── the guided tour (~2 minutes) ─────────────────────────── */
const TOUR = [
  { ch: 'home', title: L('ناقة وحيدة السنام', 'A dromedary'), text: L('أنثى بالغة في آخر النهار. كل ما في جسدها، من الخفّ إلى السنام، إجابة عن سؤال واحد: كيف تعيش حيث يشحّ الماء؟', 'An adult female at the end of the day. Everything in her body, from foot to hump, answers one question: how do you live where water is scarce?') },
  { ch: 'anatomy', topic: 'hump', title: L('السنام دهن', 'The hump is fat'), text: L('ليس ماءً ولا عظمًا. جمعُ الدهن في مكان واحد يترك بقية الجسد بلا عازل، فيسهل عليه طرح الحرارة.', 'Not water, not bone. Keeping the fat in one place leaves the rest of the body uninsulated, so it sheds heat more easily.') },
  { ch: 'climate', topic: 'hetero', title: L('تخزّن الحرّ', 'She banks the heat'), text: L('حين تعطش، تترك حرارتها ترتفع نهارًا بأكثر من ست درجات بدل أن تتعرّق، ثم تطرحها ليلًا. هذا يوفّر لترات من الماء كل يوم.', 'When thirsty she lets her temperature rise more than 6 °C by day instead of sweating, then sheds it at night — litres of water saved every day.') },
  { ch: 'anatomy', topic: 'nose', title: L('أنفٌ يستردّ الماء', 'A nose that takes water back'), text: L('محارات ملتفّة تبرّد الزفير وتلتقط بخاره قبل أن يخرج.', 'Rolled turbinates cool each outgoing breath and catch its vapour before it leaves.') },
  { ch: 'movement', topic: 'storm', title: L('في العاصفة', 'In the storm'), text: L('يغلق المنخران، وتتشابك الرموش، ويمسح الجفن الثالث العين.', 'The nostrils seal, the lashes interlock, the third eyelid wipes the eye.') },
  { ch: 'movement', topic: 'drink', title: L('مئة لتر', 'A hundred litres'), text: L('تشرب في دقائق ما يقتل حيوانات أخرى، لأن كرياتها البيضاوية تنتفخ ولا تنفجر.', 'She drinks in minutes what would kill other animals, because her oval red cells swell without bursting.') },
  { ch: 'anatomy', topic: 'stomach', title: L('ثلاث حجرات', 'Three compartments'), text: L('تجترّ كالبقرة، لكن معدتها ثلاث حجرات وتطوّرت مستقلة: ليست من المجترّات الحقيقية.', 'She chews the cud like a cow, but her stomach has three compartments and evolved separately: she is not a true ruminant.') },
  { ch: 'movement', topic: 'pace', title: L('الرهوان', 'The pace'), text: L('قائمتا الجانب الواحد معًا، بالتصوير البطيء. لهذا تتمايل كالسفينة.', 'Both legs of one side together, in slow motion. That is why she rolls like a ship.') },
  { ch: 'movement', topic: 'couch', title: L('البروك', 'Couching'), text: L('على الرسغين أولًا، ثم الخلفيتين، ثم الصدر، وعلى كل موضع ارتكاز ثفنة متقرّنة.', 'Onto the carpi first, then the hind legs, then the chest — each contact point armoured with a horny pad.') },
  { ch: 'life', stage: 'newborn', title: L('الحُوار', 'The newborn'), text: L('يولد بلا مناعة تقريبًا؛ اللبأ في الساعات الأولى هو أول لقاح طبيعي له.', 'Born with almost no immunity; colostrum in the first hours is his first natural protection.') },
  { ch: 'health', title: L('صحتها وصحتنا', 'Her health, and ours'), text: L('بعض أمراض الإبل ينتقل إلى الإنسان. اغلِ الحليب، واغسل يديك، واستشر طبيبًا بيطريًا مرخّصًا دائمًا.', 'Some camel diseases pass to people. Boil milk, wash your hands, and always consult a licensed veterinarian.') },
];

export { TOUR };
