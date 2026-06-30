'use client'

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react'
import {
  seismicZoneFromState,
  exposureFromSiteCondition,
  foundationFromSiteCondition,
  INDIAN_STATES,
  type SiteCondition,
  type ConcreteGrade,
  type SteelGrade,
  type ExposureClass,
  type StructoInput,
} from '../structopro-engine'

// ─── Types ────────────────────────────────────────────────────────────────────

type UseType  = 'Residential' | 'Commercial' | 'Parking'
type FloorType = 'Standard' | 'Cantilever' | 'Setback'

interface FloorRow {
  label:     string
  length:    string   // kept for potential future use
  width:     string   // kept for potential future use
  area:      string   // direct area input (used when sameArea=false)
  height:    string
  useType:   UseType
  floorType: FloorType
}

interface LabourTrade {
  id:              string
  name:            string
  workers:         number
  ratePerDay:      number
  indiaAvgRate:    number
  productivity:    string
  stdProductivity: string
  active:          boolean
  daysManual:      string
}

interface CustomTrade {
  id:         string
  name:       string
  workers:    string
  ratePerDay: string
  days:       string
}

interface CustomMaterial {
  id:   string
  name: string
  rate: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INDIA_AVG_2026 = {
  cement: 410, steel: 66, sand: 28, aggregate: 45,
  formwork: 12, antiTermite: 18, bindingWire: 80, pccM10: 3200,
}

const SITE_CARDS: { value: SiteCondition; label: string; icon: string; note: string }[] = [
  { value: 'flat',         label: 'Flat Terrain',     icon: '▬', note: 'Level site, no cutting needed' },
  { value: 'sloped_mild',  label: 'Mild Slope',        icon: '◣', note: 'Up to 10° — minor earthwork' },
  { value: 'sloped_steep', label: 'Steep Slope',       icon: '◤', note: 'Over 10° — retaining walls likely' },
  { value: 'rocky',        label: 'Rocky',             icon: '⬡', note: 'Hard rock — drilling, good bearing' },
  { value: 'bcs',          label: 'Black Cotton Soil', icon: '●', note: 'Expansive clay — special foundation' },
  { value: 'soft_marshy',  label: 'Soft / Marshy',     icon: '≋', note: 'Low bearing — piling or raft likely' },
  { value: 'waterlogged',  label: 'Waterlogged',       icon: '〰', note: 'Water table near surface' },
  { value: 'coastal',      label: 'Coastal',           icon: '∿', note: 'Marine exposure — higher cover' },
]

const INITIAL_TRADES: LabourTrade[] = [
  { id: 't1',  name: 'Bar Bender (Sariya Mistri)',  workers: 2, ratePerDay: 950,  indiaAvgRate: 950,  productivity: '600',  stdProductivity: '600 kg steel/day',  active: true,  daysManual: '' },
  { id: 't2',  name: 'Shuttering Carpenter',         workers: 2, ratePerDay: 900,  indiaAvgRate: 900,  productivity: '100',  stdProductivity: '100 sqft/day',      active: true,  daysManual: '' },
  { id: 't3',  name: 'Concreting Mason (RCC)',        workers: 2, ratePerDay: 900,  indiaAvgRate: 900,  productivity: '2.5',  stdProductivity: '2.5 m³/day',        active: true,  daysManual: '' },
  { id: 't4',  name: 'Vibrator Operator',             workers: 1, ratePerDay: 800,  indiaAvgRate: 800,  productivity: '—',    stdProductivity: 'same days as concreting', active: true,  daysManual: '' },
  { id: 't5',  name: 'Excavation Mason',              workers: 1, ratePerDay: 750,  indiaAvgRate: 750,  productivity: '3',    stdProductivity: '3 m³/day',          active: true,  daysManual: '' },
  { id: 't6',  name: 'Rock Cutting Crew',             workers: 0, ratePerDay: 3000, indiaAvgRate: 3000, productivity: '1',    stdProductivity: '1 m³/day',          active: false, daysManual: '' },
  { id: 't7',  name: 'Crane / Hoist Operator',        workers: 1, ratePerDay: 1100, indiaAvgRate: 1100, productivity: '—',    stdProductivity: 'per day',           active: true,  daysManual: '' },
  { id: 't8',  name: 'Concrete Pump Operator',        workers: 0, ratePerDay: 1100, indiaAvgRate: 1100, productivity: '—',    stdProductivity: 'per day',           active: false, daysManual: '' },
  { id: 't9',  name: 'General Helper / Beldar',       workers: 4, ratePerDay: 580,  indiaAvgRate: 580,  productivity: '—',    stdProductivity: 'ratio to masons',   active: true,  daysManual: '' },
  { id: 't10', name: 'Curing / Water Man',            workers: 1, ratePerDay: 500,  indiaAvgRate: 500,  productivity: '—',    stdProductivity: 'floors × 14 days (IS 456)', active: true, daysManual: '' },
  { id: 't11', name: 'Night Watchman',                workers: 1, ratePerDay: 500,  indiaAvgRate: 500,  productivity: '—',    stdProductivity: 'per day',           active: true,  daysManual: '' },
  { id: 't12', name: 'Junior Site Engineer',          workers: 1, ratePerDay: 1500, indiaAvgRate: 1500, productivity: '—',    stdProductivity: 'per day',           active: true,  daysManual: '' },
  { id: 't13', name: 'Site Foreman',                  workers: 1, ratePerDay: 1200, indiaAvgRate: 1200, productivity: '—',    stdProductivity: 'per day',           active: true,  daysManual: '' },
  { id: 't14', name: 'Safety Officer',                workers: 1, ratePerDay: 1200, indiaAvgRate: 1200, productivity: '—',    stdProductivity: 'per day',           active: true,  daysManual: '' },
]

const INFO: Record<string, { title: string; body: string; is?: string }> = {
  seismic:         { title: 'Seismic Zone', body: 'Auto-detected from your state using IS 1893:2016. Zone V is highest risk (Himalayan belt, NE states). Higher zones need more steel and ductile detailing.', is: 'IS 1893:2016 Table 2' },
  concrete:        { title: 'Concrete Grade', body: 'M20 = 20 MPa strength at 28 days. IS 456:2000 mandates M20 minimum for RCC. Use M25 or above for columns in Zone III+.', is: 'IS 456:2000 Cl 6.1' },
  steel:           { title: 'Steel Grade', body: 'Fe500D: 500 MPa yield + "D" means ductile (IS 13920:2016). Mandatory for all seismic zones III and above. Fe500 is standard for Zone II.', is: 'IS 1786:2008 + IS 13920:2016' },
  barsize:         { title: 'Bar Diameter', body: 'Main bars carry primary loads. Larger diameter bars reduce congestion in joints but are heavier. 16mm is standard for columns and beams in G+1 to G+3.', is: 'IS 456:2000 Cl 26.5' },
  stirrup:         { title: 'Stirrup / Link Bar', body: 'Stirrups resist shear and confine concrete. 8mm @150mm spacing is standard for residential beams. IS 13920:2016 requires 6mm hooks for seismic zones.', is: 'IS 456:2000 Cl 26.5.1.6' },
  pcc:             { title: 'PCC Below Foundation', body: 'Plain Cement Concrete levelling course below footing. M10 (1:3:6) is standard. Minimum 75mm thick (IS 456:2000). Provides clean working surface.', is: 'IS 456:2000 Cl 15.4' },
  foundconc:       { title: 'Foundation Concrete Grade', body: 'IS 456:2000 mandates M20 minimum for mild exposure. M25 for moderate. Footings are always 50mm cover (Cl.26.4.2.2) regardless of exposure.', is: 'IS 456:2000 Cl 26.4.2.2' },
  colconc:         { title: 'Column Concrete Grade', body: 'Columns carry maximum compressive loads. IS 456:2000 recommends M25 minimum for columns in Zone III+. Higher grade also improves column size efficiency.', is: 'IS 456:2000 Table 5' },
  beamconc:        { title: 'Beam Concrete Grade', body: 'Beams are in bending — concrete grade affects crack width and deflection. M25 is standard residential. Do not use grade lower than foundation grade.', is: 'IS 456:2000 Cl 6.1' },
  slabconc:        { title: 'Slab Concrete Grade', body: 'Slabs in mild exposure can use M20 minimum. M25 is safer for longer spans. Do not go below M20 — IS 456:2000 minimum for all RCC.', is: 'IS 456:2000 Cl 6.1' },
  soilbearing:     { title: 'Soil Bearing Capacity', body: 'SBC determines foundation size and depth. Less than 100 kN/m² requires raft or pile foundation. Medium (150-200) is most common for Deccan plateau soils.', is: 'IS 1904:2016 Table 1' },
  exposure:        { title: 'Exposure Class', body: 'Determines min cement content, w/c ratio, and cover. Mild = protected interior. Moderate = open air. Severe = coastal. Very Severe = splash zone.', is: 'IS 456:2000 Table 5' },
  column:          { title: 'Column Size', body: 'Minimum 230×230mm for G+1. 300×300mm for G+3 to G+5. Larger columns improve lateral stability and must be consistent floor-to-floor.', is: 'IS 456:2000 Cl 26.5.3' },
  slab:            { title: 'Slab Thickness', body: 'Minimum 125mm for residential. Span÷26 for one-way simply supported (IS 456:2000 Cl 23.2). Increase for longer spans or heavy live loads.', is: 'IS 456:2000 Cl 23.2' },
  foundation:      { title: 'Foundation Depth', body: 'Minimum 0.5m below natural ground (IS 1904:2016). Practical minimum is 1.5m for frost-free stable soil. Increases for soft/expansive soils.', is: 'IS 1904:2016 Cl 4.1' },
  plinth:          { title: 'Plinth Height', body: 'Height of plinth beam above ground level. NBC 2016 recommends minimum 450mm. 600mm protects against flooding and moisture ingress.', is: 'NBC 2016' },
  cover:           { title: 'Concrete Cover (read-only)', body: 'Auto-set from exposure class. IS 456:2000 Table 16: Mild=40mm, Moderate=45mm, Severe=50mm, Very Severe=55mm, Extreme=60mm.', is: 'IS 456:2000 Table 16' },
  staircase:       { title: 'Staircase', body: 'NBC 2016 mandates: tread min 250mm, riser max 190mm, clear width min 900mm. Dog-leg is standard for residential. Open well suits G+3 and above.', is: 'NBC 2016 Part 3 Cl 4.2' },
  oht:             { title: 'Overhead Tank', body: 'HDPE (IS 12701) tanks are lighter and leak-free. RCC tanks save material cost but add structural load. OHT = Daily demand × 0.67 (IS 1172:1993).', is: 'IS 1172:1993 + IS 12701' },
  parapet:         { title: 'Parapet Wall', body: 'NBC 2016 minimum height 900mm for occupied terraces. The RCC band is structural — built with the slab pour. MasonryPro handles brick/block parapet infill.', is: 'NBC 2016 Part 4 Cl 3.3' },
  parking:         { title: 'Stilt Ground Floor', body: 'Stilt parking creates a soft storey — GF is much weaker than upper floors. IS 1893:2016 Cl 7.10 requires special structural design.', is: 'IS 1893:2016 Cl 7.10' },
  cpwd:            { title: 'CPWD Productivity (Editable)', body: 'CPWD publishes standard output per worker per day. These are reference values — edit to match your site. Labour total shown only in your paid PDF report.', is: 'CPWD DSR 2023' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Tip({
  id,
  infoId,
  open,
  setOpen,
}: {
  id:      string
  infoId?: string
  open:    string | null
  setOpen: (v: string | null) => void
}) {
  const tip = INFO[infoId ?? id]
  if (!tip) return null
  const isOpen = open === id
  return (
    <span className="relative inline-block ml-1 align-middle">
      <button
        type="button"
        className="text-[11px] w-[18px] h-[18px] rounded-full border inline-flex items-center justify-center leading-none"
        style={{ borderColor: '#1F4E79', color: '#1F4E79' }}
        onClick={() => setOpen(isOpen ? null : id)}
      >i</button>
      {isOpen && (
        <div className="absolute z-50 left-6 top-0 w-64 p-3 rounded-[2px] shadow-lg" style={{ background: '#F4F4F0', border: '1.5px solid #1F4E79' }}>
          <div className="flex justify-between items-start mb-1">
            <span className="text-[12px] font-semibold" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-sans)' }}>{tip.title}</span>
            <button type="button" onClick={() => setOpen(null)} className="text-[11px] opacity-40 hover:opacity-100 ml-2">✕</button>
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{tip.body}</p>
          {tip.is && <p className="text-[11px] mt-1.5" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>— {tip.is}</p>}
        </div>
      )}
    </span>
  )
}

function Sect({ title, badge, defaultOpen = true, children }: { title: string; badge?: string; defaultOpen?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ border: '1px solid rgba(30,34,39,0.12)', borderLeft: '3px solid #1F4E79' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
        style={{ background: 'rgba(31,78,121,0.04)' }}>
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 16, fontWeight: 600, color: '#1F4E79' }}>{title}</span>
          {badge && <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, padding: '2px 8px', background: 'rgba(31,78,121,0.12)', color: '#1F4E79' }}>{badge}</span>}
        </div>
        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 12, color: 'rgba(30,34,39,0.4)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-6 py-6 space-y-5">{children}</div>}
    </div>
  )
}

type AlertVariant = 'info' | 'caution' | 'error' | 'tip'
function AlertBox({ variant, children }: { variant: AlertVariant; children: ReactNode }) {
  const styles: Record<AlertVariant, { bg: string; border: string; icon: string; iconColor: string }> = {
    info:    { bg: 'rgba(31,78,121,0.05)',  border: '#1F4E79', icon: 'ⓘ', iconColor: '#1F4E79' },
    caution: { bg: 'rgba(217,154,6,0.07)', border: '#D99A06', icon: '⚠', iconColor: '#D99A06' },
    error:   { bg: 'rgba(140,58,34,0.06)', border: '#8C3A22', icon: '✕', iconColor: '#8C3A22' },
    tip:     { bg: 'rgba(20,83,45,0.06)',  border: '#14532D', icon: '✓', iconColor: '#14532D' },
  }
  const s = styles[variant]
  return (
    <div className="flex gap-3 p-4" style={{ background: s.bg, borderLeft: `4px solid ${s.border}` }}>
      <span className="text-[15px] shrink-0 mt-0.5 font-bold" style={{ color: s.iconColor }}>{s.icon}</span>
      <div className="text-[13px] leading-relaxed" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{children}</div>
    </div>
  )
}

interface ISBadge { variant: 'green' | 'amber' | 'red'; text: string }

function ISBadgeComp({ variant, text }: ISBadge) {
  const s = {
    green: { bg: 'rgba(20,83,45,0.07)',   color: '#14532D', border: '1px solid #14532D30' },
    amber: { bg: 'rgba(217,154,6,0.07)',  color: '#7C5500', border: '1px solid #D99A0640' },
    red:   { bg: 'rgba(140,58,34,0.07)', color: '#8C3A22', border: '1px solid #8C3A2230' },
  }[variant]
  return (
    <div className="text-[10px] px-2 py-1 rounded-[2px] leading-snug" style={{ background: s.bg, color: s.color, border: s.border, fontFamily: 'var(--font-plex-mono)' }}>
      {text}
    </div>
  )
}

function RegionalNote({ children }: { children: string }) {
  return (
    <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-sans)' }}>
      {children}
    </p>
  )
}

const REGIONAL_NOTES: Record<string, string> = {
  cement:      '₹380–420 along coastal Maharashtra. ₹440–460 in remote NE India (transport adds 15–25%).',
  steel:       'Near Jamshedpur (TISCO) ₹62–64/kg. Mumbai ₹66–68. Remote NE pays ₹72–78/kg.',
  sand:        '₹18–22 in river-belt zones. ₹35–45 in coastal/metro. M-sand ₹20–28 nationwide.',
  aggregate:   '₹35–42 near quarries (Deccan, Eastern Ghats). ₹55–65 in plains far from source.',
  formwork:    '₹8–10 in Tier-2 cities. ₹16–18 in Mumbai/Pune with steel shuttering demand.',
  antiTermite: '₹14–18 in dry zones. ₹22–28 in coastal and NE India (higher soil moisture).',
  bindingWire: '₹70–75 in steel belt (Jharkhand, WB). ₹88–95 in remote NE.',
  pccM10:      '₹2,800–3,200 in Tier-2 cities. ₹4,000+ in Mumbai/Chennai metro.',
}

// Fixed elevation diagram — Ground Floor at BOTTOM, floors stack upward
function ElevationDiagram({ floorRows, sameArea, groundArea }: {
  floorRows: { label: string; area: string; length: string; width: string; height: string }[]
  sameArea:  boolean
  groundArea: string
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const floors = floorRows.map(f => {
    const area = sameArea
      ? (parseFloat(groundArea) || 0)
      : (parseFloat(f.area) || 0)
    const height = parseFloat(f.height) || 10
    return { label: f.label, area, height }
  })
  const validFloors = floors.filter(f => f.area > 0)
  if (validFloors.length === 0) return null
  const maxArea  = Math.max(...floors.map(f => f.area), 1)
  const totalH   = floors.reduce((s, f) => s + f.height, 0)
  const svgH     = 160
  const svgW     = 280
  const maxBarW  = 220
  const baseY    = svgH - 16

  // Process Ground→Top: each floor stacks above the previous.
  // curY starts at baseY (ground) and decrements upward.
  let curY = baseY
  const floorRects = floors.map(f => {
    const barW = (f.area / maxArea) * maxBarW
    const barH = Math.max(8, (f.height / totalH) * (svgH - 30))
    const rect = { x: (svgW - barW) / 2, y: curY - barH, w: barW, h: barH, label: f.label, area: f.area }
    curY -= barH
    return rect
  })

  return (
    <div className="mt-3 p-3 rounded-[2px]" style={{ border: '1px solid #1E222720', background: '#1E22270A' }}>
      <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
        LIVE ELEVATION DIAGRAM
      </p>
      <svg ref={svgRef} width={svgW} height={svgH} style={{ display: 'block', margin: '0 auto' }}>
        {/* ground line */}
        <line x1={10} y1={baseY} x2={svgW - 10} y2={baseY} stroke="#1E222740" strokeWidth={1} />
        {floorRects.map((r, i) => (
          <g key={i}>
            <rect
              x={r.x} y={r.y} width={r.w} height={r.h}
              fill={`rgba(31,78,121,${0.08 + i * 0.06})`}
              stroke="#1F4E79"
              strokeWidth={0.8}
            />
            <text
              x={svgW / 2} y={r.y + r.h / 2 + 4}
              textAnchor="middle"
              style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, fill: '#1F4E79' }}
            >
              {r.label} {r.area > 0 ? `${r.area.toFixed(0)} sqft` : ''}
            </text>
          </g>
        ))}
        <text x={svgW - 5} y={baseY + 12} textAnchor="end" style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 9, fill: '#1E222760' }}>
          G.L.
        </text>
      </svg>
      <p className="text-[10px] text-center mt-1" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>
        Ground floor at bottom · bar width = area · bar height = floor-to-floor height
      </p>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  state:         string
  city:          string
  onSubmit:      (input: StructoInput) => void
  onFormChange?: (data: Record<string, unknown>) => void
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BuildDetails({ state: initState, city: initCity, onSubmit, onFormChange }: Props) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // S1
  const [projectName, setProjectName] = useState('')
  const [localState, setLocalState]   = useState(initState || '')
  const [localCity, setLocalCity]     = useState(initCity || '')

  // S2
  const [numFloors, setNumFloors]   = useState(1)
  const [sameArea, setSameArea]     = useState(true)
  const [groundArea, setGroundArea] = useState('')
  const [floorRows, setFloorRows]   = useState<FloorRow[]>([
    { label: 'Ground Floor', length: '', width: '', area: '', height: '10', useType: 'Residential', floorType: 'Standard' },
    { label: 'First Floor',  length: '', width: '', area: '', height: '10', useType: 'Residential', floorType: 'Standard' },
  ])

  // S3
  const [siteCondition, setSiteCondition]       = useState<SiteCondition | null>(null)
  const [foundationOverride, setFoundationOverride] = useState('')

  // S4
  const [staircase, setStaircase] = useState({ include: true, type: 'dogleg' as 'straight'|'dogleg'|'open_well', widthMm: 1200, count: 1 })
  const [oht, setOht]             = useState({ include: true, type: 'hdpe' as 'hdpe'|'rcc' })
  const [parapet, setParapet]     = useState({ include: true, heightMm: 900 })
  const [parkingType, setParkingType] = useState<'none'|'stilt'|'shed'>('none')

  // S5 — Tech Specs
  const [seismicOverride, setSeismicOverride]           = useState('')
  const [concreteGrade, setConcreteGrade]               = useState<ConcreteGrade>('M20')
  const [steelGrade, setSteelGrade]                     = useState<SteelGrade>('Fe500')
  const [columnMainBar, setColumnMainBar]               = useState('16mm')
  const [beamMainBar, setBeamMainBar]                   = useState('16mm')
  const [slabBar, setSlabBar]                           = useState('10mm')
  const [stirrupBar, setStirrupBar]                     = useState('8mm')
  const [columnSize, setColumnSize]                     = useState('350×350mm')
  const [slabThickness, setSlabThickness]               = useState(125)
  const [pccGrade, setPccGrade]                         = useState('M15')
  const [foundationConcreteGrade, setFoundationConcreteGrade] = useState('M20')
  const [columnConcreteGrade, setColumnConcreteGrade]   = useState('M25')
  const [beamConcreteGrade, setBeamConcreteGrade]       = useState('M25')
  const [slabConcreteGrade, setSlabConcreteGrade]       = useState('M20')
  const [soilBearingCapacity, setSoilBearingCapacity]   = useState('Medium 150-200')
  const [foundationDepthM, setFoundationDepthM]         = useState(1.5)
  const [plinthHeight, setPlinthHeight]                 = useState(0.6)

  // S6 — Material Rates
  const [rates, setRates]                   = useState({ ...INDIA_AVG_2026 })
  const [customMaterials, setCustomMaterials] = useState<CustomMaterial[]>([])

  // S7 — Contractor Quote
  const [quoteMode, setQuoteMode]           = useState<'total'|'materials'|'breakdown'>('total')
  const [contractorName, setContractorName] = useState('')
  const [contractorTotal, setContractorTotal] = useState('')
  const [ctConcreteRate, setCtConcreteRate] = useState('')
  const [ctSteelRate, setCtSteelRate]       = useState('')
  const [ctFormworkRate, setCtFormworkRate] = useState('')

  // Sub-step navigation
  const [subStep, setSubStep] = useState<'3a' | '3b' | '3c'>('3a')

  // S8 — Labour
  const [includeLabour, setIncludeLabour] = useState(false)
  const [trades, setTrades]               = useState<LabourTrade[]>(INITIAL_TRADES)
  const [customTrades, setCustomTrades]   = useState<CustomTrade[]>([])

  // ── Computed ──
  const szInfo        = seismicZoneFromState(localState)
  const effectiveZone = seismicOverride || szInfo.zone
  const exposureClass: ExposureClass = siteCondition ? exposureFromSiteCondition(siteCondition) : 'mild'
  const foundationRec = siteCondition ? foundationFromSiteCondition(siteCondition, numFloors) : null
  const coverMm       = { mild: 40, moderate: 45, severe: 50, very_severe: 55, extreme: 60 }[exposureClass]
  const isStiltSoftStorey = parkingType === 'stilt' && ['III', 'IV', 'V'].includes(effectiveZone)
  const LARGE_MULTIZONE_STATES = ['Maharashtra', 'Uttar Pradesh', 'Rajasthan']

  // ── IS 1893:2016 / IS 456:2000 — Structural feasibility checks ──
  const structuralChecks = useMemo(() => {
    const perFloor: { badges: ISBadge[]; blockCalc: boolean }[] = floorRows.map(() => ({ badges: [], blockCalc: false }))
    let blockCalculate = false
    let hasIrregularity = false

    if (!sameArea) {
      for (let i = 1; i < floorRows.length; i++) {
        const lowerSqft = parseFloat(floorRows[i - 1].area) || 0
        const upperSqft = parseFloat(floorRows[i].area) || 0
        if (lowerSqft <= 0 || upperSqft <= 0) continue

        const lowerSideM = Math.sqrt(lowerSqft * 0.0929)
        const upperSideM = Math.sqrt(upperSqft * 0.0929)
        const dimensionRatio = upperSideM / lowerSideM
        const cantileverM = Math.max(0, (upperSideM - lowerSideM) / 2)
        const areaRatio = upperSqft / lowerSqft
        const dimPct = Math.round((dimensionRatio - 1) * 100)
        const areaPct = Math.round((areaRatio - 1) * 100)
        const cantStr = cantileverM.toFixed(2)
        const beamDepth = Math.ceil(cantileverM * 142)
        const rowBadges: ISBadge[] = []
        let rowBlock = false

        // Check 1 — Vertical Geometric Irregularity (IS 1893:2016 Table 6)
        if (dimensionRatio > 1.5) {
          rowBadges.push({ variant: 'red', text: `⛔ IS 1893:2016 Table 6 — Severe Geometric Irregularity: Upper floor is ${dimPct}% wider. Transfer structure required. Static design method invalid.` })
          hasIrregularity = true
        } else if (dimensionRatio > 1.25) {
          rowBadges.push({ variant: 'amber', text: `⚠️ IS 1893:2016 Table 6 — Geometric Irregularity: Upper floor is ${dimPct}% wider than floor below. Dynamic analysis mandatory in Zones III-V.` })
          hasIrregularity = true
        }

        // Check 2 — Mass Irregularity (IS 1893:2016 Table 6)
        if (areaRatio > 1.5) {
          rowBadges.push({ variant: 'amber', text: `⚠️ IS 1893:2016 Table 6 — Mass Irregularity: ${floorRows[i].label} is ${areaPct}% heavier than floor below. Dynamic analysis mandatory in Zones III-V.` })
          hasIrregularity = true
        }

        // Check 3 — Cantilever Limit (IS 456:2000 Cl 23.2.1)
        if (cantileverM > 3) {
          rowBadges.push({ variant: 'red', text: `⛔ IS 456:2000 Cl 23.2.1: ${cantStr}m cantilever requires ${beamDepth}mm deep beam — impractical for residential RCC. Pre-stressed concrete or steel truss required. Redesign floor areas.` })
          rowBlock = true
          blockCalculate = true
          hasIrregularity = true
        } else if (cantileverM > 1.5) {
          rowBadges.push({ variant: 'amber', text: `⚠️ IS 456:2000 Cl 23.2.1: ${cantStr}m cantilever needs ${beamDepth}mm deep transfer beam. Specialist engineer required.` })
          hasIrregularity = true
        } else if (cantileverM > 0) {
          rowBadges.push({ variant: 'green', text: `✓ Cantilever ${cantStr}m — standard range. Transfer beam min depth ${beamDepth}mm.` })
        }

        perFloor[i] = { badges: rowBadges, blockCalc: rowBlock }
      }
    }

    // Check 5 — Slender Building (IS 1893:2016)
    const totalHeightM = floorRows.reduce((sum, r) => sum + (parseFloat(r.height) || 10) * 0.3048, 0)
    const areaValues = sameArea
      ? [parseFloat(groundArea) || 0]
      : floorRows.map(r => parseFloat(r.area) || 0).filter(v => v > 0)
    const minAreaSqft = areaValues.length > 0 ? Math.min(...areaValues) : 0
    const baseDimM = minAreaSqft > 0 ? Math.sqrt(minAreaSqft * 0.0929) : 0
    const isSlender = baseDimM > 0 && totalHeightM > 5 * baseDimM

    return { perFloor, blockCalculate, hasIrregularity, isSlender }
  }, [sameArea, floorRows, groundArea])

  const FLOOR_LABELS = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Fourth Floor', 'Fifth Floor']

  const makeFloorRow = (label: string): FloorRow => ({
    label, length: '', width: '', area: '', height: '10', useType: 'Residential', floorType: 'Standard',
  })

  // Report live form state to parent
  useEffect(() => {
    if (!onFormChange) return
    const totalBUA = sameArea
      ? (parseFloat(groundArea) || 0) * (numFloors + 1)
      : floorRows.reduce((sum, r) => sum + (parseFloat(r.area) || 0), 0)
    onFormChange({
      floors: `G+${numFloors}`,
      bua: Math.round(totalBUA),
      siteCondition: siteCondition ?? undefined,
      concreteGrade,
      steelGrade,
      labourEnabled: includeLabour,
    })
  }, [numFloors, sameArea, groundArea, floorRows, siteCondition, concreteGrade, steelGrade, includeLabour]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync floor rows when numFloors changes
  useEffect(() => {
    const count = numFloors + 1
    setFloorRows(prev => {
      if (prev.length === count) return prev
      const next = [...prev]
      while (next.length < count) {
        next.push(makeFloorRow(FLOOR_LABELS[next.length] ?? `Floor ${next.length}`))
      }
      return next.slice(0, count)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numFloors])

  function updateFloorRow(idx: number, field: keyof FloorRow, val: string) {
    setFloorRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r))
  }

  function updateTrade(id: string, field: keyof LabourTrade, val: string | number | boolean) {
    setTrades(prev => prev.map(t => t.id === id ? { ...t, [field]: val } : t))
  }

  function addCustomMaterial() {
    setCustomMaterials(prev => [...prev, { id: `cm-${Date.now()}`, name: '', rate: '' }])
  }

  function addCustomTrade() {
    setCustomTrades(prev => [...prev, { id: `ct-${Date.now()}`, name: '', workers: '1', ratePerDay: '', days: '' }])
  }

  function handleSubmit() {
    const errs: Record<string, string> = {}
    if (!siteCondition) errs.site = 'Select a site condition to continue'
    const buaSqft = parseFloat(groundArea) || 0
    if (sameArea && buaSqft < 100) errs.area = 'Enter a valid floor area (min 100 sqft)'
    if (!sameArea && floorRows.some(r => !r.area || parseFloat(r.area) < 50)) errs.floors = 'Enter area (min 50 sqft) for all floors'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    const gfAreaSqft = sameArea
      ? parseFloat(groundArea) || 0
      : parseFloat(floorRows[0]?.area || '0')

    const input: StructoInput = {
      projectName,
      state: localState,
      city: localCity,
      numFloors,
      groundFloorAreaSqft: gfAreaSqft,
      siteCondition: siteCondition!,
      concreteGrade,
      steelGrade,
      seismicZoneOverride: seismicOverride || undefined,
      contractorQuote: contractorTotal ? parseFloat(contractorTotal) : undefined,
      contractorConcreteRate: ctConcreteRate ? parseFloat(ctConcreteRate) : undefined,
      contractorSteelRate: ctSteelRate ? parseFloat(ctSteelRate) : undefined,
      contractorFormworkRate: ctFormworkRate ? parseFloat(ctFormworkRate) : undefined,
      includeLabour,
      columnSize,
      slabThickness,
      foundationDepth: Math.round(foundationDepthM * 1000),
    }
    onSubmit(input)
  }

  const iCls = 'w-full px-4 rounded-[6px] border text-[14px] bg-white'
  const iStyle = { borderColor: '#1E222730', color: '#1E2227', fontFamily: 'var(--font-plex-sans)', minHeight: 48 }
  const monoStyle = { fontFamily: 'var(--font-plex-mono)', color: '#1E2227' }
  const lCls = 'block text-[13px] font-medium mb-2'
  const lStyle = { color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }
  const avgTag = (v: number | string, unit = '') => (
    <span className="text-[11px] ml-2" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>
      India Avg: {v}{unit}
    </span>
  )

  // Small select helper for technical specs
  const specSelect = (value: string, onChange: (v: string) => void, opts: [string, string][], w = 'w-full') => (
    <select className={`${w} px-3 py-2 rounded-[6px] border text-[13px]`} style={{ ...iStyle, ...monoStyle, minHeight: 40 }} value={value} onChange={e => onChange(e.target.value)}>
      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  )

  return (
    <form onSubmit={e => e.preventDefault()} className="space-y-4 py-8 px-6 md:px-10">
      <div className="mb-2">
        <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>P1 · RCC STRUCTURE ESTIMATOR</p>
        <h2 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 32, fontWeight: 700, color: '#1E2227', lineHeight: 1.15 }}>StructurePro — Build Details</h2>
        <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.55)', marginTop: 6 }}>Fill all sections to generate your IS-code verified structural estimate</p>
      </div>

      {/* ── Progress Indicator ─────────────────────────────────────────────────── */}
      <div className="flex items-center flex-wrap gap-x-0.5 gap-y-2 pb-4 overflow-x-auto" style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
        {([
          { label: '1 REG',        done: true,                                 active: false },
          { label: '2 METHOD',     done: true,                                 active: false },
          { label: '3a STRUCTURE', done: subStep === '3b' || subStep === '3c', active: subStep === '3a' },
          { label: '3b MATERIALS', done: subStep === '3c',                     active: subStep === '3b' },
          { label: '3c LABOUR',    done: false,                                active: subStep === '3c' },
          { label: '4 RESULTS',    done: false,                                active: false },
        ] as { label: string; done: boolean; active: boolean }[]).map((step, i, arr) => (
          <div key={step.label} className="flex items-center">
            <span className="text-[10px] px-2 py-0.5 rounded-[2px]" style={{
              fontFamily: 'var(--font-plex-mono)',
              background: step.active ? '#1F4E79' : step.done ? 'rgba(20,83,45,0.08)' : 'rgba(30,34,39,0.05)',
              color: step.active ? '#fff' : step.done ? '#14532D' : 'rgba(30,34,39,0.35)',
              border: `1px solid ${step.active ? 'transparent' : step.done ? 'rgba(20,83,45,0.2)' : 'rgba(30,34,39,0.12)'}`,
              whiteSpace: 'nowrap',
            }}>
              {step.done ? '✓ ' : ''}{step.label}
            </span>
            {i < arr.length - 1 && (
              <span style={{ color: 'rgba(30,34,39,0.25)', fontFamily: 'var(--font-plex-mono)', fontSize: 10, padding: '0 3px' }}>—</span>
            )}
          </div>
        ))}
      </div>

      {subStep === '3a' && (<>

      {/* ── S1: Project Details ────────────────────────────────────────────────── */}
      <Sect title="1 — Where is your plot and what is the project?">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={lCls} style={lStyle}>Project Name</label>
            <input className={iCls} style={iStyle} placeholder="e.g. Sharma Residence, Pune" value={projectName} onChange={e => setProjectName(e.target.value)} />
          </div>
          <div>
            <label className={lCls} style={lStyle}>State</label>
            <select className={iCls} style={iStyle} value={localState} onChange={e => { setLocalState(e.target.value); setSeismicOverride('') }}>
              <option value="">— Select State / UT —</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={lCls} style={lStyle}>City</label>
            <input className={iCls} style={iStyle} placeholder="e.g. Pune" value={localCity} onChange={e => setLocalCity(e.target.value)} />
          </div>
        </div>

        {localState && (
          <div className="p-3 rounded-[2px]" style={{ background: '#1F4E7910', border: '1px solid #1F4E7930' }}>
            <span className="text-[11px] font-medium" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
              IS 1893:2016 — Auto-detected: Zone {szInfo.zone} (Z = {szInfo.zFactor})
              {seismicOverride && seismicOverride !== szInfo.zone && (
                <span className="ml-2" style={{ color: '#D99A06' }}> → Overridden to Zone {seismicOverride} in Technical Specifications</span>
              )}
            </span>
            <Tip id="seismic" open={activeTooltip} setOpen={setActiveTooltip} />
          </div>
        )}
        {localState && ['Arunachal Pradesh','Assam','Manipur','Meghalaya','Mizoram','Nagaland','Sikkim','Tripura','Jammu and Kashmir','Ladakh','Uttarakhand','Himachal Pradesh'].includes(localState) && (
          <AlertBox variant="caution">
            <strong>NE India / Himalayan belt:</strong> Seismic Zone IV–V. Fe500D steel and IS 13920:2016 ductile detailing are mandatory. Material costs run 15–25% higher due to transport. Budget accordingly.
          </AlertBox>
        )}
        {localState && ['Maharashtra','Gujarat','Rajasthan','West Bengal','Goa','Kerala'].includes(localState) && (
          <AlertBox variant="info">
            Zone III state. M20 minimum concrete + Fe500D preferred. Check your district-level zone map — some districts have local amendments.
          </AlertBox>
        )}
      </Sect>

      {/* ── S2: Floor Details ─────────────────────────────────────────────────── */}
      <Sect title="2 — How many floors and what is the floor area?">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lCls} style={lStyle}>Number of Floors</label>
            <select className={iCls} style={{ ...iStyle, ...monoStyle }} value={numFloors} onChange={e => setNumFloors(parseInt(e.target.value))}>
              {[['0','G (Ground only)'],['1','G + 1'],['2','G + 2'],['3','G + 3'],['4','G + 4'],['5','G + 5']].map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lCls} style={lStyle}>Same area on all floors?</label>
            <div className="flex gap-3 mt-2">
              {(['Yes', 'No'] as const).map(opt => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="sameArea" checked={sameArea === (opt === 'Yes')} onChange={() => setSameArea(opt === 'Yes')} style={{ accentColor: '#1F4E79' }} />
                  <span className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <AlertBox variant="tip">
          <strong>Different area per floor</strong> is common for L-shaped, T-shaped, or setback buildings. Select &quot;No&quot; to enter each floor&apos;s area directly. Select &quot;Yes&quot; if all floors have the same footprint.
        </AlertBox>

        {sameArea ? (
          <div>
            <label className={lCls} style={lStyle}>Floor Area (sqft) — applies to all floors</label>
            <input className={iCls} style={{ ...iStyle, ...monoStyle }} type="number" min="100" placeholder="e.g. 1200" value={groundArea} onChange={e => setGroundArea(e.target.value)} />
            {errors.area && <p className="text-[11px] mt-1" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>{errors.area}</p>}
          </div>
        ) : (
          <>
            <AlertBox variant="info">
              Enter the built-up area (sq ft) for each floor. Balconies and cantilevers count. Select the floor type to help identify setback or cantilever floors.
            </AlertBox>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr style={{ background: '#1E22270A' }}>
                    {['Floor Level', 'Area (sq ft)', 'Type', 'Height (ft)', 'Diff from prev.', 'IS Checks'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', borderBottom: '1px solid #1E222720' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {floorRows.map((row, idx) => {
                    const currArea = parseFloat(row.area) || 0
                    const prevArea = idx > 0 ? (parseFloat(floorRows[idx - 1].area) || 0) : null
                    const diff = prevArea !== null ? currArea - prevArea : null
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #1E222710' }}>
                        <td className="px-3 py-2 font-medium" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{row.label}</td>
                        <td className="px-2 py-1">
                          <input
                            className="w-full px-2 py-1 rounded-[2px] border text-[13px]"
                            style={{ ...iStyle, ...monoStyle, minHeight: 36 }}
                            type="number"
                            min="0"
                            placeholder="e.g. 1200"
                            value={row.area}
                            onChange={e => updateFloorRow(idx, 'area', e.target.value)}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <select
                            className="w-full px-2 py-1 rounded-[2px] border text-[12px]"
                            style={{ ...iStyle, fontFamily: 'var(--font-plex-sans)', minHeight: 36 }}
                            value={row.floorType}
                            onChange={e => updateFloorRow(idx, 'floorType', e.target.value as FloorType)}
                          >
                            <option value="Standard">Standard</option>
                            <option value="Cantilever">Cantilever</option>
                            <option value="Setback">Setback</option>
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <input
                            className="w-16 px-2 py-1 rounded-[2px] border text-[12px]"
                            style={{ ...iStyle, ...monoStyle, minHeight: 36 }}
                            type="number"
                            value={row.height}
                            onChange={e => updateFloorRow(idx, 'height', e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-2 text-[12px] font-medium" style={{ fontFamily: 'var(--font-plex-mono)', color: diff === null ? '#1E222740' : diff > 0 ? '#14532D' : diff < 0 ? '#8C3A22' : '#1E2227' }}>
                          {diff === null ? '—' : diff > 0 ? `+${diff.toFixed(0)} sqft` : diff < 0 ? `${diff.toFixed(0)} sqft` : '±0 sqft'}
                        </td>
                        <td className="px-3 py-2 min-w-[220px]">
                          {idx === 0
                            ? <span className="text-[10px]" style={{ color: '#1E222740', fontFamily: 'var(--font-plex-mono)' }}>Base floor — no upper comparison</span>
                            : structuralChecks.perFloor[idx]?.badges.length > 0
                              ? <div className="space-y-1">{structuralChecks.perFloor[idx].badges.map((b, bi) => <ISBadgeComp key={bi} variant={b.variant} text={b.text} />)}</div>
                              : (parseFloat(floorRows[idx].area) > 0
                                ? <span className="text-[10px]" style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)' }}>✓ No irregularities detected</span>
                                : <span className="text-[10px]" style={{ color: '#1E222740', fontFamily: 'var(--font-plex-mono)' }}>Enter area to check</span>
                              )
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {errors.floors && <p className="text-[11px] mt-1" style={{ color: '#8C3A22' }}>{errors.floors}</p>}
            </div>
          </>
        )}

        {/* ── IS Code Validation Summary ─────────────────────────────────────── */}
        {/* Check 4 — Stilt Soft Storey */}
        {isStiltSoftStorey && (
          <div className="p-3 rounded-[2px]" style={{ background: 'rgba(217,154,6,0.07)', border: '1.5px solid #D99A0640' }}>
            <p className="text-[12px] font-semibold" style={{ color: '#7C5500', fontFamily: 'var(--font-plex-mono)' }}>
              ⚠️ IS 1893:2016 Cl 7.9: Open ground floor = Soft Storey. Columns must carry 2.5× normal seismic force in Zone {effectiveZone}. Structural engineer mandatory.
            </p>
          </div>
        )}

        {/* Check 5 — Slender Building */}
        {structuralChecks.isSlender && (
          <div className="p-3 rounded-[2px]" style={{ background: 'rgba(217,154,6,0.07)', border: '1.5px solid #D99A0640' }}>
            <p className="text-[12px] font-semibold" style={{ color: '#7C5500', fontFamily: 'var(--font-plex-mono)' }}>
              ⚠️ IS 1893:2016: Building height exceeds 5× base dimension. Wind overturning check per IS 875 Part 3 mandatory.
            </p>
          </div>
        )}

        {/* Block summary — one or more floors are infeasible */}
        {structuralChecks.blockCalculate && (
          <div className="p-4 rounded-[2px]" style={{ background: 'rgba(140,58,34,0.07)', border: '2px solid #8C3A22' }}>
            <p className="text-[13px] font-bold mb-1" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
              ⛔ Structural Design Issue Detected
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
              One or more floors have dimensions that cannot be safely built with standard RCC per IS 456:2000 and IS 1893:2016. Please revise floor areas or consult a licensed structural engineer before proceeding. NirmanShastra cannot estimate cost for structurally infeasible configurations.
            </p>
            <p className="text-[11px] mt-2" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>
              Ref: IS 456:2000 Cl 23.2.1 · IS 1893:2016 Table 6
            </p>
          </div>
        )}

        {/* Irregularity summary — issues exist but calculation not blocked */}
        {structuralChecks.hasIrregularity && !structuralChecks.blockCalculate && (
          <div className="p-4 rounded-[2px]" style={{ background: 'rgba(217,154,6,0.07)', border: '1.5px solid #D99A0660' }}>
            <p className="text-[13px] font-bold mb-1" style={{ color: '#7C5500', fontFamily: 'var(--font-plex-mono)' }}>
              ⚠️ Structural Irregularities Detected
            </p>
            <p className="text-[12px] leading-relaxed" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
              This building requires dynamic analysis per IS 1893:2016. This estimate is for budgeting reference only. A licensed structural engineer must validate the design before construction.
            </p>
            <p className="text-[11px] mt-2" style={{ color: '#7C5500', fontFamily: 'var(--font-plex-mono)' }}>
              Ref: IS 456:2000 Cl 23.2.1 · IS 1893:2016 Table 6 · IS 1893:2016 Cl 7.9
            </p>
          </div>
        )}

        <ElevationDiagram floorRows={floorRows} sameArea={sameArea} groundArea={groundArea} />
      </Sect>

      {/* ── S3: Site Conditions ───────────────────────────────────────────────── */}
      <Sect title="3 — What is your site like?">
        <AlertBox variant="info">
          Your site condition determines the foundation type and concrete cover thickness. If you are unsure, describe your site to a civil engineer — wrong foundation selection is expensive to fix later.
        </AlertBox>
        {errors.site && <p className="text-[12px] mb-2" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>⚠ {errors.site}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SITE_CARDS.map(card => (
            <button
              key={card.value}
              type="button"
              onClick={() => setSiteCondition(card.value)}
              className="p-3 rounded-[2px] border text-left transition-all"
              style={{
                borderColor: siteCondition === card.value ? '#1F4E79' : '#1E222720',
                background:  siteCondition === card.value ? '#1F4E7912' : 'white',
              }}
            >
              <div className="text-[18px] mb-1">{card.icon}</div>
              <div className="text-[12px] font-semibold" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{card.label}</div>
              <div className="text-[11px] mt-0.5" style={{ color: '#1E222770', fontFamily: 'var(--font-plex-sans)' }}>{card.note}</div>
            </button>
          ))}
        </div>

        {siteCondition === 'bcs' && (
          <AlertBox variant="error">
            <strong>Black Cotton Soil (BCS) detected.</strong> IS 1904:2016 requires under-reamed pile foundations. Conventional isolated footings MUST NOT be used — BCS swells with moisture and collapses in dry seasons. Geotechnical investigation (₹15,000–50,000) is mandatory.
          </AlertBox>
        )}
        {(siteCondition === 'soft_marshy' || siteCondition === 'waterlogged') && (
          <AlertBox variant="error">
            <strong>Soft / waterlogged soil.</strong> Bearing capacity may be as low as 50 kN/m². Raft or pile foundation is likely required. Do NOT start construction without a soil test report.
          </AlertBox>
        )}
        {siteCondition === 'coastal' && (
          <AlertBox variant="caution">
            <strong>Coastal exposure.</strong> IS 456:2000 Table 5 mandates M30 minimum concrete and 50mm cover. Salt ingress accelerates corrosion. Use stainless or epoxy-coated rebar within 500m of sea.
          </AlertBox>
        )}
        {siteCondition === 'rocky' && (
          <AlertBox variant="tip">
            <strong>Rocky terrain — advantage.</strong> Hard rock has bearing capacity of 3,300 kN/m² (IS 1904:2016). Foundation costs will be lower. Drilling and rock-cutting is required but the overall foundation is far safer.
          </AlertBox>
        )}

        {foundationRec && (
          <div className="mt-3 p-3 rounded-[2px]" style={{ background: '#14532D0A', border: '1px solid #14532D30' }}>
            <div className="flex items-start gap-2">
              <span className="text-[11px] font-medium" style={{ color: '#14532D', fontFamily: 'var(--font-plex-mono)', marginTop: 1 }}>RECOMMENDED</span>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{foundationRec.label}</p>
                <p className="text-[11px]" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>{foundationRec.isCode} · ₹{foundationRec.minCostPerSqft}–{foundationRec.maxCostPerSqft}/sqft</p>
                {foundationRec.warning && <p className="text-[12px] mt-1" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>⚠ {foundationRec.warning}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <label className="text-[12px]" style={{ color: '#1E2227A0', fontFamily: 'var(--font-plex-sans)' }}>Override foundation type:</label>
              <select
                className="px-2 py-1 rounded-[2px] border text-[12px]"
                style={{ borderColor: '#1E222730', color: '#1E2227', fontFamily: 'var(--font-plex-sans)', background: 'white' }}
                value={foundationOverride}
                onChange={e => setFoundationOverride(e.target.value)}
              >
                <option value="">Auto (recommended)</option>
                <option value="isolated">Isolated Footing</option>
                <option value="strip">Strip Footing</option>
                <option value="raft">Raft / Mat Foundation</option>
                <option value="pile">Pile Foundation</option>
                <option value="under_reamed">Under-Reamed Pile</option>
                <option value="rock_cut">Rock-Cut Footing</option>
              </select>
            </div>
          </div>
        )}
      </Sect>

      {/* ── S4: Scope ─────────────────────────────────────────────────────────── */}
      <Sect title="4 — What are you including in this estimate?">
        {/* Staircase */}
        <div className="p-4 rounded-[2px] border" style={{ borderColor: '#1E222720' }}>
          <div className="flex items-center gap-3 mb-3">
            <input type="checkbox" id="sc-stair" checked={staircase.include} onChange={e => setStaircase(s => ({ ...s, include: e.target.checked }))} style={{ accentColor: '#1F4E79', width: 16, height: 16 }} />
            <label htmlFor="sc-stair" className="text-[13px] font-semibold cursor-pointer" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
              Staircase
              <Tip id="staircase" open={activeTooltip} setOpen={setActiveTooltip} />
            </label>
          </div>
          {staircase.include && (
            <div className="grid grid-cols-3 gap-3 pl-6">
              <div>
                <label className={lCls} style={lStyle}>Type</label>
                <select className={iCls} style={iStyle} value={staircase.type} onChange={e => setStaircase(s => ({ ...s, type: e.target.value as typeof staircase.type }))}>
                  <option value="dogleg">Dog-leg (standard)</option>
                  <option value="straight">Straight flight</option>
                  <option value="open_well">Open well</option>
                </select>
              </div>
              <div>
                <label className={lCls} style={lStyle}>Clear width (mm)</label>
                <input className={iCls} style={{ ...iStyle, ...monoStyle }} type="number" min="900" value={staircase.widthMm} onChange={e => setStaircase(s => ({ ...s, widthMm: parseInt(e.target.value) || 1200 }))} />
                <p className="text-[11px] mt-0.5" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>NBC min: 900mm</p>
              </div>
              <div>
                <label className={lCls} style={lStyle}>Number of staircases</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setStaircase(s => ({ ...s, count: Math.max(1, s.count - 1) }))} className="w-8 h-8 rounded-[2px] border flex items-center justify-center text-lg" style={{ borderColor: '#1E222730' }}>−</button>
                  <span className="text-[14px] font-semibold w-8 text-center" style={monoStyle}>{staircase.count}</span>
                  <button type="button" onClick={() => setStaircase(s => ({ ...s, count: Math.min(4, s.count + 1) }))} className="w-8 h-8 rounded-[2px] border flex items-center justify-center text-lg" style={{ borderColor: '#1E222730' }}>+</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* OHT */}
        <div className="p-4 rounded-[2px] border" style={{ borderColor: '#1E222720' }}>
          <div className="flex items-center gap-3 mb-3">
            <input type="checkbox" id="sc-oht" checked={oht.include} onChange={e => setOht(o => ({ ...o, include: e.target.checked }))} style={{ accentColor: '#1F4E79', width: 16, height: 16 }} />
            <label htmlFor="sc-oht" className="text-[13px] font-semibold cursor-pointer" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
              Overhead Tank (OHT)
              <Tip id="oht" open={activeTooltip} setOpen={setActiveTooltip} />
            </label>
          </div>
          {oht.include && (
            <div className="pl-6 flex gap-6">
              {(['hdpe', 'rcc'] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="ohtType" checked={oht.type === t} onChange={() => setOht(o => ({ ...o, type: t }))} style={{ accentColor: '#1F4E79' }} />
                  <span className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                    {t === 'hdpe' ? 'HDPE (IS 12701) — lighter, no leak' : 'RCC slab tank — lower material cost'}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Parapet */}
        <div className="p-4 rounded-[2px] border" style={{ borderColor: '#1E222720' }}>
          <div className="flex items-center gap-3 mb-3">
            <input type="checkbox" id="sc-parapet" checked={parapet.include} onChange={e => setParapet(p => ({ ...p, include: e.target.checked }))} style={{ accentColor: '#1F4E79', width: 16, height: 16 }} />
            <label htmlFor="sc-parapet" className="text-[13px] font-semibold cursor-pointer" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
              Parapet (RCC band)
              <Tip id="parapet" open={activeTooltip} setOpen={setActiveTooltip} />
            </label>
          </div>
          {parapet.include && (
            <div className="pl-6 space-y-2">
              <div className="flex items-center gap-4">
                <div>
                  <label className={lCls} style={lStyle}>Height (mm)</label>
                  <input className="w-32 px-3 py-2 rounded-[2px] border text-[13px]" style={{ ...iStyle, ...monoStyle }} type="number" min="900" value={parapet.heightMm} onChange={e => setParapet(p => ({ ...p, heightMm: parseInt(e.target.value) || 900 }))} />
                  <span className="text-[11px] ml-2" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>NBC min: 900mm</span>
                </div>
              </div>
              <p className="text-[12px]" style={{ color: '#1E222780', fontFamily: 'var(--font-plex-sans)' }}>
                Note: RCC band built during structural pour. Brick/block infill covered by MasonryPro.
              </p>
            </div>
          )}
        </div>

        {/* Parking */}
        <div className="p-4 rounded-[2px] border" style={{ borderColor: isStiltSoftStorey ? '#D99A0640' : '#1E222720' }}>
          <label className="block text-[13px] font-semibold mb-3" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
            Parking
            <Tip id="parking" open={activeTooltip} setOpen={setActiveTooltip} />
          </label>
          <div className="space-y-2">
            {([['none', 'No covered parking'], ['stilt', 'Stilt Ground Floor (open columns)'], ['shed', 'Separate parking shed']] as const).map(([val, label]) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="parking" checked={parkingType === val} onChange={() => setParkingType(val)} style={{ accentColor: '#1F4E79' }} />
                <span className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</span>
              </label>
            ))}
          </div>
          {isStiltSoftStorey && (
            <div className="mt-3 p-3 rounded-[2px]" style={{ background: '#D99A0610', border: '1.5px solid #D99A0660' }}>
              <p className="text-[12px] font-semibold" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-mono)' }}>⚠ SOFT STOREY WARNING — IS 1893:2016 Cl 7.10</p>
              <p className="text-[12px] mt-1" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
                Stilt ground floor in Seismic Zone {effectiveZone} creates a structural irregularity. A licensed structural engineer must design the stilt frame with special detailing.
              </p>
            </div>
          )}
        </div>
      </Sect>

      {/* ── S5: Advanced Technical Specifications (collapsed) ─────────────────── */}
      <Sect title="Advanced Technical Specifications ▼" badge="IS Code Defaults Applied ✓" defaultOpen={false}>
        <AlertBox variant="info">
          Pre-set to <strong>IS-code safe defaults</strong> for residential construction. Change only if your structural engineer has specified different values. Wrong values here will produce incorrect material quantities.
        </AlertBox>

        {/* ── Seismic Zone ── */}
        <div className="p-4 rounded-[2px]" style={{ background: '#1F4E7908', border: '1px solid #1F4E7920' }}>
          <label className={lCls} style={lStyle}>
            Seismic Zone (IS 1893:2016)
            <Tip id="seismic" open={activeTooltip} setOpen={setActiveTooltip} />
          </label>
          <select
            className={iCls}
            style={{ ...iStyle, ...monoStyle }}
            value={seismicOverride || szInfo.zone}
            onChange={e => setSeismicOverride(e.target.value === szInfo.zone ? '' : e.target.value)}
          >
            <option value="II">Zone II — Low Risk (Karnataka, TN, AP, Telangana, MP, CG, Jharkhand, Odisha)</option>
            <option value="III">Zone III — Moderate (Maharashtra, Gujarat, Rajasthan, WB, Goa, Kerala)</option>
            <option value="IV">Zone IV — High (Delhi, Punjab, Haryana, Bihar, UP)</option>
            <option value="V">Zone V — Very High / NE India (Uttarakhand, HP, Sikkim, all NE states, J&amp;K, Ladakh)</option>
          </select>
          <p className="text-[11px] mt-1.5" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
            Auto-detected: Zone {szInfo.zone} from {localState || 'selected state'}
            {seismicOverride && seismicOverride !== szInfo.zone && <span className="ml-2 text-[#D99A06]">· Override active</span>}
          </p>
          {LARGE_MULTIZONE_STATES.includes(localState) && (
            <p className="text-[11px] mt-1.5 leading-relaxed" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
              ⚠ Large states (Maharashtra, UP, Rajasthan) span multiple zones — verify your city-level zone from IS 1893:2016 Annex E with your structural engineer.
            </p>
          )}
        </div>

        {/* ── Grade and Steel ── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lCls} style={lStyle}>
              Overall Concrete Grade
              <Tip id="concrete" open={activeTooltip} setOpen={setActiveTooltip} />
            </label>
            {specSelect(concreteGrade, v => setConcreteGrade(v as ConcreteGrade), [
              ['M20','M20 — Minimum IS 456 RCC'],
              ['M25','M25 — Zone III+ recommended'],
              ['M30','M30 — Severe exposure'],
              ['M35','M35 — Very severe exposure'],
              ['M40','M40 — Extreme / coastal'],
            ])}
            <p className="text-[11px] mt-0.5" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>IS 456:2000 min for RCC: M20</p>
          </div>
          <div>
            <label className={lCls} style={lStyle}>
              Steel Grade
              <Tip id="steel" open={activeTooltip} setOpen={setActiveTooltip} />
            </label>
            {specSelect(steelGrade, v => setSteelGrade(v as SteelGrade), [
              ['Fe415','Fe415 — Old standard'],
              ['Fe500','Fe500 — Standard residential'],
              ['Fe500D','Fe500D — Seismic Zone III-V (ductile)'],
              ['Fe550D','Fe550D — High-rise seismic'],
            ])}
            <p className="text-[11px] mt-0.5" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>IS 13920:2016 — Zone III+: Fe500D mandatory</p>
          </div>
        </div>

        {/* ── Bar Sizes ── */}
        <div>
          <p className="text-[11px] uppercase tracking-widest mb-3" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
            REINFORCEMENT BAR SIZES
            <Tip id="barsize" open={activeTooltip} setOpen={setActiveTooltip} />
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className={lCls} style={lStyle}>Column Main Bar</label>
              {specSelect(columnMainBar, setColumnMainBar, [
                ['12mm','12mm'],
                ['16mm','16mm (default)'],
                ['20mm','20mm'],
                ['25mm','25mm'],
              ])}
            </div>
            <div>
              <label className={lCls} style={lStyle}>Beam Main Bar</label>
              {specSelect(beamMainBar, setBeamMainBar, [
                ['12mm','12mm'],
                ['16mm','16mm (default)'],
                ['20mm','20mm'],
                ['25mm','25mm'],
              ])}
            </div>
            <div>
              <label className={lCls} style={lStyle}>Slab Bar</label>
              {specSelect(slabBar, setSlabBar, [
                ['8mm','8mm'],
                ['10mm','10mm (default)'],
                ['12mm','12mm'],
              ])}
            </div>
            <div>
              <label className={lCls} style={lStyle}>
                Stirrup / Link Bar
                <Tip id="stirrup" open={activeTooltip} setOpen={setActiveTooltip} />
              </label>
              {specSelect(stirrupBar, setStirrupBar, [
                ['8mm','8mm (default)'],
                ['10mm','10mm'],
              ])}
            </div>
          </div>
        </div>

        {/* ── Member Sizes ── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lCls} style={lStyle}>
              Column Size
              <Tip id="column" open={activeTooltip} setOpen={setActiveTooltip} />
            </label>
            {specSelect(columnSize, setColumnSize, [
              ['230×230mm','230×230mm (G+1 to G+2)'],
              ['300×300mm','300×300mm (G+3)'],
              ['350×350mm','350×350mm (default)'],
              ['400×400mm','400×400mm (heavy loads)'],
              ['450×450mm','450×450mm (commercial)'],
            ])}
          </div>
          <div>
            <label className={lCls} style={lStyle}>
              Slab Thickness
              <Tip id="slab" open={activeTooltip} setOpen={setActiveTooltip} />
            </label>
            {specSelect(String(slabThickness), v => setSlabThickness(parseInt(v)), [
              ['100','100mm'],
              ['125','125mm (default)'],
              ['150','150mm'],
              ['175','175mm'],
            ])}
            <p className="text-[11px] mt-0.5" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>IS 456:2000 min: 125mm</p>
          </div>
        </div>

        {/* ── Concrete Grades per Member ── */}
        <div>
          <p className="text-[11px] uppercase tracking-widest mb-3" style={{ color: '#1F4E79', fontFamily: 'var(--font-plex-mono)' }}>
            CONCRETE GRADES PER MEMBER (IS 456:2000)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className={lCls} style={lStyle}>
                PCC Below Foundation
                <Tip id="pcc" open={activeTooltip} setOpen={setActiveTooltip} />
              </label>
              {specSelect(pccGrade, setPccGrade, [
                ['M10','M10 (1:3:6)'],
                ['M15','M15 (1:2:4) — default'],
              ])}
            </div>
            <div>
              <label className={lCls} style={lStyle}>
                Foundation Concrete
                <Tip id="foundconc" open={activeTooltip} setOpen={setActiveTooltip} />
              </label>
              {specSelect(foundationConcreteGrade, setFoundationConcreteGrade, [
                ['M20','M20 (default)'],
                ['M25','M25'],
                ['M30','M30'],
              ])}
            </div>
            <div>
              <label className={lCls} style={lStyle}>
                Column Concrete
                <Tip id="colconc" open={activeTooltip} setOpen={setActiveTooltip} />
              </label>
              {specSelect(columnConcreteGrade, setColumnConcreteGrade, [
                ['M20','M20'],
                ['M25','M25 (default)'],
                ['M30','M30'],
                ['M35','M35'],
                ['M40','M40'],
              ])}
            </div>
            <div>
              <label className={lCls} style={lStyle}>
                Beam Concrete
                <Tip id="beamconc" open={activeTooltip} setOpen={setActiveTooltip} />
              </label>
              {specSelect(beamConcreteGrade, setBeamConcreteGrade, [
                ['M20','M20'],
                ['M25','M25 (default)'],
                ['M30','M30'],
                ['M35','M35'],
              ])}
            </div>
            <div>
              <label className={lCls} style={lStyle}>
                Slab Concrete
                <Tip id="slabconc" open={activeTooltip} setOpen={setActiveTooltip} />
              </label>
              {specSelect(slabConcreteGrade, setSlabConcreteGrade, [
                ['M20','M20 (default)'],
                ['M25','M25'],
                ['M30','M30'],
              ])}
            </div>
          </div>
        </div>

        {/* ── Foundation & Soil ── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lCls} style={lStyle}>
              Soil Bearing Capacity
              <Tip id="soilbearing" open={activeTooltip} setOpen={setActiveTooltip} />
            </label>
            {specSelect(soilBearingCapacity, setSoilBearingCapacity, [
              ['Very Soft <100','Very Soft &lt;100 kN/m²'],
              ['Soft 100-150','Soft 100–150 kN/m²'],
              ['Medium 150-200','Medium 150–200 kN/m² (default)'],
              ['Stiff 200-300','Stiff 200–300 kN/m²'],
              ['Hard Rock >300','Hard Rock &gt;300 kN/m²'],
            ])}
          </div>
          <div>
            <label className={lCls} style={lStyle}>
              Foundation Depth (m)
              <Tip id="foundation" open={activeTooltip} setOpen={setActiveTooltip} />
            </label>
            <input
              className={iCls}
              style={{ ...iStyle, ...monoStyle }}
              type="number"
              min="0.5"
              max="5.0"
              step="0.1"
              value={foundationDepthM}
              onChange={e => setFoundationDepthM(parseFloat(e.target.value) || 1.5)}
            />
            <p className="text-[11px] mt-0.5" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>IS 1904:2016 min: 0.5m · default 1.5m</p>
          </div>
          <div>
            <label className={lCls} style={lStyle}>
              Plinth Height (m)
              <Tip id="plinth" open={activeTooltip} setOpen={setActiveTooltip} />
            </label>
            <input
              className={iCls}
              style={{ ...iStyle, ...monoStyle }}
              type="number"
              min="0.3"
              max="1.5"
              step="0.05"
              value={plinthHeight}
              onChange={e => setPlinthHeight(parseFloat(e.target.value) || 0.6)}
            />
            <p className="text-[11px] mt-0.5" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>NBC 2016 recommendation: min 0.45m · default 0.6m</p>
          </div>
          <div>
            <label className={lCls} style={lStyle}>
              Exposure Class
              <Tip id="exposure" open={activeTooltip} setOpen={setActiveTooltip} />
            </label>
            <div className="px-3 py-2 rounded-[2px] border text-[13px]" style={{ ...iStyle, background: '#F4F4F0', ...monoStyle }}>
              {exposureClass.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} (auto from site)
            </div>
          </div>
          <div>
            <label className={lCls} style={lStyle}>
              Concrete Cover (mm)
              <Tip id="cover" open={activeTooltip} setOpen={setActiveTooltip} />
            </label>
            <div className="px-3 py-2 rounded-[2px] border text-[13px]" style={{ ...iStyle, background: '#F4F4F0', ...monoStyle }}>
              {coverMm} mm (IS 456:2000 Table 16 — read-only)
            </div>
          </div>
        </div>
      </Sect>

      {/* ── Step 3a: Continue button ─────────────────────────────────────────── */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setSubStep('3b')}
          className="w-full py-3 rounded-[6px] font-semibold text-[15px] transition-all"
          style={{ background: '#1F4E79', color: '#F4F4F0', fontFamily: 'var(--font-plex-sans)' }}
        >
          Continue to Material Rates →
        </button>
      </div>
      </>)}

      {/* ── Step 3b: Material Rates ──────────────────────────────────────────── */}
      {subStep === '3b' && (<>
        <div>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>3b · MATERIAL RATES</p>
          <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 24, fontWeight: 700, color: '#1E2227', lineHeight: 1.2 }}>Enter Your Local Material Rates</h3>
        </div>

        <div className="p-4 rounded-[2px]" style={{ background: 'rgba(31,78,121,0.05)', border: '1px solid rgba(31,78,121,0.2)' }}>
          <p className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
            <strong>Why local rates matter:</strong> We calculate exact quantities using IS codes — quantities are universal. But material prices vary by 20–40% between cities. Enter your local dealer rates for an accurate budget. India averages are pre-filled as a starting point.
          </p>
        </div>

        <AlertBox variant="caution">
          Get quotes from <strong>at least 3 suppliers</strong>. Contractor-supplied material is typically 8–15% above market rate.
        </AlertBox>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: 'cement',      label: 'Cement',            unit: '₹/50kg bag', avg: INDIA_AVG_2026.cement,      tip: 'OPC 43/53. Fly ash PPC is cheaper but slower cure. IS 456:2000 permits both.' },
            { key: 'steel',       label: 'Steel TMT Fe500',   unit: '₹/kg',       avg: INDIA_AVG_2026.steel,       tip: 'Fe500D preferred in seismic zones III–V. IS 1786:2008.' },
            { key: 'sand',        label: 'Sand (M-sand)',     unit: '₹/cft',      avg: INDIA_AVG_2026.sand,        tip: 'River sand or M-sand. IS 383:2016. Prices vary 40% by region.' },
            { key: 'aggregate',   label: 'Aggregate 20mm',    unit: '₹/cft',      avg: INDIA_AVG_2026.aggregate,   tip: '20mm coarse aggregate. IS 383:2016.' },
            { key: 'formwork',    label: 'Formwork',          unit: '₹/sqft BUA', avg: INDIA_AVG_2026.formwork,    tip: 'Shuttering material estimate per sqft of built-up area.' },
            { key: 'antiTermite', label: 'Anti-termite',      unit: '₹/sqft',     avg: INDIA_AVG_2026.antiTermite, tip: 'IS 6313 treatment mandatory in termite-prone zones.' },
            { key: 'bindingWire', label: 'Binding Wire',      unit: '₹/kg',       avg: INDIA_AVG_2026.bindingWire, tip: 'Annealed wire 1.6mm. IS 280.' },
            { key: 'pccM10',      label: 'PCC M10 lean mix',  unit: '₹/m³',       avg: INDIA_AVG_2026.pccM10,      tip: 'Plain cement concrete below footing. 1:3:6 mix.' },
          ].map(({ key, label, unit, avg, tip }) => (
            <div key={key} className="p-3 rounded-[2px]" style={{ border: '1px solid rgba(30,34,39,0.15)', background: '#fff' }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-[13px] font-medium" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'rgba(30,34,39,0.4)', fontFamily: 'var(--font-plex-mono)' }}>{unit}</p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-[2px] whitespace-nowrap" style={{ background: 'rgba(30,34,39,0.05)', color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-mono)' }}>
                  India Avg: ₹{avg}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                <input
                  type="number"
                  className="w-full pl-7 pr-3 py-2 rounded-[6px] border text-[13px]"
                  style={{ borderColor: 'rgba(30,34,39,0.3)', color: '#1E2227', fontFamily: 'var(--font-plex-mono)', background: '#fff' }}
                  min="0"
                  value={rates[key as keyof typeof rates]}
                  onChange={e => setRates(r => ({ ...r, [key]: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: 'rgba(30,34,39,0.5)', fontFamily: 'var(--font-plex-sans)' }}>{tip}</p>
              {REGIONAL_NOTES[key] && <RegionalNote>{REGIONAL_NOTES[key]}</RegionalNote>}
            </div>
          ))}
        </div>

        {customMaterials.map((cm, idx) => (
          <div key={cm.id} className="flex items-end gap-2 mt-2">
            <div className="flex-1">
              <label className={lCls} style={lStyle}>Material Name</label>
              <input className={iCls} style={iStyle} placeholder="e.g. AAC blocks" value={cm.name} onChange={e => setCustomMaterials(prev => prev.map((m, i) => i === idx ? { ...m, name: e.target.value } : m))} />
            </div>
            <div className="w-36">
              <label className={lCls} style={lStyle}>Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                <input className="w-full pl-7 pr-3 py-2 rounded-[6px] border text-[13px]" style={{ ...iStyle, fontFamily: 'var(--font-plex-mono)', color: '#1E2227' }} type="number" value={cm.rate} onChange={e => setCustomMaterials(prev => prev.map((m, i) => i === idx ? { ...m, rate: e.target.value } : m))} />
              </div>
            </div>
            <button type="button" onClick={() => setCustomMaterials(prev => prev.filter((_, i) => i !== idx))} className="px-3 py-2 text-[12px] rounded-[6px]" style={{ color: '#8C3A22', border: '1px solid #8C3A2230' }}>Remove</button>
          </div>
        ))}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={addCustomMaterial} className="px-4 py-2 rounded-[6px] text-[12px] font-medium transition-colors" style={{ background: '#1F4E7912', color: '#1F4E79', border: '1px solid #1F4E7930', fontFamily: 'var(--font-plex-sans)' }}>
            + Add Material
          </button>
          <button type="button" onClick={() => setRates({ ...INDIA_AVG_2026 })} className="px-4 py-2 rounded-[6px] text-[12px] transition-colors" style={{ color: '#1E222780', border: '1px solid #1E222730', fontFamily: 'var(--font-plex-sans)' }}>
            Reset to India Average
          </button>
        </div>

        <Sect title="Contractor Quote (Optional)" defaultOpen={false}>
        <AlertBox variant="tip">
          <strong>India Average 2026</strong> rates are pre-loaded. Edit only if you have confirmed rates from your local supplier. Rates vary 20–30% depending on city and transport distance.
        </AlertBox>
        <AlertBox variant="caution">
          Get quotes from <strong>at least 3 suppliers</strong>. Contractor-supplied material is typically 8–15% above market rate.
        </AlertBox>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'cement',      label: 'Cement (₹/50kg bag)', unit: '/bag' },
            { key: 'steel',       label: 'Steel TMT Fe500 (₹/kg)', unit: '/kg' },
            { key: 'sand',        label: 'Sand (₹/cft)', unit: '/cft' },
            { key: 'aggregate',   label: 'Aggregate 20mm (₹/cft)', unit: '/cft' },
            { key: 'formwork',    label: 'Formwork (₹/sqft BUA)', unit: '/sqft' },
            { key: 'antiTermite', label: 'Anti-termite treatment (₹/sqft)', unit: '/sqft' },
            { key: 'bindingWire', label: 'Binding Wire (₹/kg)', unit: '/kg' },
            { key: 'pccM10',      label: 'PCC M10 lean mix (₹/m³)', unit: '/m³' },
          ].map(({ key, label, unit }) => (
            <div key={key}>
              <label className={lCls} style={lStyle}>{label}</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                  <input
                    className="w-full pl-7 pr-3 py-2 rounded-[2px] border text-[13px]"
                    style={{ ...iStyle, ...monoStyle }}
                    type="number"
                    min="0"
                    value={rates[key as keyof typeof rates]}
                    onChange={e => setRates(r => ({ ...r, [key]: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                {avgTag(INDIA_AVG_2026[key as keyof typeof INDIA_AVG_2026], unit)}
              </div>
              {REGIONAL_NOTES[key] && <RegionalNote>{REGIONAL_NOTES[key]}</RegionalNote>}
            </div>
          ))}
        </div>

        {customMaterials.map((cm, idx) => (
          <div key={cm.id} className="flex items-end gap-2 mt-2">
            <div className="flex-1">
              <label className={lCls} style={lStyle}>Material Name</label>
              <input className={iCls} style={iStyle} placeholder="e.g. AAC blocks" value={cm.name} onChange={e => setCustomMaterials(prev => prev.map((m, i) => i === idx ? { ...m, name: e.target.value } : m))} />
            </div>
            <div className="w-36">
              <label className={lCls} style={lStyle}>Rate</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                <input className="w-full pl-7 pr-3 py-2 rounded-[2px] border text-[13px]" style={{ ...iStyle, ...monoStyle }} type="number" value={cm.rate} onChange={e => setCustomMaterials(prev => prev.map((m, i) => i === idx ? { ...m, rate: e.target.value } : m))} />
              </div>
            </div>
            <button type="button" onClick={() => setCustomMaterials(prev => prev.filter((_, i) => i !== idx))} className="px-3 py-2 text-[12px] rounded-[2px]" style={{ color: '#8C3A22', border: '1px solid #8C3A2230' }}>Remove</button>
          </div>
        ))}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={addCustomMaterial} className="px-4 py-2 rounded-[2px] text-[12px] font-medium transition-colors" style={{ background: '#1F4E7912', color: '#1F4E79', border: '1px solid #1F4E7930', fontFamily: 'var(--font-plex-sans)' }}>
            + Add Material
          </button>
          <button type="button" onClick={() => setRates({ ...INDIA_AVG_2026 })} className="px-4 py-2 rounded-[2px] text-[12px] transition-colors" style={{ color: '#1E222780', border: '1px solid #1E222730', fontFamily: 'var(--font-plex-sans)' }}>
            Reset to India Average
          </button>
        </div>
      </Sect>

      {/* ── S7: Contractor Quote ──────────────────────────────────────────────── */}
      <Sect title="Advanced Settings ▼ — Contractor Quote (Optional)" defaultOpen={false}>
        <AlertBox variant="info">
          Enter your contractor&apos;s quote now to <strong>compare it line-by-line</strong> against our IS-code calculated quantities after payment. We flag inflated quantities, missing items, and rate manipulation automatically.
        </AlertBox>
        <p className="text-[12px]" style={{ color: '#1E222780', fontFamily: 'var(--font-plex-sans)' }}>
          Select what the contractor provided:
        </p>
        <div className="space-y-2">
          {([
            ['total',     'Total project quote only (single lump sum)'],
            ['materials', 'Materials cost only (you arrange labour separately)'],
            ['breakdown', 'Full breakdown — concrete rate + steel rate + formwork rate'],
          ] as const).map(([val, label]) => (
            <label key={val} className="flex items-center gap-2 cursor-pointer p-2 rounded-[2px] transition-colors" style={{ background: quoteMode === val ? '#1F4E7910' : 'transparent' }}>
              <input type="radio" name="quoteMode" checked={quoteMode === val} onChange={() => setQuoteMode(val)} style={{ accentColor: '#1F4E79' }} />
              <span className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{label}</span>
            </label>
          ))}
        </div>

        <div className="space-y-3 mt-3 pt-3" style={{ borderTop: '1px solid #1E222715' }}>
          <div>
            <label className={lCls} style={lStyle}>Contractor / Company Name (optional)</label>
            <input className={iCls} style={iStyle} placeholder="e.g. Mehta Construction Co." value={contractorName} onChange={e => setContractorName(e.target.value)} />
          </div>

          {(quoteMode === 'total' || quoteMode === 'materials') && (
            <div>
              <label className={lCls} style={lStyle}>{quoteMode === 'total' ? 'Total Quote (₹)' : 'Materials Quote (₹)'}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                <input className="w-full pl-7 pr-3 py-2 rounded-[2px] border text-[13px]" style={{ ...iStyle, ...monoStyle }} type="number" min="0" placeholder="0" value={contractorTotal} onChange={e => setContractorTotal(e.target.value)} />
              </div>
            </div>
          )}

          {quoteMode === 'breakdown' && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Concrete rate (₹/m³)', val: ctConcreteRate, set: setCtConcreteRate },
                { label: 'Steel rate (₹/kg)',    val: ctSteelRate,    set: setCtSteelRate },
                { label: 'Formwork (₹/sqft)',    val: ctFormworkRate, set: setCtFormworkRate },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label className={lCls} style={lStyle}>{label}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px]" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>₹</span>
                    <input className="w-full pl-7 pr-3 py-2 rounded-[2px] border text-[13px]" style={{ ...iStyle, ...monoStyle }} type="number" min="0" placeholder="0" value={val} onChange={e => set(e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Sect>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => setSubStep('3c')}
            className="flex-1 py-3 rounded-[6px] font-semibold text-[15px] transition-all"
            style={{ background: '#1F4E79', color: '#F4F4F0', fontFamily: 'var(--font-plex-sans)' }}
          >
            Continue to Labour →
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-[6px] font-semibold text-[15px] transition-all"
            style={{ background: 'transparent', color: '#8C3A22', border: '1.5px solid #8C3A22', fontFamily: 'var(--font-plex-sans)' }}
          >
            Skip Labour — Calculate Now →
          </button>
        </div>
      </>)}

      {/* ── Step 3c: Labour ──────────────────────────────────────────────────── */}
      {subStep === '3c' && (<>
        <div>
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>3c · LABOUR ESTIMATION</p>
          <h3 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 24, fontWeight: 700, color: '#1E2227', lineHeight: 1.2 }}>Include Labour Cost? (Optional)</h3>
        </div>

        <div className="p-4 rounded-[2px]" style={{ background: 'rgba(31,78,121,0.05)', border: '1px solid rgba(31,78,121,0.2)' }}>
          <p className="text-[13px]" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>
            Labour costs vary significantly with season (monsoon shutdowns, festival breaks), location, and site conditions. CPWD DSR 2023 rates are government benchmarks — actual rates typically differ by ±20–30%.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setIncludeLabour(true)}
            className="p-4 rounded-[2px] text-left transition-all"
            style={{ border: `2px solid ${includeLabour ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`, background: includeLabour ? 'rgba(31,78,121,0.06)' : '#fff' }}
          >
            <p className="text-[15px] font-semibold mb-1" style={{ color: includeLabour ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Include Labour Cost</p>
            <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>Use CPWD DSR 2023 rates. Edit workers, rates, and productivity per trade. Labour appears only in paid PDF report.</p>
          </button>
          <button
            type="button"
            onClick={() => setIncludeLabour(false)}
            className="p-4 rounded-[2px] text-left transition-all"
            style={{ border: `2px solid ${!includeLabour ? '#1F4E79' : 'rgba(30,34,39,0.18)'}`, background: !includeLabour ? 'rgba(31,78,121,0.06)' : '#fff' }}
          >
            <p className="text-[15px] font-semibold mb-1" style={{ color: !includeLabour ? '#1F4E79' : '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>Skip — Material Cost Only</p>
            <p className="text-[12px]" style={{ color: 'rgba(30,34,39,0.55)', fontFamily: 'var(--font-plex-sans)' }}>Get IS-code material quantities and cost. Add labour later from your contractor quote.</p>
          </button>
        </div>

        {includeLabour && (<>
          <AlertBox variant="caution">
            <strong>CPWD DSR 2023 rates</strong> are government-procurement benchmarks. Private residential work typically differs by ±20–30%. The number of working days depends on curing intervals, monsoon shutdowns, festival breaks, sand bans, and local conditions — these cannot be predicted by software. <em>Labour total appears only in your paid PDF report.</em>
          </AlertBox>
          <AlertBox variant="tip">
            <strong>Enter 0 workers</strong> to exclude any trade from the estimate entirely.
          </AlertBox>

          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr style={{ background: '#1E22270A' }}>
                  {['Active', 'Trade', 'Workers', 'Rate/Day (₹)', 'CPWD Productivity (editable)', 'Days'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)', borderBottom: '1px solid #1E222720' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                  {trades.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #1E222710', opacity: t.active ? 1 : 0.45 }}>
                      <td className="px-3 py-2">
                        <input type="checkbox" checked={t.active} onChange={e => updateTrade(t.id, 'active', e.target.checked)} style={{ accentColor: '#1F4E79' }} />
                      </td>
                      <td className="px-3 py-2" style={{ color: '#1E2227', fontFamily: 'var(--font-plex-sans)' }}>{t.name}</td>
                      <td className="px-2 py-1">
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => updateTrade(t.id, 'workers', Math.max(0, t.workers - 1))} className="w-6 h-6 rounded-[2px] border text-[12px] flex items-center justify-center" style={{ borderColor: '#1E222730' }}>−</button>
                          <input
                            className="w-10 text-center px-1 py-0.5 rounded-[2px] border text-[12px]"
                            style={{ ...iStyle, ...monoStyle }}
                            type="number"
                            min="0"
                            value={t.workers}
                            onChange={e => updateTrade(t.id, 'workers', parseInt(e.target.value) || 0)}
                          />
                          <button type="button" onClick={() => updateTrade(t.id, 'workers', t.workers + 1)} className="w-6 h-6 rounded-[2px] border text-[12px] flex items-center justify-center" style={{ borderColor: '#1E222730' }}>+</button>
                        </div>
                        <p className="text-[9px] mt-0.5" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>0 = exclude</p>
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex items-center gap-1">
                          <input className="w-20 px-2 py-1 rounded-[2px] border text-[12px]" style={{ ...iStyle, ...monoStyle }} type="number" value={t.ratePerDay} onChange={e => updateTrade(t.id, 'ratePerDay', parseInt(e.target.value) || 0)} />
                          <span className="text-[11px] whitespace-nowrap" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>avg: {t.indiaAvgRate}</span>
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex items-center gap-1">
                          <input
                            className="w-16 px-2 py-1 rounded-[2px] border text-[12px]"
                            style={{ ...iStyle, ...monoStyle }}
                            value={t.productivity}
                            onChange={e => updateTrade(t.id, 'productivity', e.target.value)}
                            placeholder={t.stdProductivity}
                          />
                          <span className="text-[11px] whitespace-nowrap" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-mono)' }}>std: {t.stdProductivity}</span>
                          {/* Unique id per row so only that row's tooltip opens */}
                          <Tip id={`cpwd-${t.id}`} infoId="cpwd" open={activeTooltip} setOpen={setActiveTooltip} />
                        </div>
                      </td>
                      <td className="px-2 py-1">
                        <input className="w-16 px-2 py-1 rounded-[2px] border text-[12px]" style={{ ...iStyle, ...monoStyle }} placeholder="auto" value={t.daysManual} onChange={e => updateTrade(t.id, 'daysManual', e.target.value)} />
                      </td>
                    </tr>
                  ))}
                  {customTrades.map((ct, idx) => (
                    <tr key={ct.id} style={{ borderBottom: '1px solid #1E222710' }}>
                      <td className="px-3 py-2"><input type="checkbox" defaultChecked style={{ accentColor: '#1F4E79' }} /></td>
                      <td className="px-2 py-1">
                        <input className="w-full px-2 py-1 rounded-[2px] border text-[12px]" style={iStyle} placeholder="Trade name" value={ct.name} onChange={e => setCustomTrades(prev => prev.map((t, i) => i === idx ? { ...t, name: e.target.value } : t))} />
                      </td>
                      <td className="px-2 py-1">
                        <input className="w-16 px-2 py-1 rounded-[2px] border text-[12px]" style={{ ...iStyle, ...monoStyle }} type="number" value={ct.workers} onChange={e => setCustomTrades(prev => prev.map((t, i) => i === idx ? { ...t, workers: e.target.value } : t))} />
                      </td>
                      <td className="px-2 py-1">
                        <input className="w-20 px-2 py-1 rounded-[2px] border text-[12px]" style={{ ...iStyle, ...monoStyle }} type="number" value={ct.ratePerDay} onChange={e => setCustomTrades(prev => prev.map((t, i) => i === idx ? { ...t, ratePerDay: e.target.value } : t))} />
                      </td>
                      <td className="px-2 py-1"><span className="text-[12px]" style={{ color: '#1E222750' }}>—</span></td>
                      <td className="px-2 py-1">
                        <div className="flex gap-1">
                          <input className="w-16 px-2 py-1 rounded-[2px] border text-[12px]" style={{ ...iStyle, ...monoStyle }} type="number" value={ct.days} onChange={e => setCustomTrades(prev => prev.map((t, i) => i === idx ? { ...t, days: e.target.value } : t))} />
                          <button type="button" onClick={() => setCustomTrades(prev => prev.filter((_, i) => i !== idx))} className="text-[11px] px-1" style={{ color: '#8C3A22' }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button type="button" onClick={addCustomTrade} className="px-4 py-2 rounded-[2px] text-[12px] font-medium" style={{ background: '#1F4E7912', color: '#1F4E79', border: '1px solid #1F4E7930', fontFamily: 'var(--font-plex-sans)' }}>
              + Add Your Own Labour
            </button>
            <p className="text-[11px]" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-sans)' }}>
              Labour subtotals are shown only in your paid PDF report — never on this form.
            </p>
          </>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={structuralChecks.blockCalculate}
            className="w-full py-3 rounded-[2px] font-semibold text-[15px] transition-all"
            style={{
              background: structuralChecks.blockCalculate ? '#8C3A2240' : '#1F4E79',
              color: structuralChecks.blockCalculate ? '#8C3A22' : '#F4F4F0',
              fontFamily: 'var(--font-plex-sans)',
              cursor: structuralChecks.blockCalculate ? 'not-allowed' : 'pointer',
              border: structuralChecks.blockCalculate ? '1.5px solid #8C3A2260' : 'none',
            }}
          >
            {structuralChecks.blockCalculate ? '⛔ Fix Structural Issues to Continue' : 'Calculate My Estimate →'}
          </button>
          {structuralChecks.blockCalculate && (
            <p className="text-[11px] text-center mt-2" style={{ color: '#8C3A22', fontFamily: 'var(--font-plex-sans)' }}>
              One or more floors have infeasible cantilever dimensions. Revise floor areas above.
            </p>
          )}
          {!structuralChecks.blockCalculate && (
            <p className="text-[11px] text-center mt-2" style={{ color: '#1E222760', fontFamily: 'var(--font-plex-sans)' }}>
              Free: grand total range + IS compliance checks. Itemised BOQ requires ₹499 unlock.
            </p>
          )}
        </div>
      </>)}
    </form>
  )
}
