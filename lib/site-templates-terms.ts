// Terms for the Excel Site Templates sold at /site-templates.
//
// One source for the page at /site-templates/terms. The wording follows the
// "Terms of Use and Licence" PDF that ships inside every download (SJ's own
// terms, with Etsy removed); only the product-specific details differ there.
// "{email}" in a paragraph is replaced by a mailto link wherever it is rendered.
//
// Hindi (SJ, 30-31 Oct 2026): each record carries its Hindi next to the English in `hi`, and the intro and the one-line summary have
// an _HI twin. The English values are unchanged and stay the binding text. The Hindi says exactly what the English says, clause by
// clause: same sections, same number of paragraphs, same figures (48 hours). It is drawn on /hi/site-templates/terms by
// lib/i18n/labels/legal-templates.ts. In the Hindi, "{email}" works as in the English, and "{en|...}" marks an English word kept on purpose.

export const ST_TERMS_UPDATED = '25 October 2026'

export const ST_TERMS_INTRO =
  'These terms cover the Excel Site Templates sold at nirmanshastra.in/site-templates: the six toolkits and the Site Operations Suite bundle. In them, NirmanShastra is "the Seller" and the person who bought the file is "the Purchaser". The same terms are in the Terms of Use and Licence PDF inside every download. By downloading or using a file, the Purchaser accepts them. The Terms of Use and Privacy Policy of the website apply as well.'

export const ST_TERMS_INTRO_HI =
  'ये शर्तें {en|nirmanshastra.in/site-templates} पर बिकने वाले Excel साइट टेम्पलेट पर लागू होती हैं: छह टूलकिट और साइट ऑपरेशंस सूट बंडल। इनमें NirmanShastra “विक्रेता” ({en|the Seller}) है और फ़ाइल ख़रीदने वाला व्यक्ति “ख़रीदार” ({en|the Purchaser}) है। यही शर्तें हर डाउनलोड के अंदर मौजूद {en|Terms of Use and Licence} PDF में भी हैं। फ़ाइल डाउनलोड या इस्तेमाल करके ख़रीदार इन्हें स्वीकार करता है। वेबसाइट की उपयोग की शर्तें और गोपनीयता नीति भी लागू होती हैं।'

export interface StTermsSection {
  id: string
  heading: string
  paragraphs: string[]
  /** the same section in Hindi: same number of paragraphs, in the same order */
  hi: { heading: string; paragraphs: string[] }
}

export const ST_TERMS_SECTIONS: StTermsSection[] = [
  {
    id: 'buying',
    heading: '1. What you are buying',
    paragraphs: [
      'A licence to use the workbook and its accompanying documents. You are not buying ownership of the file or of the underlying design, formulas, libraries, diagrams, structure or documentation, all of which remain the property of the Seller.',
    ],
    hi: {
      heading: '1. आप क्या ख़रीद रहे हैं',
      paragraphs: [
        'वर्कबुक और उसके साथ के दस्तावेज़ों को इस्तेमाल करने का लाइसेंस। आप फ़ाइल का, या उसके पीछे के डिज़ाइन, फ़ॉर्मूलों, लाइब्रेरियों, डायग्रामों, ढाँचे या दस्तावेज़ीकरण का स्वामित्व नहीं ख़रीद रहे हैं; ये सब विक्रेता की संपत्ति बने रहते हैं।',
      ],
    },
  },
  {
    id: 'may',
    heading: '2. What you may do',
    paragraphs: [
      'Use the file for your own work, personal or commercial, on an unlimited number of your own projects. Edit, adapt, extend and re-brand it for your own internal use. Issue outputs generated from it, such as schedules, bills, registers, reports and notes, to your own clients, consultants, contractors and suppliers, including commercially. Install it on any device you personally use.',
    ],
    hi: {
      heading: '2. आप क्या कर सकते हैं',
      paragraphs: [
        'फ़ाइल को अपने काम के लिए, निजी या व्यावसायिक, अपने ही प्रोजेक्टों की असीमित संख्या पर इस्तेमाल करना। अपने आंतरिक उपयोग के लिए इसे एडिट करना, ढालना, बढ़ाना और री-ब्रांड करना। इससे बने आउटपुट, जैसे शेड्यूल, बिल, रजिस्टर, रिपोर्ट और नोट, अपने क्लाइंटों, कंसल्टेंटों, ठेकेदारों और सप्लायरों को जारी करना, व्यावसायिक रूप से भी। इसे अपने निजी इस्तेमाल के किसी भी डिवाइस पर इंस्टॉल करना।',
      ],
    },
  },
  {
    id: 'may-not',
    heading: '3. What you may not do',
    paragraphs: [
      'Resell, re-license, sublicense, rent, lend, share, gift or distribute the file or any modified version of it. Upload it to any file-sharing service, template marketplace, course, membership site or public repository. Share it with people outside your own organisation. Sell it as your own product or as part of a bundle. Claim authorship of the workbook, its libraries, its diagrams or its methodology.',
    ],
    hi: {
      heading: '3. आप क्या नहीं कर सकते',
      paragraphs: [
        'फ़ाइल या उसके किसी भी बदले हुए रूप को आगे बेचना, दोबारा लाइसेंस देना, सब-लाइसेंस देना, किराये पर देना, उधार देना, साझा करना, उपहार में देना या वितरित करना। इसे किसी फ़ाइल-शेयरिंग सेवा, टेम्पलेट मार्केटप्लेस, कोर्स, मेंबरशिप साइट या सार्वजनिक रिपॉज़िटरी पर अपलोड करना। इसे अपने संगठन के बाहर के लोगों के साथ साझा करना। इसे अपने उत्पाद के रूप में या किसी बंडल के हिस्से के रूप में बेचना। वर्कबुक, उसकी लाइब्रेरियों, उसके डायग्रामों या उसकी पद्धति के रचयिता होने का दावा करना।',
      ],
    },
  },
  {
    id: 'team',
    heading: '4. Team and organisation use',
    paragraphs: [
      'One purchase covers use within one organisation by the people who work in it. If you wish to distribute the file beyond a single organisation, for example across separate companies, or to your own clients as a deliverable in itself, contact the Seller for an extended licence.',
    ],
    hi: {
      heading: '4. टीम और संगठन का उपयोग',
      paragraphs: [
        'एक ख़रीद एक संगठन के भीतर, उसमें काम करने वाले लोगों के उपयोग को कवर करती है। अगर आप फ़ाइल को किसी एक संगठन से आगे बाँटना चाहते हैं, जैसे अलग-अलग कंपनियों में, या अपने क्लाइंटों को अपने-आप में एक सौंपी जाने वाली चीज़ के रूप में, तो विस्तारित लाइसेंस के लिए विक्रेता से संपर्क कीजिए।',
      ],
    },
  },
  {
    id: 'delivery',
    heading: '5. Delivery',
    paragraphs: [
      'After payment, the download link is shown on the page and emailed to the address you entered. The link works for 48 hours and needs no login. Save the file after you download it. If the email does not arrive, use the link on the page. If you have lost both, write to {email} from the email address you bought with and a fresh link, or the current file, will be sent.',
    ],
    hi: {
      heading: '5. डिलीवरी',
      paragraphs: [
        'भुगतान के बाद डाउनलोड लिंक पेज पर दिखाया जाता है और आपके डाले हुए पते पर ईमेल किया जाता है। लिंक 48 घंटे चलता है और इसके लिए लॉगिन की ज़रूरत नहीं है। फ़ाइल डाउनलोड करने के बाद उसे सेव कर लीजिए। अगर ईमेल न आए, तो पेज पर दिया लिंक इस्तेमाल कीजिए। अगर आपने दोनों खो दिए हैं, तो जिस ईमेल पते से ख़रीदा था उससे {email} पर लिखिए, और नया लिंक, या मौजूदा फ़ाइल, भेज दी जाएगी।',
      ],
    },
  },
  {
    id: 'refunds',
    heading: '6. Refunds',
    paragraphs: [
      'Because this is a digital file delivered immediately and in full, it cannot be returned once downloaded. If the file is faulty, does not open, or does not match its description, write to the Seller at {email} from the email address you bought with and it will be fixed or refunded. Most issues are resolved the same day.',
    ],
    hi: {
      heading: '6. रिफ़ंड',
      paragraphs: [
        'क्योंकि यह एक डिजिटल फ़ाइल है जो तुरंत और पूरी दी जाती है, इसलिए एक बार डाउनलोड हो जाने के बाद इसे लौटाया नहीं जा सकता। अगर फ़ाइल में ख़राबी है, खुलती नहीं है, या अपने विवरण से मेल नहीं खाती, तो जिस ईमेल पते से ख़रीदा था उससे विक्रेता को {email} पर लिखिए; उसे ठीक कर दिया जाएगा या उसका रिफ़ंड कर दिया जाएगा। ज़्यादातर मामले उसी दिन सुलझ जाते हैं।',
      ],
    },
  },
  {
    id: 'updates',
    heading: '7. Updates',
    paragraphs: [
      'Free lifetime updates to the edition you bought. To receive the current file, write to {email} from the email address you bought with.',
    ],
    hi: {
      heading: '7. अपडेट',
      paragraphs: [
        'आपके ख़रीदे हुए संस्करण के लिए मुफ़्त आजीवन अपडेट। मौजूदा फ़ाइल पाने के लिए, जिस ईमेल पते से ख़रीदा था उससे {email} पर लिखिए।',
      ],
    },
  },
  {
    id: 'liability',
    heading: '8. Not professional advice, and limits of liability',
    paragraphs: [
      'Each workbook is a quantity, scheduling, documentation or compliance tool supplied as-is. It does not replace a licensed structural engineer, the approved drawings, the project specification, a qualified professional, or the current text of the Indian Standards and the laws that apply to your project. Rates, constants, wage and statutory figures, formulas and rules vary with the project, the place and the date, and are revised from time to time.',
      'The Purchaser is solely responsible for confirming every constant, rate, quantity and figure against the approved drawings, the specification and the current version of each code or law before ordering, paying, fabricating, filing or building anything from it. The Seller accepts no liability for any loss, cost, rework, rejected material, wrong or excess order, penalty, delay, structural consequence or damage arising from the use of the file, or of anything produced from it.',
    ],
    hi: {
      heading: '8. पेशेवर सलाह नहीं, और दायित्व की सीमाएँ',
      paragraphs: [
        'हर वर्कबुक मात्रा, शेड्यूलिंग, दस्तावेज़ीकरण या कम्प्लायंस का एक टूल है, जो जैसा है वैसा ({en|as-is}) दिया जाता है। यह लाइसेंस प्राप्त स्ट्रक्चरल इंजीनियर, मंज़ूर ड्रॉइंग, प्रोजेक्ट स्पेसिफ़िकेशन, किसी योग्य पेशेवर, या भारतीय मानकों के मौजूदा पाठ और आपके प्रोजेक्ट पर लागू क़ानूनों की जगह नहीं लेता। रेट, स्थिरांक, मज़दूरी और वैधानिक आँकड़े, फ़ॉर्मूले और नियम प्रोजेक्ट, जगह और तारीख़ के हिसाब से बदलते हैं, और समय-समय पर संशोधित होते रहते हैं।',
        'ख़रीदार की अकेली ज़िम्मेदारी है कि वह इसके आधार पर कुछ भी ऑर्डर करने, उसका भुगतान करने, फ़ैब्रिकेट करने, कुछ दाख़िल करने या बनाने से पहले, हर स्थिरांक, रेट, मात्रा और आँकड़े को मंज़ूर ड्रॉइंग, स्पेसिफ़िकेशन और हर कोड या क़ानून के मौजूदा संस्करण से मिलाकर पक्का कर ले। फ़ाइल के, या उससे बनी किसी भी चीज़ के उपयोग से पैदा हुए किसी भी नुक़सान, ख़र्च, दोबारा करने पड़े काम, अस्वीकृत सामग्री, ग़लत या ज़्यादा ऑर्डर, जुर्माने, देरी, स्ट्रक्चरल परिणाम या क्षति के लिए विक्रेता कोई दायित्व स्वीकार नहीं करता।',
      ],
    },
  },
  {
    id: 'contact',
    heading: '9. Questions',
    paragraphs: [
      'Write to {email}. For governing law and disputes, see the Terms of Use of the website.',
    ],
    hi: {
      heading: '9. सवाल',
      paragraphs: [
        '{email} पर लिखिए। लागू क़ानून और विवादों के लिए, वेबसाइट की उपयोग की शर्तें देखिए।',
      ],
    },
  },
]

export const ST_TERMS_SUMMARY =
  'In one line: use it on as many of your own projects as you like, forever. Just do not pass the file on to anyone else, and always check what it produces against your approved drawings and the current codes before relying on it.'

export const ST_TERMS_SUMMARY_HI =
  'एक पंक्ति में: इसे अपने जितने चाहें उतने प्रोजेक्टों पर, हमेशा के लिए इस्तेमाल कीजिए। बस फ़ाइल किसी और को मत दीजिए, और उस पर भरोसा करने से पहले, वह जो बनाती है उसे हमेशा अपने मंज़ूर ड्रॉइंग और मौजूदा कोडों से मिलाकर जाँच लीजिए।'
