'use client'

import { useState } from 'react'
import Link from 'next/link'

interface FaqItem {
  question: string
  answer: string
}

interface FaqCategory {
  label: string
  code: string
  items: FaqItem[]
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    label: 'General',
    code: 'GEN',
    items: [
      {
        question: 'What is NirmanShastra?',
        answer:
          'NirmanShastra is an IS-code backed construction cost estimation platform for Indian homeowners and builders. It calculates material quantities and costs using the exact values specified in Indian Standards (IS 456:2000, IS 1786:2008, IS 1893:2016, IS 1077:1992, IS 732:2019, IS 1172:1993) — so your estimates are defensible, not guesses.',
      },
      {
        question: 'Who is NirmanShastra for?',
        answer:
          'Primarily for homeowners who are planning to build or renovate and want to verify contractor quotes. Also useful for civil engineers who need a quick BOQ baseline, project managers cross-checking material orders, and anyone who wants to understand what their building actually costs at an IS-code level.',
      },
      {
        question: 'Do I need to know construction to use these tools?',
        answer:
          'No. Each tool asks questions in plain English — floor area, number of floors, city, soil type. You do not need to know what M20 concrete is or how to read a structural drawing. The tool applies the IS-code norms and explains what they mean for your specific situation.',
      },
      {
        question: 'How is NirmanShastra different from asking a contractor for a quote?',
        answer:
          'A contractor\'s quote is their number. NirmanShastra\'s estimate is derived from Indian Standards — public, verifiable, and independent of any contractor relationship. When you have both, you can compare quantities line by line and ask for an explanation of any variance.',
      },
    ],
  },
  {
    label: 'Pricing',
    code: 'PRC',
    items: [
      {
        question: 'How much does it cost?',
        answer:
          'VastuPro (Vastu compliance analysis) is completely free — no payment, no signup required. Each of the five paid estimation tools (StructurePro, MasonryPro, ElectricalPro, PlumbingPro, InteriorPro) costs ₹499 per report. A bundle of all five costs ₹1,999.',
      },
      {
        question: 'What do I get for ₹499?',
        answer:
          'A detailed IS-code compliant Bill of Quantities (BOQ) for your specific project — with material quantities, applicable IS clause references, IS compliance panel, Grand Total at three quality tiers (Basic/Standard/Premium), and a downloadable PDF report you can share with contractors or your structural engineer.',
      },
      {
        question: 'Can I see a sample before paying?',
        answer:
          'Yes. Each tool shows you blurred previews of the quantity table before payment — you can see the structure and IS clause references. The actual numbers unlock after payment verification.',
      },
      {
        question: 'Are the prices inclusive of taxes?',
        answer:
          'All prices shown are inclusive of GST. ₹499 is what you pay; there are no additional charges at checkout.',
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
          'Each tool is built on the relevant Indian Standards: StructurePro uses IS 456:2000 (concrete) and IS 1893:2016 (seismic); MasonryPro uses IS 1077:1992 (bricks) and IS 2250:1981 (mortar); ElectricalPro uses IS 732:2019 (wiring); PlumbingPro uses IS 1172:1993 (water requirements) and IS 4985:2000 (CPVC pipes); VastuPro uses the Vastu Purusha Mandala framework.',
      },
      {
        question: 'Are the IS code values accurate and up to date?',
        answer:
          'Yes. The core IS values — cement consumption, steel quantities, brick counts, mortar ratios — are locked from the published IS documents and are never altered. The StructurePro engine uses M20 = 8.07 bags/m³, column steel = 196.25 kg/m³, and other values exactly as specified in the standards.',
      },
      {
        question: 'Why does my seismic zone matter for the structural estimate?',
        answer:
          'IS 1893:2016 assigns different design lateral forces to each seismic zone. Higher zones (IV and V, covering Delhi, Guwahati, Srinagar) require more steel detailing and potentially higher concrete grades per IS 13920:2016. StructurePro auto-detects your seismic zone from your state and applies the correct parameters.',
      },
      {
        question: 'What does the IS compliance panel check?',
        answer:
          'StructurePro checks six IS compliance items: concrete grade vs IS 456 exposure class, minimum steel ratio, cover requirements per IS 456 Clause 26.4, seismic zone adequacy per IS 1893, foundation depth vs soil type, and minimum slab thickness. Each check returns a PASS / ADVISORY / FAIL stamp with the relevant IS clause cited.',
      },
    ],
  },
  {
    label: 'Technical',
    code: 'TECH',
    items: [
      {
        question: 'How accurate are the estimates?',
        answer:
          'The quantity calculations are IS-code accurate — the cement bags, steel weight, brick count, and pipe lengths are derived from the same formulas a structural engineer uses. Material rates are updated periodically based on CPWD Delhi Schedule of Rates and regional averages. Expect ±10% on material quantities vs a detailed BOQ from your engineer, and ±15% on total cost due to regional rate variation.',
      },
      {
        question: 'Why does the tool ask for my city and soil type?',
        answer:
          'City determines your seismic zone (IS 1893) and the applicable exposure class (IS 456 — coastal cities have more aggressive exposure, requiring higher-grade concrete). Soil type determines foundation depth and bearing capacity, which affects concrete volume in footings.',
      },
      {
        question: 'Does the estimate include labour costs?',
        answer:
          'Material costs are calculated from IS-derived quantities × current market rates. Labour is shown as a percentage of material cost, based on CPWD norms. The two are shown separately so you can substitute local labour rates if you have them.',
      },
      {
        question: 'Can I use NirmanShastra for commercial buildings?',
        answer:
          'The tools are designed for residential construction up to G+3 (ground plus three floors). For larger commercial projects, the IS codes still apply but structural design requires a licensed structural engineer and detailed drawings — the tool estimates can serve as a cross-check baseline, not a substitute for professional design.',
      },
      {
        question: 'Why are local rates important and how do I use them?',
        answer:
          'Construction material rates vary significantly by region — steel in Chennai vs Delhi can differ by ₹2–4/kg; sand and aggregate prices depend on local quarry availability. Each tool shows a "Using [City] Avg 2026" baseline with a note that you can substitute local rates from your area for a more precise total.',
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
          'Yes. Payments are processed by Razorpay — India\'s leading payment gateway, PCI-DSS compliant. NirmanShastra never stores your card details. Payment verification uses HMAC SHA256 server-side signature verification before any paid content is revealed.',
      },
      {
        question: 'Can I get a refund?',
        answer:
          'If the tool fails to generate your report due to a technical error on our side, you are entitled to a full refund. Please email support within 24 hours with your order ID. Refunds are not provided for completed, successfully generated reports — since the IS-code calculations are instantaneous and the report is delivered digitally.',
      },
      {
        question: 'What payment methods are accepted?',
        answer:
          'All methods available through Razorpay: UPI (PhonePe, Google Pay, Paytm), debit cards, credit cards, net banking, and Razorpay wallets.',
      },
    ],
  },
]

function AccordionItem({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  const mono = { fontFamily: 'var(--font-plex-mono)' } as React.CSSProperties
  const serif = { fontFamily: 'var(--font-plex-serif)' } as React.CSSProperties
  const sans = { fontFamily: 'var(--font-plex-sans)' } as React.CSSProperties

  return (
    <div style={{ borderBottom: '1px solid rgba(30,34,39,0.1)' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '18px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
        }}
        aria-expanded={isOpen}
      >
        <span style={{ ...serif, fontSize: 16, fontWeight: 600, color: '#1E2227', lineHeight: 1.4, flex: 1 }}>
          {item.question}
        </span>
        <span style={{
          ...mono,
          fontSize: 16,
          color: '#1F4E79',
          flexShrink: 0,
          transform: isOpen ? 'rotate(45deg)' : 'none',
          transition: 'transform 0.2s',
          marginTop: 2,
          display: 'inline-block',
        }}>
          +
        </span>
      </button>
      {isOpen && (
        <div style={{ paddingBottom: 20, paddingRight: 32 }}>
          <p style={{ ...sans, fontSize: 15, color: 'rgba(30,34,39,0.75)', lineHeight: 1.75, margin: 0 }}>
            {item.answer}
          </p>
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({})
  const [activeCategory, setActiveCategory] = useState('GEN')

  function toggle(id: string) {
    setOpenMap(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const mono = { fontFamily: 'var(--font-plex-mono)' } as React.CSSProperties
  const serif = { fontFamily: 'var(--font-plex-serif)' } as React.CSSProperties
  const sans = { fontFamily: 'var(--font-plex-sans)' } as React.CSSProperties

  const activeSection = FAQ_CATEGORIES.find(c => c.code === activeCategory) ?? FAQ_CATEGORIES[0]
  const totalQuestions = FAQ_CATEGORIES.reduce((acc, c) => acc + c.items.length, 0)

  return (
    <div className="sheet-frame" style={{ minHeight: '100vh', background: '#F4F4F0' }}>

      {/* Dark header */}
      <div style={{ background: '#1E2227', borderBottom: '1px solid rgba(244,244,240,0.1)', padding: '48px 24px 40px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ ...mono, fontSize: 10, color: 'rgba(244,244,240,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            SHEET 08 · FREQUENTLY ASKED QUESTIONS
          </div>
          <h1 style={{ ...serif, fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 700, color: '#F4F4F0', lineHeight: 1.15, margin: '0 0 14px' }}>
            Questions &amp; Answers
          </h1>
          <p style={{ ...sans, fontSize: 16, color: 'rgba(244,244,240,0.6)', maxWidth: 540, margin: 0, lineHeight: 1.65 }}>
            Everything you need to know about NirmanShastra — how estimates work, what IS codes are used, payment, and more.
          </p>
          <div style={{ ...mono, fontSize: 11, color: 'rgba(244,244,240,0.3)', marginTop: 16 }}>
            {totalQuestions} questions across {FAQ_CATEGORIES.length} categories
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ borderBottom: '1px solid rgba(30,34,39,0.12)', background: '#F4F4F0', position: 'sticky', top: 52, zIndex: 20 }}>
        <div className="max-w-5xl mx-auto px-6 md:px-12" style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {FAQ_CATEGORIES.map(cat => {
            const isActive = cat.code === activeCategory
            return (
              <button
                key={cat.code}
                onClick={() => setActiveCategory(cat.code)}
                style={{
                  ...mono,
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '14px 18px',
                  background: 'none',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #1F4E79' : '2px solid transparent',
                  color: isActive ? '#1F4E79' : 'rgba(30,34,39,0.45)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.15s',
                }}
              >
                {cat.label}
                <span style={{ marginLeft: 6, fontSize: 9, opacity: 0.6 }}>({cat.items.length})</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* FAQ content */}
      <div className="max-w-5xl mx-auto px-6 md:px-12" style={{ paddingTop: 48, paddingBottom: 80, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 60, alignItems: 'start' }}>

        {/* Questions */}
        <div>
          <div style={{ ...mono, fontSize: 10, color: 'rgba(30,34,39,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
            {activeSection.code} · {activeSection.label}
          </div>

          {activeSection.items.map((item, idx) => {
            const id = `${activeCategory}-${idx}`
            return (
              <AccordionItem
                key={id}
                item={item}
                isOpen={!!openMap[id]}
                onToggle={() => toggle(id)}
              />
            )
          })}
        </div>

        {/* Sidebar */}
        <div style={{ position: 'sticky', top: 130 }}>
          <div style={{ border: '1px solid rgba(30,34,39,0.15)', padding: '24px' }}>
            <div style={{ ...mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(30,34,39,0.4)', marginBottom: 14 }}>
              ALL CATEGORIES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {FAQ_CATEGORIES.map(cat => {
                const isActive = cat.code === activeCategory
                return (
                  <button
                    key={cat.code}
                    onClick={() => setActiveCategory(cat.code)}
                    style={{
                      ...sans,
                      fontSize: 13,
                      color: isActive ? '#1F4E79' : 'rgba(30,34,39,0.65)',
                      background: isActive ? 'rgba(31,78,121,0.06)' : 'none',
                      border: 'none',
                      borderLeft: isActive ? '2px solid #1F4E79' : '2px solid transparent',
                      padding: '8px 12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    <span>{cat.label}</span>
                    <span style={{ ...mono, fontSize: 11, opacity: 0.5 }}>{cat.items.length}</span>
                  </button>
                )
              })}
            </div>

            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(30,34,39,0.1)' }}>
              <div style={{ ...mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(30,34,39,0.4)', marginBottom: 12 }}>
                STILL HAVE QUESTIONS?
              </div>
              <p style={{ ...sans, fontSize: 13, color: 'rgba(30,34,39,0.6)', lineHeight: 1.55, marginBottom: 14 }}>
                Our AI construction advisor is available on every tool page to answer project-specific questions.
              </p>
              <Link
                href="/tools/vastu-pro"
                style={{ ...mono, fontSize: 11, color: '#8C3A22', textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase' }}
              >
                Try a Free Tool →
              </Link>
            </div>
          </div>

          {/* Knowledge base link */}
          <div style={{ border: '1px solid rgba(30,34,39,0.1)', marginTop: 16, padding: '18px 20px' }}>
            <div style={{ ...mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(30,34,39,0.4)', marginBottom: 10 }}>
              LEARN MORE
            </div>
            <div style={{ ...serif, fontSize: 14, fontWeight: 600, color: '#1E2227', marginBottom: 6, lineHeight: 1.35 }}>
              IS Code Guides for Homeowners
            </div>
            <p style={{ ...sans, fontSize: 12, color: 'rgba(30,34,39,0.55)', lineHeight: 1.55, marginBottom: 12 }}>
              Plain-English articles on IS 456, IS 1786, seismic zones, and contractor fraud.
            </p>
            <Link href="/blog" style={{ ...mono, fontSize: 11, color: '#1F4E79', textDecoration: 'none', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Read Articles →
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile: sidebar below on small screens handled by CSS */}
      <style>{`
        @media (max-width: 768px) {
          .faq-grid { grid-template-columns: 1fr !important; }
          .faq-sidebar { position: static !important; }
        }
      `}</style>
    </div>
  )
}
