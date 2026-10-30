/*
  Hindi for the Glossary page (app/[locale]/glossary) and its DefinedTermSet structured data.

  lib/seo/glossary.ts keeps the English exactly as it was (the llms.txt builder reads it). The Hindi sits in tables keyed
  by the English term id (terms), the English group title (groups) and the link address (links), never by position.
  A term, group or link with no entry here shows in English. glossaryFor() is what the page uses.
*/
import type { Copy } from '@/lib/i18n/copy'
import { GLOSSARY, GLOSSARY_UPDATED, GLOSSARY_TERM_COUNT, type GlossaryGroup } from '@/lib/seo/glossary'
import { glossarySchema } from '@/lib/seo/schema'
import { abs } from '@/lib/seo/site'
import type { Locale } from '@/lib/i18n/paths'

const en = {
  eyebrow: 'Reference',
  name: 'Construction glossary',
  blurb: (n: number) =>
    `${n} terms you meet in a construction quote, a bill of quantities or an IS-code calculation, such as BOQ, M20 concrete, TMT bar, RA bill and LPCD. Each one is defined the way NirmanShastra’s calculators use it, with the same numbers and IS codes.`,
  lastUpdated: 'Last updated',
  jump: 'Jump to a term',
  navAria: 'All glossary terms',
  noteTitle: 'A glossary is not a design',
}
const hi: typeof en = {
  eyebrow: 'संदर्भ',
  name: 'निर्माण शब्दावली',
  blurb: (n) =>
    `${n} शब्द जो आपको निर्माण के कोटेशन, बिल ऑफ़ क्वांटिटीज़ या IS कोड की गणना में मिलते हैं, जैसे BOQ, M20 कंक्रीट, TMT बार, RA बिल और LPCD। हर शब्द उसी तरह परिभाषित है जैसे NirmanShastra के कैलकुलेटर उसे इस्तेमाल करते हैं, उन्हीं आँकड़ों और IS कोड के साथ।`,
  lastUpdated: 'आख़िरी बार अपडेट',
  jump: 'किसी शब्द पर जाइए',
  navAria: 'शब्दावली के सभी शब्द',
  noteTitle: 'शब्दावली कोई डिज़ाइन नहीं है',
}
export const GLOSSARY_PAGE: Copy<typeof en> = { en, hi }

/** The closing note, in pieces so the link stays a real link. */
export const GLOSSARY_NOTE = {
  en: { a: 'Definitions explain how the terms are used in NirmanShastra’s tools. They are not a substitute for the Indian Standards themselves or for a structural engineer’s design. See the ', link: 'IS codes used', b: ' page for the full list of standards.' },
  hi: { a: 'परिभाषाएँ बताती हैं कि NirmanShastra के टूल में ये शब्द कैसे इस्तेमाल होते हैं। ये न स्वयं भारतीय मानकों का विकल्प हैं, न किसी स्ट्रक्चरल इंजीनियर के डिज़ाइन का। मानकों की पूरी सूची के लिए ', link: 'प्रयुक्त IS कोड', b: ' पेज देखिए।' },
}

export const GLOSSARY_META_HI = {
  title: `निर्माण शब्दावली: BOQ से TMT तक ${GLOSSARY_TERM_COUNT} शब्द`,
  description:
    'BOQ, M20, IS 456, TMT, BBS, RA बिल, रिटेंशन, LPCD, RCCB, अर्नड वैल्यू और अन्य शब्दों की सरल परिभाषाएँ, हर एक के साथ वह IS कोड और वह संख्या जो वह इस्तेमाल करता है।',
  imageAlt: 'NirmanShastra की निर्माण शब्दावली',
}

const GROUPS_HI: Record<string, { title: string; intro: string }> = {
  'Concrete and IS codes': { title: 'कंक्रीट और IS कोड', intro: 'कंक्रीट की मात्राओं, ग्रेड और जाँच के पीछे की शब्दावली।' },
  'Steel and reinforcement': { title: 'स्टील और सरिया', intro: 'सरिया मँगवाने, मोड़ने और जाँचने में आने वाले शब्द।' },
  'Structure and seismic design': { title: 'ढाँचा और भूकंपरोधी डिज़ाइन', intro: 'स्ट्रक्चरल अनुमानों और भूकंप के डिज़ाइन में आने वाले शब्द।' },
  Masonry: { title: 'चिनाई', intro: 'ईंट, ब्लॉक और मसाला।' },
  'Water and electrical': { title: 'पानी और बिजली', intro: 'प्लंबिंग और वायरिंग के शब्द।' },
  'Cost and contracts': { title: 'लागत और ठेके', intro: 'वे शब्द जो तय करते हैं कि आप कितना देंगे और कोटेशन कैसे बनता है।' },
  'Project control and labour': { title: 'प्रोजेक्ट कंट्रोल और मज़दूरी', intro: 'प्रगति पर नज़र रखना और मज़दूरों को भुगतान।' },
  Vastu: { title: 'वास्तु', intro: 'VastuPro में इस्तेमाल होने वाले शब्द।' },
}

const TERMS_HI: Record<string, { term: string; definition: string }> = {
  'is-code': {
    term: 'IS कोड',
    definition:
      'भारतीय मानक ब्यूरो (BIS) द्वारा प्रकाशित एक मानक। भारतीय मानक निर्माण में इस्तेमाल होने वाले तरीक़े, सामग्री के गुण और न्यूनतम ज़रूरतें तय करते हैं, जैसे सादे और प्रबलित कंक्रीट के लिए IS 456:2000।',
  },
  rcc: {
    term: 'RCC (रीइन्फ़ोर्स्ड सीमेंट कंक्रीट)',
    definition:
      'सरिये के चारों ओर ढाला गया कंक्रीट। कंक्रीट दबाव सहता है और स्टील खिंचाव, इसलिए दोनों मिलकर फुटिंग, कॉलम, बीम और स्लैब का भार उठाते हैं।',
  },
  'concrete-grade': {
    term: 'कंक्रीट ग्रेड (M20, M25)',
    definition:
      'कंक्रीट की मज़बूती का नाम। M के बाद की संख्या 28 दिन पर, 150 mm के क्यूब पर नापी गई कैरेक्टरिस्टिक कम्प्रेसिव मज़बूती है, N/mm² में, इसलिए M20 का मतलब है 20 N/mm²।',
  },
  'characteristic-strength': {
    term: 'कैरेक्टरिस्टिक स्ट्रेंथ',
    definition:
      'वह मज़बूती जिसके नीचे 5% से ज़्यादा जाँच नतीजे आने की उम्मीद नहीं होती। कंक्रीट का ग्रेड इसी मज़बूती के नाम पर होता है।',
  },
  'nominal-vs-design-mix': {
    term: 'नॉमिनल मिक्स और डिज़ाइन मिक्स',
    definition:
      'नॉमिनल मिक्स में आयतन के हिसाब से तय अनुपात होते हैं, जैसे M20 के लिए 1 : 1.5 : 3, और IS 456:2000 इसकी इजाज़त सिर्फ़ M20 तक देता है। डिज़ाइन मिक्स ट्रायल बैच से लक्ष्य मज़बूती पाने के लिए बनाया जाता है, और M25 व उससे ऊपर के लिए यही चाहिए।',
  },
  'dry-volume-factor': {
    term: 'ड्राई वॉल्यूम फ़ैक्टर (1.54)',
    definition:
      'सूखे सीमेंट, रेत और गिट्टी का आयतन उस गीले कंक्रीट से ज़्यादा होता है जो वे बनाते हैं, लगभग 1.54 गुना। कंक्रीट मिक्स कैलकुलेटर में प्रति घन मीटर की CPWD मात्राओं में यह छूट पहले से जुड़ी है।',
  },
  'cube-test': {
    term: 'क्यूब टेस्ट',
    definition:
      'मज़बूती की जाँच, जिसमें पोर से 150 mm के कंक्रीट क्यूब ढाले जाते हैं और आम तौर पर 7 और 28 दिन पर तोड़े जाते हैं। IS 456:2000 का क्लॉज़ 15.2.2 हर ग्रेड के लिए आयतन के हिसाब से सैंपलों की न्यूनतम संख्या तय करता है, और क्लॉज़ 15.3 हर सैंपल के तीन क्यूब माँगता है जो 28 दिन पर टेस्ट हों; कंक्रीट क्यूब टेस्ट कैलकुलेटर दोनों गिनता है।',
  },
  curing: {
    term: 'क्योरिंग (तराई)',
    definition:
      'ताज़ा डाले कंक्रीट को नम रखना, ताकि सीमेंट का हाइड्रेशन चलता रहे और कंक्रीट की मज़बूती बढ़े। ख़राब क्योरिंग से मज़बूती घटती है और सतह में दरारें आती हैं।',
  },
  cover: {
    term: 'कवर',
    definition:
      'सरिये की सतह से सबसे नज़दीकी कंक्रीट की सतह तक की दूरी। कवर स्टील को ज़ंग और आग से बचाता है; ज़रूरी मान हिस्से और मौसम के असर पर निर्भर करता है (IS 456:2000)।',
  },
  'exposure-class': {
    term: 'एक्सपोज़र क्लास',
    definition:
      'IS 456:2000 किसी ढाँचे के माहौल को हल्का, मध्यम, कड़ा, बहुत कड़ा या अत्यंत कड़ा बताकर बाँटता है, और हर एक के लिए न्यूनतम ग्रेड और कवर तय करता है। StructurePro इसे आपके चुने साइट हालात से निकालता है।',
  },
  fe500: {
    term: 'Fe 500 और Fe 500D',
    definition:
      'सरिये के स्टील के ग्रेड, जिनकी न्यूनतम यील्ड मज़बूती 500 N/mm² है (IS 1786)। D निशान ज़्यादा लचीले (डक्टाइल) ग्रेड का है, जो टूटने से पहले ज़्यादा मुड़ता है और भूकंप के हिसाब की डिटेलिंग के लिए ठीक रहता है।',
  },
  'tmt-bar': {
    term: 'TMT बार',
    definition:
      'थर्मो-मैकेनिकली ट्रीटेड बार: गर्म बेलकर बनाया सरिया, जिसे तेज़ी से ठंडा किया जाता है और जो अपनी ही गर्मी से टेम्पर हो जाता है, जिससे बाहर की परत सख़्त और भीतर का कोर नरम व लचीला बनता है। भारतीय घरों में यही आम सरिया है।',
  },
  'bar-unit-weight': {
    term: 'बार का प्रति मीटर वज़न',
    definition:
      'गोल बार का प्रति मीटर वज़न, जो d² ÷ 162 kg से निकलता है, d मिलीमीटर में। 12 mm के बार का वज़न लगभग 0.889 kg प्रति मीटर है।',
  },
  bbs: {
    term: 'BBS (बार बेंडिंग शेड्यूल)',
    definition:
      'एक तालिका जिसमें हर सरिया बार का मार्क, व्यास, आकार, संख्या, कटिंग लेंथ और वज़न लिखा होता है। ठेकेदार इसी से बार काटते-मोड़ते हैं, और स्टील की मात्रा जाँचने का आधार भी यही है।',
  },
  'cutting-length': {
    term: 'कटिंग लेंथ',
    definition:
      'मुड़ा हुआ आकार बनाने के लिए सीधे बार की जितनी लंबाई चाहिए: बाहरी नाप, घटा बेंड की कटौतियाँ, जोड़ा हुक का भत्ता।',
  },
  'hook-allowance': {
    term: 'हुक का भत्ता',
    definition:
      'बार के सिरे पर हुक बनाने के लिए लगने वाली अतिरिक्त बार की लंबाई। 135° के हुक वाले स्टिरप में टेल 10d की होती है, और 75 mm से कम कभी नहीं (IS 13920); बार बेंडिंग शेड्यूल कैलकुलेटर इसे जोड़ता है और कोनों व बेंड की कटौती वापस घटा देता है।',
  },
  stirrup: {
    term: 'स्टिरप',
    definition:
      'छोटे व्यास के बार का बंद फंदा जो बीम या कॉलम के मुख्य बारों को लपेटता है। यह शियर सहता है और पिंजरे को जगह पर थामे रखता है; भूकंप के हिसाब की डिटेलिंग में इसका सिरा 135° के हुक पर ख़त्म होता है।',
  },
  crank: {
    term: 'क्रैंक',
    definition:
      'बार में दिया गया ऑफ़सेट मोड़, जैसे 45° पर, जो सहारे के ऊपर से गुज़रते हुए बार को ऊपर या नीचे खिसका देता है।',
  },
  'binding-wire': {
    term: 'बाइंडिंग वायर',
    definition:
      'पतला एनील्ड तार जिससे पिंजरे में बार आपस में बाँधे जाते हैं। StructurePro प्रति टन स्टील 9 kg बाइंडिंग वायर गिनता है, जो CPWD की लागत पंक्तियों से निकाला गया आँकड़ा है।',
  },
  'g-plus-n': {
    term: 'G+1, G+2 (मंज़िलें)',
    definition:
      'ग्राउंड फ़्लोर और उसके ऊपर की मंज़िलों की संख्या। G+1 यानी ग्राउंड फ़्लोर और एक ऊपरी मंज़िल; G+2 यानी ग्राउंड फ़्लोर और दो।',
  },
  foundation: {
    term: 'फुटिंग, रैफ़्ट और पाइल',
    definition:
      'फुटिंग कॉलम का भार मिट्टी पर फैलाती है। रैफ़्ट पूरी इमारत के नीचे एक अकेला स्लैब है, जो कमज़ोर मिट्टी में इस्तेमाल होता है। पाइल एक लंबी छड़ है जिसे ठोंककर या बोरिंग करके गहराई में मज़बूत परत तक पहुँचाया जाता है। इनमें से कौन-सा लगेगा, यह मिट्टी और साइट के हालात तय करते हैं।',
  },
  'plinth-beam': {
    term: 'प्लिंथ बीम',
    definition: 'प्लिंथ लेवल की वह बीम जो कॉलमों को आपस में बाँधती है और उसके ऊपर की दीवार को सहारा देती है।',
  },
  'column-beam-slab': {
    term: 'कॉलम, बीम और स्लैब',
    definition: 'कॉलम भार को नीचे नींव तक पहुँचाता है। बीम स्लैब का भार कॉलमों तक ले जाती है। स्लैब फ़र्श या छत बनाता है।',
  },
  'seismic-zone': {
    term: 'भूकंप ज़ोन और ज़ोन फ़ैक्टर',
    definition:
      'IS 1893 भारत को अपेक्षित झटकों के हिसाब से ज़ोन II से V में बाँटता है, और हर ज़ोन को एक ज़ोन फ़ैक्टर Z देता है जो उस भूकंप बल को घटाता-बढ़ाता है जिसके लिए इमारत डिज़ाइन होती है। ज़ोन V सबसे कड़ा है।',
  },
  'stilt-floor': {
    term: 'स्टिल्ट फ़्लोर (खुला पार्किंग तल)',
    definition:
      'पार्किंग के लिए खुला छोड़ा गया ग्राउंड तल, जिसमें कॉलम होते हैं और दीवारें नहीं। भूकंप में यही कमज़ोर तल होता है, इसलिए इसके कॉलम और बीम बड़े बल के लिए डिज़ाइन होते हैं। StructurePro तल के बल का 2.5 गुना लगाता है (IS 1893 (Part 1):2002 cl 7.10.3(a)), और उसकी रिपोर्ट में लिखा होता है कि 2016 का संस्करण इंजीनियर से डायनैमिक एनालिसिस माँगता है।',
  },
  'basic-wind-speed': {
    term: 'बेसिक विंड स्पीड',
    definition:
      'हवा के झोंके की वह रफ़्तार, मीटर प्रति सेकंड में, जिसके लिए कोई जगह डिज़ाइन होती है; यह खुले मैदान में 10 m की ऊँचाई पर ली जाती है (IS 875 (Part 3))। StructurePro इसे आपके शहर के लिए पढ़ता है, हर मंज़िल की ऊँचाई के लिए डिज़ाइन रफ़्तार में बदलता है, और हवा के बल की तुलना भूकंप के बल से करता है। ढाँचा दोनों में से बड़े बल के लिए डिज़ाइन होता है, दोनों को जोड़कर कभी नहीं।',
  },
  'cantilever-balcony': {
    term: 'कैंटिलीवर बालकनी',
    definition:
      'एक किनारे पर टिका बालकनी का स्लैब जो अपनी सहारा देने वाली बीम से बाहर निकला रहता है। दूर वाले किनारे को कुछ नहीं थामता, इसलिए इसका मुख्य स्टील सहारे पर ऊपरी सतह के पास रहता है। StructurePro हर बालकनी को कैंटिलीवर स्लैब की तरह डिज़ाइन करता है; सहारा देने वाली बीम का मरोड़ डिज़ाइन नहीं किया जाता।',
  },
  'ductile-detailing': {
    term: 'डक्टाइल डिटेलिंग',
    definition:
      'सरिये की ऐसी डिटेलिंग जो भूकंप में किसी हिस्से को अचानक टूटे बिना मुड़ने और खिंचने देती है, जैसे 135° के हुक वाले पास-पास स्टिरप (IS 13920)।',
  },
  'modular-brick': {
    term: 'मॉड्यूलर ईंट',
    definition:
      'चिकनी मिट्टी की 190 × 90 × 90 mm की ईंट, जो 10 mm के मसाले के जोड़ के साथ 200 × 100 × 100 mm की नॉमिनल इकाई बनती है (IS 1077:1992)। एक ईंट मोटी दीवार (लगभग 200 mm) में क़रीब 100 ईंटें प्रति m² लगती हैं और आधी ईंट की दीवार (लगभग 100 mm) में क़रीब 50।',
  },
  'fly-ash-brick': {
    term: 'फ्लाई ऐश ईंट',
    definition:
      'कोयले के बिजलीघरों के उप-उत्पाद फ्लाई ऐश से सीमेंट या चूने के साथ बनी ईंट। MasonryPro फ्लाई ऐश की दीवारें IS 12894:2002 के 230 × 110 × 70 mm साइज़ में गिनता है।',
  },
  'aac-block': {
    term: 'AAC ब्लॉक',
    definition:
      'ऑटोक्लेव्ड एरेटेड कंक्रीट ब्लॉक: हल्का, हवादार कंक्रीट का ब्लॉक जो सीमेंट-रेत के मसाले की जगह पतली परत वाले चिपकाने वाले मसाले (अडेसिव) से जोड़ा जाता है। 600 × 200 mm मुँह वाले ब्लॉक से दीवार के हर वर्ग मीटर में 8 से कुछ ज़्यादा ब्लॉक लगते हैं।',
  },
  mortar: {
    term: 'मसाला (मोर्टार)',
    definition: 'सीमेंट, रेत और पानी का लेप जो ईंटों या ब्लॉकों को जोड़ता है। इसका मिक्स सीमेंट : रेत के अनुपात में लिखा जाता है।',
  },
  'partition-wall': {
    term: 'पार्टिशन दीवार',
    definition: 'कमरों को बाँटने वाली, भार न उठाने वाली भीतरी दीवार, अक्सर 4.5 इंच (115 mm) की ईंट की दीवार या पतली ब्लॉक की दीवार।',
  },
  lpcd: {
    term: 'LPCD (लीटर प्रति व्यक्ति प्रति दिन)',
    definition:
      'हर व्यक्ति के लिए मानी गई पानी की माँग। NirmanShastra पाइप से आने वाली सप्लाई के लिए 135 LPCD (IS 1172:1993, फ़्लश वाले शौचालय) और अपने बोरवेल वाले घर के लिए 150 लेता है। मुफ़्त वॉटर टैंक साइज़ कैलकुलेटर और PlumbingPro रिपोर्ट, दोनों अंडरग्राउंड और ओवरहेड टैंक का साइज़ NBC के बँटवारे से तय करते हैं।',
  },
  'wire-size': {
    term: 'वायर साइज़ (sq mm)',
    definition:
      'किसी तार के कटे सिरे का क्षेत्रफल mm² में, जिसे अक्सर sq mm लिखा जाता है। वायर साइज़ कैलकुलेटर CPWD विनिर्देश और IS 4648 के BIS मसौदे से तांबे का न्यूनतम साइज़ देता है: लाइट और पंखों के लिए 1.5 mm², सॉकेट और अलग सर्किट वाले गीज़र के लिए 2.5, एयर कंडीशनर के लिए 4, और मीटर से आने वाली सप्लाई के लिए 4, 6 या 10, लोड के हिसाब से।',
  },
  'mcb-rccb': {
    term: 'MCB, RCCB और RCBO',
    definition:
      'MCB ओवरलोड या शॉर्ट सर्किट पर ट्रिप होता है। RCCB अर्थ लीकेज पर ट्रिप होता है, जो लोगों को झटके से बचाता है। RCBO दोनों काम एक ही उपकरण में करता है।',
  },
  earthing: {
    term: 'अर्थिंग',
    definition:
      'किसी स्थापना के धातु वाले हिस्सों को ज़मीन से जोड़ना, ताकि फ़ॉल्ट करंट को सुरक्षित रास्ता मिले और सुरक्षा उपकरण ट्रिप हो जाए।',
  },
  'distribution-board': {
    term: 'डिस्ट्रीब्यूशन बोर्ड (DB)',
    definition: 'वह पैनल जिसमें MCB और RCCB लगे होते हैं और जो आने वाली सप्लाई को अलग-अलग सर्किटों में बाँटता है।',
  },
  boq: {
    term: 'BOQ (बिल ऑफ़ क्वांटिटीज़)',
    definition:
      'काम की मदवार सूची जिसमें हर मद का विवरण, मात्रा, इकाई, रेट और रकम होती है। BOQ से आप दो कोटेशन पंक्ति-दर-पंक्ति मिला सकते हैं और हर मात्रा को IS कोड के मानदंडों से जाँच सकते हैं।',
  },
  'per-sq-ft-rate': {
    term: 'प्रति वर्ग फ़ुट रेट',
    definition:
      'कुल लागत को बिल्ट-अप एरिया से भाग देने पर आता है। यह झटपट पैमाना है, पर यह छिपा देता है कि उसमें क्या शामिल है और क्या नहीं, इसलिए दो रेट की तुलना से पहले BOQ माँगिए।',
  },
  'built-up-area': {
    term: 'बिल्ट-अप एरिया',
    definition:
      'दीवारों की मोटाई समेत ढका हुआ फ़र्श का क्षेत्रफल, सभी मंज़िलों का जोड़। यह प्लॉट का एरिया नहीं है। प्रति वर्ग फ़ुट के पैमाने इसी का इस्तेमाल करते हैं, इसलिए देख लीजिए कि कोई आँकड़ा किस एरिया से भाग दिया गया है।',
  },
  'thumb-rule': {
    term: 'मोटा अंदाज़ा (थंब रूल)',
    definition:
      'अनुभव से निकला झटपट अंदाज़ा, जैसे बिल्ट-अप एरिया के हर वर्ग फ़ुट पर स्टील या सीमेंट की कोई मात्रा। पहली नज़र के लिए यह ठीक है, पर आपके अपने डिज़ाइन के बारे में कुछ नहीं कहता। NirmanShastra की रिपोर्टें थंब रूल इस्तेमाल नहीं करतीं: वे लेआउट, भूकंप ज़ोन और लोड से गिनती करती हैं।',
  },
  wastage: {
    term: 'वेस्टेज',
    definition:
      'टूट-फूट, कटाई, गिरने-बिखरने और ज़्यादा मँगवाने से बर्बाद हुई सामग्री। ईंट कैलकुलेटर गिनती 5% और 10% वेस्टेज जोड़कर दिखाता है।',
  },
  'quantity-range': {
    term: 'मात्रा का दायरा',
    definition:
      'रिपोर्ट में हर मात्रा के बगल में दिखने वाला कम से ज़्यादा का दायरा। यह इसलिए है कि कुछ जवाब किसी इमारत का हर नाप तय नहीं कर सकते, और असली इमारतें कोड के न्यूनतम से ज़्यादा सामग्री लेती हैं। यह बताता है कि मॉडल कितना पक्का है; यह आँकड़े पर कोई टॉलरेंस नहीं है।',
  },
  'quality-tier': {
    term: 'क्वालिटी टियर',
    definition:
      'फ़िनिश का एक स्तर, जैसे इकॉनॉमी, स्टैंडर्ड या प्रीमियम पेंट सिस्टम, बड़ी फ़्लोर टाइल या फ़ॉल्स सीलिंग। यह स्तर तय करता है कि कौन-सी फ़िनिशिंग सामग्री गिनी जाएगी और इसलिए हर एक की कितनी ज़रूरत होगी।',
  },
  'ra-bill': {
    term: 'RA बिल (रनिंग अकाउंट बिल)',
    definition:
      'किसी तारीख़ तक हुए काम का अंतरिम बिल। आरए बिल कैलकुलेटर में नेट पेयबल = ग्रॉस बिल − रिटेंशन − एडवांस रिकवरी + GST − TDS।',
  },
  'retention-money': {
    term: 'रिटेंशन मनी',
    definition:
      'हर बिल का एक प्रतिशत जो कमियाँ सुधारने की ज़मानत के तौर पर डिफ़ेक्ट लायबिलिटी अवधि ख़त्म होने तक ठेकेदार से रोक लिया जाता है। आरए बिल कैलकुलेटर में यह डिफ़ॉल्ट 5% है।',
  },
  'advance-recovery': {
    term: 'एडवांस रिकवरी',
    definition:
      'पहले दिए गए एडवांस की वसूली, जैसे मोबिलाइज़ेशन एडवांस। यह बाद के रनिंग बिलों में से तब तक काटा जाता है जब तक वह पूरा चुक न जाए।',
  },
  tds: {
    term: 'TDS (स्रोत पर कटा टैक्स)',
    definition:
      'वह टैक्स जो भुगतान करने वाला ठेके के भुगतान में से रोककर कर विभाग में जमा करता है। आरए बिल कैलकुलेटर में GST छोड़कर बिल की रकम पर डिफ़ॉल्ट 1% है। आप पर कौन-सी दर लगेगी, यह पाने वाले और ठेके पर निर्भर है, इसलिए टैक्स विशेषज्ञ से पक्का कर लीजिए।',
  },
  gst: {
    term: 'GST (वस्तु एवं सेवा कर)',
    definition:
      'ठेके के बिल पर लगने वाला टैक्स। आरए बिल कैलकुलेटर में डिफ़ॉल्ट 18% है। आपके ठेके की दर काम के प्रकार पर निर्भर है, इसलिए टैक्स विशेषज्ञ से पक्का कर लीजिए।',
  },
  'earned-value': {
    term: 'अर्नड वैल्यू (PV, EV, AC, BAC, SPI, CPI, EAC)',
    definition:
      'प्रोजेक्ट कंट्रोल की एक विधि। PV योजनाबद्ध मूल्य है, EV अर्जित मूल्य, AC वास्तविक लागत और BAC पूर्णता पर बजट। SPI = EV ÷ PV और CPI = EV ÷ AC; 1 से नीचे का मतलब है शेड्यूल से पीछे या लागत से ज़्यादा। अनुमानित अंतिम लागत EAC = BAC ÷ CPI है।',
  },
  'pf-esi': {
    term: 'PF और ESI',
    definition:
      'प्रॉविडेंट फ़ंड (PF) और कर्मचारी राज्य बीमा (ESI) मज़दूर की मज़दूरी से होने वाली वैधानिक कटौतियाँ हैं। दैनिक मज़दूरी कैलकुलेटर में नेट पेयबल = ग्रॉस मज़दूरी − कर्मचारी का PF − कर्मचारी का ESI − वसूला गया एडवांस।',
  },
  'vastu-purusha-mandala': {
    term: 'वास्तु पुरुष मंडल',
    definition:
      'वास्तु शास्त्र का एक ग्रिड-चित्र जो प्लॉट का प्रतीक है: 64 या 81 खाने, हर खाने पर एक रक्षक, और सीमा पर 32 स्थान। VastuPro कमरों के लिए 16 दिशा-ज़ोन दिखाता है, जो एक आधुनिक चलन है, और मुख्य द्वार को पुराने 32 स्थानों से पढ़ता है।',
  },
  brahmasthan: {
    term: 'ब्रह्मस्थान',
    definition:
      'वास्तु शास्त्र में प्लॉट या घर का केंद्रीय हिस्सा, जिसे परंपरा के अनुसार खुला और साफ़ रखा जाता है, और जिसके सामने कोई दरवाज़ा नहीं खुलता। VastuPro इसे आपकी रूपरेखा को घेरने वाले सबसे छोटे आयत के बीच के नौवें हिस्से के रूप में नापता है।',
  },
}

const LINKS_HI: Record<string, string> = {
  '/is-codes-used': 'NirmanShastra में प्रयुक्त IS कोड',
  '/blog/m20-vs-m25-concrete-grade': 'M20 बनाम M25 कंक्रीट',
  '/tools/concrete-mix-ratio-calculator': 'कंक्रीट मिक्स कैलकुलेटर',
  '/tools/concrete-cube-test-calculator': 'कंक्रीट क्यूब टेस्ट कैलकुलेटर',
  '/tools/structopro': 'StructurePro',
  '/blog/steel-required-per-sq-ft': 'प्रति वर्ग फ़ुट कितना स्टील चाहिए',
  '/tools/bar-bending-schedule-calculator': 'बार बेंडिंग कैलकुलेटर',
  '/blog/seismic-zones-india-is-1893': 'भारत के भूकंप ज़ोन (IS 1893)',
  '/blog/bricks-per-sq-ft': 'प्रति वर्ग फ़ुट कितनी ईंटें',
  '/tools/brick-calculator': 'ईंट कैलकुलेटर',
  '/tools/masonpro': 'MasonryPro',
  '/tools/water-tank-size-calculator': 'वॉटर टैंक साइज़ कैलकुलेटर',
  '/tools/wire-size-calculator': 'वायर साइज़ कैलकुलेटर',
  '/blog/rccb-electrical-safety-is-732-2019': 'RCCB और बिजली की सुरक्षा (IS 732:2019)',
  '/blog/how-to-check-contractor-quote': 'ठेकेदार का कोटेशन कैसे जाँचें',
  '/compare-quote': 'ठेकेदार का कोटेशन मिलाइए',
  '/blog/per-sqft-pricing-contractor-fraud': 'प्रति वर्ग फ़ुट का रेट धोखा क्यों छिपा देता है',
  '/blog/cement-sand-aggregate-for-1000-sq-ft-house': '1,000 वर्ग फ़ुट के लिए सीमेंट, रेत और गिट्टी',
  '/tools/interiorpro': 'InteriorPro',
  '/tools/paint-tile-calculator': 'पेंट और टाइल कैलकुलेटर',
  '/tools/ra-bill-retention-tds-calculator': 'आरए बिल कैलकुलेटर',
  '/tools/earned-value-calculator': 'अर्नड वैल्यू कैलकुलेटर',
  '/tools/daily-wage-pf-esi-calculator': 'दैनिक मज़दूरी, PF और ESI कैलकुलेटर',
  '/blog/vastu-vedic-architecture-16-zones': 'वास्तु और वैदिक वास्तुकला: 16 ज़ोन',
}

/** English terms or links that have no Hindi entry yet (empty when the tables are complete). */
export function missingGlossaryHi(): string[] {
  const out: string[] = []
  for (const g of GLOSSARY) {
    if (!GROUPS_HI[g.title]) out.push(`group:${g.title}`)
    for (const t of g.terms) {
      if (!TERMS_HI[t.id]) out.push(`term:${t.id}`)
      for (const l of t.links) if (!LINKS_HI[l.href]) out.push(`link:${l.href}`)
    }
  }
  return out
}

/** The groups as the page shows them: English untouched, Hindi from the tables (anything without an entry stays English). */
export function glossaryFor(locale: Locale): GlossaryGroup[] {
  if (locale !== 'hi') return GLOSSARY
  return GLOSSARY.map((g) => ({
    title: GROUPS_HI[g.title]?.title ?? g.title,
    intro: GROUPS_HI[g.title]?.intro ?? g.intro,
    terms: g.terms.map((t) => ({
      id: t.id,
      term: TERMS_HI[t.id]?.term ?? t.term,
      definition: TERMS_HI[t.id]?.definition ?? t.definition,
      links: t.links.map((l) => ({ href: l.href, label: LINKS_HI[l.href] ?? l.label })),
    })),
  }))
}

type Json = Record<string, unknown>

/** The DefinedTermSet: English exactly as schema.ts builds it; on /hi the same graph with Hindi names, definitions and /hi addresses. */
export function glossaryJsonLd(locale: Locale): Json {
  if (locale !== 'hi') return glossarySchema(GLOSSARY, GLOSSARY_UPDATED)
  const base = glossarySchema(glossaryFor('hi'), GLOSSARY_UPDATED)
  const en = abs('/glossary')
  const page = abs('/hi/glossary')
  const swap = (s: unknown) => (typeof s === 'string' ? s.replace(en, page) : s)
  return {
    ...base,
    '@id': `${page}#termset`,
    name: 'NirmanShastra निर्माण शब्दावली',
    description: 'NirmanShastra में इस्तेमाल होने वाले निर्माण, IS कोड, स्ट्रक्चरल, चिनाई, सर्विसेज़ और ठेके के शब्दों की सरल परिभाषाएँ।',
    url: page,
    inLanguage: 'hi-IN',
    hasDefinedTerm: (base.hasDefinedTerm as Json[]).map((t) => ({
      ...t,
      '@id': swap(t['@id']),
      url: swap(t.url),
      inDefinedTermSet: { '@id': `${page}#termset` },
    })),
  }
}
