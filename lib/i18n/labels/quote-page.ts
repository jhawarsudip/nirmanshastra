/*
  Hindi for /compare-quote ("Check a contractor's quantities"), app/[locale]/compare-quote/page.tsx.
  The page is a guide: it runs no calculation and calls no API, so there is no server-sent text to look up.

  Copy object: English first (word for word what the page said before), Hindi typed as the English shape, so a missing key fails tsc.
  The five verdict words (Low / Close / Common / High / Unit?) are the same Hindi as the StructurePro quote check
  (app/[locale]/tools/structopro/results-copy.ts): कम / क़रीब / आम / ज़्यादा / इकाई?.
  `[[...]]` in the Hindi marks a title or a name that stays in English (the study's title, the reporting firm); the page writes it in a lang="en" span.
  The rupee price of the StructurePro report is passed in from lib/tool-pricing.ts through lib/v2/content.ts; it is not typed here.
*/
import type { Copy } from '../copy'

const en = {
  eyebrow: 'Check a quote',
  name: 'Check a contractor’s quantities',
  blurb: 'Two quotes mean nothing until you know what each one counts. Ask for four quantities, then set them beside what the Indian Standards need for your frame.',

  askTitle: 'Ask for these four figures',
  askSub: 'Any contractor or engineer who has priced your frame has worked these out. If they cannot give you the quantity behind a price, that is the first thing to learn.',
  askHead: ['Material', 'Unit it is quoted in', 'What to ask for'],
  askRows: [
    ['Concrete', 'cubic metres (m³) or cubic feet (cft)', 'The volume member by member: footings, columns, beams, slabs, stairs. One cubic metre is about 35.3 cubic feet.'],
    ['Steel', 'kilograms, quintals (100 kg) or tonnes', 'The bar bending schedule, which lists every bar by member, diameter, length and weight. Ask whether the total is the steel in the drawing or the steel to be ordered, which has cutting waste on top.'],
    ['Cement', '50 kg bags', 'The concrete mix assumed (M20, M25) and the bags allowed for each cubic metre of it.'],
    ['Shuttering', 'square feet or square metres of contact area', 'The area worked out for each member, and how many times the plates are expected to be reused.'],
  ],

  readTitle: 'How a figure is read',
  readSub: 'Your StructurePro report gives each quantity with a range around it. The check places the contractor’s figure against that range and against the range found in real buildings. It never says anyone overcharged: every answer is a question to ask.',
  readHead: ['Reads as', 'It means', 'What to do'],
  readRows: [
    ['Low', 'Below the lowest this frame should need.', 'Ask whether something is left out, such as the staircase, lintels, balcony slabs or foundations, or whether a smaller building was priced.'],
    ['Close', 'From the low end of the range up to about 10% above the code figure.', 'In line with a frame designed to the Indian Standards. Built houses usually use a little more, so this is normal.'],
    ['Common', 'Above the code figure but inside the range real buildings fall in.', 'Site practice adds margin that no code asks for. Ask how much is built in and where.'],
    ['High', 'Above everything we would expect for this frame.', 'Ask for the working behind it. Check the scope: this report counts the reinforced-concrete frame only, not a boundary wall, a tank or a septic tank.'],
    ['Unit?', 'More than four times, or less than a quarter of, the report figure.', 'Almost always a unit slip: cubic feet read as cubic metres, or quintals as kilograms. Check the unit, then ask what the figure covers.'],
  ],
  readNote: 'The range for real buildings comes from a published study of 26 residential buildings completed since 2020, with quantities taken from their Bills of Quantities: GKSPL, Building the Baseline: Embodied Carbon in India’s Urban Housing, v1, March 2026, as reported by Conserve Consultants, 29 April 2026. The study does not publish how many buildings fell in each class, so the range is orientation, not a prediction for your house.',

  goKicker: 'Do it for your own house',
  goTitle: 'The check sits at the bottom of your StructurePro report',
  goText: (price: string) => `It needs the quantities of your own frame, so it is part of the ${price} StructurePro report. Get the report, then type your contractor’s concrete, steel, cement and shuttering figures into the panel. It runs in your browser; nothing you type is sent or stored.`,
  goButton: 'Get my frame’s quantities',

  note: 'This covers the reinforced-concrete frame only. It is not a quotation, a price check or a structural approval. For the final bar bending schedule, go to the structural engineer who signs your drawings.',
}

const hi: typeof en = {
  eyebrow: 'कोटेशन जाँचिए',
  name: 'ठेकेदार की मात्राएँ जाँचिए',
  blurb: 'दो कोटेशन तब तक कुछ नहीं बताते जब तक आपको पता न हो कि हर एक में क्या गिना गया है। चार मात्राएँ माँगिए, फिर उन्हें उस मात्रा के बगल में रखिए जो भारतीय मानकों के हिसाब से आपके ढाँचे को चाहिए।',

  askTitle: 'ये चार आँकड़े माँगिए',
  askSub: 'जिस भी ठेकेदार या इंजीनियर ने आपके ढाँचे का दाम लगाया है, उसने ये निकाले होंगे। अगर वे दाम के पीछे की मात्रा नहीं दे पाते, तो सबसे पहले यही जानना है।',
  askHead: ['सामग्री', 'जिस इकाई में दाम बताया जाता है', 'क्या माँगना है'],
  askRows: [
    ['कंक्रीट', 'घन मीटर (m³) या घन फ़ुट (cft)', 'हिस्सेवार आयतन: फुटिंग, कॉलम, बीम, स्लैब, सीढ़ी। एक घन मीटर लगभग 35.3 घन फ़ुट होता है।'],
    ['स्टील', 'किलोग्राम, क्विंटल (100 kg) या टन', 'बार बेंडिंग शेड्यूल, जिसमें हर सरिया हिस्से, व्यास, लंबाई और वज़न के साथ लिखा होता है। पूछिए कि कुल वज़न ड्रॉइंग में दिखे स्टील का है या मँगवाए जाने वाले स्टील का, जिसमें ऊपर से कटिंग की बर्बादी जुड़ी होती है।'],
    ['सीमेंट', '50 kg के बैग', 'कंक्रीट का कौन-सा मिश्रण माना गया (M20, M25), और उसके हर घन मीटर के लिए कितने बैग रखे गए।'],
    ['शटरिंग', 'संपर्क क्षेत्र के वर्ग फ़ुट या वर्ग मीटर', 'हर हिस्से के लिए निकाला गया क्षेत्रफल, और प्लेटों को कितनी बार दोबारा इस्तेमाल करने की उम्मीद है।'],
  ],

  readTitle: 'आँकड़ा कैसे पढ़ा जाता है',
  readSub: 'आपकी StructurePro रिपोर्ट हर मात्रा को उसके चारों ओर एक दायरे के साथ देती है। यह जाँच ठेकेदार के आँकड़े को उस दायरे के सामने और असली इमारतों में मिलने वाले दायरे के सामने रखती है। यह कभी नहीं कहती कि किसी ने ज़्यादा पैसे लिए: हर जवाब एक पूछने लायक सवाल है।',
  readHead: ['ऐसे पढ़ा जाता है', 'इसका मतलब', 'क्या करें'],
  readRows: [
    ['कम', 'इस ढाँचे को जितना कम से कम चाहिए, उससे नीचे।', 'पूछिए कि कुछ छूटा तो नहीं, जैसे सीढ़ी, लिंटल, बालकनी की स्लैब या नींव, या कहीं छोटी इमारत का दाम तो नहीं लगाया गया।'],
    ['क़रीब', 'दायरे के निचले सिरे से लेकर कोड के आँकड़े से लगभग 10% ऊपर तक।', 'यह भारतीय मानकों के अनुसार डिज़ाइन किए गए ढाँचे के अनुरूप है। बने हुए घरों में आमतौर पर थोड़ा ज़्यादा लगता है, इसलिए यह सामान्य है।'],
    ['आम', 'कोड के आँकड़े से ऊपर, पर उस दायरे के भीतर जिसमें असली इमारतें आती हैं।', 'साइट का चलन ऐसा मार्जिन जोड़ता है जो कोई कोड नहीं माँगता। पूछिए कि कितना मार्जिन कहाँ जोड़ा गया है।'],
    ['ज़्यादा', 'इस ढाँचे के लिए हमारी हर अपेक्षा से ऊपर।', 'उसके पीछे का हिसाब माँगिए। दायरा जाँचिए: यह रिपोर्ट सिर्फ़ रीइन्फ़ोर्स्ड-कंक्रीट ढाँचा गिनती है, चारदीवारी, टंकी या सेप्टिक टैंक नहीं।'],
    ['इकाई?', 'रिपोर्ट के आँकड़े से चार गुना से ज़्यादा, या उसके चौथाई से कम।', 'लगभग हमेशा इकाई की चूक होती है: घन फ़ुट को घन मीटर पढ़ लेना, या क्विंटल को किलोग्राम। इकाई जाँचिए, फिर पूछिए कि आँकड़ा किस-किस को शामिल करता है।'],
  ],
  readNote: 'असली इमारतों का दायरा 2020 के बाद पूरी हुई 26 रिहायशी इमारतों के प्रकाशित अध्ययन से आता है, जिनकी मात्राएँ उनके बिल ऑफ़ क्वांटिटीज़ से ली गईं: [[GKSPL, Building the Baseline: Embodied Carbon in India’s Urban Housing, v1]], मार्च 2026, जैसा [[Conserve Consultants]] ने 29 अप्रैल 2026 को बताया। अध्ययन यह नहीं बताता कि हर वर्ग में कितनी इमारतें आईं, इसलिए यह दायरा एक दिशा-संकेत है, आपके घर की भविष्यवाणी नहीं।',

  goKicker: 'अपने घर के लिए कीजिए',
  goTitle: 'यह जाँच आपकी StructurePro रिपोर्ट के सबसे नीचे है',
  goText: (price: string) => `इसके लिए आपके अपने ढाँचे की मात्राएँ चाहिए, इसलिए यह ${price} वाली StructurePro रिपोर्ट का हिस्सा है। रिपोर्ट पाइए, फिर पैनल में अपने ठेकेदार के कंक्रीट, स्टील, सीमेंट और शटरिंग के आँकड़े डालिए। यह आपके ब्राउज़र में चलता है; आप जो भी डालते हैं वह न भेजा जाता है, न सेव किया जाता है।`,
  goButton: 'मेरे ढाँचे की मात्राएँ पाइए',

  note: 'यह सिर्फ़ रीइन्फ़ोर्स्ड-कंक्रीट ढाँचे के लिए है। यह कोटेशन, दाम की जाँच या स्ट्रक्चरल मंज़ूरी नहीं है। अंतिम बार बेंडिंग शेड्यूल के लिए उस स्ट्रक्चरल इंजीनियर के पास जाइए जो आपकी ड्रॉइंग पर दस्तख़त करता है।',
}

export const QUOTE_PAGE: Copy<typeof en> = { en, hi }
