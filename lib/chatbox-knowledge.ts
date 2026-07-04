// Complete NirmanShastra reference — injected into every chatbox conversation.
// Source: docs/NirmanShastra_Build_Reference.md (IS values in Section 8 are LOCKED).
export const CHATBOX_KNOWLEDGE = `
---
NIRMANSHASTRA — COMPLETE BUILD REFERENCE (injected into AI context)
Version: Final | June 2026
---

# SECTION 1 — PLATFORM IDENTITY

**Product:** NirmanShastra — India's IS-code backed construction cost estimation platform
**Tagline:** "Build With Certainty"
**Founder:** Sudip Jhawar — Civil Engineer (NIT Silchar), former Sobha Limited

## Tools
- **VastuPro** — FREE forever, lead magnet (Vastu Shastra analysis)
- **StructoPro** — Phase 1, RCC Structure, ₹499/report
- **MasonryPro** — Phase 2, Masonry, ₹499/report
- **ElectroPro** — Phase 3, Electrical, ₹499/report
- **PlumbPro** — Phase 4, Plumbing, ₹499/report
- **InteriorPro** — Phase 5, Interior, ₹499/report

**Bundle:** All 5 paid apps = ₹2,999 (saves ₹1,496 vs buying separately)
**Grand Total Report:** ₹999 standalone | FREE if all 5 paid individually
**Professional Subscription:** ₹1,999/month (planned)

---

# SECTION 2 — TECH STACK

Next.js 15 App Router + TypeScript + Tailwind CSS | Supabase PostgreSQL + Auth + RLS | Razorpay (server-side HMAC SHA256 only) | Resend emails | @react-pdf/renderer for all PDFs | Claude API for AI chatbox | Vercel deployment

---

# SECTION 4 — DATABASE SCHEMA (overview)

Tables: users | contacts (leads) | estimates | payments | reports | city_rates | email_sequences
RLS enabled on all user-facing tables. Users can only read/write their own rows.
Contacts captured IMMEDIATELY on registration before analysis begins.

---

# SECTION 5 — CITY RATES (Pune Launch — update quarterly)

| Zone | Cement (₹/bag) | Brick (₹/1000) | Steel (₹/kg) | Sand (₹/cft) | Labour Multiplier |
|---|---|---|---|---|---|
| Pune Central | ₹495 | ₹11,000 | ₹68 | ₹24 | 1.00× |
| Kothrud/Karve Nagar | ₹493 | ₹11,000 | ₹68 | ₹24 | 1.01× |
| Wakad/Hinjewadi | ₹498 | ₹11,000 | ₹69 | ₹25 | 1.03× |
| Baner/Balewadi | ₹502 | ₹12,000 | ₹69 | ₹25 | 1.05× |
| Kharadi/Hadapsar | ₹498 | ₹11,000 | ₹68 | ₹26 | 1.04× |
| Pimpri-Chinchwad | ₹490 | ₹10,000 | ₹67 | ₹23 | 0.96× |
| Undri/Pisoli/Kondhwa | ₹500 | ₹11,000 | ₹69 | ₹27 | 1.06× |
| Talegaon | ₹505 | ₹11,000 | ₹70 | ₹28 | 1.12× |
| Rural Haveli | ₹488 | ₹9,000 | ₹67 | ₹22 | 0.92× |

---

# SECTION 7 — FREE / PAID BOUNDARY (CRITICAL)

## Always FREE across ALL apps:
- Grand Total range only (Basic / Standard / Premium band)
- IS compliance rules as text (green/amber/red badges)
- Grade comparison chart | Material type comparison bar chart
- 10 technical reminders | Finishing costs guide / phase context table
- VastuPro: complete Vastu check (score + room findings + remedies) + PDF

## Requires ₹499 payment:
- Exact quantities (brick counts, cement bags, steel kg, pipe lengths, wire metres)
- Itemised costs with line-by-line breakdown
- Room-by-room breakdown | Labour costs (days × workers × rates)
- PDF report with schematic SVG drawings | IS code annotations in report
- Contractor quote comparison (line-by-line with rupee discrepancies)

**RULE: Never give quantities free. The Grand Total range is the hook. The quantities are the product.**

---

# SECTION 8 — VERIFIED IS CODE VALUES
## ⚠️ THESE VALUES ARE FINAL — DO NOT DEVIATE FROM THESE

### Concrete (IS 456:2000)
**Dry volume factor for concrete mix = 1.54**

| Grade | Mix Ratio | Cement (bags/m³) | Sand (cft/m³) | Aggregate (cft/m³) |
|---|---|---|---|---|
| M15 | 1:2:4 | 6.00 | 14.98 | 29.96 |
| M20 | 1:1.5:3 | 8.07 | 11.22 | 22.44 |
| M25 | 1:1:2 | 11.00 | 7.48 | 14.96 |

**⚠️ M20 is 1:1.5:3 NOT 1:2:4 — common error in many online sources. IS 456:2000 Table 9 is correct.**

**Thumb rule per sqft BUA (G+1 to G+3):**
0.4 bags cement + 4 kg steel + 1.35 cft aggregate + 1.8 cft sand

**Exposure class minimums (IS 456:2000 Table 5+16):**
| Exposure | Min Grade | Min Cover | Max W/C | Min Cement |
|---|---|---|---|---|
| Mild | M20 | 20mm | 0.55 | 300 kg/m³ |
| Moderate | M25 | 30mm | 0.50 | 300 kg/m³ |
| Severe | M30 | 45mm | 0.45 | 320 kg/m³ |
| Very Severe | M35 | 50mm | 0.45 | 340 kg/m³ |
| Extreme | M40 | 75mm | 0.40 | 360 kg/m³ |

**Cover rules (IS 456:2000):**
- Footing: 50mm (Cl.26.4.2.2) — always 50mm regardless of exposure
- Column minimum: 40mm | Beam minimum: 25mm (mild), 40mm (moderate+)
- Slab minimum: 20mm (mild), 30mm (moderate+)
- Max cement content: 450 kg/m³

### Steel (IS 1786:2008)
**Steel density = 7850 kg/m³**

**Steel percentage by member:**
| Member | % Steel | kg/m³ |
|---|---|---|
| Footing | 0.50% | 39.25 |
| Plinth beam | 1.50% | 117.75 |
| Column | 2.50% | 196.25 |
| Beam | 1.50% | 117.75 (use 150 with wastage) |
| Slab | 1.00% | 78.50 |

**Overall thumb rule:** 4 kg steel per sqft BUA for G+1 to G+3
**Binding wire:** 10 kg per tonne of steel

**TMT Grades:**
| Grade | fy (MPa) | fu (MPa) | Elongation | Use |
|---|---|---|---|---|
| Fe415 | 415 | 485 | 14.5% | Old standard |
| Fe500 | 500 | 545 | 12% | Standard residential G+1 to G+3 |
| Fe500D | 500 | 565 | 16% | Seismic Zone III-V mandatory |
| Fe550D | 550 | 585 | 14.5% | High-rise seismic |

**⚠️ Zone III-V: Use Fe500D or Fe550D (higher ductility). IS 13920:2016.**

**Bar weights (kg/m):**
8mm=0.395 | 10mm=0.617 | 12mm=0.888 | 16mm=1.578 | 20mm=2.467 | 25mm=3.854 | 32mm=6.313

**Seismic detailing (IS 13920:2016):**
- Column ties: max 100mm at hinge zones (d/4 or 100mm whichever less)
- Beam stirrups: d/4 near support (within 2d from face)

### Brickwork (IS 1077:1992 + IS 2212:1991)
**Dry volume factor for mortar = 1.1 (NOT 1.54 — that's concrete)**

**Modular bricks 190×90×90mm:**
| Wall | Bricks/sqm | Cement (bags/sqm) | Sand (cft/sqm) |
|---|---|---|---|
| 9" (230mm) | 100 | 0.20 | 2.13 (1:6 mortar) |
| 4.5" (115mm) | 50 | 0.10 | 0.72 (1:4 mortar) |

**Non-modular bricks 230×115×75mm:**
| Wall | Bricks/sqm | Cement (bags/sqm) | Sand (cft/sqm) |
|---|---|---|---|
| 9" (230mm) | 90 | 0.18 | 1.65 (1:6 mortar) |
| 4.5" (115mm) | 48 | 0.09 | 0.60 (1:4 mortar) |

**Block masonry (per sqm):**
| Type | Size | Blocks/sqm | Cement (bags) | Sand (cft) |
|---|---|---|---|---|
| Hollow concrete | 200mm | 12.5 | 0.35 | 1.50 |
| AAC | 200mm | 8.33 | 0.38 (adhesive) | — |
| CLC foam | 200mm | 12.5 | 0.32 | 1.40 |

**⚠️ AAC Warning (IS 4326:1993):** AAC blocks NOT permitted as load-bearing masonry in Seismic Zones IV and V. Approved for infill/partition only.

**Masonry practice (IS 2212:1991):**
- Soak bricks minimum 2 hours before laying | Frog face up
- English bond for 9" walls, stretcher bond for 4.5"
- Mortar joint: 10mm bed + 10mm perpendicular | Cure minimum 7 days with wet gunny

**Mortar grades (IS 2250:1981):**
M1=1:3 (high strength) | M2=1:4 (load-bearing min) | M3=1:5 (general) | M4=1:6 (non-load-bearing min) | M5=1:8 (avoid)

### Plaster (IS 1661:1972) per sqm
| Type | Thickness | Ratio | Cement (bags) | Sand (cft) |
|---|---|---|---|---|
| Internal | 12mm | 1:4 | 0.078 | 0.50 |
| External | 15mm | 1:4 | 0.098 | 0.63 |
| Ceiling | 6mm | 1:3 | 0.042 | 0.20 |

Add 5% wastage. Chicken mesh mandatory at RCC-brick junction. Cure 7 days.

### Waterproofing (IS 2645:2003)
**Terrace rates (₹/sqft):**
Brick Bat Coba (BBC)=₹155–225 | APP Bitumen Membrane=₹120–175 | Liquid Applied=₹85–130 | IPS Screed=₹110–155

BBC slope minimum 1% to outlet. BBC 75mm thick.

**Bathroom sunken (₹/sqft):**
Cementitious slurry=₹88–145 | Crystalline (Xypex)=₹145–220 | PU (DrFixit 2K)=₹180–250

External damp-proofing: ₹38–62/sqft. Test: Pond 50mm water for 24–48 hours.

### Electrical (IS 732:2019)
**Circuit maximums:** Lighting circuit: max 800W | Power circuit: max 3,000W

**Wire sizes (minimum — IS 732:2019):**
Lighting=1.5 sqmm | Power sockets=2.5 sqmm | AC/Geyser=4.0 sqmm | Sub-panel feeds=6.0 sqmm | Main incomer=10.0 sqmm

Wastage factor: 1.15. Earthing (IS 3043:2018): Maximum resistance 1 ohm. RCCB 30mA for bathrooms mandatory.

### Plumbing (IS 1172:1993 + IS 1742:1983)
**Water demand:** Municipal supply=135 LPCD | Borewell=150 LPCD | Tank size = daily demand × 0.67

**Pipe sizes:** Soil stack (WC)=110mm SWR | Waste (bath/kitchen)=75mm SWR | Cold supply main=25–50mm CPVC

**Slopes:** 75mm waste pipe=1:48 (2%) | 110mm soil stack=1:80 (1.25%)

### Foundation (IS 1904:2016)
**Bearing capacity (kN/m²):**
Hard rock=3,300 | Dense sand=250 | Medium clay=75 | Black cotton soil (BCS)=50–150

**Foundation types:**
| Type | Condition | Cost Range |
|---|---|---|
| Isolated footing | Good soil, G+1 to G+3 | ₹220–350/sqft |
| Strip footing | Load-bearing walls | ₹200–320/sqft |
| Raft/mat | BCS/soft/waterlogged | ₹350–550/sqft |
| Pile | Very soft/marshy | ₹2,500–4,000/running metre |
| Under-reamed pile | BCS specifically | ₹2,800–4,500/running metre |

Minimum foundation depth: 500mm (IS 1904:2016). Geotechnical investigation: Mandatory. Cost ₹15,000–50,000.

### Loads (IS 875:2015)
Residential floors=2 kN/m² | Roof=1.5 kN/m² | Stairs=3 kN/m²

### Seismic Zones (IS 1893:2016)
| Zone | Z factor | States/UTs |
|---|---|---|
| Zone V | 0.36 | Uttarakhand, HP, Sikkim, all 8 NE states, J&K, Ladakh, A&N |
| Zone IV | 0.24 | Delhi, Punjab, Haryana, Chandigarh, Bihar, UP, Jammu |
| Zone III | 0.16 | Maharashtra, Gujarat, Rajasthan, WB, Goa, Kerala |
| Zone II | 0.10 | Karnataka, TN, Telangana, AP, MP, CG, Jharkhand, Odisha |

**Seismic bands (IS 4326:1993) — Zone III-V mandatory:**
Plinth + Sill + Lintel + Roof bands, 75mm thick, 2×8mm bars + 6mm @150mm. Max wall length 6m.

### NBC 2016 Room Minimums
Room height=2.75m | Living room=9.5 sqm | Bedroom=9.5 sqm | Kitchen=4.5 sqm | Bathroom=1.2 sqm
Staircase width=900mm | Riser max=190mm | Tread min=250mm

### Interior Rates
**Kitchen running foot:**
Basic=₹1,200/rft | Standard=₹2,200 | Premium=₹3,800 | Luxury=₹7,500

**Flooring rates/sqft:**
Basic=₹65 | Standard=₹120 | Premium=₹265 | Luxury=₹650

**False ceiling/sqft:**
Standard=₹165 | Premium=₹255 | Luxury=₹455

Paint: 0.18L per sqft BUA. Coverage 40–50 sqft wall area per litre (2 coats + primer).
Tile wastage: 10% standard. Gypsum plaster (IS 2547:1976): No water curing. Faster than cement plaster.

---

# SECTION 9 — LAND UNITS (18 TYPES)

sqft=1 | sqm=10.764 | sq yard/gaj=9 | Guntha=1,089 | Cent=435.6 | Ground (TN)=2,400
Marla=272.25 | Kanal=5,445 | Acre=43,560 | Hectare=107,639
Bigha: state-specific — UP=27,225 | Bihar=17,424 | Punjab=43,243 | Bengal=14,400
Katha: state-specific — Bengal=80 | Bihar=1,361

---

# SECTION 10 — PLOT SHAPES SUPPORTED

Rectangle, Square, L-shaped, T-shaped, Trapezoid (Gomukhi/Shermukhi), Triangle, Corner plot, Irregular polygon (Shoelace formula)

---

# SECTION 11 — IS CODES REFERENCED

IS 456:2000, IS 1786:2008, IS 1893:2016, IS 13920:2016, IS 1077:1992, IS 12894:2002,
IS 2185:2005, IS 2212:1991, IS 1661:1972, IS 2645:2003, IS 4326:1993, IS 732:2019,
IS 694:2010, IS 8828:2007, IS 3043:2018, IS 1172:1993, IS 1742:1983, IS 1904:2016,
IS 2911:2010, IS 875:2015, IS 2250:1981, IS 383:2016, IS 269:2015, IS 2547:1976, NBC 2016

---

# SECTION 12 — VASTUPRO (Phase 0 — Free)

Free forever. Lead magnet. Vastu Shastra compliance analysis for existing floor plans.
33 rooms analysed across 16 Vastu zones (22.5° each, radiating from Brahmasthan).
FREE: Score, room name, zone, severity badge, impact text.
PDF ONLY: Technical remedy, actionable remedy, Do's, Don'ts, general guidelines.

---

# SECTION 13 — STRUCTOPRO (Phase 1 — ₹499)

RCC structural estimation. 3 methods: Design Myself | I Have Structural Drawings (AI) | Add Floors to Existing.

**Vertical Extension Safety Checks:**
230×230mm column = G+0 only | 300×300mm = G+1 | 350×350mm = G+2 | 400mm+ = G+3+
Zone IV minimum 250mm column | Zone V minimum 300mm column

**Site conditions affect foundation recommendation:**
Flat + good soil → Isolated footing | BCS → Under-reamed pile | Rocky → Rock-cut | Marshy → Raft/Pile

**Free visible results:** IS compliance panel, grade comparison chart, 10 technical reminders, finishing costs guide, grand total range.

**Finishing costs context (NOT included in StructoPro):**
Brickwork+Masonry=20-25% | Plaster+WP=8-10% | Flooring=10-15% | Doors+Windows=8-12%
Electrical=8-12% | Plumbing=6-10% | Paint=4-6% | False ceiling+carpentry=5-10%
Contractor overhead=10-15% | Professional fees=2-4%
Basic finish multiplier=1.8-2.0× | Standard=2.2-2.5× | Premium=2.8-3.2×
**"The structural frame is only 40-45% of total building cost."**

**14 CPWD Labour Trades:**
Bar Bender (Sariya Mistri): 600 kg steel/day ₹950 | Shuttering Carpenter: 100 sqft/day ₹900
Concreting Mason (RCC): 2.5 m³/day ₹900 | Vibrator Operator: ₹800
General Helper/Beldar: ₹580 | Curing/Water Man: ₹500 | Junior Site Engineer: ₹1,500
Site Foreman: ₹1,200 | Safety Officer: ₹1,200

---

# SECTION 14 — MASONPRO (Phase 2 — ₹499)

Masonry estimation for 8 external wall types + 6 internal partition types.

**Wall types:** Red clay brick modular/non-modular | Fly ash brick modular/non-modular
Hollow concrete block 200mm | Solid concrete block 200mm | AAC block 200mm | CLC foam block 200mm

**⚠️ AAC Warning:** AAC blocks NOT permitted as load-bearing masonry in Zones IV and V (IS 4326:1993).

Phase 2 masonry = 20-25% of total project cost.
Masonry starts 60-90 days after RCC pour (NOT 21 days — IS 456 curing + stripping + prep).

**10 CPWD Trades:**
Brick Layer (Raj Mistri): 120 sqft/day (9" modular) ₹850 | Plaster Mason: 100 sqft/day ₹800
Waterproofing Specialist: 80 sqft/day ₹1,100 | Site Foreman: ₹1,200

**Overcharging via:** inflated brick counts, wrong mortar ratio, skipping curing, brick substitution.

---

# SECTION 15 — ELECTROPRO (Phase 3 — ₹499)

Electrical estimation. Methods: Design from scratch | I have drawings (AI) | Retrofit/Upgrade.

Phase 3 electrical = 8-12% of total project cost.

**8 CPWD Trades:**
Licensed Electrician: 8-10 points/day ₹1,200 | Wireman: ₹750 | DB Panel Installer: ₹1,500
Testing & Commissioning: ₹1,400

**⚠️ IS 732:2019:** Verify Class B license. Unlicensed electrical work voids insurance.

**Overcharging via:** oversized wires for basic circuits, premium MCBs where standard suffices, unnecessary large DB panels, duplicate point counting.

---

# SECTION 16 — PLUMBPRO (Phase 4 — ₹499)

Plumbing estimation. Methods: Design from scratch | I have drawings (AI) | Retrofit/Extension.

Phase 4 plumbing = 6-10% of total project cost.

**IS 1172:1993 Water Demand:**
Municipal supply=135 LPCD | Borewell=150 LPCD | Tank size = daily demand × 0.67

**8 CPWD Trades:**
Licensed Plumber: 6-8 CPVC joints/day ₹1,100 | Sanitary Fitter: 3-4 fixtures/day ₹1,000
Testing/Flush Test: ₹1,000

**Overcharging via:** upsized pipe diameters, unnecessary motor HP, CPVC vs UPVC substitution, billing for fixtures owner supplies separately.

---

# SECTION 17 — INTERIORPRO (Phase 5 — ₹499)

Interior estimation. Two paths: Quick Estimate (±15% accuracy) | Exact Dimensions (±5% accuracy).

Phase 5 interior = 12-18% of total project cost.
Grade multipliers: Basic 1.0× | Standard 1.6× | Premium 2.4× | Luxury 3.5×
"Interior grade affects final cost more than any other phase."

**10 CPWD Trades:**
Tile Mason (Flooring): 80-100 sqft/day ₹900 | Carpenter: ₹1,200 | Painter: 400 sqft/day ₹700
False Ceiling Installer: 150 sqft/day ₹1,000

---

# SECTION 18 — GRAND TOTAL REPORT

₹999 standalone | FREE if all 5 apps paid individually
15 pages covering all 5 phases + grand total breakdown.

---

# SECTION 19 — 9 USER FLOWS

1. Full house from scratch — all 5 phases
2. Flat possession bare shell — ElectroPro + PlumbPro + InteriorPro only
3. Flat interior only — InteriorPro only
4. Adding new floor — StructoPro (VE) + MasonryPro + optional others
5. Horizontal extension — StructoPro + MasonryPro + optional others
6. Commercial+residential — all apps with commercial rate tables
7. Renovation/repair — MasonryPro + ElectroPro + PlumbPro (retrofit flows)
8. Real estate developer — bulk rates, multiple units
9. NRI building in India — all apps, remote consultant feature

---

# SECTION 20 — CONTRACTOR QUOTE COMPARISON

Post-payment comparison per app:
StructoPro: concrete m³, steel kg, formwork sqft vs IS-code calculated
MasonryPro: brick counts, mortar ratios, plaster thickness, curing method
ElectroPro: wire gauges, MCB ratings, circuit counts, earth pits
PlumbPro: pipe diameters, tank capacity, pump HP, fixture counts
InteriorPro: flooring rates, kitchen rft rates, paint coverage, tile wastage

Flag reasons: "Quantity inflation X% above IS code" | "Material substitution without disclosure" | "Missing item — [name]" | "Rate inflation X% above city average"

---

# SECTION 22 — LOYALTY + BUNDLE PRICING

1 app paid (₹499) → Remaining 4 for ₹1,500 (saves ₹496)
2 apps paid (₹998) → Remaining 3 for ₹1,001 (saves ₹496)
3 apps paid (₹1,497) → Remaining 2 for ₹502 (saves ₹496)
2nd report same app: ₹100 off

---

# SECTION 28 — PRICING (FINAL)

Launch: ₹499 per app | Bundle ₹2,999 | Grand Total ₹999
Professional subscription: ₹1,999/month (planned)
Monthly platform cost: ~₹1,767. Break-even: 9 paid reports/month.

---

# DESIGN SYSTEM (Design Spec — final)

Colours: Sheet White #F4F4F0 | Iron Ink #1E2227 | Blueprint #1F4E79 | Stamp Oxide #8C3A22
Marking Yellow #D99A06 | Approved Green #14532D | Vastu Gold #C9A84C (VastuPro ONLY)

Fonts: IBM Plex Serif (headings) | IBM Plex Sans (body/UI) | IBM Plex Mono (ALL numbers, rates, IS clauses)

---

*IS code values above are verified final from IS 456:2000, IS 1786:2008, IS 1893:2016, IS 13920:2016,
IS 1077:1992, IS 2212:1991, IS 1661:1972, IS 2645:2003, IS 732:2019, IS 1172:1993, IS 1904:2016,
IS 875:2015, IS 2250:1981, NBC 2016.*
`
