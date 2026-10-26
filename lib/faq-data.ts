// FAQ content — single source for app/faq/page.tsx, FAQPage JSON-LD and /llms-full.txt.
// NirmanShastra works out QUANTITIES first. No labour, dealer, contractor or rupee-rate figure of ours appears here; rupees come only from rates the visitor types.

import { TOOL_PRICE_PAISE, PRICE, PACK_CLAIMS_PER_REPORT } from '@/lib/tool-pricing'
import { inr } from '@/lib/seo/site'
import { REFUND_DAYS, REFUND_PROCESSING } from '@/lib/policy'
import { CONTACT_EMAIL } from '@/lib/site-contact'

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
          'NirmanShastra works out how much material your house needs: concrete, steel, cement, sand, aggregate, bricks, wire and pipe. You answer a few plain questions about your plot and plan. The quantities are then worked out to the Indian Standards (IS 456:2000, IS 875, IS 1893:2016, IS 13920:2016, IS 1786:2008 and others) on our server. It gives quantities first: no labour figures, no dealer prices and no contractor rates of ours. If you want the rupees, you can type your own rates into a report; it multiplies them by the quantities and leaves out labour, transport and taxes.',
      },
      {
        question: 'Who is NirmanShastra for?',
        answer:
          'Mainly for homeowners who are about to build or renovate and want to know what a house like theirs needs before they sign with a contractor or place an order. It is also useful for site supervisors and small builders who want a quick baseline to check material orders against.',
      },
      {
        question: 'Do I need to know construction to use these tools?',
        answer:
          'No. Each tool asks in plain words: plot size, number of floors, city, soil, how you want the house to look. You do not need to know what M20 concrete is or how to read a structural drawing. The engineering is done for you, and the report explains what each quantity is for.',
      },
      {
        question: 'How is this different from asking a contractor for a quote?',
        answer:
          'A contractor\'s quote mixes quantities, labour, profit and their own habits into one number, so it is hard to check. NirmanShastra gives the quantities first, worked out from public Indian Standards. Put your contractor\'s quantities next to ours, line by line, and ask for an explanation wherever they differ. Price is a separate conversation that you have with your own suppliers; if you want to see the rupees, you can type their rates into the report and it multiplies them by the quantities.',
      },
      {
        question: 'What is not included?',
        answer:
          'Labour, supervision, contractor margin, material or transport rates, taxes, permits and design fees are not included and are never estimated. NirmanShastra does not tell you what the house will cost. It tells you what the house will need and, if you type in your own material rates, what those materials come to at those rates. Each paid report also lists what that particular tool leaves out.',
      },
    ],
  },
  {
    label: 'Reports and pricing',
    code: 'PRC',
    items: [
      {
        question: 'How much does it cost?',
        answer: `The free calculators and the free first look at your frame cost nothing. The paid quantity reports are priced per tool: ElectricalPro and PlumbingPro at ${inr(TOOL_PRICE_PAISE.electropro)} each, MasonryPro at ${inr(TOOL_PRICE_PAISE.masonpro)}, InteriorPro at ${inr(TOOL_PRICE_PAISE.interiorpro)}, StructurePro at ${inr(TOOL_PRICE_PAISE.structopro)} and the combined Grand Total quantity report at ${inr(TOOL_PRICE_PAISE.grandtotal)}, added on top of the phase reports it combines. The Complete House Pack is ${PRICE.pack} for all five reports and the Grand Total for one house; bought one by one they cost ${PRICE.packSeparate}, so the pack saves ${PRICE.packSavings}. These are the prices of the reports, not estimates of building cost.`,
      },
      {
        question: 'What is the Complete House Pack, and how does it work?',
        answer: `It is one purchase, ${PRICE.pack}, that unlocks all five quantity reports (structure, masonry, electrical, plumbing and interior) and the Grand Total buying list for one house. You pay once on the Complete House Pack page. Then you open each tool as usual, enter your house, and press "Use my Complete House Pack" where you would otherwise pay. A pack covers one house: every report must match the same building (same floors, same state, floor area within 10%). Each report can be made up to ${PACK_CLAIMS_PER_REPORT} times, so you can correct a figure you typed wrongly. The Grand Total is included in the pack.`,
      },
      {
        question: 'What do I get when I pay for a report?',
        answer:
          'A full quantity report for your project: every material quantity with its unit, the IS clause it comes from, an IS compliance panel, the assumptions we made on your behalf, what is not included, and a downloadable PDF you can hand to your contractor or structural engineer. StructurePro also opens a 3D model of your frame.',
      },
      {
        question: 'What can I see before paying?',
        answer:
          'For StructurePro you can see your seismic zone, the grades of concrete and steel that apply, the IS-code checks and a "frame at a glance" plan with a 3D view. That includes the grid of columns and beams, the number of footings and the slab panels. Material quantities stay hidden until payment is verified on our server.',
      },
      {
        question: 'Do I need an account?',
        answer:
          'The free calculators need no account. A paid tool starts with your name, email, state and city, so the report can be delivered to you and the earthquake zone and wind speed can be read from where you build. Naming the project is optional.',
      },
      {
        question: 'What exactly do I pay at checkout?',
        answer:
          'The amount charged is the price shown on the tool, and Razorpay shows that amount before you confirm. The price is set on our server, not in your browser.',
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
          'StructurePro uses IS 456:2000 (concrete), IS 1786:2008 (steel bars), IS 875 Parts 1 to 3 (dead, live and wind loads), IS 1893 (Part 1) (earthquake) and IS 13920:2016 (ductile detailing), with SP 34 for detailing practice. MasonryPro, ElectricalPro, PlumbingPro and InteriorPro each draw on their own set of standards and public material-consumption norms. The IS Codes Used page lists every source with its edition, what it governs and where its limits are.',
      },
      {
        question: 'Are the IS code values accurate and up to date?',
        answer:
          'We work from the published documents and cite the clause behind each rule on the report. Where a code allows a choice, we state the choice we made. Where we could not read a clause in full, or had to rebuild a table from a poor scan, the IS Codes Used page says so beside that source.',
      },
      {
        question: 'Why does my seismic zone matter for the structural quantities?',
        answer:
          'IS 1893 gives different earthquake forces for each zone. In higher zones the columns and beams get bigger and carry more steel, and IS 13920:2016 requires closer stirrups at the joints. StructurePro reads the zone from your state and city and applies it. Wind load under IS 875 Part 3 is also checked, and the larger of the two governs. In most low-rise houses the earthquake case governs.',
      },
      {
        question: 'What does the IS compliance panel check?',
        answer:
          'For StructurePro the panel lists the concrete grade chosen for the exposure (IS 456 Table 5), the steel grade, the earthquake and wind checks, the foundation type for your soil and the nominal cover (IS 456 Table 16), each with its clause. A check is marked pass or advisory. An advisory means something has to be confirmed on site or by an engineer, for example a soil test.',
      },
    ],
  },
  {
    label: 'Technical',
    code: 'TECH',
    items: [
      {
        question: 'How accurate are the quantities?',
        answer:
          'They are an estimate worked out from a few answers, not a structural design. For the frame, the model lays out a column grid for your plan, takes loads from IS 875, checks earthquake and wind forces and sizes the footings, columns, beams and slabs. The report shows a low and a high figure beside each total, because your real drawings will differ, and the true figure can still fall outside them. Real buildings can carry more steel than a code-based model gives, so treat the figures as a baseline to question a quote with. A structural engineer\'s drawings and bar bending schedule always override these figures.',
      },
      {
        question: 'Why does the tool ask for my city and soil type?',
        answer:
          'State and city decide your seismic zone, the design wind speed and how severe the weather exposure is (IS 1893, IS 875 Part 3, IS 456). Soil decides the footing type and depth, which changes how much concrete and steel go below ground.',
      },
      {
        question: 'Does StructurePro cover the whole building?',
        answer:
          'StructurePro covers the RCC frame: footings, plinth beams, columns, beams, slabs, balconies, an open stilt floor if you have one, the staircase and the small RCC items such as lintels and sunshades. Brickwork and plaster belong to MasonryPro, wiring to ElectricalPro, pipes to PlumbingPro and finishes to InteriorPro. Grand Total joins them into one list.',
      },
      {
        question: 'Can I use NirmanShastra for commercial buildings or for adding a floor to an old house?',
        answer:
          'The tools are for new residential houses. StructurePro accepts one to ten floors, but its model is built for low-rise houses, and anything over 30 m tall, or tall and narrow, is flagged for an engineer to review. Adding a floor to an existing building needs an engineer to survey what is already there, so we do not estimate it. Commercial buildings are outside what the tools model.',
      },
      {
        question: 'Why do you not show prices for materials?',
        answer:
          'Rates change by city, by month and by supplier, and any rate we printed would be out of date or wrong for you, so we do not print one. Quantities do not change with the market. Take the quantities to your own suppliers and get your own quotes. If you want to see the rupees, type their rates into the optional panel on a paid report.',
      },
      {
        question: 'Can I see the material cost in rupees?',
        answer:
          'Yes, at your own rates. Every paid report and the Grand Total has an optional panel, "Want this in rupees? Enter your local rates." Type the rate your dealer quotes for cement, steel, sand, bricks and the other materials you want priced, and leave any box empty to skip it. The page then shows the material cost per item and a total, labelled "Material cost at the rates you entered. Labour, transport and taxes are not included." Nothing is filled in for you, and the result is not a quotation or a cost for the whole house. A "typical" range beside a box, where there is one, is only a dated guide. The PDF carries the rupee table only if you typed rates and asked for it.',
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
          'Yes. Payments are processed by Razorpay, a PCI-DSS compliant gateway. NirmanShastra never stores your card details. Each payment is verified on our server with an HMAC SHA256 signature before any paid content is revealed.',
      },
      {
        question: 'Can I get a refund?',
        answer:
          `Yes. If your report does not help you question at least one line of your contractor’s quote, write to us within ${REFUND_DAYS} days of purchase and we will refund you in full. No forms, no argument. Once approved, the money reaches your original payment method within ${REFUND_PROCESSING}. Email ${CONTACT_EMAIL} with your report ID (it starts with NS-). A report that fails to generate or arrive because of a fault on our side is refunded in full as well. The full policy is at /refund-policy and the Terms of Use say the same.`,
      },
      {
        question: 'What payment methods are accepted?',
        answer:
          'Everything Razorpay offers: UPI (PhonePe, Google Pay, Paytm), debit and credit cards, net banking and wallets.',
      },
    ],
  },
]
