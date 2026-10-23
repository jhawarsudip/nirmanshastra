// FAQ content — single source for app/faq/page.tsx, FAQPage JSON-LD and /llms-full.txt.
// Text is unchanged from the original inline array in app/faq/page.tsx.

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqCategory {
  label: string
  code: string
  items: FaqItem[]
}

export const FAQ_CATEGORIES: FaqCategory[] = [
  {
    label: 'General',
    code: 'GEN',
    items: [
      {
        question: 'What is NirmanShastra?',
        answer:
          'NirmanShastra is an IS-code backed construction cost estimation platform for Indian homeowners and builders. It calculates material quantities and costs using the exact values specified in Indian Standards (IS 456:2000, IS 1786:2008, IS 1893:2016, IS 1077:1992, IS 732:2019, IS 1172:1993) — so your estimates are defensible, not guesses.',
      },
      {
        question: 'Who is NirmanShastra for?',
        answer:
          'Primarily for homeowners who are planning to build or renovate and want to verify contractor quotes. Also useful for civil engineers who need a quick BOQ baseline, project managers cross-checking material orders, and anyone who wants to understand what their building actually costs at an IS-code level.',
      },
      {
        question: 'Do I need to know construction to use these tools?',
        answer:
          'No. Each tool asks questions in plain English — floor area, number of floors, city, soil type. You do not need to know what M20 concrete is or how to read a structural drawing. The tool applies the IS-code norms and explains what they mean for your specific situation.',
      },
      {
        question: 'How is NirmanShastra different from asking a contractor for a quote?',
        answer:
          'A contractor\'s quote is their number. NirmanShastra\'s estimate is derived from Indian Standards — public, verifiable, and independent of any contractor relationship. When you have both, you can compare quantities line by line and ask for an explanation of any variance.',
      },
    ],
  },
  {
    label: 'Pricing',
    code: 'PRC',
    items: [
      {
        question: 'How much does it cost?',
        answer:
          'VastuPro (Vastu compliance analysis) is completely free — no payment, no signup required. The five paid estimation tools are priced individually: ElectricalPro and PlumbingPro at ₹499 each, MasonryPro at ₹699, InteriorPro at ₹899, and StructurePro at ₹999.',
      },
      {
        question: 'What do I get when I pay for a tool?',
        answer:
          'A detailed IS-code compliant Bill of Quantities (BOQ) for your specific project — with material quantities, applicable IS clause references, IS compliance panel, Grand Total at three quality tiers (Basic/Standard/Premium), and a downloadable PDF report you can share with contractors or your structural engineer.',
      },
      {
        question: 'Can I see a sample before paying?',
        answer:
          'Yes. Each tool shows you blurred previews of the quantity table before payment — you can see the structure and IS clause references. The actual numbers unlock after payment verification.',
      },
      {
        question: 'Are the prices inclusive of taxes?',
        answer:
          'All prices shown are inclusive of GST. The price displayed on each tool is the final amount — there are no additional charges at checkout.',
      },
    ],
  },
  {
    label: 'IS Codes',
    code: 'IS',
    items: [
      {
        question: 'What IS codes does NirmanShastra use?',
        answer:
          'Each tool is built on the relevant Indian Standards: StructurePro uses IS 456:2000 (concrete) and IS 1893:2016 (seismic); MasonryPro uses IS 1077:1992 (bricks) and IS 2250:1981 (mortar); ElectricalPro uses IS 732:2019 (wiring); PlumbingPro uses IS 1172:1993 (water requirements) and IS 4985:2000 (CPVC pipes); VastuPro uses the Vastu Purusha Mandala framework.',
      },
      {
        question: 'Are the IS code values accurate and up to date?',
        answer:
          'Yes. The core IS values — cement consumption, steel quantities, brick counts, mortar ratios — are locked from the published IS documents and are never altered. The StructurePro engine uses M20 = 8.07 bags/m³, column steel = 196.25 kg/m³, and other values exactly as specified in the standards.',
      },
      {
        question: 'Why does my seismic zone matter for the structural estimate?',
        answer:
          'IS 1893:2016 assigns different design lateral forces to each seismic zone. Higher zones (IV and V, covering Delhi, Guwahati, Srinagar) require more steel detailing and potentially higher concrete grades per IS 13920:2016. StructurePro auto-detects your seismic zone from your state and applies the correct parameters.',
      },
      {
        question: 'What does the IS compliance panel check?',
        answer:
          'StructurePro checks six IS compliance items: concrete grade vs IS 456 exposure class, minimum steel ratio, cover requirements per IS 456 Clause 26.4, seismic zone adequacy per IS 1893, foundation depth vs soil type, and minimum slab thickness. Each check returns a PASS / ADVISORY / FAIL stamp with the relevant IS clause cited.',
      },
    ],
  },
  {
    label: 'Technical',
    code: 'TECH',
    items: [
      {
        question: 'How accurate are the estimates?',
        answer:
          'The quantity calculations are IS-code accurate — the cement bags, steel weight, brick count, and pipe lengths are derived from the same formulas a structural engineer uses. Material rates are updated periodically based on CPWD Delhi Schedule of Rates and regional averages. Expect ±10% on material quantities vs a detailed BOQ from your engineer, and ±15% on total cost due to regional rate variation.',
      },
      {
        question: 'Why does the tool ask for my city and soil type?',
        answer:
          'City determines your seismic zone (IS 1893) and the applicable exposure class (IS 456 — coastal cities have more aggressive exposure, requiring higher-grade concrete). Soil type determines foundation depth and bearing capacity, which affects concrete volume in footings.',
      },
      {
        question: 'Does the estimate include labour costs?',
        answer:
          'Material costs are calculated from IS-derived quantities × current market rates. Labour is shown as a percentage of material cost, based on CPWD norms. The two are shown separately so you can substitute local labour rates if you have them.',
      },
      {
        question: 'Can I use NirmanShastra for commercial buildings?',
        answer:
          'The tools are designed for residential construction up to G+3 (ground plus three floors). For larger commercial projects, the IS codes still apply but structural design requires a licensed structural engineer and detailed drawings — the tool estimates can serve as a cross-check baseline, not a substitute for professional design.',
      },
      {
        question: 'Why are local rates important and how do I use them?',
        answer:
          'Construction material rates vary significantly by region — steel in Chennai vs Delhi can differ by ₹2–4/kg; sand and aggregate prices depend on local quarry availability. Each tool shows a "Using [City] Avg 2026" baseline with a note that you can substitute local rates from your area for a more precise total.',
      },
    ],
  },
  {
    label: 'Payment',
    code: 'PAY',
    items: [
      {
        question: 'Is payment secure?',
        answer:
          'Yes. Payments are processed by Razorpay — India\'s leading payment gateway, PCI-DSS compliant. NirmanShastra never stores your card details. Payment verification uses HMAC SHA256 server-side signature verification before any paid content is revealed.',
      },
      {
        question: 'Can I get a refund?',
        answer:
          'If the tool fails to generate your report due to a technical error on our side, you are entitled to a full refund. Please email support within 24 hours with your order ID. Refunds are not provided for completed, successfully generated reports — since the IS-code calculations are instantaneous and the report is delivered digitally.',
      },
      {
        question: 'What payment methods are accepted?',
        answer:
          'All methods available through Razorpay: UPI (PhonePe, Google Pay, Paytm), debit cards, credit cards, net banking, and Razorpay wallets.',
      },
    ],
  },
]
