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
import type { CalcFaq } from '@/lib/seo/calc-content'

export interface PaidExampleRow {
  label: string
  value: string
  note?: string
}

export interface PaidContent {
  /** e.g. "What StructurePro gives you" */
  heading: string
  whatsInside: string[]
  whoFor: string
  example: { title: string; intro: string; rows: PaidExampleRow[]; footnote: string }
  faq: CalcFaq[]
  /** Where the numbers come from, for re-verification (not rendered). */
  source: string
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
  },
}
