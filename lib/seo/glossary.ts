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

export const GLOSSARY_UPDATED = '2026-10-25'

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
          "A nominal mix uses fixed proportions by volume, for example 1 : 1.5 : 3 for M20, and IS 456:2000 allows it only up to M20. A design mix is proportioned from trial batches to reach a target strength, and is what M25 and above need.",
        links: [{"label": "Concrete Mix Calculator", "href": "/tools/concrete-mix-ratio-calculator"}],
      },
      {
        id: "dry-volume-factor",
        term: "Dry volume factor (1.54)",
        definition:
          "Dry cement, sand and aggregate occupy more volume than the wet concrete they make, about 1.54 times as much. The CPWD per-cubic-metre quantities in the Concrete Mix Calculator already carry that allowance.",
        links: [],
      },
      {
        id: "cube-test",
        term: "Cube test",
        definition:
          "A strength check in which 150 mm concrete cubes are cast from the pour and crushed, normally at 7 and 28 days. IS 456:2000 clause 15.2.2 sets the minimum number of samples by volume for each grade, and clause 15.3 asks for three cubes a sample tested at 28 days; the Concrete Cube Test Calculator counts both.",
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
        links: [{"label": "Bar Bending Calculator", "href": "/tools/bar-bending-schedule-calculator"}],
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
          "The extra bar length used to form a hook at the end of a bar. For a stirrup with 135° hooks the tail is 10d, and never under 75 mm (IS 13920); the Bar Bending Schedule Calculator adds it and takes the corners and bends back off.",
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
          "Thin annealed wire used to tie bars together in the cage. StructurePro counts 9 kg of binding wire per tonne of steel, a figure worked out from the CPWD cost lines.",
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
          "Ground floor plus the number of upper floors. G+1 is a ground floor and one upper floor; G+2 is a ground floor and two.",
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
        id: "stilt-floor",
        term: "Stilt floor (open parking storey)",
        definition:
          "A ground storey left open for parking, with columns and no walls. It is the weak level in an earthquake, so its columns and beams are designed for a larger force. StructurePro applies 2.5 times the storey force (IS 1893 (Part 1):2002 cl 7.10.3(a)), and its report notes that the 2016 edition asks an engineer for a dynamic analysis.",
        links: [{"label": "StructurePro", "href": "/tools/structopro"}],
      },
      {
        id: "basic-wind-speed",
        term: "Basic wind speed",
        definition:
          "The gust speed, in metres a second, that a place is designed for, taken at 10 m height over open ground (IS 875 (Part 3)). StructurePro reads it for your city, turns it into a design speed for each storey height, and compares the wind force with the earthquake force. The frame is designed for the larger of the two, never both added.",
        links: [],
      },
      {
        id: "cantilever-balcony",
        term: "Cantilever balcony",
        definition:
          "A balcony slab held at one edge that projects beyond its supporting beam. Nothing holds the far edge, so its main steel sits near the top face at the support. StructurePro designs each balcony as a cantilever slab; the twisting of the supporting beam is not designed.",
        links: [],
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
          "A clay brick of 190 × 90 × 90 mm which, with a 10 mm mortar joint, makes a nominal 200 × 100 × 100 mm unit (IS 1077:1992). A wall one brick thick (about 200 mm) takes about 100 per m² and a half-brick wall (about 100 mm) about 50.",
        links: [{"label": "Bricks per sq ft", "href": "/blog/bricks-per-sq-ft"}, {"label": "Brick Calculator", "href": "/tools/brick-calculator"}],
      },
      {
        id: "fly-ash-brick",
        term: "Fly ash brick",
        definition:
          "A brick made from fly ash, a by-product of coal power plants, with cement or lime. MasonryPro counts fly ash walls in the 230 × 110 × 70 mm size of IS 12894:2002.",
        links: [{"label": "MasonryPro", "href": "/tools/masonpro"}],
      },
      {
        id: "aac-block",
        term: "AAC block",
        definition:
          "Autoclaved aerated concrete block: a light, aerated concrete block laid with thin-bed adhesive instead of sand-cement mortar. A block with a 600 × 200 mm face takes a little over 8 blocks for each square metre of wall.",
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
          "The water demand assumed for each person. NirmanShastra uses 135 LPCD for piped supply (IS 1172:1993, flushing toilets) and 150 for a house on its own borewell. The free Water Tank Size Calculator and the PlumbingPro report both size an underground and an overhead tank to the NBC split.",
        links: [{"label": "Water Tank Size Calculator", "href": "/tools/water-tank-size-calculator"}],
      },
      {
        id: "wire-size",
        term: "Wire size (sqmm)",
        definition:
          "A conductor’s cross-section in mm², often written sqmm. The Wire Size Calculator gives the least copper size from the CPWD specification and the BIS draft of IS 4648: 1.5 mm² for lights and fans, 2.5 for sockets and for a geyser on its own circuit, 4 for an air conditioner, and 4, 6 or 10 for the supply from the meter, by load.",
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
          "Covered floor area including the thickness of walls, added up across all floors. It is not the plot area. Per-sq-ft benchmarks use it, so check which area a figure is divided by.",
        links: [],
      },
      {
        id: "thumb-rule",
        term: "Thumb rule",
        definition:
          "A quick approximation from experience, such as a quantity of steel or cement for each square foot of built-up area. It is good for a first look and says nothing about your own design. NirmanShastra reports do not use thumb rules: they count from the layout, the earthquake zone and the loads.",
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
        id: "quantity-range",
        term: "Quantity range",
        definition:
          "The low-to-high range shown beside each quantity in a report. It exists because a few answers cannot fix every dimension of a building, and because real buildings use more than a code minimum. It states how sure the model is; it is not a tolerance on the figure.",
        links: [],
      },
      {
        id: "quality-tier",
        term: "Quality tier",
        definition:
          "A level of finish, such as an Economy, Standard or Premium paint system, a larger floor tile or a false ceiling. The level decides which finishing materials are counted and so how much of each you need.",
        links: [{"label": "InteriorPro", "href": "/tools/interiorpro"}, {"label": "Paint and Tile Calculator", "href": "/tools/paint-tile-calculator"}],
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
          "A grid diagram in Vastu Shastra that stands for the plot: 64 or 81 squares, each held by a guardian, with 32 positions on the boundary. VastuPro shows 16 compass zones for rooms, which is a modern convention, and reads the main door by the 32 old positions.",
        links: [{"label": "Vastu and Vedic architecture: the 16 zones", "href": "/blog/vastu-vedic-architecture-16-zones"}],
      },
      {
        id: "brahmasthan",
        term: "Brahmasthan",
        definition:
          "The central part of a plot or house in Vastu Shastra, traditionally kept open and clean, with no door facing it. VastuPro measures it as the middle ninth of the smallest rectangle that holds your outline.",
        links: [],
      },
    ],
  },
]

export const GLOSSARY_TERM_COUNT = GLOSSARY.reduce((n, g) => n + g.terms.length, 0)
