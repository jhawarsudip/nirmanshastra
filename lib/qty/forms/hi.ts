/*
  Hindi for the four trade forms (lib/qty/forms/*.ts). A parallel table, keyed by question id and by the English group title,
  so the English file keeps its shape and every `value` stays exactly as it is. Nothing here is sent to the server.
  localizeForm(spec, 'hi') returns the same form with the words in Hindi; for English it returns the spec itself.
  A question or option with no entry here simply keeps its English words.
*/

import type { TradeSlug } from '../meta'
import type { FieldSpec, FormSpec, TipText } from './types'

interface FieldHi {
  label: string
  hint?: string
  placeholder?: string
  tip?: TipText
  options?: Record<string, { label: string; note?: string }>
}
interface FormHi {
  heading: string
  sub: string
  freeLine: string
  /** keyed by the English group title */
  groups: Record<string, { title: string; intro?: string }>
  /** keyed by the question id */
  fields: Record<string, FieldHi>
}

/* ── questions that read the same in every form ── */

const dwelling = (flatsNote: string): FieldHi => ({
  label: 'इमारत का प्रकार',
  options: {
    house: { label: 'एक मकान', note: 'एक परिवार के लिए एक घर, आपकी डाली हर मंज़िल पर' },
    flats: { label: 'फ़्लैट', note: flatsNote },
  },
})
const homesPerFloor: FieldHi = { label: 'हर मंज़िल पर घर', hint: 'एक लैंडिंग से जितने फ़्लैट पहुँचा जा सकता है, उन्हें गिनिए।' }
const bedrooms = (hint = 'मकान के लिए, पूरे मकान के बेडरूम।'): FieldHi => ({ label: 'हर घर में बेडरूम', hint })
const bathrooms = (label = 'हर घर में बाथरूम'): FieldHi => ({ label, hint: 'शौचालय, शावर हो या न हो। हर एक को गिनिए।' })
const kitchens: FieldHi = { label: 'हर घर में रसोई' }
const balconies = (hint = 'मकान के लिए, पूरे मकान की बालकनी।'): FieldHi => ({ label: 'हर घर में बालकनी', hint })
const storeyM: FieldHi = {
  label: 'मंज़िल से मंज़िल की ऊँचाई (m)',
  hint: 'ख़ाली छोड़ने पर 3.0 m मानी जाती है, जो स्ट्रक्चर रिपोर्ट में इस्तेमाल होती है।',
  placeholder: '3.0',
}
const NEW_G = { 'What are you building?': { title: 'आप क्या बनवा रहे हैं?' } }

/* ── MasonryPro ── */

const masonry: FormHi = {
  heading: 'दीवारों के बारे में बताइए',
  sub: 'कमरों और दीवार की सामग्री के बारे में कुछ सीधे सवाल। हम हर दीवार की लंबाई निकालते हैं, दरवाज़े और खिड़कियाँ वैसे घटाते हैं जैसे भारतीय मानक नापते हैं, और ईंट या ब्लॉक, मसाला, सीमेंट, रेत और प्लास्टर गिनते हैं।',
  freeLine: 'मुफ़्त: भारतीय मानकों की जाँच, दीवारों की मोटाई और कमरों व दरवाज़े-खिड़कियों की जगहों की गिनती। ईंट, मसाला, सीमेंट, रेत और प्लास्टर पूरी रिपोर्ट में हैं',
  groups: {
    ...NEW_G,
    'Wall material': { title: 'दीवार की सामग्री' },
    'Plaster and the roof': { title: 'प्लास्टर और छत' },
  },
  fields: {
    dwelling: dwelling('इमारत में कई घर, हर एक के अपने कमरे'),
    homesPerFloor,
    bedrooms: bedrooms(),
    bathrooms: bathrooms(),
    kitchens,
    balconies: balconies('मकान के लिए, पूरे मकान की बालकनी। हर एक को 3 m चौड़ी और 1.5 m गहरी गिना जाता है।'),
    system: {
      label: 'दीवारें किस चीज़ से बनेंगी?',
      tip: {
        title: 'दीवार की सामग्री',
        body: 'ईंट और ब्लॉक अलग-अलग साइज़ में आते हैं, इसलिए एक ही दीवार के लिए गिनती अलग होती है। साइज़, जोड़ और मसाला, सब इसी चुनाव से तय होते हैं।',
        is: 'IS 1077, 12894, 2185, 6041, 2572',
      },
      options: {
        brick: { label: 'लाल मिट्टी की ईंट', note: 'आम ईंट, क़रीब 9 × 4.5 × 3 इंच। भट्ठे-भट्ठे में साइज़ अलग होता है' },
        modular: { label: 'मॉड्यूलर मिट्टी की ईंट', note: '190 × 90 × 90 mm, BIS का मॉड्यूलर साइज़' },
        flyash: { label: 'फ़्लाई-ऐश ईंट', note: '230 × 110 × 70 mm, स्लेटी रंग की, फ़्लाई-ऐश प्लांट से' },
        aac: { label: 'AAC ब्लॉक', note: 'हल्के स्लेटी ब्लॉक, 600 × 200 mm का फ़ेस, पतले अडेसिव में लगते हैं' },
        block: { label: 'कंक्रीट ब्लॉक', note: 'ठोस या खोखले सीमेंट ब्लॉक, 400 × 200 mm का फ़ेस' },
      },
    },
    thickOuter: {
      label: 'बाहरी दीवारें 200 mm मोटी रखनी हैं?',
      hint: '150 mm के लिए “नहीं” चुनिए। फ़्रेम में 150 mm की बाहरी दीवार को ब्रेसिंग और सरिया चाहिए, जो आपका इंजीनियर तय करता है।',
      tip: {
        title: 'बाहरी दीवार की मोटाई',
        body: 'फ़्रेम में कम से कम 200 mm की ब्लॉक दीवार को 3.5 m तक ऊँची मंज़िलों के लिए अलग जाँच की ज़रूरत नहीं होती। 150 mm की दीवार तभी मान्य है जब वह ब्रेस की गई हो और उसमें सरिया हो।',
        is: 'IS 6041 cl 4.2.1, IS 2572 cl 7.2.1.2',
      },
    },
    aacJoint: {
      label: 'AAC ब्लॉक कैसे जोड़े जाएँगे?',
      options: {
        thin: { label: 'पतला अडेसिव', note: 'ब्लॉक अडेसिव की 3 mm की परत, जैसा निर्माता बताते हैं' },
        mortar: { label: 'सीमेंट का मसाला', note: 'पुराना तरीक़ा: 1:6 मसाले की 10 mm की परत' },
      },
    },
    plasterExt: {
      label: 'बाहर का प्लास्टर कैसे होगा?',
      tip: {
        title: 'बाहर का प्लास्टर',
        body: 'बाहरी दीवारों के लिए आम सलाह दो परत की है (पहले 12 mm, फिर 6 mm)। 20 mm की एक परत भी आम है, लेकिन IS 2402 एक परत में सिर्फ़ 18 mm तक की इजाज़त देता है।',
        is: 'IS 2402 cl 6.13',
      },
      options: {
        twocoat: { label: 'दो परत, 18 mm', note: '12 mm की नीचे की परत और 6 mm की ऊपरी परत' },
        single: { label: 'एक परत, 20 mm', note: 'एक मोटी परत, CPWD के काम में आम' },
        none: { label: 'प्लास्टर नहीं', note: 'बाहर नंगी ईंट, पॉइंटिंग के साथ। पॉइंटिंग गिनी नहीं जाती' },
      },
    },
    plasterCeil: { label: 'छतों का प्लास्टर करना है?', hint: 'अगर स्लैब पर सीधे पेंट करेंगे या फ़ॉल्स सीलिंग लगाएँगे तो “नहीं” चुनिए।' },
    parapet: { label: 'छत के चारों ओर चिनाई वाला पैरापेट?' },
    mumty: { label: 'छत पर सीढ़ी का छोटा कमरा (मुमटी)?', hint: 'क़रीब 3 × 3 m का। एक मंज़िल की इमारत में इसे नहीं गिना जाता।' },
    balconyWall: { label: 'क्या बालकनी के किनारे चिनाई की दीवारें हैं?', hint: 'अगर उन पर धातु या काँच की रेलिंग होगी तो “नहीं” चुनिए।' },
    bigDoor: { label: 'बालकनी के बड़े स्लाइडिंग दरवाज़े?', hint: 'क़रीब 1.8 m का स्लाइडिंग दरवाज़ा। आम दरवाज़ा 1.2 m चौड़ा होता है।' },
    storeyM,
  },
}

/* ── ElectricalPro ── */

const electrical: FormHi = {
  heading: 'वायरिंग के बारे में बताइए',
  sub: 'कमरों और बड़े उपकरणों के बारे में कुछ सीधे सवाल। हम कमरा-दर-कमरा पॉइंट गिनते हैं, सर्किट और बोर्ड का साइज़ तय करते हैं, और तार, कंड्यूट और फ़िटिंग निकालते हैं। आपको नक्शे की ज़रूरत नहीं है।',
  freeLine: 'मुफ़्त: भारतीय मानकों की जाँच, डिज़ाइन लोड और कनेक्शन। पॉइंट, तार, कंड्यूट, बोर्ड और फ़िटिंग पूरी रिपोर्ट में हैं',
  groups: {
    'What are you wiring?': { title: 'आप किसकी वायरिंग करवा रहे हैं?' },
    'Big appliances and extras': {
      title: 'बड़े उपकरण और अतिरिक्त चीज़ें',
      intro: 'इनमें से हर एक का अपना सर्किट होता है, इसलिए ये बोर्ड और तार की मात्रा बदलते हैं।',
    },
    'How much wiring do you want?': { title: 'कितनी वायरिंग चाहिए?' },
  },
  fields: {
    dwelling: dwelling('इमारत में कई घर, हर एक का अपना मीटर और बोर्ड'),
    homesPerFloor,
    bedrooms: bedrooms('मकान के लिए, पूरे मकान के बेडरूम। स्टडी या गेस्ट रूम की वायरिंग चाहिए तो उसे भी यहाँ जोड़िए।'),
    bathrooms: bathrooms(),
    kitchens,
    balconies: balconies(),
    dining: { label: 'रसोई से अलग डाइनिंग रूम?', hint: 'अगर आप रसोई या हॉल में खाते हैं तो “नहीं” चुनिए।' },
    pooja: { label: 'पूजा का कमरा?' },
    utility: { label: 'वॉशिंग मशीन के लिए वॉश एरिया या ड्राई बालकनी?' },
    acRooms: {
      label: 'एयर कंडीशनर वाले कमरे',
      hint: 'हर घर में। जिन बेडरूम और हॉल में एसी लगेगा, अभी या बाद में, उन्हें गिनिए।',
      tip: {
        title: 'एयर कंडीशनर के सर्किट',
        body: 'एयर कंडीशनर बहुत बिजली खींचता है, इसलिए उसका अपना मोटा तार (4 mm²), अपना ब्रेकर और अपना आउटलेट होता है। बाद में लगने वाले एसी की वायरिंग दीवारों पर प्लास्टर से पहले करवाना बहुत सस्ता पड़ता है।',
        is: 'ड्राफ़्ट IS 4648 cl 6.2.2',
      },
    },
    geyser: { label: 'हर बाथरूम में गीज़र?', hint: 'अगर आप पानी किसी और तरीक़े से गरम करेंगे, जैसे सोलर, तो “नहीं” चुनिए।' },
    inverter: { label: 'लाइट और पंखों के लिए इन्वर्टर?', hint: 'हर घर के लिए गिना जाता है।' },
    ev: { label: 'इलेक्ट्रिक कार या स्कूटर के लिए चार्जर?', hint: 'पार्किंग में एक सर्किट गिना जाता है, और फ़्लैटों की इमारत में हर पाँच पार्किंग जगहों पर एक।' },
    parking: {
      label: 'पार्किंग की जगहें',
      placeholder: '1',
      hint: 'मकान के लिए, प्लॉट पर जितनी कारें खड़ी हो सकती हैं (ख़ाली छोड़ने पर 1)। फ़्लैटों के लिए, पूरी इमारत की पार्किंग जगहें (ख़ाली छोड़ने पर कोई नहीं)।',
    },
    wiring: {
      label: 'कितने पॉइंट और सॉकेट?',
      tip: {
        title: 'स्टैंडर्ड या बेसिक',
        body: '1968 का मानक बहुत कम सॉकेट माँगता है। BIS ने आज के घरों के लिए नया ड्राफ़्ट बनाया है, जिसमें हर कमरे में कहीं ज़्यादा सॉकेट हैं। स्टैंडर्ड नए ड्राफ़्ट को मानता है। बेसिक पुराने मानक को।',
        is: 'IS 4648:1968 और उसका ड्राफ़्ट संशोधन',
      },
      options: {
        standard: { label: 'स्टैंडर्ड', note: 'नए BIS ड्राफ़्ट के कमरा-दर-कमरा पॉइंट। हर कमरे में कई सॉकेट, जैसे ज़्यादातर नए फ़्लैटों में' },
        basic: { label: 'बेसिक', note: 'पुराने IS 4648 के सॉकेट। कम पॉइंट, हर चीज़ की कम गिनती' },
      },
    },
    supply: {
      label: 'आप कौन-सा कनेक्शन लेंगे?',
      tip: {
        title: 'सिंगल या थ्री-फ़ेज़',
        body: 'यह आपका बिजली बोर्ड आपके माँगे लोड के हिसाब से तय करता है। छोटे घर आम तौर पर सिंगल-फ़ेज़ होते हैं। कई एसी वाले बड़े घर थ्री-फ़ेज़ होते हैं। अगर आपको नहीं पता, तो हम डिज़ाइन लोड से चुन लेते हैं।',
        is: 'ड्राफ़्ट IS 4648 Table 4',
      },
      options: {
        auto: { label: 'पक्का नहीं पता', note: 'हम आपके घर के लोड से चुन लेते हैं' },
        single: { label: 'सिंगल-फ़ेज़', note: 'बोर्ड तक दो तार और एक अर्थ' },
        three: { label: 'थ्री-फ़ेज़', note: 'बोर्ड तक चार तार और एक अर्थ' },
      },
    },
    storeyM,
  },
}

/* ── PlumbingPro ── */

const plumbing: FormHi = {
  heading: 'प्लंबिंग के बारे में बताइए',
  sub: 'घरों, बाथरूमों और पानी कहाँ से आता है, इसके बारे में कुछ सीधे सवाल। पाइप का साइज़, टंकी का साइज़ और नालियाँ आपके लिए भारतीय मानकों से निकाली जाती हैं और आपकी रिपोर्ट में लिखी जाती हैं।',
  freeLine: 'मुफ़्त: भारतीय मानकों की जाँच, मुख्य साइज़ और आपके पास जो है उसकी गिनती। आइटम-वार मात्राएँ पूरी रिपोर्ट में हैं',
  groups: {
    ...NEW_G,
    'Where does the water come from, and where does it go?': { title: 'पानी कहाँ से आता है, और कहाँ जाता है?' },
    'Fixtures and rain': { title: 'फ़िक्सचर और बारिश' },
  },
  fields: {
    dwelling: dwelling('इमारत में कई घर, हर एक के अपने बाथरूम और रसोई'),
    homesPerFloor,
    bedrooms: bedrooms(),
    bathrooms: bathrooms('हर घर में WC वाले बाथरूम'),
    kitchens,
    persons: {
      label: 'हर घर में रहने वाले लोग',
      placeholder: 'जैसे 5',
      hint: 'ख़ाली छोड़ने पर हम बेडरूम की संख्या में तीन जोड़ लेते हैं।',
      tip: {
        title: 'हर घर में लोग',
        body: 'टंकी और नालियों का साइज़ लोगों की संख्या से तय होता है। अगर आपका संयुक्त परिवार है या बहुत मेहमान आते हैं, तो बड़ी संख्या डालिए।',
        is: 'IS 1172:1993 cl 4.1',
      },
    },
    water: {
      label: 'पानी की सप्लाई',
      tip: {
        title: 'पानी की सप्लाई',
        body: 'स्रोत से तय होता है कि आपको कितना पानी जमा करना होगा। टैंकर या बोरवेल म्युनिसिपल लाइन से कम भरोसेमंद होते हैं, इसलिए टंकियाँ बड़ी रखी जाती हैं।',
        is: 'NBC Part 9 Sec 1 cl 4.4.10',
      },
      options: {
        municipal: { label: 'म्युनिसिपल सप्लाई', note: 'शहर या सोसाइटी की पाइप, तय घंटों में या पूरे दिन' },
        borewell: { label: 'बोरवेल', note: 'ज़रूरत पड़ने पर आपका अपना पंप टंकी भरता है' },
        tanker: { label: 'टैंकर', note: 'पानी टैंकर से आता है और ज़मीन के नीचे की टंकी में जाता है' },
      },
    },
    sewer: {
      label: 'क्या आपके प्लॉट पर सार्वजनिक सीवर लाइन है?',
      hint: 'पड़ोसियों या नगर निकाय से पूछिए। अगर नहीं है, तो हम उसकी जगह सेप्टिक टैंक और सोक पिट का साइज़ निकालते हैं।',
      tip: {
        title: 'सीवर या सेप्टिक टैंक',
        body: 'जहाँ प्लॉट के पास से सीवर लाइन गुज़रती है, वहाँ गंदा पानी उसी से जोड़ा जाता है। जहाँ नहीं गुज़रती, वहाँ वह सेप्टिक टैंक में जाता है और फिर आपके ही प्लॉट के सोक पिट में।',
        is: 'IS 2470 (Part 1 और 2)',
      },
    },
    soil: {
      label: 'ज़मीन पानी कितनी जल्दी सोखती है?',
      hint: 'इससे सोक पिट का साइज़ तय होता है।',
      tip: {
        title: 'ज़मीन और सोक पिट',
        body: 'सोक पिट में शोधित पानी ज़मीन में रिस जाता है। रेतीली ज़मीन इसे जल्दी सोखती है, चिकनी मिट्टी धीरे सोखती है और उसे बड़ा पिट चाहिए। असली आँकड़ा लैब की परकोलेशन टेस्ट से मिलता है।',
        is: 'IS 2470 (Part 2) Table 2',
      },
      options: {
        good: { label: 'जल्दी', note: 'रेतीली या कंकड़ वाली, पानी मिनटों में ग़ायब हो जाता है' },
        medium: { label: 'आम', note: 'मिली-जुली मिट्टी, सबसे आम हालत' },
        poor: { label: 'धीरे', note: 'चिकनी या काली कपास वाली मिट्टी, पानी देर तक रुका रहता है' },
      },
    },
    geyser: { label: 'बाथरूम में गरम पानी (गीज़र)?' },
    washer: { label: 'हर घर में वॉशिंग मशीन का पॉइंट?' },
    gardenTap: { label: 'बगीचे या पार्किंग में नल?' },
    rain: {
      label: 'आपके शहर में बारिश कितनी तेज़ होती है?',
      hint: 'छत की नालियों का साइज़ सबसे तेज़ बारिश वाले घंटे के हिसाब से तय होता है। पक्का न हो तो ज़्यादातर शहरों के लिए “तेज़” और समुद्र किनारे के लिए “बहुत तेज़” चुनिए।',
      tip: {
        title: 'बारिश और डाउन-पाइप',
        body: 'मानक हर शहर की बारिश नहीं बताता, इसलिए आप जो ठीक बैठे वह चुनिए। उतनी ही छत के लिए ज़्यादा तेज़ बारिश में ज़्यादा डाउन-पाइप लगते हैं।',
        is: 'IS 1742:1983 cl 4.10.3.8',
      },
      options: {
        heavy: { label: 'तेज़', note: 'घंटे में क़रीब 75 mm। मैदानों और पठार के ज़्यादातर शहर' },
        veryheavy: { label: 'बहुत तेज़', note: 'घंटे में क़रीब 100 mm। पश्चिमी तट, केरल और पूर्वोत्तर' },
        extreme: { label: 'अत्यधिक', note: 'घंटे में क़रीब 150 mm। बादल फटने वाली पहाड़ियाँ और सबसे ज़्यादा बारिश वाली जगहें' },
      },
    },
  },
}

/* ── InteriorPro ── */

const interior: FormHi = {
  heading: 'फ़िनिशिंग के बारे में बताइए',
  sub: 'कमरों और आपके मन की फ़िनिश के बारे में कुछ सीधे सवाल। हम दीवारें, छतें और फ़र्श कमरा-दर-कमरा नापते हैं, फिर पेंट, टाइल, दरवाज़े-खिड़कियाँ, फ़ॉल्स सीलिंग और प्लाईवुड निकालते हैं। आपको नक्शे की ज़रूरत नहीं है।',
  freeLine: 'मुफ़्त: भारतीय मानकों की जाँच और हर फ़िनिश का मतलब। पेंट, टाइल, दरवाज़े, खिड़कियाँ, फ़ॉल्स सीलिंग और प्लाईवुड पूरी रिपोर्ट में हैं',
  groups: {
    'What are you finishing?': { title: 'आप क्या फ़िनिश करवा रहे हैं?' },
    'Paint': { title: 'पेंट' },
    'Floors and walls': { title: 'फ़र्श और दीवारें' },
    'Kitchen and cupboards': { title: 'रसोई और अलमारियाँ' },
  },
  fields: {
    dwelling: dwelling('इमारत में कई घर, सब एक ही तरह फ़िनिश किए जाते हैं'),
    homesPerFloor,
    bedrooms: bedrooms(),
    bathrooms: bathrooms(),
    kitchens,
    balconies: balconies(),
    storeyM,
    paint: {
      label: 'कमरों के अंदर का पेंट',
      tip: {
        title: 'तीनों स्तरों का मतलब',
        body: 'स्तर से दीवार पर परतें तय होती हैं। इकॉनमी में प्राइमर और डिस्टेंपर के दो कोट होते हैं। स्टैंडर्ड में सीमेंट पुट्टी जुड़ती है और इंटीरियर इमल्शन लगता है। प्रीमियम में एक्रिलिक पुट्टी के दो कोट और लक्ज़री इमल्शन लगता है, जो कम दूर तक फैलता है।',
        is: 'निर्माताओं की डेटा शीट; IS 2395 (Part 1)',
      },
      options: {
        economy: { label: 'इकॉनमी', note: 'प्राइमर और डिस्टेंपर के दो कोट' },
        standard: { label: 'स्टैंडर्ड', note: 'सीमेंट पुट्टी, प्राइमर, इमल्शन के दो कोट' },
        premium: { label: 'प्रीमियम', note: 'एक्रिलिक पुट्टी, प्राइमर, लक्ज़री इमल्शन के दो कोट' },
      },
    },
    exterior: {
      label: 'बाहरी दीवारों का पेंट',
      tip: {
        title: 'बाहर की फ़िनिश',
        body: 'सीमेंट पेंट सबसे सस्ता है और दो कोट में लगता है, बीच में तराई के साथ। एक्रिलिक इमल्शन चिकना और धोने लायक़ होता है। टेक्सचर फ़िनिश दरारें छिपाती है, लेकिन चिकने कोट से क़रीब दोगुना सामान लेती है।',
        is: 'CPWD दिल्ली रेट विश्लेषण 2016; IS 2395 (Part 1)',
      },
      options: {
        none: { label: 'रहने दीजिए', note: 'बाहर अभी पेंट नहीं होगा' },
        cement: { label: 'सीमेंट पेंट', note: 'दो कोट, पानी से तराई के साथ' },
        acrylic: { label: 'एक्रिलिक इमल्शन', note: 'चिकना, बाहरी प्राइमर के ऊपर' },
        textured: { label: 'टेक्सचर्ड', note: 'खुरदुरी फ़िनिश, बाहरी प्राइमर के ऊपर' },
      },
    },
    falseCeiling: {
      label: 'फ़ॉल्स सीलिंग?',
      options: {
        none: { label: 'नहीं', note: 'स्लैब पर पेंट होगा' },
        hall: { label: 'लिविंग रूम', note: 'लिविंग और डाइनिंग एरिया में जिप्सम बोर्ड' },
        rooms: { label: 'लिविंग रूम और बेडरूम', note: 'रसोई और बाथरूम को छोड़कर हर कमरे में जिप्सम बोर्ड' },
      },
    },
    tileSize: {
      label: 'फ़र्श की टाइल का साइज़',
      tip: {
        title: 'बड़ी टाइलें',
        body: 'बड़ी टाइलों में जोड़ कम होते हैं, इसलिए वे साफ़ दिखती हैं, लेकिन कटाई में ज़्यादा टूटती हैं और उन्हें अडेसिव की मोटी परत चाहिए। रिपोर्ट उनके लिए ज़्यादा अतिरिक्त मात्रा जोड़ती है।',
        is: 'IS 15622:2006; निर्माताओं की डेटा शीट',
      },
      options: {
        '600x600': { label: '600 × 600 mm', note: 'आम फ़र्श की टाइल' },
        '800x800': { label: '800 × 800 mm', note: 'कम जोड़, ज़्यादा टूट-फूट' },
        '600x1200': { label: '600 × 1200 mm', note: 'लंबी और बड़ी, खुले कमरों के लिए' },
      },
    },
    lay: {
      label: 'वे कैसे बिछाई जाएँगी?',
      options: {
        straight: { label: 'सीधी', note: 'दीवारों के समानांतर कतारों में' },
        diagonal: { label: 'तिरछी', note: '45 डिग्री पर। किनारों की कटाई के लिए ज़्यादा टाइल लगती है' },
      },
    },
    tileFix: {
      label: 'टाइलें कैसे लगाई जाएँगी?',
      options: {
        mortar: { label: 'सीमेंट मसाले की परत', note: 'टाइल के नीचे सीमेंट और रेत, आम तरीक़ा' },
        adhesive: { label: 'टाइल अडेसिव', note: 'समतल फ़र्श पर अडेसिव की पतली परत' },
      },
    },
    bathTile: {
      label: 'बाथरूम की दीवार की टाइलें',
      options: {
        full: { label: 'दरवाज़े की ऊँचाई तक', note: 'क़रीब 2.1 m, 300 × 600 mm की टाइलें' },
        half: { label: 'आधी ऊँचाई तक', note: 'क़रीब 1.2 m, ऊपर पेंट' },
      },
    },
    kitchenShape: {
      label: 'रसोई के काउंटर का आकार',
      options: {
        straight: { label: 'सीधा', note: 'एक दीवार के साथ एक कतार' },
        l: { label: 'L आकार', note: 'कोने पर दो कतारें' },
        u: { label: 'U आकार', note: 'तीन कतारें' },
      },
    },
    kitchenCabinets: { label: 'काउंटर के नीचे और ऊपर कैबिनेट?', hint: 'अगर आप रेडीमेड किचन ख़रीदेंगे या बाद में लगवाएँगे तो “नहीं” चुनिए।' },
    wardrobes: {
      label: 'बिल्ट-इन वार्डरोब',
      options: {
        none: { label: 'कोई नहीं', note: 'आप फ़र्नीचर ख़रीदेंगे या बाद में लगवाएँगे' },
        master: { label: 'मास्टर बेडरूम', note: 'हर घर में एक 2.4 m का वार्डरोब' },
        all: { label: 'हर बेडरूम', note: 'मास्टर में 2.4 m, बाक़ी में 1.8 m' },
      },
    },
  },
}

export const FORMS_HI: Record<TradeSlug, FormHi> = {
  masonpro: masonry,
  electropro: electrical,
  plumbpro: plumbing,
  interiorpro: interior,
}

/** The form in the visitor's language. English returns the spec itself, untouched. */
export function localizeForm(spec: FormSpec, locale: string): FormSpec {
  if (locale !== 'hi') return spec
  const hi = FORMS_HI[spec.slug]
  if (!hi) return spec
  const field = (f: FieldSpec): FieldSpec => {
    const h = hi.fields[f.id]
    if (!h) return f
    const out = {
      ...f,
      label: h.label,
      hint: h.hint ?? f.hint,
      tip: f.tip ? (h.tip ?? f.tip) : undefined,
    } as FieldSpec
    if (f.kind === 'choice' && out.kind === 'choice') {
      out.options = f.options.map(o => {
        const ho = h.options?.[o.value]
        return ho ? { value: o.value, label: ho.label, note: ho.note ?? o.note } : o
      })
    }
    if (f.kind === 'number' && out.kind === 'number' && h.placeholder !== undefined) out.placeholder = h.placeholder
    return out
  }
  return {
    ...spec,
    heading: hi.heading,
    sub: hi.sub,
    freeLine: hi.freeLine,
    groups: spec.groups.map(g => {
      const hg = hi.groups[g.title]
      return { ...g, title: hg?.title ?? g.title, intro: g.intro ? (hg?.intro ?? g.intro) : undefined, fields: g.fields.map(field) }
    }),
  }
}
