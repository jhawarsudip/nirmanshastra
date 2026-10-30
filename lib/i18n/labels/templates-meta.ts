/*
  Hindi page title, description and share-image text for the Site Templates index and its six product pages.
  Each layout under app/[locale]/site-templates hands `templateHiMeta(id)` to localizeMetadata.
  The rupee figures are never typed here: they are worked out from lib/site-templates.ts, the catalog that charges the customer.
  Brand names, IS numbers and file formats stay in Latin letters. The Hindi follows the English description sentence for sentence.
*/
import type { HiMeta } from '../meta'
import { getProductById } from '@/lib/site-templates'
import { BUNDLE_RUPEES, inr } from './templates-ui'

const price = (id: string) => inr(getProductById(id)?.price ?? 0)

const META: Record<string, () => HiMeta> = {
  index: () => ({
    title: 'भारत के निर्माण कार्य के लिए Excel टेम्पलेट',
    description: `भारतीय निर्माण साइटों के लिए छह Excel टूलकिट: कॉस्ट एस्टिमेटर और BOQ, साइट डॉक्यूमेंटेशन, बिलिंग और मेज़रमेंट, बार बेंडिंग शेड्यूल, लेबर कम्प्लायंस, और प्लानिंग व डिले कंट्रोल। एक ख़रीदिए या छहों ${BUNDLE_RUPEES} में। तुरंत डाउनलोड।`,
    imageAlt: 'NirmanShastra — भारतीय निर्माण साइटों के लिए Excel टेम्पलेट',
  }),
  'cost-estimator': () => ({
    title: 'कंस्ट्रक्शन कॉस्ट एस्टिमेटर Excel टेम्पलेट',
    description: `ठेकेदारों के लिए Excel कंस्ट्रक्शन कॉस्ट एस्टिमेटर। अपने रेट लगाकर IS कोड की मात्राओं से घर का हिसाब लगाइए, क्लाइंट के लिए कोटेशन बनाइए और 3 कोटेशन तक की तुलना कीजिए। ${price('cost-estimator')}, तुरंत डाउनलोड।`,
    imageAlt: 'NirmanShastra — कंस्ट्रक्शन कॉस्ट एस्टिमेटर Excel टेम्पलेट (इंडिया एडिशन)',
  }),
  'documentation-pack': () => ({
    title: 'साइट डॉक्यूमेंटेशन पैक: RFI, NCR, टेस्ट',
    description: `भारतीय प्रोजेक्टों के लिए 14 शीट का Excel साइट डॉक्यूमेंटेशन पैक — ड्रॉइंग रजिस्टर, RFI रजिस्टर, NCR और टेस्ट रजिस्टर, प्रोक्योरमेंट लॉग, रोज़ का साइट लॉग और स्नैग लिस्ट। उसी समय का वह रिकॉर्ड जो विवाद में टिकता है। ${price('documentation-pack')}, तुरंत डाउनलोड।`,
    imageAlt: 'NirmanShastra — कंस्ट्रक्शन साइट डॉक्यूमेंटेशन पैक (इंडिया एडिशन)',
  }),
  'billing-measurement': () => ({
    title: 'बिलिंग और मेज़रमेंट Excel (IS 1200)',
    description: `भारतीय निर्माण के लिए 9 शीट की Excel बिलिंग और मेज़रमेंट वर्कबुक — मेज़रमेंट बुक, IS 1200 की कटौतियाँ, BOQ के सामने एब्सट्रैक्ट, और रिटेंशन, TDS (धारा 393) व GST वाले RA बिल, जो अंत तक ट्रैक होते हैं। ${price('billing-measurement')}, तुरंत डाउनलोड।`,
    imageAlt: 'NirmanShastra — कंस्ट्रक्शन बिलिंग और मेज़रमेंट Excel टेम्पलेट (इंडिया एडिशन)',
  }),
  'bar-bending-schedule': () => ({
    title: 'बार बेंडिंग शेड्यूल Excel (IS 2502)',
    description: `भारत के लिए 12 शीट का Excel बार बेंडिंग शेड्यूल टेम्पलेट — शेप लाइब्रेरी, IS 2502 के अनुसार मोड़ की कटौती और हुक के भत्ते वाला कटिंग-लेंथ कैलकुलेटर, लैप और डेवलपमेंट लेंथ, कटिंग ऑप्टिमाइज़र और स्टील ऑर्डर नोट। ${price('bar-bending-schedule')}, तुरंत डाउनलोड।`,
    imageAlt: 'NirmanShastra — बार बेंडिंग शेड्यूल Excel टेम्पलेट (इंडिया एडिशन, IS 2502)',
  }),
  'labour-compliance': () => ({
    title: 'साइट लेबर पेरोल और कम्प्लायंस Excel',
    description: `भारतीय निर्माण के लिए 16 शीट की Excel लेबर पेरोल और कम्प्लायंस वर्कबुक — मस्टर रोल, मज़दूरी रजिस्टर, PF/ESI और न्यूनतम मज़दूरी की जाँच, मज़दूरी पर्चियाँ और भारत के चार लेबर कोड (नवंबर 2025 से लागू) के तहत सब-कॉन्ट्रैक्टर के कम्प्लायंस होल्ड। ${price('labour-compliance')}, तुरंत डाउनलोड।`,
    imageAlt: 'NirmanShastra — कंस्ट्रक्शन लेबर पेरोल और कम्प्लायंस Excel टेम्पलेट (इंडिया एडिशन)',
  }),
  'planning-progress': () => ({
    title: 'प्रोजेक्ट कंट्रोल्स Excel: S-कर्व और डिले',
    description: `भारतीय निर्माण के लिए 17 शीट की Excel प्रोजेक्ट कंट्रोल्स वर्कबुक — बेसलाइन प्लान, गैंट, वैल्यू-वेटेड S-कर्व और अर्नड वैल्यू, कैश फ़्लो, साथ में कॉन्ट्रैक्ट के हिसाब से वर्गीकरण और नोटिस की आख़िरी तारीख़ की ट्रैकिंग वाला डिले और EOT रजिस्टर। ${price('planning-progress')}, तुरंत डाउनलोड।`,
    imageAlt: 'NirmanShastra — कंस्ट्रक्शन प्रोजेक्ट कंट्रोल्स Excel टेम्पलेट (EVM और डिले रजिस्टर, इंडिया एडिशन)',
  }),
}

/** The Hindi HiMeta for 'index' or a catalog product id ('cost-estimator', 'documentation-pack', ...). */
export function templateHiMeta(id: string): HiMeta {
  return META[id]?.() ?? {}
}
