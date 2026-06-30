export interface BlogArticle {
  slug: string
  title: string
  excerpt: string
  category: string
  readTime: number
  publishedDate: string
  content: string
  relatedSlugs: string[]
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: 'verify-contractor-quote-is-456-2000',
    title: "How to Verify Your Contractor's Quote Against IS 456:2000",
    excerpt:
      'Most Indian homeowners accept contractor quotes on faith. IS 456:2000 gives you the numbers to push back — here is exactly how to check M20 concrete quantities and spot overcharging before it starts.',
    category: 'Structural',
    readTime: 5,
    publishedDate: '2026-06-15',
    relatedSlugs: ['m20-vs-m25-concrete-grade', 'per-sqft-pricing-contractor-fraud', 'steel-theft-construction-sites'],
    content: `## Why Your Contractor's Quote Might Be Wrong

When you hire a contractor in India, you receive a quote that lists quantities — bags of cement, tonnes of steel, cubic metres of concrete. These numbers feel technical, so most homeowners sign without questioning them. That is exactly where overcharging begins.

IS 456:2000 — the Indian Standard for Plain and Reinforced Concrete — is a publicly available document that specifies *exactly* how much material goes into each structural element. If your contractor's quantities don't match the IS 456 norms, something is wrong.

## The Key Numbers in IS 456:2000

For **M20 concrete** (the minimum grade for reinforced concrete work per IS 456 Clause 6.1), the correct cement consumption is **8.07 bags (50kg each) per cubic metre** of concrete poured. This is derived from the water-cement ratio and mix proportions specified in IS 10262:2019.

For a typical 1,000 sq ft, G+1 residential building:
- Ground floor slab: approximately 20 m³ of concrete
- That should consume roughly **161 bags of cement** for the slab alone

If your contractor quotes 120 bags for the same slab, that is a red flag. Either the slab is thinner than specified, or the concrete mix is weaker than M20.

## Red Flags to Look For

**1. No grade specification.** Any legitimate quote should state M20, M25, or M30. "Concrete work" without a grade is meaningless — it lets the contractor pour M10 (weak roadwork mix) and charge you for M20.

**2. Cement quantity too low.** The IS 456 mix design minimum for M20 requires 320 kg of cement per cubic metre. Anything below this violates the standard and produces under-strength concrete.

**3. No water-cement ratio stated.** IS 456 Clause 6.1.2 caps the w/c ratio at 0.55 for M20 in moderate exposure. Too much water makes concrete weak. A good contractor will state this; a corner-cutting one won't.

**4. Aggregate sizes not specified.** IS 456 requires nominal maximum aggregate size of 20mm for slabs. "Stone chips" without a size spec is a warning.

## How to Cross-Check a Quote

Step 1: Ask for the structural drawing with slab thickness marked. A typical residential slab is 125–150mm thick.

Step 2: Calculate the volume: length × width × thickness in metres.

Step 3: Multiply by 8.07 to get the expected cement bags for M20.

Step 4: Compare with the contractor's quoted bags. A variance of more than 10% needs an explanation.

NirmanShastra's StructoPro tool does this calculation automatically — it applies IS 456:2000 norms to your exact floor area, soil type, and seismic zone, and produces a quantity table you can place beside any contractor's quote.

---

*Try StructoPro to generate your IS 456:2000 compliant quantity schedule before accepting any contractor quote.*`,
  },
  {
    slug: 'm20-vs-m25-concrete-grade',
    title: 'M20 vs M25 Concrete: Which Grade Does Your Building Need?',
    excerpt:
      'Using the wrong concrete grade is not just inefficient — it can be illegal under IS 456:2000. This guide explains exposure classes, when each grade is mandatory, and why your location matters more than you think.',
    category: 'Structural',
    readTime: 5,
    publishedDate: '2026-06-18',
    relatedSlugs: ['verify-contractor-quote-is-456-2000', 'seismic-zones-india-is-1893', 'steel-theft-construction-sites'],
    content: `## What the "M" and the Number Mean

The "M" in M20 stands for Mix, and the number is the **characteristic compressive strength in N/mm²** measured on 150mm cubes at 28 days. M20 means the concrete achieves 20 N/mm² — roughly 200 kg of force per square centimetre.

IS 456:2000 Table 5 sets the minimum grade for every exposure condition. Using a lower grade than the table requires is a code violation, regardless of whether any inspector ever visits your site.

## Exposure Classes — What IS 456 Actually Says

IS 456:2000 Clause 8.2 defines five exposure classes:

| Exposure Class | Description | Minimum Grade |
|---|---|---|
| Mild | Protected against weather, no aggressive contact | M20 |
| Moderate | Sheltered from severe rain, buried below ground | M25 |
| Severe | Alternate wetting/drying, coastal, road bridges | M30 |
| Very Severe | Sea water spray, de-icing salts, aggressive soil | M35 |
| Extreme | Tidal/splash zones, abrasive action | M40 |

## When M20 Is Enough — and When It Is Not

**M20 is the absolute minimum** for any reinforced concrete in India. It is appropriate only for "Mild" exposure — an internal column, a protected slab, a beam that will never see rain or soil contact.

**M25 is mandatory** the moment any element is:
- In contact with soil or buried
- Part of a foundation
- In a coastal district within approximately 50 km of the sea
- In a region with aggressive soil chemistry (common in parts of Rajasthan, Gujarat, and coastal Karnataka)

For most Indian homes, **the correct minimum is M25 for all foundations and ground-level elements**, and M20 for upper-floor elements only.

## What This Means for Your Building

A contractor who quotes M20 for your footing in a coastal city is giving you under-specified concrete. The rebar inside will begin to corrode in 8–12 years because the chloride permeability of M20 is too high for a marine environment. By that time, the contractor is long gone and the repair bill is yours.

## Seismic Zones Add One More Layer

IS 1893:2016 (seismic code) combined with IS 13920:2016 (ductile detailing) requires M20 minimum for ductile frame structures in Zones III–V. In practice, for Seismic Zone IV and V cities like Delhi, Srinagar, Guwahati, and Patna, structural engineers will specify M25 or higher even for internal elements, because ductility is governed partly by concrete strength.

StructoPro auto-selects your seismic zone from your state and flags the concrete grade requirement in its IS compliance panel, so you know exactly what your location mandates — before you speak to a single contractor.

---

*Use StructoPro to see the correct concrete grade for your specific location, soil, and exposure class — backed by IS 456:2000 Table 5.*`,
  },
  {
    slug: 'steel-theft-construction-sites',
    title: "Steel Theft on Construction Sites: How to Catch It",
    excerpt:
      'Rebar under-delivery is one of the most common forms of contractor fraud in India. IS 1786:2008 gives you weight tables to verify every bar on your site. Here is exactly how to use them.',
    category: 'Structural',
    readTime: 6,
    publishedDate: '2026-06-20',
    relatedSlugs: ['verify-contractor-quote-is-456-2000', 'm20-vs-m25-concrete-grade', 'per-sqft-pricing-contractor-fraud'],
    content: `## The Most Common Fraud You've Never Heard Of

You paid for 5 tonnes of Fe 500D steel. The truck delivered what looked like 5 tonnes. But what actually arrived might be 3.8 tonnes — and you have no way to tell without weighing the bars yourself. This is rebar under-delivery, and it is routine on Indian construction sites.

The contractor bills for the full quantity. The bars are cut slightly shorter than the drawing requires, or thinner-diameter bars are substituted ("they'll never notice 10mm vs 12mm"), or some bundles simply vanish from the yard overnight.

IS 1786:2008 — the Indian Standard for High Strength Deformed Steel Bars — gives you the tool to check.

## The IS 1786:2008 Weight Table

Every standard rebar diameter has a **theoretical weight per metre**, derived from the density of steel (7850 kg/m³). IS 1786 Table 3 specifies these values:

| Diameter | Weight per metre |
|---|---|
| 8 mm | 0.395 kg/m |
| 10 mm | 0.617 kg/m |
| 12 mm | 0.888 kg/m |
| 16 mm | 1.580 kg/m |
| 20 mm | 2.470 kg/m |
| 25 mm | 3.854 kg/m |
| 32 mm | 6.313 kg/m |

The standard allows a manufacturing tolerance of ±4% on weight. Anything outside that range is substandard steel.

## How to Catch Under-Delivery on Your Site

**Step 1 — Count the bars.** When the truck arrives, count every bar in the bundle. Do not let the contractor's team do this alone.

**Step 2 — Measure the length.** Take a 10% sample of bars (every 10th bar) and measure the length with a tape. Standard cut lengths are 12 metres or 6 metres.

**Step 3 — Weigh the bars.** Use a simple luggage scale or a weighbridge. Take 5 bars, weigh them, and divide by (5 × measured length). Compare to the IS 1786 weight per metre table.

Example: You have 12mm bars. You weigh 5 bars each 6 metres long. Total weight should be 5 × 6 × 0.888 = **26.64 kg**. If you get 22 kg, you have bars that are under-weight by 17% — well outside the ±4% tolerance and cause to reject the delivery.

**Step 4 — Check the grade marking.** IS 1786 bars carry ribs on the surface whose pattern indicates the grade. Fe 500D bars have a distinct rib configuration. "TMT steel" without IS 1786 certification is an unregulated product.

## The Numbers That Matter for Your Building

For a typical 1,000 sq ft residential building, StructoPro calculates steel quantities per IS code norms:
- **Column reinforcement:** 196.25 kg per cubic metre of column concrete
- **Footing reinforcement:** 39.25 kg per cubic metre of footing concrete
- **Plinth beam / floor beam:** 117.75 kg per cubic metre of beam concrete

If your contractor's steel quantity is more than 10% below these IS-derived benchmarks, demand an explanation with structural drawings to back it up.

## What to Do if You Suspect Short Delivery

1. Do not let workers begin cutting until you've completed your checks.
2. Get the delivery challan signed by you and the driver — a dated, signed document showing actual delivered weight.
3. If the weighbridge shows a shortfall, reject the delivery in writing. Most contractors will adjust rather than face documented fraud.

---

*Generate your IS 1786:2008 compliant steel schedule with StructoPro before placing any material order.*`,
  },
  {
    slug: 'seismic-zones-india-is-1893',
    title: 'Seismic Zones in India: What IS 1893:2016 Means for Your Home',
    excerpt:
      'India is divided into four seismic hazard zones. IS 1893:2016 mandates specific design requirements for each — and most Indian homeowners have no idea which zone they live in, let alone what it means for their building.',
    category: 'Structural',
    readTime: 5,
    publishedDate: '2026-06-22',
    relatedSlugs: ['m20-vs-m25-concrete-grade', 'verify-contractor-quote-is-456-2000', 'per-sqft-pricing-contractor-fraud'],
    content: `## India's Seismic Map — and Why It Matters for Your Home

India sits on one of the most seismically active landmasses in the world. The Indian tectonic plate is pushing north into the Eurasian plate at roughly 5 cm per year — and that collision energy has to go somewhere.

IS 1893:2016 (Criteria for Earthquake Resistant Design of Structures) classifies India into four seismic zones based on the intensity of ground shaking expected in a 475-year return period earthquake:

| Zone | Factor Z | Hazard Level | Major Cities |
|---|---|---|---|
| Zone II | 0.10 | Low | Bengaluru, Hyderabad, Mumbai (parts), Chennai |
| Zone III | 0.16 | Moderate | Kolkata, Bhopal, Mumbai (most), Ahmedabad, Pune |
| Zone IV | 0.24 | High | Delhi NCR, Jammu, Haridwar, Sikkim, much of J&K |
| Zone V | 0.36 | Very High | Srinagar, Guwahati, North Bihar, Andaman & Nicobar |

Zone V has the highest seismic hazard. The Zone Factor Z (listed above) directly multiplies into the design base shear — the lateral force your building must resist.

## What Changes in High-Seismic Zones

If your home is in Zone IV or V, IS 1893:2016 combined with IS 13920:2016 (Ductile Detailing) mandates:

**1. Ductile detailing of reinforcement.** Closely spaced stirrups at beam-column joints, 135° hook bends, and minimum lap splice lengths. This is what prevents columns from shattering in a quake — they crush slowly and absorb energy rather than snapping.

**2. Higher concrete grade.** M25 minimum for all structural elements in Zones IV–V. Some structural engineers specify M30 for critical columns.

**3. Shear walls or bracing.** Buildings above G+2 in Zone IV–V typically need reinforced concrete shear walls to resist lateral loads.

**4. Soft storey check.** If your ground floor is open (common in commercial buildings with parking), IS 1893 requires explicit design for soft-storey failure — one of the most common collapse mechanisms in Indian earthquakes.

## The 2001 Bhuj and 2015 Nepal Lessons

The Bhuj earthquake (Zone V, 7.7 magnitude) killed 20,000 people in Gujarat. Post-earthquake surveys found that most collapse was in buildings constructed without seismic detailing — structures that would have stood with IS 13920 compliance.

The 2015 Nepal earthquake, which damaged parts of North India and Bihar, showed the same pattern: confined masonry and ductile RC frames survived; unreinforced brick and poorly detailed concrete did not.

## What to Ask Your Structural Engineer

Before your foundation is poured, ask:
- "What seismic zone am I in per IS 1893:2016?"
- "Have you designed for Zone Factor Z = [the value for your zone]?"
- "Are the beam-column joints designed per IS 13920?"
- "Can I see the design base shear calculation?"

A legitimate structural engineer will answer these immediately. If they can't, find another engineer.

StructoPro automatically detects your seismic zone from your state, applies the correct IS 1893:2016 parameters, and flags any items in the IS compliance panel that need attention for your zone level.

---

*Know your seismic zone and its structural requirements before you build. Try StructoPro for an IS 1893:2016 compliant structural estimate.*`,
  },
  {
    slug: 'per-sqft-pricing-contractor-fraud',
    title: 'Per Square Foot Pricing: Why It Hides Contractor Fraud',
    excerpt:
      'A "₹1,800 per sq ft" quote sounds simple. It is actually the most effective way to conceal material substitution and quantity fraud. Here is what the number hides — and what to demand instead.',
    category: 'Cost & Transparency',
    readTime: 5,
    publishedDate: '2026-06-24',
    relatedSlugs: ['verify-contractor-quote-is-456-2000', 'steel-theft-construction-sites', 'm20-vs-m25-concrete-grade'],
    content: `## The Appeal of a Single Number

"₹1,800 per square foot — all inclusive." It sounds clean, predictable, and easy to compare. You multiply by your floor area, get a total, and decide. Three contractors give you three numbers; you pick the lowest.

This is exactly the outcome a corner-cutting contractor wants. The per-sqft rate is a black box. It conceals every material substitution, every under-delivery, every shortcut — because there's nothing to check. You have no idea whether that ₹1,800 includes M20 or M15 concrete, 16mm or 12mm rebar, or whether the plumbing is CPVC or the cheapest PVC available.

## What the Number Actually Hides

Every construction project has a Bill of Quantities (BOQ) — a line-by-line breakdown of every material, its quantity, its rate, and its IS specification. A legitimate builder's BOQ has 80–150 line items. Per-sqft pricing collapses all of this into a single number.

The mathematics of fraud: if a contractor substitutes M15 for M20 concrete (cheaper by about 12%), uses 10mm rebar where the drawing calls for 12mm (saves 30% on steel weight), and uses 4.5" brick walls where you expected 9" (saves 40% on masonry), the savings to the contractor on a 1,000 sq ft house could be **₹3–5 lakh** — while the invoice still says ₹1,800/sqft.

You won't know until the plaster starts cracking in year 3, the steel rusts in year 8, or the structure cracks in the first moderate earthquake.

## The IS Code Anchor

IS 456:2000, IS 1786:2008, IS 1077:1992, and IS 732:2019 don't give you a per-sqft rate. They give you a quantity for every specific element. A properly specified construction contract lists:

- Grade of concrete (M20/M25/M30) for each pour
- Diameter and grade of steel (Fe 500D) for each element
- Brick specification (IS 1077 Class 3 minimum)
- Mortar mix ratio (1:4 or 1:6 depending on element)
- Plaster thickness (12mm internal, 20mm external)

Without these specifications in writing, signed before work begins, you have no recourse when substandard materials arrive.

## What to Demand Instead

Before signing any construction contract:

**1. Ask for a BOQ, not a rate.** A contractor who refuses to provide a line-item BOQ is hiding something. This is non-negotiable.

**2. Specify IS codes for every major material.** Concrete grade per IS 456, steel grade per IS 1786, bricks per IS 1077, pipes per IS 4985 (CPVC) or IS 4669 (UPVC).

**3. Get independent quantity verification.** A structural engineer or quantity surveyor can verify the BOQ against approved drawings. The fee is typically ₹5,000–15,000 — cheap against the exposure of a ₹50 lakh contract.

**4. Use NirmanShastra to generate your own BOQ baseline.** StructoPro produces an IS 456:2000 compliant structural BOQ for your specific floor area and zone. Place it beside the contractor's quote and look for gaps.

## The Comparison You Can Actually Make

Instead of comparing ₹1,800/sqft vs ₹2,100/sqft, compare:
- Contractor A: M20 concrete, 16mm Fe 500D columns, 9" brick walls = ₹1,800/sqft
- Contractor B: M25 concrete, 20mm Fe 500D columns, 9" brick walls = ₹2,100/sqft

Now you are comparing like for like. The second quote might be worth every rupee.

---

*Generate your own IS-code based BOQ with StructoPro — so you can compare contractor quotes on equal terms.*`,
  },
  {
    slug: 'rccb-electrical-safety-is-732-2019',
    title: 'RCCB and Electrical Safety: What IS 732:2019 Requires',
    excerpt:
      'Electrical fires and electrocution kill thousands of Indians every year. IS 732:2019 mandates specific safety devices for every home — most contractors omit them to cut costs. Here is what you cannot afford to skip.',
    category: 'Electrical',
    readTime: 5,
    publishedDate: '2026-06-26',
    relatedSlugs: ['water-requirements-is-1172-1993', 'per-sqft-pricing-contractor-fraud', 'vastu-vedic-architecture-16-zones'],
    content: `## Why Electrical Safety Is Under-Specified in Indian Homes

According to NCRB data, electrical fires and electrocution accidents cause thousands of deaths annually in India. The majority occur in residential buildings — and the common factor is inadequate protection devices that IS 732:2019 explicitly mandates.

The reason these devices are absent in many homes is simple: they add ₹8,000–25,000 to an electrical contract, and a contractor operating on per-sqft pricing will omit them without telling you.

IS 732:2019 — the Indian Standard for Electrical Installations — consolidates requirements from the earlier IS 732:1989 and aligns with IEC 60364. Here is what it actually requires.

## RCCB — Residual Current Circuit Breaker

A **Residual Current Circuit Breaker (RCCB)** disconnects power within 30–40 milliseconds when it detects a leakage current to earth. At the 30mA sensitivity rating (IS 732:2019 mandated for human protection), it will disconnect before cardiac fibrillation can occur.

IS 732:2019 Clause 41 requires RCCB protection for:
- All socket outlets accessible to the general public
- All bathroom and kitchen circuits
- Any outdoor socket circuit
- Circuits serving swimming pools, water features, or wet areas

A 4-pole, 63A, 30mA RCCB at the distribution board costs approximately ₹800–2,000. Omitting it to save this amount is false economy against the liability it prevents.

## MCB vs RCCB — Understanding the Difference

A **Miniature Circuit Breaker (MCB)** protects against overload and short circuit — it trips when current exceeds its rated value. It does **not** protect against earth leakage. You can electrocute yourself through a circuit that never trips its MCB.

An **RCCB** protects against earth leakage only — it will not protect against overload.

For complete protection, IS 732 recommends **RCBO** (Residual Current Circuit Breaker with Overcurrent protection), which combines both functions in a single device.

## Earthing — IS 3043:2018

IS 732 references IS 3043:2018 for earthing requirements. Every residential installation requires:
- A dedicated earth electrode (typically 2-metre copper-clad steel rod)
- Earth continuity conductors to every socket, switch, and appliance point
- Earth resistance below 1 ohm at the electrode

Homes built with aluminium wiring (now prohibited under IS 732 for domestic use) or without proper earth continuity to all metal enclosures are at high risk.

## What to Check in Your Contractor's Quote

Ask your electrical contractor to provide the following in writing:
1. RCCB rating and sensitivity (minimum 30mA) — for which circuits?
2. MCB/RCBO ratings for each circuit
3. Earth electrode specification and expected resistance
4. Wire specification — copper, IS 694:2010 grade, minimum 1.5mm² for lighting and 2.5mm² for power circuits

NirmanShastra's ElectroPro tool generates an IS 732:2019 compliant electrical schedule with room-by-room point loads, wire specifications, and protection device requirements for your floor plan.

---

*Get an IS 732:2019 compliant electrical estimate for your home — try ElectroPro.*`,
  },
  {
    slug: 'water-requirements-is-1172-1993',
    title: 'How Much Water Does Your Family Need? IS 1172:1993 Explained',
    excerpt:
      'Most Indian homes have undersized water tanks because no one calculated the actual requirement. IS 1172:1993 gives you an LPCD formula — and the answer will likely surprise you.',
    category: 'Plumbing',
    readTime: 4,
    publishedDate: '2026-06-28',
    relatedSlugs: ['rccb-electrical-safety-is-732-2019', 'per-sqft-pricing-contractor-fraud', 'vastu-vedic-architecture-16-zones'],
    content: `## The Problem with "We'll Just Add Another Tank Later"

Most Indian homeowners size their water storage by intuition — "one tank should be enough" — and add more later when the shortage becomes obvious. This approach is expensive (retrofitting tanks means structural work on the terrace) and avoidable.

IS 1172:1993 — the Code of Basic Requirements for Water Supply, Drainage and Sanitation — specifies the minimum water requirement per person per day for every type of use. These are the numbers your plumbing designer should be starting from.

## LPCD — Litres Per Capita Per Day

IS 1172:1993 Table 1 specifies the following design requirements:

| Type of Building | LPCD Requirement |
|---|---|
| Residential (with flush toilets) | 135 LPCD |
| Residential (with waterborne sewage) | 200 LPCD |
| Hotel / Guest House | 180 LPCD |
| School (day) | 45 LPCD |
| Office / Commercial | 45 LPCD |

For a standard residential building with flush toilets, IS 1172 requires **135 litres per person per day** as the design basis. A family of four therefore needs **540 litres per day** minimum.

## How to Size Your Tank

Step 1: Calculate daily requirement using IS 1172.
- Family of 4 × 135 LPCD = 540 litres/day

Step 2: Determine your municipal supply frequency. If water comes once every 48 hours, you need 2 days of storage.
- 540 × 2 = 1,080 litres minimum storage

Step 3: Add an overhead tank for gravity distribution.
- Standard: 60% in underground sump, 40% in overhead tank
- Overhead tank minimum: 432 litres (~500L commercial tank)

Step 4: Account for peak demand. IS 1172 uses a peak factor of 1.8 for domestic supply — meaning the peak hour demand is 1.8 times the average hourly demand. Your pump and pipe sizing must accommodate this.

## Common Undersizing Errors

**1. Treating IS 1172 as optional.** Many plumbers size by habit ("two 1,000L tanks always works") without calculating. In a 6-bedroom house with three bathrooms, two 1,000L tanks may cover only 12 hours of supply interruption.

**2. Ignoring servant quarters and guard rooms.** IS 1172 counts every person on the premises. If you have live-in domestic staff, add 135 LPCD per person.

**3. Not accounting for garden or car-washing.** IS 1172 does not cover landscape irrigation — you need to add this separately based on garden area.

**4. Under-specifying the sump pump.** The pump must refill the overhead tank within 2–3 hours of the municipal supply window. Undersizing the pump makes the full tank capacity useless.

## Pipe Sizing Follows From Tank Size

Once you know daily requirement, IS 1172 helps you size pipe diameters too. The main rising main from sump to overhead tank should carry the full daily refill in 2 hours — which determines the pipe diameter and pump head requirement.

NirmanShastra's PlumbPro tool takes your family size, floor count, and municipal supply schedule, applies IS 1172:1993 norms, and produces a complete plumbing schedule with tank sizes, pipe diameters, and fixture counts.

---

*Size your water storage correctly from day one — try PlumbPro for an IS 1172:1993 compliant plumbing estimate.*`,
  },
  {
    slug: 'vastu-vedic-architecture-16-zones',
    title: 'Vastu and Vedic Architecture: Understanding the 16 Zones',
    excerpt:
      'Vastu Shastra is not superstition — it is a 3,000-year-old environmental design system. The Vastu Purusha Mandala divides your plot into 16 functional zones, each with specific directional guidelines. Here is how it works.',
    category: 'Vastu',
    readTime: 5,
    publishedDate: '2026-06-30',
    relatedSlugs: ['rccb-electrical-safety-is-732-2019', 'water-requirements-is-1172-1993', 'verify-contractor-quote-is-456-2000'],
    content: `## Vastu Shastra — What It Actually Is

Vastu Shastra ("the science of dwelling") is the ancient Indian system of spatial arrangement that predates modern building science by millennia. Its core document, the Manasara (roughly 4th–6th century CE), describes the placement of rooms, doors, and structures in relation to cardinal directions, solar angles, and wind patterns.

Unlike popular misconception, Vastu is not primarily about ritual or superstition. At its base, it encodes environmental logic: the sun rises in the east, bringing light and warmth; prevailing summer winds in the Indian subcontinent come from the southwest; the north direction in the Northern Hemisphere receives less direct solar radiation. These observations informed where kitchens, bedrooms, and water bodies should sit.

## The Vastu Purusha Mandala

The foundational tool of Vastu is the **Vastu Purusha Mandala** — a square grid that divides any plot into zones, each associated with a deity (energy principle), a direction, and a set of activities.

The most common version used in residential design is the **9×9 grid (81 pada)**, but NirmanShastra's VastuPro works with the **16-zone model** that maps more directly to modern room types:

| Zone | Direction | Primary Association |
|---|---|---|
| 1 | North | Water bodies, treasury, cashflow |
| 2 | Northeast (Ishan) | Prayer room, open space, water |
| 3 | East | Social spaces, living room |
| 4 | Southeast (Agni) | Kitchen, fire elements, generator |
| 5 | South | Master bedroom, heavy storage |
| 6 | Southwest (Nairutya) | Master bedroom, heavy structures |
| 7 | West | Children's rooms, dining |
| 8 | Northwest (Vayu) | Guest room, movement-related rooms |
| 9 | Brahmasthan | Open centre — never built upon |
| 10–16 | Sub-zones | Transitional and service spaces |

The **Brahmasthan** (central zone) is the most critical — it should remain open or lightly loaded. Placing a pillar, staircase, or toilet in the Brahmasthan is considered the most adverse Vastu placement.

## Why Direction Matters — The Environmental Logic

**Northeast (Ishan):** The low morning sun enters from this direction, providing gentle light. Water here (a well, underground sump, or fountain) keeps this zone cool and receives sunlight — preventing stagnation. Scientifically: northeast-facing slopes and openings receive the most beneficial morning solar radiation in India.

**Southeast (Agni):** The kitchen here aligns with prevailing wind patterns — cooking fumes and smoke typically blow toward the northwest, away from the living areas.

**Southwest (Nairutya):** Heaviest rooms here — master bedroom, thick walls, storage — because this direction needs the most mass to block the harsh afternoon sun from the southwest.

**North:** Open or water-related spaces here take advantage of the cooler, less direct northern light — ideal for studies, meditation spaces, and areas requiring consistent lighting.

## Vastu and Modern Architecture

Contemporary Vastu consultation integrates these principles with structural requirements, local climatic conditions, and the specific plot's microenvironment. A north-facing plot in a cold high-altitude city (Shimla) needs different treatment than the same plot in Chennai.

NirmanShastra's **VastuPro** is a free tool that overlays the Vastu Purusha Mandala on your plot, scores each room's placement, and provides directional analysis with zone-by-zone recommendations. It uses precise compass bearings (not just cardinal directions) and accounts for true north vs magnetic north deviation.

---

*Analyse your plot layout against the Vastu Purusha Mandala with VastuPro — free, no payment required.*`,
  },
]

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find(a => a.slug === slug)
}

export function getRelatedArticles(article: BlogArticle): BlogArticle[] {
  return article.relatedSlugs
    .map(s => getArticleBySlug(s))
    .filter((a): a is BlogArticle => a !== undefined)
    .slice(0, 3)
}
