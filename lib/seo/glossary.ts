// Glossary of the construction terms used across NirmanShastra. Definitions state only
// what the tools and IS-code references on this site already say. Numbers quoted here
// come from the calculators' own engines; do not add figures that are not in them.

export interface GlossaryLink {
  label: string
  href: string
}

export interface GlossaryTerm {
  id: string
  term: string
  definition: string
  links: GlossaryLink[]
}

export interface GlossaryGroup {
  title: string
  intro: string
  terms: GlossaryTerm[]
}

export const GLOSSARY_UPDATED = '2026-10-23'

export const GLOSSARY: GlossaryGroup[] = [
  {
    title: "Concrete and IS codes",
    intro: "The vocabulary behind concrete quantities, grades and testing.",
    terms: [
      {
        id: "is-code",
        term: "IS code",
        definition:
          "A standard published by the Bureau of Indian Standards (BIS). Indian Standards set the methods, material properties and minimum requirements used in construction, such as IS 456:2000 for plain and reinforced concrete.",
        links: [{"label": "IS codes used on NirmanShastra", "href": "/is-codes-used"}],
      },
      {
        id: "rcc",
        term: "RCC (reinforced cement concrete)",
        definition:
          "Concrete cast around steel reinforcement bars. The concrete resists compression and the steel resists tension, so together they carry the loads in footings, columns, beams and slabs.",
        links: [],
      },
      {
        id: "concrete-grade",
        term: "Concrete grade (M20, M25)",
        definition:
          "A label for concrete strength. The number after M is the characteristic compressive strength in N/mm² at 28 days, measured on 150 mm cubes, so M20 means 20 N/mm².",
        links: [{"label": "M20 vs M25 concrete", "href": "/blog/m20-vs-m25-concrete-grade"}],
      },
      {
        id: "characteristic-strength",
        term: "Characteristic strength",
        definition:
          "The strength value below which not more than 5% of test results are expected to fall. It is the strength a concrete grade is named for.",
        links: [],
      },
      {
        id: "nominal-vs-design-mix",
        term: "Nominal mix and design mix",
        definition:
          "A nominal mix uses fixed proportions by volume, for example 1 : 1.5 : 3 for M20 in the Concrete Mix Ratio Calculator. A design mix is proportioned by trial batches to reach a target strength.",
        links: [{"label": "Concrete Mix Ratio Calculator", "href": "/tools/concrete-mix-ratio-calculator"}],
      },
      {
        id: "dry-volume-factor",
        term: "Dry volume factor (1.54)",
        definition:
          "Dry cement, sand and aggregate occupy more volume than the wet concrete they make. The Concrete Mix Ratio Calculator multiplies the wet volume by 1.54 to get the dry volume of materials.",
        links: [],
      },
      {
        id: "cube-test",
        term: "Cube test",
        definition:
          "A strength check in which 150 mm concrete cubes are cast from the pour and crushed, normally at 7 and 28 days. IS 456:2000 Cl 15.2.2 sets the minimum number of samples by volume; the Concrete Cube Test Calculator casts 6 cubes a sample, 3 for 7 days and 3 for 28 days.",
        links: [{"label": "Concrete Cube Test Calculator", "href": "/tools/concrete-cube-test-calculator"}],
      },
      {
        id: "curing",
        term: "Curing",
        definition:
          "Keeping freshly placed concrete damp so the cement keeps hydrating and the concrete gains strength. Poor curing lowers strength and cracks the surface.",
        links: [],
      },
      {
        id: "cover",
        term: "Cover",
        definition:
          "The distance from the surface of the reinforcement to the nearest concrete face. Cover protects the steel from corrosion and fire; the required value depends on the member and the exposure (IS 456:2000).",
        links: [],
      },
      {
        id: "exposure-class",
        term: "Exposure class",
        definition:
          "IS 456:2000 classes the environment a structure sits in as mild, moderate, severe, very severe or extreme, and sets minimum grade and cover for each. StructurePro derives it from the site condition you select.",
        links: [{"label": "StructurePro", "href": "/tools/structopro"}],
      },
    ],
  },
  {
    title: "Steel and reinforcement",
    intro: "Terms used when ordering, bending and checking rebar.",
    terms: [
      {
        id: "fe500",
        term: "Fe 500 and Fe 500D",
        definition:
          "Grades of reinforcement steel with a minimum yield strength of 500 N/mm² (IS 1786). The D marks a more ductile grade, which deforms more before it fails and suits seismic detailing.",
        links: [],
      },
      {
        id: "tmt-bar",
        term: "TMT bar",
        definition:
          "Thermo-mechanically treated bar: hot-rolled rebar that is quenched and self-tempered to give a hard outer layer and a softer, ductile core. It is the usual reinforcement in Indian houses.",
        links: [],
      },
      {
        id: "bar-unit-weight",
        term: "Unit weight of a bar",
        definition:
          "The weight of a round bar per metre, calculated as d² ÷ 162 kg with d in millimetres. A 12 mm bar weighs about 0.889 kg per metre.",
        links: [{"label": "Steel required per sq ft", "href": "/blog/steel-required-per-sq-ft"}],
      },
      {
        id: "bbs",
        term: "BBS (bar bending schedule)",
        definition:
          "A table listing each reinforcement bar by mark, diameter, shape, number, cutting length and weight. Contractors cut and bend bars from it, and it is the basis for checking steel quantity.",
        links: [{"label": "Bar Bending Schedule Calculator", "href": "/tools/bar-bending-schedule-calculator"}],
      },
      {
        id: "cutting-length",
        term: "Cutting length",
        definition:
          "The length of straight bar needed to form a bent shape: the outer dimensions, less the bend deductions, plus the hook allowances.",
        links: [],
      },
      {
        id: "hook-allowance",
        term: "Hook allowance",
        definition:
          "The extra bar length used to form a hook at the end of a bar. The Bar Bending Schedule Calculator uses the larger of 9d and 75 mm for each hook (IS 2502:1963).",
        links: [],
      },
      {
        id: "stirrup",
        term: "Stirrup",
        definition:
          "A closed loop of small-diameter bar that wraps the main bars of a beam or column. It resists shear and holds the cage in position; in seismic detailing it ends in a 135° hook.",
        links: [],
      },
      {
        id: "crank",
        term: "Crank",
        definition:
          "An offset bend in a bar, for example at 45°, that moves the bar up or down as it passes over a support.",
        links: [],
      },
      {
        id: "binding-wire",
        term: "Binding wire",
        definition:
          "Thin annealed wire used to tie bars together in the cage. StructurePro estimates 12 kg of binding wire per tonne of steel.",
        links: [],
      },
    ],
  },
  {
    title: "Structure and seismic design",
    intro: "Words used in structural estimates and earthquake design.",
    terms: [
      {
        id: "g-plus-n",
        term: "G+1, G+2 (floors)",
        definition:
          "Ground floor plus the number of upper floors. G+1 is a ground floor and one upper floor. In StructurePro the total built-up area is the ground-floor area multiplied by the number of floors plus one.",
        links: [{"label": "StructurePro", "href": "/tools/structopro"}],
      },
      {
        id: "foundation",
        term: "Footing, raft and pile",
        definition:
          "A footing spreads a column load over the soil. A raft is a single slab under the whole building, used when the soil is weak. A pile is a long shaft driven or bored deep to reach firmer strata. The soil and site conditions decide which is used.",
        links: [],
      },
      {
        id: "plinth-beam",
        term: "Plinth beam",
        definition:
          "A beam at plinth level that ties the columns together and supports the wall above it.",
        links: [],
      },
      {
        id: "column-beam-slab",
        term: "Column, beam and slab",
        definition:
          "A column carries load down to the foundation. A beam carries the slab load to the columns. A slab forms the floor or roof.",
        links: [],
      },
      {
        id: "seismic-zone",
        term: "Seismic zone and zone factor",
        definition:
          "IS 1893 divides India into seismic zones II to V by expected shaking, and gives each a zone factor Z that scales the earthquake force a building is designed for. Zone V is the most severe.",
        links: [{"label": "Seismic zones of India (IS 1893)", "href": "/blog/seismic-zones-india-is-1893"}],
      },
      {
        id: "ductile-detailing",
        term: "Ductile detailing",
        definition:
          "Reinforcement detailing that lets a member bend and deform without sudden failure in an earthquake, for example closely spaced stirrups with 135° hooks (IS 13920).",
        links: [],
      },
    ],
  },
  {
    title: "Masonry",
    intro: "Bricks, blocks and mortar.",
    terms: [
      {
        id: "modular-brick",
        term: "Modular brick",
        definition:
          "A clay brick of 190 × 90 × 90 mm which, with a 10 mm mortar joint, makes a nominal 200 × 100 × 100 mm unit (IS 1077:1992). A 9-inch wall takes about 100 per m² and a 4.5-inch wall about 50.",
        links: [{"label": "Bricks per sq ft", "href": "/blog/bricks-per-sq-ft"}, {"label": "Brick Calculator", "href": "/tools/brick-calculator"}],
      },
      {
        id: "fly-ash-brick",
        term: "Fly ash brick",
        definition:
          "A brick made from fly ash, a by-product of coal power plants, with cement or lime. MasonryPro prices fly ash walls in both modular and non-modular sizes.",
        links: [{"label": "MasonryPro", "href": "/tools/masonpro"}],
      },
      {
        id: "aac-block",
        term: "AAC block",
        definition:
          "Autoclaved aerated concrete block: a light, aerated concrete block laid with thin-bed adhesive instead of sand-cement mortar. A 200 mm AAC wall takes about 8.33 blocks per m² in MasonryPro.",
        links: [],
      },
      {
        id: "mortar",
        term: "Mortar",
        definition:
          "A paste of cement, sand and water that bonds bricks or blocks. Its mix is stated as a cement : sand ratio.",
        links: [],
      },
      {
        id: "partition-wall",
        term: "Partition wall",
        definition:
          "A non-load-bearing interior wall, often a 4.5-inch (115 mm) brick wall or a thin block wall, that divides rooms.",
        links: [],
      },
    ],
  },
  {
    title: "Water and electrical",
    intro: "Plumbing and wiring terms.",
    terms: [
      {
        id: "lpcd",
        term: "LPCD (litres per capita per day)",
        definition:
          "The water demand assumed for each person. NirmanShastra uses 135 LPCD for municipal supply and 150 for borewell (IS 1172:1993), and stores two-thirds (0.67) of one day’s demand.",
        links: [{"label": "Water Tank Size Calculator", "href": "/tools/water-tank-size-calculator"}],
      },
      {
        id: "wire-size",
        term: "Wire size (sqmm)",
        definition:
          "A conductor’s cross-section in mm², often written sqmm. IS 732:2019 Cl 6.2 minimums used in the Wire Size Calculator are 1.5 mm² for lighting, 2.5 for sockets, 4 for an AC or geyser, 6 for a sub-panel feed and 10 for the main incomer.",
        links: [{"label": "Wire Size Calculator", "href": "/tools/wire-size-calculator"}],
      },
      {
        id: "mcb-rccb",
        term: "MCB, RCCB and RCBO",
        definition:
          "An MCB trips on overload or short circuit. An RCCB trips on earth leakage, which protects people from shock. An RCBO does both in one device.",
        links: [{"label": "RCCB and electrical safety (IS 732:2019)", "href": "/blog/rccb-electrical-safety-is-732-2019"}],
      },
      {
        id: "earthing",
        term: "Earthing",
        definition:
          "Connecting the metal parts of an installation to the ground so that a fault current has a safe path and the protective device trips.",
        links: [],
      },
      {
        id: "distribution-board",
        term: "Distribution board (DB)",
        definition:
          "The panel that holds the MCBs and RCCBs and splits the incoming supply into separate circuits.",
        links: [],
      },
    ],
  },
  {
    title: "Cost and contracts",
    intro: "Terms that decide what you pay and how a quote is built.",
    terms: [
      {
        id: "boq",
        term: "BOQ (Bill of Quantities)",
        definition:
          "An itemised list of the work giving each item’s description, quantity, unit, rate and amount. A BOQ lets you compare two quotes line by line and check each quantity against IS-code norms.",
        links: [{"label": "How to check a contractor’s quote", "href": "/blog/how-to-check-contractor-quote"}, {"label": "Compare a contractor’s quote", "href": "/compare-quote"}],
      },
      {
        id: "per-sq-ft-rate",
        term: "Per-sq-ft rate",
        definition:
          "Total cost divided by built-up area. It is a quick benchmark but hides what is included and what is not, so ask for a BOQ before comparing two rates.",
        links: [{"label": "Why per-sq-ft pricing hides fraud", "href": "/blog/per-sqft-pricing-contractor-fraud"}],
      },
      {
        id: "built-up-area",
        term: "Built-up area",
        definition:
          "Covered floor area including the thickness of walls, added up across all floors. The thumb-rule quantities on NirmanShastra are per sq ft of built-up area across all floors, not plot area.",
        links: [],
      },
      {
        id: "thumb-rule",
        term: "Thumb rule",
        definition:
          "A quick approximation from experience, such as 0.4 bag of cement and 4 kg of steel per sq ft of built-up area for G+1 to G+3 houses in M20 concrete, as used in StructurePro. Thumb rules are for planning, not a structural design.",
        links: [{"label": "Cement, sand and aggregate for 1,000 sq ft", "href": "/blog/cement-sand-aggregate-for-1000-sq-ft-house"}],
      },
      {
        id: "wastage",
        term: "Wastage",
        definition:
          "Material lost to breakage, cutting, spillage and over-ordering. The Brick Calculator shows counts with 5% and 10% wastage added.",
        links: [],
      },
      {
        id: "quality-tier",
        term: "Quality tier",
        definition:
          "A level of finish. The Finish-Tier Cost Calculator prices a house at four tiers, Basic, Standard, Premium and Luxury, using indicative per-sq-ft rates for seven elements.",
        links: [{"label": "Construction cost per sq ft in India", "href": "/blog/construction-cost-per-sq-ft-india"}, {"label": "Finish-Tier Cost Calculator", "href": "/tools/finish-tier-cost-calculator"}],
      },
      {
        id: "ra-bill",
        term: "RA bill (Running Account bill)",
        definition:
          "An interim bill for work done up to a date. In the RA Bill Calculator, net payable = gross bill − retention − advance recovery + GST − TDS.",
        links: [{"label": "RA Bill Calculator", "href": "/tools/ra-bill-retention-tds-calculator"}],
      },
      {
        id: "retention-money",
        term: "Retention money",
        definition:
          "A percentage of each bill withheld from the contractor until the defect liability period ends, as security for rectifying defects. The RA Bill Calculator defaults to 5%.",
        links: [],
      },
      {
        id: "advance-recovery",
        term: "Advance recovery",
        definition:
          "Recovery of an advance, such as a mobilisation advance, paid earlier. It is deducted from later running bills until it is cleared.",
        links: [],
      },
      {
        id: "tds",
        term: "TDS (tax deducted at source)",
        definition:
          "Tax that the payer holds back from a contract payment and deposits with the tax department. The RA Bill Calculator defaults to 1% on the bill value excluding GST. The rate that applies to you depends on the payee and the contract, so confirm it with a tax professional.",
        links: [],
      },
      {
        id: "gst",
        term: "GST (Goods and Services Tax)",
        definition:
          "Tax charged on the contract bill. The RA Bill Calculator defaults to 18%. The rate for your contract depends on the type of work, so confirm it with a tax professional.",
        links: [],
      },
    ],
  },
  {
    title: "Project control and labour",
    intro: "Tracking progress and paying workers.",
    terms: [
      {
        id: "earned-value",
        term: "Earned value (PV, EV, AC, BAC, SPI, CPI, EAC)",
        definition:
          "A project-control method. PV is planned value, EV earned value, AC actual cost and BAC the budget at completion. SPI = EV ÷ PV and CPI = EV ÷ AC; below 1 means behind schedule or over cost. The forecast final cost is EAC = BAC ÷ CPI.",
        links: [{"label": "Earned Value Calculator", "href": "/tools/earned-value-calculator"}],
      },
      {
        id: "pf-esi",
        term: "PF and ESI",
        definition:
          "Provident fund (PF) and employee state insurance (ESI) are statutory deductions from a worker’s wages. In the Daily Wage Calculator, net payable = gross wages − employee PF − employee ESI − advance recovered.",
        links: [{"label": "Daily Wage, PF and ESI Calculator", "href": "/tools/daily-wage-pf-esi-calculator"}],
      },
    ],
  },
  {
    title: "Vastu",
    intro: "Terms used by VastuPro.",
    terms: [
      {
        id: "vastu-purusha-mandala",
        term: "Vastu Purusha Mandala",
        definition:
          "A grid diagram in Vastu Shastra that divides a site into zones, each tied to a direction and a use. VastuPro works with a 16-zone model.",
        links: [{"label": "Vastu and Vedic architecture: the 16 zones", "href": "/blog/vastu-vedic-architecture-16-zones"}],
      },
      {
        id: "brahmasthan",
        term: "Brahmasthan",
        definition:
          "The central zone of a plot or house in Vastu Shastra, traditionally kept open. VastuPro measures directions from the Brahmasthan at the centre of the house.",
        links: [],
      },
    ],
  },
]

export const GLOSSARY_TERM_COUNT = GLOSSARY.reduce((n, g) => n + g.terms.length, 0)
