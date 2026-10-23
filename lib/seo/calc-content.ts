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
  question: 'How do you calculate the cutting length of a rebar?',
  quickAnswer:
    'Cutting length = straight length + hook allowance − bend deductions (IS 2502). Deduct 1d, 2d and 3d for 45°, 90° and 135° bends; each hook adds the larger of 9d or 75 mm. Weight per metre is d²/162. Example: an 8 mm stirrup of 300 × 200 mm cuts at 1,054 mm and weighs 0.416 kg.',
  source:
    'bbs-engine.ts (IS 2502 constants: d²/162, 1d/2d/3d, max(9d,75), 0.42×crank). Stirrup example run through calculate(): 1000 + 2×75 − (3×16 + 2×24) = 1054 mm; 1.054 m × 0.395 kg/m = 0.416 kg.',
  howTo: {
    name: 'How to find the cutting length and weight of a stirrup',
    description: 'Worked example: 8 mm rectangular stirrup, 300 mm × 200 mm, 135° hooks.',
    steps: [
      { name: 'Find the perimeter', text: 'Rectangular stirrup perimeter = 2 × (300 + 200) = 1,000 mm.' },
      { name: 'Add the hooks', text: 'Two hooks at the larger of 9d (72 mm) or 75 mm gives 75 mm each, so +150 mm.' },
      { name: 'Deduct the bends', text: 'Three 90° bends at 2d (16 mm) and two 135° bends at 3d (24 mm) remove 48 + 48 = 96 mm.' },
      { name: 'Get the cutting length', text: '1,000 + 150 − 96 = 1,054 mm.' },
      { name: 'Get the weight', text: 'Unit weight of 8 mm bar = 8² ÷ 162 = 0.395 kg/m, so 1.054 m weighs 0.416 kg.' },
    ],
  },
  faq: [
    {
      question: 'What is the formula for the weight of a steel bar?',
      answer:
        'Weight per metre in kg = d² ÷ 162, where d is the bar diameter in mm. A 12 mm bar weighs 0.889 kg/m, a 16 mm bar 1.580 kg/m and a 20 mm bar 2.469 kg/m. Multiply by the cutting length in metres, then by the number of bars.',
    },
    {
      question: 'How much length is deducted at a bend?',
      answer:
        'The calculator deducts 1d for a 45° bend, 2d for a 90° bend and 3d for a 135° bend, where d is the bar diameter (IS 2502). On a 10 mm bar a 90° bend removes 20 mm from the cutting length.',
    },
    {
      question: 'How long is the hook allowance?',
      answer:
        'Each standard hook adds the larger of 9d or 75 mm. That is 75 mm on an 8 mm bar (9d is 72 mm), 108 mm on a 12 mm bar and 144 mm on a 16 mm bar.',
    },
    {
      question: 'How is the extra length of a cranked bar calculated?',
      answer:
        'For a 45° crank add 0.42 × the crank depth, then deduct the two 45° bend deductions (1d each). A crank depth of 300 mm adds 126 mm before the deductions.',
    },
    {
      question: 'Which bar shapes does the calculator cover?',
      answer:
        'Thirteen standard shapes: straight bars, L-bars and U-bars, hooked bars, 45° cranked bars, rectangular, square, diamond and triangular stirrups, and circular rings. A 135° seismic-hook stirrup (IS 13920:2016) is included for Zone III to V detailing.',
    },
    {
      question: 'Is the bar bending schedule calculator free?',
      answer:
        'Yes. It is permanently free and needs no sign-in. The separate Bar Bending Schedule toolkit on the site templates page is an Excel product and is not required to use this calculator.',
    },
  ],
}

// ── 2. Water tank size ───────────────────────────────────────────────────────
export const TANK_CONTENT: CalcContent = {
  question: 'What size water tank does a house need?',
  quickAnswer:
    'Allow 135 litres per person per day on municipal supply or 150 on borewell (IS 1172:1993), then store two-thirds of a day’s demand (× 0.67). A family of five on municipal water needs 675 L a day, so 452 L of storage — a 500 L tank. The tool rounds up to the next standard size.',
  source:
    'water-tank-engine.ts: WATER_DEMAND_LPCD {municipal 135, borewell 150}, TANK_RATIO 0.67, STANDARD_TANK_SIZES. calculate() run for 3–8 occupants; 5 × 135 = 675 L; 675 × 0.67 = 452.25 → 452 L.',
  howTo: {
    name: 'How to size a household water tank',
    description: 'Worked example: 5 people on municipal supply, 1 day of storage.',
    steps: [
      { name: 'Pick the demand per person', text: 'Municipal supply uses 135 litres per person per day (IS 1172:1993); borewell uses 150.' },
      { name: 'Find daily demand', text: '5 people × 135 L = 675 L per day.' },
      { name: 'Apply the storage ratio', text: 'Store two-thirds of a day: 675 × 0.67 = 452 L.' },
      { name: 'Round up to a standard size', text: 'The next standard tank at or above 452 L is 500 L.' },
    ],
  },
  faq: [
    {
      question: 'How many litres per person per day does the calculator assume?',
      answer:
        '135 litres per person per day (LPCD) for municipal supply and 150 LPCD for borewell supply, following IS 1172:1993.',
    },
    {
      question: 'Why is storage 0.67 of daily demand?',
      answer:
        'The tool follows the IS 1172:1993 storage ratio built into NirmanShastra’s PlumbingPro engine: total tank capacity = daily demand × 0.67, which is two-thirds of a day’s requirement.',
    },
    {
      question: 'What tank size does a family of 4 need?',
      answer:
        'On municipal supply, 4 people need 540 L a day, which is 362 L of storage, so a 500 L tank. On borewell supply they need 600 L a day, 402 L of storage, which is also a 500 L tank.',
    },
    {
      question: 'What tank size does a family of 6 need?',
      answer:
        'On municipal supply, 6 people need 810 L a day, which is 543 L of storage, so a 1,000 L tank. On borewell supply the figure is 900 L a day and 603 L, which is also a 1,000 L tank.',
    },
    {
      question: 'Why does a borewell family of 5 need a bigger tank than a municipal one?',
      answer:
        'Borewell demand is 150 LPCD, so 5 people need 750 L a day and 503 L of storage. That is just over 500 L, so the tool steps up to a 1,000 L tank. On municipal supply the same family needs 452 L and a 500 L tank.',
    },
    {
      question: 'What if water does not arrive every day?',
      answer:
        'Set the storage days. For 5 people on municipal supply with 2 days of storage the requirement is 905 L, so a 1,000 L tank. The tool multiplies the single-day storage by the number of days.',
    },
    {
      question: 'Which standard tank sizes does it round to?',
      answer:
        '500, 1,000, 1,500, 2,000, 3,000 and 5,000 litres. It always rounds up, never down, because an undersized tank means dry taps. If demand is above the largest single tank, the tool flags that instead of showing a size.',
    },
  ],
}

// ── 3. Brick ─────────────────────────────────────────────────────────────────
export const BRICK_CONTENT: CalcContent = {
  question: 'How many bricks are needed per square metre of wall?',
  quickAnswer:
    'A 9-inch (230 mm) brick wall needs about 100 bricks per square metre and a 4.5-inch (115 mm) partition about 50, using the standard 190 × 90 × 90 mm modular brick with 10 mm joints (IS 1077:1992, IS 2212:1991). A 10 m × 3 m 9-inch wall is 3,000 bricks; order 5–10% extra.',
  source:
    'brick-engine.ts: BRICKS_PER_SQM_9IN 100, BRICKS_PER_SQM_4_5IN 50 (imported from masonpro-engine), BRICK_SIZE_MM 190×90×90, MORTAR_JOINT_MM 10, wastage 5%/10%. calculate(10 m × 3 m, 9in) = 3000; with 1.9 m² opening = 2810.',
  howTo: {
    name: 'How to count bricks for a wall',
    description: 'Worked example: a 10 m long, 3 m high, 9-inch wall with no openings.',
    steps: [
      { name: 'Find the wall area', text: '10 m × 3 m = 30 m².' },
      { name: 'Deduct doors and windows', text: 'Subtract the area of every opening. This example has none, so the net area stays 30 m².' },
      { name: 'Multiply by bricks per m²', text: 'A 9-inch wall takes 100 bricks per m², so 30 × 100 = 3,000 bricks.' },
      { name: 'Add wastage', text: 'Add 5–10% for breakage and cutting: order about 3,150 to 3,300 bricks.' },
    ],
  },
  faq: [
    {
      question: 'How many bricks are in a 10 m × 3 m wall?',
      answer:
        'A 9-inch wall of 30 m² needs 3,000 bricks, and a 4.5-inch partition of the same size needs 1,500, before wastage. With 5–10% wastage the 9-inch wall means ordering about 3,150 to 3,300 bricks.',
    },
    {
      question: 'How do I allow for doors and windows?',
      answer:
        'Deduct each opening’s area from the wall area first. A 0.9 × 2.1 m door is about 1.9 m² and a 1.2 × 1.2 m window about 1.44 m². Deducting one 1.9 m² door from the 10 m × 3 m wall leaves 28.1 m² and 2,810 bricks before wastage.',
    },
    {
      question: 'How much extra should I order for wastage?',
      answer:
        'Add 5–10% for breakage, cutting and site loss. On 3,000 bricks that is roughly 150 to 300 extra.',
    },
    {
      question: 'What brick size does the calculator assume?',
      answer:
        'The standard modular clay brick of 190 × 90 × 90 mm laid with a 10 mm mortar joint, a nominal 200 × 100 × 100 mm unit (IS 1077:1992, IS 2212:1991).',
    },
    {
      question: 'What is the difference between a 9-inch and a 4.5-inch wall?',
      answer:
        'A 9-inch (230 mm) wall is one brick thick and is the usual external and load-bearing wall, at 100 bricks per m². A 4.5-inch (115 mm) wall is half a brick thick, used for internal partitions, at 50 bricks per m².',
    },
    {
      question: 'Does it work for AAC blocks or fly-ash bricks?',
      answer:
        'No. The counts are for modular clay brick. Non-modular bricks, thicker joints and block masonry have different sizes and need different counts.',
    },
  ],
}

// ── 4. Concrete mix ──────────────────────────────────────────────────────────
export const MIX_CONTENT: CalcContent = {
  question: 'How much cement is needed per cubic metre of concrete?',
  quickAnswer:
    'M20 concrete (1 : 1.5 : 3) takes about 8.07 bags of 50 kg cement per cubic metre, and M25 (1 : 1 : 2) takes 11 bags (IS 456:2000). IS 456 needs a laboratory design mix, not a nominal ratio, at M30 and above. Multiply the per-m³ figure by your pour volume.',
  source:
    'concrete-mix-engine.ts GRADES (locked Build Reference Section 8): M20 8.07 bags/m³, M25 11.00 bags/m³; BAG_WEIGHT 50 kg. Cross-check: 1.54 × (1/5.5) × 1440 ÷ 50 = 8.06 bags (M20); 1.54 × (1/4) × 1440 ÷ 50 = 11.09 bags (M25). Sand/aggregate per m³ deliberately NOT quoted here — see verification note.',
  faq: [
    {
      question: 'What is the mix ratio for M20 concrete?',
      answer:
        'M20 is 1 : 1.5 : 3 (cement : sand : coarse aggregate) by volume. This calculator uses 8.07 bags of cement per cubic metre of M20, which is 403.5 kg.',
    },
    {
      question: 'How many cement bags are in 1 m³ of M25 concrete?',
      answer:
        'The calculator uses 11.00 bags (550 kg) of cement per cubic metre for the 1 : 1 : 2 mix.',
    },
    {
      question: 'How do I scale the quantities for my pour?',
      answer:
        'Quantities scale linearly with volume. For 2 m³ of M20 the cement is 8.07 × 2 = 16.14 bags, and for 5 m³ it is 40.35 bags.',
    },
    {
      question: 'Why does the calculator show no quantity for M30?',
      answer:
        'IS 456:2000 requires a design mix, proportioned in a laboratory, for M30 and above. A nominal ratio does not apply, so the tool shows a notice instead of a made-up number.',
    },
    {
      question: 'Does the calculator also give sand and aggregate?',
      answer:
        'Yes. It returns cement bags, sand and aggregate for the volume you enter, in cubic feet and cubic metres, using the per-m³ figures shown in the worked example on this page.',
    },
    {
      question: 'How much does a cement bag weigh in these calculations?',
      answer:
        'One bag is taken as 50 kg. The IS 456:2000 dry-volume factor of 1.54 and a cement density of 1,440 kg/m³ are the basis of the per-m³ cement figures.',
    },
  ],
}

// ── 5. Concrete cube test ────────────────────────────────────────────────────
export const CUBE_CONTENT: CalcContent = {
  question: 'How many concrete cube samples are required for a pour?',
  quickAnswer:
    'IS 456:2000 Cl 15.2.2 sets minimum samples by volume: 1 for 1–5 m³, 2 for 6–15 m³, 3 for 16–30 m³ and 4 for 31–50 m³, then one more per further 50 m³. This tool casts 6 cubes a sample (3 for 7 days, 3 for 28 days), so 10 m³ needs 2 samples and 12 cubes.',
  source:
    'cube-test-engine.ts: samplesForVolume bands (1–5:1, 6–15:2, 16–30:3, 31–50:4), CUBES_PER_SAMPLE 6 (3 at 7 d, 3 at 28 d). calculate(10) = 2 samples/12 cubes; calculate(45) = 4/24. Above-50 m³ wording deliberately omits “or part thereof” — see verification note.',
  faq: [
    {
      question: 'How many samples and cubes does a 10 m³ pour need?',
      answer:
        '10 m³ falls in the 6–15 m³ band, so 2 samples. At 6 cubes a sample that is 12 cubes: 6 broken at 7 days and 6 at 28 days.',
    },
    {
      question: 'How many cubes does a 45 m³ pour need?',
      answer:
        '45 m³ falls in the 31–50 m³ band, so 4 samples and 24 cubes: 12 for the 7-day check and 12 for the 28-day acceptance test.',
    },
    {
      question: 'Why does each sample have 6 cubes?',
      answer:
        'The calculator casts 3 cubes for an early 7-day strength check and 3 cubes for the 28-day acceptance test. The 28-day result is the one used to accept or reject the concrete.',
    },
    {
      question: 'Is one sample per shift also required?',
      answer:
        'Yes. IS 456:2000 Cl 15.2.2 also asks for at least one sample from each shift of concreting, whatever the volume. The tool shows this as a reminder and does not add it to the volume-based count.',
    },
    {
      question: 'What is the sampling frequency in IS 456 for small pours?',
      answer:
        'Up to 5 m³ needs 1 sample, 6 to 15 m³ needs 2, 16 to 30 m³ needs 3 and 31 to 50 m³ needs 4. Above 50 m³ the count rises by one for each further 50 m³.',
    },
  ],
}

// ── 6. Daily-wage PF & ESI ───────────────────────────────────────────────────
export const WAGE_CONTENT: CalcContent = {
  question: 'How are PF and ESI calculated on a daily-wage worker’s pay?',
  quickAnswer:
    'Employee PF is 12% of basic earned, capped at ₹1,800 (12% of the ₹15,000 wage ceiling). Employee ESI is 0.75% of gross wages, and applies only while gross is ₹21,000 or less. Net pay = gross − PF − ESI − advance. At ₹900 a day for 23 days: basic ₹20,700, PF ₹1,800, ESI ₹155.25, net ₹18,744.75.',
  source:
    'wage-engine.ts constants PF_EMPLOYEE_RATE 0.12, PF_WAGE_CEILING 15000, ESI_EMPLOYEE_RATE 0.0075, ESI_WAGE_CEILING 21000, OVERTIME_MULTIPLIER 2, STANDARD_HOURS_PER_DAY 8. calculate() run: 900×23 → 20700/1800/155.25/18744.75; 650×20.5 → 13325/1599/99.94/11626.06; 800×26 + 8 h OT → gross 22400, ESI 0, net 20600. Statutory ceilings to be re-checked against current law.',
  faq: [
    {
      question: 'What is the PF cap for a daily-wage worker?',
      answer:
        'Employee PF is 12% of basic earned, capped at ₹1,800, which is 12% of the ₹15,000 EPF wage ceiling. A worker earning ₹20,700 in the period still pays only ₹1,800.',
    },
    {
      question: 'When does ESI stop applying?',
      answer:
        'Employee ESI is 0.75% of gross wages, and only while gross wages are ₹21,000 or less. Above that it is ₹0. For example ₹800 a day for 26 days plus 8 hours of overtime is ₹22,400 gross, so no ESI, and the net pay is ₹20,600.',
    },
    {
      question: 'How is overtime paid?',
      answer:
        'Overtime is paid at twice the ordinary hourly rate, where the hourly rate is the daily wage divided by 8. Overtime adds to gross wages, and so to the ESI base, but not to the PF base, which stays on basic earned.',
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
        'No. The calculator shows the worker’s own deductions on a site muster roll. It is a daily-wage model, not a monthly-CTC payroll tool.',
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

// ── 8. Finish-tier cost ──────────────────────────────────────────────────────
export const FINISH_CONTENT: CalcContent = {
  question: 'How much more does a Premium finish cost than a Standard finish per sq ft?',
  quickAnswer:
    'At the tool’s indicative Tier-2 city rates, the per-sq-ft build-up of structure, finishes and services is ₹1,197 for Basic, ₹1,490 for Standard, ₹1,983 for Premium and ₹2,935 for Luxury. Moving a 1,000 sq ft home from Standard to Premium adds ₹4,93,000. Flooring (+₹120/sq ft) is the biggest single step.',
  source:
    'finish-tier-engine.ts SQFT_ELEMENTS rate sums {Basic 1197, Standard 1490, Premium 1983, Luxury 2935}; calculate(1000 sqft, Standard→Premium) delta 493000; largest per-element step is flooring 160→280. Rates are labelled indicative Tier-2 city rates in the engine header.',
  faq: [
    {
      question: 'What does moving from Basic to Standard cost?',
      answer:
        'At the calculator’s rates it adds ₹293 per sq ft (₹1,197 to ₹1,490), which is ₹2,93,000 on 1,000 sq ft of built-up area.',
    },
    {
      question: 'What does moving from Standard to Premium cost?',
      answer:
        'It adds ₹493 per sq ft (₹1,490 to ₹1,983). On 2,400 sq ft that is ₹35,76,000 for Standard against ₹47,59,200 for Premium, a difference of ₹11,83,200.',
    },
    {
      question: 'Which element rises the most between Standard and Premium?',
      answer:
        'Flooring: ₹160 to ₹280 per sq ft, a ₹120 step. Doors and windows follow at +₹90 (₹120 to ₹210), then structure and masonry and plumbing at +₹70 each.',
    },
    {
      question: 'Which elements are in the per-sq-ft build-up?',
      answer:
        'Seven: structure and masonry, flooring, doors and windows, electrical, plumbing, painting, and false ceiling and joinery.',
    },
    {
      question: 'How is the kitchen priced?',
      answer:
        'Per running foot of counter and base run, kept separate from the per-sq-ft elements: ₹1,200 Basic, ₹2,200 Standard, ₹3,800 Premium and ₹7,500 Luxury per running foot.',
    },
    {
      question: 'Are these exact prices for my city?',
      answer:
        'No. They are indicative Tier-2 city rates taken from the Residential Construction Cost Estimator’s quality-tier sheet. Use them to see the shape of the difference between tiers, not to quote an exact price for your city or year.',
    },
  ],
}

// ── 9. RA bill ───────────────────────────────────────────────────────────────
export const RABILL_CONTENT: CalcContent = {
  question: 'How do you calculate the net payable on an RA bill?',
  quickAnswer:
    'Net payable = gross bill − retention − advance recovery + GST − TDS. With the defaults of 5% retention, 18% GST and 1% TDS on the value excluding GST, a ₹10,00,000 gross bill pays ₹11,20,000: retention ₹50,000, GST ₹1,80,000, TDS ₹10,000, and no advance recovery.',
  source:
    'ra-bill-engine.ts RA_BILL_DEFAULTS {retention 5, tds 1, gst 18, advance 0}; calculate(1,000,000) → retention 50000, gst 180000, tds 10000, net 1,120,000. Engine header reference: gross 178,824.5608 → net 173,459.82.',
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
        'Retention is a percentage of the gross bill value withheld from the contractor against defect liability. The calculator defaults to 5%. On a ₹10,00,000 bill that is ₹50,000.',
    },
    {
      question: 'Is TDS calculated on the bill with or without GST?',
      answer:
        'Without GST. The calculator applies the TDS percentage to the gross bill value, not to gross plus GST, following Section 393(1) of the Income-tax Act 2025, Table Sl. No. 6(i) for works payments.',
    },
    {
      question: 'What TDS rate does the calculator allow?',
      answer:
        'Between 1% and 2%, with 1% as the default.',
    },
    {
      question: 'How is advance recovery entered?',
      answer:
        'As a rupee amount, not a percentage. It is deducted from the bill and defaults to ₹0.',
    },
    {
      question: 'Is there a real-bill example?',
      answer:
        'Yes. A gross bill of ₹1,78,824.56 with 5% retention (₹8,941.23), 18% GST (₹32,188.42), 1% TDS (₹1,788.25) and an advance recovery of ₹26,823.68 gives a net payable of ₹1,73,459.82.',
    },
    {
      question: 'Does the calculator assume a reduced GST rate for residential work?',
      answer:
        'No. The default is 18%, and you can edit it. The tool does not suggest that a lower residential rate applies.',
    },
  ],
}

// ── 10. Wire size ────────────────────────────────────────────────────────────
export const WIRE_CONTENT: CalcContent = {
  question: 'What size wire is needed for each household circuit?',
  quickAnswer:
    'Minimum copper cross-sections under IS 732:2019 Cl 6.2: 1.5 mm² for lighting and fans, 2.5 mm² for power sockets, 4 mm² for an AC or geyser (2 kW and above), 6 mm² for a sub-panel feed and 10 mm² for the main incomer. Size follows the circuit’s role, not a guess at wattage.',
  source:
    'wire-size-engine.ts CIRCUIT_SPECS (imported from electropro-engine WIRE_SIZES): lighting 1.5, power 2.5, acGeyser 4.0, subPanel 6.0, mainIncomer 10.0; typicalMCB 6A/16A/20A/32A/32–63A; isCode IS 732:2019 Cl 6.2.',
  faq: [
    {
      question: 'What wire size is needed for a split AC?',
      answer:
        '4 mm² copper on its own dedicated circuit, with a typical 20 A MCB. The same applies to a geyser or any other dedicated 2 kW and above appliance.',
    },
    {
      question: 'Can I use 1.5 mm² wire for power sockets?',
      answer:
        'The tool’s minimum for sockets is 2.5 mm² on a 16 A MCB. A socket circuit wired in 1.5 mm² can overheat when a heater or iron is plugged in, and the insulation degrades inside the wall.',
    },
    {
      question: 'Which MCB goes with each wire size?',
      answer:
        'Typically 6 A for 1.5 mm² lighting, 16 A for 2.5 mm² sockets, 20 A for 4 mm² AC and geyser circuits, 32 A for a 6 mm² sub-panel feed, and a main MCB or MCCB of 32 A to 63 A for the 10 mm² incomer, depending on demand.',
    },
    {
      question: 'Why is wire sized by circuit and not by watts?',
      answer:
        'The code minimum for each circuit category already accounts for its typical load, grouping and protective device. Choosing by the role of the circuit is how the IS 732:2019 table is applied, so the tool does not convert watts to a gauge.',
    },
    {
      question: 'What size wire is needed from the meter to the main board?',
      answer:
        '10 mm² copper for the main incomer, the service cable from the meter or main switch into the main distribution board.',
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
  '/tools/finish-tier-cost-calculator': FINISH_CONTENT,
  '/tools/ra-bill-retention-tds-calculator': RABILL_CONTENT,
  '/tools/wire-size-calculator': WIRE_CONTENT,
}
