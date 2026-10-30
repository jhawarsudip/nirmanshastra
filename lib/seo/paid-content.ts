// ─────────────────────────────────────────────────────────────────────────────
// Answer-first content for the 6 paid quantity-report pages (StructurePro … Grand Total).
//
// RULES
//  • No price is typed here. Prices are read from lib/tool-pricing.ts via site.ts.
//  • CLAUDE.md: "Never reveal paid quantities before server HMAC verification."
//    So every worked example uses ONLY numbers the free calculators / free guides
//    already publish (bricks per m², litres per person, wire sizes, interior
//    paint/tile constants). It is a sample of the method, never a per-project paid
//    output. The old per-sq-ft thumb rules are not used on any product page.
//  • Every figure traces to an engine constant; `source` says which.
// ─────────────────────────────────────────────────────────────────────────────

import { getTool, priceOfTool, inr } from '@/lib/seo/site'
import { PRICE, PACK_CLAIMS_PER_REPORT } from '@/lib/tool-pricing'
import type { CalcFaq, CalcFaqBi } from '@/lib/seo/calc-content'

export interface PaidExampleRow {
  label: string
  value: string
  note?: string
}

/** The page words of one product page. */
export interface PaidText {
  /** e.g. "What StructurePro gives you" */
  heading: string
  whatsInside: string[]
  whoFor: string
  example: { title: string; intro: string; rows: PaidExampleRow[]; footnote: string }
  faq: CalcFaq[]
}

export interface PaidContent extends PaidText {
  /** The same page in Hindi (the English fields above keep the shape schema.ts, llms.ts and the scripts read). */
  hi: PaidText
  /** Where the numbers come from, for re-verification (not rendered). */
  source: string
}

/** The page words in the page language. Falls back to the English if the Hindi lists do not line up with it. */
export function pickPaid(c: PaidContent, locale: string): PaidText {
  const h = c.hi
  const lines =
    h.whatsInside.length === c.whatsInside.length &&
    h.example.rows.length === c.example.rows.length &&
    h.faq.length === c.faq.length
  if (locale === 'hi' && lines) return h
  return { heading: c.heading, whatsInside: c.whatsInside, whoFor: c.whoFor, example: c.example, faq: c.faq }
}

/** The FAQ with each item's Hindi beside it, the shape <CalcFaq/> takes. */
export function paidFaqBi(c: PaidContent): CalcFaqBi[] {
  return c.faq.map((f, i) => ({ ...f, hi: c.hi.faq[i] ?? f }))
}

const priceLine = (path: string) => {
  const t = getTool(path)
  const p = t ? priceOfTool(t) : null
  return p === null ? '' : inr(p)
}

export const PAID_CONTENT: Record<string, PaidContent> = {
  // ── StructurePro ───────────────────────────────────────────────────────────
  '/tools/structopro': {
    heading: 'What StructurePro gives you',
    whatsInside: [
      'Concrete, steel, cement, sand, coarse aggregate and shuttering quantities for the whole RCC structure, worked out from a few answers about your building.',
      'Steel by bar diameter, with the number of 12 m bars to buy.',
      'Column and beam sizes with their bars and stirrups, floor by floor.',
      'Footings (or a raft on weak ground), plinth beams, slabs and the staircase, each counted on its own.',
      'Lintels, sunshades, the terrace parapet band and the stair head-room roof, counted from your plan.',
      'An open parking level under the house and balconies that stick out, counted when you have them. Wind is checked alongside earthquake and the larger force is used.',
      'The earthquake zone for your city (IS 1893) and checks against IS 456, IS 875 Part 3 and IS 13920, with the clause shown.',
      'A range around every total, because the real figure depends on your drawings.',
      'A 3D model of the structure that matches the quantities, and a PDF report for your contractor and engineer.',
    ],
    whoFor:
      'Homeowners and small builders planning a new RCC house, from one floor up to G+5, with or without parking underneath, who want to know how much concrete, steel and cement the frame needs before they speak to a contractor.',
    example: {
      title: 'How it works: a few answers in, a full quantity list out',
      intro:
        'You do not need drawings or bar sizes. Tell us the four things below and the quantities are worked out on our side.',
      rows: [
        { label: 'Built-up area of each floor', value: 'In sq ft', note: 'Sets the plan size and the number of floors' },
        { label: 'City and state', value: 'Earthquake zone', note: 'IS 1893 zone, which decides the ductile detailing' },
        { label: 'Ground', value: 'Soil and slope', note: 'Decides the foundation: footings or a raft' },
        { label: 'Walls', value: 'Brick or block', note: 'Sets the wall load carried by the beams' },
        { label: 'Parking and balconies', value: 'Open level, balcony count', note: 'An open ground level gets larger columns; balconies get their own slabs' },
      ],
      footnote:
        'The model chooses the rest from the Indian Standards: the column grid, member sizes, bars, concrete mixes and the cutting waste. The report states every assumption it made.',
    },
    faq: [
      {
        question: 'What does StructurePro calculate?',
        answer:
          'It works out the quantities for the RCC structure of a house: concrete, steel, cement, sand, coarse aggregate, shuttering and binding wire. The report gives column and beam sizes with their bars, steel by bar diameter, footings, slabs, the staircase and the smaller items, all worked out to the Indian Standards.',
      },
      {
        question: 'How much does StructurePro cost?',
        answer: `The StructurePro report costs ${priceLine('/tools/structopro')} per report.`,
      },
      {
        question: 'How much cement and steel does a house need?',
        answer:
          'There is no honest single figure per square foot. The real quantity depends on the number of floors, the earthquake zone, the ground and the column grid. Rules of thumb are only a rough sanity check. StructurePro works it out for your own plan and shows a range around each total.',
      },
      {
        question: 'Which IS codes does StructurePro follow?',
        answer:
          'IS 456:2000 for concrete, IS 875 for loads, IS 1893 for earthquake forces, IS 13920:2016 for ductile detailing, IS 1786:2008 for reinforcement bars and IS 10262 for concrete mixes. Cement, sand and aggregate for the common mixes follow the CPWD Analysis of Rates.',
      },
      {
        question: 'What is not included in the StructurePro report?',
        answer:
          'The report counts the RCC frame only: footings, plinth beams, columns, beams, slabs, the staircase, balconies, lintels and sunshades. It leaves out brick walls and plaster (MasonryPro covers those), electrical, plumbing and finishes, a soil test, and a structural design for your drawing. It also carries no labour, material rate or rupee figure, so you can lay it next to any quote and compare line by line.',
      },
      {
        question: 'Does it handle parking underneath and balconies?',
        answer:
          'Yes. If the ground level is left open for parking, its columns are made larger and the earthquake force on it is raised, as IS 1893 asks for an open storey. Balconies are sized as cantilever slabs with their own top bars. Wind is checked alongside earthquake (IS 875 Part 3) and the larger of the two is used.',
      },
      {
        question: 'Is StructurePro a structural design?',
        answer:
          'No. It is a code-based quantity estimate with its assumptions stated. A structural engineer must design the structure and sign the drawings. Use the report to budget, to check a contractor’s quantities for gross errors and to order the first lots.',
      },
    ],
    source:
      'lib/structopro-qty (model.ts; report assumptions and not-counted lists). Quantities-only model, no labour or rate inputs. No worked numbers are printed here, so no paid output is revealed; prices via tool-pricing.',
    hi: {
      heading: 'StructurePro से आपको क्या मिलता है',
      whatsInside: [
        'पूरे RCC ढाँचे के लिए कंक्रीट, स्टील, सीमेंट, रेत, मोटी गिट्टी और शटरिंग की मात्राएँ, आपकी इमारत के बारे में कुछ जवाबों से निकाली हुईं।',
        'बार के व्यास के हिसाब से स्टील, साथ में ख़रीदने के 12 m के बार की गिनती।',
        'कॉलम और बीम के साइज़ उनके बार और स्टिरप के साथ, मंज़िल दर मंज़िल।',
        'फुटिंग (या कमज़ोर ज़मीन पर राफ़्ट), प्लिंथ बीम, स्लैब और सीढ़ी, हर एक अलग से गिनी हुई।',
        'लिंटल, सनशेड, छत की पैरापेट पट्टी और सीढ़ी के हेड-रूम की छत, आपके नक्शे से गिने हुए।',
        'घर के नीचे खुला पार्किंग तल और बाहर निकली बालकनी, जब आपके पास हों तब गिने जाते हैं। भूकंप के साथ हवा का भी हिसाब लगाया जाता है और जो बल ज़्यादा हो, वही लिया जाता है।',
        'आपके शहर का भूकंप ज़ोन (IS 1893) और IS 456, IS 875 भाग 3 और IS 13920 के मुक़ाबले जाँच, क्लॉज़ दिखाकर।',
        'हर कुल के आसपास एक रेंज, क्योंकि असली आँकड़ा आपके नक्शों पर निर्भर करता है।',
        'मात्राओं से मेल खाता ढाँचे का 3D मॉडल, और आपके ठेकेदार और इंजीनियर के लिए PDF रिपोर्ट।',
      ],
      whoFor:
        'नया RCC घर बनाने की योजना बना रहे घर मालिक और छोटे बिल्डर, एक मंज़िल से G+5 तक, नीचे पार्किंग के साथ या उसके बिना, जो ठेकेदार से बात करने से पहले जानना चाहते हैं कि ढाँचे को कितना कंक्रीट, स्टील और सीमेंट चाहिए।',
      example: {
        title: 'यह कैसे काम करता है: कुछ जवाब अंदर, पूरी मात्रा-सूची बाहर',
        intro:
          'आपको नक्शों या बार के साइज़ की ज़रूरत नहीं। हमें नीचे की चार बातें बताइए और मात्राएँ हमारी तरफ़ निकल आती हैं।',
        rows: [
          { label: 'हर मंज़िल का बिल्ट-अप एरिया', value: 'sq ft में', note: 'प्लान का साइज़ और मंज़िलों की गिनती तय करता है' },
          { label: 'शहर और राज्य', value: 'भूकंप ज़ोन', note: 'IS 1893 ज़ोन, जो डक्टाइल डिटेलिंग तय करता है' },
          { label: 'ज़मीन', value: 'मिट्टी और ढलान', note: 'नींव तय करता है: फुटिंग या राफ़्ट' },
          { label: 'दीवारें', value: 'ईंट या ब्लॉक', note: 'बीमों पर आने वाला दीवार का भार तय करता है' },
          { label: 'पार्किंग और बालकनी', value: 'खुला तल, बालकनी की गिनती', note: 'खुले ग्राउंड तल के कॉलम बड़े होते हैं; बालकनी के अपने स्लैब होते हैं' },
        ],
        footnote:
          'बाक़ी सब मॉडल भारतीय मानकों से चुनता है: कॉलम ग्रिड, मेंबर के साइज़, बार, कंक्रीट मिक्स और कटिंग की बर्बादी। रिपोर्ट अपनी हर मान्यता बताती है।',
      },
      faq: [
        {
          question: 'StructurePro क्या निकालता है?',
          answer:
            'यह घर के RCC ढाँचे की मात्राएँ निकालता है: कंक्रीट, स्टील, सीमेंट, रेत, मोटी गिट्टी, शटरिंग और बाइंडिंग वायर। रिपोर्ट कॉलम और बीम के साइज़ उनके बार के साथ, बार के व्यास के हिसाब से स्टील, फुटिंग, स्लैब, सीढ़ी और छोटी चीज़ें देती है, सब भारतीय मानकों के अनुसार निकाली हुई।',
        },
        {
          question: 'StructurePro की क़ीमत कितनी है?',
          answer:
            `StructurePro रिपोर्ट की क़ीमत प्रति रिपोर्ट ${priceLine('/tools/structopro')} है।`,
        },
        {
          question: 'एक घर को कितना सीमेंट और स्टील चाहिए?',
          answer:
            'प्रति वर्ग फ़ुट का कोई एक ईमानदार आँकड़ा नहीं होता। असली मात्रा मंज़िलों की गिनती, भूकंप ज़ोन, ज़मीन और कॉलम ग्रिड पर निर्भर करती है। मोटे अंदाज़ के नियम सिर्फ़ मोटी जाँच के लिए हैं। StructurePro इसे आपके अपने प्लान के लिए निकालता है और हर कुल के आसपास एक रेंज दिखाता है।',
        },
        {
          question: 'StructurePro कौन-से IS कोड मानता है?',
          answer:
            'कंक्रीट के लिए IS 456:2000, भार के लिए IS 875, भूकंप बलों के लिए IS 1893, डक्टाइल डिटेलिंग के लिए IS 13920:2016, रीइन्फ़ोर्समेंट बार के लिए IS 1786:2008 और कंक्रीट मिक्स के लिए IS 10262। आम मिक्सों के लिए सीमेंट, रेत और गिट्टी CPWD दर विश्लेषण को मानते हैं।',
        },
        {
          question: 'StructurePro की रिपोर्ट में क्या शामिल नहीं है?',
          answer:
            'रिपोर्ट सिर्फ़ RCC ढाँचा गिनती है: फुटिंग, प्लिंथ बीम, कॉलम, बीम, स्लैब, सीढ़ी, बालकनी, लिंटल और सनशेड। इसमें ईंट की दीवारें और प्लास्टर नहीं हैं (वे MasonryPro में हैं), न बिजली, प्लंबिंग और फ़िनिश, न मिट्टी की जाँच, न आपके ड्रॉइंग का स्ट्रक्चरल डिज़ाइन। इसमें कोई मज़दूरी, सामग्री का रेट या रुपये का आँकड़ा भी नहीं है, इसलिए आप इसे किसी भी कोटेशन के बगल में रखकर पंक्ति-दर-पंक्ति मिला सकते हैं।',
        },
        {
          question: 'क्या यह नीचे पार्किंग और बालकनी संभालता है?',
          answer:
            'हाँ। अगर ग्राउंड तल पार्किंग के लिए खुला छोड़ा गया है, तो उसके कॉलम बड़े किए जाते हैं और उस पर भूकंप का बल बढ़ाया जाता है, जैसा IS 1893 खुली मंज़िल के लिए माँगता है। बालकनी को कैंटिलीवर स्लैब की तरह साइज़ किया जाता है, अपने ऊपरी बार के साथ। भूकंप के साथ हवा भी जाँची जाती है (IS 875 भाग 3) और दोनों में जो बड़ा हो वही लिया जाता है।',
        },
        {
          question: 'क्या StructurePro एक स्ट्रक्चरल डिज़ाइन है?',
          answer:
            'नहीं। यह कोड पर आधारित मात्रा का अनुमान है, जिसकी मान्यताएँ बताई गई हैं। ढाँचे का डिज़ाइन और ड्रॉइंग पर दस्तख़त स्ट्रक्चरल इंजीनियर को ही करने होंगे। रिपोर्ट का इस्तेमाल बजट बनाने, ठेकेदार की मात्राओं में बड़ी ग़लतियाँ पकड़ने और पहली खेपें मँगाने के लिए कीजिए।',
        },
      ],
    },
  },

  // ── MasonryPro ─────────────────────────────────────────────────────────────
  '/tools/masonpro': {
    heading: 'What MasonryPro gives you',
    whatsInside: [
      'Bricks or blocks for the outer walls, inner walls, plinth, terrace parapet and stair room, worked out from your rooms. Five wall materials: red clay brick, modular brick, fly-ash brick, AAC block and concrete block.',
      'Mortar, cement and sand for the joints, for the plaster inside and out, and for the lintels, each with its mix.',
      'Doors, windows and ventilators taken out of the walls the way IS 1200 measures them, with a lintel over every opening.',
      'Plaster area inside and outside, with the CPWD plaster yield for each coat.',
      'Thin-bed adhesive by weight when you choose AAC.',
      'Checks against IS 1905, IS 2250, IS 2402, IS 4326 and the block standards, with the clause shown, every assumption stated, what is not counted, and a range around each total.',
    ],
    whoFor:
      'Homeowners and small builders who want the brick or block, mortar, cement, sand and plaster quantities for the walls before they speak to a mason or contractor.',
    example: {
      title: 'How it works: a few answers in, a full wall list out',
      intro:
        'You do not need a plan. Tell us the rooms and the wall material and the walls are measured on our side.',
      rows: [
        { label: 'Floors and area', value: 'From your project', note: 'Sets the length of the outer walls' },
        { label: 'Bedrooms, bathrooms, kitchens, balconies', value: 'Per home', note: 'Sets the inner walls, doors and windows' },
        { label: 'Wall material', value: 'Brick or block', note: 'Sets the count per m², the joint and the mortar' },
        { label: 'Plaster', value: 'One or two coats outside', note: 'Sets the plaster mortar per m²' },
      ],
      footnote:
        'The model chooses the rest from the Indian Standards and the CPWD Analysis of Rates: the room sizes, the heights, the opening schedule, the mortar mixes and the waste. The report states every assumption it made.',
    },
    faq: [
      {
        question: 'What does MasonryPro calculate?',
        answer:
          'The bricks or blocks, joint mortar, cement, sand, plaster area and lintels for the walls of a framed house or building. The report measures the walls from your rooms, takes out the openings as IS 1200 does, and gives every quantity with its basis.',
      },
      {
        question: 'How much does MasonryPro cost?',
        answer: `The MasonryPro report costs ${priceLine('/tools/masonpro')} per report.`,
      },
      {
        question: 'Which wall materials does it cover?',
        answer:
          'Red clay brick, modular clay brick, fly-ash brick, AAC block (in thin adhesive or cement mortar) and concrete block, with 230 or 115 mm brick walls and 200 or 150 mm outer block walls.',
      },
      {
        question: 'How is it different from the free Brick Calculator?',
        answer:
          'The free Brick Calculator counts bricks for one wall at a time from its length and height. MasonryPro starts from your rooms, works out every wall on every floor, and adds the mortar, cement, sand, plaster and lintels, so the totals will not match a single-wall count.',
      },
      {
        question: 'Does it include labour?',
        answer:
          'No. The report is about quantities, so it carries no labour and no rates of ours. If you want the material cost, you can type your own dealer’s rates into the optional rupee panel; labour, transport and taxes stay out of it. You can lay it next to any quote and compare line by line.',
      },
    ],
    source:
      'lib/qty/masonry/model.ts (IS 1077, 12894, 2185, 6041, 2572 sizes and joints; IS 1200 measurement; CPWD DAR 2014 plaster yields). Quantities-only model, no rate inputs. No worked numbers are printed here, so no paid output is revealed; prices via tool-pricing.',
    hi: {
      heading: 'MasonryPro से आपको क्या मिलता है',
      whatsInside: [
        'बाहरी दीवारों, भीतरी दीवारों, प्लिंथ, छत की पैरापेट और सीढ़ी के कमरे के लिए ईंटें या ब्लॉक, आपके कमरों से निकाले हुए। दीवार की पाँच सामग्रियाँ: लाल मिट्टी की ईंट, मॉड्यूलर ईंट, फ्लाई-ऐश ईंट, AAC ब्लॉक और कंक्रीट ब्लॉक।',
        'जोड़ों के लिए, भीतर-बाहर के प्लास्टर के लिए और लिंटल के लिए मसाला, सीमेंट और रेत, हर एक अपने मिक्स के साथ।',
        'दीवारों में से निकाले गए दरवाज़े, खिड़कियाँ और रोशनदान, जैसे IS 1200 उन्हें नापता है, हर खुले हिस्से के ऊपर एक लिंटल के साथ।',
        'भीतर और बाहर का प्लास्टर एरिया, हर कोट के लिए CPWD प्लास्टर यील्ड के साथ।',
        'AAC चुनने पर वज़न के हिसाब से थिन-बेड एडहेसिव।',
        'IS 1905, IS 2250, IS 2402, IS 4326 और ब्लॉक मानकों के मुक़ाबले जाँच, क्लॉज़ दिखाकर, हर मान्यता बताकर, यह बताकर कि क्या नहीं गिना गया, और हर कुल के आसपास एक रेंज।',
      ],
      whoFor:
        'घर मालिक और छोटे बिल्डर जो राजमिस्त्री या ठेकेदार से बात करने से पहले दीवारों की ईंट या ब्लॉक, मसाला, सीमेंट, रेत और प्लास्टर की मात्राएँ चाहते हैं।',
      example: {
        title: 'यह कैसे काम करता है: कुछ जवाब अंदर, पूरी दीवार-सूची बाहर',
        intro:
          'आपको नक्शे की ज़रूरत नहीं। हमें कमरे और दीवार की सामग्री बताइए और दीवारें हमारी तरफ़ नापी जाती हैं।',
        rows: [
          { label: 'मंज़िलें और एरिया', value: 'आपके प्रोजेक्ट से', note: 'बाहरी दीवारों की लंबाई तय करता है' },
          { label: 'बेडरूम, बाथरूम, रसोई, बालकनी', value: 'प्रति घर', note: 'भीतरी दीवारें, दरवाज़े और खिड़कियाँ तय करता है' },
          { label: 'दीवार की सामग्री', value: 'ईंट या ब्लॉक', note: 'प्रति m² गिनती, जोड़ और मसाला तय करता है' },
          { label: 'प्लास्टर', value: 'बाहर एक या दो कोट', note: 'प्रति m² प्लास्टर का मसाला तय करता है' },
        ],
        footnote:
          'बाक़ी सब मॉडल भारतीय मानकों और CPWD दर विश्लेषण से चुनता है: कमरों के साइज़, ऊँचाइयाँ, खुले हिस्सों की सूची, मसाले के मिक्स और बर्बादी। रिपोर्ट अपनी हर मान्यता बताती है।',
      },
      faq: [
        {
          question: 'MasonryPro क्या निकालता है?',
          answer:
            'किसी फ़्रेम वाले घर या इमारत की दीवारों के लिए ईंटें या ब्लॉक, जोड़ का मसाला, सीमेंट, रेत, प्लास्टर एरिया और लिंटल। रिपोर्ट आपके कमरों से दीवारें नापती है, खुले हिस्सों को वैसे घटाती है जैसे IS 1200 घटाता है, और हर मात्रा उसके आधार के साथ देती है।',
        },
        {
          question: 'MasonryPro की क़ीमत कितनी है?',
          answer:
            `MasonryPro रिपोर्ट की क़ीमत प्रति रिपोर्ट ${priceLine('/tools/masonpro')} है।`,
        },
        {
          question: 'यह कौन-सी दीवार सामग्रियाँ कवर करता है?',
          answer:
            'लाल मिट्टी की ईंट, मॉड्यूलर मिट्टी की ईंट, फ्लाई-ऐश ईंट, AAC ब्लॉक (थिन एडहेसिव या सीमेंट मसाले में) और कंक्रीट ब्लॉक, 230 या 115 mm की ईंट की दीवारों और 200 या 150 mm की बाहरी ब्लॉक दीवारों के साथ।',
        },
        {
          question: 'यह मुफ़्त ईंट कैलकुलेटर से कैसे अलग है?',
          answer:
            'मुफ़्त ईंट कैलकुलेटर एक बार में एक दीवार की ईंटें उसकी लंबाई और ऊँचाई से गिनता है। MasonryPro आपके कमरों से शुरू करता है, हर मंज़िल की हर दीवार निकालता है, और मसाला, सीमेंट, रेत, प्लास्टर और लिंटल जोड़ता है, इसलिए कुल एक दीवार की गिनती से नहीं मिलेंगे।',
        },
        {
          question: 'क्या इसमें मज़दूरी शामिल है?',
          answer:
            'नहीं। रिपोर्ट मात्राओं की है, इसलिए इसमें न मज़दूरी है और न हमारे कोई रेट। अगर आपको सामग्री की लागत चाहिए, तो आप वैकल्पिक रुपये वाले पैनल में अपने डीलर के रेट डाल सकते हैं; मज़दूरी, ढुलाई और टैक्स उसमें नहीं आते। आप इसे किसी भी कोटेशन के बगल में रखकर पंक्ति-दर-पंक्ति मिला सकते हैं।',
        },
      ],
    },
  },

  // ── ElectricalPro ──────────────────────────────────────────────────────────
  '/tools/electropro': {
    heading: 'What ElectricalPro gives you',
    whatsInside: [
      'Light, fan, exhaust, bell, socket and TV or data points counted room by room, from the room-wise tables of the BIS draft of IS 4648 or the socket schedule of IS 4648:1968, in proportion to the size of each room.',
      'The circuits and distribution boards: lighting, power, air conditioner, water heater, washing machine and the rest, each on its own breaker, with the MCBs and the 30 mA RCCB counted for every board.',
      'Copper wire by size and colour, in whole 90 m coils, with the earth wire in every circuit and the extra wire for the mains and sub-mains.',
      'Conduit by size, with the boxes, saddles, bends and couplers counted, and the cable from the meter to each board sized by the design load.',
      'The design load of the home, the single or three-phase supply it needs, and the earthing set.',
      'The Indian Standards checks with the clause shown, every assumption stated, what is not counted, and a range around each total.',
    ],
    whoFor:
      'Homeowners and small builders who want the points, wire, conduit and board quantities for the wiring of a house or a block of flats before they speak to an electrician or a contractor.',
    example: {
      title: 'How it works: a few answers in, a full wiring list out',
      intro:
        'You do not need a plan. Tell us the rooms and the big appliances and the wiring is counted on our side.',
      rows: [
        { label: 'Floors and area', value: 'From your project', note: 'Sets the size of the rooms and the length of every run' },
        { label: 'Bedrooms, bathrooms, kitchens, balconies', value: 'Per home', note: 'Sets the points in each room' },
        { label: 'Air conditioners, water heaters, inverter, EV charger', value: 'Yes or no, and how many', note: 'Each gets a circuit of its own' },
        { label: 'Standard or basic wiring', value: 'Your choice', note: 'Sets how many sockets each room gets' },
      ],
      footnote:
        'The model chooses the rest from the Indian Standards and the CPWD specifications: the circuit limits, the wire sizes, the conduit sizes, the board ways and the waste. The report states every assumption it made.',
    },
    faq: [
      {
        question: 'What does ElectricalPro calculate?',
        answer:
          'The electrical points, circuits, distribution boards, MCBs, wire by size and colour, conduit and fittings for the wiring of a house or building, counted room by room. It also works out the design load and the single or three-phase supply, and shows every assumption.',
      },
      {
        question: 'How much does ElectricalPro cost?',
        answer: `The ElectricalPro report costs ${priceLine('/tools/electropro')} per report.`,
      },
      {
        question: 'Which standards does it follow?',
        answer:
          'The room-wise points follow the BIS draft revision of IS 4648 (September 2024) for Standard wiring, and the socket schedule of IS 4648:1968 for Basic wiring. The circuit limits follow CPWD General Specifications for Electrical Works and the draft; the 30 mA residual current breaker on each board follows the draft, which points to IS 732:2019. The report names the clause for each check, and says where the text of a standard was not read in full. The draft is not yet published, and the report says so.',
      },
      {
        question: 'Why does Standard wiring count more points than my electrician does?',
        answer:
          'The 1968 standard asks for very few sockets, and most electricians now fit more. The BIS draft asks for many sockets in every room, and Standard follows it. Choose Basic to count with the older schedule instead.',
      },
      {
        question: 'Is there a free way to check a wire size?',
        answer:
          'Yes. The free Wire Size Calculator gives the least copper size, the breaker and the conduit for each kind of circuit, and for the supply from the meter by load. ElectricalPro counts the whole house: the points, the circuits, the boards, the wire and the conduit.',
      },
      {
        question: 'Does it include labour?',
        answer:
          'No. The report is about quantities, so it carries no labour and no rates of ours. If you want the material cost, you can type your own dealer’s rates into the optional rupee panel; labour, transport and taxes stay out of it. What is not counted, such as fittings, fans, lights and the meter, is listed in the report.',
      },
    ],
    source:
      'lib/qty/electrical/model.ts (BIS draft IS 4648 ETD 20 Sept 2024 Tables 2 to 6; IS 4648:1968 cl 9.8; IS 732:2019 (named by the draft, text not read); CPWD General Specifications for Electrical Works Part I GS 3.9 to 3.12). Quantities-only model, no rate inputs. No worked numbers are printed here, so no paid output is revealed; prices via tool-pricing.',
    hi: {
      heading: 'ElectricalPro से आपको क्या मिलता है',
      whatsInside: [
        'लाइट, पंखा, एग्ज़ॉस्ट, घंटी, सॉकेट और टीवी या डेटा पॉइंट, कमरे-दर-कमरे गिने हुए, IS 4648 के BIS मसौदे की कमरे-वार तालिकाओं या IS 4648:1968 की सॉकेट सूची से, हर कमरे के साइज़ के अनुपात में।',
        'सर्किट और डिस्ट्रीब्यूशन बोर्ड: लाइटिंग, पावर, एयर कंडीशनर, वॉटर हीटर, वॉशिंग मशीन और बाक़ी, हर एक अपने ब्रेकर पर, हर बोर्ड के लिए MCB और 30 mA RCCB की गिनती के साथ।',
        'साइज़ और रंग के हिसाब से तांबे का तार, पूरे 90 m के कॉइल में, हर सर्किट में अर्थ वायर के साथ और मेन तथा सब-मेन के लिए अतिरिक्त तार।',
        'साइज़ के हिसाब से कंड्यूट, बॉक्स, सैडल, बेंड और कपलर की गिनती के साथ, और मीटर से हर बोर्ड तक की केबल डिज़ाइन लोड के हिसाब से साइज़ की हुई।',
        'घर का डिज़ाइन लोड, उसे चाहिए सिंगल या थ्री फ़ेज़ सप्लाई, और अर्थिंग सेट।',
        'भारतीय मानकों की जाँच, क्लॉज़ दिखाकर, हर मान्यता बताकर, यह बताकर कि क्या नहीं गिना गया, और हर कुल के आसपास एक रेंज।',
      ],
      whoFor:
        'घर मालिक और छोटे बिल्डर जो इलेक्ट्रीशियन या ठेकेदार से बात करने से पहले किसी घर या फ़्लैटों के ब्लॉक की वायरिंग के पॉइंट, तार, कंड्यूट और बोर्ड की मात्राएँ चाहते हैं।',
      example: {
        title: 'यह कैसे काम करता है: कुछ जवाब अंदर, पूरी वायरिंग-सूची बाहर',
        intro:
          'आपको नक्शे की ज़रूरत नहीं। हमें कमरे और बड़े उपकरण बताइए और वायरिंग हमारी तरफ़ गिनी जाती है।',
        rows: [
          { label: 'मंज़िलें और एरिया', value: 'आपके प्रोजेक्ट से', note: 'कमरों का साइज़ और हर रन की लंबाई तय करता है' },
          { label: 'बेडरूम, बाथरूम, रसोई, बालकनी', value: 'प्रति घर', note: 'हर कमरे के पॉइंट तय करता है' },
          { label: 'एयर कंडीशनर, वॉटर हीटर, इन्वर्टर, EV चार्जर', value: 'हाँ या नहीं, और कितने', note: 'हर एक को अपना सर्किट मिलता है' },
          { label: 'स्टैंडर्ड या बेसिक वायरिंग', value: 'आपकी पसंद', note: 'हर कमरे को कितने सॉकेट मिलेंगे, यह तय करता है' },
        ],
        footnote:
          'बाक़ी सब मॉडल भारतीय मानकों और CPWD विनिर्देशों से चुनता है: सर्किट की सीमाएँ, तार के साइज़, कंड्यूट के साइज़, बोर्ड में सर्किट की जगहें और बर्बादी। रिपोर्ट अपनी हर मान्यता बताती है।',
      },
      faq: [
        {
          question: 'ElectricalPro क्या निकालता है?',
          answer:
            'किसी घर या इमारत की वायरिंग के लिए बिजली के पॉइंट, सर्किट, डिस्ट्रीब्यूशन बोर्ड, MCB, साइज़ और रंग के हिसाब से तार, कंड्यूट और फ़िटिंग, कमरे-दर-कमरे गिने हुए। यह डिज़ाइन लोड और सिंगल या थ्री फ़ेज़ सप्लाई भी निकालता है, और हर मान्यता दिखाता है।',
        },
        {
          question: 'ElectricalPro की क़ीमत कितनी है?',
          answer:
            `ElectricalPro रिपोर्ट की क़ीमत प्रति रिपोर्ट ${priceLine('/tools/electropro')} है।`,
        },
        {
          question: 'यह कौन-से मानक मानता है?',
          answer:
            'कमरे-वार पॉइंट स्टैंडर्ड वायरिंग के लिए IS 4648 के BIS मसौदा संशोधन (सितंबर 2024) को, और बेसिक वायरिंग के लिए IS 4648:1968 की सॉकेट सूची को मानते हैं। सर्किट की सीमाएँ इलेक्ट्रिकल कार्यों के लिए CPWD सामान्य विनिर्देशों और मसौदे को मानती हैं; हर बोर्ड पर 30 mA का रेज़िडुअल करंट ब्रेकर मसौदे को मानता है, जो IS 732:2019 की ओर इशारा करता है। रिपोर्ट हर जाँच का क्लॉज़ बताती है, और यह भी कि किसी मानक का पूरा पाठ कहाँ नहीं पढ़ा गया। मसौदा अभी प्रकाशित नहीं हुआ है, और रिपोर्ट यह कहती है।',
        },
        {
          question: 'स्टैंडर्ड वायरिंग मेरे इलेक्ट्रीशियन से ज़्यादा पॉइंट क्यों गिनती है?',
          answer:
            '1968 का मानक बहुत कम सॉकेट माँगता है, और ज़्यादातर इलेक्ट्रीशियन अब ज़्यादा लगाते हैं। BIS का मसौदा हर कमरे में कई सॉकेट माँगता है, और स्टैंडर्ड उसे मानता है। पुरानी सूची से गिनने के लिए बेसिक चुनिए।',
        },
        {
          question: 'क्या तार का साइज़ जाँचने का कोई मुफ़्त तरीक़ा है?',
          answer:
            'हाँ। मुफ़्त वायर साइज़ कैलकुलेटर हर तरह के सर्किट के लिए, और लोड के हिसाब से मीटर से आने वाली सप्लाई के लिए, सबसे कम तांबे का साइज़, ब्रेकर और कंड्यूट देता है। ElectricalPro पूरा घर गिनता है: पॉइंट, सर्किट, बोर्ड, तार और कंड्यूट।',
        },
        {
          question: 'क्या इसमें मज़दूरी शामिल है?',
          answer:
            'नहीं। रिपोर्ट मात्राओं की है, इसलिए इसमें न मज़दूरी है और न हमारे कोई रेट। अगर आपको सामग्री की लागत चाहिए, तो आप वैकल्पिक रुपये वाले पैनल में अपने डीलर के रेट डाल सकते हैं; मज़दूरी, ढुलाई और टैक्स उसमें नहीं आते। जो नहीं गिना गया, जैसे फ़िटिंग, पंखे, लाइटें और मीटर, उसकी सूची रिपोर्ट में दी गई है।',
        },
      ],
    },
  },

  // ── PlumbingPro ────────────────────────────────────────────────────────────
  '/tools/plumbpro': {
    heading: 'What PlumbingPro gives you',
    whatsInside: [
      'Water supply and drain pipe by size, in whole 3 m lengths, worked out floor by floor.',
      'Underground and overhead tank sizes for your water source, and the transfer pump.',
      'Every tap, valve, trap, fitting and fixture, counted.',
      'A septic tank and soak pit for your ground, or the sewer connection.',
      'Rain-water down-pipes for your roof.',
      'Checks against IS 1172, IS 1742, IS 5329 and IS 2470 with the clause shown, every assumption stated, what is not counted, and a range around each total.',
    ],
    whoFor:
      'Homeowners and small builders who want the pipes, tanks, pump and fixtures worked out before a plumber quotes.',
    example: {
      title: 'How it works: a few answers in, a full plumbing list out',
      intro:
        'You do not need a drawing. Tell us the homes, bathrooms and where the water comes from, and the sizes are worked out on our side.',
      rows: [
        { label: 'Homes, bedrooms and bathrooms', value: 'People and fixtures', note: 'Sets the water used and the pipe sizes' },
        { label: 'Water supply', value: 'Municipal, borewell or tanker', note: 'Sets the tank sizes and the pump' },
        { label: 'Sewer or septic tank', value: 'And the ground', note: 'Sets the drain and the soak pit' },
        { label: 'Rain', value: 'Heavy to extreme', note: 'Sets the number of down-pipes' },
      ],
      footnote:
        'The model chooses the rest from the Indian Standards: the fixture units, the flow, the pipe sizes and the tank split. The report states every assumption it made.',
    },
    faq: [
      {
        question: 'What does PlumbingPro calculate?',
        answer:
          'Pipe lengths by size, tank sizes, the transfer pump, every fitting and fixture, the drains, the septic tank and soak pit where there is no sewer, and the rain-water pipes, as an itemised plumbing quantity report worked out to the Indian Standards.',
      },
      {
        question: 'How much does PlumbingPro cost?',
        answer: `The PlumbingPro report costs ${priceLine('/tools/plumbpro')} per report.`,
      },
      {
        question: 'How much water per person does it assume?',
        answer:
          '135 litres per person per day on municipal supply and 150 on borewell supply (IS 1172:1993).',
      },
      {
        question: 'What tank does a family of 5 need?',
        answer:
          'On municipal supply, 5 people use 675 litres a day. The PlumbingPro report follows the NBC split: two-thirds underground and one-third overhead, which here is a 500 L underground tank and a 500 L overhead tank. The free Water Tank Size calculator uses the same split and gives the same tanks.',
      },
      {
        question: 'Does it include labour?',
        answer:
          'No. The report is about quantities, so it carries no labour and no rates of ours. If you want the material cost, you can type your own dealer’s rates into the optional rupee panel; labour, transport and taxes stay out of it. You can lay it next to any quote and compare line by line.',
      },
    ],
    source:
      'lib/qty/plumbing/model.ts (IS 1172 WATER_DEMAND_LPCD {135,150}; NBC Part 9 storage split; IS 1742, IS 5329, IS 2470 tables). Quantities-only model, no rate inputs. No worked numbers are printed here, so no paid output is revealed; prices via tool-pricing.',
    hi: {
      heading: 'PlumbingPro से आपको क्या मिलता है',
      whatsInside: [
        'पानी की सप्लाई और ड्रेन के पाइप साइज़ के हिसाब से, पूरी 3 m लंबाइयों में, मंज़िल दर मंज़िल निकाले हुए।',
        'आपके पानी के स्रोत के लिए अंडरग्राउंड और ओवरहेड टंकी के साइज़, और ट्रांसफ़र पंप।',
        'हर नल, वाल्व, ट्रैप, फ़िटिंग और फ़िक्सचर, गिना हुआ।',
        'आपकी ज़मीन के लिए सेप्टिक टैंक और सोक पिट, या सीवर कनेक्शन।',
        'आपकी छत के लिए बरसाती पानी के डाउन-पाइप।',
        'IS 1172, IS 1742, IS 5329 और IS 2470 के मुक़ाबले जाँच, क्लॉज़ दिखाकर, हर मान्यता बताकर, यह बताकर कि क्या नहीं गिना गया, और हर कुल के आसपास एक रेंज।',
      ],
      whoFor:
        'घर मालिक और छोटे बिल्डर जो प्लंबर के कोटेशन देने से पहले पाइप, टंकियाँ, पंप और फ़िक्सचर निकलवाना चाहते हैं।',
      example: {
        title: 'यह कैसे काम करता है: कुछ जवाब अंदर, पूरी प्लंबिंग-सूची बाहर',
        intro:
          'आपको ड्रॉइंग की ज़रूरत नहीं। हमें घर, बाथरूम और पानी कहाँ से आता है, यह बताइए, और साइज़ हमारी तरफ़ निकाले जाते हैं।',
        rows: [
          { label: 'घर, बेडरूम और बाथरूम', value: 'लोग और फ़िक्सचर', note: 'पानी की खपत और पाइप के साइज़ तय करता है' },
          { label: 'पानी की सप्लाई', value: 'नगरपालिका, बोरवेल या टैंकर', note: 'टंकियों के साइज़ और पंप तय करता है' },
          { label: 'सीवर या सेप्टिक टैंक', value: 'और ज़मीन', note: 'ड्रेन और सोक पिट तय करता है' },
          { label: 'बारिश', value: 'भारी से अत्यधिक', note: 'डाउन-पाइप की गिनती तय करती है' },
        ],
        footnote:
          'बाक़ी सब मॉडल भारतीय मानकों से चुनता है: फ़िक्सचर यूनिट, प्रवाह, पाइप के साइज़ और टंकी का बँटवारा। रिपोर्ट अपनी हर मान्यता बताती है।',
      },
      faq: [
        {
          question: 'PlumbingPro क्या निकालता है?',
          answer:
            'साइज़ के हिसाब से पाइप की लंबाइयाँ, टंकियों के साइज़, ट्रांसफ़र पंप, हर फ़िटिंग और फ़िक्सचर, ड्रेन, जहाँ सीवर नहीं है वहाँ सेप्टिक टैंक और सोक पिट, और बरसाती पानी के पाइप, भारतीय मानकों के अनुसार निकाली गई प्लंबिंग मात्राओं की एक आइटम-वार रिपोर्ट के रूप में।',
        },
        {
          question: 'PlumbingPro की क़ीमत कितनी है?',
          answer:
            `PlumbingPro रिपोर्ट की क़ीमत प्रति रिपोर्ट ${priceLine('/tools/plumbpro')} है।`,
        },
        {
          question: 'यह प्रति व्यक्ति कितना पानी मानता है?',
          answer:
            'नगरपालिका सप्लाई पर प्रति व्यक्ति प्रति दिन 135 लीटर और बोरवेल सप्लाई पर 150 (IS 1172:1993)।',
        },
        {
          question: '5 लोगों के परिवार को कौन-सी टंकी चाहिए?',
          answer:
            'नगरपालिका सप्लाई पर 5 लोग एक दिन में 675 लीटर इस्तेमाल करते हैं। PlumbingPro की रिपोर्ट NBC का बँटवारा मानती है: दो-तिहाई अंडरग्राउंड और एक-तिहाई ओवरहेड, जो यहाँ 500 L की अंडरग्राउंड टंकी और 500 L की ओवरहेड टंकी बनती है। मुफ़्त वॉटर टैंक साइज़ कैलकुलेटर यही बँटवारा लेता है और यही टंकियाँ देता है।',
        },
        {
          question: 'क्या इसमें मज़दूरी शामिल है?',
          answer:
            'नहीं। रिपोर्ट मात्राओं की है, इसलिए इसमें न मज़दूरी है और न हमारे कोई रेट। अगर आपको सामग्री की लागत चाहिए, तो आप वैकल्पिक रुपये वाले पैनल में अपने डीलर के रेट डाल सकते हैं; मज़दूरी, ढुलाई और टैक्स उसमें नहीं आते। आप इसे किसी भी कोटेशन के बगल में रखकर पंक्ति-दर-पंक्ति मिला सकते हैं।',
        },
      ],
    },
  },

  // ── InteriorPro ────────────────────────────────────────────────────────────
  '/tools/interiorpro': {
    heading: 'What InteriorPro gives you',
    whatsInside: [
      'Putty, primer and paint in litres and kilograms, inside and out, with the coats counted.',
      'Floor and wall tiles by size, in pieces and boxes, with the cement, sand or adhesive, grout and skirting that go with them.',
      'Doors and their frames, windows, ventilators and glass, and the door hardware.',
      'A false ceiling, board by board with the framing, and the plywood and laminate for wardrobes and the kitchen.',
      'Checks against IS 1200, IS 15622, IS 1003 and IS 2395 with the clause shown, every assumption stated, what is not counted, and a range around each total.',
    ],
    whoFor:
      'Homeowners and small builders who want the paint, tiles, doors, ceilings and plywood worked out before a contractor or designer quotes.',
    example: {
      title: 'How it works: a few answers in, a full finishing list out',
      intro:
        'You do not need a drawing. Tell us the rooms and the finishes you have in mind, and the areas are worked out on our side.',
      rows: [
        { label: 'Bedrooms, bathrooms and kitchens', value: 'Rooms and their walls', note: 'Sets the wall, ceiling and floor areas' },
        { label: 'Paint level and outside finish', value: 'Economy to premium', note: 'Sets the layers and the spread' },
        { label: 'Floor tile, laying and fixing', value: 'Size, pattern, bed', note: 'Sets the tiles, the extra and the cement or adhesive' },
        { label: 'Ceiling, kitchen and wardrobes', value: 'Yes or no', note: 'Sets the board, the framing and the plywood' },
      ],
      footnote:
        'The model chooses the rest from the Indian Standards and the makers’ data sheets: the openings, the coats, the wastage. The report states every assumption it made.',
    },
    faq: [
      {
        question: 'What does InteriorPro calculate?',
        answer:
          'Paint, putty and primer; floor and wall tiles with the bed or adhesive and grout; doors, windows and glass; a false ceiling; and the plywood and laminate for wardrobes and the kitchen. Each is counted from the rooms you describe, with a range around the total.',
      },
      {
        question: 'How much does InteriorPro cost?',
        answer: `The InteriorPro report costs ${priceLine('/tools/interiorpro')} per report.`,
      },
      {
        question: 'How does it measure the walls and floors?',
        answer:
          'It measures as IS 1200 does: floors before the skirting goes on, and an opening of up to 0.5 m² is not taken out of the paint. From 0.5 to 3 m² one face is taken out. The report shows each area it measured.',
      },
      {
        question: 'How much extra tile does it allow?',
        answer:
          'It allows 5% for a straight layout and 10% for a diagonal one, and more for large tiles and small rooms. No standard fixes these numbers, so the report marks them as assumed.',
      },
      {
        question: 'Does it include labour?',
        answer:
          'No. The report is about quantities, so it carries no labour and no rates of ours. If you want the material cost, you can type your own dealer’s rates into the optional rupee panel; labour, transport and taxes stay out of it. What is not counted, such as plaster, stairs, sanitary fittings and loose furniture, is listed in the report.',
      },
      {
        question: 'Is there a free way to estimate finishing quantities?',
        answer:
          'Yes. The free Finishing Quantity Calculator gives a rough tile and paint area from a built-up area. InteriorPro measures your rooms and counts everything.',
      },
    ],
    source:
      'lib/qty/interior/model.ts (IS 1200 Parts 11 to 13; IS 15622:2006; IS 1003 Part 1:2003; IS 2395 Part 1:1994; IS 303:2024; CPWD Delhi Analysis of Rates 2016; paint, tile, adhesive and board makers’ data sheets). Quantities-only model, no rate inputs. No worked numbers are printed here, so no paid output is revealed; prices via tool-pricing.',
    hi: {
      heading: 'InteriorPro से आपको क्या मिलता है',
      whatsInside: [
        'पुट्टी, प्राइमर और पेंट लीटर और किलोग्राम में, भीतर और बाहर, कोटों की गिनती के साथ।',
        'साइज़ के हिसाब से फ़र्श और दीवार की टाइलें, नग और बॉक्स में, साथ में उनके साथ लगने वाला सीमेंट, रेत या एडहेसिव, ग्राउट और स्कर्टिंग।',
        'दरवाज़े और उनके चौखट, खिड़कियाँ, रोशनदान और काँच, और दरवाज़े का हार्डवेयर।',
        'फ़ॉल्स सीलिंग, फ़्रेमिंग के साथ बोर्ड-दर-बोर्ड, और अलमारियों व रसोई के लिए प्लाईवुड और लैमिनेट।',
        'IS 1200, IS 15622, IS 1003 और IS 2395 के मुक़ाबले जाँच, क्लॉज़ दिखाकर, हर मान्यता बताकर, यह बताकर कि क्या नहीं गिना गया, और हर कुल के आसपास एक रेंज।',
      ],
      whoFor:
        'घर मालिक और छोटे बिल्डर जो ठेकेदार या डिज़ाइनर के कोटेशन देने से पहले पेंट, टाइल, दरवाज़े, सीलिंग और प्लाईवुड निकलवाना चाहते हैं।',
      example: {
        title: 'यह कैसे काम करता है: कुछ जवाब अंदर, पूरी फ़िनिशिंग-सूची बाहर',
        intro:
          'आपको ड्रॉइंग की ज़रूरत नहीं। हमें कमरे और आपके मन की फ़िनिश बताइए, और एरिया हमारी तरफ़ निकाले जाते हैं।',
        rows: [
          { label: 'बेडरूम, बाथरूम और रसोई', value: 'कमरे और उनकी दीवारें', note: 'दीवार, छत और फ़र्श के एरिया तय करता है' },
          { label: 'पेंट का स्तर और बाहर की फ़िनिश', value: 'इकोनॉमी से प्रीमियम', note: 'परतें और फैलाव तय करता है' },
          { label: 'फ़र्श की टाइल, बिछाई और फ़िक्सिंग', value: 'साइज़, पैटर्न, परत', note: 'टाइलें, अतिरिक्त मात्रा और सीमेंट या एडहेसिव तय करता है' },
          { label: 'सीलिंग, रसोई और अलमारियाँ', value: 'हाँ या नहीं', note: 'बोर्ड, फ़्रेमिंग और प्लाईवुड तय करता है' },
        ],
        footnote:
          'बाक़ी सब मॉडल भारतीय मानकों और निर्माताओं की डेटा शीट से चुनता है: खुले हिस्से, कोट, बर्बादी। रिपोर्ट अपनी हर मान्यता बताती है।',
      },
      faq: [
        {
          question: 'InteriorPro क्या निकालता है?',
          answer:
            'पेंट, पुट्टी और प्राइमर; परत या एडहेसिव और ग्राउट के साथ फ़र्श और दीवार की टाइलें; दरवाज़े, खिड़कियाँ और काँच; फ़ॉल्स सीलिंग; और अलमारियों व रसोई के लिए प्लाईवुड और लैमिनेट। हर चीज़ आपके बताए कमरों से गिनी जाती है, कुल के आसपास एक रेंज के साथ।',
        },
        {
          question: 'InteriorPro की क़ीमत कितनी है?',
          answer:
            `InteriorPro रिपोर्ट की क़ीमत प्रति रिपोर्ट ${priceLine('/tools/interiorpro')} है।`,
        },
        {
          question: 'यह दीवारें और फ़र्श कैसे नापता है?',
          answer:
            'यह वैसे नापता है जैसे IS 1200 नापता है: फ़र्श स्कर्टिंग लगने से पहले, और 0.5 m² तक का खुला हिस्सा पेंट में से घटाया नहीं जाता। 0.5 से 3 m² में एक तरफ़ की सतह घटाई जाती है। रिपोर्ट हर नापा हुआ एरिया दिखाती है।',
        },
        {
          question: 'यह कितनी अतिरिक्त टाइल मानता है?',
          answer:
            'यह सीधी बिछाई के लिए 5% और तिरछी के लिए 10% मानता है, और बड़ी टाइलों और छोटे कमरों के लिए ज़्यादा। कोई मानक ये संख्याएँ तय नहीं करता, इसलिए रिपोर्ट इन्हें मान्यता के रूप में चिह्नित करती है।',
        },
        {
          question: 'क्या इसमें मज़दूरी शामिल है?',
          answer:
            'नहीं। रिपोर्ट मात्राओं की है, इसलिए इसमें न मज़दूरी है और न हमारे कोई रेट। अगर आपको सामग्री की लागत चाहिए, तो आप वैकल्पिक रुपये वाले पैनल में अपने डीलर के रेट डाल सकते हैं; मज़दूरी, ढुलाई और टैक्स उसमें नहीं आते। जो नहीं गिना गया, जैसे प्लास्टर, सीढ़ियाँ, सैनिटरी फ़िटिंग और खुला फ़र्नीचर, उसकी सूची रिपोर्ट में दी गई है।',
        },
        {
          question: 'क्या फ़िनिशिंग की मात्राओं का अंदाज़ा लगाने का कोई मुफ़्त तरीक़ा है?',
          answer:
            'हाँ। मुफ़्त फ़िनिशिंग क्वांटिटी कैलकुलेटर बिल्ट-अप एरिया से टाइल और पेंट का मोटा एरिया देता है। InteriorPro आपके कमरे नापता है और सब कुछ गिनता है।',
        },
      ],
    },
  },

  // ── Grand Total ────────────────────────────────────────────────────────────
  '/tools/grand-total': {
    heading: 'What the Grand Total gives you',
    whatsInside: [
      'Your paid frame, walls, wiring, plumbing and finishing reports added into one list of what to buy.',
      'Cement, sand and stone from every phase added into one figure to order.',
      'Anything two reports both count, such as the lintels over doors and windows, taken out so it is ordered once.',
      'A check that the reports are for the same building, and a plain note of which phases are not in the total.',
      'The list laid out in the order the work happens on site, with the assumptions behind every phase and what is not counted.',
    ],
    whoFor:
      'Homeowners and small builders who have bought two or more phase reports and want one list to order from and to set against a contractor’s quantities.',
    example: {
      title: 'How it works: your paid reports in, one list out',
      intro: 'You answer nothing new. The Grand Total reads the reports you already bought for one project and adds them.',
      rows: [
        { label: 'Frame', value: 'StructurePro', note: 'Concrete, steel and shuttering' },
        { label: 'Walls', value: 'MasonryPro', note: 'Bricks or blocks, mortar, lintels, plaster' },
        { label: 'Wiring and plumbing', value: 'ElectricalPro, PlumbingPro', note: 'Points, wire, conduit, pipes, tanks, fixtures' },
        { label: 'Finishing', value: 'InteriorPro', note: 'Paint, tiles, ceilings, doors, carpentry' },
      ],
      footnote: 'You need at least two paid reports for the same project. The list is made from the reports you have today and does not change when you add a phase later.',
    },
    faq: [
      {
        question: 'What is the Grand Total?',
        answer:
          'It adds the phase reports you have already bought for one project, structure, masonry, electrical, plumbing and interior, into one list of what to buy. It does not ask any new questions and it does not recalculate a phase.',
      },
      {
        question: 'How much does the Grand Total cost?',
        answer: `The Grand Total costs ${priceLine('/tools/grand-total')}, on top of the phase reports it adds. It is included in the Complete House Pack.`,
      },
      {
        question: 'How many phases do I need?',
        answer:
          'At least two paid reports for the same project, with the same number of floors, the same state and floor areas within 10% of each other. The page tells you which phases are not in the total.',
      },
      {
        question: 'Is anything counted twice when the reports are added?',
        answer:
          'No. The lintels over doors and windows appear in both the frame report and the walls report. The Grand Total keeps the frame’s and takes the walls report’s share out. Cement, sand and stone used by several phases are added into one figure.',
      },
      {
        question: 'Does it include labour?',
        answer:
          'No. The report is about quantities, so it carries no labour and no rates of ours. If you want the material cost, you can type your own dealer’s rates into the optional rupee panel; labour, transport and taxes stay out of it. You can lay it next to any quote and compare line by line.',
      },
    ],
    source: 'lib/qty/grand.ts (merge, overlap removal, consistency checks) and lib/qty/grand-server.ts; every figure comes from the phase reports. Quantities-only; no worked numbers are printed here, so no paid output is revealed; prices via tool-pricing.',
    hi: {
      heading: 'ग्रैंड टोटल से आपको क्या मिलता है',
      whatsInside: [
        'आपकी ख़रीदी हुई ढाँचे, दीवारों, वायरिंग, प्लंबिंग और फ़िनिशिंग की रिपोर्टें जुड़कर ख़रीदने की एक सूची बनती हैं।',
        'हर चरण का सीमेंट, रेत और पत्थर जोड़कर मँगवाने का एक आँकड़ा।',
        'जो चीज़ दो रिपोर्टें दोनों गिनती हैं, जैसे दरवाज़ों और खिड़कियों के ऊपर के लिंटल, उसे निकाल दिया जाता है ताकि वह एक ही बार मँगवाई जाए।',
        'इस बात की जाँच कि रिपोर्टें एक ही इमारत की हैं, और एक सादा नोट कि कौन-से चरण कुल में नहीं हैं।',
        'सूची उस क्रम में, जिसमें साइट पर काम होता है, हर चरण की मान्यताओं और जो नहीं गिना गया उसके साथ।',
      ],
      whoFor:
        'घर मालिक और छोटे बिल्डर जिन्होंने दो या ज़्यादा चरणों की रिपोर्टें ख़रीदी हैं और मँगवाने के लिए तथा ठेकेदार की मात्राओं के सामने रखने के लिए एक सूची चाहते हैं।',
      example: {
        title: 'यह कैसे काम करता है: आपकी ख़रीदी रिपोर्टें अंदर, एक सूची बाहर',
        intro:
          'आप कुछ नया नहीं बताते। ग्रैंड टोटल एक प्रोजेक्ट के लिए आपकी पहले ख़रीदी हुई रिपोर्टें पढ़ता है और उन्हें जोड़ देता है।',
        rows: [
          { label: 'ढाँचा', value: 'StructurePro', note: 'कंक्रीट, स्टील और शटरिंग' },
          { label: 'दीवारें', value: 'MasonryPro', note: 'ईंटें या ब्लॉक, मसाला, लिंटल, प्लास्टर' },
          { label: 'वायरिंग और प्लंबिंग', value: 'ElectricalPro, PlumbingPro', note: 'पॉइंट, तार, कंड्यूट, पाइप, टंकियाँ, फ़िक्सचर' },
          { label: 'फ़िनिशिंग', value: 'InteriorPro', note: 'पेंट, टाइलें, सीलिंग, दरवाज़े, कारपेंट्री' },
        ],
        footnote:
          'एक ही प्रोजेक्ट की कम से कम दो ख़रीदी हुई रिपोर्टें चाहिए। सूची आज आपके पास मौजूद रिपोर्टों से बनती है और बाद में कोई चरण जोड़ने पर बदलती नहीं।',
      },
      faq: [
        {
          question: 'ग्रैंड टोटल क्या है?',
          answer:
            'यह एक प्रोजेक्ट के लिए आपकी पहले से ख़रीदी हुई चरणों की रिपोर्टों, यानी ढाँचा, चिनाई, बिजली, प्लंबिंग और इंटीरियर, को जोड़कर ख़रीदने की एक सूची बनाता है। यह कोई नया सवाल नहीं पूछता और किसी चरण को दोबारा नहीं निकालता।',
        },
        {
          question: 'ग्रैंड टोटल की क़ीमत कितनी है?',
          answer:
            `ग्रैंड टोटल की क़ीमत ${priceLine('/tools/grand-total')} है, उन चरणों की रिपोर्टों के ऊपर जिन्हें यह जोड़ता है। यह कम्प्लीट हाउस पैक में शामिल है।`,
        },
        {
          question: 'मुझे कितने चरण चाहिए?',
          answer:
            'एक ही प्रोजेक्ट की कम से कम दो ख़रीदी हुई रिपोर्टें, जिनमें मंज़िलों की गिनती एक हो, राज्य एक हो और फ़र्श के एरिया एक-दूसरे से 10% के भीतर हों। पेज बताता है कि कौन-से चरण कुल में नहीं हैं।',
        },
        {
          question: 'क्या रिपोर्टें जोड़ने पर कुछ दो बार गिना जाता है?',
          answer:
            'नहीं। दरवाज़ों और खिड़कियों के ऊपर के लिंटल ढाँचे की रिपोर्ट और दीवारों की रिपोर्ट, दोनों में आते हैं। ग्रैंड टोटल ढाँचे वाले को रखता है और दीवारों की रिपोर्ट का हिस्सा निकाल देता है। कई चरणों में इस्तेमाल होने वाला सीमेंट, रेत और पत्थर एक आँकड़े में जोड़ दिया जाता है।',
        },
        {
          question: 'क्या इसमें मज़दूरी शामिल है?',
          answer:
            'नहीं। रिपोर्ट मात्राओं की है, इसलिए इसमें न मज़दूरी है और न हमारे कोई रेट। अगर आपको सामग्री की लागत चाहिए, तो आप वैकल्पिक रुपये वाले पैनल में अपने डीलर के रेट डाल सकते हैं; मज़दूरी, ढुलाई और टैक्स उसमें नहीं आते। आप इसे किसी भी कोटेशन के बगल में रखकर पंक्ति-दर-पंक्ति मिला सकते हैं।',
        },
      ],
    },
  },

  // ── Complete House Pack ────────────────────────────────────────────────────
  '/tools/complete-house-pack': {
    heading: 'What the Complete House Pack gives you',
    whatsInside: [
      'StructurePro: the concrete, steel, cement, sand, aggregate and shuttering for the RCC frame.',
      'MasonryPro: bricks or blocks, mortar, plaster and lintels for the walls.',
      'ElectricalPro: points, wire by size, conduit, boards and earthing.',
      'PlumbingPro: pipes, fittings, tanks, pump, septic tank and soak pit.',
      'InteriorPro: paint, tiles, false ceiling, doors, windows and plywood.',
      'The Grand Total: one buying list for the whole house, with shared materials added up and nothing counted twice.',
    ],
    whoFor:
      'Homeowners and small builders planning one house who want every quantity report and the combined buying list, and would rather pay once than buy six reports one by one.',
    example: {
      title: 'How it works: pay once, then use it where you would otherwise pay',
      intro: 'Nothing about the reports changes. The pack only changes how each one is paid for.',
      rows: [
        { label: '1. Buy the pack', value: PRICE.pack, note: `Bought one by one the six cost ${PRICE.packSeparate}, so the pack saves ${PRICE.packSavings}.` },
        { label: '2. Open a tool', value: 'As usual', note: 'Enter your house and look at the free first result.' },
        { label: '3. Unlock', value: 'Use my Complete House Pack', note: 'Press this instead of paying. The report opens straight away.' },
      ],
      footnote: `A pack covers one house: every report must match the same building. Each report can be made up to ${PACK_CLAIMS_PER_REPORT} times, so a wrongly typed figure can be corrected.`,
    },
    faq: [
      {
        question: 'What does the Complete House Pack include?',
        answer: 'All five quantity reports for one house (structure, masonry, electrical, plumbing and interior) and the Grand Total buying list.',
      },
      {
        question: 'How much does the Complete House Pack cost?',
        answer: `${PRICE.pack}, once. Bought one by one the six cost ${PRICE.packSeparate}, so you save ${PRICE.packSavings}.`,
      },
      {
        question: 'Can I use one pack for two houses?',
        answer: 'No. A pack covers one house. Each report must match the same building (same floors, same state, floor area within 10%), and each report can be made up to ' + PACK_CLAIMS_PER_REPORT + ' times so that a wrongly typed figure can be corrected.',
      },
      {
        question: 'I already bought one report. Can I still get the pack?',
        answer: 'Yes, but the pack is priced in full. A report you already paid for is not credited against it.',
      },
    ],
    source: 'lib/pack/server.ts (claim rules), lib/tool-pricing.ts (prices and claim limit). No worked quantities are printed here, so no paid output is revealed.',
    hi: {
      heading: 'कम्प्लीट हाउस पैक से आपको क्या मिलता है',
      whatsInside: [
        'StructurePro: RCC ढाँचे के लिए कंक्रीट, स्टील, सीमेंट, रेत, गिट्टी और शटरिंग।',
        'MasonryPro: दीवारों के लिए ईंटें या ब्लॉक, मसाला, प्लास्टर और लिंटल।',
        'ElectricalPro: पॉइंट, साइज़ के हिसाब से तार, कंड्यूट, बोर्ड और अर्थिंग।',
        'PlumbingPro: पाइप, फ़िटिंग, टंकियाँ, पंप, सेप्टिक टैंक और सोक पिट।',
        'InteriorPro: पेंट, टाइलें, फ़ॉल्स सीलिंग, दरवाज़े, खिड़कियाँ और प्लाईवुड।',
        'ग्रैंड टोटल: पूरे घर की ख़रीदने की एक सूची, जिसमें साझा सामग्री जुड़ी हुई है और कुछ भी दो बार नहीं गिना गया।',
      ],
      whoFor:
        'एक घर की योजना बना रहे घर मालिक और छोटे बिल्डर जो हर मात्रा की रिपोर्ट और जुड़ी हुई ख़रीद-सूची चाहते हैं, और छह रिपोर्टें एक-एक करके ख़रीदने के बजाय एक बार पेमेंट करना पसंद करेंगे।',
      example: {
        title: 'यह कैसे काम करता है: एक बार पेमेंट कीजिए, फिर वहाँ इस्तेमाल कीजिए जहाँ वरना पेमेंट करते',
        intro:
          'रिपोर्टों में कुछ नहीं बदलता। पैक सिर्फ़ यह बदलता है कि हर एक का पेमेंट कैसे होता है।',
        rows: [
          { label: '1. पैक ख़रीदिए', value: PRICE.pack, note: `एक-एक करके ख़रीदने पर छह का दाम ${PRICE.packSeparate} है, इसलिए पैक में ${PRICE.packSavings} की बचत होती है।` },
          { label: '2. कोई टूल खोलिए', value: 'हमेशा की तरह', note: 'अपना घर डालिए और मुफ़्त पहला नतीजा देखिए।' },
          { label: '3. अनलॉक कीजिए', value: 'मेरा कम्प्लीट हाउस पैक इस्तेमाल कीजिए', note: 'पेमेंट करने की जगह इसे दबाइए। रिपोर्ट तुरंत खुल जाती है।' },
        ],
        footnote:
          `एक पैक एक घर के लिए है: हर रिपोर्ट एक ही इमारत से मेल खानी चाहिए। हर रिपोर्ट ${PACK_CLAIMS_PER_REPORT} बार तक बनाई जा सकती है, ताकि ग़लत लिखा आँकड़ा सुधारा जा सके।`,
      },
      faq: [
        {
          question: 'कम्प्लीट हाउस पैक में क्या शामिल है?',
          answer:
            'एक घर की सभी पाँच मात्रा रिपोर्टें (ढाँचा, चिनाई, बिजली, प्लंबिंग और इंटीरियर) और ग्रैंड टोटल की ख़रीद-सूची।',
        },
        {
          question: 'कम्प्लीट हाउस पैक की क़ीमत कितनी है?',
          answer:
            `${PRICE.pack}, एक बार। एक-एक करके ख़रीदने पर छह का दाम ${PRICE.packSeparate} है, इसलिए आप ${PRICE.packSavings} बचाते हैं।`,
        },
        {
          question: 'क्या मैं एक पैक दो घरों के लिए इस्तेमाल कर सकता हूँ?',
          answer:
            `नहीं। एक पैक एक घर के लिए है। हर रिपोर्ट एक ही इमारत से मेल खानी चाहिए (मंज़िलें एक, राज्य एक, फ़र्श का एरिया 10% के भीतर), और हर रिपोर्ट ${PACK_CLAIMS_PER_REPORT} बार तक बनाई जा सकती है ताकि ग़लत लिखा आँकड़ा सुधारा जा सके।`,
        },
        {
          question: 'मैंने एक रिपोर्ट पहले ही ख़रीद ली है। क्या मैं फिर भी पैक ले सकता हूँ?',
          answer:
            'हाँ, पर पैक की पूरी क़ीमत लगती है। जो रिपोर्ट आप पहले ही चुका चुके हैं, उसका पैसा इसमें घटाया नहीं जाता।',
        },
      ],
    },
  },
}
