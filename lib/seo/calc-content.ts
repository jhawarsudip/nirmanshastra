// ─────────────────────────────────────────────────────────────────────────────
// Answer-first content for the 10 free calculators (what AI assistants quote).
//
// RULE: every figure below traces to the calculator's own engine / locked
// constants, or to text already published on the same page. `source` names where
// the numbers come from so each can be re-verified. Nothing here is a new
// engineering value, and no price is typed anywhere in this file.
//
// Rendered visibly by <QuickAnswer/> (right under the H1) and <CalcFaq/> (bottom
// of the page), and emitted as FAQPage / HowTo JSON-LD from the same data — so
// the markup can never disagree with what a visitor reads.
//
// Each tool's content is a separate named export so a calculator page only pulls
// its own text into its client bundle.
// ─────────────────────────────────────────────────────────────────────────────

export interface CalcFaq {
  question: string
  answer: string
}

/** A FAQ entry with its Hindi beside it. The English fields keep the shape schema.ts, llms.ts and the scripts read. */
export interface CalcFaqBi extends CalcFaq {
  hi: CalcFaq
}

export interface CalcHowTo {
  name: string
  description: string
  steps: { name: string; text: string }[]
}

export interface CalcContent {
  /** The question the quick answer responds to (rendered as the box label). */
  question: string
  /** 40–60 words, real number + IS code. Rendered right under the H1. */
  quickAnswer: string
  /** Where the numbers in quickAnswer/faq come from, for re-verification (not rendered). */
  source: string
  faq: CalcFaqBi[]
  /** Steps of the worked example, for HowTo schema (optional). */
  howTo?: CalcHowTo
  /** The Hindi of question, quickAnswer and howTo (same figures, same claims). The Hindi FAQ sits inside each faq entry. */
  hi: { question: string; quickAnswer: string; howTo?: CalcHowTo }
}

// ── Choosing the language ────────────────────────────────────────────────────
// Components call these with the page language; the English exports above keep their shape for schema.ts and llms.ts.

/** What <QuickAnswer/> needs. The Hindi is optional so a page with English text only (a blog article) can still use the box. */
export interface QuickContent {
  question: string
  quickAnswer: string
  hi?: { question: string; quickAnswer: string }
}

/** The question and the quick answer in the page language. */
export function pickQuick(c: QuickContent, locale: string): { question: string; quickAnswer: string } {
  return locale === 'hi' && c.hi ? { question: c.hi.question, quickAnswer: c.hi.quickAnswer } : { question: c.question, quickAnswer: c.quickAnswer }
}

/** FAQ items in the page language (plain question and answer, the shape FAQPage JSON-LD takes). */
export function pickFaq(items: CalcFaqBi[], locale: string): CalcFaq[] {
  return locale === 'hi' ? items.map((f) => f.hi) : items.map((f) => ({ question: f.question, answer: f.answer }))
}

/** The worked-example steps in the page language, or the English when the Hindi is missing or does not line up. */
export function pickHowTo(c: CalcContent, locale: string): CalcHowTo | undefined {
  if (locale === 'hi' && c.howTo && c.hi.howTo && c.hi.howTo.steps.length === c.howTo.steps.length) return c.hi.howTo
  return c.howTo
}

// ── 1. Bar bending schedule ──────────────────────────────────────────────────
export const BBS_CONTENT: CalcContent = {
  question: 'How do you calculate the cutting length of a stirrup?',
  quickAnswer:
    'A closed 300 × 200 mm stirrup in 8 mm bar cuts at 2 × (300 + 200) + 12 × 8 = 1,096 mm, rounded up to 1,100 mm (next 25 mm), and weighs 0.43 kg (8 mm bar: d² ÷ 162.2 kg/m, IS 1786). The 12d is the two 135° hook tails less the corners.',
  source:
    'bbs-engine.ts imports barMass, roundUp25, stirrupCutLength from lib/structopro-qty/codes.ts, the StructurePro model’s own rules. Stirrup: 2(A+B) + 12d + 2 × max(0, 75 − 10d), DERIVED from the geometry (centre-line rectangle 2(A+B) − 4d, less three 90° corners and two 135° bends at a 2d pin, about 3.5d, plus two 10d tails: +12.5d, set to 12d to match the Bar Bending Schedule workbook at its 12d hook; +9.7d at a 4d pin; IS 13920 cl 6.3.1 tail 10d, min 75 mm). 300 × 200, 8 mm: 1,000 + 96 = 1,096 → 1,100 mm; 1.1 × 0.3946 = 0.434 kg. 180 × 300, 8 mm: 960 + 96 = 1,056 → 1,075 mm; 0.4242 kg; 60 stirrups 25.45 kg, +5% = 26.72 kg. 90° bend 3d (R = 4d; IS 2502 Table V A + E − R/2 − d, RECONSTRUCTED); 45° bend 2(R+d)tan(22.5°) − (R+d/2)(π/4) = 0.61d. L-bar 1,000 + 500, 12 mm: 1,500 − 36 = 1,464 → 1,475 mm. Crank 3,000 mm, rise 150, 16 mm: 3,000 + 62.1 − 19.4 = 3,042.7 → 3,050 mm. Rounding 25 mm: IS 2502 cl 5.1.1. Procurement 5%: CPWD DAR 2014 item 5.22.1. Retired: the 2(A+B) + 24d rule (1,192 mm for the 300 × 200, 8 mm stirrup, 8 to 10% above the geometry) and the older constants 2d per 90° bend, hook max(9d, 75), 3d per 135° bend (1,054 mm, about 4% below).',
  howTo: {
    name: 'How to find the cutting length and weight of a stirrup',
    description: 'Worked example: an 8 mm closed stirrup, 300 mm × 200 mm out to out, with 135° hooks.',
    steps: [
      { name: 'Take the stirrup out to out', text: 'The sides are the member’s width and depth less the cover on both sides: here 300 mm and 200 mm.' },
      { name: 'Apply the stirrup rule', text: '2 × (300 + 200) + 12 × 8 = 1,000 + 96 = 1,096 mm: the two 135° hook tails add about 20d, and the corners and hook bends take back about 8d. An 8 mm bar already has the 75 mm hook tail IS 13920 asks for.' },
      { name: 'Round up to the next 25 mm', text: '1,096 mm rounds up to 1,100 mm (IS 2502 cl 5.1.1).' },
      { name: 'Weigh it', text: 'An 8 mm bar weighs 8² ÷ 162.2 = 0.395 kg a metre, so 1.1 m weighs 0.43 kg.' },
    ],
  },
  hi: {
    question: "स्टिरप की कटिंग लेंथ कैसे निकालते हैं?",
    quickAnswer:
      "8 mm के बार में 300 × 200 mm का बंद स्टिरप 2 × (300 + 200) + 12 × 8 = 1,096 mm पर कटता है, जिसे ऊपर गोल करके 1,100 mm (अगला 25 mm) किया जाता है, और उसका वज़न 0.43 kg है (8 mm बार: d² ÷ 162.2 kg/m, IS 1786)। 12d दो 135° हुक टेल में से कोने घटाने पर आता है।",
    howTo: {
      name: "स्टिरप की कटिंग लेंथ और वज़न कैसे निकालें",
      description: "हल किया उदाहरण: 8 mm का बंद स्टिरप, बाहर से बाहर 300 mm × 200 mm, 135° के हुक के साथ।",
      steps: [
        { name: "स्टिरप को बाहर से बाहर लीजिए", text: "भुजाएँ मेंबर की चौड़ाई और गहराई में से दोनों तरफ़ का कवर घटाकर आती हैं: यहाँ 300 mm और 200 mm।" },
        { name: "स्टिरप का नियम लगाइए", text: "2 × (300 + 200) + 12 × 8 = 1,000 + 96 = 1,096 mm: दो 135° के हुक टेल लगभग 20d जोड़ते हैं, और कोने तथा हुक बेंड लगभग 8d वापस ले लेते हैं। 8 mm के बार में IS 13920 का माँगा 75 mm का हुक टेल पहले से है।" },
        { name: "अगले 25 mm तक ऊपर गोल कीजिए", text: "1,096 mm ऊपर गोल होकर 1,100 mm बनता है (IS 2502 cl 5.1.1)।" },
        { name: "वज़न निकालिए", text: "8 mm के बार का वज़न 8² ÷ 162.2 = 0.395 kg प्रति मीटर है, इसलिए 1.1 m का वज़न 0.43 kg है।" },
      ],
    },
  },
  faq: [
    {
      question: 'How do I calculate the cutting length of a stirrup?',
      answer:
        'Take the stirrup out to out, which is the member’s width and depth less the cover on both sides. The length is 2 × (A + B) + 12d for a closed stirrup with 135° hooks (two 10d hook tails, less the corners and hook bends), rounded up to the next 25 mm. An 8 mm stirrup of 300 × 200 mm is 1,096 mm, so 1,100 mm.',
      hi: {
        question: "स्टिरप की कटिंग लेंथ कैसे निकालूँ?",
        answer:
          "स्टिरप को बाहर से बाहर लीजिए, यानी मेंबर की चौड़ाई और गहराई में से दोनों तरफ़ का कवर घटाकर। 135° के हुक वाले बंद स्टिरप की लंबाई 2 × (A + B) + 12d है (दो 10d के हुक टेल, कोने और हुक बेंड घटाकर), जिसे अगले 25 mm तक ऊपर गोल किया जाता है। 8 mm के बार का 300 × 200 mm का स्टिरप 1,096 mm, यानी 1,100 mm होता है।",
      },
    },
    {
      question: 'How much does a metre of bar weigh?',
      answer:
        'd² ÷ 162.2 kilograms, with d in millimetres, which reproduces the IS 1786 table: 8 mm 0.395, 10 mm 0.617, 12 mm 0.888, 16 mm 1.58 and 20 mm 2.47 kg a metre.',
      hi: {
        question: "एक मीटर बार का वज़न कितना होता है?",
        answer:
          "d² ÷ 162.2 किलोग्राम, d मिलीमीटर में, जो IS 1786 की तालिका को दोहराता है: 8 mm 0.395, 10 mm 0.617, 12 mm 0.888, 16 mm 1.58 और 20 mm 2.47 kg प्रति मीटर।",
      },
    },
    {
      question: 'How much does a bend take off the length?',
      answer:
        'A right-angle bend round a pin of radius 4d takes 3d off the sum of the two legs, taken out to out (IS 2502 Table V). A 45° bend takes about 0.6d. A 12 mm L-bar of 1,000 and 500 mm cuts at 1,500 − 36 = 1,464 mm.',
      hi: {
        question: "एक बेंड लंबाई में से कितना घटाता है?",
        answer:
          "बाहर से बाहर ली गई दोनों भुजाओं के जोड़ में से, 4d त्रिज्या की पिन के चारों ओर समकोण बेंड 3d घटाता है (IS 2502 Table V)। 45° का बेंड लगभग 0.6d घटाता है। 1,000 और 500 mm का 12 mm का L-बार 1,500 − 36 = 1,464 mm पर कटता है।",
      },
    },
    {
      question: 'Why is the hook tail 75 mm for a small bar?',
      answer:
        'IS 13920 clause 6.3.1 asks for a 135° hook tail of 10 times the bar size and not less than 75 mm. A 6 mm bar has a 10d tail of 60 mm, so it gets 15 mm more on each hook; an 8 mm bar already has 80 mm.',
      hi: {
        question: "छोटे बार के लिए हुक टेल 75 mm क्यों है?",
        answer:
          "IS 13920 क्लॉज़ 6.3.1 बार के साइज़ के 10 गुना का 135° हुक टेल माँगता है, और 75 mm से कम नहीं। 6 mm के बार का 10d टेल 60 mm होता है, इसलिए हर हुक पर उसे 15 mm और मिलता है; 8 mm के बार में पहले से 80 mm है।",
      },
    },
    {
      question: 'Why is the cutting length rounded up to 25 mm?',
      answer:
        'IS 2502 clause 5.1.1 rounds each cutting length up to the next whole 25 mm. The weight on this page is the weight of the rounded bar.',
      hi: {
        question: "कटिंग लेंथ को 25 mm तक ऊपर गोल क्यों किया जाता है?",
        answer:
          "IS 2502 क्लॉज़ 5.1.1 हर कटिंग लेंथ को अगले पूरे 25 mm तक ऊपर गोल करता है। इस पेज का वज़न गोल किए हुए बार का वज़न है।",
      },
    },
    {
      question: 'How much extra steel should I buy?',
      answer:
        'CPWD buys 1.05 quintals of bar for each quintal placed (Delhi Analysis of Rates 2014, item 5.22.1), and the page shows steel to buy at 5% more than the schedule weight. That is CPWD’s allowance for cutting waste, not a rule for every job.',
      hi: {
        question: "कितना ज़्यादा स्टील ख़रीदना चाहिए?",
        answer:
          "CPWD हर लगाए गए क्विंटल के लिए 1.05 क्विंटल बार ख़रीदता है (दिल्ली दर विश्लेषण 2014, आइटम 5.22.1), और पेज शेड्यूल के वज़न से 5% ज़्यादा ख़रीदने वाला स्टील दिखाता है। यह कटिंग की बर्बादी के लिए CPWD की अतिरिक्त मात्रा है, हर काम का नियम नहीं।",
      },
    },
    {
      question: 'Does it work for cranked bars?',
      answer:
        'Yes, for a crank at 45°. The slope is 1.414 times the rise, so the bar is 0.414 × the rise longer than its end-to-end run, less two 45° bends. A 3,000 mm run of 16 mm bar with a 150 mm rise cuts at 3,043 mm, so 3,050 mm.',
      hi: {
        question: "क्या यह क्रैंक वाले बार के लिए चलता है?",
        answer:
          "हाँ, 45° के क्रैंक के लिए। ढलान ऊँचाई का 1.414 गुना होती है, इसलिए बार अपनी सिरे-से-सिरे की लंबाई से ऊँचाई का 0.414 गुना ज़्यादा लंबा होता है, दो 45° बेंड घटाकर। 16 mm के बार की 3,000 mm की लंबाई और 150 mm की ऊँचाई पर कटिंग लेंथ 3,043 mm, यानी 3,050 mm आती है।",
      },
    },
  ],
}

// ── 2. Water tank size ───────────────────────────────────────────────────────
export const TANK_CONTENT: CalcContent = {
  question: 'What size water tank does a house need?',
  quickAnswer:
    'Five people on piped supply use 5 × 135 = 675 litres a day (IS 1172:1993). The NBC split puts two-thirds of that, 450 L, underground and one-third, 225 L, overhead: a 500 L tank in each place. A house on a borewell uses 150 litres a person and keeps half a day overhead.',
  source:
    'water-tank-engine.ts wraps WATER_DEMAND_LPCD (lib/qty/plumbing/constants.ts) and tankSplit/tankPlan (lib/qty/plumbing/tanks.ts), the code PlumbingPro runs. 135 L/person (IS 1172 cl 4.1, flushing; 45 flushing + 90 other); 150 L borewell (lowest of the 150–200 range for towns over a lakh: a model choice). Split: NBC Part 9 Sec 1 draft Nov 2024 cl 4.4.10 notes (a)–(c): municipal UGT 2/3 + OHT 1/3; borewell OHT 1/2; tanker UGT 1.5 + OHT 1/3 (RECONSTRUCTED). Sizes 500/1,000/1,500/2,000/3,000/5,000 L (ASSUMPTION). 5 municipal: 675 L; 450 → 500 L, 225 → 500 L. 5 borewell: 750 L; 375 → 500 L. 5 tanker: 675 L; 1,013 → 1,500 L; 225 → 500 L. 4 municipal: 540 L, 360 → 500, 180 → 500; 4 borewell 600 L, 300 → 500. 6 municipal 810 L, 540 → 1,000, 270 → 500; 6 borewell 900 L, 450 → 500. Retired: single tank of 0.67 × a day and the days multiplier.',
  howTo: {
    name: 'How to size the tanks of a house',
    description: 'Worked example: five people on piped supply.',
    steps: [
      { name: 'Pick the water used per person', text: 'A house with flushing toilets uses 135 litres per person per day (IS 1172:1993). A house on its own borewell is taken at 150.' },
      { name: 'Find the water used in a day', text: '5 people × 135 L = 675 L a day.' },
      { name: 'Split it between the tanks', text: 'On piped supply the underground tank holds two-thirds of a day, 450 L, and the overhead tank one-third, 225 L (NBC Part 9 Section 1 draft).' },
      { name: 'Round each up to a size that is sold', text: '450 L rounds up to a 500 L underground tank, and 225 L to a 500 L overhead tank.' },
    ],
  },
  hi: {
    question: "एक घर के लिए कितने साइज़ की पानी की टंकी चाहिए?",
    quickAnswer:
      "पाइप से सप्लाई पर पाँच लोग 5 × 135 = 675 लीटर पानी रोज़ इस्तेमाल करते हैं (IS 1172:1993)। NBC के बँटवारे में इसका दो-तिहाई, 450 L, ज़मीन के नीचे और एक-तिहाई, 225 L, छत पर रखा जाता है: दोनों जगह 500 L की टंकी। बोरवेल वाला घर प्रति व्यक्ति 150 लीटर मानता है और आधे दिन का पानी छत पर रखता है।",
    howTo: {
      name: "घर की टंकियों का साइज़ कैसे तय करें",
      description: "हल किया उदाहरण: पाइप से सप्लाई पर पाँच लोग।",
      steps: [
        { name: "प्रति व्यक्ति पानी चुनिए", text: "फ़्लश वाले शौचालयों वाला घर प्रति व्यक्ति रोज़ 135 लीटर इस्तेमाल करता है (IS 1172:1993)। अपने बोरवेल वाला घर 150 माना जाता है।" },
        { name: "दिन भर का पानी निकालिए", text: "5 लोग × 135 L = 675 L रोज़।" },
        { name: "टंकियों में बाँटिए", text: "पाइप सप्लाई पर ज़मीन के नीचे की टंकी में दिन का दो-तिहाई, 450 L, और छत की टंकी में एक-तिहाई, 225 L, आता है (NBC भाग 9 खंड 1 मसौदा)।" },
        { name: "हर एक को बिकने वाले साइज़ तक ऊपर गोल कीजिए", text: "450 L ऊपर गोल होकर 500 L की अंडरग्राउंड टंकी बनता है, और 225 L छत की 500 L की टंकी।" },
      ],
    },
  },
  faq: [
    {
      question: 'How many litres per person per day does the calculator assume?',
      answer:
        '135 litres per person per day for piped or tanker water, from IS 1172:1993 for a house with flushing toilets, and 150 for a house on its own borewell. The standard sets demand by the size of the town and not by source, so the borewell figure is a choice the calculator makes.',
      hi: {
        question: "कैलकुलेटर प्रति व्यक्ति रोज़ कितने लीटर मानता है?",
        answer:
          "पाइप या टैंकर के पानी के लिए प्रति व्यक्ति प्रति दिन 135 लीटर, फ़्लश वाले शौचालयों वाले घर के लिए IS 1172:1993 से, और अपने बोरवेल वाले घर के लिए 150। मानक माँग को शहर के साइज़ से तय करता है, स्रोत से नहीं, इसलिए बोरवेल का आँकड़ा कैलकुलेटर की अपनी चुनी हुई बात है।",
      },
    },
    {
      question: 'How is the water split between the tanks?',
      answer:
        'The NBC Part 9 Section 1 draft (November 2024) splits a day’s water. Piped supply: underground two-thirds of a day, overhead one-third. Borewell: overhead only, half a day. Tanker: underground a day and a half, overhead one-third, which is a reading of a clause the draft words unclearly.',
      hi: {
        question: "पानी टंकियों में कैसे बँटता है?",
        answer:
          "NBC भाग 9 खंड 1 का मसौदा (नवंबर 2024) दिन भर के पानी को बाँटता है। पाइप सप्लाई: ज़मीन के नीचे दिन का दो-तिहाई, छत पर एक-तिहाई। बोरवेल: सिर्फ़ छत पर, आधा दिन। टैंकर: ज़मीन के नीचे डेढ़ दिन, छत पर एक-तिहाई, जो उस धारा की हमारी व्याख्या है जिसके शब्द मसौदे में साफ़ नहीं हैं।",
      },
    },
    {
      question: 'What tank size does a family of 4 need?',
      answer:
        'On piped supply, 4 people use 540 L a day, which needs 360 L underground and 180 L overhead: a 500 L tank in each place. On a borewell they use 600 L a day and the overhead tank holds 300 L, so one 500 L tank.',
      hi: {
        question: "4 लोगों के परिवार को कितनी बड़ी टंकी चाहिए?",
        answer:
          "पाइप सप्लाई पर 4 लोग रोज़ 540 L इस्तेमाल करते हैं, जिसके लिए ज़मीन के नीचे 360 L और छत पर 180 L चाहिए: दोनों जगह 500 L की टंकी। बोरवेल पर वे रोज़ 600 L इस्तेमाल करते हैं और छत की टंकी में 300 L आता है, इसलिए 500 L की एक टंकी।",
      },
    },
    {
      question: 'What tank size does a family of 6 need?',
      answer:
        'On piped supply, 6 people use 810 L a day, which needs 540 L underground and 270 L overhead: a 1,000 L underground tank and a 500 L overhead tank. On a borewell they use 900 L a day and the overhead tank holds 450 L, so one 500 L tank.',
      hi: {
        question: "6 लोगों के परिवार को कितनी बड़ी टंकी चाहिए?",
        answer:
          "पाइप सप्लाई पर 6 लोग रोज़ 810 L इस्तेमाल करते हैं, जिसके लिए ज़मीन के नीचे 540 L और छत पर 270 L चाहिए: ज़मीन के नीचे 1,000 L की टंकी और छत पर 500 L की। बोरवेल पर वे रोज़ 900 L इस्तेमाल करते हैं और छत की टंकी में 450 L आता है, इसलिए 500 L की एक टंकी।",
      },
    },
    {
      question: 'Why does a borewell house have no underground tank?',
      answer:
        'A borewell pump can fill the roof tank whenever it is needed, so there is nothing to catch and hold. The draft allows an overhead tank alone to hold one-third to one-half of a day, and the calculator takes the half.',
      hi: {
        question: "बोरवेल वाले घर में अंडरग्राउंड टंकी क्यों नहीं होती?",
        answer:
          "बोरवेल का पंप जब चाहे छत की टंकी भर सकता है, इसलिए रोककर जमा करने को कुछ नहीं रहता। मसौदा अकेली ओवरहेड टंकी को दिन का एक-तिहाई से आधा रखने देता है, और कैलकुलेटर आधा लेता है।",
      },
    },
    {
      question: 'What if the water does not arrive every day?',
      answer:
        'The calculator has no day count. IS 2065 cl 11.11 asks for an overhead tank of at least half a day’s water where supply is intermittent, and the piped option gives only a third. Choose Tanker for a day and a half underground, and ask for an overhead tank of at least half a day.',
      hi: {
        question: "अगर पानी रोज़ नहीं आता तो?",
        answer:
          "कैलकुलेटर में दिनों की गिनती नहीं है। जहाँ सप्लाई रुक-रुककर आती हो, वहाँ IS 2065 cl 11.11 छत की टंकी में कम से कम आधे दिन का पानी माँगता है, और पाइप वाला विकल्प सिर्फ़ एक-तिहाई देता है। टैंकर चुनिए, जिसमें ज़मीन के नीचे डेढ़ दिन का पानी आता है, और छत की टंकी कम से कम आधे दिन के पानी की रखवाइए।",
      },
    },
    {
      question: 'Which tank sizes does it round to?',
      answer:
        '500, 1,000, 1,500, 2,000, 3,000 and 5,000 litres, the common ready-made sizes; no standard lists them. It always rounds up. Above 5,000 litres underground it gives a built tank, rounded up to the next 500 L, and overhead it gives equal ready-made tanks.',
      hi: {
        question: "यह किन टंकी साइज़ तक गोल करता है?",
        answer:
          "500, 1,000, 1,500, 2,000, 3,000 और 5,000 लीटर तक, जो आम तैयार टंकियों के साइज़ हैं; इन्हें किसी मानक ने नहीं गिनाया। यह हमेशा ऊपर गोल करता है। ज़मीन के नीचे 5,000 लीटर से ऊपर यह बनी हुई टंकी देता है, जो अगले 500 L तक ऊपर गोल होती है, और छत पर बराबर की तैयार टंकियाँ देता है।",
      },
    },
  ],
}

// ── 3. Brick ─────────────────────────────────────────────────────────────────
export const BRICK_CONTENT: CalcContent = {
  question: 'How many bricks are needed per square metre of wall?',
  quickAnswer:
    'A one-brick-thick wall takes about 94 common 230 × 115 × 75 mm bricks per square metre, or 100 modular 190 × 90 × 90 mm bricks (IS 1077:1992), all with 10 mm joints. A half-brick wall takes about half. A 10 m × 3 m red-brick wall is 2,824 bricks; order 5–10% extra.',
  source:
    'brick-engine.ts imports SYSTEMS, unitsPerM2 and jointMortarPerM2 from lib/qty/masonry/units.ts (the MasonryPro tables). bricks per m² = (t + 10 mm) / ((L + 10)(W + 10)(H + 10)). 10 m × 3 m, one brick thick: red 94.12/m² → 2,824; modular 100 → 3,000; 230×110×70 104.17 → 3,125. Half brick: 49.02 → 1,471; 50 → 1,500; 52.08 → 1,562. 1.9 m² door out of the red wall: 28.1 m² → 2,645. Breakage 5% (MasonryPro) and 10% (this page): red 10×3 → 2,965 and 3,106.',
  howTo: {
    name: 'How to count bricks for a wall',
    description: 'Worked example: a 10 m long, 3 m high wall, one red brick (230 × 115 × 75 mm) thick, no openings.',
    steps: [
      { name: 'Find the wall area', text: '10 m × 3 m = 30 m².' },
      { name: 'Take out doors and windows', text: 'Subtract the area of every opening. This example has none, so the area stays 30 m².' },
      { name: 'Work out the bricks in one square metre', text: 'One-brick wall of 230 mm: (0.23 + 0.01) ÷ (0.24 × 0.125 × 0.085) = 94.1 bricks per m².' },
      { name: 'Multiply', text: '30 m² × 94.1 = 2,824 bricks.' },
      { name: 'Add breakage', text: 'Add 5–10% for breakage and cutting: order about 2,965 to 3,106 bricks.' },
    ],
  },
  hi: {
    question: "एक वर्ग मीटर दीवार में कितनी ईंटें लगती हैं?",
    quickAnswer:
      "एक ईंट मोटी दीवार के हर वर्ग मीटर में लगभग 94 आम 230 × 115 × 75 mm ईंटें लगती हैं, या 100 मॉड्यूलर 190 × 90 × 90 mm ईंटें (IS 1077:1992), सब 10 mm के जोड़ के साथ। आधी ईंट की दीवार में लगभग आधी। 10 m × 3 m की लाल ईंट की दीवार में 2,824 ईंटें लगती हैं; 5–10% ऊपर से मँगवाइए।",
    howTo: {
      name: "दीवार की ईंटें कैसे गिनें",
      description: "हल किया उदाहरण: 10 m लंबी और 3 m ऊँची दीवार, एक लाल ईंट (230 × 115 × 75 mm) मोटी, बिना किसी खुले हिस्से के।",
      steps: [
        { name: "दीवार का एरिया निकालिए", text: "10 m × 3 m = 30 m²।" },
        { name: "दरवाज़े और खिड़कियाँ घटाइए", text: "हर खुले हिस्से का एरिया घटाइए। इस उदाहरण में कोई नहीं है, इसलिए एरिया 30 m² ही रहता है।" },
        { name: "एक वर्ग मीटर में ईंटें निकालिए", text: "230 mm की एक ईंट मोटी दीवार: (0.23 + 0.01) ÷ (0.24 × 0.125 × 0.085) = 94.1 ईंटें प्रति m²।" },
        { name: "गुणा कीजिए", text: "30 m² × 94.1 = 2,824 ईंटें।" },
        { name: "टूट-फूट जोड़िए", text: "टूट-फूट और कटाई के लिए 5–10% जोड़िए: लगभग 2,965 से 3,106 ईंटें मँगवाइए।" },
      ],
    },
  },
  faq: [
    {
      question: 'How many bricks are in a 10 m × 3 m wall?',
      answer:
        'A wall of 30 m², one brick thick, takes 2,824 of the 230 × 115 × 75 mm red brick, 3,000 of the 190 × 90 × 90 mm modular brick, or 3,125 of the 230 × 110 × 70 mm brick, before breakage. A half-brick wall of the same size takes 1,471, 1,500 or 1,562.',
      hi: {
        question: "10 m × 3 m की दीवार में कितनी ईंटें होती हैं?",
        answer:
          "एक ईंट मोटी 30 m² की दीवार में, टूट-फूट से पहले, 230 × 115 × 75 mm की लाल ईंट की 2,824, 190 × 90 × 90 mm की मॉड्यूलर ईंट की 3,000, या 230 × 110 × 70 mm की ईंट की 3,125 लगती हैं। इतनी ही बड़ी आधी ईंट की दीवार में 1,471, 1,500 या 1,562 लगती हैं।",
      },
    },
    {
      question: 'How do I allow for doors and windows?',
      answer:
        'Take each opening’s area out of the wall area first. A 0.9 × 2.1 m door is about 1.9 m² and a 1.2 × 1.2 m window about 1.44 m². Taking one 1.9 m² door out of the 10 m × 3 m red-brick wall leaves 28.1 m² and 2,645 bricks before breakage.',
      hi: {
        question: "दरवाज़े और खिड़कियों का हिसाब कैसे लगाऊँ?",
        answer:
          "पहले हर खुले हिस्से का एरिया दीवार के एरिया में से घटाइए। 0.9 × 2.1 m का दरवाज़ा लगभग 1.9 m² और 1.2 × 1.2 m की खिड़की लगभग 1.44 m² की होती है। 10 m × 3 m की लाल ईंट की दीवार में से 1.9 m² का एक दरवाज़ा घटाने पर 28.1 m² बचता है और टूट-फूट से पहले 2,645 ईंटें लगती हैं।",
      },
    },
    {
      question: 'How much extra should I order for breakage?',
      answer:
        'No standard gives a figure. The MasonryPro report allows 5% for a straight, plain wall, and this calculator shows 10% for a wall with a lot of cutting. On 2,824 bricks that is about 140 to 280 more.',
      hi: {
        question: "टूट-फूट के लिए ऊपर से कितना मँगवाऊँ?",
        answer:
          "किसी मानक में इसका कोई आँकड़ा नहीं है। MasonryPro रिपोर्ट सीधी, सादी दीवार के लिए 5% मानती है, और यह कैलकुलेटर बहुत कटाई वाली दीवार के लिए 10% दिखाता है। 2,824 ईंटों पर यह लगभग 140 से 280 ईंटें ज़्यादा हैं।",
      },
    },
    {
      question: 'What brick size does the calculator assume?',
      answer:
        'You choose. The red brick is 230 × 115 × 75 mm, the size most kilns make, which is not a BIS size. The modular brick is 190 × 90 × 90 mm (IS 1077:1992). The third is 230 × 110 × 70 mm (IS 1077 and IS 12894:2002). The joint is 10 mm for all three.',
      hi: {
        question: "कैलकुलेटर कौन-सा ईंट साइज़ मानता है?",
        answer:
          "यह आप चुनते हैं। लाल ईंट 230 × 115 × 75 mm की है, जो ज़्यादातर भट्ठे बनाते हैं और जो BIS साइज़ नहीं है। मॉड्यूलर ईंट 190 × 90 × 90 mm की है (IS 1077:1992)। तीसरी 230 × 110 × 70 mm की है (IS 1077 और IS 12894:2002)। तीनों के लिए जोड़ 10 mm है।",
      },
    },
    {
      question: 'Why is the count not exactly 100 per square metre?',
      answer:
        'One hundred is the count for the modular brick, which lays as a neat 200 × 100 × 100 mm unit with its joint. A wall of the 230 × 115 × 75 mm red brick holds about 94 in a square metre because the brick is bigger, and a 230 × 110 × 70 mm brick about 104 because it is smaller. The count depends on the size of the brick you are sent.',
      hi: {
        question: "गिनती ठीक 100 प्रति वर्ग मीटर क्यों नहीं है?",
        answer:
          "सौ की गिनती मॉड्यूलर ईंट की है, जो अपने जोड़ के साथ 200 × 100 × 100 mm की सधी इकाई बनकर बैठती है। 230 × 115 × 75 mm की लाल ईंट की दीवार में एक वर्ग मीटर में लगभग 94 आती हैं क्योंकि ईंट बड़ी है, और 230 × 110 × 70 mm की ईंट की लगभग 104 क्योंकि वह छोटी है। गिनती इस पर टिकी है कि आपके पास किस साइज़ की ईंट भेजी जाती है।",
      },
    },
    {
      question: 'What is the difference between a one-brick and a half-brick wall?',
      answer:
        'A one-brick wall is as thick as the brick is long, 230 mm for the red brick, and is the usual outer wall. A half-brick wall is as thick as the brick is wide, 115 mm for the red brick, and is used for inner partitions. It takes about half as many bricks to the square metre.',
      hi: {
        question: "एक ईंट और आधी ईंट की दीवार में क्या फ़र्क़ है?",
        answer:
          "एक ईंट की दीवार उतनी मोटी होती है जितनी ईंट लंबी है, लाल ईंट के लिए 230 mm, और यही आम बाहरी दीवार है। आधी ईंट की दीवार उतनी मोटी होती है जितनी ईंट चौड़ी है, लाल ईंट के लिए 115 mm, और यह भीतर की पार्टीशन दीवारों में लगती है। इसमें प्रति वर्ग मीटर लगभग आधी ईंटें लगती हैं।",
      },
    },
    {
      question: 'Does it work for AAC blocks?',
      answer:
        'No. This calculator counts clay and fly-ash bricks. Block walls have different sizes and joints, and the MasonryPro report counts AAC and concrete blocks.',
      hi: {
        question: "क्या यह AAC ब्लॉक के लिए चलता है?",
        answer:
          "नहीं। यह कैलकुलेटर मिट्टी और फ्लाई-ऐश की ईंटें गिनता है। ब्लॉक की दीवारों के साइज़ और जोड़ अलग होते हैं, और MasonryPro रिपोर्ट AAC और कंक्रीट ब्लॉक गिनती है।",
      },
    },
  ],
}

// ── 4. Concrete mix ──────────────────────────────────────────────────────────
export const MIX_CONTENT: CalcContent = {
  question: 'How much cement is needed per cubic metre of concrete?',
  quickAnswer:
    'M20 concrete (1 : 1.5 : 3) takes 400 kg of cement, 8 bags of 50 kg, with 0.425 m³ of sand and 0.85 m³ of coarse aggregate per cubic metre (CPWD 2014). Above M20 the mix is designed under IS 456:2000: M25 takes 411 kg for a mild site, and M30 and above reach the 450 kg ceiling.',
  source:
    'concrete-mix-engine.ts wraps mixFor/T5_RCC/WC_FOR_GRADE in lib/structopro-qty/materials.ts, the same source StructurePro uses. M10/M15/M20: CPWD DAR 2014 items 4.1.5/4.1.3/4.1.2 (220/320/400 kg; M20 8.0 bags, sand 0.425 m³ = 15.0 cft, aggregate 0.85 m³ = 30.0 cft). Design mix: IS 10262:2009 absolute volume, water 186 × 1.06 = 197 L, w/c = lower of IS 456 Table 5 maximum and 0.55/0.48/0.43/0.40/0.38 (M20–M40), cement = max(water/wc, Table 5 minimum) capped at 450 kg (IS 456 cl 8.2.4.2); sg 3.15/2.65/2.7, bulk 1,600/1,500 (ASSUMPTIONS). M25 mild 411 kg, 8.22 bags, sand 0.419 m³, aggregate 0.755 m³; M25 severe 438 kg, 8.76 bags; M30 and above 450 kg, 9.0 bags. 2.5 m³ of M20: 20 bags, 1.0625 m³ sand, 2.125 m³ aggregate. Old page retired: 1:1:2 “M25” at 11 bags (about 550 kg) was above the 450 kg ceiling.',
  howTo: {
    name: 'How to find the cement, sand and aggregate for a slab',
    description: 'Worked example: a slab 5 m × 4 m and 125 mm thick in M20 concrete on a mild site.',
    steps: [
      { name: 'Find the volume', text: '5 m × 4 m × 0.125 m = 2.5 m³ of finished concrete.' },
      { name: 'Take the quantities for one cubic metre', text: 'M20 (1 : 1.5 : 3) takes 8.0 bags of 50 kg, 0.425 m³ of sand and 0.85 m³ of coarse aggregate in a cubic metre (CPWD Delhi Analysis of Rates 2014).' },
      { name: 'Multiply by the volume', text: 'Cement 2.5 × 8.0 = 20 bags. Sand 2.5 × 0.425 = 1.06 m³ (37.5 cft). Aggregate 2.5 × 0.85 = 2.13 m³ (75.0 cft).' },
    ],
  },
  hi: {
    question: "एक घन मीटर कंक्रीट में कितना सीमेंट लगता है?",
    quickAnswer:
      "M20 कंक्रीट (1 : 1.5 : 3) में प्रति घन मीटर 400 kg सीमेंट, यानी 50 kg के 8 बैग, 0.425 m³ रेत और 0.85 m³ मोटी गिट्टी लगती है (CPWD 2014)। M20 से ऊपर मिक्स IS 456:2000 के तहत डिज़ाइन होता है: हल्की साइट के लिए M25 में 411 kg लगता है, और M30 और ऊपर 450 kg की सीमा छू लेते हैं।",
    howTo: {
      name: "स्लैब के लिए सीमेंट, रेत और गिट्टी कैसे निकालें",
      description: "हल किया उदाहरण: हल्की साइट पर M20 कंक्रीट में 5 m × 4 m का, 125 mm मोटा स्लैब।",
      steps: [
        { name: "आयतन निकालिए", text: "5 m × 4 m × 0.125 m = 2.5 m³ तैयार कंक्रीट।" },
        { name: "एक घन मीटर की मात्राएँ लीजिए", text: "एक घन मीटर में M20 (1 : 1.5 : 3) में 50 kg के 8.0 बैग, 0.425 m³ रेत और 0.85 m³ मोटी गिट्टी लगती है (CPWD दिल्ली दर विश्लेषण 2014)।" },
        { name: "आयतन से गुणा कीजिए", text: "सीमेंट 2.5 × 8.0 = 20 बैग। रेत 2.5 × 0.425 = 1.06 m³ (37.5 cft)। गिट्टी 2.5 × 0.85 = 2.13 m³ (75.0 cft)।" },
      ],
    },
  },
  faq: [
    {
      question: 'What is the mix ratio for M20 concrete?',
      answer:
        'M20 is 1 : 1.5 : 3 (cement : sand : coarse aggregate) by volume. The CPWD Delhi Analysis of Rates 2014 takes 400 kg of cement, 8.0 bags of 50 kg, 0.425 m³ of sand and 0.85 m³ of coarse aggregate for each cubic metre.',
      hi: {
        question: "M20 कंक्रीट का मिक्स अनुपात क्या है?",
        answer:
          "M20 आयतन के हिसाब से 1 : 1.5 : 3 (सीमेंट : रेत : मोटी गिट्टी) है। CPWD दिल्ली दर विश्लेषण 2014 हर घन मीटर के लिए 400 kg सीमेंट, यानी 50 kg के 8.0 बैग, 0.425 m³ रेत और 0.85 m³ मोटी गिट्टी लेता है।",
      },
    },
    {
      question: 'How many bags of cement are in 1 m³ of M25 concrete?',
      answer:
        'IS 456:2000 gives M25 no nominal ratio; it is a design mix. Worked by the IS 10262 method with a water-cement ratio of 0.48, this calculator takes 411 kg, about 8.2 bags, on a mild or moderate site, and 438 kg, about 8.8 bags, on a severe site where the ratio is held to 0.45. A laboratory trial sets the real figure.',
      hi: {
        question: "1 m³ M25 कंक्रीट में सीमेंट के कितने बैग लगते हैं?",
        answer:
          "IS 456:2000 M25 को कोई नामिनल अनुपात नहीं देता; यह डिज़ाइन मिक्स है। IS 10262 विधि से जल-सीमेंट अनुपात 0.48 लेकर निकालें, तो यह कैलकुलेटर हल्की या मध्यम साइट पर 411 kg, यानी लगभग 8.2 बैग, लेता है, और कठोर साइट पर, जहाँ अनुपात 0.45 पर रखा जाता है, 438 kg, यानी लगभग 8.8 बैग। असली आँकड़ा प्रयोगशाला का ट्रायल तय करता है।",
      },
    },
    {
      question: 'Why is there no 1 : 1 : 2 mix for M25 any more?',
      answer:
        'IS 456 allows a nominal mix only up to M20, and a 1 : 1 : 2 mix takes about 550 kg of cement a cubic metre, above the 450 kg ceiling in clause 8.2.4.2. The calculator now works M25 as a design mix, which takes about 8.2 to 8.8 bags.',
      hi: {
        question: "M25 के लिए 1 : 1 : 2 मिक्स अब क्यों नहीं है?",
        answer:
          "IS 456 नामिनल मिक्स सिर्फ़ M20 तक की इजाज़त देता है, और 1 : 1 : 2 मिक्स में प्रति घन मीटर लगभग 550 kg सीमेंट लगता है, जो क्लॉज़ 8.2.4.2 की 450 kg की सीमा से ऊपर है। कैलकुलेटर अब M25 को डिज़ाइन मिक्स की तरह निकालता है, जिसमें लगभग 8.2 से 8.8 बैग लगते हैं।",
      },
    },
    {
      question: 'What does the site exposure change?',
      answer:
        'IS 456 Table 5 sets, for each of five exposures, the lowest grade for reinforced concrete (M20, M25, M30, M35, M40), the least cement (300 to 360 kg) and the highest water-cement ratio (0.55 down to 0.40). A tighter ratio means more cement in a design mix, and the calculator warns when the grade you pick is below the minimum.',
      hi: {
        question: "साइट का एक्सपोज़र क्या बदलता है?",
        answer:
          "IS 456 Table 5 पाँच एक्सपोज़र में से हर एक के लिए रीइन्फ़ोर्स्ड कंक्रीट का सबसे कम ग्रेड (M20, M25, M30, M35, M40), सबसे कम सीमेंट (300 से 360 kg) और सबसे ज़्यादा जल-सीमेंट अनुपात (0.55 से घटकर 0.40) तय करता है। कसा हुआ अनुपात डिज़ाइन मिक्स में ज़्यादा सीमेंट माँगता है, और आपका चुना ग्रेड न्यूनतम से नीचे हो तो कैलकुलेटर चेतावनी देता है।",
      },
    },
    {
      question: 'How do I scale the quantities for my pour?',
      answer:
        'Quantities scale with volume. A slab of 5 m × 4 m and 125 mm thick is 2.5 m³; in M20 it takes 2.5 × 8.0 = 20 bags of cement, 1.06 m³ of sand and 2.13 m³ of aggregate.',
      hi: {
        question: "अपनी ढलाई के लिए मात्राएँ कैसे बढ़ाऊँ?",
        answer:
          "मात्राएँ आयतन के साथ बढ़ती हैं। 5 m × 4 m और 125 mm मोटा स्लैब 2.5 m³ है; M20 में इसमें 2.5 × 8.0 = 20 बैग सीमेंट, 1.06 m³ रेत और 2.13 m³ गिट्टी लगती है।",
      },
    },
    {
      question: 'Why does M30 show 450 kg of cement?',
      answer:
        'With 197 litres of water, a water-cement ratio of 0.43 would take more than 450 kg of cement, and IS 456 caps cement at 450 kg a cubic metre. Real M30 to M40 mixes use a water-reducing admixture to cut the water and the cement. The calculator assumes none, so for M30 and above the cement shown is the most you would buy.',
      hi: {
        question: "M30 में 450 kg सीमेंट क्यों दिखता है?",
        answer:
          "197 लीटर पानी के साथ 0.43 का जल-सीमेंट अनुपात 450 kg से ज़्यादा सीमेंट माँगेगा, और IS 456 सीमेंट को 450 kg प्रति घन मीटर पर रोकता है। असली M30 से M40 मिक्स पानी घटाने वाला एडमिक्सचर डालकर पानी और सीमेंट कम करते हैं। कैलकुलेटर कोई एडमिक्सचर नहीं मानता, इसलिए M30 और ऊपर के लिए दिखाया गया सीमेंट वह सबसे ज़्यादा है जो आप ख़रीदेंगे।",
      },
    },
    {
      question: 'Does the answer include wastage?',
      answer:
        'No. The quantities are for finished concrete in place. Spillage, concrete left in the mixer and over-dug trenches are not included, because they depend on the site.',
      hi: {
        question: "क्या जवाब में बर्बादी शामिल है?",
        answer:
          "नहीं। मात्राएँ अपनी जगह पर लगे तैयार कंक्रीट की हैं। गिरा हुआ कंक्रीट, मिक्सर में बचा कंक्रीट और ज़्यादा खुदी खाइयाँ शामिल नहीं हैं, क्योंकि वे साइट पर निर्भर करती हैं।",
      },
    },
  ],
}

// ── 5. Concrete cube test ────────────────────────────────────────────────────
export const CUBE_CONTENT: CalcContent = {
  question: 'How many concrete cube samples are required for a pour?',
  quickAnswer:
    'IS 456:2000 clause 15.2.2 sets the least samples for each grade: 1 for 1–5 m³, 2 for 6–15 m³, 3 for 16–30 m³ and 4 for 31–50 m³, then one more for each further 50 m³ or part of it. A sample is three cubes tested at 28 days, so 10 m³ needs 2 samples and 6 cubes.',
  source:
    'cube-test-engine.ts samplesForVolume: 1–5:1, 6–15:2, 16–30:3, 31–50:4, above 50: 4 + ceil((V−50)/50) (“or part thereof” confirmed against the IS 456 table as quoted by NPTEL and Testbook, Oct 2026). CUBES_PER_SAMPLE 3 (cl 15.3, tested at 28 days); 3 more for a 7-day check is optional. 10 m³ → 2 samples, 6 cubes (12 with the 7-day check); 45 m³ → 4, 12 (24); 51 m³ → 5; 100 m³ → 5; 101 m³ → 6; 120 m³ → 4 + ceil(70/50) = 6 samples, 18 cubes (36). Old page retired: floor() under-counted above 50 m³ (120 m³ gave 5) and counted 6 cubes a sample as the code’s figure.',
  hi: {
    question: "एक ढलाई के लिए कंक्रीट के कितने क्यूब सैंपल चाहिए?",
    quickAnswer:
      "IS 456:2000 क्लॉज़ 15.2.2 हर ग्रेड के लिए सबसे कम सैंपल तय करता है: 1–5 m³ के लिए 1, 6–15 m³ के लिए 2, 16–30 m³ के लिए 3 और 31–50 m³ के लिए 4, फिर हर अतिरिक्त 50 m³ या उसके हिस्से के लिए एक और। एक सैंपल तीन क्यूब का होता है, जिन्हें 28 दिन पर टेस्ट किया जाता है, इसलिए 10 m³ में 2 सैंपल और 6 क्यूब लगते हैं।",
  },
  faq: [
    {
      question: 'How many samples and cubes does a 10 m³ pour need?',
      answer:
        '10 m³ falls in the 6–15 m³ band, so 2 samples. At three cubes a sample that is 6 cubes tested at 28 days, or 12 if you also cast three a sample for a 7-day check.',
      hi: {
        question: "10 m³ की ढलाई में कितने सैंपल और क्यूब लगते हैं?",
        answer:
          "10 m³ 6–15 m³ के बैंड में आता है, इसलिए 2 सैंपल। प्रति सैंपल तीन क्यूब के हिसाब से 28 दिन पर टेस्ट होने वाले 6 क्यूब, या 12 अगर आप 7 दिन की जाँच के लिए हर सैंपल से तीन और ढालते हैं।",
      },
    },
    {
      question: 'How many cubes does a 45 m³ pour need?',
      answer:
        '45 m³ falls in the 31–50 m³ band, so 4 samples and 12 cubes tested at 28 days, or 24 cubes with a 7-day check.',
      hi: {
        question: "45 m³ की ढलाई में कितने क्यूब लगते हैं?",
        answer:
          "45 m³ 31–50 m³ के बैंड में आता है, इसलिए 4 सैंपल और 28 दिन पर टेस्ट होने वाले 12 क्यूब, या 7 दिन की जाँच के साथ 24 क्यूब।",
      },
    },
    {
      question: 'How many samples does 120 m³ need?',
      answer:
        'The table gives 4 samples for the first 50 m³ and one more for each further 50 m³ or part of it. The further 70 m³ is one block of 50 and part of another, so 2 more: 6 samples and 18 cubes at 28 days.',
      hi: {
        question: "120 m³ के लिए कितने सैंपल चाहिए?",
        answer:
          "तालिका पहले 50 m³ के लिए 4 सैंपल देती है और हर अतिरिक्त 50 m³ या उसके हिस्से के लिए एक और। अतिरिक्त 70 m³ एक पूरा 50 का ब्लॉक और दूसरे का हिस्सा है, इसलिए 2 और: 6 सैंपल और 28 दिन पर 18 क्यूब।",
      },
    },
    {
      question: 'How many cubes make up a sample?',
      answer:
        'Three, cast from the same batch and tested at 28 days (IS 456 clause 15.3). Extra cubes for a 7-day check are allowed but not asked for; the calculator shows the count with and without them.',
      hi: {
        question: "एक सैंपल में कितने क्यूब होते हैं?",
        answer:
          "तीन, एक ही बैच से ढाले हुए और 28 दिन पर टेस्ट किए हुए (IS 456 क्लॉज़ 15.3)। 7 दिन की जाँच के लिए अतिरिक्त क्यूब की इजाज़त है पर उन्हें माँगा नहीं जाता; कैलकुलेटर उनके साथ और उनके बिना, दोनों गिनतियाँ दिखाता है।",
      },
    },
    {
      question: 'Is one sample per shift also required?',
      answer:
        'Yes. IS 456:2000 clause 15.2.2 asks for at least one sample from each shift of concreting, and lets a ready-mixed concrete plant agree another frequency with the buyer. The tool shows this as a reminder and does not add it to the volume-based count.',
      hi: {
        question: "क्या हर शिफ़्ट में एक सैंपल भी ज़रूरी है?",
        answer:
          "हाँ। IS 456:2000 क्लॉज़ 15.2.2 कंक्रीटिंग की हर शिफ़्ट से कम से कम एक सैंपल माँगता है, और रेडी-मिक्स कंक्रीट प्लांट को ख़रीदार के साथ सैंपल लेने की कोई और दर तय करने देता है। टूल इसे याद दिलाने के लिए दिखाता है और आयतन पर आधारित गिनती में नहीं जोड़ता।",
      },
    },
    {
      question: 'Is the count for the whole building or for each grade?',
      answer:
        'For concrete of each grade. A building with M25 columns and M20 slabs counts the two separately, each against its own volume.',
      hi: {
        question: "गिनती पूरी इमारत के लिए है या हर ग्रेड के लिए?",
        answer:
          "हर ग्रेड के कंक्रीट के लिए। M25 के कॉलम और M20 के स्लैब वाली इमारत में दोनों अलग-अलग गिने जाते हैं, हर एक अपने आयतन के हिसाब से।",
      },
    },
    {
      question: 'What is the sampling frequency in IS 456 for small pours?',
      answer:
        'Up to 5 m³ needs 1 sample, 6 to 15 m³ needs 2, 16 to 30 m³ needs 3 and 31 to 50 m³ needs 4. Above 50 m³ it is 4 plus one more for each further 50 m³ or part of it.',
      hi: {
        question: "छोटी ढलाइयों के लिए IS 456 में सैंपल लेने की दर क्या है?",
        answer:
          "5 m³ तक 1 सैंपल, 6 से 15 m³ में 2, 16 से 30 m³ में 3 और 31 से 50 m³ में 4। 50 m³ से ऊपर 4 और फिर हर अतिरिक्त 50 m³ या उसके हिस्से पर एक और।",
      },
    },
  ],
}

// ── 6. Daily-wage PF & ESI ───────────────────────────────────────────────────
export const WAGE_CONTENT: CalcContent = {
  question: 'How are PF and ESI calculated on a daily-wage worker’s pay?',
  quickAnswer:
    'Employee PF is 12% of basic earned, held at ₹1,800 (12% of the ₹15,000 wage ceiling). Employee ESI is 0.75% of all wages once the worker is covered: basic of ₹21,000 or less and an average day above ₹176. At ₹900 a day for 23 days: basic ₹20,700, PF ₹1,800, ESI ₹155.25, net ₹18,744.75.',
  source:
    'wage-engine.ts constants PF_EMPLOYEE_RATE 0.12, PF_WAGE_CEILING 15000, ESI_EMPLOYEE_RATE 0.0075, ESI_WAGE_CEILING 21000 (tested on basic, overtime left out), ESI_DAILY_EXEMPT 176, OVERTIME_MULTIPLIER 2, STANDARD_HOURS_PER_DAY 8. calculate() run: 900×23 → 20700/1800/155.25/18744.75; 650×20.5 → 13325/1599/99.9375/11626.0625; 800×26 + 8 h overtime → basic 20800, gross 22400, PF 1800, ESI 168, net 20432; 900×24 → ESI 0; 170×26 → ESI 0. Rules read from payroll guides (Zoho, Tally, Free Press Journal, Taxmann), not from EPFO, ESIC or the statutes; the ₹176 exemption and the exclusion of overtime from the coverage test come from secondary sources.',
  hi: {
    question: "दैनिक मज़दूरी वाले मज़दूर की मज़दूरी पर PF और ESI कैसे निकलते हैं?",
    quickAnswer:
      "कर्मचारी का PF कमाई गई बेसिक का 12% है, जो ₹1,800 पर रोका जाता है (₹15,000 की मज़दूरी सीमा का 12%)। कर्मचारी का ESI मज़दूर के कवर्ड होने पर सारी मज़दूरी का 0.75% है: बेसिक ₹21,000 या कम और औसत दिन ₹176 से ऊपर। ₹900 प्रति दिन पर 23 दिन: बेसिक ₹20,700, PF ₹1,800, ESI ₹155.25, नेट ₹18,744.75।",
  },
  faq: [
    {
      question: 'What is the PF cap for a daily-wage worker?',
      answer:
        'Employee PF is 12% of basic earned, held at ₹1,800, which is 12% of the ₹15,000 EPF wage ceiling. A worker who earns ₹20,700 in the period still pays ₹1,800, not ₹2,484. Contributions on wages above the ceiling are by agreement. The EPF Scheme 2026, notified in June 2026 under the Code on Social Security 2020, leaves the ceiling at ₹15,000.',
      hi: {
        question: "दैनिक मज़दूरी वाले मज़दूर के लिए PF की सीमा क्या है?",
        answer:
          "कर्मचारी का PF कमाई गई बेसिक का 12% है, जो ₹1,800 पर रोका जाता है, यानी ₹15,000 की EPF मज़दूरी सीमा का 12%। जो मज़दूर अवधि में ₹20,700 कमाता है, वह भी ₹1,800 देता है, ₹2,484 नहीं। सीमा से ऊपर की मज़दूरी पर अंशदान आपसी सहमति से होता है। जून 2026 में सामाजिक सुरक्षा संहिता 2020 के तहत अधिसूचित EPF योजना 2026 सीमा को ₹15,000 पर ही रखती है।",
      },
    },
    {
      question: 'When is ESI taken, and when not?',
      answer:
        'A worker is covered when wages without overtime are ₹21,000 a month or less, and then 0.75% is taken on all wages, overtime included. Above ₹21,000 of basic, no ESI is taken in this calculator. In practice cover is fixed for each six-month period (April to September, October to March), so a worker covered at the start of a period stays covered to its end even if wages cross ₹21,000. The calculator tests the wages you enter and cannot see how the period began.',
      hi: {
        question: "ESI कब कटता है, और कब नहीं?",
        answer:
          "मज़दूर तब कवर्ड होता है जब ओवरटाइम के बिना मज़दूरी प्रति माह ₹21,000 या कम हो, और तब सारी मज़दूरी पर 0.75% कटता है, ओवरटाइम सहित। ₹21,000 से ऊपर की बेसिक पर इस कैलकुलेटर में ESI नहीं कटता। व्यवहार में कवर हर छह महीने की अवधि (अप्रैल से सितंबर, अक्टूबर से मार्च) के लिए तय होता है, इसलिए अवधि की शुरुआत में कवर्ड मज़दूर उसके अंत तक कवर्ड रहता है, चाहे मज़दूरी ₹21,000 पार कर जाए। कैलकुलेटर आपकी डाली हुई मज़दूरी को परखता है और नहीं देख सकता कि अवधि कैसे शुरू हुई थी।",
      },
    },
    {
      question: 'What is the ₹176 daily-wage exemption?',
      answer:
        'A worker whose average daily wage is ₹176 or less does not pay the worker’s share of ESI; the employer still pays its own share. The calculator divides gross wages by payable days to get the average day, and takes no ESI at or below ₹176.',
      hi: {
        question: "₹176 की दैनिक मज़दूरी वाली छूट क्या है?",
        answer:
          "जिस मज़दूर की औसत दैनिक मज़दूरी ₹176 या उससे कम है, वह ESI का मज़दूर वाला हिस्सा नहीं देता; नियोक्ता अपना हिस्सा फिर भी देता है। कैलकुलेटर औसत दिन निकालने के लिए ग्रॉस मज़दूरी को देय दिनों से भाग देता है, और ₹176 पर या उससे नीचे कोई ESI नहीं लेता।",
      },
    },
    {
      question: 'How is overtime paid?',
      answer:
        'At twice the ordinary rate, under section 14 of the Code on Wages 2019, in force from 21 November 2025. The calculator takes the hourly rate as the daily wage divided by 8. Overtime adds to gross wages and to the ESI base, but not to the PF base, which stays on basic earned. For example ₹800 a day for 26 days plus 8 hours of overtime is ₹22,400 gross, ESI ₹168 and net pay ₹20,432.',
      hi: {
        question: "ओवरटाइम का भुगतान कैसे होता है?",
        answer:
          "सामान्य दर के दोगुने पर, मज़दूरी संहिता 2019 की धारा 14 के तहत, जो 21 नवंबर 2025 से लागू है। कैलकुलेटर घंटे की दर को दैनिक मज़दूरी भाग 8 मानता है। ओवरटाइम ग्रॉस मज़दूरी और ESI के आधार में जुड़ता है, पर PF के आधार में नहीं, जो कमाई गई बेसिक पर ही रहता है। उदाहरण के लिए ₹800 प्रति दिन पर 26 दिन और 8 घंटे का ओवरटाइम ₹22,400 ग्रॉस, ESI ₹168 और नेट मज़दूरी ₹20,432 होता है।",
      },
    },
    {
      question: 'Can I enter part days like 23.5?',
      answer:
        'Yes. Payable days can be fractional. At ₹650 a day for 20.5 days the basic is ₹13,325, PF ₹1,599, ESI ₹99.94 and net pay ₹11,626.06.',
      hi: {
        question: "क्या मैं 23.5 जैसे आधे दिन डाल सकता हूँ?",
        answer:
          "हाँ। देय दिन दशमलव में हो सकते हैं। ₹650 प्रति दिन पर 20.5 दिन में बेसिक ₹13,325, PF ₹1,599, ESI ₹99.94 और नेट मज़दूरी ₹11,626.06 होती है।",
      },
    },
    {
      question: 'How is net payable worked out?',
      answer:
        'Net payable = gross wages − employee PF − employee ESI − advance recovered. Advance defaults to ₹0.',
      hi: {
        question: "नेट देय कैसे निकलता है?",
        answer:
          "नेट देय = ग्रॉस मज़दूरी − कर्मचारी का PF − कर्मचारी का ESI − वसूल किया गया एडवांस। एडवांस की शुरुआती रकम ₹0 है।",
      },
    },
    {
      question: 'Does this show the employer’s contribution?',
      answer:
        'No. It shows the worker’s own deductions on a site muster roll. The employer’s PF and ESI share is a separate cost and is not part of the net wage.',
      hi: {
        question: "क्या यह नियोक्ता का अंशदान दिखाता है?",
        answer:
          "नहीं। यह साइट के मस्टर रोल पर मज़दूर की अपनी कटौतियाँ दिखाता है। नियोक्ता का PF और ESI का हिस्सा अलग लागत है और नेट मज़दूरी का हिस्सा नहीं है।",
      },
    },
    {
      question: 'Do PF and ESI apply to every site worker?',
      answer:
        'Only when the employer’s establishment is covered, which depends on how many people it employs and on the state. The calculator assumes both apply, and says so; check with the employer or the labour office for a particular site.',
      hi: {
        question: "क्या PF और ESI हर साइट मज़दूर पर लागू होते हैं?",
        answer:
          "सिर्फ़ तब जब नियोक्ता का प्रतिष्ठान कवर्ड हो, जो इस पर निर्भर करता है कि वह कितने लोगों को काम देता है और राज्य कौन-सा है। कैलकुलेटर मानकर चलता है कि दोनों लागू हैं, और यह कहता भी है; किसी ख़ास साइट के लिए नियोक्ता या श्रम कार्यालय से पूछ लीजिए।",
      },
    },
  ],
}

// ── 7. Earned value ──────────────────────────────────────────────────────────
export const EVM_CONTENT: CalcContent = {
  question: 'How do you calculate SPI, CPI and EAC for a project?',
  quickAnswer:
    'SPI = EV ÷ PV and CPI = EV ÷ AC; below 1 means behind schedule or over cost. Forecast final cost EAC = BAC ÷ CPI. Example: BAC ₹10,00,000, PV ₹4,00,000, EV ₹3,50,000 and AC ₹4,20,000 give SPI 0.875, CPI 0.833 and EAC ₹12,00,000, a ₹2,00,000 overrun.',
  source:
    'evm-engine.ts calculate({bac:1000000,pv:400000,ev:350000,ac:420000}) → SV −50000, CV −70000, SPI 0.875, CPI 0.8333, EAC 1200000, ETC 780000, VAC −200000, TCPI 1.1207. Product reference example in the engine header: SPI 0.8744, CPI 0.9777.',
  howTo: {
    name: 'How to read project health with earned value',
    description: 'Worked example: budget ₹10,00,000, planned ₹4,00,000, earned ₹3,50,000, spent ₹4,20,000.',
    steps: [
      { name: 'Enter the four figures', text: 'BAC = ₹10,00,000, PV = ₹4,00,000, EV = ₹3,50,000, AC = ₹4,20,000.' },
      { name: 'Find the schedule index', text: 'SPI = EV ÷ PV = 3,50,000 ÷ 4,00,000 = 0.875, so the job is behind schedule.' },
      { name: 'Find the cost index', text: 'CPI = EV ÷ AC = 3,50,000 ÷ 4,20,000 = 0.833, so it is over cost.' },
      { name: 'Forecast the final cost', text: 'EAC = BAC ÷ CPI = ₹12,00,000, which is ₹2,00,000 over the ₹10,00,000 budget.' },
    ],
  },
  hi: {
    question: "किसी प्रोजेक्ट के लिए SPI, CPI और EAC कैसे निकालते हैं?",
    quickAnswer:
      "SPI = EV ÷ PV और CPI = EV ÷ AC; 1 से कम का मतलब शेड्यूल से पीछे या लागत से ऊपर। अनुमानित अंतिम लागत EAC = BAC ÷ CPI। उदाहरण: BAC ₹10,00,000, PV ₹4,00,000, EV ₹3,50,000 और AC ₹4,20,000 से SPI 0.875, CPI 0.833 और EAC ₹12,00,000 आता है, यानी ₹2,00,000 का ओवररन।",
    howTo: {
      name: "अर्नड वैल्यू से प्रोजेक्ट की सेहत कैसे पढ़ें",
      description: "हल किया उदाहरण: बजट ₹10,00,000, प्लान्ड ₹4,00,000, अर्नड ₹3,50,000, ख़र्च ₹4,20,000।",
      steps: [
        { name: "चारों आँकड़े डालिए", text: "BAC = ₹10,00,000, PV = ₹4,00,000, EV = ₹3,50,000, AC = ₹4,20,000।" },
        { name: "शेड्यूल इंडेक्स निकालिए", text: "SPI = EV ÷ PV = 3,50,000 ÷ 4,00,000 = 0.875, इसलिए काम शेड्यूल से पीछे है।" },
        { name: "कॉस्ट इंडेक्स निकालिए", text: "CPI = EV ÷ AC = 3,50,000 ÷ 4,20,000 = 0.833, इसलिए वह लागत से ऊपर है।" },
        { name: "अंतिम लागत का अनुमान लगाइए", text: "EAC = BAC ÷ CPI = ₹12,00,000, जो ₹10,00,000 के बजट से ₹2,00,000 ऊपर है।" },
      ],
    },
  },
  faq: [
    {
      question: 'What do SPI and CPI below 1 mean?',
      answer:
        'An SPI below 1 means less value has been earned than was planned by now, so the project is behind schedule. A CPI below 1 means each rupee of earned value cost more than budgeted, so the project is over cost. Exactly 1.0 counts as on target.',
      hi: {
        question: "1 से कम SPI और CPI का क्या मतलब है?",
        answer:
          "1 से कम SPI का मतलब है कि अब तक प्लान से कम वैल्यू अर्न हुई है, इसलिए प्रोजेक्ट शेड्यूल से पीछे है। 1 से कम CPI का मतलब है कि अर्न की गई वैल्यू का हर रुपया बजट से ज़्यादा में पड़ा, इसलिए प्रोजेक्ट लागत से ऊपर है। ठीक 1.0 का मतलब है लक्ष्य पर।",
      },
    },
    {
      question: 'How is EAC calculated?',
      answer:
        'EAC = BAC ÷ CPI, using the full-precision CPI. The estimate to complete is ETC = EAC − AC and the variance at completion is VAC = BAC − EAC. In the example above ETC is ₹7,80,000 and VAC is −₹2,00,000.',
      hi: {
        question: "EAC कैसे निकलता है?",
        answer:
          "EAC = BAC ÷ CPI, पूरी सटीकता वाले CPI से। पूरा करने का अनुमान ETC = EAC − AC है और पूरा होने पर वेरियंस VAC = BAC − EAC। ऊपर के उदाहरण में ETC ₹7,80,000 और VAC −₹2,00,000 है।",
      },
    },
    {
      question: 'What is TCPI?',
      answer:
        'TCPI = (BAC − EV) ÷ (BAC − AC). It is the cost efficiency the remaining work must achieve to finish on budget. In the example above it is about 1.12.',
      hi: {
        question: "TCPI क्या है?",
        answer:
          "TCPI = (BAC − EV) ÷ (BAC − AC)। यह वह लागत-क्षमता है जो बाक़ी काम को बजट में पूरा करने के लिए हासिल करनी होगी। ऊपर के उदाहरण में यह लगभग 1.12 है।",
      },
    },
    {
      question: 'What are BAC, PV, EV and AC?',
      answer:
        'BAC is the total approved budget. PV is the budgeted cost of work scheduled by now. EV is the budgeted cost of work actually completed. AC is the real spend on the work completed.',
      hi: {
        question: "BAC, PV, EV और AC क्या हैं?",
        answer:
          "BAC कुल मंज़ूर बजट है। PV अब तक के लिए तय काम की बजट लागत है। EV असल में पूरे हुए काम की बजट लागत है। AC पूरे हुए काम पर असल ख़र्च है।",
      },
    },
    {
      question: 'What are SV and CV?',
      answer:
        'Schedule variance SV = EV − PV and cost variance CV = EV − AC. Negative values mean behind schedule or over cost. In the example SV is −₹50,000 and CV is −₹70,000.',
      hi: {
        question: "SV और CV क्या हैं?",
        answer:
          "शेड्यूल वेरियंस SV = EV − PV और कॉस्ट वेरियंस CV = EV − AC। माइनस मान का मतलब है शेड्यूल से पीछे या लागत से ऊपर। उदाहरण में SV −₹50,000 और CV −₹70,000 है।",
      },
    },
    {
      question: 'What happens if PV or AC is zero?',
      answer:
        'The indices that would divide by zero are shown as not computable, never as infinity or an error.',
      hi: {
        question: "अगर PV या AC शून्य हो तो क्या होता है?",
        answer:
          "जो इंडेक्स शून्य से भाग देते, उन्हें “गणना संभव नहीं” के रूप में दिखाया जाता है, कभी अनंत या एरर के रूप में नहीं।",
      },
    },
  ],
}

// ── 8. Paint and tile ────────────────────────────────────────────────────────
export const PAINT_TILE_CONTENT: CalcContent = {
  question: 'How much paint and how many tiles does a surface need?',
  quickAnswer:
    'Per square metre of wall, the Standard system takes about 0.60 kg of cement putty, 0.075 L of primer and 0.090 L of emulsion for two coats, plus 5% wastage. A 600 × 600 mm tile with a 2 mm joint takes 2.76 tiles a square metre, plus 5% for cutting.',
  source:
    'lib/qty/interior/finish.ts (shared with the InteriorPro model): IN_SYS economy / standard / premium (putty 0 / 0.60 / 0.38 kg a m², primer 0.070 / 0.075 / 0.075 L a m², finish 0.155 / 0.090 / 0.138 L a m²), PAINT_WASTE 1.05; tilesPerM2 = 1 / ((L + joint) × (W + joint)); tileWaste 5 / 10 / 15%; BED floor 11.0 kg cement and 0.022 m³ sand a m², wall 9.2 kg and 0.0125 m³; adhesivePerM2 5.25 / 10.5 / 12.0 kg; GROUT_WASTE 1.10. Sources: CPWD DAR 2016 item 13.42, makers’ data sheets, IS 15622:2006, IS 1200 Parts 11 and 13.',
  hi: {
    question: "किसी सतह के लिए कितना पेंट और कितनी टाइलें चाहिए?",
    quickAnswer:
      "दीवार के हर वर्ग मीटर पर स्टैंडर्ड सिस्टम में दो कोट के लिए लगभग 0.60 kg सीमेंट पुट्टी, 0.075 L प्राइमर और 0.090 L इमल्शन लगता है, ऊपर से 5% बर्बादी। 2 mm के जोड़ वाली 600 × 600 mm की टाइल से हर वर्ग मीटर में 2.76 टाइलें लगती हैं, ऊपर से कटाई के लिए 5%।",
  },
  faq: [
    {
      question: 'How much paint is needed for 1,000 sq ft of wall and ceiling?',
      answer:
        '1,000 sq ft is 92.9 m². With the Standard system that is about 58.5 kg of putty, 7.3 L of primer and 8.8 L of emulsion. Economy takes 6.8 L of primer and 15.1 L of distemper and no putty; Premium takes 37.1 kg of putty, 7.3 L of primer and 13.5 L of luxury emulsion. All include 5% wastage.',
      hi: {
        question: "1,000 वर्ग फ़ुट दीवार और छत के लिए कितना पेंट चाहिए?",
        answer:
          "1,000 वर्ग फ़ुट 92.9 m² है। स्टैंडर्ड सिस्टम में यह लगभग 58.5 kg पुट्टी, 7.3 L प्राइमर और 8.8 L इमल्शन है। इकोनॉमी में 6.8 L प्राइमर और 15.1 L डिस्टेंपर लगता है, पुट्टी नहीं; प्रीमियम में 37.1 kg पुट्टी, 7.3 L प्राइमर और 13.5 L लक्ज़री इमल्शन। सब में 5% बर्बादी शामिल है।",
      },
    },
    {
      question: 'How many 600 × 600 mm tiles do I need for 100 m²?',
      answer:
        'About 290 tiles, or 73 boxes of 4. A 600 × 600 mm tile with a 2 mm joint covers 0.362 m², so 2.76 tiles cover a square metre. Add 5% for cutting when the tiles are laid straight: 105 m² × 2.76 is 290 tiles.',
      hi: {
        question: "100 m² के लिए 600 × 600 mm की कितनी टाइलें चाहिए?",
        answer:
          "लगभग 290 टाइलें, यानी 4-4 के 73 बॉक्स। 2 mm के जोड़ वाली 600 × 600 mm की टाइल 0.362 m² ढकती है, इसलिए 2.76 टाइलें एक वर्ग मीटर ढकती हैं। टाइलें सीधी बिछानी हों तो कटाई के लिए 5% जोड़िए: 105 m² × 2.76 यानी 290 टाइलें।",
      },
    },
    {
      question: 'How much extra tile should I buy for cutting?',
      answer:
        'The calculator adds 5% for a small tile laid straight; 10% for a large tile (800 × 800 mm or 600 × 1200 mm), a diagonal lay of a small tile, or a small room or bathroom; and 15% for a large tile laid diagonally. No standard fixes these; they are allowances the calculator assumes.',
      hi: {
        question: "कटाई के लिए कितनी टाइलें ऊपर से ख़रीदूँ?",
        answer:
          "कैलकुलेटर सीधी बिछी छोटी टाइल के लिए 5% जोड़ता है; बड़ी टाइल (800 × 800 mm या 600 × 1200 mm), छोटी टाइल को तिरछा बिछाने, या छोटे कमरे या बाथरूम के लिए 10%; और तिरछी बिछी बड़ी टाइल के लिए 15%। इन्हें कोई मानक तय नहीं करता; ये कैलकुलेटर की मानी हुई छूटें हैं।",
      },
    },
    {
      question: 'Is putty needed under paint?',
      answer:
        'Not with the Economy system: distemper goes over a coat of primer on the plaster. The Standard system adds about 1 mm of cement putty, and the Premium system an acrylic putty in two coats. Putty smooths the plaster for an even emulsion finish.',
      hi: {
        question: "क्या पेंट के नीचे पुट्टी चाहिए?",
        answer:
          "इकोनॉमी सिस्टम में नहीं: प्लास्टर पर प्राइमर के एक कोट के ऊपर डिस्टेंपर लगता है। स्टैंडर्ड सिस्टम में लगभग 1 mm सीमेंट पुट्टी जुड़ती है, और प्रीमियम में दो कोट की एक्रिलिक पुट्टी। पुट्टी प्लास्टर को चिकना करती है ताकि इमल्शन की फ़िनिश एकसार आए।",
      },
    },
    {
      question: 'How is grout worked out?',
      answer:
        'From the joints: the length of joint in a square metre, times the joint width and the tile thickness, times a grout density of 1.6 kg a litre (an assumption; 1.4 to 1.6), plus 10% for waste. A larger tile has less joint, so it takes less grout.',
      hi: {
        question: "ग्राउट कैसे निकाला जाता है?",
        answer:
          "जोड़ों से: एक वर्ग मीटर में जोड़ की लंबाई, गुणा जोड़ की चौड़ाई और टाइल की मोटाई, गुणा 1.6 kg प्रति लीटर की ग्राउट घनता (एक मान्यता; 1.4 से 1.6), और बर्बादी के लिए 10% और। बड़ी टाइल में जोड़ कम होते हैं, इसलिए ग्राउट कम लगता है।",
      },
    },
    {
      question: 'How much cement and sand goes under floor tiles, and how much adhesive instead?',
      answer:
        'A mortar bed takes about 11.0 kg of cement and 22 litres of sand a m² under a floor tile, and 9.2 kg and 12.5 litres under a wall tile, from the CPWD item text. Tile adhesive takes 5.25 kg a m² for tiles up to 900 cm², 10.5 kg up to 3,600 cm² and 12 kg above that, from a maker’s sheet.',
      hi: {
        question: "फ़र्श की टाइलों के नीचे कितना सीमेंट और रेत लगता है, और उसकी जगह कितना एडहेसिव?",
        answer:
          "CPWD के आइटम पाठ के अनुसार, मसाले की परत में फ़र्श की टाइल के नीचे प्रति m² लगभग 11.0 kg सीमेंट और 22 लीटर रेत लगती है, और दीवार की टाइल के नीचे 9.2 kg और 12.5 लीटर। टाइल एडहेसिव, एक निर्माता की शीट के अनुसार, 900 cm² तक की टाइलों के लिए 5.25 kg प्रति m², 3,600 cm² तक के लिए 10.5 kg और उससे ऊपर के लिए 12 kg लेता है।",
      },
    },
    {
      question: 'Does the calculator count plaster, or the paint on doors?',
      answer:
        'No. It counts one surface at a time: the paint, putty and primer for the area you enter, or the tiles, grout and fixing. Plaster belongs to MasonryPro, and InteriorPro measures every wall, ceiling, floor and door of a house from its plan.',
      hi: {
        question: "क्या कैलकुलेटर प्लास्टर या दरवाज़ों का पेंट गिनता है?",
        answer:
          "नहीं। यह एक बार में एक सतह गिनता है: आपके डाले एरिया का पेंट, पुट्टी और प्राइमर, या टाइलें, ग्राउट और फ़िक्सिंग। प्लास्टर MasonryPro का काम है, और InteriorPro आपके नक्शे से घर की हर दीवार, छत, फ़र्श और दरवाज़ा नापता है।",
      },
    },
    {
      question: 'Is the paint and tile calculator free?',
      answer:
        'Yes. It is permanently free and needs no sign-in.',
      hi: {
        question: "क्या पेंट और टाइल कैलकुलेटर मुफ़्त है?",
        answer:
          "हाँ। यह हमेशा के लिए मुफ़्त है और इसमें साइन-इन नहीं चाहिए।",
      },
    },
  ],
}

// ── 9. RA bill ───────────────────────────────────────────────────────────────
export const RABILL_CONTENT: CalcContent = {
  question: 'How do you calculate the net payable on an RA bill?',
  quickAnswer:
    'Net payable = gross bill − retention − advance recovery + GST − TDS. With the defaults of 5% retention, 18% GST and 1% TDS on the value excluding GST, a ₹10,00,000 gross bill pays ₹11,20,000: retention ₹50,000, GST ₹1,80,000, TDS ₹10,000, and no advance recovery.',
  source:
    'ra-bill-engine.ts RA_BILL_DEFAULTS {retention 5, tds 1, gst 18, advance 0}; calculate(1,000,000) → retention 50000, gst 180000, tds 10000, net 1,120,000. Engine header reference: gross 178,824.5608 → net 173,459.82. TDS under section 393(1) of the Income-tax Act 2025 (applies from 1 April 2026): 1% for an individual or HUF contractor, 2% for others, nothing on a payment of ₹30,000 or less unless the year’s total passes ₹1,00,000, and on the value without GST when GST is shown separately (tdsman.com TDS guide, June 2026; India Briefing). GST: works contracts at 18% since the 12% slab was removed on 22 September 2025 (taxgarden.in). Read from guides, not from the Act or the CBIC notifications.',
  howTo: {
    name: 'How to find the net payable on an RA bill',
    description: 'Worked example: gross RA bill of ₹10,00,000 at default percentages.',
    steps: [
      { name: 'Take the gross bill value', text: 'Gross value of work done this bill = ₹10,00,000.' },
      { name: 'Hold back retention', text: '5% retention = ₹50,000.' },
      { name: 'Add GST', text: '18% GST on the gross bill value = ₹1,80,000.' },
      { name: 'Deduct TDS', text: '1% TDS on the value excluding GST = ₹10,000.' },
      { name: 'Net advance recovery', text: 'No advance in this example, so ₹0.' },
      { name: 'Get the net payable', text: '10,00,000 − 50,000 + 1,80,000 − 10,000 = ₹11,20,000.' },
    ],
  },
  hi: {
    question: "RA बिल पर नेट देय कैसे निकालते हैं?",
    quickAnswer:
      "नेट देय = ग्रॉस बिल − रिटेंशन − एडवांस की वसूली + GST − TDS। 5% रिटेंशन, 18% GST और GST को छोड़कर वैल्यू पर 1% TDS की शुरुआती दरों पर ₹10,00,000 के ग्रॉस बिल पर ₹11,20,000 का भुगतान होता है: रिटेंशन ₹50,000, GST ₹1,80,000, TDS ₹10,000, और कोई एडवांस वसूली नहीं।",
    howTo: {
      name: "RA बिल का नेट देय कैसे निकालें",
      description: "हल किया उदाहरण: ₹10,00,000 का ग्रॉस RA बिल शुरुआती प्रतिशतों पर।",
      steps: [
        { name: "ग्रॉस बिल वैल्यू लीजिए", text: "इस बिल में हुए काम की ग्रॉस वैल्यू = ₹10,00,000।" },
        { name: "रिटेंशन रोकिए", text: "5% रिटेंशन = ₹50,000।" },
        { name: "GST जोड़िए", text: "ग्रॉस बिल वैल्यू पर 18% GST = ₹1,80,000।" },
        { name: "TDS काटिए", text: "GST को छोड़कर वैल्यू पर 1% TDS = ₹10,000।" },
        { name: "एडवांस की वसूली घटाइए", text: "इस उदाहरण में कोई एडवांस नहीं, इसलिए ₹0।" },
        { name: "नेट देय निकालिए", text: "10,00,000 − 50,000 + 1,80,000 − 10,000 = ₹11,20,000।" },
      ],
    },
  },
  faq: [
    {
      question: 'What is retention money on an RA bill?',
      answer:
        'Retention is a percentage of the gross bill value held back from the contractor as security against defects. The calculator starts at 5%; the contract fixes the real rate and when it is released. On a ₹10,00,000 bill, 5% is ₹50,000.',
      hi: {
        question: "RA बिल पर रिटेंशन मनी क्या है?",
        answer:
          "रिटेंशन ग्रॉस बिल वैल्यू का वह प्रतिशत है जो ख़ामियों के बदले सुरक्षा के तौर पर ठेकेदार से रोका जाता है। कैलकुलेटर 5% से शुरू होता है; असली दर और उसे कब छोड़ा जाए, यह अनुबंध तय करता है। ₹10,00,000 के बिल पर 5% ₹50,000 है।",
      },
    },
    {
      question: 'Is TDS calculated on the bill with or without GST?',
      answer:
        'Without GST, when the GST is shown separately on the bill. The calculator applies the TDS percentage to the gross bill value, not to gross plus GST, under section 393(1) of the Income-tax Act 2025.',
      hi: {
        question: "TDS बिल पर GST के साथ निकलता है या GST के बिना?",
        answer:
          "GST के बिना, जब GST बिल पर अलग से दिखाया गया हो। कैलकुलेटर TDS का प्रतिशत ग्रॉस बिल वैल्यू पर लगाता है, ग्रॉस जमा GST पर नहीं, आयकर अधिनियम 2025 की धारा 393(1) के तहत।",
      },
    },
    {
      question: 'What TDS rate should I use for a contractor?',
      answer:
        'Under section 393(1), 1% when the contractor is an individual or HUF and 2% for a company, firm or other. It is 20% if the contractor gives no PAN. The calculator starts at 1% and lets you change it. It does not test the thresholds: no TDS is taken on a single payment of ₹30,000 or less unless the year’s payments to the contractor pass ₹1,00,000.',
      hi: {
        question: "ठेकेदार के लिए TDS की कौन-सी दर लूँ?",
        answer:
          "धारा 393(1) के तहत ठेकेदार व्यक्ति या HUF हो तो 1% और कंपनी, फ़र्म या किसी और के लिए 2%। ठेकेदार PAN न दे तो यह 20% है। कैलकुलेटर 1% से शुरू होता है और आपको बदलने देता है। यह सीमाएँ नहीं परखता: ₹30,000 या उससे कम के एक भुगतान पर TDS नहीं कटता, जब तक कि साल में ठेकेदार को हुए भुगतान ₹1,00,000 से ऊपर न चले जाएँ।",
      },
    },
    {
      question: 'How is advance recovery entered?',
      answer:
        'As a rupee amount, not a percentage. It is deducted from the bill and defaults to ₹0. The contract says how the advance is recovered across bills.',
      hi: {
        question: "एडवांस की वसूली कैसे डाली जाती है?",
        answer:
          "रुपयों की रकम के रूप में, प्रतिशत के रूप में नहीं। यह बिल से घटता है और शुरुआत में ₹0 होता है। अनुबंध बताता है कि एडवांस बिलों में कैसे वसूल होगा।",
      },
    },
    {
      question: 'Is there a real-bill example?',
      answer:
        'Yes. A gross bill of ₹1,78,824.56 with 5% retention (₹8,941.23), 18% GST (₹32,188.42), 1% TDS (₹1,788.25) and an advance recovery of ₹26,823.68 gives a net payable of ₹1,73,459.82.',
      hi: {
        question: "क्या असली बिल का कोई उदाहरण है?",
        answer:
          "हाँ। ₹1,78,824.56 का ग्रॉस बिल, 5% रिटेंशन (₹8,941.23), 18% GST (₹32,188.42), 1% TDS (₹1,788.25) और ₹26,823.68 की एडवांस वसूली के साथ ₹1,73,459.82 का नेट देय देता है।",
      },
    },
    {
      question: 'Does the calculator assume a reduced GST rate for residential work?',
      answer:
        'No. The default is 18%, the general rate for works contracts since the 12% slab was removed on 22 September 2025, and you can edit it. Some residential projects sold by developers are taxed differently; the calculator does not assume that.',
      hi: {
        question: "क्या कैलकुलेटर आवासीय काम के लिए घटी हुई GST दर मानता है?",
        answer:
          "नहीं। शुरुआती दर 18% है, जो 22 सितंबर 2025 को 12% की श्रेणी हटने के बाद वर्क्स कॉन्ट्रैक्ट के लिए आम दर है, और आप इसे बदल सकते हैं। डेवलपरों द्वारा बेचे जाने वाले कुछ आवासीय प्रोजेक्टों पर अलग तरह से टैक्स लगता है; कैलकुलेटर वह नहीं मानता।",
      },
    },
    {
      question: 'Is the RA bill calculator free?',
      answer:
        'Yes. It is permanently free and needs no sign-in.',
      hi: {
        question: "क्या RA बिल कैलकुलेटर मुफ़्त है?",
        answer:
          "हाँ। यह हमेशा के लिए मुफ़्त है और इसमें साइन-इन नहीं चाहिए।",
      },
    },
  ],
}


// ── 10. Wire size ────────────────────────────────────────────────────────────
export const WIRE_CONTENT: CalcContent = {
  question: 'What wire size is needed for each circuit in a home?',
  quickAnswer:
    'Least copper sizes, from the CPWD specification and the BIS draft of IS 4648: 1.5 mm² for lights and fans, 2.5 mm² for sockets and a water heater, 4 mm² for an air conditioner. From the meter, on single phase: 4 mm² up to 5 kW, 6 mm² up to 7 kW, 10 mm² up to 10 kW.',
  source:
    'lib/qty/electrical/wire.ts (shared with the ElectricalPro model): CIRCUIT_RULES lights 1.5 mm² / 6 A, sockets 2.5 mm² / 10 A and 16 A, water heater 2.5 mm² / 16 A, air conditioner 4 mm² / 20 A; mainsMm2 single phase 4, 6 and 10 mm² at 5, 7 and 10 kW. CPWD GS Electrical Part I 2013 cl 3.12; BIS draft IS 4648 (ETD 20, September 2024) Table 4, cl 6.2.8, cl 8.',
  hi: {
    question: "घर के हर सर्किट के लिए कौन-सा तार चाहिए?",
    quickAnswer:
      "तांबे के न्यूनतम साइज़, CPWD विनिर्देश और IS 4648 के BIS मसौदे से: लाइट और पंखों के लिए 1.5 mm², सॉकेट और वॉटर हीटर के लिए 2.5 mm², एयर कंडीशनर के लिए 4 mm²। मीटर से, सिंगल फ़ेज़ पर: 5 kW तक 4 mm², 7 kW तक 6 mm², 10 kW तक 10 mm²।",
  },
  faq: [
    {
      question: 'What wire size is needed for a split AC?',
      answer:
        '4 mm² copper on a circuit of its own, with a 20 A breaker, for an air conditioner of 2 to 3 TR. The draft IS 4648 Table 4 gives 4 mm² for one 16 or 25 A point of up to 5 kW.',
      hi: {
        question: "स्प्लिट AC के लिए कौन-सा तार चाहिए?",
        answer:
          "2 से 3 TR के एयर कंडीशनर के लिए अपने अलग सर्किट पर 4 mm² का तांबे का तार, 20 A के ब्रेकर के साथ। मसौदा IS 4648 की तालिका 4 में 5 kW तक के एक 16 या 25 A पॉइंट के लिए 4 mm² दिया है।",
      },
    },
    {
      question: 'Can I use 1.5 mm² wire for sockets?',
      answer:
        'No. The draft IS 4648 Table 4 gives 1.5 mm² only for light, fan and bell points, and 2.5 mm² from the board to sockets. On 1.5 mm², a heater or iron plugged into a socket can overheat the wire inside the wall.',
      hi: {
        question: "क्या सॉकेट के लिए 1.5 mm² का तार चल सकता है?",
        answer:
          "नहीं। मसौदा IS 4648 की तालिका 4 में 1.5 mm² सिर्फ़ लाइट, पंखे और बेल के पॉइंट के लिए दिया है, और बोर्ड से सॉकेट तक 2.5 mm²। 1.5 mm² पर, सॉकेट में लगाया हीटर या आयरन दीवार के अंदर तार को गरम कर सकता है।",
      },
    },
    {
      question: 'Is 2.5 mm² enough for power sockets, or should it be 4 mm²?',
      answer:
        'The two sources differ. CPWD asks for 4 mm² on power wiring in its own works. The draft IS 4648 allows 2.5 mm² on a circuit of up to two sockets or one appliance of up to 3 kW, and the calculator gives that figure. Take 4 mm² if the run is long or you want room for heavier appliances later.',
      hi: {
        question: "पावर सॉकेट के लिए 2.5 mm² काफ़ी है या 4 mm² चाहिए?",
        answer:
          "दोनों स्रोतों में फ़र्क़ है। CPWD अपने कामों में पावर वायरिंग पर 4 mm² माँगता है। मसौदा IS 4648 दो सॉकेट तक के, या 3 kW तक के एक उपकरण वाले, सर्किट पर 2.5 mm² की इजाज़त देता है, और कैलकुलेटर वही आँकड़ा देता है। रन लंबा हो, या आगे चलकर भारी उपकरण लगाने की गुंजाइश चाहिए, तो 4 mm² लीजिए।",
      },
    },
    {
      question: 'Which breaker goes with each wire size?',
      answer:
        'The draft IS 4648 cl 6.2.8 gives up to 6 A for lights, up to 10 A where a circuit has more than two 6 A sockets, 16 A for up to two 16 A outlets, and 20 or 25 A for an air conditioner. The breaker protects the wire, so it is never larger than the wire can carry.',
      hi: {
        question: "हर तार के साथ कौन-सा ब्रेकर लगता है?",
        answer:
          "मसौदा IS 4648 cl 6.2.8 लाइट के लिए 6 A तक, जहाँ सर्किट में दो से ज़्यादा 6 A सॉकेट हों वहाँ 10 A तक, दो 16 A आउटलेट तक के लिए 16 A, और एयर कंडीशनर के लिए 20 या 25 A देता है। ब्रेकर तार की हिफ़ाज़त करता है, इसलिए वह कभी उससे बड़ा नहीं होता जितना तार झेल सकता है।",
      },
    },
    {
      question: 'What size wire is needed from the meter to the main board?',
      answer:
        'It depends on the load of the home. On single phase the draft IS 4648 Table 4 gives 4 mm² up to 5 kW, 6 mm² over 5 up to 7 kW and 10 mm² over 7 up to 10 kW. A home of 100 m² has a design load of at least 7.5 kW (75 W for every m²), so 10 mm². Above 10 kW, and for three phase, the sizes here are assumptions, and your electricity board’s rules apply.',
      hi: {
        question: "मीटर से मेन बोर्ड तक कौन-सा तार चाहिए?",
        answer:
          "यह घर के लोड पर निर्भर है। सिंगल फ़ेज़ पर मसौदा IS 4648 की तालिका 4 में 5 kW तक 4 mm², 5 से ऊपर 7 kW तक 6 mm² और 7 से ऊपर 10 kW तक 10 mm² है। 100 m² के घर का डिज़ाइन लोड कम से कम 7.5 kW होता है (हर m² के लिए 75 W), यानी 10 mm²। 10 kW से ऊपर और थ्री फ़ेज़ के लिए यहाँ के साइज़ मान्यताएँ हैं, और आपके बिजली बोर्ड के नियम लागू होते हैं।",
      },
    },
    {
      question: 'Does the calculator allow for a long run?',
      answer:
        'No. The sizes are the least. A long cable loses voltage and needs a larger wire, and the calculator does not work out the voltage drop, so ask the electrician about a long run.',
      hi: {
        question: "क्या कैलकुलेटर लंबे रन का हिसाब रखता है?",
        answer:
          "नहीं। ये साइज़ न्यूनतम हैं। लंबी केबल में वोल्टेज गिरता है और बड़ा तार चाहिए, और कैलकुलेटर वोल्टेज ड्रॉप नहीं निकालता, इसलिए लंबे रन के बारे में इलेक्ट्रीशियन से पूछिए।",
      },
    },
    {
      question: 'Is the wire size calculator free?',
      answer:
        'Yes. It is permanently free and needs no sign-in.',
      hi: {
        question: "क्या वायर साइज़ कैलकुलेटर मुफ़्त है?",
        answer:
          "हाँ। यह हमेशा के लिए मुफ़्त है और इसमें साइन-इन नहीं चाहिए।",
      },
    },
  ],
}

// Keyed by route path. Used by JSON-LD (lib/seo/schema.ts) and llms-full.txt.
export const CALC_CONTENT: Record<string, CalcContent> = {
  '/tools/bar-bending-schedule-calculator': BBS_CONTENT,
  '/tools/water-tank-size-calculator': TANK_CONTENT,
  '/tools/brick-calculator': BRICK_CONTENT,
  '/tools/concrete-mix-ratio-calculator': MIX_CONTENT,
  '/tools/concrete-cube-test-calculator': CUBE_CONTENT,
  '/tools/daily-wage-pf-esi-calculator': WAGE_CONTENT,
  '/tools/earned-value-calculator': EVM_CONTENT,
  '/tools/paint-tile-calculator': PAINT_TILE_CONTENT,
  '/tools/ra-bill-retention-tds-calculator': RABILL_CONTENT,
  '/tools/wire-size-calculator': WIRE_CONTENT,
}
