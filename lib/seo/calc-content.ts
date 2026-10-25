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

export interface CalcContent {
  /** The question the quick answer responds to (rendered as the box label). */
  question: string
  /** 40–60 words, real number + IS code. Rendered right under the H1. */
  quickAnswer: string
  /** Where the numbers in quickAnswer/faq come from, for re-verification (not rendered). */
  source: string
  faq: CalcFaq[]
  /** Steps of the worked example, for HowTo schema (optional). */
  howTo?: { name: string; description: string; steps: { name: string; text: string }[] }
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
  faq: [
    {
      question: 'How do I calculate the cutting length of a stirrup?',
      answer:
        'Take the stirrup out to out, which is the member’s width and depth less the cover on both sides. The length is 2 × (A + B) + 12d for a closed stirrup with 135° hooks (two 10d hook tails, less the corners and hook bends), rounded up to the next 25 mm. An 8 mm stirrup of 300 × 200 mm is 1,096 mm, so 1,100 mm.',
    },
    {
      question: 'How much does a metre of bar weigh?',
      answer:
        'd² ÷ 162.2 kilograms, with d in millimetres, which reproduces the IS 1786 table: 8 mm 0.395, 10 mm 0.617, 12 mm 0.888, 16 mm 1.58 and 20 mm 2.47 kg a metre.',
    },
    {
      question: 'How much does a bend take off the length?',
      answer:
        'A right-angle bend round a pin of radius 4d takes 3d off the sum of the two legs, taken out to out (IS 2502 Table V). A 45° bend takes about 0.6d. A 12 mm L-bar of 1,000 and 500 mm cuts at 1,500 − 36 = 1,464 mm.',
    },
    {
      question: 'Why is the hook tail 75 mm for a small bar?',
      answer:
        'IS 13920 clause 6.3.1 asks for a 135° hook tail of 10 times the bar size and not less than 75 mm. A 6 mm bar has a 10d tail of 60 mm, so it gets 15 mm more on each hook; an 8 mm bar already has 80 mm.',
    },
    {
      question: 'Why is the cutting length rounded up to 25 mm?',
      answer:
        'IS 2502 clause 5.1.1 rounds each cutting length up to the next whole 25 mm. The weight on this page is the weight of the rounded bar.',
    },
    {
      question: 'How much extra steel should I buy?',
      answer:
        'CPWD buys 1.05 quintals of bar for each quintal placed (Delhi Analysis of Rates 2014, item 5.22.1), and the page shows steel to buy at 5% more than the schedule weight. That is CPWD’s allowance for cutting waste, not a rule for every job.',
    },
    {
      question: 'Does it work for cranked bars?',
      answer:
        'Yes, for a crank at 45°. The slope is 1.414 times the rise, so the bar is 0.414 × the rise longer than its end-to-end run, less two 45° bends. A 3,000 mm run of 16 mm bar with a 150 mm rise cuts at 3,043 mm, so 3,050 mm.',
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
  faq: [
    {
      question: 'How many litres per person per day does the calculator assume?',
      answer:
        '135 litres per person per day for piped or tanker water, from IS 1172:1993 for a house with flushing toilets, and 150 for a house on its own borewell. The standard sets demand by the size of the town and not by source, so the borewell figure is a choice the calculator makes.',
    },
    {
      question: 'How is the water split between the tanks?',
      answer:
        'The NBC Part 9 Section 1 draft (November 2024) splits a day’s water. Piped supply: underground two-thirds of a day, overhead one-third. Borewell: overhead only, half a day. Tanker: underground a day and a half, overhead one-third, which is a reading of a clause the draft words unclearly.',
    },
    {
      question: 'What tank size does a family of 4 need?',
      answer:
        'On piped supply, 4 people use 540 L a day, which needs 360 L underground and 180 L overhead: a 500 L tank in each place. On a borewell they use 600 L a day and the overhead tank holds 300 L, so one 500 L tank.',
    },
    {
      question: 'What tank size does a family of 6 need?',
      answer:
        'On piped supply, 6 people use 810 L a day, which needs 540 L underground and 270 L overhead: a 1,000 L underground tank and a 500 L overhead tank. On a borewell they use 900 L a day and the overhead tank holds 450 L, so one 500 L tank.',
    },
    {
      question: 'Why does a borewell house have no underground tank?',
      answer:
        'A borewell pump can fill the roof tank whenever it is needed, so there is nothing to catch and hold. The draft allows an overhead tank alone to hold one-third to one-half of a day, and the calculator takes the half.',
    },
    {
      question: 'What if the water does not arrive every day?',
      answer:
        'The calculator has no day count. IS 2065 cl 11.11 asks for an overhead tank of at least half a day’s water where supply is intermittent, and the piped option gives only a third. Choose Tanker for a day and a half underground, and ask for an overhead tank of at least half a day.',
    },
    {
      question: 'Which tank sizes does it round to?',
      answer:
        '500, 1,000, 1,500, 2,000, 3,000 and 5,000 litres, the common ready-made sizes; no standard lists them. It always rounds up. Above 5,000 litres underground it gives a built tank, rounded up to the next 500 L, and overhead it gives equal ready-made tanks.',
    },
  ],
}

// ── 3. Brick ─────────────────────────────────────────────────────────────────
export const BRICK_CONTENT: CalcContent = {
  question: 'How many bricks are needed per square metre of wall?',
  quickAnswer:
    'A one-brick-thick wall takes about 94 common 230 × 115 × 75 mm bricks per square metre, or 100 modular 190 × 90 × 90 mm bricks (IS 1077:1992), all with 10 mm joints. A half-brick wall takes about half. A 10 m × 3 m red-brick wall is 2,824 bricks; order 5–10% extra.',
  source:
    'brick-engine.ts imports SYSTEMS, unitsPerM2 and jointMortarPerM2 from lib/qty/masonry/model.ts (the MasonryPro model). bricks per m² = (t + 10 mm) / ((L + 10)(W + 10)(H + 10)). 10 m × 3 m, one brick thick: red 94.12/m² → 2,824; modular 100 → 3,000; 230×110×70 104.17 → 3,125. Half brick: 49.02 → 1,471; 50 → 1,500; 52.08 → 1,562. 1.9 m² door out of the red wall: 28.1 m² → 2,645. Breakage 5% (MasonryPro) and 10% (this page): red 10×3 → 2,965 and 3,106.',
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
  faq: [
    {
      question: 'How many bricks are in a 10 m × 3 m wall?',
      answer:
        'A wall of 30 m², one brick thick, takes 2,824 of the 230 × 115 × 75 mm red brick, 3,000 of the 190 × 90 × 90 mm modular brick, or 3,125 of the 230 × 110 × 70 mm brick, before breakage. A half-brick wall of the same size takes 1,471, 1,500 or 1,562.',
    },
    {
      question: 'How do I allow for doors and windows?',
      answer:
        'Take each opening’s area out of the wall area first. A 0.9 × 2.1 m door is about 1.9 m² and a 1.2 × 1.2 m window about 1.44 m². Taking one 1.9 m² door out of the 10 m × 3 m red-brick wall leaves 28.1 m² and 2,645 bricks before breakage.',
    },
    {
      question: 'How much extra should I order for breakage?',
      answer:
        'No standard gives a figure. The MasonryPro report allows 5% for a straight, plain wall, and this calculator shows 10% for a wall with a lot of cutting. On 2,824 bricks that is about 140 to 280 more.',
    },
    {
      question: 'What brick size does the calculator assume?',
      answer:
        'You choose. The red brick is 230 × 115 × 75 mm, the size most kilns make, which is not a BIS size. The modular brick is 190 × 90 × 90 mm (IS 1077:1992). The third is 230 × 110 × 70 mm (IS 1077 and IS 12894:2002). The joint is 10 mm for all three.',
    },
    {
      question: 'Why is the count not exactly 100 per square metre?',
      answer:
        'One hundred is the count for the modular brick, which lays as a neat 200 × 100 × 100 mm unit with its joint. A wall of the 230 × 115 × 75 mm red brick holds about 94 in a square metre because the brick is bigger, and a 230 × 110 × 70 mm brick about 104 because it is smaller. The count depends on the size of the brick you are sent.',
    },
    {
      question: 'What is the difference between a one-brick and a half-brick wall?',
      answer:
        'A one-brick wall is as thick as the brick is long, 230 mm for the red brick, and is the usual outer wall. A half-brick wall is as thick as the brick is wide, 115 mm for the red brick, and is used for inner partitions. It takes about half as many bricks to the square metre.',
    },
    {
      question: 'Does it work for AAC blocks?',
      answer:
        'No. This calculator counts clay and fly-ash bricks. Block walls have different sizes and joints, and the MasonryPro report counts AAC and concrete blocks.',
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
  faq: [
    {
      question: 'What is the mix ratio for M20 concrete?',
      answer:
        'M20 is 1 : 1.5 : 3 (cement : sand : coarse aggregate) by volume. The CPWD Delhi Analysis of Rates 2014 takes 400 kg of cement, 8.0 bags of 50 kg, 0.425 m³ of sand and 0.85 m³ of coarse aggregate for each cubic metre.',
    },
    {
      question: 'How many bags of cement are in 1 m³ of M25 concrete?',
      answer:
        'IS 456:2000 gives M25 no nominal ratio; it is a design mix. Worked by the IS 10262 method with a water-cement ratio of 0.48, this calculator takes 411 kg, about 8.2 bags, on a mild or moderate site, and 438 kg, about 8.8 bags, on a severe site where the ratio is held to 0.45. A laboratory trial sets the real figure.',
    },
    {
      question: 'Why is there no 1 : 1 : 2 mix for M25 any more?',
      answer:
        'IS 456 allows a nominal mix only up to M20, and a 1 : 1 : 2 mix takes about 550 kg of cement a cubic metre, above the 450 kg ceiling in clause 8.2.4.2. The calculator now works M25 as a design mix, which takes about 8.2 to 8.8 bags.',
    },
    {
      question: 'What does the site exposure change?',
      answer:
        'IS 456 Table 5 sets, for each of five exposures, the lowest grade for reinforced concrete (M20, M25, M30, M35, M40), the least cement (300 to 360 kg) and the highest water-cement ratio (0.55 down to 0.40). A tighter ratio means more cement in a design mix, and the calculator warns when the grade you pick is below the minimum.',
    },
    {
      question: 'How do I scale the quantities for my pour?',
      answer:
        'Quantities scale with volume. A slab of 5 m × 4 m and 125 mm thick is 2.5 m³; in M20 it takes 2.5 × 8.0 = 20 bags of cement, 1.06 m³ of sand and 2.13 m³ of aggregate.',
    },
    {
      question: 'Why does M30 show 450 kg of cement?',
      answer:
        'With 197 litres of water, a water-cement ratio of 0.43 would take more than 450 kg of cement, and IS 456 caps cement at 450 kg a cubic metre. Real M30 to M40 mixes use a water-reducing admixture to cut the water and the cement. The calculator assumes none, so for M30 and above the cement shown is the most you would buy.',
    },
    {
      question: 'Does the answer include wastage?',
      answer:
        'No. The quantities are for finished concrete in place. Spillage, concrete left in the mixer and over-dug trenches are not included, because they depend on the site.',
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
  faq: [
    {
      question: 'How many samples and cubes does a 10 m³ pour need?',
      answer:
        '10 m³ falls in the 6–15 m³ band, so 2 samples. At three cubes a sample that is 6 cubes tested at 28 days, or 12 if you also cast three a sample for a 7-day check.',
    },
    {
      question: 'How many cubes does a 45 m³ pour need?',
      answer:
        '45 m³ falls in the 31–50 m³ band, so 4 samples and 12 cubes tested at 28 days, or 24 cubes with a 7-day check.',
    },
    {
      question: 'How many samples does 120 m³ need?',
      answer:
        'The table gives 4 samples for the first 50 m³ and one more for each further 50 m³ or part of it. The further 70 m³ is one block of 50 and part of another, so 2 more: 6 samples and 18 cubes at 28 days.',
    },
    {
      question: 'How many cubes make up a sample?',
      answer:
        'Three, cast from the same batch and tested at 28 days (IS 456 clause 15.3). Extra cubes for a 7-day check are allowed but not asked for; the calculator shows the count with and without them.',
    },
    {
      question: 'Is one sample per shift also required?',
      answer:
        'Yes. IS 456:2000 clause 15.2.2 asks for at least one sample from each shift of concreting, and lets a ready-mixed concrete plant agree another frequency with the buyer. The tool shows this as a reminder and does not add it to the volume-based count.',
    },
    {
      question: 'Is the count for the whole building or for each grade?',
      answer:
        'For concrete of each grade. A building with M25 columns and M20 slabs counts the two separately, each against its own volume.',
    },
    {
      question: 'What is the sampling frequency in IS 456 for small pours?',
      answer:
        'Up to 5 m³ needs 1 sample, 6 to 15 m³ needs 2, 16 to 30 m³ needs 3 and 31 to 50 m³ needs 4. Above 50 m³ it is 4 plus one more for each further 50 m³ or part of it.',
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
  faq: [
    {
      question: 'What is the PF cap for a daily-wage worker?',
      answer:
        'Employee PF is 12% of basic earned, held at ₹1,800, which is 12% of the ₹15,000 EPF wage ceiling. A worker who earns ₹20,700 in the period still pays ₹1,800, not ₹2,484. Contributions on wages above the ceiling are by agreement. The EPF Scheme 2026, notified in June 2026 under the Code on Social Security 2020, leaves the ceiling at ₹15,000.',
    },
    {
      question: 'When is ESI taken, and when not?',
      answer:
        'A worker is covered when wages without overtime are ₹21,000 a month or less, and then 0.75% is taken on all wages, overtime included. Above ₹21,000 of basic, no ESI is taken in this calculator. In practice cover is fixed for each six-month period (April to September, October to March), so a worker covered at the start of a period stays covered to its end even if wages cross ₹21,000. The calculator tests the wages you enter and cannot see how the period began.',
    },
    {
      question: 'What is the ₹176 daily-wage exemption?',
      answer:
        'A worker whose average daily wage is ₹176 or less does not pay the worker’s share of ESI; the employer still pays its own share. The calculator divides gross wages by payable days to get the average day, and takes no ESI at or below ₹176.',
    },
    {
      question: 'How is overtime paid?',
      answer:
        'At twice the ordinary rate, under section 14 of the Code on Wages 2019, in force from 21 November 2025. The calculator takes the hourly rate as the daily wage divided by 8. Overtime adds to gross wages and to the ESI base, but not to the PF base, which stays on basic earned. For example ₹800 a day for 26 days plus 8 hours of overtime is ₹22,400 gross, ESI ₹168 and net pay ₹20,432.',
    },
    {
      question: 'Can I enter part days like 23.5?',
      answer:
        'Yes. Payable days can be fractional. At ₹650 a day for 20.5 days the basic is ₹13,325, PF ₹1,599, ESI ₹99.94 and net pay ₹11,626.06.',
    },
    {
      question: 'How is net payable worked out?',
      answer:
        'Net payable = gross wages − employee PF − employee ESI − advance recovered. Advance defaults to ₹0.',
    },
    {
      question: 'Does this show the employer’s contribution?',
      answer:
        'No. It shows the worker’s own deductions on a site muster roll. The employer’s PF and ESI share is a separate cost and is not part of the net wage.',
    },
    {
      question: 'Do PF and ESI apply to every site worker?',
      answer:
        'Only when the employer’s establishment is covered, which depends on how many people it employs and on the state. The calculator assumes both apply, and says so; check with the employer or the labour office for a particular site.',
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
  faq: [
    {
      question: 'What do SPI and CPI below 1 mean?',
      answer:
        'An SPI below 1 means less value has been earned than was planned by now, so the project is behind schedule. A CPI below 1 means each rupee of earned value cost more than budgeted, so the project is over cost. Exactly 1.0 counts as on target.',
    },
    {
      question: 'How is EAC calculated?',
      answer:
        'EAC = BAC ÷ CPI, using the full-precision CPI. The estimate to complete is ETC = EAC − AC and the variance at completion is VAC = BAC − EAC. In the example above ETC is ₹7,80,000 and VAC is −₹2,00,000.',
    },
    {
      question: 'What is TCPI?',
      answer:
        'TCPI = (BAC − EV) ÷ (BAC − AC). It is the cost efficiency the remaining work must achieve to finish on budget. In the example above it is about 1.12.',
    },
    {
      question: 'What are BAC, PV, EV and AC?',
      answer:
        'BAC is the total approved budget. PV is the budgeted cost of work scheduled by now. EV is the budgeted cost of work actually completed. AC is the real spend on the work completed.',
    },
    {
      question: 'What are SV and CV?',
      answer:
        'Schedule variance SV = EV − PV and cost variance CV = EV − AC. Negative values mean behind schedule or over cost. In the example SV is −₹50,000 and CV is −₹70,000.',
    },
    {
      question: 'What happens if PV or AC is zero?',
      answer:
        'The indices that would divide by zero are shown as not computable, never as infinity or an error.',
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
  faq: [
    {
      question: 'How much paint is needed for 1,000 sq ft of wall and ceiling?',
      answer:
        '1,000 sq ft is 92.9 m². With the Standard system that is about 58.5 kg of putty, 7.3 L of primer and 8.8 L of emulsion. Economy takes 6.8 L of primer and 15.1 L of distemper and no putty; Premium takes 37.1 kg of putty, 7.3 L of primer and 13.5 L of luxury emulsion. All include 5% wastage.',
    },
    {
      question: 'How many 600 × 600 mm tiles do I need for 100 m²?',
      answer:
        'About 290 tiles, or 73 boxes of 4. A 600 × 600 mm tile with a 2 mm joint covers 0.362 m², so 2.76 tiles cover a square metre. Add 5% for cutting when the tiles are laid straight: 105 m² × 2.76 is 290 tiles.',
    },
    {
      question: 'How much extra tile should I buy for cutting?',
      answer:
        'The calculator adds 5% for a small tile laid straight; 10% for a large tile (800 × 800 mm or 600 × 1200 mm), a diagonal lay of a small tile, or a small room or bathroom; and 15% for a large tile laid diagonally. No standard fixes these; they are allowances the calculator assumes.',
    },
    {
      question: 'Is putty needed under paint?',
      answer:
        'Not with the Economy system: distemper goes over a coat of primer on the plaster. The Standard system adds about 1 mm of cement putty, and the Premium system an acrylic putty in two coats. Putty smooths the plaster for an even emulsion finish.',
    },
    {
      question: 'How is grout worked out?',
      answer:
        'From the joints: the length of joint in a square metre, times the joint width and the tile thickness, times a grout density of 1.6 kg a litre (an assumption; 1.4 to 1.6), plus 10% for waste. A larger tile has less joint, so it takes less grout.',
    },
    {
      question: 'How much cement and sand goes under floor tiles, and how much adhesive instead?',
      answer:
        'A mortar bed takes about 11.0 kg of cement and 22 litres of sand a m² under a floor tile, and 9.2 kg and 12.5 litres under a wall tile, from the CPWD item text. Tile adhesive takes 5.25 kg a m² for tiles up to 900 cm², 10.5 kg up to 3,600 cm² and 12 kg above that, from a maker’s sheet.',
    },
    {
      question: 'Does the calculator count plaster, or the paint on doors?',
      answer:
        'No. It counts one surface at a time: the paint, putty and primer for the area you enter, or the tiles, grout and fixing. Plaster belongs to MasonryPro, and InteriorPro measures every wall, ceiling, floor and door of a house from its plan.',
    },
    {
      question: 'Is the paint and tile calculator free?',
      answer:
        'Yes. It is permanently free and needs no sign-in.',
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
  faq: [
    {
      question: 'What is retention money on an RA bill?',
      answer:
        'Retention is a percentage of the gross bill value held back from the contractor as security against defects. The calculator starts at 5%; the contract fixes the real rate and when it is released. On a ₹10,00,000 bill, 5% is ₹50,000.',
    },
    {
      question: 'Is TDS calculated on the bill with or without GST?',
      answer:
        'Without GST, when the GST is shown separately on the bill. The calculator applies the TDS percentage to the gross bill value, not to gross plus GST, under section 393(1) of the Income-tax Act 2025.',
    },
    {
      question: 'What TDS rate should I use for a contractor?',
      answer:
        'Under section 393(1), 1% when the contractor is an individual or HUF and 2% for a company, firm or other. It is 20% if the contractor gives no PAN. The calculator starts at 1% and lets you change it. It does not test the thresholds: no TDS is taken on a single payment of ₹30,000 or less unless the year’s payments to the contractor pass ₹1,00,000.',
    },
    {
      question: 'How is advance recovery entered?',
      answer:
        'As a rupee amount, not a percentage. It is deducted from the bill and defaults to ₹0. The contract says how the advance is recovered across bills.',
    },
    {
      question: 'Is there a real-bill example?',
      answer:
        'Yes. A gross bill of ₹1,78,824.56 with 5% retention (₹8,941.23), 18% GST (₹32,188.42), 1% TDS (₹1,788.25) and an advance recovery of ₹26,823.68 gives a net payable of ₹1,73,459.82.',
    },
    {
      question: 'Does the calculator assume a reduced GST rate for residential work?',
      answer:
        'No. The default is 18%, the general rate for works contracts since the 12% slab was removed on 22 September 2025, and you can edit it. Some residential projects sold by developers are taxed differently; the calculator does not assume that.',
    },
    {
      question: 'Is the RA bill calculator free?',
      answer:
        'Yes. It is permanently free and needs no sign-in.',
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
  faq: [
    {
      question: 'What wire size is needed for a split AC?',
      answer:
        '4 mm² copper on a circuit of its own, with a 20 A breaker, for an air conditioner of 2 to 3 TR. The draft IS 4648 Table 4 gives 4 mm² for one 16 or 25 A point of up to 5 kW.',
    },
    {
      question: 'Can I use 1.5 mm² wire for sockets?',
      answer:
        'No. The draft IS 4648 Table 4 gives 1.5 mm² only for light, fan and bell points, and 2.5 mm² from the board to sockets. On 1.5 mm², a heater or iron plugged into a socket can overheat the wire inside the wall.',
    },
    {
      question: 'Is 2.5 mm² enough for power sockets, or should it be 4 mm²?',
      answer:
        'The two sources differ. CPWD asks for 4 mm² on power wiring in its own works. The draft IS 4648 allows 2.5 mm² on a circuit of up to two sockets or one appliance of up to 3 kW, and the calculator gives that figure. Take 4 mm² if the run is long or you want room for heavier appliances later.',
    },
    {
      question: 'Which breaker goes with each wire size?',
      answer:
        'The draft IS 4648 cl 6.2.8 gives up to 6 A for lights, up to 10 A where a circuit has more than two 6 A sockets, 16 A for up to two 16 A outlets, and 20 or 25 A for an air conditioner. The breaker protects the wire, so it is never larger than the wire can carry.',
    },
    {
      question: 'What size wire is needed from the meter to the main board?',
      answer:
        'It depends on the load of the home. On single phase the draft IS 4648 Table 4 gives 4 mm² up to 5 kW, 6 mm² over 5 up to 7 kW and 10 mm² over 7 up to 10 kW. A home of 100 m² has a design load of at least 7.5 kW (75 W for every m²), so 10 mm². Above 10 kW, and for three phase, the sizes here are assumptions, and your electricity board’s rules apply.',
    },
    {
      question: 'Does the calculator allow for a long run?',
      answer:
        'No. The sizes are the least. A long cable loses voltage and needs a larger wire, and the calculator does not work out the voltage drop, so ask the electrician about a long run.',
    },
    {
      question: 'Is the wire size calculator free?',
      answer:
        'Yes. It is permanently free and needs no sign-in.',
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
