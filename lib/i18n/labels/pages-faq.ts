/*
  Hindi for the FAQ page (app/[locale]/faq) and its FAQPage structured data.

  The English questions and answers stay exactly as they are in lib/faq-data.ts (the llms.txt builder and scripts/check-policy.ts read them).
  The Hindi sits in a table keyed by the English question text, so a reworded English question falls back to English on the page
  (missingFaqHi() lists such a question) rather than silently showing a Hindi answer to a different question. Prices, the refund
  windows and the e-mail address are built from the same constants as the English, never typed here.
*/
import type { Copy } from '@/lib/i18n/copy'
import { FAQ_CATEGORIES, type FaqCategory, type FaqItem } from '@/lib/faq-data'
import { TOOL_PRICE_PAISE, PRICE, PACK_CLAIMS_PER_REPORT } from '@/lib/tool-pricing'
import { inr } from '@/lib/seo/site'
import { REFUND_ASK_DAYS, REFUND_FAILED_DELIVERY_HOURS } from '@/lib/policy'
import { CONTACT_EMAIL } from '@/lib/site-contact'
import type { Locale } from '@/lib/i18n/paths'

const en = {
  eyebrow: 'Questions',
  name: 'Questions and answers',
  blurb: (total: number) =>
    `${total} answers on what NirmanShastra works out, how, and what it leaves out. The reports for homeowners give exact quantities, with no labour, dealer prices or contractor rates of ours; add your own rates if you want the rupees. The Excel toolkits for contractors work from the rates you enter.`,
  navAria: 'FAQ categories',
  noteTitle: 'Something not covered here?',
}
const hi: typeof en = {
  eyebrow: 'सवाल',
  name: 'सवाल और जवाब',
  blurb: (total) =>
    `${total} जवाब: NirmanShastra क्या निकालता है, कैसे निकालता है, और क्या छोड़ देता है। घर बनवाने वालों की रिपोर्टें सटीक मात्राएँ देती हैं, जिनमें हमारी ओर से न मज़दूरी है, न डीलर के दाम, न ठेकेदार के रेट; रुपये देखने हों तो अपने रेट जोड़ लीजिए। ठेकेदारों के Excel टूलकिट आपके डाले हुए रेट से काम करते हैं।`,
  navAria: 'FAQ की श्रेणियाँ',
  noteTitle: 'यहाँ जो पूछना था, वह नहीं मिला?',
}
export const FAQ_PAGE: Copy<typeof en> = { en, hi }

/** The closing note, in pieces so the three links stay real links. */
export const FAQ_NOTE = {
  en: { a: 'Ask the construction advisor in the corner of any tool page, or write to us from the ', contact: 'contact page', b: '. Plain-English articles on IS 456, IS 1786 and seismic zones are on the ', blog: 'blog', c: ', and every source behind the numbers is on the ', codes: 'IS Codes Used', d: ' page.' },
  hi: { a: 'किसी भी टूल पेज के कोने में बने कंस्ट्रक्शन एडवाइज़र से पूछिए, या हमें ', contact: 'संपर्क पेज', b: ' से लिखिए। IS 456, IS 1786 और भूकंप ज़ोन पर सीधी-सरल भाषा के लेख ', blog: 'ब्लॉग', c: ' पर हैं, और आँकड़ों के पीछे का हर स्रोत ', codes: 'प्रयुक्त IS कोड', d: ' पेज पर है।' },
}

/** Category names by code. */
export const FAQ_CATEGORY_HI: Record<string, string> = {
  GEN: 'सामान्य',
  PRC: 'रिपोर्ट और मूल्य',
  IS: 'IS कोड',
  TECH: 'तकनीकी',
  PAY: 'भुगतान',
}

const P = TOOL_PRICE_PAISE

/** Hindi question and answer, keyed by the English question. */
export const FAQ_HI: Record<string, { question: string; answer: string }> = {
  'What is NirmanShastra?': {
    question: 'NirmanShastra क्या है?',
    answer:
      'NirmanShastra निकालता है कि आपके घर को कितना सामान चाहिए: कंक्रीट, स्टील, सीमेंट, रेत, गिट्टी, ईंट, तार और पाइप। आप अपने प्लॉट और नक्शे के बारे में कुछ सीधे सवालों के जवाब देते हैं। फिर हमारे सर्वर पर भारतीय मानकों (IS 456:2000, IS 875, IS 1893:2016, IS 13920:2016, IS 1786:2008 और अन्य) के हिसाब से मात्राएँ निकलती हैं। यह पहले मात्राएँ देता है: हमारी ओर से न मज़दूरी के आँकड़े, न डीलर के दाम, न ठेकेदार के रेट। रुपये देखने हों तो रिपोर्ट में अपने रेट डाल सकते हैं; वह उन्हें मात्राओं से गुणा कर देती है, और मज़दूरी, ढुलाई और टैक्स छोड़ देती है।',
  },
  'Who is NirmanShastra for?': {
    question: 'NirmanShastra किसके लिए है?',
    answer:
      'मुख्य रूप से उन घर बनवाने वालों के लिए जो घर बनवाने या रिनोवेट कराने वाले हैं और ठेकेदार से करार करने या ऑर्डर देने से पहले जानना चाहते हैं कि उनके जैसे घर को क्या-क्या चाहिए। यह साइट सुपरवाइज़रों और छोटे बिल्डरों के भी काम का है, जिन्हें सामग्री के ऑर्डर जाँचने के लिए एक झटपट आधार चाहिए।',
  },
  'Do I need to know construction to use these tools?': {
    question: 'क्या इन टूल का इस्तेमाल करने के लिए निर्माण की जानकारी होनी ज़रूरी है?',
    answer:
      'नहीं। हर टूल सीधे शब्दों में पूछता है: प्लॉट का साइज़, कितनी मंज़िलें, शहर, मिट्टी, घर कैसा दिखाना चाहते हैं। आपको यह जानना ज़रूरी नहीं कि M20 कंक्रीट क्या होता है या स्ट्रक्चरल ड्रॉइंग कैसे पढ़ी जाती है। इंजीनियरिंग हम कर देते हैं, और रिपोर्ट बताती है कि हर मात्रा किस काम की है।',
  },
  'How is this different from asking a contractor for a quote?': {
    question: 'यह ठेकेदार से कोटेशन माँगने से कैसे अलग है?',
    answer:
      'ठेकेदार का कोटेशन मात्राएँ, मज़दूरी, मुनाफ़ा और उसकी अपनी आदतें, सब एक ही रकम में मिला देता है, इसलिए उसे जाँचना मुश्किल होता है। NirmanShastra पहले मात्राएँ देता है, जो सार्वजनिक भारतीय मानकों से निकलती हैं। अपने ठेकेदार की मात्राएँ हमारी मात्राओं के बगल में पंक्ति-दर-पंक्ति रखिए, और जहाँ फ़र्क़ हो वहाँ समझाने को कहिए। दाम की बात अलग है, जो आप अपने सप्लायरों से करते हैं; रुपये देखने हों तो उनके रेट रिपोर्ट में डाल दीजिए, वह उन्हें मात्राओं से गुणा कर देती है।',
  },
  'What is not included?': {
    question: 'क्या शामिल नहीं है?',
    answer:
      'मज़दूरी, निगरानी (सुपरविज़न), ठेकेदार का मार्जिन, सामग्री या ढुलाई के रेट, टैक्स, परमिट और डिज़ाइन की फ़ीस शामिल नहीं हैं और उनका कभी अंदाज़ा भी नहीं लगाया जाता। NirmanShastra यह नहीं बताता कि घर की लागत कितनी होगी। वह बताता है कि घर को क्या-क्या चाहिए होगा, और अगर आप सामग्री के अपने रेट डालें तो उन रेट पर वह सामग्री कितनी बैठती है। हर पेड रिपोर्ट यह भी गिनाती है कि उस टूल ने क्या छोड़ा है।',
  },
  'How much does it cost?': {
    question: 'इसकी क़ीमत कितनी है?',
    answer: `मुफ़्त कैलकुलेटर और आपके ढाँचे की मुफ़्त पहली झलक में कोई पैसा नहीं लगता। मात्राओं वाली पेड रिपोर्टों की क़ीमत टूल के हिसाब से है: ElectricalPro और PlumbingPro की ${inr(P.electropro)} प्रत्येक, MasonryPro की ${inr(P.masonpro)}, InteriorPro की ${inr(P.interiorpro)}, StructurePro की ${inr(P.structopro)}, और मिली-जुली ग्रैंड टोटल मात्रा रिपोर्ट की ${inr(P.grandtotal)}, जो उन चरण-रिपोर्टों के ऊपर जुड़ती है जिन्हें वह मिलाती है। कम्प्लीट हाउस पैक एक घर की पाँचों रिपोर्ट और ग्रैंड टोटल के लिए ${PRICE.pack} का है; एक-एक करके ख़रीदने पर ये ${PRICE.packSeparate} की पड़ती हैं, इसलिए पैक में ${PRICE.packSavings} की बचत है। ये रिपोर्टों की क़ीमतें हैं, घर बनाने की लागत का अंदाज़ा नहीं।`,
  },
  'What is the Complete House Pack, and how does it work?': {
    question: 'कम्प्लीट हाउस पैक क्या है, और यह कैसे काम करता है?',
    answer: `यह एक ही ख़रीद है, ${PRICE.pack}, जो एक घर की पाँचों मात्रा रिपोर्ट (ढाँचा, चिनाई, इलेक्ट्रिकल, प्लंबिंग और इंटीरियर) और ग्रैंड टोटल की ख़रीद-सूची खोल देती है। आप कम्प्लीट हाउस पैक पेज पर एक बार भुगतान करते हैं। फिर हर टूल को हमेशा की तरह खोलिए, अपना घर भरिए, और जहाँ आपको भुगतान करना पड़ता, वहाँ "मेरा कम्प्लीट हाउस पैक इस्तेमाल कीजिए" दबाइए। एक पैक एक ही घर के लिए है: हर रिपोर्ट उसी इमारत से मेल खानी चाहिए (उतनी ही मंज़िलें, वही राज्य, फ़्लोर एरिया 10% के भीतर)। हर रिपोर्ट ज़्यादा से ज़्यादा ${PACK_CLAIMS_PER_REPORT} बार बन सकती है, ताकि ग़लत भरा आँकड़ा आप सुधार सकें। ग्रैंड टोटल पैक में शामिल है।`,
  },
  'What do I get when I pay for a report?': {
    question: 'रिपोर्ट के लिए भुगतान करने पर मुझे क्या मिलता है?',
    answer:
      'आपके प्रोजेक्ट की पूरी मात्रा रिपोर्ट: हर सामग्री की मात्रा उसकी इकाई के साथ, वह IS क्लॉज़ जिससे वह आई है, एक IS अनुपालन पैनल, वे धारणाएँ जो हमने आपकी ओर से मानीं, जो शामिल नहीं है उसकी सूची, और डाउनलोड करने लायक PDF जो आप अपने ठेकेदार या स्ट्रक्चरल इंजीनियर को दे सकते हैं। StructurePro आपके ढाँचे का 3D मॉडल भी खोलता है।',
  },
  'What can I see before paying?': {
    question: 'भुगतान से पहले मुझे क्या दिखता है?',
    answer:
      'StructurePro में आप अपना भूकंप ज़ोन, लागू होने वाले कंक्रीट और स्टील के ग्रेड, IS कोड की जाँचें और 3D व्यू के साथ "आपका ढाँचा एक नज़र में" का नक्शा देख सकते हैं। इसमें कॉलम और बीम का ग्रिड, फुटिंग की गिनती और स्लैब पैनल शामिल हैं। सामग्री की मात्राएँ तब तक छिपी रहती हैं जब तक हमारे सर्वर पर भुगतान की पुष्टि नहीं हो जाती।',
  },
  'Do I need an account?': {
    question: 'क्या मुझे अकाउंट चाहिए?',
    answer:
      'मुफ़्त कैलकुलेटर के लिए अकाउंट नहीं चाहिए। पेड टूल आपके नाम, ईमेल, राज्य और शहर से शुरू होता है, ताकि रिपोर्ट आप तक पहुँचाई जा सके और जहाँ आप घर बना रहे हैं वहाँ से भूकंप ज़ोन और हवा की रफ़्तार पढ़ी जा सके। प्रोजेक्ट का नाम देना वैकल्पिक है।',
  },
  'What exactly do I pay at checkout?': {
    question: 'चेकआउट पर मुझे ठीक कितना भुगतान करना होता है?',
    answer:
      'चेकआउट पर वही रकम कटती है जो टूल पर दिखाई गई क़ीमत है, और पुष्टि करने से पहले Razorpay वह रकम दिखाता है। क़ीमत हमारे सर्वर पर तय होती है, आपके ब्राउज़र में नहीं।',
  },
  'What IS codes does NirmanShastra use?': {
    question: 'NirmanShastra कौन-से IS कोड इस्तेमाल करता है?',
    answer:
      'StructurePro IS 456:2000 (कंक्रीट), IS 1786:2008 (स्टील के सरिये), IS 875 के भाग 1 से 3 (डेड, लाइव और विंड लोड), IS 1893 (Part 1) (भूकंप) और IS 13920:2016 (डक्टाइल डिटेलिंग) इस्तेमाल करता है, और डिटेलिंग के तरीक़े के लिए SP 34। MasonryPro, ElectricalPro, PlumbingPro और InteriorPro हर एक अपने मानकों और सामग्री खपत के सार्वजनिक मानदंडों का सहारा लेता है। प्रयुक्त IS कोड पेज हर स्रोत को उसके संस्करण, वह किस पर लागू होता है और उसकी सीमाएँ कहाँ हैं, इन सबके साथ गिनाता है।',
  },
  'Are the IS code values accurate and up to date?': {
    question: 'क्या IS कोड के मान सही और ताज़ा हैं?',
    answer:
      'हम प्रकाशित दस्तावेज़ों से काम करते हैं और रिपोर्ट में हर नियम के पीछे का क्लॉज़ बताते हैं। जहाँ कोड में चुनाव की छूट है, वहाँ हम बताते हैं कि हमने क्या चुना। जहाँ हम कोई क्लॉज़ पूरा नहीं पढ़ पाए, या ख़राब स्कैन से कोई तालिका दोबारा बनानी पड़ी, वहाँ प्रयुक्त IS कोड पेज उस स्रोत के बगल में यह लिख देता है।',
  },
  'Why does my seismic zone matter for the structural quantities?': {
    question: 'मेरा भूकंप ज़ोन ढाँचे की मात्राओं के लिए क्यों मायने रखता है?',
    answer:
      'IS 1893 हर ज़ोन के लिए अलग भूकंप बल देता है। ऊँचे ज़ोन में कॉलम और बीम बड़े हो जाते हैं और उनमें ज़्यादा स्टील लगता है, और IS 13920:2016 जोड़ों पर पास-पास स्टिरप माँगता है। StructurePro आपके राज्य और शहर से ज़ोन पढ़कर उसे लगा देता है। IS 875 Part 3 के तहत विंड लोड भी जाँचा जाता है, और दोनों में से जो बड़ा हो वही चलता है। ज़्यादातर कम मंज़िल वाले घरों में भूकंप वाला मामला भारी पड़ता है।',
  },
  'What does the IS compliance panel check?': {
    question: 'IS अनुपालन पैनल क्या जाँचता है?',
    answer:
      'StructurePro में पैनल यह गिनाता है: मौसम के असर (एक्सपोज़र) के हिसाब से चुना गया कंक्रीट ग्रेड (IS 456 Table 5), स्टील का ग्रेड, भूकंप और विंड की जाँचें, आपकी मिट्टी के लिए नींव का प्रकार और नॉमिनल कवर (IS 456 Table 16), हर एक अपने क्लॉज़ के साथ। हर जाँच पर "पास" या "सलाह" का निशान लगता है। "सलाह" का मतलब है कि कोई बात साइट पर या इंजीनियर से पक्की करनी है, जैसे मिट्टी की जाँच।',
  },
  'How accurate are the quantities?': {
    question: 'मात्राएँ कितनी सटीक हैं?',
    answer:
      'ये कुछ जवाबों से निकाला गया अनुमान हैं, स्ट्रक्चरल डिज़ाइन नहीं। ढाँचे के लिए मॉडल आपके नक्शे का कॉलम ग्रिड बिछाता है, IS 875 से लोड लेता है, भूकंप और हवा के बलों की जाँच करता है और फुटिंग, कॉलम, बीम और स्लैब का साइज़ तय करता है। रिपोर्ट हर कुल के बगल में एक कम और एक ज़्यादा आँकड़ा दिखाती है, क्योंकि आपके असली ड्रॉइंग अलग होंगे, और सही आँकड़ा फिर भी उनके बाहर पड़ सकता है। असली इमारतों में कोड पर टिके मॉडल से ज़्यादा स्टील हो सकता है, इसलिए आँकड़ों को ऐसा आधार मानिए जिससे आप किसी कोटेशन पर सवाल उठा सकें। स्ट्रक्चरल इंजीनियर के ड्रॉइंग और बार बेंडिंग शेड्यूल हमेशा इन आँकड़ों से ऊपर माने जाते हैं।',
  },
  'Why does the tool ask for my city and soil type?': {
    question: 'टूल मेरा शहर और मिट्टी का प्रकार क्यों पूछता है?',
    answer:
      'राज्य और शहर आपका भूकंप ज़ोन, डिज़ाइन हवा की रफ़्तार और मौसम का असर कितना कड़ा है, यह तय करते हैं (IS 1893, IS 875 Part 3, IS 456)। मिट्टी फुटिंग का प्रकार और गहराई तय करती है, जिससे ज़मीन के नीचे कितना कंक्रीट और स्टील जाएगा, यह बदल जाता है।',
  },
  'Does StructurePro cover the whole building?': {
    question: 'क्या StructurePro पूरी इमारत को लेता है?',
    answer:
      'StructurePro RCC ढाँचे को लेता है: फुटिंग, प्लिंथ बीम, कॉलम, बीम, स्लैब, बालकनी, खुला स्टिल्ट फ़्लोर अगर आपके यहाँ हो, सीढ़ी, और लिंटल व सनशेड जैसे छोटे RCC आइटम। ईंट की चिनाई और प्लास्टर MasonryPro के हैं, वायरिंग ElectricalPro की, पाइप PlumbingPro के और फ़िनिशिंग InteriorPro की। ग्रैंड टोटल इन सबको एक सूची में जोड़ देता है।',
  },
  'Can I use NirmanShastra for commercial buildings or for adding a floor to an old house?': {
    question: 'क्या NirmanShastra को कमर्शियल इमारतों के लिए, या पुराने घर पर एक मंज़िल और बनाने के लिए इस्तेमाल किया जा सकता है?',
    answer:
      'ये टूल नए रिहायशी घरों के लिए हैं। StructurePro एक से दस मंज़िल तक लेता है, पर उसका मॉडल कम मंज़िल वाले घरों के लिए बना है, और जो इमारत 30 m से ऊँची हो, या ऊँची और संकरी हो, उस पर इंजीनियर से जाँच कराने का निशान लग जाता है। मौजूदा इमारत पर मंज़िल बढ़ाने के लिए इंजीनियर को पहले से खड़ी इमारत का सर्वे करना पड़ता है, इसलिए हम उसका अनुमान नहीं लगाते। कमर्शियल इमारतें इन टूल के मॉडल से बाहर हैं।',
  },
  'Why do you not show prices for materials?': {
    question: 'आप सामग्री के दाम क्यों नहीं दिखाते?',
    answer:
      'रेट शहर, महीने और सप्लायर के हिसाब से बदलते हैं, और हम जो भी रेट छापते वह पुराना पड़ चुका होता या आपके लिए ग़लत होता, इसलिए हम कोई रेट नहीं छापते। मात्राएँ बाज़ार के साथ नहीं बदलतीं। मात्राएँ अपने सप्लायरों के पास ले जाइए और अपने कोटेशन लीजिए। रुपये देखने हों तो पेड रिपोर्ट के वैकल्पिक पैनल में उनके रेट डाल दीजिए।',
  },
  'Can I see the material cost in rupees?': {
    question: 'क्या सामग्री की लागत रुपये में देखी जा सकती है?',
    answer:
      'हाँ, आपके अपने रेट पर। हर पेड रिपोर्ट और ग्रैंड टोटल में एक वैकल्पिक पैनल है, "रुपये में देखना है? अपने इलाक़े के रेट डालिए।" सीमेंट, स्टील, रेत, ईंट और जिस भी सामग्री का दाम देखना हो, उसका वह रेट लिखिए जो आपका डीलर बताता है, और जिसे छोड़ना हो वह बॉक्स ख़ाली रहने दीजिए। पेज फिर हर आइटम की सामग्री की लागत और एक कुल दिखाता है, जिस पर लिखा होता है "आपके डाले हुए रेट पर सामग्री की लागत। लेबर, ढुलाई और टैक्स शामिल नहीं हैं।" आपके लिए कुछ भरा नहीं जाता, और नतीजा न कोटेशन है, न पूरे घर की लागत। बॉक्स के बगल में जहाँ "सामान्य" दायरा दिखता है, वह सिर्फ़ तारीख़ वाला एक अंदाज़ा है। PDF में रुपयों वाली तालिका तभी आती है जब आपने रेट डाले हों और उसे माँगा हो।',
  },
  'Is payment secure?': {
    question: 'क्या भुगतान सुरक्षित है?',
    answer:
      'जी हाँ। भुगतान Razorpay सँभालता है, जो PCI-DSS मानक का पालन करने वाला गेटवे है। NirmanShastra आपके कार्ड का ब्योरा कभी सेव नहीं करता। कोई भी पेड सामग्री खुलने से पहले हर भुगतान की जाँच हमारे सर्वर पर HMAC SHA256 सिग्नेचर से होती है।',
  },
  'Can I get a refund?': {
    question: 'क्या मुझे रिफ़ंड मिल सकता है?',
    answer: `अगर हमारी ओर की किसी ख़राबी से रिपोर्ट बन नहीं पाती और भुगतान के ${REFUND_FAILED_DELIVERY_HOURS} घंटे के भीतर आप तक नहीं पहुँच पाती, तो हम आपको पूरा पैसा लौटा देंगे। भुगतान के ${REFUND_ASK_DAYS} दिन के भीतर अपने ऑर्डर ID के साथ ${CONTACT_EMAIL} पर ईमेल कीजिए। जो रिपोर्ट बन चुकी है और पहुँचा दी गई है, वह वापस नहीं होती, क्योंकि मात्राएँ निकाली जाती हैं और PDF भुगतान के समय ही बनती है। उपयोग की शर्तें भी यही कहती हैं।`,
  },
  'What payment methods are accepted?': {
    question: 'भुगतान के कौन-से तरीक़े चलते हैं?',
    answer:
      'वह सब जो Razorpay देता है: UPI (PhonePe, Google Pay, Paytm), डेबिट और क्रेडिट कार्ड, नेट बैंकिंग और वॉलेट।',
  },
}

/** English questions that have no Hindi entry yet (empty when the table is complete). */
export function missingFaqHi(): string[] {
  return FAQ_CATEGORIES.flatMap((c) => c.items).map((i) => i.question).filter((q) => !FAQ_HI[q])
}

/** The categories as the page shows them: English untouched, Hindi from the table (a question with no Hindi entry shows in English). */
export function faqFor(locale: Locale): FaqCategory[] {
  if (locale !== 'hi') return FAQ_CATEGORIES
  return FAQ_CATEGORIES.map((c) => ({
    code: c.code,
    label: FAQ_CATEGORY_HI[c.code] ?? c.label,
    items: c.items.map((i): FaqItem => FAQ_HI[i.question] ?? i),
  }))
}
