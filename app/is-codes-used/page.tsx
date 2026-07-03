import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'IS Codes Used in Construction Estimation — 25 Indian Standards',
  description: 'All 25 IS codes used across NirmanShastra tools: IS 456:2000 (concrete), IS 1786:2008 (steel), IS 1893:2016 (seismic), IS 732:2019 (electrical), IS 1172:1993 (plumbing) and more — with full titles and scope.',
}

const CODES_BY_TOOL = [
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

const phaseColor: Record<string, string> = {
  P0: '#C9A84C',
  P1: '#1F4E79',
  P2: '#1F4E79',
  P3: '#1F4E79',
  P4: '#1F4E79',
  P5: '#1F4E79',
  '': '#14532D',
}

export default function ISCodesPage() {
  const totalCodes = CODES_BY_TOOL.reduce((sum, t) => sum + t.codes.length, 0)

  return (
    <main className="sheet-frame min-h-screen" style={{ background: '#F4F4F0' }}>

      {/* Header band */}
      <div style={{ background: '#1F4E79', borderBottom: '1px solid rgba(244,244,240,0.1)' }}>
        <div className="px-6 md:px-16 lg:px-24 py-16">
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(244,244,240,0.6)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 12 }}>
            REFERENCE · IS CODE LIBRARY
          </p>
          <h1 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 'clamp(36px,5vw,56px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1.1 }}>
            IS Codes Used
          </h1>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 14, color: 'rgba(244,244,240,0.65)', marginTop: 16, letterSpacing: '0.04em' }}>
            {totalCodes} IS codes across 6 tools · Sourced from Bureau of Indian Standards publications
          </p>
        </div>
      </div>

      {/* Intro note */}
      <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.08)' }}>
        <div className="px-6 md:px-16 lg:px-24 py-8">
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(244,244,240,0.65)', lineHeight: 1.7, maxWidth: 760 }}>
            Every material quantity, mix ratio, cover depth, steel percentage, and structural parameter in NirmanShastra traces back to a specific clause in one of these codes. IS code values are locked at source — they cannot be altered by user input, and they are updated only when BIS revises the relevant publication.
          </p>
        </div>
      </div>

      {/* Code sections */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
          {CODES_BY_TOOL.map(tool => (
            <div key={tool.tool}>
              {/* Tool header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 16, borderBottom: '2px solid #1E2227' }}>
                {tool.phase && (
                  <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, padding: '4px 10px', border: `1px solid ${phaseColor[tool.phase]}`, color: phaseColor[tool.phase], letterSpacing: '0.05em' }}>
                    {tool.phase}
                  </span>
                )}
                <div>
                  <h2 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 24, fontWeight: 700, color: '#1E2227', lineHeight: 1.2 }}>
                    {tool.tool}
                  </h2>
                  <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.5)', letterSpacing: '0.05em', marginTop: 3 }}>
                    {tool.desc}
                  </p>
                </div>
              </div>

              {/* Codes table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(30,34,39,0.15)' }}>
                      <th style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(30,34,39,0.45)', letterSpacing: '0.09em', textTransform: 'uppercase', textAlign: 'left', padding: '8px 16px 8px 0', minWidth: 130 }}>
                        Code No.
                      </th>
                      <th style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(30,34,39,0.45)', letterSpacing: '0.09em', textTransform: 'uppercase', textAlign: 'left', padding: '8px 16px', minWidth: 280 }}>
                        Full Title
                      </th>
                      <th style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, color: 'rgba(30,34,39,0.45)', letterSpacing: '0.09em', textTransform: 'uppercase', textAlign: 'left', padding: '8px 0 8px 16px' }}>
                        What it Governs in NirmanShastra
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tool.codes.map((c, i) => (
                      <tr key={c.code} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(30,34,39,0.03)', borderBottom: '1px solid rgba(30,34,39,0.07)' }}>
                        <td style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 13, color: '#1F4E79', padding: '14px 16px 14px 0', verticalAlign: 'top', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {c.code}
                        </td>
                        <td style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: '#1E2227', padding: '14px 16px', verticalAlign: 'top', lineHeight: 1.55 }}>
                          {c.title}
                        </td>
                        <td style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 13, color: 'rgba(30,34,39,0.7)', padding: '14px 0 14px 16px', verticalAlign: 'top', lineHeight: 1.65 }}>
                          {c.governs}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="grid-paper" style={{ border: '1px solid rgba(30,34,39,0.1)', padding: '24px 28px', marginTop: 56 }}>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            NOTE ON CODE CURRENCY
          </p>
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(30,34,39,0.75)', lineHeight: 1.75 }}>
            IS codes are published and periodically revised by the Bureau of Indian Standards (BIS). NirmanShastra uses values from the editions listed above. If BIS revises a code referenced here, we update our platform values. We recommend verifying critical parameters against the current BIS publication before committing to specifications for your project.
          </p>
          <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, color: 'rgba(30,34,39,0.75)', lineHeight: 1.75, marginTop: 12 }}>
            See also:{' '}
            <Link href="/disclaimer" style={{ color: '#1F4E79' }}>Disclaimer</Link>{' '}·{' '}
            <Link href="/terms-of-use" style={{ color: '#1F4E79' }}>Terms of Use</Link>
          </p>
        </div>
        </div>
      </section>
    </main>
  )
}
