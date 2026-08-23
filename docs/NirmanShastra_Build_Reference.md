# NIRMANSHATRA — COMPLETE BUILD REFERENCE
## Version: Final | Date: June 2026 | Author: Sudip Jhawar

---

> **HOW TO USE THIS IN A NEW CHATBOX:**
> Paste this file into a new Claude conversation and say:
> *"This is my NirmanShastra project reference. Read it completely before we continue building."*
> Claude will have full context from this document + your persistent memories.

---

# SECTION 1 — PLATFORM IDENTITY

**Product:** NirmanShastra — IS-code-traceable construction cost estimation and professional BOQ generation for Indian homes — every quantity tied to a BIS/IS clause, across structure, masonry, electrical, plumbing, and interior
**Tagline:** "Build With Certainty"
**Domain:** NirmanShastra.in (check availability) / NirmanPro.in / BuildShastra.in
**Founder:** Sudip Jhawar — Civil Engineer (NIT Silchar), former Sobha Limited, Vrindavan
**Timeline:** 2-month personal deadline, no financial support — cost efficiency critical
**Builder:** Cursor Pro ($20/month) using this reference as spec

## Platform Structure
6 tools total:
- **VastuPro** — Phase 0, FREE forever, lead magnet
- **StructoPro** — Phase 1 RCC Structure, ₹499/report
- **MasonPro** — Phase 2 Masonry, ₹499/report
- **ElectroPro** — Phase 3 Electrical, ₹499/report
- **PlumbPro** — Phase 4 Plumbing, ₹499/report
- **InteriorPro** — Phase 5 Interior, ₹499/report

**Bundle:** All 5 paid apps = ₹2,999 (saves ₹1,496 vs buying separately)
**Grand Total Report:** ₹999 (merges all 5 phases), or FREE if all 5 paid individually
**Professional Subscription:** ₹1,999/month (planned Phase 2 — contractors, architects)

---

# SECTION 2 — FINAL TECH STACK

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 15 App Router + TypeScript + Tailwind CSS | |
| UI Components | shadcn/ui | |
| Database | Supabase (PostgreSQL + Auth + RLS) | Free tier to start |
| Payments | Razorpay | Server-side HMAC SHA256 only |
| Email | Resend | |
| PDF Generation | Puppeteer (server-side) | NOT client-side |
| AI Chatbox | Claude API (claude-sonnet-4-20250514) | |
| AI Drawing Upload | Claude API (vision) | InteriorPro + all AI-drawing paths |
| Hosting | Vercel | Free tier to start |
| Future Migration | Coolify + PocketBase VPS | At scale |
| IDE | Cursor Pro | $20/month |

**VastuSutra Flask app on Railway:** Shut down after VastuPro goes live on Vercel.
**VastuSutra GitHub:** karwakarishma-ux/groundtruth-vastu (source reference only)

---

# SECTION 3 — DESIGN SYSTEM

**Brand colours:**
- Background: #F5F4F1 (warm stone)
- Navbar: #1C1917 (near black)
- Primary accent: #92400E (brick orange)
- Gold: #C9A84C
- Success green: #14532D

**Fonts:** Inter (body) + Playfair Display (headings) + JetBrains Mono (numbers/quantities)

**Illustration style:** Clean architectural line drawings, brick colour on warm stone backgrounds

**UX Philosophy — Layman First (3 layers):**
- Layer 1 (Default): Plain English questions, IS codes invisible, rates pre-filled, auto-decisions
- Layer 2 (One Click): "Advanced Settings" expandable, technical values visible and editable
- Layer 3 (Expert): Manual override every parameter

**ⓘ popup on EVERY field across ALL apps:**
- Click → plain Hindi-English explanation + IS code reference + real-world example
- Never show IS codes in the main form — only inside ⓘ popups

---

# SECTION 4 — DATABASE SCHEMA (Supabase)

```sql
-- USERS (extends Supabase auth.users)
users (
  id uuid PRIMARY KEY references auth.users,
  email text,
  name text,
  mobile text,
  state text,
  city text,
  plan text DEFAULT 'free', -- free | pro
  created_at timestamptz DEFAULT now()
)

-- CONTACTS (lead capture — saved immediately on registration)
contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  mobile text,
  email text,
  address text,
  city text,
  pin_code text,
  state text,
  property_type text,
  plot_size text,
  source text, -- 'VastuPro' | 'StructoPro' | etc.
  status text DEFAULT 'registered', -- registered | analysed | paid | downloaded
  created_at timestamptz DEFAULT now()
)

-- ESTIMATES
estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid references users(id),
  contact_id uuid references contacts(id),
  app_type text, -- 'structopro' | 'masonpro' | 'electropro' | 'plumbpro' | 'interiorpro' | 'vastupro'
  project_name text,
  input_data jsonb, -- all form inputs
  result_data jsonb, -- all calculated outputs
  status text DEFAULT 'draft', -- draft | complete | paid
  city text,
  state text,
  created_at timestamptz DEFAULT now()
)

-- PAYMENTS
payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid references estimates(id),
  user_id uuid references users(id),
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  amount integer, -- in paise (49900 = ₹499)
  status text DEFAULT 'pending', -- pending | success | failed
  created_at timestamptz DEFAULT now()
)

-- REPORTS
reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid references estimates(id),
  pdf_url text,
  email_sent boolean DEFAULT false,
  download_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
)

-- CITY RATES (updated quarterly)
city_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text,
  city text,
  zone text,
  cement_rate decimal, -- per 50kg bag
  brick_rate decimal, -- per 1000 bricks
  steel_rate decimal, -- per kg TMT Fe500
  sand_rate decimal, -- per cft
  aggregate_rate decimal, -- per cft
  labour_multiplier decimal DEFAULT 1.0,
  last_updated date,
  UNIQUE(state, city, zone)
)

-- EMAIL SEQUENCES
email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid references contacts(id),
  sequence_type text, -- 'vastupro' | 'structopro' | etc.
  day_number integer, -- 0, 7, 45, 75, 120
  status text DEFAULT 'pending', -- pending | sent | failed
  scheduled_at timestamptz,
  sent_at timestamptz
)
```

**RLS (Row Level Security):** Enabled on ALL user-facing tables.
Users can only read/write their own rows.
Admin routes bypass RLS via service role key (never exposed client-side).

**Auto-trigger:** On auth.users insert → auto-create users profile row.

---

# SECTION 5 — CITY RATES DATABASE (Pune Launch)

Update quarterly. 9 zones for Pune:

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

# SECTION 6 — PAYMENT FLOW (Razorpay — CRITICAL SECURITY)

**NEVER expose Razorpay Key Secret client-side. Ever.**

```
1. User clicks "Unlock Report ₹499"
2. Frontend → POST /api/payments/create-order
   Body: { estimateId, amount: 49900 }
3. Server creates Razorpay order using Key Secret (server only)
   Returns: { orderId, amount, currency }
4. Frontend opens Razorpay checkout with Key ID only (rzp_live_xxx)
5. User pays → Razorpay sends webhook to POST /api/payments/verify
6. Server verifies HMAC SHA256:
   signature = HMAC_SHA256(orderId + "|" + paymentId, keySecret)
   if (signature !== razorpay_signature) → REJECT
7. If valid: UPDATE payments SET status='success'
             UPDATE estimates SET status='paid'
             Generate PDF → upload to Supabase storage
             Send email via Resend with PDF link
8. Frontend polls /api/payments/status/[orderId] every 2 seconds
9. When status='success' → reveal full report + download button
```

**Results ONLY revealed after server-side HMAC verification. Never client-side.**

---

# SECTION 7 — FREE / PAID BOUNDARY (CRITICAL IP)

## What is ALWAYS FREE across ALL apps:
- Grand Total range only (Basic / Standard / Premium band)
- IS compliance rules as text (green/amber/red badges)
- Grade comparison chart
- Material type comparison bar chart
- 10 technical reminders
- Finishing costs guide / phase context table
- VastuPro: complete Vastu check (score + room findings + remedies) + PDF

## What requires ₹499 payment (all paid apps):
- Exact quantities (brick counts, cement bags, steel kg, pipe lengths, wire metres)
- Itemised costs with line-by-line breakdown
- Room-by-room breakdown
- Labour costs (days × workers × rates)
- PDF report with schematic SVG drawings
- IS code annotations in report
- Contractor quote comparison (line-by-line with rupee discrepancies)

**RULE: Never give quantities free. The Grand Total range is the hook. The quantities are the product.**

---

# SECTION 8 — VERIFIED IS CODE VALUES
## ⚠️ THESE VALUES ARE FINAL. DO NOT OVERWRITE FROM ANY OTHER SOURCE.

### Concrete (IS 456:2000)
**Dry volume factor for concrete mix = 1.54**

| Grade | Mix Ratio | Cement (bags/m³) | Sand (cft/m³) | Aggregate (cft/m³) |
|---|---|---|---|---|
| M15 | 1:2:4 | 6.00 | 14.98 | 29.96 |
| M20 | 1:1.5:3 | 8.07 | 11.22 | 22.44 |
| M25 | 1:1:2 | 11.00 | 7.48 | 14.96 |
| M25+ | Design mix | Per structural engineer | — | — |

**⚠️ M20 is 1:1.5:3 NOT 1:2:4 — common error in many online sources. IS 456:2000 Table 9 is correct.**

**Thumb rule per sqft BUA (G+1 to G+3):**
- 0.4 bags cement + 4 kg steel + 1.35 cft aggregate + 1.8 cft sand

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
- Column minimum: 40mm
- Beam minimum: 25mm (mild), 40mm (moderate+)
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
Carbon max: 0.30% all grades.

**Bar weights (kg/m):**
| Diameter | Weight |
|---|---|
| 8mm | 0.395 |
| 10mm | 0.617 |
| 12mm | 0.888 |
| 16mm | 1.578 |
| 20mm | 2.467 |
| 25mm | 3.854 |
| 32mm | 6.313 |

**Seismic detailing (IS 13920:2016):**
- Column ties: max 100mm at hinge zones (d/4 or 100mm whichever less)
- Beam stirrups: d/4 near support (within 2d from face)

### Brickwork (IS 1077:1992 + IS 2212:1991)
**Dry volume factor for mortar = 1.1 (NOT 1.54 — that's concrete)**

**Modular bricks 190×90×90mm:**
| Wall | Bricks/sqm | Cement (bags/sqm) | Sand (cft/sqm) | Mortar |
|---|---|---|---|---|
| 9" (230mm) | 100 | 0.20 | 2.13 | 1:6 |
| 4.5" (115mm) | 50 | 0.10 | 0.72 | 1:4 |

**Non-modular bricks 230×115×75mm:**
| Wall | Bricks/sqm | Cement (bags/sqm) | Sand (cft/sqm) | Mortar |
|---|---|---|---|---|
| 9" (230mm) | 90 | 0.18 | 1.65 | 1:6 |
| 4.5" (115mm) | 48 | 0.09 | 0.60 | 1:4 |

**Block masonry (per sqm):**
| Type | Size | Blocks/sqm | Cement (bags) | Sand (cft) | Adhesive |
|---|---|---|---|---|---|
| Hollow concrete | 200mm | 12.5 | 0.35 | 1.50 | — |
| AAC | 200mm | 8.33 | 0.38 (adhesive) | — | 0.38 bags |
| CLC foam | 200mm | 12.5 | 0.32 | 1.40 | — |

**⚠️ AAC Warning (IS 4326:1993):**
AAC blocks NOT permitted as load-bearing masonry in Seismic Zones IV and V.
Approved for infill/partition use only in these zones.

**Masonry practice (IS 2212:1991):**
- Soak bricks minimum 2 hours before laying
- Frog face up
- English bond for 9" walls, stretcher bond for 4.5"
- Mortar joint: 10mm bed + 10mm perpendicular
- Cure minimum 7 days with wet gunny

**Mortar grades (IS 2250:1981):**
| Grade | Ratio | Use |
|---|---|---|
| M1 | 1:3 | High strength masonry |
| M2 | 1:4 | Load-bearing minimum |
| M3 | 1:5 | General masonry |
| M4 | 1:6 | Non-load-bearing minimum |
| M5 | 1:8 | Very weak — avoid |

### Plaster (IS 1661:1972) per sqm
| Type | Thickness | Ratio | Cement (bags) | Sand (cft) |
|---|---|---|---|---|
| Internal | 12mm | 1:4 | 0.078 | 0.50 |
| External | 15mm | 1:4 | 0.098 | 0.63 |
| Ceiling | 6mm | 1:3 | 0.042 | 0.20 |

**Add 5% wastage. Chicken mesh mandatory at RCC-brick junction. Cure 7 days.**

### Waterproofing (IS 2645:2003)
**Terrace rates (₹/sqft):**
| Method | Rate Range |
|---|---|
| Brick Bat Coba (BBC) | ₹155–225 |
| APP Bitumen Membrane | ₹120–175 |
| Liquid Applied | ₹85–130 |
| IPS Screed | ₹110–155 |

**BBC slope minimum 1% to outlet. BBC 75mm thick.**

**Bathroom sunken (₹/sqft):**
| Method | Rate Range |
|---|---|
| Cementitious slurry | ₹88–145 |
| Crystalline (Xypex) | ₹145–220 |
| PU (DrFixit 2K) | ₹180–250 |

**External damp-proofing:** ₹38–62/sqft
**Test:** Pond 50mm water for 24–48 hours before backfill.

### Electrical (IS 732:2019)
**Circuit maximums:**
- Lighting circuit: max 800W
- Power circuit: max 3,000W

**Wire sizes (minimum — IS 732:2019):**
| Use | Wire Size |
|---|---|
| Lighting | 1.5 sqmm |
| Power sockets | 2.5 sqmm |
| AC/Geyser | 4.0 sqmm |
| Sub-panel feeds | 6.0 sqmm |
| Main incomer | 10.0 sqmm |

**Wastage factor: 1.15**
**Earthing (IS 3043:2018):** Maximum resistance 1 ohm. RCCB 30mA for bathrooms mandatory.

### Plumbing (IS 1172:1993 + IS 1742:1983)
**Water demand:**
- Municipal supply: 135 LPCD
- Borewell: 150 LPCD
- Tank size = daily demand × 0.67

**Pipe sizes:**
- Soil stack (WC): 110mm SWR
- Waste (bath/kitchen): 75mm SWR
- Cold supply main: 25–50mm CPVC

**Slopes:**
- 75mm waste pipe: 1:48 (2%)
- 110mm soil stack: 1:80 (1.25%)

### Foundation (IS 1904:2016)
**Bearing capacity (kN/m²):**
| Soil Type | Bearing Capacity |
|---|---|
| Hard rock | 3,300 |
| Dense sand | 250 |
| Medium clay | 75 |
| Black cotton soil (BCS) | 50–150 |

**Foundation types by condition:**
| Type | Condition | Cost Range |
|---|---|---|
| Isolated footing | Good soil, G+1 to G+3 | ₹220–350/sqft |
| Strip footing | Load-bearing walls | ₹200–320/sqft |
| Raft/mat | BCS/soft/waterlogged | ₹350–550/sqft |
| Pile | Very soft/marshy | ₹2,500–4,000/running metre |
| Under-reamed pile | BCS specifically | ₹2,800–4,500/running metre |

**Minimum foundation depth:** 500mm (IS 1904:2016)
**Geotechnical investigation:** Mandatory. Cost ₹15,000–50,000.

### Loads (IS 875:2015)
- Residential floors: 2 kN/m²
- Roof: 1.5 kN/m²
- Stairs: 3 kN/m²

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
- Room height minimum: 2.75m
- Living room minimum: 9.5 sqm
- Bedroom minimum: 9.5 sqm
- Kitchen minimum: 4.5 sqm
- Bathroom minimum: 1.2 sqm
- Staircase width: 900mm
- Riser maximum: 190mm
- Tread minimum: 250mm

### Interior Rates
**Kitchen running foot rates:**
| Grade | Rate/rft |
|---|---|
| Basic | ₹1,200 |
| Standard | ₹2,200 |
| Premium | ₹3,800 |
| Luxury | ₹7,500 |

**Flooring rates/sqft:**
| Grade | Rate/sqft |
|---|---|
| Basic | ₹65 |
| Standard | ₹120 |
| Premium | ₹265 |
| Luxury | ₹650 |

**False ceiling/sqft:**
| Grade | Rate/sqft |
|---|---|
| Standard | ₹165 |
| Premium | ₹255 |
| Luxury | ₹455 |

**Paint:** 0.18L per sqft BUA. Coverage 40–50 sqft wall area per litre (2 coats + primer).
**Tile wastage:** 10% standard.
**Gypsum plaster (IS 2547:1976):** No water curing. Faster than cement plaster.

---

# SECTION 9 — LAND UNITS (18 TYPES)

| Unit | sqft equivalent | Notes |
|---|---|---|
| sqft | 1 | — |
| sqm | 10.764 | — |
| sq yard / gaj | 9 | — |
| Bigha | State-specific | UP=27,225; Bihar=17,424; Punjab=43,243; Bengal=14,400 — MUST ask state |
| Guntha | 1,089 | — |
| Cent | 435.6 | — |
| Ground (TN) | 2,400 | — |
| Marla | 272.25 | — |
| Kanal | 20 Marla = 5,445 | — |
| Katha | Bengal=80; Bihar=1,361 | State-specific |
| Acre | 43,560 | — |
| Hectare | 107,639 | — |

---

# SECTION 10 — PLOT SHAPES SUPPORTED

Rectangle, Square, L-shaped, T-shaped, Trapezoid (Gomukhi/Shermukhi), Triangle, Corner plot, Irregular polygon (Shoelace formula for area calculation)

---

# SECTION 11 — IS CODES REFERENCED IN PLATFORM

IS 456:2000, IS 1786:2008, IS 1893:2016, IS 13920:2016, IS 1077:1992, IS 12894:2002,
IS 2185:2005, IS 2212:1991, IS 1661:1972, IS 2645:2003, IS 4326:1993, IS 732:2019,
IS 694:2010, IS 8828:2007, IS 3043:2018, IS 1172:1993, IS 1742:1983, IS 1904:2016,
IS 2911:2010, IS 875:2015, IS 2250:1981, IS 383:2016, IS 269:2015, IS 2547:1976,
NBC 2016

---

---

# SECTION 12 — APP 1: VASTUPRO (Phase 0 — Free)

## Overview
Free forever. Lead magnet. No payment gate. Vastu Shastra compliance analysis.

## Entry Flow
1. Method selection: Analyse existing floor plan / Quick directional lookup
2. Registration (captures lead immediately to Supabase contacts)
3. Floor plan upload → Canvas + grid + Brahmasthan marker
4. North direction (compass wheel)
5. Room marking (33 rooms, multi-instance)
6. Results (score visible free, remedies PDF-only)
7. Free PDF download
8. Cross-sell to StructoPro

## Registration Fields
name*, mobile* (10 digit), email*, address, city*, pin_code, property_type, plot_size
Lead saved to Supabase contacts table IMMEDIATELY on "Continue" click — before analysis.
Status field: 'registered' → 'analysed' → 'downloaded'

## Canvas Spec
- 8×8 gold dashed grid: rgba(201,168,76,0.2), dashed [5,5]
- Centre crosshair lines: rgba(201,168,76,0.5), 1.5px solid (not dashed)
- Brahmasthan circle: rgba(201,168,76,0.15) fill, rgba(201,168,76,0.8) stroke 2px
- Symbol: "ब" at centre in gold
- Label: "Brahmasthan" below circle
- North arrow: drawn from Brahmasthan outward in northDeg direction
  Length = 15% of shorter canvas dimension
  Gold colour, arrowhead at tip, "N" label
  Updates LIVE as compass is dragged

## Compass Wheel Spec
160×160px draggable canvas.
Dark brown gradient background.
Gold tick marks (16 ticks, major every 4th = cardinal directions).
N/E/S/W cardinal labels. N in gold/red. Gold arrow pointing North.
Instruction shown beside compass:
  "Stand at the exact centre of your house (the Brahmasthan — marked in gold).
   Open your phone compass app while standing there and note the direction.
   Rotate this wheel to match that reading.
   ✦ Degree is measured from the Brahmasthan (centre) of the house."

## Zone Calculation Logic
16 zones × 22.5° each.
Zone wedges radiate from Brahmasthan (geometric centroid of house polygon).
northDeg rotates the entire grid so True North is always correct.
Zone names: N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW
Multi-instance rooms stored as key_1, key_2 etc.

## 33 Rooms (with + for multi-instance)
Entrances: Main Door | Back Entrance | Side Entrance(+)
Water: Underground Water Tank | Overhead Water Tank
Gathering: Living Room | Hall | Lobby | Dining Room | Lounge Area
Bedrooms: Master Bedroom | Parents Room | Children's Room(+) | Guest Bedroom(+)
Kitchen: Kitchen
Bathrooms: Bathroom(+) | Toilet(+)
Sacred+Study: Puja Room | Study Room(+)
Storage+Vertical: Store Room(+) | Staircase | Lift
Outdoor: Balcony(+) | Garden | Front Yard | Backyard | Play Area | Swimming Pool
Vehicles: Car Garage | Parking
Leisure+Work: Bar/Drinks Area | Mini Home Theatre | Office/Work Area(+)

## Marker Interaction
Click existing marker → panel opens:
  [🗑 Remove this marker]  [✦ Tips in PDF]
Remove: deletes placedRooms[key], decrements roomCounts[base], redraws canvas
Tips: shows "Complete Vastu guidelines for this room are in your free PDF report"
(Do's/Donts NOT shown on screen — PDF only)

## Neutral Zone Message (exact text)
"The [Room] is located in the [Zone] zone. This placement is energetically neutral —
it neither generates significant positive energy nor creates negative Vastu doshas
for the household. Maintaining cleanliness, good lighting, and clutter-free conditions
in this zone will ensure the space remains energetically balanced."

## Free vs PDF-only
FREE on screen: Score, room name, zone, severity badge (CRITICAL/MODERATE/POSITIVE/NEUTRAL), impact text
PDF ONLY: Technical Remedy, Actionable Remedy, Do's, Don'ts, General Guidelines

## Technical Remedy Definition
= Structural changes only. Relocating rooms, changing plumbing/drainage, rebuilding walls.
Example: "Relocate the kitchen to the Southeast zone. This requires replumbing gas
connections, relocating exhaust, rebuilding countertops by licensed contractors."

## Actionable Remedy Definition
= Non-structural only. If structural change not possible.
Example: "Place a copper vessel filled with water next to the stove and change it daily.
Hang a blue curtain on the Northeast kitchen wall."
Never says "No structural changes needed" — says "If structural change is not possible:"

## VastuPro PDF — 6 Pages

Page 1 — Cover:
NirmanShastra logo | VastuPro badge "Phase 0 — Free"
Client name (large, gold) | Property details | Date
3×3 Vastu Purusha Mandala preview illustration
Key specs: North X° | Rooms analysed | Score: XX/100 | Report ID: NS-VS-XXXX

Page 2 — Executive Summary + Property Details:
Two columns:
Left: Property details table (name, mobile, email, address, city, type, plot size, North, rooms, date, report ID)
Right: Circular score (73/100), three pills (Critical/Moderate/Positive counts)
Auto-generated paragraph from findings data

Page 3 — Vastu Mandala Diagram (FULL PAGE SVG):
House shape drawn to proportion from canvas dimensions
Overlaid 16-zone Vastu Mandala
Each zone colour-coded: green=positive, red=critical, amber=moderate, grey=neutral/empty
Each zone labelled: zone name + governing deity + recommended use + actual room placed
Compass rose (bottom right) showing actual North degree
Brahmasthan centre: gold circle + "ब" symbol + "Keep Open" text
Caption: "Vastu Purusha Mandala: 16-zone compliance analysis for your property"

Page 4 — Room-by-Room Analysis:
One card per finding (colour-coded border left):
  CRITICAL = red | MODERATE = amber | POSITIVE = green | NEUTRAL = grey
Per card:
  Severity badge
  Room name · Zone
  Impact paragraph (full text)
  TECHNICAL REMEDY heading + structural remedy text
  ACTIONABLE REMEDY heading + non-structural remedy text
  DO'S section (✓ per point, up to 8)
  DON'TS section (✗ per point, up to 8)
CRITICAL: Each text block = separate Paragraph → separate Table row (prevents PDF overflow)

Page 5 — General Vastu Guidelines:
11 sections × 6-8 bullet points:
1. Mirrors & Reflective Surfaces
2. Toilets & Bathrooms
3. Bedroom Essentials
4. Plants & Nature
5. Clutter & Cleanliness
6. Lighting & Colours
7. Water Elements
8. Main Entrance Rituals
9. Kitchen Essentials
10. Financial & Prosperity Energy
11. Sleep & Rest Energy

Page 6 — Recommendations + Cross-sell:
Priority table (High/Medium/Low per finding with Action column)
Mini Mandala reference grid
StructoPro cross-sell card (full width, green gradient):
  "Phase 1 — RCC Structure
   Your Vastu layout is complete. The next step: know exactly what your RCC
   structure will cost before your contractor quotes you.
   [Estimate My Structure Cost — StructoPro ₹499 →]
   Your plot dimensions are noted. The form takes 8 minutes."
QR code to StructoPro
NirmanShastra footer + legal disclaimer

---

# SECTION 13 — APP 2: STRUCTOPRO (Phase 1 — ₹499)

## Method Selection (3 cards — Page 2)

Card 1: Design Myself
"Answer plain questions about your building. No engineering knowledge needed."

Card 2: I Have Structural Drawings [Badge: Uses Claude AI]
"Upload your engineer's drawings. AI reads column sizes, bar diameters, concrete grades."
→ Claude API (vision) extracts: column sizes, bar diameters, concrete grades per member,
   floor dimensions, seismic zone from drawing notes
→ Verification screen: user confirms/corrects extracted values
→ Continues to material rates + labour sections

Card 3: Add Floors to Existing Building [Amber border]
"Estimate cost of additional floors on your current structure."
[Warning badge: Structural certificate mandatory]
3 sub-flows:
  A: Upload existing + new floor drawings → AI extracts both
  B: Upload new floor drawings → AI extracts + user enters existing column info
  C: No drawings → enter column count + dimensions → 4 IS code safety checks

Vertical Extension Safety Checks (Sub-flow C):
Check 1 — Column size vs floors:
  230×230mm = G+0 only | 300×300mm = G+1 | 350×350mm = G+2 | 400mm+ = G+3+
Check 2 — Beam span: floor area ÷ columns > 36 sqm = WARNING
Check 3 — Seismic: Zone IV min 250mm | Zone V min 300mm
Check 4 — Min 4 columns required
Results: All pass = gold button | Warnings = amber | Errors = red "Not Safe to Proceed"

Vertical Extension Calculation Rules:
- Foundation EXCLUDED | Excavation EXCLUDED
- Splice bars: +8% steel (IS 456:2000 Cl.26.2.5, lap = 50× bar diameter)
- Curing: 14 days per new floor
- PDF badge: "🔼 Vertical Extension — New Floors Only"

## Build Details Form (Page 3)

Plain questions visible by default:
1. Where is your plot? (State → City → Zone → auto-fills rates)
2. How many floors? (G / G+1 / G+2 / G+3 / G+4 / G+5)
3. What is your ground floor area? (with unit converter: sqft/sqm/sq yard)

Per-floor table:
Floor | Length (ft) | Width (ft) | Area (auto) | Height (ft) | Use type

Scope checkboxes: Staircase structure | Overhead tank slab | Parapet | Car parking slab

Site conditions (8 cards): Flat | Sloped 1:5 | Sloped 1:3+ | Rocky | Black Cotton Soil | Soft/Marshy | Waterlogged | Coastal

Foundation auto-recommendation:
Flat + good soil → Isolated footing
BCS → Under-reamed pile (warning)
Rocky → Rock-cut footing
Marshy/waterlogged → Raft or Pile

[Advanced Settings — collapsed]:
Concrete grade override per member | Steel grade override | Column dimensions
Seismic zone override | Exposure class override

Material rates (collapsed): "Using Pune Avg 2026 ✓ [Edit rates →]"

Labour (optional checkbox → 14 CPWD trades):
[CPWD Warning Box — exact text:]
"Why we cannot auto-calculate number of days: The number of working days for each
trade depends on factors no software can predict — curing intervals between pours,
monsoon shutdowns, festival breaks, sand bans, local political situations, labour
law changes by state, site access conditions. CPWD productivity rates calculate total
man-days of work required. You set the number of workers; days calculate automatically.
For custom trades, enter your own days."

14 CPWD Trades:
Bar Bender (Sariya Mistri) | 2 workers | 600 kg steel/day | ₹950
Shuttering Carpenter | 2 | 100 sqft formwork/day | ₹900
Concreting Mason (RCC) | 2 | 2.5 m³ concrete/day | ₹900
Vibrator Operator | 1 | per pour | ₹800
Excavation Mason | 1 | volume/day | ₹750
Rock Cutting Crew (inactive) | 0 | manual | ₹3,000
Crane/Hoist Operator | 1 | per day | ₹1,100
Concrete Pump Operator (inactive) | 1 | per day | ₹1,100
General Helper/Beldar | 4 | ratio | ₹580
Curing/Water Man | 1 | per day | ₹500
Night Watchman | 1 | per day | ₹500
Junior Site Engineer | 1 | per day | ₹1,500
Site Foreman | 1 | per day | ₹1,200
Safety Officer | 1 | per day | ₹1,200

Each row: − toggle (blurs row, turns to +) | worker count | rate | + restore
No total on form. Total in report only.
+ Add Your Own Labour: blank row, person names trade + workers + rate + days

Contractor quote entry:
"Have a contractor quote? Enter it to compare after unlocking."
Total (₹) + optional itemwise: concrete rate | steel rate | formwork rate
"Quote saved. Comparison ready after unlock." (no comparison shown before payment)

## Results Page (Page 4)

VISIBLE FREE:
IS Compliance Panel (all checks green/amber/red with IS code refs)
Grade Comparison Bar Chart
10 Technical Reminders
Finishing Costs Guide:
  "What this report does NOT include — Budget separately:"
  Brickwork+Masonry: 20-25% | Plaster+WP: 8-10% | Flooring: 10-15%
  Doors+Windows: 8-12% | Electrical: 8-12% | Plumbing: 6-10%
  Paint: 4-6% | False ceiling+carpentry: 5-10%
  Contractor overhead: 10-15% | Professional fees: 2-4%
  "Basic finish: 1.8-2.0× | Standard: 2.2-2.5× | Premium: 2.8-3.2×"
  "The structural frame is only 40-45% of total building cost."
  "Do not approach your bank with structural estimate alone."
Grand Total Range (THE HOOK): "Your Structure Cost: ₹18.4 – ₹22.6 Lakhs"

BLURRED (₹499 required):
Exact material quantities | Itemised costs | Labour days+costs | Room-by-room breakdown

Unlock card:
"Your Phase 1 structure estimate is ready.
Unlock exact quantities and contractor comparison for ₹499.
Or save ₹1,496 with the complete 5-app bundle for ₹2,999."
[Unlock Report ₹499] [See Bundle ₹2,999]

## Post-Payment
Full quantities revealed | All tabs unlocked
Contractor comparison: line-by-line with rupee discrepancies + flag reasons
PDF generates via Puppeteer | Email via Resend

## StructoPro PDF — 10 Pages + Page 11 (vertical extension)

Page 1: Cover (NirmanShastra logo, StructoPro badge "Phase 1 — RCC Structure", client details, date, report ID)
Page 2: Project Summary (property table, floor schedule, foundation type, seismic zone, concrete/steel grades)
Page 3: IS Compliance Panel (all checks with IS code citations)
Page 4: Column Layout Plan SVG (top view, column grid, dimensions, North arrow)
Page 5: Foundation Section SVG (cross-section, depth, dimensions, steel placement)
Page 6: Foundation BOQ (excavation, PCC, concrete, steel, formwork, backfill, anti-termite)
Page 7: Superstructure BOQ (per member type per floor: concrete m³, steel kg, formwork sqft)
Page 8: Material Schedule (purchase quantities: cement bags, steel kg by dia, aggregate cft, sand cft, binding wire kg)
Page 9: Cost Summary (Basic/Standard/Premium three columns: materials, labour, total, per sqft)
Page 10: Grade Comparison + Finishing Costs Guide + MasonPro cross-sell
Page 11 (VE only): Splice/Lap Bar Schedule per IS 456:2000 Cl.26.2.5
  Column ID | Existing bar dia | Lap length (mm) | Bar count | Weight (kg)
  Caption: "Splice bars most frequently omitted in VE quotes. Ask contractor to show in steel schedule."

---

# SECTION 14 — APP 3: MASONPRO (Phase 2 — ₹499)

## Method Selection (3 cards)
Card 1: Design from scratch
Card 2: I have structural drawings (AI reads wall specs)
Card 3: Adding masonry to existing structure
  Sub-flows: New floors only | Horizontal extension | Renovation/repair | Partition walls only
  Vertical extension masonry: IS 4326:1993 seismic bands auto-added for Zone III-V

## Wall Types — 8 External
1. Red clay brick modular (190×90×90mm, IS 1077:1992)
2. Red clay brick non-modular (230×115×75mm)
3. Fly ash brick modular (IS 12894:2002)
4. Fly ash brick non-modular
5. Hollow concrete block 200mm (IS 2185:2005)
6. Solid concrete block 200mm
7. AAC block 200mm [⚠️ Zone IV-V warning]
8. CLC foam block 200mm

## Wall Types — 6 Internal Partitions
1. Clay brick 4.5" | 2. Fly ash brick 4.5" | 3. Hollow block 100mm
4. AAC block 100mm [⚠️] | 5. CLC 100mm | 6. Gypsum/drywall

## Unique Free Features
1. All 8 wall type comparison chart (cost per sqm at user's city rates — fully visible free)
2. IS 2212:1991 masonry practice checker (5 site practices as pass/fail)

## AAC Warning (shown when AAC selected + Zone IV or V)
"⚠️ IS 4326:1993: AAC blocks NOT permitted as load-bearing masonry in Zones IV and V.
Approved for infill/partition only. Your project is Zone [X]. Ensure structural engineer
has specified load-bearing walls as clay brick or hollow concrete block."

## Labour — 10 CPWD Trades
Brick Layer (Raj Mistri) | 3 workers | 120 sqft/day (9" modular) | ₹850
Mason Helper | 3 | ratio | ₹560
Plaster Mason | 2 | 100 sqft/day | ₹800
Plaster Helper | 2 | ratio | ₹540
Waterproofing Specialist | 1 | 80 sqft/day | ₹1,100
Scaffolding Erector | 1 | per day | ₹750
Material Mixer | 1 | per day | ₹650
Curing/Water Man | 1 | per day | ₹500
Site Foreman | 1 | per day | ₹1,200
Night Watchman | 1 | per day | ₹500
IS 2212:1991 note: "Cure masonry minimum 7 days with wet gunny. Budget dedicated curing person."

## Phase Context (Visible Free)
Phase 2 masonry = 20-25% of total project cost
On ₹25L total = ₹5-6.25L
"Overcharging via: inflated brick counts, wrong mortar ratio, skipping curing, brick substitution."

## PDF — 9 Pages
1. Cover | 2. Project Summary | 3. IS Compliance Panel
4. Wall Section SVG | 5. 8 Wall Type Comparison Chart
6. Waterproofing Detail SVG | 7. Brickwork BOQ | 8. Plastering BOQ
9. Waterproofing BOQ + Cost Summary + ElectroPro cross-sell

---

# SECTION 15 — APP 4: ELECTROPRO (Phase 3 — ₹499)

## Method Selection (3 cards)
Card 1: Design from scratch
Card 2: I have electrical drawings (AI reads single-line diagram, DB schedule)
Card 3: Retrofit/Upgrade
  Sub-flows: Full rewiring | Additional circuits | DB panel upgrade only
  Warning: "Add 15-20% contingency for concealed wall chase repair."

## Unique Free Feature
DB panel schedule preview: number of ways + MCB ratings visible free
Quantities blurred. Value = user sees exactly how many circuits they have.

## Labour — 8 CPWD Trades
Licensed Electrician | 2 | 8-10 points/day | ₹1,200
Wireman | 2 | ratio | ₹750
Conduit Fixer | 1 | 50 running ft/day | ₹700
DB Panel Installer | 1 | 1 panel/day | ₹1,500
Helper/Wall Chase | 2 | per day | ₹560
Earthing Specialist (inactive) | 1 | per pit | ₹1,100
Testing & Commissioning | 1 | per day | ₹1,400
Night Watchman | 1 | per day | ₹500
IS 732:2019 note: "Verify Class B license. Unlicensed electrical work voids insurance."

## Phase Context (Visible Free)
Phase 3 electrical = 8-12% of total project cost
"Overcharging via: oversized wires for basic circuits, premium MCBs where standard suffices,
unnecessary large DB panels, duplicate point counting."

## PDF — 8 Pages
1. Cover | 2. Load Analysis | 3. Single Line Diagram SVG
4. DB Panel Schedule | 5. Floor Wiring Schematic SVG
6. Wire Schedule | 7. Material Schedule | 8. Cost Summary + PlumbPro cross-sell

---

# SECTION 16 — APP 5: PLUMBPRO (Phase 4 — ₹499)

## Method Selection (3 cards)
Card 1: Design from scratch
Card 2: I have plumbing drawings (AI reads isometric/riser diagram)
Card 3: Retrofit/Extension (extend riser | new bathrooms | drainage re-routing)
  Warning: "If replacing GI pipes >20 years old, add 20-30% for removal + wall chase."

## Unique Free Feature
IS 1172:1993 Water Demand Calculator always visible free:
Daily demand → tank size → pump HP
IS note: "Tank undersizing is dangerous. Verify contractor's proposed size against IS requirements."

## Labour — 8 CPWD Trades
Licensed Plumber | 2 | 6-8 CPVC joints/day | ₹1,100
Plumber Helper | 2 | ratio | ₹600
Sanitary Fitter | 1 | 3-4 fixtures/day | ₹1,000
Excavation for Drainage | 1 | volume/day | ₹750
Tank Installation (inactive) | 1 | per tank | ₹2,000
Pump Installation (inactive) | 1 | per pump | ₹1,500
Testing/Flush Test | 1 | per day | ₹1,000
Night Watchman | 1 | per day | ₹500

## Phase Context (Visible Free)
Phase 4 plumbing = 6-10% of total project cost
"Overcharging via: upsized pipe diameters, unnecessary motor HP, CPVC vs UPVC substitution,
billing for fixtures owner supplies separately."

## PDF — 8 Pages
1. Cover | 2. Water Demand Calculation (IS 1172:1993)
3. Water Supply Riser SVG | 4. Drainage Layout SVG
5. Tank+Pump Schematic SVG | 6. Pipe Schedule
7. Fixture Schedule | 8. Cost Summary + InteriorPro cross-sell

---

# SECTION 17 — APP 6: INTERIORPRO (Phase 5 — ₹499)

## Two Paths
Card 1: Quick Estimate [Badge: "Best for budgeting. ±15% accuracy."]
Card 2: Exact Dimensions [Badge: "Best for contractor briefing. ±5% accuracy."]
  [Badge: Upload floor plan for AI auto-fill]
⚠️ AI floor plan upload: InteriorPro ONLY. Never for structural apps.

## Unique Free Feature
Full grade comparison table visible without payment:
All 4 grades × all items (flooring, kitchen, paint, false ceiling, doors)
This is the primary hook — user selects grade, sees total impact.

## Grade Rates
Kitchen: Basic ₹1,200/rft | Standard ₹2,200 | Premium ₹3,800 | Luxury ₹7,500
Flooring: Basic ₹65/sqft | Standard ₹120 | Premium ₹265 | Luxury ₹650
False ceiling: Standard ₹165/sqft | Premium ₹255 | Luxury ₹455
Paint: 0.18L per sqft BUA | 40-50 sqft coverage per litre (2 coats + primer)
Tile wastage: 10% standard

## Labour — 10 CPWD Trades
Tile Mason (Flooring) | 2 | 80-100 sqft/day | ₹900
Tile Mason (Wall) | 1 | 60 sqft/day | ₹950
Tile Helper | 2 | ratio | ₹560
Carpenter | 2 | per day | ₹1,200
Painter | 2 | 400 sqft/day (2 coats) | ₹700
False Ceiling Installer | 1 | 150 sqft/day | ₹1,000
Polishing/Grinding (inactive) | 1 | 200 sqft/day | ₹1,100
Electrician (fixture fitting) | 1 | per day | ₹1,100
Interior Helper | 2 | ratio | ₹540
Supervisor | 1 | per day | ₹1,200

## Phase Context (Visible Free)
Phase 5 interior = 12-18% of total project cost
Grade multipliers: Basic 1.0× | Standard 1.6× | Premium 2.4× | Luxury 3.5×
"Interior grade affects final cost more than any other phase."

## PDF — 8 Pages
1. Cover | 2. Project Summary
3. Room Layout SVG | 4. Grade Comparison Table
5. Flooring Schedule | 6. Kitchen Elevation SVG
7. Complete Interior BOQ | 8. Total Summary

---

# SECTION 18 — GRAND TOTAL REPORT

₹999 standalone | FREE if all 5 apps paid individually
15 pages: Cover | Executive Summary | Phase Timeline | 2 pages per phase (summary) | Grand Total Breakdown | Disclaimer

---

# SECTION 19 — 9 USER FLOWS

1. Full house from scratch — all 5 phases
2. Flat possession bare shell — ElectroPro + PlumbPro + InteriorPro only
3. Flat interior only — InteriorPro only
4. Adding new floor — StructoPro (VE) + MasonPro + optional others
5. Horizontal extension — StructoPro + MasonPro + optional others
6. Commercial+residential — all apps with commercial rate tables
7. Renovation/repair — MasonPro + ElectroPro + PlumbPro (retrofit flows)
8. Real estate developer — bulk rates, multiple units
9. NRI building in India — all apps, remote consultant feature
Scope selector shows ONLY relevant apps per project type.

---

# SECTION 20 — CONTRACTOR QUOTE COMPARISON

Pre-payment (all paid apps):
User enters contractor total (₹) or itemwise quantities.
Saved silently. Shows: "Quote saved. Comparison ready after unlock."
No quantities revealed before payment.

Post-payment comparison per app:
StructoPro: concrete m³, steel kg, formwork sqft vs IS-code calculated
MasonPro: brick counts, mortar ratios, plaster thickness, curing method
ElectroPro: wire gauges, MCB ratings, circuit counts, earth pits
PlumbPro: pipe diameters, tank capacity, pump HP, fixture counts
InteriorPro: flooring rates, kitchen rft rates, paint coverage, tile wastage

Flag reasons: "Quantity inflation X% above IS code" | "Material substitution without disclosure" | "Missing item — [name]" | "Rate inflation X% above city average"

Free lightweight version: single item check → CTA to full comparison

---

# SECTION 21 — EMAIL SEQUENCES (Resend)

Masonry starts 60-90 days after RCC pour (NOT 21 days — IS 456 curing + stripping + prep)

From VastuPro: Day 0 PDF+StructoPro CTA | D7 Contractor tips | D45 Masonry note | D75 E+P CTA | D120 Interior
From StructoPro: Day 0 PDF+MasonPro | D7 Contractor tips | D45 "Masonry can begin 2-4 weeks" | D75 E+P | D120 Interior
From MasonPro: D0 PDF+Electro | D7 IS 2212 curing checklist | D45 Electro timing | D75 Plumbo | D120 Interior
From ElectroPro: D0 PDF+Plumbo | D7 IS 732 safety | D45 coordination | D75 Interior | D120 Bundle
From PlumbPro: D0 PDF+Interior | D7 IS 1172 tank maintenance | D45 fit-out timing | D75 Bundle
From InteriorPro: D0 PDF+Bundle | D7 Interior tips | D45 Maintenance schedule

---

# SECTION 22 — LOYALTY + BUNDLE PRICING

Post-payment banner in every report:
1 app paid (₹499) → Remaining 4 for ₹1,500 (saves ₹496)
2 apps paid (₹998) → Remaining 3 for ₹1,001 (saves ₹496)
3 apps paid (₹1,497) → Remaining 2 for ₹502 (saves ₹496)
2nd report same app: ₹100 off
After 3 reports: credit toward complete package

---

# SECTION 23 — ADMIN DASHBOARD

Access: Logo 5× clicks → password (env var ADMIN_PASSWORD, never hardcoded)
Silent fail on wrong password.
Cookie: adminSession, 24 hour expiry.

Tabs: VastuPro | StructoPro | MasonPro | ElectroPro | PlumbPro | InteriorPro

Each tab:
Total estimates | Total paid | Conversion rate | Total PDFs
City distribution bar chart | Average report value
Recent reports table: name, mobile, city, project, total, paid status
CSV export button

VastuPro tab extra:
Total registrations (at login) | Total analyses | Total downloads
3-step funnel (registered → analysed → downloaded)
Most analysed rooms (which of 33 rooms appear most)
Most common critical issues (zone+room combination frequency)

---

# SECTION 24 — SVG DRAWINGS IN ALL PDFS

All carry disclaimer: "Schematic for estimation reference only. Not for construction without structural engineer approval."

VastuPro: 16-zone Vastu Mandala full page + compass overlay
StructoPro: Column layout plan (top view) + Foundation section (cross-section)
MasonPro: Wall section + Waterproofing detail
ElectroPro: Single line diagram + Floor wiring schematic
PlumbPro: Water supply riser + Drainage layout + Tank/pump schematic
InteriorPro: Room layout + Kitchen elevation

---

# SECTION 25 — HOMEPAGE STRUCTURE

Announcement bar: "NirmanShastra — IS-code-traceable construction cost estimation and professional BOQ generation for Indian homes — every quantity tied to a BIS/IS clause, across structure, masonry, electrical, plumbing, and interior"
Navbar: Logo | Tools▾ | How It Works | Pricing | Blog | Login | Get Started
Hero: "Build With Certainty" | Stats | [Start Free VastuPro] [See Pricing]
Social proof marquee
Problem section (3 cards)
Solution (6 app cards + bundle CTA)
Free Calculators (12 standalone)
How It Works (4 steps)
Testimonials (3 cards)
AI Chatbox preview
IS Code Trust section (all IS codes as badges)
Pricing preview (3 tiers)
Footer

---

# SECTION 26 — BUILD SEQUENCE OVERVIEW

P0: Project scaffold (Next.js 15, Supabase, Razorpay, Resend, Puppeteer, Claude API, Vercel)
P1: States+cities DB, IS code constants, Indian units, plot shapes, rates panel component
P2: StructoPro calculation engine (TypeScript, verified IS values from Section 8 only)
P3: StructoPro React 4-page wizard
P4: VastuPro (canvas, compass, zone engine, free PDF)
P5: MasonPro + ElectroPro + PlumbPro + InteriorPro
P6: Razorpay payment (HMAC SHA256 server-side only)
P7: Puppeteer PDF + Resend email + SVG drawings
P8: AI chatbox (Claude API, report context in system prompt)
P9: 12 free calculators
P10: Homepage + landing pages + SEO
P11: Admin dashboard

MVP target: P0-P4 in Weeks 1-4
Full platform: P5-P11 in Weeks 5-10

---

# SECTION 27 — SOURCE FILES

StructoPro_v3_CLEAN.html — source of truth for StructoPro calc logic (3061+ lines)
ElectroPro_v2.html — electrical calculation logic
PlumbPro_v1.html — plumbing calculation logic
MasonPro_v2.html — 8 masonry types
InteriorPro_v1.html — interior with AI floor plan path
VastuSutra Flask: web-production-121d.up.railway.app | GitHub: karwakarishma-ux/groundtruth-vastu

All HTML files use 'YOUR_RAZORPAY_KEY_HERE' placeholder.

---

# SECTION 28 — PRICING (FINAL)

Launch: ₹499 per app | Bundle ₹2,999 | Grand Total ₹999
Month 4: StructoPro ₹999 | MasonPro ₹799 | ElectroPro ₹699 | PlumbPro ₹699 | InteriorPro ₹999
Professional subscription: ₹1,999/month (planned)
Never discount below launch price.
Monthly cost: ~₹1,767 (Cursor + domain). Break-even: 9 paid reports/month.

---

# SECTION 29 — CONTINUING IN A NEW CHATBOX

When this chatbox is full:
1. Start a new Claude chat
2. Upload or paste this document
3. Say: "This is my complete NirmanShastra build reference. Read it fully.
   I am Sudip, a civil engineer building this platform. Continue from where we left off."

Claude's memory system carries forward automatically:
- Your name and background
- NirmanShastra project context
- Tech stack decisions
- All the IS code values as memories

In the new chat you can also say:
"Read the transcript of my previous NirmanShastra conversation"
Claude can access the detailed conversation history from the transcript.

What to work on next (suggested order):
1. Domain registration (NirmanShastra.in / NirmanPro.in — check availability)
2. Supabase project setup (create project, run schema from Section 4)
3. Razorpay account + KYC (for live payments)
4. Start Cursor build with P0 prompt from Section 26

---

*DOCUMENT COMPLETE — Version Final, June 2026*
*IS code values in Section 8 are verified and final. Do not overwrite from any other source.*
*All StructoPro chatbox values superseded by Section 8 where conflicts exist.*
