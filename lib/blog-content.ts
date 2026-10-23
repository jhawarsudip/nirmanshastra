export interface BlogArticle {
  slug: string
  title: string
  excerpt: string
  category: string
  readTime: number
  publishedDate: string
  /** ISO date of the last substantive edit. Falls back to publishedDate. */
  updatedDate?: string
  /** 'hi-Latn' = Hindi written in Roman script (the site's Hinglish post). Default 'en'. */
  language?: 'en' | 'hi-Latn'
  /** 40–60 word direct answer shown under the headline. Every figure must be traceable. */
  quickAnswer?: string
  faq?: { question: string; answer: string }[]
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
    updatedDate: '2026-10-23',
    quickAnswer: "Multiply your slab or element volume in cubic metres by 8.07 to get the 50 kg cement bags M20 concrete needs (IS 456:2000). A 20 m³ slab needs about 161 bags, so a quote for 120 bags is a red flag. A variance above 10% needs a written explanation from the contractor.",
    faq: [
      { question: "How many cement bags does M20 concrete need per cubic metre?", answer: "About 8.07 bags of 50 kg cement per cubic metre of M20 concrete. A 20 m³ pour therefore needs roughly 161 bags." },
      { question: "How do I cross-check a contractor's cement quantity?", answer: "Get the structural drawing with slab thickness marked (a typical residential slab is 125–150 mm), multiply length × width × thickness in metres to get the volume, multiply by 8.07 for M20, and compare with the quoted bags. A variance of more than 10% needs an explanation." },
      { question: "What is the minimum concrete grade for reinforced concrete?", answer: "M20 is the minimum grade for reinforced concrete work under IS 456:2000 Clause 6.1." },
      { question: "What are the red flags in a concrete quote?", answer: "No concrete grade stated, a cement quantity far below the IS 456 norm, no water-cement ratio stated, and no aggregate size specified. 'Concrete work' with no grade is meaningless." },
    ],
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

NirmanShastra's StructurePro tool does this calculation automatically — it applies IS 456:2000 norms to your exact floor area, soil type, and seismic zone, and produces a quantity table you can place beside any contractor's quote.

---

*Try StructurePro to generate your IS 456:2000 compliant quantity schedule before accepting any contractor quote.*`,
  },
  {
    slug: 'm20-vs-m25-concrete-grade',
    title: 'M20 vs M25 Concrete: Which Grade Does Your Building Need?',
    excerpt:
      'Using the wrong concrete grade is not just inefficient — it can be illegal under IS 456:2000. This guide explains exposure classes, when each grade is mandatory, and why your location matters more than you think.',
    category: 'Structural',
    readTime: 5,
    publishedDate: '2026-06-18',
    updatedDate: '2026-10-23',
    quickAnswer: "M20 means a characteristic compressive strength of 20 N/mm² on 150 mm cubes at 28 days. IS 456:2000 Table 5 sets minimum reinforced-concrete grades by exposure: mild M20, moderate M25, severe M30, very severe M35, extreme M40. Foundations and buried elements fall in moderate exposure, so M25 is the safe minimum.",
    faq: [
      { question: "What does M20 mean?", answer: "The M stands for mix and the number is the characteristic compressive strength in N/mm², measured on 150 mm cubes at 28 days. M20 achieves 20 N/mm², roughly 200 kg of force per square centimetre." },
      { question: "What is the minimum concrete grade for each exposure class?", answer: "IS 456:2000 Table 5: mild M20, moderate M25, severe M30, very severe M35, extreme M40. IS 456 Clause 8.2 defines these five exposure classes." },
      { question: "When is M25 needed instead of M20?", answer: "When an element touches soil or is buried, is part of a foundation, sits in a coastal district (the guide uses roughly 50 km of the sea as a rule of thumb), or is in a region with aggressive soil chemistry. For most Indian homes that means M25 for foundations and ground-level elements and M20 for upper floors." },
      { question: "Is M20 enough for a footing?", answer: "Not when the footing is buried in soil: that falls under moderate exposure, which needs M25 under IS 456:2000 Table 5." },
      { question: "Does the seismic zone affect the concrete grade?", answer: "Seismic design under IS 1893:2016 and ductile detailing under IS 13920:2016 add requirements, and engineers often specify a higher grade in Zones IV and V because ductility depends partly on concrete strength." },
    ],
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

StructurePro auto-selects your seismic zone from your state and flags the concrete grade requirement in its IS compliance panel, so you know exactly what your location mandates — before you speak to a single contractor.

---

*Use StructurePro to see the correct concrete grade for your specific location, soil, and exposure class — backed by IS 456:2000 Table 5.*`,
  },
  {
    slug: 'steel-theft-construction-sites',
    title: "Steel Theft on Construction Sites: How to Catch It",
    excerpt:
      'Rebar under-delivery is one of the most common forms of contractor fraud in India. IS 1786:2008 gives you weight tables to verify every bar on your site. Here is exactly how to use them.',
    category: 'Structural',
    readTime: 6,
    publishedDate: '2026-06-20',
    updatedDate: '2026-10-23',
    quickAnswer: "Check rebar by weight, not by eye. IS 1786:2008 lists theoretical weights per metre: 8 mm 0.395 kg, 10 mm 0.617 kg, 12 mm 0.888 kg, 16 mm 1.580 kg, 20 mm 2.470 kg. Five 12 mm bars of 6 m should weigh 26.64 kg; 22 kg is 17% light and grounds to reject the delivery.",
    faq: [
      { question: "How do I check that a rebar delivery is not short?", answer: "Count every bar, measure a 10% sample with a tape (standard cut lengths are 12 m or 6 m), then weigh 5 bars and divide by 5 × the measured length. Compare the result with the IS 1786 weight per metre." },
      { question: "How much does a 12 mm bar weigh per metre?", answer: "0.888 kg per metre in the IS 1786:2008 table. Five 12 mm bars of 6 m each should weigh 5 × 6 × 0.888 = 26.64 kg." },
      { question: "What density is the weight table based on?", answer: "The theoretical weights come from the density of steel, 7,850 kg per cubic metre." },
      { question: "How can I tell the steel grade from the bar?", answer: "IS 1786 bars carry surface ribs whose pattern indicates the grade, and Fe 500D has a distinct rib configuration. 'TMT steel' without IS 1786 certification is an unregulated product." },
      { question: "What should I do if the delivery looks short?", answer: "Get the delivery challan signed by you and the driver, weigh the bars, and if the weighbridge shows a shortfall reject the delivery in writing. Do not let workers begin cutting until the checks are done." },
    ],
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

For a typical 1,000 sq ft residential building, StructurePro calculates steel quantities per IS code norms:
- **Column reinforcement:** 196.25 kg per cubic metre of column concrete
- **Footing reinforcement:** 39.25 kg per cubic metre of footing concrete
- **Plinth beam / floor beam:** 117.75 kg per cubic metre of beam concrete

If your contractor's steel quantity is more than 10% below these IS-derived benchmarks, demand an explanation with structural drawings to back it up.

## What to Do if You Suspect Short Delivery

1. Do not let workers begin cutting until you've completed your checks.
2. Get the delivery challan signed by you and the driver — a dated, signed document showing actual delivered weight.
3. If the weighbridge shows a shortfall, reject the delivery in writing. Most contractors will adjust rather than face documented fraud.

---

*Generate your IS 1786:2008 compliant steel schedule with StructurePro before placing any material order.*`,
  },
  {
    slug: 'seismic-zones-india-is-1893',
    title: 'Seismic Zones in India: What IS 1893:2016 Means for Your Home',
    excerpt:
      'India is divided into four seismic hazard zones. IS 1893:2016 mandates specific design requirements for each — and most Indian homeowners have no idea which zone they live in, let alone what it means for their building.',
    category: 'Structural',
    readTime: 5,
    publishedDate: '2026-06-22',
    updatedDate: '2026-10-23',
    quickAnswer: "IS 1893:2016 divides India into four seismic zones, II, III, IV and V, with zone factors Z of 0.10, 0.16, 0.24 and 0.36. Delhi NCR is in Zone IV; Srinagar and Guwahati are in Zone V. Z multiplies into the design base shear, so a Zone V building must resist more lateral force.",
    faq: [
      { question: "How many seismic zones does India have?", answer: "Four: Zone II (low hazard), Zone III (moderate), Zone IV (high) and Zone V (very high), under IS 1893:2016." },
      { question: "What are the zone factors?", answer: "Zone II 0.10, Zone III 0.16, Zone IV 0.24 and Zone V 0.36. The zone factor Z multiplies directly into the design base shear." },
      { question: "Which zone are major cities in?", answer: "Bengaluru is in Zone II, Delhi NCR in Zone IV, and Srinagar and Guwahati in Zone V." },
      { question: "What changes for a house in Zone IV or V?", answer: "IS 1893:2016 with IS 13920:2016 requires ductile detailing: closely spaced stirrups at beam-column joints, 135° hooks and minimum lap lengths. Buildings above G+2 typically need shear walls, and an open ground floor needs an explicit soft-storey check." },
      { question: "What should I ask my structural engineer?", answer: "Which zone you are in, whether the design uses the Zone Factor Z for that zone, whether beam-column joints are detailed per IS 13920, and to see the design base shear calculation." },
    ],
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

StructurePro automatically detects your seismic zone from your state, applies the correct IS 1893:2016 parameters, and flags any items in the IS compliance panel that need attention for your zone level.

---

*Know your seismic zone and its structural requirements before you build. Try StructurePro for an IS 1893:2016 compliant structural estimate.*`,
  },
  {
    slug: 'per-sqft-pricing-contractor-fraud',
    title: 'Per Square Foot Pricing: Why It Hides Contractor Fraud',
    excerpt:
      'A "₹1,800 per sq ft" quote sounds simple. It is actually the most effective way to conceal material substitution and quantity fraud. Here is what the number hides — and what to demand instead.',
    category: 'Cost & Transparency',
    readTime: 5,
    publishedDate: '2026-06-24',
    updatedDate: '2026-10-23',
    quickAnswer: "A per-sq-ft rate such as ₹1,800 hides the concrete grade, rebar diameter and wall thickness you are actually getting. Ask for a line-item BOQ and the IS code for every major material instead. Then compare quotes like for like, for example M20 with 16 mm columns against M25 with 20 mm columns.",
    faq: [
      { question: "Why is a per-sq-ft quote risky?", answer: "It is one number with nothing to check. It conceals material substitutions such as a lower concrete grade, thinner rebar or thinner walls, and under-delivery, because no quantities or specifications are listed." },
      { question: "What should I ask for instead of a rate?", answer: "A line-item Bill of Quantities (BOQ) that lists every material, its quantity, its rate and its IS specification. A contractor who refuses to provide one is hiding something." },
      { question: "Which specifications should be in the contract?", answer: "The concrete grade for each pour, the diameter and grade of steel for each element, the brick specification, the mortar mix ratio, and the plaster thickness, all in writing and signed before work starts." },
      { question: "How do I compare two quotes fairly?", answer: "Compare specifications, not rates. A quote for M20 concrete and 16 mm Fe 500D columns at ₹1,800 per sq ft is a different product from M25 and 20 mm columns at ₹2,100." },
      { question: "Is there a free way to check a quote?", answer: "Yes. The free Compare Contractor Quote tool flags line items above IS-code quantities and typical rates, and a structural engineer or quantity surveyor can verify a BOQ against approved drawings." },
    ],
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

**4. Use NirmanShastra to generate your own BOQ baseline.** StructurePro produces an IS 456:2000 compliant structural BOQ for your specific floor area and zone. Place it beside the contractor's quote and look for gaps.

## The Comparison You Can Actually Make

Instead of comparing ₹1,800/sqft vs ₹2,100/sqft, compare:
- Contractor A: M20 concrete, 16mm Fe 500D columns, 9" brick walls = ₹1,800/sqft
- Contractor B: M25 concrete, 20mm Fe 500D columns, 9" brick walls = ₹2,100/sqft

Now you are comparing like for like. The second quote might be worth every rupee.

---

*Generate your own IS-code based BOQ with StructurePro — so you can compare contractor quotes on equal terms.*`,
  },
  {
    slug: 'rccb-electrical-safety-is-732-2019',
    title: 'RCCB and Electrical Safety: What IS 732:2019 Requires',
    excerpt:
      'Electrical fires and electrocution kill thousands of Indians every year. IS 732:2019 mandates specific safety devices for every home — most contractors omit them to cut costs. Here is what you cannot afford to skip.',
    category: 'Electrical',
    readTime: 5,
    publishedDate: '2026-06-26',
    updatedDate: '2026-10-23',
    quickAnswer: "An MCB protects against overload and short circuit; an RCCB protects against earth leakage; an RCBO does both in one device. A 30 mA RCCB typically disconnects within 30–40 milliseconds of detecting leakage, before cardiac fibrillation can occur. Fit one on socket, bathroom, kitchen and outdoor circuits (IS 732:2019).",
    faq: [
      { question: "What is the difference between an MCB and an RCCB?", answer: "An MCB trips when current exceeds its rating, so it protects against overload and short circuit but not earth leakage. An RCCB trips on leakage current to earth but does not protect against overload. You can be electrocuted through a circuit that never trips its MCB." },
      { question: "What is an RCBO?", answer: "A Residual Current Circuit Breaker with Overcurrent protection. It combines the functions of an MCB and an RCCB in one device, and the guide notes IS 732 recommends it for complete protection." },
      { question: "What sensitivity should a household RCCB have?", answer: "30 mA, which disconnects within about 30–40 milliseconds of detecting leakage." },
      { question: "Which circuits should be on an RCCB?", answer: "Socket outlets, bathroom and kitchen circuits, any outdoor socket circuit, and circuits serving wet areas such as water features." },
      { question: "What earthing does a home need?", answer: "A dedicated earth electrode, typically a copper-clad steel rod, with earth continuity conductors to every socket, switch and appliance point, following IS 3043:2018." },
      { question: "What should an electrical quote state in writing?", answer: "The RCCB rating and the circuits it covers, the MCB or RCBO rating for each circuit, the earth electrode specification, and the wire specification: copper, with at least 1.5 mm² for lighting and 2.5 mm² for power circuits." },
    ],
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

NirmanShastra's ElectricalPro tool generates an IS 732:2019 compliant electrical schedule with room-by-room point loads, wire specifications, and protection device requirements for your floor plan.

---

*Get an IS 732:2019 compliant electrical estimate for your home — try ElectricalPro.*`,
  },
  {
    slug: 'water-requirements-is-1172-1993',
    title: 'How Much Water Does Your Family Need? IS 1172:1993 Explained',
    excerpt:
      'Most Indian homes have undersized water tanks because no one calculated the actual requirement. IS 1172:1993 gives you an LPCD formula — and the answer will likely surprise you.',
    category: 'Plumbing',
    readTime: 4,
    publishedDate: '2026-06-28',
    updatedDate: '2026-10-23',
    quickAnswer: "IS 1172:1993 sets 135 litres per person per day for a residential building with flush toilets, so a family of four needs 540 litres a day. If supply arrives every 48 hours, store 1,080 litres. Put 60% in an underground sump and 40% in the overhead tank, about 432 litres.",
    faq: [
      { question: "How much water per person per day does IS 1172:1993 require?", answer: "135 litres per person per day (LPCD) for a residential building with flush toilets. A family of four therefore needs 540 litres a day." },
      { question: "How do I size storage if supply is not daily?", answer: "Multiply the daily requirement by the days between supplies. If water comes once every 48 hours, a family of four needs 540 × 2 = 1,080 litres of storage." },
      { question: "How is storage split between sump and overhead tank?", answer: "The guide uses 60% in an underground sump and 40% in an overhead tank. For 1,080 litres the overhead tank is 432 litres, which is about a 500 L commercial tank." },
      { question: "Do live-in staff count towards the demand?", answer: "Yes. IS 1172 counts every person on the premises, so add 135 litres per day for each live-in domestic worker." },
      { question: "Does IS 1172 include garden watering?", answer: "No. Landscape irrigation and car washing are not covered, so add them separately." },
    ],
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

NirmanShastra's PlumbingPro tool takes your family size, floor count, and municipal supply schedule, applies IS 1172:1993 norms, and produces a complete plumbing schedule with tank sizes, pipe diameters, and fixture counts.

---

*Size your water storage correctly from day one — try PlumbingPro for an IS 1172:1993 compliant plumbing estimate.*`,
  },
  {
    slug: 'ghar-banane-ka-sahi-cost-is-code',
    title: 'Ghar Banane Ka Sahi Cost Kaise Nikale — IS Code Se, Contractor Ke Bharose Nahi',
    excerpt:
      'Aapka contractor ₹1,800/sqft bol raha hai, doosra ₹2,200 — dono ke paas koi breakdown nahi. IS 456:2000 aur IS 1786:2008 mein construction cost ka poora formula likha hai. Ye article step-by-step batata hai kaise cement, steel, brickwork aur foundation ka cost khud calculate karein.',
    category: 'Cost & Transparency',
    readTime: 6,
    publishedDate: '2026-07-06',
    updatedDate: '2026-10-23',
    quickAnswer: "G+1 se G+3 ghar ke liye thumb rule hai 0.4 bag cement aur 4 kg steel per sqft built-up area. 1,500 sqft ke ghar mein roughly 600 bags cement aur 6,000 kg steel lagega. 9-inch wall mein lagbhag 100 bricks per sqm lagti hain (IS 1077:1992). Contractor ke number ko in figures se compare kariye.",
    faq: [
      { question: "1,500 sqft ke ghar mein kitna cement lagega?", answer: "Thumb rule 0.4 bag cement per sqft built-up area hai (G+1 se G+3 ke liye). 1,500 sqft ke ghar mein roughly 600 bags cement lagega, poore structure ke liye, sirf ek floor ke liye nahi." },
      { question: "1,500 sqft ke ghar mein kitna steel lagega?", answer: "Overall thumb rule 4 kg steel per sqft hai. 1,500 sqft ke ghar mein roughly 6,000 kg TMT steel lagega." },
      { question: "Ek square metre wall mein kitni bricks lagti hain?", answer: "IS 1077:1992 ke according 9-inch wall mein lagbhag 100 bricks per sqm (190×90×90 mm modular brick), 4.5-inch partition wall mein 50 bricks per sqm. 200 mm AAC block mein 8.33 blocks per sqm lagte hain." },
      { question: "Per sqft rate pe bharosa kyun nahi karna chahiye?", answer: "Kyunki ek akele number mein koi breakdown nahi hota. IS codes se cement, steel aur bricks ki quantity khud nikaaliye aur contractor ke number se compare kariye." },
    ],
    language: 'hi-Latn',
    relatedSlugs: ['per-sqft-pricing-contractor-fraud', 'verify-contractor-quote-is-456-2000', 'steel-theft-construction-sites'],
    content: `Aapka contractor bol raha hai ₹1,800 per sqft. Ek doosra bol raha hai ₹2,200. Dono ke paas breakdown nahi hai — bas ek number.

Sach ye hai ki construction cost koi guess nahi hai. Ye ek calculation hai, aur Indian Standards (IS codes) mein iska poora formula likha hua hai. Agar aap ye samajh lete hain, toh koi bhi contractor aapko galat number nahi de sakta — kyunki aap khud verify kar sakte hain.

## Step 1: Cement Kitna Lagega?

IS 456:2000 ke according, M20 grade concrete (jo residential ghar ke liye standard hai) ka mix ratio hota hai 1:1.5:3 — matlab 1 part cement, 1.5 part sand, 3 part aggregate. Iska dry volume factor 1.54 hota hai (wet concrete sukhne se pehle jo volume lagta hai).

Thumb rule jo aap khud check kar sakte hain: **0.4 bags cement per sqft of built-up area**, G+1 se G+3 building ke liye. Agar aapka ghar 1,500 sqft ka hai, toh roughly **600 bags cement** lagenge — poora structure ke liye, sirf ek floor nahi.

Agar aapka contractor isse bahut zyada bata raha hai, poochiye kyun — shayad wastage zyada calculate ki hai, ya phir margin chhupa raha hai.

## Step 2: Steel Kitna Lagega?

Ye woh jagah hai jahan sabse zyada paisa chupta hai, kyunki steel mehenga hai aur log isko samajhte nahi.

IS 1786:2008 ke according, alag-alag structural members mein steel ka percentage fix hota hai:

| Member | Steel % |
|---|---|
| Footing | 0.5% |
| Column | 2.5% |
| Beam | 1.5% |
| Slab | 1.0% |

Overall thumb rule: **4 kg steel per sqft** for G+1 to G+3 buildings. 1,500 sqft ke ghar mein roughly **6,000 kg TMT steel** lagega.

Grade bhi important hai — agar aap seismic Zone III se V mein hain (jaise North India ka bada hissa), Fe500D ya Fe550D use karna chahiye, sirf standard Fe500 nahi. Ye IS 13920:2016 ka requirement hai, optional nahi.

## Step 3: Brickwork Kitna Lagega?

IS 1077:1992 ke according, standard 9-inch wall ke liye modular bricks (190×90×90mm) lagti hain roughly **100 bricks per square metre** wall area. 4.5-inch partition wall mein 50 bricks per sqm.

Agar aap AAC blocks use kar rahe hain (jo lightweight aur energy-efficient hain), toh 200mm block mein sirf **8.33 blocks per sqm** lagte hain — bahut kam quantity, lekin per-piece cost zyada hota hai. Dono ka total cost compare karke decide kariye.

Ek zaroori baat: agar aap Zone IV ya V mein hain (jaise Delhi, Uttarakhand, North-East states), AAC blocks load-bearing wall ke liye allowed nahi hain IS 4326:1993 ke according. Ye safety ka mamla hai, cost ka nahi.

## Step 4: Foundation Kaunsa Chahiye?

Ye depend karta hai aapki soil per:

| Foundation Type | Condition | Cost Range |
|---|---|---|
| Isolated footing | Achi soil, G+1 to G+3 | ₹220–350/sqft |
| Raft foundation | Soft ya waterlogged soil | ₹350–550/sqft |
| Pile foundation | Bahut soft/marshy | ₹2,500–4,000/running metre |

Geotechnical investigation (soil test) mandatory hai IS 1904:2016 ke according, khaas kar agar aap sure nahi hain apni soil type ke baare mein. Ye ₹15,000–50,000 ka ek-baar expense hai — lekin galat foundation type choose karne se jo nuksaan hota hai, uske saamne kuch nahi hai.

## Toh Actually Karna Kya Hai?

Agar aap in sab formulas ko khud calculate karna chahte hain, IS codes public hain — aap khud verify kar sakte hain. Lekin agar aap chahte hain ki koi platform ye calculation aapke liye kare, exact quantities aur cost ke saath, IS code clause ke reference ke saath — wahi NirmanShastra karta hai.

Free mein aap grand total range dekh sakte hain. Detailed report — exact cement bags, steel kg, brick count, sab kuch — ₹999 mein milta hai StructurePro pe.

Contractor ke number pe trust karne se pehle, apna khud ka number nikaliye.

---

*Apna construction cost khud verify karein — StructoPro pe IS code ke exact formulas se apni quantities nikaaliye.*`,
  },
  {
    slug: 'vastu-vedic-architecture-16-zones',
    title: 'Vastu and Vedic Architecture: Understanding the 16 Zones',
    excerpt:
      'Vastu Shastra is not superstition — it is a 3,000-year-old environmental design system. The Vastu Purusha Mandala divides your plot into 16 functional zones, each with specific directional guidelines. Here is how it works.',
    category: 'Vastu',
    readTime: 5,
    publishedDate: '2026-06-30',
    updatedDate: '2026-10-23',
    quickAnswer: "The Vastu Purusha Mandala divides a plot into zones, each tied to a direction and a use. VastuPro works with a 16-zone model. The central Brahmasthan stays open or lightly loaded, with no pillar, staircase or toilet in it. Kitchens sit in the southeast (Agni), prayer rooms in the northeast (Ishan), heavy rooms in the southwest (Nairutya).",
    faq: [
      { question: "What is the Vastu Purusha Mandala?", answer: "A square grid that divides a plot into zones, each associated with a deity or energy principle, a direction and a set of activities. The common residential version is a 9×9 grid of 81 padas, while VastuPro uses a 16-zone model that maps more directly to modern room types." },
      { question: "What is the Brahmasthan?", answer: "The central zone of the plot. It should remain open or lightly loaded; a pillar, staircase or toilet there is considered the most adverse Vastu placement." },
      { question: "Where does Vastu place the kitchen?", answer: "In the southeast (Agni) zone. The guide notes this aligns with prevailing wind patterns, so cooking fumes tend to blow away from living areas." },
      { question: "Why are heavy rooms placed in the southwest?", answer: "The southwest (Nairutya) zone gets the harshest afternoon sun, so thick walls, the master bedroom and storage placed there give the most mass to block it." },
      { question: "Is VastuPro free?", answer: "Yes. VastuPro is a free tool that overlays the Vastu Purusha Mandala on your plot and scores each room's placement, with no payment required." },
    ],
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
  {
    slug: "construction-cost-per-sq-ft-india",
    title: "Construction Cost per Sq Ft in India: How the Number Is Built",
    excerpt:
      "A single per-sq-ft rate hides what you are paying for. See how structure, flooring, doors, electrical, plumbing, painting and ceilings add up across four quality tiers, and how to test a contractor’s rate against them.",
    category: "Cost & Transparency",
    readTime: 6,
    publishedDate: '2026-10-23',
    quickAnswer: "At the calculator’s indicative Tier-2 city rates, building cost per sq ft is ₹1,197 for Basic, ₹1,490 for Standard, ₹1,983 for Premium and ₹2,935 for Luxury, kitchen excluded. A 1,000 sq ft Standard house therefore comes to ₹14,90,000. Rates differ by city and year, so treat these as a benchmark, not a quote.",
    faq: [
      { question: "What does a 1,000 sq ft house cost at Standard finish?", answer: "At the calculator’s rate of ₹1,490 per sq ft, a 1,000 sq ft Standard build comes to ₹14,90,000. The kitchen is priced separately per running foot, so it is not in that figure." },
      { question: "How much more is Premium than Standard?", answer: "₹493 per sq ft, which is ₹4,93,000 on 1,000 sq ft (₹1,490 to ₹1,983 per sq ft). On 2,400 sq ft the calculator gives ₹35,76,000 for Standard against ₹47,59,200 for Premium, a difference of ₹11,83,200." },
      { question: "Which element changes the most between tiers?", answer: "Flooring: ₹90 per sq ft at Basic, ₹160 at Standard, ₹280 at Premium and ₹520 at Luxury. Between Standard and Premium it adds ₹120 per sq ft, ahead of doors and windows at ₹90." },
      { question: "How is the kitchen priced?", answer: "Per running foot of counter and base run, separately from the per-sq-ft elements: ₹1,200 Basic, ₹2,200 Standard, ₹3,800 Premium and ₹7,500 Luxury per running foot." },
      { question: "Are these rates right for my city today?", answer: "No. The source sheet labels them indicative Tier-2 city rates. They show the shape of the difference between tiers; re-price against current local rates before relying on any total." },
      { question: "What is not in the per-sq-ft figure?", answer: "Anything outside the seven elements: land, approvals, a boundary wall, furniture and appliances are not part of the build-up." },
    ],
    relatedSlugs: ["per-sqft-pricing-contractor-fraud", "how-to-check-contractor-quote", "verify-contractor-quote-is-456-2000"],
    content: `## Why a single rate is not enough

A quote of "₹ per sq ft" is a total divided by an area. It tells you nothing about what is inside it. To judge it you need the pieces: structure and masonry, flooring, doors and windows, electrical, plumbing, painting, and ceilings. The free [Finish-Tier Cost Calculator](/tools/finish-tier-cost-calculator) breaks the number into exactly those pieces for four quality tiers.

## Reference rates per sq ft by quality tier

These are the per-sq-ft rates built into the calculator. Their source sheet labels them indicative Tier-2 city rates. Their value is in showing the shape of the difference between tiers, not an exact price for your city or year.

| Element | Basic | Standard | Premium | Luxury |
|---|---|---|---|---|
| Structure & masonry | ₹900 | ₹950 | ₹1,020 | ₹1,120 |
| Flooring | ₹90 | ₹160 | ₹280 | ₹520 |
| Doors & windows | ₹70 | ₹120 | ₹210 | ₹400 |
| Electrical | ₹55 | ₹85 | ₹140 | ₹240 |
| Plumbing | ₹60 | ₹95 | ₹165 | ₹320 |
| Painting | ₹22 | ₹35 | ₹58 | ₹95 |
| False ceiling & joinery | ₹0 | ₹45 | ₹110 | ₹240 |
| Total per sq ft | ₹1,197 | ₹1,490 | ₹1,983 | ₹2,935 |

The kitchen is priced separately, per running foot of counter and base run: ₹1,200 (Basic), ₹2,200 (Standard), ₹3,800 (Premium) and ₹7,500 (Luxury).

## Worked example: a 1,000 sq ft house

Multiply the total per sq ft by the built-up area:

| Tier | Rate per sq ft | Cost for 1,000 sq ft |
|---|---|---|
| Basic | ₹1,197 | ₹11,97,000 |
| Standard | ₹1,490 | ₹14,90,000 |
| Premium | ₹1,983 | ₹19,83,000 |
| Luxury | ₹2,935 | ₹29,35,000 |

Moving from Standard to Premium adds ₹4,93,000. Here is where it goes:

- Flooring: ₹1,20,000
- Doors and windows: ₹90,000
- Structure and masonry: ₹70,000
- Plumbing: ₹70,000
- False ceiling and joinery: ₹65,000
- Electrical: ₹55,000
- Painting: ₹23,000

Flooring and doors and windows alone account for ₹2,10,000 of the ₹4,93,000. That is the useful insight: the finish you choose moves the total far more than the structure does.

## What the figure does not cover

The build-up has seven per-sq-ft elements plus the kitchen. Land, approvals, a boundary wall, furniture and appliances are not among them, so a contractor quote that includes those is not comparable to these rates.

## Why you should not budget from these rates alone

They are indicative Tier-2 city rates. Steel, cement and labour prices move by city and by month. Use the table to compare tiers and to see which elements drive the difference, then re-price each line against current local quotes.

## How to test a contractor's per-sq-ft rate

1. Ask which tier the rate assumes and for a line-item BOQ.
2. Put the BOQ lines against the seven elements above and find the one that looks out of line.
3. Check the structure quantities against IS-code norms with the [concrete mix calculator](/tools/concrete-mix-ratio-calculator) and the [steel thumb rules](/blog/steel-required-per-sq-ft).
4. Read [why a per-sq-ft price hides fraud](/blog/per-sqft-pricing-contractor-fraud) before you sign.

See the [glossary](/glossary) for BOQ, built-up area and other terms used here.`,
  },
  {
    slug: "cement-sand-aggregate-for-1000-sq-ft-house",
    title: "Cement, Sand and Aggregate for a 1,000 Sq Ft House: Thumb-Rule Quantities",
    excerpt:
      "How many bags of cement, how much sand and how much coarse aggregate does a 1,000 sq ft house need? The planning thumb rules, how they change with the number of floors, and where they stop being reliable.",
    category: "Structural",
    readTime: 5,
    publishedDate: '2026-10-23',
    quickAnswer: "For a 1,000 sq ft built-up house of G+1 to G+3 in M20 concrete, the thumb rules give about 400 bags of cement (0.4 per sq ft), 1,800 cft of sand (1.8 per sq ft) and 1,350 cft of coarse aggregate (1.35 per sq ft), plus 4,000 kg of steel. Treat them as planning figures, not a design.",
    faq: [
      { question: "How many bags of cement does a 1,000 sq ft house need?", answer: "About 400 bags of 50 kg cement, from the thumb rule of 0.4 bag per sq ft of built-up area for G+1 to G+3 buildings in M20 concrete." },
      { question: "How much sand does a 1,000 sq ft house need?", answer: "About 1,800 cft, which is roughly 51 m³, at 1.8 cft per sq ft of built-up area." },
      { question: "How much coarse aggregate does a 1,000 sq ft house need?", answer: "About 1,350 cft, which is roughly 38.2 m³, at 1.35 cft per sq ft of built-up area." },
      { question: "Does the quantity change with the number of floors?", answer: "Yes. Per 1,000 sq ft of built-up area, a ground-floor-only house uses about 340 bags of cement, G+1 to G+3 uses 400, G+4 uses 432 and G+5 uses 448." },
      { question: "What does built-up area mean here?", answer: "The total built-up area across all floors, not the plot size or one floor. A G+1 house with 500 sq ft on each floor has 1,000 sq ft of built-up area." },
      { question: "How do I get cement for one slab or beam instead?", answer: "Use the per-cubic-metre figure: M20 concrete needs about 8.07 bags of 50 kg cement per m³, so a 20 m³ pour needs roughly 161 bags." },
    ],
    relatedSlugs: ["verify-contractor-quote-is-456-2000", "steel-required-per-sq-ft", "m20-vs-m25-concrete-grade"],
    content: `## The thumb rules

For G+1 to G+3 houses in M20 concrete, NirmanShastra's StructurePro starts from these planning values. They are per sq ft of **built-up area**, meaning the total across all floors.

| Material | Per sq ft of built-up area | For 1,000 sq ft |
|---|---|---|
| Cement (50 kg bags) | 0.4 bag | 400 bags |
| Sand | 1.8 cft | 1,800 cft (about 51 m³) |
| Coarse aggregate | 1.35 cft | 1,350 cft (about 38.2 m³) |
| Steel | 4 kg | 4,000 kg |
| Binding wire | 12 kg per tonne of steel | 48 kg |

## How the quantities change with the number of floors

The thumb rule is set for G+1 to G+3. The estimator applies a factor outside that range. Per 1,000 sq ft of built-up area in M20 concrete:

| Floors | Factor | Cement (bags) | Steel (kg) | Sand (cft) | Aggregate (cft) |
|---|---|---|---|---|---|
| Ground floor only | 0.85 | 340 | 3,400 | 1,530 | 1,148 |
| G+1 to G+3 | 1.00 | 400 | 4,000 | 1,800 | 1,350 |
| G+4 | 1.08 | 432 | 4,320 | 1,944 | 1,458 |
| G+5 | 1.12 | 448 | 4,480 | 2,016 | 1,512 |

## Scaling to your house

The values scale in proportion to built-up area. A 1,500 sq ft G+1 house needs about 600 bags of cement, 6,000 kg of steel, 2,700 cft of sand and 2,025 cft of coarse aggregate.

## From a thumb rule to a single pour

For one slab, beam or column, work from concrete volume instead. M20 concrete needs about 8.07 bags of 50 kg cement per cubic metre (IS 456:2000), so a 20 m³ slab needs roughly 161 bags. The free [Concrete Mix Ratio Calculator](/tools/concrete-mix-ratio-calculator) does this for any volume, and [how to verify a contractor's quote against IS 456](/blog/verify-contractor-quote-is-456-2000) shows the cross-check step by step.

## Where the thumb rules stop being reliable

- They assume M20 concrete and a regular residential frame. A different grade, an unusual span or a deep foundation changes the quantities.
- They are whole-building planning values, not a mix-design derivation. In a 1 : 1.5 : 3 mix the aggregate is twice the sand by volume, so do not back-calculate a mix from the sand and aggregate figures above.
- They are not a structural design. A structural engineer must design and approve the building.

For a quantity schedule built on your own area, floors, state and site condition, use [StructurePro](/tools/structopro). The [glossary](/glossary) explains terms such as built-up area, G+1 and M20.`,
  },
  {
    slug: "how-to-check-contractor-quote",
    title: "How to Check a Contractor’s Quote: 7 Checks You Can Do Yourself",
    excerpt:
      "You do not need to be an engineer to test a construction quote. Seven checks on concrete, steel, bricks, wiring, water, testing and payment, each with the IS-code number to compare against.",
    category: "Cost & Transparency",
    readTime: 6,
    publishedDate: '2026-10-23',
    quickAnswer: "Ask for a line-item BOQ, then run seven checks: M20 concrete takes about 8.07 bags of cement per m³; rebar weighs d² ÷ 162 kg per metre; a 9-inch wall takes 100 bricks per m²; wire is 1.5 mm² for lights, 2.5 mm² for sockets; water is 135 litres per person daily; cubes follow IS 456 Cl 15.2.2.",
    faq: [
      { question: "What is the first thing to ask a contractor for?", answer: "A line-item Bill of Quantities (BOQ) listing each material, quantity, rate and IS specification. A single per-sq-ft rate gives you nothing to check." },
      { question: "How do I check the cement quantity in a quote?", answer: "Multiply the concrete volume in cubic metres by 8.07 for M20 (50 kg bags). A 20 m³ pour needs about 161 bags, and a variance above 10% needs an explanation." },
      { question: "How do I check the brick quantity?", answer: "A 9-inch modular brick wall takes about 100 bricks per m² and a 4.5-inch wall about 50. Deduct door and window openings first, then allow 5–10% for wastage." },
      { question: "What wire sizes should the quote show?", answer: "Minimum copper sizes of 1.5 mm² for lighting and fans, 2.5 mm² for power sockets, 4 mm² for an AC or geyser, 6 mm² for a sub-panel feed and 10 mm² for the main incomer (IS 732:2019 Cl 6.2)." },
      { question: "How many concrete cube samples should be taken?", answer: "IS 456:2000 Cl 15.2.2: 1 sample for 1–5 m³, 2 for 6–15 m³, 3 for 16–30 m³ and 4 for 31–50 m³, with at least one sample from each shift of concreting." },
      { question: "Is there a free tool to compare a quote with IS-code quantities?", answer: "Yes. The free Compare Contractor Quote tool shows which line items are above IS-code quantities and typical rates." },
    ],
    relatedSlugs: ["verify-contractor-quote-is-456-2000", "per-sqft-pricing-contractor-fraud", "steel-theft-construction-sites"],
    content: `## Start with the BOQ, not the rate

Ask for a line-item Bill of Quantities. It lists every material, its quantity, its rate and its IS specification. A rate such as "₹ per sq ft" gives you nothing to check, which is why [per-sq-ft pricing hides contractor fraud](/blog/per-sqft-pricing-contractor-fraud). Once you have the BOQ, run these seven checks.

## 1. Concrete grade and cement quantity

The quote must state the grade for each pour. For M20 concrete, plan on about **8.07 bags of 50 kg cement per cubic metre** (IS 456:2000). A 20 m³ slab needs roughly 161 bags, so a quote for 120 bags is a red flag. A variance above 10% needs a written explanation. The [Concrete Mix Ratio Calculator](/tools/concrete-mix-ratio-calculator) scales this to your volume, and [this guide](/blog/verify-contractor-quote-is-456-2000) walks through the cross-check.

## 2. Steel by weight

Rebar is billed by weight, so verify it by weight. The weight per metre of a bar is **d² ÷ 162 kg**, where d is the diameter in mm: a 12 mm bar weighs about 0.889 kg per metre. Weigh a sample and compare. The [Bar Bending Schedule Calculator](/tools/bar-bending-schedule-calculator) gives cutting lengths and weights for 13 bar shapes, and [how to catch steel under-delivery](/blog/steel-theft-construction-sites) covers the site checks.

## 3. Bricks per square metre

A 9-inch (230 mm) wall of standard 190 × 90 × 90 mm modular brick takes about **100 bricks per m²**, and a 4.5-inch (115 mm) partition about **50** (IS 1077:1992, IS 2212:1991). Deduct door and window openings from the wall area first, then allow 5–10% for wastage. The [Brick Calculator](/tools/brick-calculator) does the arithmetic.

## 4. Wiring

Minimum copper sizes are **1.5 mm²** for lighting and fans, **2.5 mm²** for power sockets, **4 mm²** for an AC or geyser, **6 mm²** for a sub-panel feed and **10 mm²** for the main incomer (IS 732:2019 Cl 6.2). The quote should also name the RCCB and MCB ratings. The [Wire Size Calculator](/tools/wire-size-calculator) lists the typical MCB for each.

## 5. Water storage

Allow **135 litres per person per day** on municipal supply and 150 on borewell (IS 1172:1993). A family of five on municipal water needs 675 litres a day; storing two-thirds of a day's demand gives 452 litres, so a 500 L tank. Use the [Water Tank Size Calculator](/tools/water-tank-size-calculator) for your family.

## 6. Concrete testing

IS 456:2000 Cl 15.2.2 sets the minimum number of samples by volume: 1 for 1–5 m³, 2 for 6–15 m³, 3 for 16–30 m³ and 4 for 31–50 m³, and at least one sample from each shift. A 10 m³ pour needs 2 samples, which is 12 cubes at 6 cubes a sample. The [Concrete Cube Test Calculator](/tools/concrete-cube-test-calculator) gives the count for any volume.

## 7. The payment bills

Running Account (RA) bills decide what you actually pay. Net payable is gross bill minus retention and advance recovery, plus GST, minus TDS. With 5% retention, 18% GST and 1% TDS on the value excluding GST, a ₹10,00,000 bill pays ₹11,20,000. The [RA Bill Calculator](/tools/ra-bill-retention-tds-calculator) shows each line.

## Put it side by side

Run the numbers, then use the free [Compare Contractor Quote tool](/compare-quote) to see which line items sit above IS-code quantities and typical rates. For unfamiliar words, see the [glossary](/glossary).`,
  },
  {
    slug: "steel-required-per-sq-ft",
    title: "How Much Steel per Sq Ft? Rebar Thumb Rules for Indian Houses",
    excerpt:
      "The planning rule is about 4 kg of reinforcement per sq ft of built-up area. See how it changes with floors, how it splits between footings, columns, beams and slabs, and how to check a delivery by weight.",
    category: "Structural",
    readTime: 5,
    publishedDate: '2026-10-23',
    quickAnswer: "Plan on about 4 kg of reinforcement steel per sq ft of built-up area for G+1 to G+3 houses, so 1,000 sq ft needs about 4,000 kg. A ground-floor-only house uses about 3.4 kg per sq ft, G+4 about 4.32 and G+5 about 4.48. Check delivered bars by weight: kg per metre is d² ÷ 162.",
    faq: [
      { question: "How much steel does a 1,000 sq ft house need?", answer: "About 4,000 kg for a G+1 to G+3 house, from the thumb rule of 4 kg per sq ft of built-up area. A ground-floor-only house needs about 3,400 kg, G+4 about 4,320 kg and G+5 about 4,480 kg." },
      { question: "How much steel per sq ft for a 1,500 sq ft house?", answer: "About 6,000 kg of TMT steel at 4 kg per sq ft for G+1 to G+3." },
      { question: "What does a bar weigh per metre?", answer: "Weight in kg per metre is d² ÷ 162, with d in mm: 8 mm is 0.395, 10 mm 0.617, 12 mm 0.889, 16 mm 1.580 and 20 mm 2.469. Published tables round these to two or three decimals." },
      { question: "How much binding wire does the steel need?", answer: "About 12 kg of binding wire per tonne of steel, so roughly 48 kg for 4,000 kg of reinforcement." },
      { question: "How is steel split between footings, columns, beams and slabs?", answer: "As planning percentages of the concrete volume: footings 0.5%, columns 2.5%, beams 1.5% and slabs 1.0%. At 7,850 kg/m³ that is 39.25, 196.25, 117.75 and 78.5 kg of steel per cubic metre of concrete." },
      { question: "How do I check a steel delivery?", answer: "Weigh a sample of bars, divide by the number of bars and their measured length, and compare with the weight per metre. A 6 m, 12 mm bar should weigh about 5.3 kg." },
    ],
    relatedSlugs: ["steel-theft-construction-sites", "cement-sand-aggregate-for-1000-sq-ft-house", "how-to-check-contractor-quote"],
    content: `## The thumb rule

For G+1 to G+3 houses, NirmanShastra's StructurePro starts from **4 kg of reinforcement steel per sq ft of built-up area**. Built-up area is the total across all floors. A 1,000 sq ft house needs about 4,000 kg, and a 1,500 sq ft house about 6,000 kg.

## How it changes with floors

The thumb rule is set for G+1 to G+3. Outside that range a factor applies. Per 1,000 sq ft of built-up area:

| Floors | Factor | Steel per sq ft | Steel for 1,000 sq ft |
|---|---|---|---|
| Ground floor only | 0.85 | 3.4 kg | 3,400 kg |
| G+1 to G+3 | 1.00 | 4 kg | 4,000 kg |
| G+4 | 1.08 | 4.32 kg | 4,320 kg |
| G+5 | 1.12 | 4.48 kg | 4,480 kg |

Binding wire is estimated at 12 kg per tonne of steel, so about 48 kg for 4,000 kg of reinforcement.

## How it splits across members

Reinforcement is also planned as a percentage of each member's concrete volume. Multiply the percentage by the density of steel, 7,850 kg/m³, to get kilograms per cubic metre of concrete.

| Member | Steel as % of concrete | Steel per m³ of concrete |
|---|---|---|
| Footing | 0.5% | 39.25 kg |
| Column | 2.5% | 196.25 kg |
| Beam | 1.5% | 117.75 kg |
| Slab | 1.0% | 78.5 kg |

## Weight of a bar per metre

Steel bars are billed by weight, and the weight per metre of a round bar is **d² ÷ 162 kg**, with d in millimetres.

| Diameter | Weight per metre | Weight of a 6 m bar |
|---|---|---|
| 8 mm | 0.395 kg | 2.37 kg |
| 10 mm | 0.617 kg | 3.70 kg |
| 12 mm | 0.889 kg | 5.33 kg |
| 16 mm | 1.580 kg | 9.48 kg |
| 20 mm | 2.469 kg | 14.81 kg |

Published weight tables round these to two or three decimals, so a difference in the third decimal place is not a red flag. A large gap is. Weigh before you accept.

## Checking what was delivered

Weigh a handful of bars and divide the weight by the number of bars and their measured length. If five 12 mm bars of 6 m should weigh about 26.7 kg and weigh 22 kg, the delivery is about 17% light. The full site procedure is in [how to catch steel theft on construction sites](/blog/steel-theft-construction-sites).

## From weight to a cutting list

For a bar bending schedule, the [Bar Bending Schedule Calculator](/tools/bar-bending-schedule-calculator) gives cutting length and weight for 13 bar shapes using the IS 2502 bend and hook rules. For the rest of the structure, see [cement, sand and aggregate for a 1,000 sq ft house](/blog/cement-sand-aggregate-for-1000-sq-ft-house). Terms such as TMT, Fe 500D and cover are in the [glossary](/glossary).`,
  },
  {
    slug: "bricks-per-sq-ft",
    title: "Bricks per Sq Ft of Wall: 9-inch and 4.5-inch Brick Walls",
    excerpt:
      "A 9-inch brick wall takes about 9.29 bricks per sq ft of wall and a 4.5-inch wall about 4.65. How the numbers come from IS 1077:1992, how to deduct openings, and how much to add for wastage.",
    category: "Structural",
    readTime: 4,
    publishedDate: '2026-10-23',
    quickAnswer: "A 9-inch brick wall needs about 9.29 bricks per sq ft of wall area (100 per m²) and a 4.5-inch wall about 4.65 (50 per m²), using the 190 × 90 × 90 mm modular brick with 10 mm joints (IS 1077:1992). So 1,000 sq ft of 9-inch wall needs about 9,290 bricks before 5–10% wastage.",
    faq: [
      { question: "How many bricks are needed per sq ft of 9-inch wall?", answer: "About 9.29 bricks per sq ft of wall area, which is 100 bricks per m², for standard 190 × 90 × 90 mm modular brick with 10 mm joints (IS 1077:1992, IS 2212:1991)." },
      { question: "How many bricks per sq ft of 4.5-inch wall?", answer: "About 4.65 bricks per sq ft of wall area, which is 50 bricks per m²." },
      { question: "How many bricks are in 1,000 sq ft of 9-inch wall?", answer: "About 9,290 bricks before wastage, and roughly 9,755 to 10,220 once 5–10% is added. A 4.5-inch wall of the same area needs about 4,645 bricks before wastage." },
      { question: "How do I convert between m² and sq ft?", answer: "1 m² is about 10.764 sq ft. Divide bricks per m² by 10.764 to get bricks per sq ft." },
      { question: "Do doors and windows reduce the brick count?", answer: "Yes. Bricks are laid only in the solid wall, so deduct each opening's area first. A standard door is about 1.9 m² and a window about 1.44 m²." },
      { question: "How many AAC blocks per m²?", answer: "A 200 mm AAC block takes about 8.33 blocks per m², which is about 0.77 per sq ft of wall." },
    ],
    relatedSlugs: ["how-to-check-contractor-quote", "verify-contractor-quote-is-456-2000", "per-sqft-pricing-contractor-fraud"],
    content: `## Bricks per sq ft of wall

The standard counts are per square metre of wall, using the modular clay brick of 190 × 90 × 90 mm laid with a 10 mm mortar joint, a nominal 200 × 100 × 100 mm unit (IS 1077:1992, IS 2212:1991):

- **9-inch (230 mm) wall:** 100 bricks per m²
- **4.5-inch (115 mm) wall:** 50 bricks per m²

Since 1 m² is about 10.764 sq ft, divide by 10.764 to get bricks per sq ft of wall area:

| Wall | Bricks per m² | Bricks per sq ft | For 1,000 sq ft of wall |
|---|---|---|---|
| 9-inch (230 mm) | 100 | 9.29 | about 9,290 |
| 4.5-inch (115 mm) | 50 | 4.65 | about 4,645 |

## Add wastage

Allow 5–10% for breakage, cutting and site loss. On 1,000 sq ft of 9-inch wall, 9,290 bricks becomes roughly **9,755 to 10,220** to order. On the same area of 4.5-inch wall, 4,645 becomes roughly 4,878 to 5,110.

## Wall area, not floor area

These counts are per sq ft of **wall**, which is length times height, not the floor area of the house. For a wall of 10 m by 3 m (30 m²) the count is 30 × 100 = 3,000 bricks for a 9-inch wall and 1,500 for a 4.5-inch wall.

## Deduct the openings

Bricks are laid only in the solid part of the wall. Subtract each door and window from the wall area first: a standard door is about 1.9 m², a window about 1.44 m². Deducting a 1.9 m² door from the 30 m² wall leaves 28.1 m² and 2,810 bricks before wastage.

## Blocks instead of bricks

A 200 mm AAC block takes about 8.33 blocks per m², roughly 0.77 per sq ft of wall. The block count is lower, but the unit price and the adhesive or mortar differ, so compare total cost rather than count.

## Do the calculation yourself

The free [Brick Calculator](/tools/brick-calculator) takes the wall length and height, the thickness and the openings, and returns the count with 5% and 10% wastage. To cross-check a mason's or contractor's number, follow [how to check a contractor's quote](/blog/how-to-check-contractor-quote). For the whole house, including mortar and plastering for 8 wall types, see [MasonryPro](/tools/masonpro). The [glossary](/glossary) explains modular brick and wastage.`,
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
