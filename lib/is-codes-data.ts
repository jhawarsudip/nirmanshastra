// IS-code reference data — single source for app/is-codes-used/page.tsx, the
// ItemList JSON-LD and /llms-full.txt. Content is unchanged from the original
// inline array; only the types and the export were added.

export interface CodeEntry {
  code: string
  title: string
  governs: string
}

export interface CodeGroup {
  tool: string
  phase: string
  desc: string
  codes: CodeEntry[]
}

export const CODES_BY_TOOL: CodeGroup[] = [
  {
    tool: 'StructurePro',
    phase: 'P1',
    desc: 'RCC Structure Cost Estimator',
    codes: [
      {
        code: 'IS 456:2000',
        title: 'Plain and Reinforced Concrete — Code of Practice',
        governs: 'Concrete mix ratios, minimum grades by exposure class, cover requirements, dry volume factors, and all RCC member design minimums used in structural estimation.',
      },
      {
        code: 'IS 1786:2008',
        title: 'High Strength Deformed Steel Bars and Wires for Concrete Reinforcement — Specification',
        governs: 'Steel grades (Fe415, Fe500, Fe500D, Fe550D), yield strength, elongation requirements, and density used for reinforcement quantity calculations.',
      },
      {
        code: 'IS 1893:2016',
        title: 'Criteria for Earthquake Resistant Design of Structures (Part 1: General Provisions and Buildings)',
        governs: 'Seismic zone classification (II–V) and Z factors applied to determine minimum steel grade, tie/stirrup spacing, and foundation type recommendations.',
      },
      {
        code: 'IS 13920:2016',
        title: 'Ductile Design and Detailing of Reinforced Concrete Structures subjected to Seismic Forces — Code of Practice',
        governs: 'Seismic detailing requirements: maximum column tie spacing at hinge zones, beam stirrup spacing near supports, and ductility requirements for Zone III–V.',
      },
      {
        code: 'IS 1904:2016',
        title: 'Design and Construction of Foundations in Soils — General Requirements',
        governs: 'Minimum foundation depth (500mm), bearing capacity by soil type, and foundation type selection logic (isolated, strip, raft, pile) based on site conditions.',
      },
      {
        code: 'IS 2911:2010',
        title: 'Design and Construction of Pile Foundations',
        governs: 'Pile foundation parameters used in StructurePro for marshy and black cotton soil conditions.',
      },
      {
        code: 'IS 875:2015',
        title: 'Code of Practice for Design Loads (Other than Earthquake) for Buildings and Structures',
        governs: 'Live load values: 2 kN/m² for residential floors, 1.5 kN/m² for roofs, 3 kN/m² for stairs — used in structural estimation.',
      },
      {
        code: 'IS 269:2015',
        title: 'Ordinary Portland Cement — Specification',
        governs: 'OPC 53 grade cement specification referenced in material schedules.',
      },
      {
        code: 'IS 383:2016',
        title: 'Coarse and Fine Aggregate for Concrete — Specification',
        governs: 'Aggregate grading and quality requirements referenced in material schedules and BOQ notes.',
      },
    ],
  },
  {
    tool: 'MasonryPro',
    phase: 'P2',
    desc: 'Masonry Cost Estimator',
    codes: [
      {
        code: 'IS 1077:1992',
        title: 'Common Burnt Clay Building Bricks — Specification',
        governs: 'Modular brick dimensions (190×90×90mm) and properties used for brick quantity calculation in 9" and 4.5" walls.',
      },
      {
        code: 'IS 12894:2002',
        title: 'Pulverised Fuel Ash — Lime Bricks — Specification',
        governs: 'Fly ash brick (modular and non-modular) dimensions and properties used in wall type comparisons.',
      },
      {
        code: 'IS 2185:2005',
        title: 'Concrete Masonry Units — Specification',
        governs: 'Hollow and solid concrete block (200mm, 100mm) dimensions and strength requirements used in block masonry calculations.',
      },
      {
        code: 'IS 2212:1991',
        title: 'Code of Practice for Brickwork',
        governs: 'Bonding patterns (English bond for 9" walls, stretcher bond for 4.5"), mortar joint thickness (10mm), minimum brick soaking time (2 hours), and 7-day curing requirement.',
      },
      {
        code: 'IS 1661:1972',
        title: 'Code of Practice for Application of Cement and Cement Lime Plaster Finishes',
        governs: 'Plaster thickness standards: 12mm internal, 15mm external, 6mm ceiling — and cement/sand ratios per coat used in plaster BOQ.',
      },
      {
        code: 'IS 2645:2003',
        title: 'Integral Waterproofing Compounds for Cement Mortar and Concrete — Specification',
        governs: 'Waterproofing method specifications referenced in terrace and bathroom waterproofing BOQ sections.',
      },
      {
        code: 'IS 4326:1993',
        title: 'Earthquake Resistant Design and Construction of Buildings — Code of Practice',
        governs: 'Seismic band requirements (plinth, sill, lintel, roof bands — 75mm thick, 2×8mm bars) mandatory in Zone III–V; AAC block restriction as load-bearing masonry in Zone IV–V.',
      },
      {
        code: 'IS 2250:1981',
        title: 'Code of Practice for Preparation and Use of Masonry Mortars',
        governs: 'Mortar grades (M1 to M5), mix ratios (1:3 to 1:8), and minimum mortar grade for load-bearing masonry.',
      },
      {
        code: 'IS 2547:1976',
        title: 'Gypsum Plaster Products — Specification',
        governs: 'Gypsum plaster specification and no-water-curing property referenced in interior plaster options.',
      },
    ],
  },
  {
    tool: 'ElectricalPro',
    phase: 'P3',
    desc: 'Electrical Cost Estimator',
    codes: [
      {
        code: 'IS 732:2019',
        title: 'Electrical Installations of Buildings — Code of Practice',
        governs: 'Minimum wire sizes by circuit type (1.5 sqmm lighting, 2.5 sqmm power, 4.0 sqmm AC/geyser, 6.0 sqmm sub-panel, 10.0 sqmm incomer), circuit load maximums (800W lighting, 3,000W power), and wiring wastage factor (1.15).',
      },
      {
        code: 'IS 694:2010',
        title: 'PVC Insulated Cables for Working Voltages up to and including 1100V — Specification',
        governs: 'PVC insulated cable properties referenced in wire schedule and material BOQ.',
      },
      {
        code: 'IS 8828:2007',
        title: 'Electrical Accessories — Circuit Breakers for Overcurrent Protection for Household and Similar Uses — Specification',
        governs: 'MCB ratings and specifications referenced in DB panel schedule and material selection.',
      },
      {
        code: 'IS 3043:2018',
        title: 'Code of Practice for Earthing',
        governs: 'Maximum earthing resistance (1 ohm), RCCB 30mA requirement for bathrooms, and earthing pit specifications referenced in electrical BOQ.',
      },
    ],
  },
  {
    tool: 'PlumbingPro',
    phase: 'P4',
    desc: 'Plumbing Cost Estimator',
    codes: [
      {
        code: 'IS 1172:1993',
        title: 'Code of Basic Requirements for Water Supply, Drainage and Sanitation',
        governs: 'Water demand rates (135 LPCD municipal, 150 LPCD borewell), tank sizing formula (daily demand × 0.67), and minimum fixture requirements — the basis of PlumbingPro\'s free water demand calculator.',
      },
      {
        code: 'IS 1742:1983',
        title: 'Code of Practice for Building Drainage',
        governs: 'Minimum pipe slopes (1:48 for 75mm waste, 1:80 for 110mm soil stack), pipe diameter requirements (75mm waste, 110mm WC soil stack), and drainage layout principles.',
      },
    ],
  },
  {
    tool: 'InteriorPro',
    phase: 'P5',
    desc: 'Interior Cost Estimator',
    codes: [
      {
        code: 'IS 2547:1976',
        title: 'Gypsum Plaster Products — Specification',
        governs: 'Gypsum board and plaster specifications referenced in false ceiling and gypsum finish options.',
      },
    ],
  },
  {
    tool: 'VastuPro',
    phase: 'P0',
    desc: 'Vastu Compliance Analyser (Free)',
    codes: [
      {
        code: 'IS 4326:1993',
        title: 'Earthquake Resistant Design and Construction of Buildings — Code of Practice',
        governs: 'Seismic zone warnings shown when a structural wall is proposed in a direction that conflicts with seismic band requirements; referenced in structural remedies for load-bearing configurations.',
      },
    ],
  },
  {
    tool: 'All Tools',
    phase: '',
    desc: 'National Building Code — cross-tool',
    codes: [
      {
        code: 'NBC 2016',
        title: 'National Building Code of India 2016',
        governs: 'Minimum room dimensions (living/bedroom 9.5 sqm, kitchen 4.5 sqm, bathroom 1.2 sqm), minimum floor height (2.75m), staircase width (900mm), riser/tread requirements (max 190mm riser, min 250mm tread) — referenced across all tools.',
      },
    ],
  },
]
