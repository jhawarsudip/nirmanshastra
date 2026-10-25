// IS-code reference data: single source for app/is-codes-used/page.tsx, the ItemList JSON-LD and /llms-full.txt.
//
// Rebuilt from what the quantity models actually cite (lib/structopro-qty, lib/qty/*), not from the earlier rupee-based tools.
// Rules for this file:
//  - list a standard only if a model or a report check cites it;
//  - give the edition the model uses. Where a newer edition exists and the model uses the older text, say so;
//  - "governs" says what NirmanShastra takes from the document, in plain words, and does not quote it;
//  - "caveat" is set where a model says it could not read the document in full, or treats the figure as an assumption.
// Entries whose code does not start with IS are other sources (SP handbooks, CPWD, NBC, a published study), listed so nothing is hidden.

export interface CodeEntry {
  code: string
  title: string
  governs: string
  /** set where the model could not read the document in full, or the figure taken from it is an assumption */
  caveat?: string
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
    desc: 'RCC frame quantities',
    codes: [
      {
        code: 'IS 456:2000',
        title: 'Plain and Reinforced Concrete: Code of Practice',
        governs:
          'Minimum concrete grade and cement content for the exposure (cl 6.1, Table 5), cover (cl 26.4, Table 16), limit-state sizing of columns, beams and slabs, shear (cl 40), minimum and maximum steel, bond, lap and anchorage lengths (cl 26.2), stirrup and tie rules (cl 26.5), column slenderness and biaxial bending (cl 25.4, 39), and the footing rules (cl 34).',
      },
      {
        code: 'IS 1786:2008',
        title: 'High Strength Deformed Steel Bars and Wires for Concrete Reinforcement: Specification',
        governs:
          'The bar weight per metre (diameter squared over 162.2) that turns bar length into kilograms. The model takes Fe500D as the bar the market supplies; IS 13920 asks for ductile steel in Zone III and above.',
        caveat: 'The Fe500D choice is an assumption about what is sold, not a requirement of the standard in Zone II.',
      },
      {
        code: 'IS 1893 (Part 1):2002',
        title: 'Criteria for Earthquake Resistant Design of Structures: General Provisions and Buildings (fifth revision)',
        governs:
          'The town table of earthquake zones (Annex E), the earthquake force on each storey, and clause 7.10.3(a): columns and beams of an open first storey (parking underneath) are designed for 2.5 times the storey shear and moment, which the model applies to a stilt.',
      },
      {
        code: 'IS 1893 (Part 1):2016',
        title: 'Criteria for Earthquake Resistant Design of Structures: General Provisions and Buildings (sixth revision)',
        governs:
          'The edition in force. Its zone map differs from the 2002 table for some towns, so every report asks you to confirm the zone with a local structural engineer. The report also states that this edition treats an open storey as an irregularity that needs a dynamic analysis by an engineer.',
        caveat: 'The zone is read from the 2002 town table; the 2016 wording on open storeys is noted in the report but not applied as a factor.',
      },
      {
        code: 'IS 13920:2016',
        title: 'Ductile Design and Detailing of Reinforced Concrete Structures Subjected to Seismic Forces: Code of Practice',
        governs:
          'For Zone III and above: closer stirrups and confining ties at member ends and over the full height of an open storey, capacity-based design shear for beams, the strong-column weak-beam check (column moments at least 1.1 times the beam moments), and stirrup and tie hooks with a tail of 10 bar diameters, not less than 75 mm. Zone II is detailed to IS 456, with 6 mm coil bars allowed for links and ties.',
      },
      {
        code: 'IS 875 (Part 1):1987',
        title: 'Code of Practice for Design Loads (Other than Earthquake) for Buildings and Structures: Dead Loads',
        governs: 'Unit weights of concrete, masonry and finishes used in the dead load on each floor.',
      },
      {
        code: 'IS 875 (Part 2):1987',
        title: 'Code of Practice for Design Loads (Other than Earthquake) for Buildings and Structures: Imposed Loads',
        governs: 'Live loads on residential floors, terraces, balconies and stairs.',
      },
      {
        code: 'IS 875 (Part 3):1987',
        title: 'Code of Practice for Design Loads (Other than Earthquake) for Buildings and Structures: Wind Loads',
        governs:
          'Design wind speed (basic speed times the height, terrain and topography factors), the wind pressure, and the wind force on the frame. At each storey the frame is designed for the larger of the earthquake and wind forces, never both added. The 1987 text is used; the 2015 revision of this part is not applied.',
        caveat:
          'The basic wind speed for each city is read from a secondary table, the pressure coefficients are reconstructed, and the terrain is assumed open (category 2). Wind rarely governs a low-rise house.',
      },
      {
        code: 'IS 1904:1986',
        title: 'Code of Practice for Design and Construction of Foundations in Soils: General Requirements',
        governs: 'Separate footings, or a raft where the ground is weak, chosen by the safe bearing capacity you give.',
      },
      {
        code: 'IS 10262:2009',
        title: 'Concrete Mix Proportioning: Guidelines',
        governs: 'The absolute-volume method that gives cement, sand and aggregate for each cubic metre of concrete richer than M20.',
      },
      {
        code: 'IS 2502:1963',
        title: 'Code of Practice for Bending and Fixing of Bars for Concrete Reinforcement',
        governs: 'Cut lengths of stirrups, ties and bent bars, each rounded up to the next 25 mm (cl 5.1.1).',
      },
      {
        code: 'SP 34:1987',
        title: 'Handbook on Concrete Reinforcement and Detailing',
        governs: 'Detailing practice, including the minimum beam cover of 25 mm (cl 4.1(c)).',
      },
      {
        code: 'SP 24:1983',
        title: 'Explanatory Handbook on IS 456:1978',
        governs: 'The formula behind the design shear strength of concrete (the values of IS 456 Table 19).',
      },
      {
        code: 'CPWD Delhi Analysis of Rates 2014, Volume 1',
        title: 'Central Public Works Department, Delhi Schedule of Rates: Analysis of Rates',
        governs:
          'Cement, sand and aggregate for each cubic metre of the nominal mixes M20 and below (items 4.1.2 to 4.1.8), and 5% wastage on reinforcement (item 5.22.1, which also buys 12 m bars). Binding wire is derived from the CPWD cost lines.',
      },
      {
        code: 'GKSPL, March 2026',
        title: 'Building the Baseline: Embodied Carbon in India’s Urban Housing, v1 (as reported by Conserve Consultants, 29 April 2026)',
        governs:
          'Not a standard. Steel and concrete per square metre from the Bills of Quantities of 26 residential buildings completed since 2020, shown beside your report as a range for orientation, never as a prediction for one house.',
        caveat: 'The study does not publish its sample size per class or say whether its concrete includes lean concrete and basements.',
      },
    ],
  },
  {
    tool: 'MasonryPro',
    phase: 'P2',
    desc: 'Walls, plaster and lintel quantities',
    codes: [
      {
        code: 'IS 1077:1992',
        title: 'Common Burnt Clay Building Bricks: Specification',
        governs: 'The modular brick size (190 × 90 × 90 mm), which sets how many bricks a wall takes.',
      },
      {
        code: 'IS 12894:2002',
        title: 'Pulverized Fuel Ash-Lime Bricks: Specification',
        governs: 'The fly-ash brick size (230 × 110 × 70 mm).',
      },
      {
        code: 'IS 2185 (Part 1 to 3)',
        title: 'Concrete Masonry Units: Hollow and Solid Concrete Blocks; Autoclaved Cellular Aerated Concrete Blocks',
        governs: 'Block face sizes (400 × 200 mm for concrete blocks, 600 × 200 mm for AAC) and the rule that the nominal size includes the joint, so the block itself is 10 mm short.',
      },
      {
        code: 'IS 2212:1991',
        title: 'Code of Practice for Brickwork',
        governs: 'Joint thickness, up to 12 mm (cl 6.4.1), which sets the mortar in a wall.',
      },
      {
        code: 'IS 2572:2005',
        title: 'Construction of Hollow Concrete Block Masonry: Code of Practice',
        governs: 'The 10 mm joint, panel size limits and the inside plaster thickness for concrete block walls.',
      },
      {
        code: 'IS 6041:1985',
        title: 'Construction of Autoclaved Cellular Concrete Block Masonry: Code of Practice',
        governs: 'The thin-bed joint, panel size, parapet height and plaster thickness for AAC walls, including the 15 mm backing coat where rain is heavy.',
      },
      {
        code: 'IS 2250:1981',
        title: 'Code of Practice for Preparation and Use of Masonry Mortars',
        governs: 'The richer mortar (1:4) for a parapet taller than three times its thickness.',
        caveat: 'The standard’s own table of mixes could not be read, so the other ratios follow IS 4326 and CPWD practice.',
      },
      {
        code: 'IS 1905:1987',
        title: 'Code of Practice for Structural Safety of Buildings: Masonry Walls',
        governs: 'The lintel bearing (at least 9 cm or span divided by 10, cl 5.3.3) and the height against thickness of an inner wall (Appendix D).',
      },
      {
        code: 'IS 4326:1993',
        title: 'Earthquake Resistant Design and Construction of Buildings: Code of Practice',
        governs: 'Panel size limits, the mortar mix, and the advice that walls be tied to the frame (cl 8.2.6). Dowel bars and horizontal bands in tall walls are left to your engineer and are not counted.',
      },
      {
        code: 'IS 2402:1963',
        title: 'Code of Practice for External Rendered Finishes',
        governs: 'External plaster in two coats within the limits of the standard (undercoat up to 12 mm, finish 3 to 8 mm). A single 20 mm coat is flagged as above its limit.',
      },
      {
        code: 'IS 3362:1977',
        title: 'Code of Practice for Natural Ventilation of Residential Buildings',
        governs: 'Cited in the report’s source list for opening sizes.',
        caveat: 'The model cites it but does not read a quantity from it.',
      },
      {
        code: 'IS 1200 (Part 3):1976 and (Part 12):1976',
        title: 'Method of Measurement of Building and Civil Engineering Works: Brickwork; Plastering and Pointing',
        governs: 'How walls and plaster are measured and how openings are deducted, so the count follows the way a bill of quantities is measured.',
      },
      {
        code: 'CPWD Delhi Analysis of Rates 2014, Volumes 1 and 2',
        title: 'Central Public Works Department, Delhi Schedule of Rates: Analysis of Rates',
        governs: 'The M20 mix (item 4.1.2) for lintels, and the mortar for each square metre of plaster (sub-head 13). Cement for each mortar mix is calibrated to the CPWD yield of 513 kg a cubic metre for 1:3.',
      },
    ],
  },
  {
    tool: 'ElectricalPro',
    phase: 'P3',
    desc: 'Wiring and circuit quantities',
    codes: [
      {
        code: 'IS 4648 (BIS draft first revision, ETD 20, September 2024)',
        title: 'Guide for Electrical Layout in Residential Buildings (draft revision of IS 4648:1968)',
        governs:
          'For the Standard level: points for each type of room, connected load per point (Table 5), appliance loads (Table 6), wire sizes (Table 4), lighting and power circuit limits (cl 6.2), the 30 mA residual current breaker (cl 6.2.9) and earthing (cl 8).',
        caveat: 'A published draft, not a final standard. The report says so.',
      },
      {
        code: 'IS 4648:1968',
        title: 'Guide for Electrical Layout in Residential Buildings',
        governs: 'For the Basic level: the socket schedule for each room (cl 9.8; where it gives two to three, the larger is used) and the lighting circuit rule (cl 7.2).',
      },
      {
        code: 'IS 732:1989',
        title: 'Code of Practice for Electrical Wiring Installations',
        governs: 'The residual current breaker on every board (cl 5.1.3.1). A later revision (2019) exists; the model reads the 1989 text.',
      },
      {
        code: 'IS 3043:2018',
        title: 'Code of Practice for Earthing',
        governs: 'The earthing set (electrode and earth wire) counted for the building.',
        caveat: 'Not read in full. The earthing counts are assumptions and your electrician must measure the earth resistance.',
      },
      {
        code: 'IS 2309:1989',
        title: 'Protection of Buildings and Allied Structures against Lightning: Code of Practice',
        governs: 'Named in the list of what is not included: lightning protection and surge protection devices are not counted.',
      },
      {
        code: 'CPWD General Specifications for Electrical Works, Part I (Internal), 2013',
        title: 'Central Public Works Department, Sections 2 and 3',
        governs: 'What a point is (the whole wire run from switch to outlet, GS 3.4), circuit limits (GS 3.10) and wire sizes (GS 3.12). Where the draft and CPWD differ, the report says which it followed; for sockets it follows the draft’s 2.5 mm² and not the 4 mm² of CPWD.',
      },
      {
        code: 'CPWD Delhi Analysis of Rates for Electrical Works (E&M) 2016, items 1.1 to 1.17',
        title: 'Central Public Works Department',
        governs: 'The wire, conduit, bends, couplers and clips in each point (items 1.1 and 1.7).',
      },
      {
        code: 'NIMI Electrician trade theory',
        title: 'National Instructional Media Institute, wiring of a dwelling (Table 1)',
        governs: 'Not a standard. The yardstick that an 85 m² home has about 12 lights and 5 fans.',
      },
    ],
  },
  {
    tool: 'PlumbingPro',
    phase: 'P4',
    desc: 'Water supply and drainage quantities',
    codes: [
      {
        code: 'IS 1172:1993',
        title: 'Code of Basic Requirements for Water Supply, Drainage and Sanitation',
        governs: 'Litres of water per person per day, which set the tank sizes and the pump.',
      },
      {
        code: 'IS 2065:1983',
        title: 'Code of Practice for Water Supply in Buildings',
        governs: 'Cited in the report’s source list for the supply layout.',
        caveat: 'The model cites it but takes its quantities from NBC Part 9 and IS 12183.',
      },
      {
        code: 'IS 12183 (Part 1):1987',
        title: 'Code of Practice for Plumbing in Multistoreyed Buildings: Water Supply',
        governs: 'Water storage and pumping; one working pump with one on standby where there is a transfer pump (cl 9.1).',
      },
      {
        code: 'IS 1742:1983',
        title: 'Code of Practice for Building Drainage',
        governs: 'Drain loads, stack and drain limits, and the down-pipe areas for rain water (Table 5).',
      },
      {
        code: 'IS 5329:1983',
        title: 'Code of Practice for Sanitary Pipe Work above Ground for Buildings',
        governs: 'The vent pipe arrangement above five storeys.',
      },
      {
        code: 'IS 2470 (Part 1 and 2):1985',
        title: 'Code of Practice for Installation of Septic Tanks: Design Criteria and Construction (Part 1); Secondary Treatment and Disposal of Effluent (Part 2)',
        governs: 'The septic tank volume for the number of people (Part 1, Appendix A) and the soak pit size for the ground (Part 2, Table 2). Slow-draining ground is flagged as unsuitable for a soak pit.',
      },
      {
        code: 'IS 4111 (Part 1):1986',
        title: 'Code of Practice for Ancillary Structures in Sewerage System: Manholes',
        governs: 'Cited in the report’s source list for inspection chambers.',
      },
      {
        code: 'IS 15778:2007',
        title: 'Chlorinated Polyvinyl Chloride (CPVC) Pipes for Potable Hot and Cold Water Distribution: Specification',
        governs: 'CPVC pipe lengths of 3, 5 or 6 m.',
      },
      {
        code: 'IS 4985:2000',
        title: 'Unplasticized PVC Pipes for Potable Water Supplies: Specification',
        governs: 'uPVC pressure pipe.',
      },
      {
        code: 'NBC 2016, Part 9 (Sections 1 and 2)',
        title: 'National Building Code of India 2016: Plumbing Services, read from the BIS preliminary drafts of November 2024',
        governs: 'Fixture units, simultaneous demand, the 2.4 m/s velocity limit, people per home, and the split of stored water between the underground and the overhead tank.',
        caveat: 'Read from preliminary drafts, not the published code.',
      },
      {
        code: 'SP 35:1987',
        title: 'Handbook on Water Supply and Drainage',
        governs: 'Worked tables for pipe sizing and fixture units.',
      },
    ],
  },
  {
    tool: 'InteriorPro',
    phase: 'P5',
    desc: 'Finishing quantities',
    codes: [
      {
        code: 'IS 1200 (Part 11):1977, (Part 12):1976, (Part 13):1994',
        title: 'Method of Measurement of Building and Civil Engineering Works: Floor Finishes, Dado and Skirting; Plastering and Pointing; Painting',
        governs: 'How floors, dado, skirting, plaster and paint are measured. Openings up to 0.5 m² are not taken out; from 0.5 to 3 m² one face is.',
      },
      {
        code: 'IS 2395 (Part 1):1994',
        title: 'Code of Practice for Painting Concrete, Masonry and Plaster Surfaces: Operations and Workmanship',
        governs: 'The coats of cement paint (cl B-2.5.4) and its coverage of 0.25 to 0.33 kg a square metre for two coats, set beside the CPWD figure. It gives no single number of coats for emulsion or distemper, so those follow makers’ data sheets.',
      },
      {
        code: 'IS 15622:2006',
        title: 'Pressed Ceramic Tiles: Specification',
        governs: 'The tile type for floors and walls (cl 4.1).',
      },
      {
        code: 'IS 1003 (Part 1):2003',
        title: 'Timber Panelled and Glazed Shutters: Door Shutters',
        governs: 'Standard door sizes (cl 7.2, Table 3) and hinges: three for a shutter up to 0.9 m wide, four above (cl 8.2).',
      },
      {
        code: 'IS 2202 (Part 2):1983',
        title: 'Flush Door Shutters: Specification',
        governs: 'Cited in the report’s source list for flush door shutters.',
      },
      {
        code: 'IS 303:2024',
        title: 'Plywood for General Purposes: Specification',
        governs: 'Plywood sheet sizes (cl 8.1 and 8.2).',
      },
      {
        code: 'IS 3067:1988',
        title: 'Code of Practice for General Design Details and Preparatory Work for Damp-proofing and Waterproofing of Buildings',
        governs: 'Nothing is counted from it. Its scope is basements and roofs; the bathroom waterproofing coverage is left to the product’s data sheet.',
      },
      {
        code: 'IS 4021',
        title: 'Timber Door, Window and Ventilator Frames',
        governs: 'It fixes frame sections, which the model needs for door and window frame timber.',
        caveat: 'Could not be read. The frame sections are assumptions.',
      },
      {
        code: 'NBC 2016, Parts 3 and 8',
        title: 'National Building Code of India 2016',
        governs: 'Advisory checks on kitchen and bathroom sizes (Part 3) and window size against room size (Part 8).',
        caveat: 'Read in a summary; the code itself was not read.',
      },
      {
        code: 'CPWD Delhi Analysis of Rates 2016, Volume 2, sub-head 13',
        title: 'Central Public Works Department, Delhi Schedule of Rates: Analysis of Rates',
        governs: 'Paint, primer and putty for each square metre (for example primer 0.070 L, item 13.42), and the mortar under tiles.',
      },
    ],
  },
]

/** Every distinct source in the list, with the tools that cite it. A code cited by two tools is counted once. */
export function uniqueSources(): { code: string; title: string; governs: string; caveat?: string; tools: string[] }[] {
  const map = new Map<string, { code: string; title: string; governs: string; caveat?: string; tools: string[] }>()
  for (const g of CODES_BY_TOOL) {
    for (const c of g.codes) {
      const hit = map.get(c.code)
      if (hit) {
        if (!hit.tools.includes(g.tool)) hit.tools.push(g.tool)
      } else {
        map.set(c.code, { code: c.code, title: c.title, governs: c.governs, caveat: c.caveat, tools: [g.tool] })
      }
    }
  }
  return [...map.values()]
}

/** How many of the listed sources are Indian Standards (IS) and how many are other documents (CPWD, SP handbooks, NBC, a study). */
export function sourceCounts(): { total: number; indianStandards: number; other: number } {
  const all = uniqueSources()
  const indianStandards = all.filter((s) => /^IS\b/.test(s.code)).length
  return { total: all.length, indianStandards, other: all.length - indianStandards }
}
