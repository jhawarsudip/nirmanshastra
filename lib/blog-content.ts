export interface BlogArticle {
  slug: string
  title: string
  excerpt: string
  category: string
  readTime: number
  publishedDate: string
  /**
   * ISO date of the last edit that changed what the article says, checked against git history (26 Oct 2026): all 14 guides
   * were edited again on 25 Oct (the quantity-only rewrite and its fact corrections). Leave it out for an article that has
   * not changed since it was published; nothing is then shown beside the publish date.
   */
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
    updatedDate: '2026-10-25',
    quickAnswer: "Multiply your slab or element volume in cubic metres by 8 to get the 50 kg cement bags M20 concrete needs (CPWD DAR 2014). A 20 m³ slab needs about 160 bags, so a quote for 120 bags is a red flag. A variance above 10% needs a written explanation from the contractor.",
    faq: [
      { question: "How many cement bags does M20 concrete need per cubic metre?", answer: "About 8 bags of 50 kg cement (400 kg) per cubic metre of M20 concrete, the CPWD Analysis of Rates 2014 figure. A 20 m³ pour therefore needs roughly 160 bags." },
      { question: "How do I cross-check a contractor's cement quantity?", answer: "Get the structural drawing with slab thickness marked (a typical residential slab is 125–150 mm), multiply length × width × thickness in metres to get the volume, multiply by 8 for M20, and compare with the quoted bags. A variance of more than 10% needs an explanation." },
      { question: "What is the minimum concrete grade for reinforced concrete?", answer: "M20, which is the grade IS 456:2000 Table 5 sets for reinforced concrete in mild exposure. Moderate exposure, such as concrete buried in soil, needs M25." },
      { question: "What are the red flags in a concrete quote?", answer: "No concrete grade stated, a cement quantity far below the IS 456 norm, no water-cement ratio stated, and no aggregate size specified. 'Concrete work' with no grade is meaningless." },
    ],
    relatedSlugs: ['m20-vs-m25-concrete-grade', 'per-sqft-pricing-contractor-fraud', 'steel-theft-construction-sites'],
    content: `## Why Your Contractor's Quote Might Be Wrong

When you hire a contractor in India, you receive a quote that lists quantities — bags of cement, tonnes of steel, cubic metres of concrete. These numbers feel technical, so most homeowners sign without questioning them. That is exactly where overcharging begins.

IS 456:2000 — the Indian Standard for Plain and Reinforced Concrete — sets the floor: a minimum grade, a minimum cement content and a maximum water-cement ratio for each exposure. The usual cement quantity for each cubic metre of a nominal mix comes from the CPWD Analysis of Rates. If your contractor's quantities fall below those figures, something needs explaining.

## The Key Numbers

For **M20 concrete** (the lowest grade IS 456 allows for reinforced concrete, in mild exposure), the usual cement consumption is **8 bags (50 kg each, 400 kg) per cubic metre** of concrete poured. This is the CPWD Analysis of Rates 2014 figure for the conventional 1 : 1.5 : 3 nominal mix of cement, sand and aggregate.

For a typical 1,000 sq ft, G+1 residential building:
- Ground floor slab: approximately 20 m³ of concrete
- That should consume roughly **160 bags of cement** for the slab alone

If your contractor quotes 120 bags for the same slab, that is a red flag. Either the slab is thinner than specified, or the concrete mix is weaker than M20.

## Red Flags to Look For

**1. No grade specification.** Any legitimate quote should state M20, M25, or M30. "Concrete work" without a grade is meaningless — it lets the contractor pour M10 (weak roadwork mix) and charge you for M20.

**2. Cement quantity too low.** IS 456 Table 5 sets a minimum cement content for reinforced concrete of 300 kg per cubic metre in mild and moderate exposure and 320 kg in severe exposure. A nominal M20 mix works out near 400 kg. A quote that works out well below 300 kg per cubic metre cannot be right.

**3. No water-cement ratio stated.** IS 456 Table 5 caps the free water-cement ratio at 0.55 for mild exposure and 0.50 for moderate exposure. Too much water makes concrete weak. A good contractor will state this; a corner-cutting one won't.

**4. Aggregate sizes not specified.** 20 mm nominal maximum size is the usual choice for slabs and beams, and IS 456 limits the size by member thickness and bar spacing. "Stone chips" without a size spec is a warning.

## How to Cross-Check a Quote

Step 1: Ask for the structural drawing with slab thickness marked. A typical residential slab is 125–150mm thick.

Step 2: Calculate the volume: length × width × thickness in metres.

Step 3: Multiply by 8 to get the expected cement bags for M20.

Step 4: Compare with the contractor's quoted bags. A variance of more than 10% needs an explanation.

NirmanShastra's StructurePro works out the quantities of the RCC frame from your plan, floors, state, city and soil, so you have a quantity table to place beside any contractor's quote. It gives a low and a high figure for each total, and it does not replace a structural engineer's drawings.

---

*Try StructurePro to work out the quantities of your frame before you accept a contractor quote.*`,
  },
  {
    slug: 'm20-vs-m25-concrete-grade',
    title: 'M20 vs M25 Concrete: Which Grade Does Your Building Need?',
    excerpt:
      'Using the wrong concrete grade is not just inefficient — it can be illegal under IS 456:2000. This guide explains exposure classes, when each grade is mandatory, and why your location matters more than you think.',
    category: 'Structural',
    readTime: 5,
    publishedDate: '2026-06-18',
    updatedDate: '2026-10-25',
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

IS 1893 (seismic design) combined with IS 13920:2016 (ductile detailing) sets extra requirements for frames in higher zones, including a minimum concrete grade that your engineer must check against the design. In practice, for Zone IV and V cities like Delhi, Srinagar, Guwahati and Patna, engineers often specify M25 or higher even for internal elements, because ductility depends partly on concrete strength. Ask which grade your design uses and why.

StructurePro reads your seismic zone from your state and city and lists the concrete grade chosen for your exposure, with the clause, in its IS compliance panel, so you know what your location points to before you speak to a contractor.

---

*Use StructurePro to see the concrete grade for your location, soil and exposure class, with the IS 456:2000 Table 5 clause behind it.*`,
  },
  {
    slug: 'steel-theft-construction-sites',
    title: "Steel Theft on Construction Sites: How to Catch It",
    excerpt:
      'Rebar under-delivery is one of the most common forms of contractor fraud in India. IS 1786:2008 gives you weight tables to verify every bar on your site. Here is exactly how to use them.',
    category: 'Structural',
    readTime: 6,
    publishedDate: '2026-06-20',
    updatedDate: '2026-10-25',
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

Every standard rebar diameter has a **theoretical weight per metre**, derived from the density of steel (7850 kg/m³). IS 1786 Table 1 gives these values:

| Diameter | Weight per metre |
|---|---|
| 8 mm | 0.395 kg/m |
| 10 mm | 0.617 kg/m |
| 12 mm | 0.888 kg/m |
| 16 mm | 1.580 kg/m |
| 20 mm | 2.470 kg/m |
| 25 mm | 3.854 kg/m |
| 32 mm | 6.313 kg/m |

The standard allows a tolerance on mass that depends on bar size and is checked per batch: about ±7% up to 10 mm, ±5% from 10 to 16 mm and ±3% above 16 mm (IS 1786:2008 Table 2). A bar far outside its band is substandard steel.

## How to Catch Under-Delivery on Your Site

**Step 1 — Count the bars.** When the truck arrives, count every bar in the bundle. Do not let the contractor's team do this alone.

**Step 2 — Measure the length.** Take a 10% sample of bars (every 10th bar) and measure the length with a tape. Standard cut lengths are 12 metres or 6 metres.

**Step 3 — Weigh the bars.** Use a simple luggage scale or a weighbridge. Take 5 bars, weigh them, and divide by (5 × measured length). Compare to the IS 1786 weight per metre table.

Example: You have 12mm bars. You weigh 5 bars each 6 metres long. Total weight should be 5 × 6 × 0.888 = **26.64 kg**. If you get 22 kg, you have bars that are under-weight by 17% — well outside the tolerance band and cause to reject the delivery.

**Step 4 — Check the grade marking.** IS 1786 bars carry ribs on the surface whose pattern indicates the grade. Fe 500D bars have a distinct rib configuration. "TMT steel" without IS 1786 certification is an unregulated product.

## A Total to Check the Quote Against

Weighing checks the delivery. To check the total on the quote, compare it with a published range for your floor area. A 2026 baseline study of 26 multi-family residential buildings in south and west India (GKSPL, as summarised by Conserve Consultants) reports 31 to 62 kg of steel per m² of built-up area for buildings up to four storeys, which is about 2.9 to 5.8 kg per sq ft. The summary does not say how many of the 26 were low-rise, so treat the range as wide. A steel quantity far below it for your floor area deserves a written explanation with structural drawings. [StructurePro](/tools/structopro) works the figure out from your plan instead of from a range.

## What to Do if You Suspect Short Delivery

1. Do not let workers begin cutting until you've completed your checks.
2. Get the delivery challan signed by you and the driver — a dated, signed document showing actual delivered weight.
3. If the weighbridge shows a shortfall, reject the delivery in writing. Most contractors will adjust rather than face documented fraud.

---

*Work out the steel in your frame with StructurePro before you place a material order.*`,
  },
  {
    slug: 'seismic-zones-india-is-1893',
    title: 'Seismic Zones in India: What IS 1893:2016 Means for Your Home',
    excerpt:
      'India is divided into four seismic hazard zones. IS 1893:2016 mandates specific design requirements for each — and most Indian homeowners have no idea which zone they live in, let alone what it means for their building.',
    category: 'Structural',
    readTime: 5,
    publishedDate: '2026-06-22',
    updatedDate: '2026-10-25',
    quickAnswer: "IS 1893:2016 divides India into four seismic zones, II, III, IV and V, with zone factors Z of 0.10, 0.16, 0.24 and 0.36. Delhi NCR is in Zone IV; Srinagar and Guwahati are in Zone V. Z multiplies into the design base shear, so a Zone V building must resist more lateral force.",
    faq: [
      { question: "How many seismic zones does India have?", answer: "Four: Zone II (low hazard), Zone III (moderate), Zone IV (high) and Zone V (very high), under IS 1893:2016." },
      { question: "What are the zone factors?", answer: "Zone II 0.10, Zone III 0.16, Zone IV 0.24 and Zone V 0.36. The zone factor Z multiplies directly into the design base shear." },
      { question: "Which zone are major cities in?", answer: "Bengaluru is in Zone II, Delhi NCR in Zone IV, and Srinagar and Guwahati in Zone V." },
      { question: "What changes for a house in Zone IV or V?", answer: "IS 1893:2016 with IS 13920:2016 requires ductile detailing: closely spaced stirrups at beam-column joints, 135° hooks and minimum lap lengths. Taller buildings may need shear walls, and an open ground floor needs an explicit soft-storey check." },
      { question: "What should I ask my structural engineer?", answer: "Which zone you are in, whether the design uses the Zone Factor Z for that zone, whether beam-column joints are detailed per IS 13920, and to see the design base shear calculation." },
    ],
    relatedSlugs: ['m20-vs-m25-concrete-grade', 'verify-contractor-quote-is-456-2000', 'per-sqft-pricing-contractor-fraud'],
    content: `## India's Seismic Map — and Why It Matters for Your Home

India sits on one of the most seismically active landmasses in the world. The Indian tectonic plate is pushing north into the Eurasian plate at roughly 5 cm per year — and that collision energy has to go somewhere.

IS 1893:2016 (Criteria for Earthquake Resistant Design of Structures) classifies India into four seismic zones based on the ground shaking expected:

| Zone | Factor Z | Hazard Level | Major Cities |
|---|---|---|---|
| Zone II | 0.10 | Low | Bengaluru, Hyderabad, Jaipur, Bhopal, Nagpur |
| Zone III | 0.16 | Moderate | Mumbai, Chennai, Kolkata, Pune, Ahmedabad |
| Zone IV | 0.24 | High | Delhi, Patna, Chandigarh, Dehradun, Gangtok |
| Zone V | 0.36 | Very High | Srinagar, Guwahati, Imphal, Bhuj, Darbhanga |

Zone V has the highest seismic hazard. The Zone Factor Z (listed above) directly multiplies into the design base shear — the lateral force your building must resist.

The towns above are placed using the town list in IS 1893 (Part 1):2002 Annex E, which is the list NirmanShastra reads. The 2016 edition redraws the zone map, and some towns move, so confirm your zone with your structural engineer.

## What Changes in High-Seismic Zones

If your home is in Zone IV or V, IS 1893:2016 combined with IS 13920:2016 (Ductile Detailing) mandates:

**1. Ductile detailing of reinforcement.** Closely spaced stirrups at beam-column joints, 135° hook bends, and minimum lap splice lengths. This is what prevents columns from shattering in a quake — they crush slowly and absorb energy rather than snapping.

**2. A minimum concrete grade.** IS 13920 sets a minimum grade for ductile frames, and engineers in high zones often specify M25 or higher. Some specify M30 for critical columns.

**3. Shear walls or bracing where the frame alone is not enough.** In higher zones, taller buildings may need reinforced concrete shear walls. Whether yours does is your engineer's call.

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

StructurePro reads your seismic zone from your state and city, applies it to the frame, and marks the items in its IS compliance panel that need an engineer's attention for your zone. The report also tells you to confirm the zone with a local structural engineer.

---

*Know your seismic zone before you build. Try StructurePro to see how the zone changes the quantities of your frame.*`,
  },
  {
    slug: 'per-sqft-pricing-contractor-fraud',
    title: 'Per Square Foot Pricing: Why It Hides Contractor Fraud',
    excerpt:
      'A "₹1,800 per sq ft" quote sounds simple. It is actually the most effective way to conceal material substitution and quantity fraud. Here is what the number hides — and what to demand instead.',
    category: 'Cost & Transparency',
    readTime: 5,
    publishedDate: '2026-06-24',
    updatedDate: '2026-10-25',
    quickAnswer: "A per-sq-ft rate such as ₹1,800 hides the concrete grade, rebar diameter and wall thickness you are actually getting. Ask for a line-item BOQ and the IS code for every major material instead. Then compare quotes like for like, for example M20 with 16 mm columns against M25 with 20 mm columns.",
    faq: [
      { question: "Why is a per-sq-ft quote risky?", answer: "It is one number with nothing to check. It conceals material substitutions such as a lower concrete grade, thinner rebar or thinner walls, and under-delivery, because no quantities or specifications are listed." },
      { question: "What should I ask for instead of a rate?", answer: "A line-item Bill of Quantities (BOQ) that lists every material, its quantity, its rate and its IS specification. A contractor who refuses to provide one is hiding something." },
      { question: "Which specifications should be in the contract?", answer: "The concrete grade for each pour, the diameter and grade of steel for each element, the brick specification, the mortar mix ratio, and the plaster thickness, all in writing and signed before work starts." },
      { question: "How do I compare two quotes fairly?", answer: "Compare specifications, not rates. A quote for M20 concrete and 16 mm Fe 500D columns at ₹1,800 per sq ft is a different product from M25 and 20 mm columns at ₹2,100." },
      { question: "Is there a free way to check a quote?", answer: "Yes. The free Check a contractor's quantities tool compares the quantities in your quote with a code-based range for your house. It does not look at rates. A structural engineer or quantity surveyor can verify a BOQ against approved drawings." },
    ],
    relatedSlugs: ['verify-contractor-quote-is-456-2000', 'steel-theft-construction-sites', 'm20-vs-m25-concrete-grade'],
    content: `## The Appeal of a Single Number

"₹1,800 per square foot — all inclusive." It sounds clean, predictable, and easy to compare. You multiply by your floor area, get a total, and decide. Three contractors give you three numbers; you pick the lowest.

This is exactly the outcome a corner-cutting contractor wants. The per-sqft rate is a black box. It conceals every material substitution, every under-delivery, every shortcut — because there's nothing to check. You have no idea whether that ₹1,800 includes M20 or M15 concrete, 16mm or 12mm rebar, or whether the plumbing is CPVC or the cheapest PVC available.

## What the Number Actually Hides

Every construction project has a Bill of Quantities (BOQ) — a line-by-line breakdown of every material, its quantity, its rate, and its IS specification. A legitimate builder's BOQ has 80–150 line items. Per-sqft pricing collapses all of this into a single number.

The mathematics of fraud: if a contractor substitutes M15 for M20 concrete (less cement in every cubic metre), uses 10mm rebar where the drawing calls for 12mm (about 30% less steel by weight, because weight goes with the square of the diameter), and uses 4.5" brick walls where you expected 9" (about half the bricks), the contractor keeps the difference — while the invoice still says ₹1,800/sqft.

You won't know until the plaster starts cracking in year 3, the steel rusts in year 8, or the structure cracks in the first moderate earthquake.

## The IS Code Anchor

IS 456:2000, IS 1786:2008, IS 1077:1992, and IS 732:2019 don't give you a per-sqft rate. They give you a quantity for every specific element. A properly specified construction contract lists:

- Grade of concrete (M20/M25/M30) for each pour
- Diameter and grade of steel (Fe 500D) for each element
- Brick specification (IS 1077 class)
- Mortar mix ratio (1:4 or 1:6 depending on element)
- Plaster thickness (12mm internal, 20mm external)

Without these specifications in writing, signed before work begins, you have no recourse when substandard materials arrive.

## What to Demand Instead

Before signing any construction contract:

**1. Ask for a BOQ, not a rate.** A contractor who refuses to provide a line-item BOQ is hiding something. This is non-negotiable.

**2. Specify IS codes for every major material.** Concrete grade per IS 456, steel grade per IS 1786, bricks per IS 1077, pipes per IS 4985 (uPVC) or IS 15778 (CPVC).

**3. Get independent quantity verification.** A structural engineer or quantity surveyor can verify the BOQ against approved drawings. Agree the fee before they start. It is small next to the cost of a wrong quantity.

**4. Use NirmanShastra to work out your own quantity baseline.** StructurePro works out the quantities of your RCC frame for your floor area, state and soil. Place them beside the contractor's quantities and look for gaps.

## The Comparison You Can Actually Make

Instead of comparing ₹1,800/sqft vs ₹2,100/sqft, compare:
- Contractor A: M20 concrete, 16mm Fe 500D columns, 9" brick walls = ₹1,800/sqft
- Contractor B: M25 concrete, 20mm Fe 500D columns, 9" brick walls = ₹2,100/sqft

Now you are comparing like for like. The second quote might be worth every rupee.

---

*Work out the quantities of your frame with StructurePro, so you can compare contractor quotes on equal terms.*`,
  },
  {
    slug: 'rccb-electrical-safety-is-732-2019',
    title: 'RCCB and Electrical Safety: What IS 732:2019 Requires',
    excerpt:
      'Electrical fires and electrocution kill thousands of Indians every year. IS 732:2019 mandates specific safety devices for every home — most contractors omit them to cut costs. Here is what you cannot afford to skip.',
    category: 'Electrical',
    readTime: 5,
    publishedDate: '2026-06-26',
    updatedDate: '2026-10-25',
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

According to NCRB data, electrical fires and electrocution accidents cause thousands of deaths annually in India. Many happen in homes, where missing or wrong protection devices are a common factor.

The reason these devices are absent in many homes is simple: they add to the electrical contract, and a contractor working to a per-sqft price may omit them without telling you.

IS 732:2019 — the Indian Standard for Electrical Installations — consolidates requirements from the earlier IS 732:1989 and aligns with IEC 60364. Here is what it actually requires.

## RCCB — Residual Current Circuit Breaker

A **Residual Current Circuit Breaker (RCCB)** disconnects power within 30–40 milliseconds when it detects a leakage current to earth. At the 30mA sensitivity rating, the usual rating for protecting people, it is meant to disconnect before cardiac fibrillation can occur.

Wiring practice under IS 732 calls for RCCB protection on:
- All socket outlets accessible to the general public
- All bathroom and kitchen circuits
- Any outdoor socket circuit
- Circuits serving swimming pools, water features, or wet areas

An RCCB at the distribution board is a small part of an electrical contract. Omitting it to save that amount is false economy against the harm it prevents.

## MCB vs RCCB — Understanding the Difference

A **Miniature Circuit Breaker (MCB)** protects against overload and short circuit — it trips when current exceeds its rated value. It does **not** protect against earth leakage. You can electrocute yourself through a circuit that never trips its MCB.

An **RCCB** protects against earth leakage only — it will not protect against overload.

For complete protection, IS 732 recommends **RCBO** (Residual Current Circuit Breaker with Overcurrent protection), which combines both functions in a single device.

## Earthing — IS 3043:2018

IS 732 references IS 3043:2018 for earthing requirements. Every residential installation requires:
- A dedicated earth electrode (typically 2-metre copper-clad steel rod)
- Earth continuity conductors to every socket, switch, and appliance point
- An earth resistance test after installation, with the reading written down

Homes without proper earth continuity to all metal enclosures are at high risk.

## What to Check in Your Contractor's Quote

Ask your electrical contractor to provide the following in writing:
1. RCCB rating and sensitivity (minimum 30mA) — for which circuits?
2. MCB/RCBO ratings for each circuit
3. Earth electrode specification and expected resistance
4. Wire specification — copper, IS 694:2010 grade, minimum 1.5mm² for lighting and 2.5mm² for power circuits

NirmanShastra's ElectricalPro works out the quantities of wire, conduit, points and protection devices for your plan, so you can check them against a quote.

---

*Work out the wire, conduit and protection devices for your home with ElectricalPro.*`,
  },
  {
    slug: 'water-requirements-is-1172-1993',
    title: 'How Much Water Does Your Family Need? IS 1172:1993 Explained',
    excerpt:
      'Most Indian homes have undersized water tanks because no one calculated the actual requirement. IS 1172:1993 gives you an LPCD formula — and the answer will likely surprise you.',
    category: 'Plumbing',
    readTime: 4,
    publishedDate: '2026-06-28',
    updatedDate: '2026-10-25',
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
- A common split: 60% in an underground sump, 40% in an overhead tank (your plumber may use a different ratio)
- Overhead tank minimum: 432 litres (~500L commercial tank)

Step 4: Allow for peak demand. Pump and pipe sizing should be done for the busiest hour, not the average hour.

## Common Undersizing Errors

**1. Treating IS 1172 as optional.** Many plumbers size by habit ("two 1,000L tanks always works") without calculating. In a 6-bedroom house with three bathrooms, two 1,000L tanks may cover only 12 hours of supply interruption.

**2. Ignoring servant quarters and guard rooms.** IS 1172 counts every person on the premises. If you have live-in domestic staff, add 135 LPCD per person.

**3. Not accounting for garden or car-washing.** IS 1172 does not cover landscape irrigation — you need to add this separately based on garden area.

**4. Under-specifying the sump pump.** The pump must refill the overhead tank in a reasonable time. An undersized pump makes the full tank capacity useless.

## Pipe Sizing Follows From Tank Size

Once you know the daily requirement and the tank sizes, pipe diameters follow from the flow needed to fill the overhead tank and to feed the fixtures.

NirmanShastra's PlumbingPro works out the quantities of pipe, fittings, fixtures and tank capacity for your plan and family size.

---

*Work out the tank and pipe quantities for your home with PlumbingPro.*`,
  },
  {
    slug: 'ghar-banane-ka-sahi-cost-is-code',
    title: 'Ghar Banane Mein Kitna Maal Lagega: Rate Se Pehle Quantity Nikaaliye',
    excerpt:
      'Aapka contractor ₹1,800/sqft bolta hai, doosra ₹2,200 — dono ke paas koi breakdown nahi. Rate ke peeche ek quantity list hoti hai: cement, steel, bricks, wire, pipe. Ye article batata hai ki wo list kaise maangein aur kya check karein.',
    category: 'Cost & Transparency',
    readTime: 5,
    publishedDate: '2026-07-06',
    updatedDate: '2026-10-25',
    quickAnswer: "Per sqft rate ek total hota hai, jise check nahi kar sakte. Line-item BOQ maangiye jisme cement, steel, bricks, wire aur pipe ki quantity ho. Thumb rule lagbhag 0.4 bag cement aur 4 kg steel per sqft hai, par ye sirf andaza hai. Modular brick ki ek-brick deewar mein lagbhag 100 bricks per sqm lagti hain.",
    faq: [
      { question: "Per sqft rate pe bharosa kyun nahi karna chahiye?", answer: "Kyunki ek akele number mein koi breakdown nahi hota: concrete ka grade, steel ka diameter, deewar ki motai, kuch nahi dikhta. Quantity list maangiye aur wahi check kariye." },
      { question: "1,500 sqft ke ghar mein kitna cement aur steel lagega?", answer: "Thumb rule se roughly 600 bags cement aur 6,000 kg steel, poore ghar ke liye. Ye sirf pehla andaza hai. Floors, soil aur seismic zone se asli quantity badalti hai." },
      { question: "Ek square metre deewar mein kitni bricks lagti hain?", answer: "Modular brick (190×90×90 mm, 10 mm joint) ki ek brick motai wali deewar mein lagbhag 100 bricks per sqm, aur aadhi motai wali partition mein lagbhag 50 (IS 1077:1992). Bahut jagah lal eent modular nahi hoti, to count badalta hai. Kuch eenten naap kar dekhiye." },
      { question: "Foundation kaunsa chahiye?", answer: "Ye soil par depend karta hai. Achhi soil mein isolated footing, kamzor soil mein raft ya pile. Faisla soil test (IS 1904:1986) aur structural engineer ke hisaab se hota hai." },
    ],
    language: 'hi-Latn',
    relatedSlugs: ['per-sqft-pricing-contractor-fraud', 'verify-contractor-quote-is-456-2000', 'steel-theft-construction-sites'],
    content: `Aapka contractor bol raha hai ₹1,800 per sqft. Ek doosra bol raha hai ₹2,200. Dono ke paas breakdown nahi hai — bas ek number.

Per sqft rate ek total hota hai jise area se divide kiya gaya hai. Usme se aap kuch check nahi kar sakte. Lekin rate ke peeche ek list hoti hai: kitna concrete, kitni steel, kitni eenten, kitna wire. Wo list check ho sakti hai. NirmanShastra sirf wahi list (quantity) nikaalta hai. Hum koi daam nahi batate.

## Step 1: Rate ke peeche ki list maangiye

Contractor se line-item BOQ (Bill of Quantities) maangiye. Har line mein item, unit, quantity aur specification ho: concrete ka grade (M20, M25), steel ka diameter aur grade (Fe 500D), eent ka type, plaster ki motai. Jo contractor BOQ dene se mana kare, wo kuch chhupa raha hai.

## Step 2: Cement aur steel ka pehla andaza

Ek thumb rule bahut sunne ko milta hai: poore ghar ke liye lagbhag **0.4 bag cement** aur **4 kg steel per sqft built-up area**. 1,500 sqft ke ghar ke liye roughly 600 bags cement aur 6,000 kg steel.

Dhyan rakhiye: ye trade ka thumb rule hai, kisi IS code ki value nahi. Isme floors, soil, seismic zone, kuch nahi gina gaya. Steel ke liye ek 2026 ke study (26 multi-family buildings, south aur west India; GKSPL, Conserve Consultants ki summary ke mutabiq) mein 31 se 62 kg per sqm built-up area likha hai, yaani lagbhag 2.9 se 5.8 kg per sqft. Thumb rule is range ke andar hai, lekin range badi hai. Isse bas ye dekhiye ki contractor ka number bahut door to nahi.

Agar contractor ka number isse bahut alag hai, to poochiye kyun, aur drawing maangiye.

## Step 3: Brickwork kitna lagega?

Modular brick (190×90×90 mm, 10 mm joint, IS 1077:1992) ki ek brick motai wali deewar mein lagbhag **100 bricks per sqm** lagti hain, aur aadhi motai wali partition mein lagbhag **50**. Pehle darwaze aur khidkiyon ka area deewar ke area se ghataiye, phir 5 se 10% wastage jodiye.

Bahut jagah lal eent modular nahi hoti. 230×115×75 mm ek aam size hai, aur uska count alag aata hai. Order dene se pehle kuch eenten naap lijiye.

## Step 4: Foundation kaunsa chahiye?

Ye aapki soil par depend karta hai. Achhi soil mein isolated footing chal jaati hai. Kamzor ya paani wali soil mein raft ya pile lagta hai, aur tab concrete aur steel kaafi badh jaate hain. Soil test (IS 1904:1986) karwaiye aur structural engineer se foundation ka type tay kariye. Ye faisla andaze se nahi hona chahiye.

## Toh NirmanShastra kya karta hai?

NirmanShastra aapke plot, floors, state, city aur soil ke hisaab se materials ki quantity nikaalta hai: concrete, steel, cement, sand, aggregate, bricks, wire, pipe. Har quantity ke saath IS code ka clause hota hai, aur ek low aur ek high figure bhi, kyunki asli drawing alag hogi. Free mein aap apne frame ka seismic zone, concrete aur steel ke grade, IS code checks aur 3D model dekh sakte hain. Poori quantity report paid hai.

Isme koi daam, labour ya contractor rate nahi hota. Daam aap apne suppliers se khud poochiye. Contractor ke number pe trust karne se pehle, apni quantity nikaaliye.

---

*Apne ghar ki quantity khud dekhiye: [StructurePro](/tools/structopro) se frame ki, aur [MasonryPro](/tools/masonpro) se brickwork ki.*`,
  },
  {
    slug: 'vastu-vedic-architecture-16-zones',
    title: 'Vastu and the 16 Zones: What the Old Texts Say and What They Do Not',
    excerpt:
      'The 16-zone compass that many Vastu apps use is a modern convention. The old texts divide a plot into a grid of squares and its boundary into 32 positions. A plain account of what they say, what teachers add, and what no study has shown.',
    category: 'Vastu',
    readTime: 6,
    publishedDate: '2026-06-30',
    updatedDate: '2026-10-25',
    quickAnswer: "One of the oldest dated texts with a chapter on house-building, Varahamihira's Brihat Samhita (about the 6th century CE), divides a plot into a grid of 81 squares and its boundary into 32 positions. A split into 16 zones of 22.5 degrees is a modern convention that none of the old texts we read uses. VastuPro shows 16 zones for rooms, reads the main door by the 32 old positions, and marks every finding as traditional texts, widely taught today, or modern convention. No controlled study has shown that following Vastu changes health, money or relationships.",
    faq: [
      { question: "What is the Vastu Purusha Mandala?", answer: "A square grid that stands for the plot, with a figure, the Vastu Purusha, lying face down across it. The texts use a grid of 64 squares (manduka) or 81 squares (paramasayika). A guardian holds each square or group of squares: 45 in all, one at the centre, twelve inside and thirty-two round the boundary." },
      { question: "What is the Brahmasthan?", answer: "The middle of the grid, held by Brahma. The old texts say it is kept open and clean, and that no door faces it. The list of rooms to keep out of the centre, such as the toilet, kitchen, stairs and bedroom, comes from modern manuals. The texts we could check do not give it." },
      { question: "Are the 16 zones in the old texts?", answer: "No. We found no old text or scholarly source for a split into 16 zones of 22.5 degrees. Modern consultants and apps use it. The old texts divide the boundary into 32 positions, eight on each side, and give a result for a door at each one. VastuPro uses the 16-zone split for rooms and says it is a modern convention, and it reads the main door by the 32 positions." },
      { question: "Where do the old texts put the kitchen?", answer: "In the south-east, the side of Agni, the guardian of fire (Brihat Samhita, chapter 53). They name directions for only a few rooms. Most of what is taught about bedrooms, toilets, study rooms and living rooms comes from later manuals, and VastuPro marks each rule as traditional, widely taught or modern." },
      { question: "Does true north or magnetic north matter?", answer: "The old text Mayamata finds east and west with the sun and a gnomon, not with a magnetic needle. In India a compass differs from true north by only about 2 degrees west to 3 degrees east, but steel, wiring and phone sensors can throw a reading off by much more, and builders' plans are often 10 to 25 degrees off true north. Check North on site, away from steel." },
      { question: "Is there evidence that following Vastu changes health, money or luck?", answer: "We found no peer-reviewed controlled study that shows it. A few rules do have a practical reason, such as light and air from the north and east, or keeping toilets away from drinking water. VastuPro shows the reason where there is one, and makes no claim about outcomes." },
      { question: "Is VastuPro free?", answer: "Yes. You draw the outline of your house, mark the doors and rooms, and get a reading with a PDF, with no payment. It is a reading of a plan against traditional rules, not a structural check." },
    ],
    relatedSlugs: ['rccb-electrical-safety-is-732-2019', 'water-requirements-is-1172-1993', 'verify-contractor-quote-is-456-2000'],
    content: `## What Vastu is, and how old the texts are

Vastu Shastra is the traditional Indian body of rules for siting and planning buildings. It is often described as 3,000 years old. The texts that can be dated are younger: Varahamihira's **Brihat Samhita**, chapter 53, on house-building, is from about the 6th century CE. The south Indian **Mayamata** is placed between the 5th and 7th centuries by some scholars, and later by others. Bhoja's **Samarangana Sutradhara** is from the 11th century. Some scholars trace the ideas back to earlier Vedic and Puranic writing, but the dated treatises are about 1,500 years old.

Two books help a reader who wants to check this against a more careful source: Vibhuti Chakrabarti's *Indian Architectural Theory and Practice* (Routledge, 2013), which sets what the texts say beside how consultants use them today, and En-Yu Huang's open-access study that compares the old texts with modern manuals.

## The mandala is a grid, not a compass

The **Vastu Purusha Mandala** is a square grid that stands for the plot. The texts use 64 squares (manduka) or 81 squares (paramasayika). A guardian holds each square or group of squares: 45 in all, with Brahma at the centre, twelve around him and thirty-two on the boundary.

Two ideas in the old texts matter for a house plan:

- **The centre stays open.** The Brahmasthan, the middle of the grid, is kept clear and clean, and no door faces it.
- **The boundary has 32 positions.** Eight on each side, each with its own guardian. The texts say what a door at each position means.

## How the main door is read

A door is not read by the side it is on alone. It is read by where along that side it sits. In the 1884 English translation of the Brihat Samhita by N. Chidambaram Iyer, which VastuPro follows, the positions named as favourable are:

| Side | Positions named as favourable |
|---|---|
| East | Jayanta, Indra |
| West | Pushpadanta, Varuna |
| North | Mukhya, Bhallata, Soma |
| South | None; Grihakshata is mixed |

Other translations name some positions a little differently, so treat the table as one reading of the text, not the last word. Teachers differ on the south side in particular: some texts list a south position as acceptable, while many consultants advise against a south door altogether.

## Where the 16 zones come from

A split of the compass into 16 zones of 22.5 degrees is common in modern Vastu apps and consultancies. We found no old text or scholarly source for it. It is a convenient way to say where a room sits, and VastuPro uses it for that, but it is a modern convention and the tool says so. A rule with no basis in the older texts is never called "Cautioned" in the reading; it is marked "To review" at most.

Most room-by-room rules sit in the same modern layer. The Brihat Samhita names directions for only a handful of rooms, such as the kitchen in the south-east and the room of the household deity in the north-east, and it gives a direction for each water source. The lists for bedrooms, toilets, study rooms and living rooms come from later manuals. Each finding in VastuPro carries a tag: **Traditional texts**, **Widely taught today** or **Modern convention**.

## True north, magnetic north and your plan

Mayamata finds east and west from the sun, using a gnomon, and does not mention a magnetic needle. A modern consultant reads a compass. Across India the compass differs from true north by only a few degrees, about 2 degrees west to 3 degrees east, but steel in the structure, wiring, and a phone's sensor can throw a reading off by far more. The bigger problem is usually the drawing: a builder's plan is often 10 to 25 degrees off true north. VastuPro asks you to set North on the plan, shows a "close to a zone line" warning when a room is within 5 degrees of a boundary, and shows the reading on both sides of the line. Check North on site, away from steel, before you act on a close call.

## What no study has shown

We searched for controlled studies on whether following Vastu changes health, money or relationships and found none that is peer-reviewed and controlled. A few rules do have a practical reason that stands on its own: light and air from the north and east, keeping toilets and septic lines away from drinking water, a staircase that is safe to climb. VastuPro shows that reason where there is one. For the rest it reports what the texts and teachers say, attributes it, and makes no claim about what will happen to anyone.

## Using VastuPro

You set where North lies on your drawing, draw the outline of the house, tap where the doors are, and add each room. The reading comes back door by door and room by room, with where each rule comes from, where teachers differ, and what could be done if the plan can still change. It is a reading of a plan against traditional rules. It is not a structural check, and it is not part of any BIS code.

---

*Read your plan with VastuPro: free, no payment required.*`,
  },
  {
    slug: "construction-cost-per-sq-ft-india",
    title: "Construction Cost per Sq Ft in India: What the Rate Does Not Tell You",
    excerpt:
      "A per-sq-ft rate is a total divided by an area. Behind it sits a list of quantities: concrete, steel, bricks, tiles, wire, pipe and paint. How to ask for that list, and what to check on it before you compare two rates.",
    category: "Cost & Transparency",
    readTime: 5,
    publishedDate: '2026-10-23',
    updatedDate: '2026-10-25',
    quickAnswer: "A per-sq-ft rate is a total divided by built-up area, so it cannot be checked. Ask for the quantities behind it: concrete in m³, steel in kg, bricks, tiles in m², wire and pipe in metres. A 2026 study of low-rise homes reports 31 to 62 kg of steel and 0.36 to 0.44 m³ of concrete per m² built.",
    faq: [
      { question: "What does a per-sq-ft rate include?", answer: "Whatever the contractor chose to include, which is the problem. It is a total divided by an area, so it can hide the concrete grade, the steel diameter, the wall thickness and the finish quality, and it may leave out land, approvals, a boundary wall, furniture and appliances." },
      { question: "What should I ask for instead of a rate?", answer: "A line-item Bill of Quantities: each item with its unit, quantity and specification. The quantities are what you can check against drawings and against a code-based baseline. The price on each line is a separate conversation with your own suppliers." },
      { question: "How much steel and concrete does a low-rise house use per sq ft?", answer: "A 2026 baseline study of 26 multi-family residential buildings in south and west India (GKSPL, summarised by Conserve Consultants) reports 31 to 62 kg of steel and 0.36 to 0.44 m³ of concrete per m² of built-up area for buildings up to four storeys. That is about 2.9 to 5.8 kg of steel and 1.2 to 1.4 cft of concrete per sq ft. The summary does not say how many of the buildings were low-rise, so treat it as a wide range, not a target." },
      { question: "What changes most between a basic and a premium finish?", answer: "The finishing lines: flooring area and material, doors and windows, fittings, ceilings and joinery. The frame is set by loads, spans, soil and earthquake zone, so its quantities stay roughly the same. Ask for the structure quantities and the finish specification separately, so you can see which side a difference between two quotes sits on." },
      { question: "Does NirmanShastra give a cost per sq ft?", answer: "No. It works out quantities and states no prices of its own, so there is no rate of ours to go stale. Take the quantities to your own suppliers for quotes. If you want the rupees, you can type their rates into a paid report; it multiplies them by the quantities and says that labour, transport and taxes are not included." },
      { question: "How do I check a rate that arrives as one number?", answer: "Ask which specification it assumes and for the quantity list behind it. Then compare the structure quantities with a code-based baseline worked out from your plan, and read why a per-sq-ft price hides fraud before you sign." },
    ],
    relatedSlugs: ["per-sqft-pricing-contractor-fraud", "how-to-check-contractor-quote", "verify-contractor-quote-is-456-2000"],
    content: `## A rate is a total divided by an area

A quote of "₹ per sq ft" tells you nothing about what is inside it. Two builders can quote the same rate for different houses, and different rates for the same house, and you cannot tell why from the number. What can be checked is the list of quantities behind the rate. NirmanShastra works out those quantities and puts no prices of its own on them; if you want the rupees, you type the rates you were quoted.

## The seven lines behind a rate

Ask for the quantity of each line, with its unit and its specification:

| Line | What to ask for | Unit |
|---|---|---|
| Structure (RCC frame) | Concrete by grade, reinforcement steel by diameter, shuttering | m³, kg, m² |
| Masonry and plaster | Bricks or blocks, mortar, plaster area and thickness | number, m³, m² |
| Flooring | Tile or stone area with wastage, adhesive, grout | m², kg |
| Doors and windows | Count by size and material, frames, shutters, glass | number, m² |
| Electrical | Points, wire by size, conduit, MCBs and an RCCB | number, m |
| Plumbing | Pipe by size and material, fixtures, tank capacity | m, number, litres |
| Painting, ceilings and joinery | Paint area and coats, ceiling area, joinery by running metre | m², m |

## What changes between a basic and a premium finish

The frame is set by loads, spans, soil and earthquake zone, not by how fine the finish is. The finish moves the finishing lines: the area and material of the flooring, the doors and windows, the fittings, the ceilings. So ask for the structure quantities and the finish specification separately. When two quotes differ, you can then see which side the difference is on.

## A sanity range for the frame

Published figures for what built houses use are scarce. A 2026 baseline study of 26 multi-family residential buildings completed since 2020 in south and west India (GKSPL, as summarised by Conserve Consultants) reports, for buildings up to four storeys, 31 to 62 kg of steel and 0.36 to 0.44 m³ of concrete per m² of built-up area. In the units used on site that is about 2.9 to 5.8 kg of steel and 1.2 to 1.4 cft of concrete per sq ft.

Two cautions. The summary does not say how many of the 26 buildings were low-rise, and it is a secondary report, not the study itself. The thumb rules we found online run from about 3.5 to 5.5 kg of steel per sq ft, and none of the pages cited data. Use the range to spot a quote that is far outside it, not to set a target.

## What is not in a per-sq-ft figure

Land, approvals, a boundary wall, furniture and appliances are usually outside a per-sq-ft rate. Ask whether yours includes them, because a quote that does is not comparable to one that does not.

## How to test a contractor's rate

1. Ask which specification the rate assumes and for a line-item BOQ with quantities.
2. Put the structure quantities beside a baseline worked out from your own plan. [StructurePro](/tools/structopro) works out your frame, and [Check a contractor's quantities](/compare-quote) compares a quote's quantities with a code-based range.
3. Check the steel that arrives by weight, as in [how to catch under-delivery](/blog/steel-theft-construction-sites).
4. Read [why a per-sq-ft price hides fraud](/blog/per-sqft-pricing-contractor-fraud) before you sign.

See the [glossary](/glossary) for BOQ, built-up area and other terms used here.`,
  },
  {
    slug: "cement-sand-aggregate-for-1000-sq-ft-house",
    title: "Cement, Sand and Aggregate for a 1,000 Sq Ft House: A Rule of Thumb and Where It Fails",
    excerpt:
      "The thumb rule people quote for a 1,000 sq ft house, how to turn it into the cement for a single pour, and why it stops being reliable. Treat it as a first guess, not a calculation.",
    category: "Structural",
    readTime: 5,
    publishedDate: '2026-10-23',
    updatedDate: '2026-10-25',
    quickAnswer: "A widely quoted rule of thumb for a whole 1,000 sq ft house is about 400 bags of cement (0.4 per sq ft), 1,800 cft of sand and 1,350 cft of coarse aggregate. It ignores floors, soil, earthquake zone and design, so use it as a first guess only. For one pour, M20 concrete needs about 8 bags per m³.",
    faq: [
      { question: "How many bags of cement does a 1,000 sq ft house need?", answer: "A widely quoted rule of thumb says about 400 bags of 50 kg cement for the whole house, at 0.4 bag per sq ft of built-up area. It is a first guess: it ignores your floors, soil, earthquake zone and design." },
      { question: "How much sand does a 1,000 sq ft house need?", answer: "The same rule of thumb gives about 1,800 cft, roughly 51 m³, at 1.8 cft per sq ft of built-up area." },
      { question: "How much coarse aggregate does a 1,000 sq ft house need?", answer: "The rule of thumb gives about 1,350 cft, roughly 38.2 m³, at 1.35 cft per sq ft of built-up area." },
      { question: "Does the quantity change with the number of floors?", answer: "Yes, and the rule of thumb does not allow for it. A code-based tool such as StructurePro works the frame out from your floors, soil and earthquake zone, so a G+1 house in Zone II and a G+3 house in Zone IV come out differently." },
      { question: "What does built-up area mean here?", answer: "The total built-up area across all floors, not the plot size or one floor. A G+1 house with 500 sq ft on each floor has 1,000 sq ft of built-up area." },
      { question: "How do I get cement for one slab or beam instead?", answer: "Use the per-cubic-metre figure: M20 concrete needs about 8 bags of 50 kg cement per m³, so a 20 m³ pour needs roughly 160 bags." },
      { question: "Can I order material from the rule of thumb?", answer: "No. An order should come from the drawings and the bar bending schedule. The rule of thumb can tell you that a quote is far off. It cannot tell you what to buy." },
    ],
    relatedSlugs: ["verify-contractor-quote-is-456-2000", "steel-required-per-sq-ft", "m20-vs-m25-concrete-grade"],
    content: `## The rule of thumb

These are the values people quote for a whole house, per sq ft of **built-up area**, meaning the total across all floors. The cement and sand include masonry and plaster, not only the concrete frame.

| Material | Per sq ft of built-up area | For 1,000 sq ft |
|---|---|---|
| Cement (50 kg bags) | 0.4 bag | 400 bags |
| Sand | 1.8 cft | 1,800 cft (about 51 m³) |
| Coarse aggregate | 1.35 cft | 1,350 cft (about 38.2 m³) |
| Steel | 4 kg | 4,000 kg |

They are a rule of thumb. They do not come from a design, and no IS code gives a quantity per sq ft of floor. NirmanShastra's tools no longer use them: they work the quantities out from your plan instead.

## Scaling to your house

The rule scales with built-up area. A 1,500 sq ft house comes to about 600 bags of cement, 2,700 cft of sand, 2,025 cft of aggregate and 6,000 kg of steel, if the rule fits your house at all.

## From a thumb rule to a single pour

For one slab, beam or column, work from concrete volume instead. M20 concrete needs about 8 bags of 50 kg cement per cubic metre: the CPWD Analysis of Rates figure for the conventional 1 : 1.5 : 3 mix. A 20 m³ slab needs roughly 160 bags. The free [Concrete Mix Ratio Calculator](/tools/concrete-mix-ratio-calculator) does this for any volume, and [how to verify a contractor's quote against IS 456](/blog/verify-contractor-quote-is-456-2000) shows the cross-check step by step.

## Where the rule of thumb stops being reliable

- It ignores the number of floors. More floors mean larger columns and more steel in every member below.
- It ignores the soil. A raft foundation on weak ground uses much more concrete and steel than isolated footings on firm ground.
- It ignores the earthquake zone. Higher zones need more steel and closer stirrups.
- It assumes a regular residential frame. An unusual span, a different concrete grade or a stilt floor changes the quantities.
- It mixes the frame with masonry and plaster, so you cannot check one against the other.
- It is not a structural design. A structural engineer must design and approve the building.

## A figure worked out from your plan

[StructurePro](/tools/structopro) works out the RCC frame from your built-up area, floors, state, city and soil, and shows a low and a high figure for each total. [MasonryPro](/tools/masonpro) works out the cement and sand that go into brickwork and plaster. The [glossary](/glossary) explains terms such as built-up area, G+1 and M20.`,
  },
  {
    slug: "how-to-check-contractor-quote",
    title: "How to Check a Contractor’s Quote: 7 Checks You Can Do Yourself",
    excerpt:
      "You do not need to be an engineer to test a construction quote. Seven checks on concrete, steel, bricks, wiring, water, testing and payment, each with the IS-code number to compare against.",
    category: "Cost & Transparency",
    readTime: 6,
    publishedDate: '2026-10-23',
    updatedDate: '2026-10-25',
    quickAnswer: "Ask for a line-item BOQ, then run seven checks: M20 concrete takes about 8 bags of cement per m³; rebar weighs d² ÷ 162 kg per metre; a one-brick modular wall takes 100 bricks per m²; wire is 1.5 mm² for lights, 2.5 mm² for sockets; water is 135 litres per person daily; cubes follow IS 456 Cl 15.2.2.",
    faq: [
      { question: "What is the first thing to ask a contractor for?", answer: "A line-item Bill of Quantities (BOQ) listing each material, quantity, rate and IS specification. A single per-sq-ft rate gives you nothing to check." },
      { question: "How do I check the cement quantity in a quote?", answer: "Multiply the concrete volume in cubic metres by 8 for M20 (50 kg bags). A 20 m³ pour needs about 160 bags, and a variance above 10% needs an explanation." },
      { question: "How do I check the brick quantity?", answer: "A one-brick wall of 190 × 90 × 90 mm modular brick takes about 100 bricks per m² and a half-brick wall about 50. The common 230 × 115 × 75 mm red brick takes about 94 and 49. Deduct door and window openings first, then allow 5–10% for wastage." },
      { question: "What wire sizes should the quote show?", answer: "Minimum copper sizes of 1.5 mm² for lighting and fans, 2.5 mm² for power sockets, 4 mm² for an AC or geyser, 6 mm² for a sub-panel feed and 10 mm² for the main incomer (common practice under IS 732; your electrician's load calculation decides)." },
      { question: "How many concrete cube samples should be taken?", answer: "IS 456:2000 Cl 15.2.2: 1 sample for 1–5 m³, 2 for 6–15 m³, 3 for 16–30 m³ and 4 for 31–50 m³, with at least one sample from each shift of concreting." },
      { question: "Is there a free tool to compare a quote with IS-code quantities?", answer: "Yes. The free Check a contractor's quantities tool shows which quantities in your quote sit outside a code-based range for your house. It does not look at rates." },
    ],
    relatedSlugs: ["verify-contractor-quote-is-456-2000", "per-sqft-pricing-contractor-fraud", "steel-theft-construction-sites"],
    content: `## Start with the BOQ, not the rate

Ask for a line-item Bill of Quantities. It lists every material, its quantity, its rate and its IS specification. A rate such as "₹ per sq ft" gives you nothing to check, which is why [per-sq-ft pricing hides contractor fraud](/blog/per-sqft-pricing-contractor-fraud). Once you have the BOQ, run these seven checks.

## 1. Concrete grade and cement quantity

The quote must state the grade for each pour. For M20 concrete, plan on about **8 bags of 50 kg cement per cubic metre** (CPWD Analysis of Rates 2014). A 20 m³ slab needs roughly 160 bags, so a quote for 120 bags is a red flag. A variance above 10% needs a written explanation. The [Concrete Mix Ratio Calculator](/tools/concrete-mix-ratio-calculator) scales this to your volume, and [this guide](/blog/verify-contractor-quote-is-456-2000) walks through the cross-check.

## 2. Steel by weight

Rebar is billed by weight, so verify it by weight. The weight per metre of a bar is **d² ÷ 162 kg**, where d is the diameter in mm: a 12 mm bar weighs about 0.889 kg per metre. Weigh a sample and compare. The [Bar Bending Schedule Calculator](/tools/bar-bending-schedule-calculator) gives cutting lengths and weights for 13 bar shapes, and [how to catch steel under-delivery](/blog/steel-theft-construction-sites) covers the site checks.

## 3. Bricks per square metre

A one-brick wall of standard 190 × 90 × 90 mm modular brick (190 mm thick) takes about **100 bricks per m²**, and a half-brick (90 mm) partition about **50** (IS 1077:1992, IS 2212:1991). The common 230 × 115 × 75 mm red brick makes the 9-inch wall, at about **94 per m²**. Deduct door and window openings from the wall area first, then allow 5–10% for wastage. The [Brick Calculator](/tools/brick-calculator) does the arithmetic.

## 4. Wiring

Minimum copper sizes are **1.5 mm²** for lighting and fans, **2.5 mm²** for power sockets, **4 mm²** for an AC or geyser, **6 mm²** for a sub-panel feed and **10 mm²** for the main incomer (common practice under IS 732; your electrician's load calculation decides). The quote should also name the RCCB and MCB ratings. The [Wire Size Calculator](/tools/wire-size-calculator) lists the typical MCB for each.

## 5. Water storage

Allow **135 litres per person per day** (IS 1172:1993). A family of five on municipal water needs 675 litres a day; storing two-thirds of a day's demand gives 452 litres, so a 500 L tank. Use the [Water Tank Size Calculator](/tools/water-tank-size-calculator) for your family.

## 6. Concrete testing

IS 456:2000 Cl 15.2.2 sets the minimum number of samples by volume: 1 for 1–5 m³, 2 for 6–15 m³, 3 for 16–30 m³ and 4 for 31–50 m³, and at least one sample from each shift. A 10 m³ pour needs 2 samples, which is 6 cubes at 3 cubes a sample. The [Concrete Cube Test Calculator](/tools/concrete-cube-test-calculator) gives the count for any volume.

## 7. The payment bills

Running Account (RA) bills decide what you actually pay. Net payable is gross bill minus retention and advance recovery, plus GST, minus TDS. With 5% retention, 18% GST and 1% TDS on the value excluding GST, a ₹10,00,000 bill pays ₹11,20,000. The [RA Bill Calculator](/tools/ra-bill-retention-tds-calculator) shows each line.

## Put it side by side

Run the numbers, then use the free [Check a contractor's quantities](/compare-quote) tool to see which quantities sit outside a code-based range for your house. For unfamiliar words, see the [glossary](/glossary).`,
  },
  {
    slug: "steel-required-per-sq-ft",
    title: "How Much Steel per Sq Ft? The Rule of Thumb, the Published Range and How to Check a Delivery",
    excerpt:
      "The rule of thumb is about 4 kg of reinforcement per sq ft. See how it compares with a published range for built houses, what moves the real figure, and how to check a delivery by weight.",
    category: "Structural",
    readTime: 5,
    publishedDate: '2026-10-23',
    updatedDate: '2026-10-25',
    quickAnswer: "The rule of thumb is about 4 kg of reinforcement per sq ft of built-up area, so about 4,000 kg for 1,000 sq ft. A 2026 study of built low-rise homes reports 2.9 to 5.8 kg per sq ft (31 to 62 kg per m²). Check a delivery by weight: kg per metre is d² ÷ 162.",
    faq: [
      { question: "How much steel does a 1,000 sq ft house need?", answer: "The common rule of thumb says about 4,000 kg, at 4 kg per sq ft of built-up area. A 2026 baseline study of built low-rise homes reports 31 to 62 kg per m², which is 2.9 to 5.8 kg per sq ft, so the rule sits inside the published range. Your floors, soil and earthquake zone move the real figure." },
      { question: "Where does the 4 kg per sq ft rule come from?", answer: "It is a trade rule of thumb. The pages we found that quote it give figures from about 3.5 to 5.5 kg per sq ft, and none cites data. It is not from an IS code." },
      { question: "What does a bar weigh per metre?", answer: "IS 1786:2008 Table 1 gives 8 mm 0.395 kg, 10 mm 0.617, 12 mm 0.888, 16 mm 1.58 and 20 mm 2.47. The formula d² ÷ 162 (d in mm) reproduces them to about three decimals." },
      { question: "How much more steel do I buy than is placed?", answer: "More. Cutting waste and laps mean the steel you buy exceeds the steel in the drawing. The CPWD Analysis of Rates (Delhi, 2014, item 5.22.1) allows 5%." },
      { question: "How much weight tolerance does IS 1786 allow?", answer: "A tolerance on mass that depends on bar size and is checked per batch: about ±7% up to 10 mm, ±5% from 10 to 16 mm and ±3% above 16 mm (IS 1786:2008 Table 2). A bar far outside its band is a reason to reject." },
      { question: "How do I check a steel delivery?", answer: "Weigh a sample of bars, divide by the number of bars and their measured length, and compare with the weight per metre. Five 12 mm bars of 6 m should weigh about 26.6 kg." },
    ],
    relatedSlugs: ["steel-theft-construction-sites", "cement-sand-aggregate-for-1000-sq-ft-house", "how-to-check-contractor-quote"],
    content: `## The rule of thumb and the published range

The figure people quote for a house is about **4 kg of reinforcement steel per sq ft of built-up area**, the total across all floors. A 1,000 sq ft house comes to about 4,000 kg and a 1,500 sq ft house to about 6,000 kg. It is a trade rule of thumb, not an IS code value. The pages we found that quote it give anything from about 3.5 to 5.5 kg per sq ft, and none cites data.

Published figures for built houses are few. A 2026 baseline study of 26 multi-family residential buildings completed since 2020 in south and west India (GKSPL, as summarised by Conserve Consultants) reports 31 to 62 kg of steel per m² of built-up area for buildings up to four storeys. That is about 2.9 to 5.8 kg per sq ft, so the rule of thumb sits inside it. The summary does not say how many of the buildings were low-rise, so read the range as wide.

## What moves the real figure

- **Floors.** More storeys carry more load down the columns and footings.
- **Earthquake zone.** Higher zones need more steel in beams and columns and closer stirrups (IS 13920:2016).
- **Soil.** Weak ground pushes the design to a raft foundation, which uses far more steel than isolated footings.
- **Spans and use.** Longer spans, balconies and an open stilt floor all add steel.

A rule per sq ft ignores every one of these. [StructurePro](/tools/structopro) works the steel out from your own plan, floors, state, city and soil.

## Weight of a bar per metre

Steel bars are bought by weight. IS 1786:2008 Table 1 gives the mass per metre, and the formula **d² ÷ 162** (d in mm) reproduces it.

| Diameter | Weight per metre | Weight of a 6 m bar |
|---|---|---|
| 8 mm | 0.395 kg | 2.37 kg |
| 10 mm | 0.617 kg | 3.70 kg |
| 12 mm | 0.888 kg | 5.33 kg |
| 16 mm | 1.58 kg | 9.48 kg |
| 20 mm | 2.47 kg | 14.82 kg |

## Weight tolerance

IS 1786 does not require every bar to hit the table weight. It allows a tolerance on mass that depends on bar size and is checked per batch: about ±7% up to 10 mm, ±5% from 10 to 16 mm and ±3% above 16 mm (IS 1786:2008 Table 2). A difference in the third decimal place is not a red flag. A gap far outside the band is.

## Checking what was delivered

Weigh a handful of bars and divide the weight by the number of bars and their measured length. Five 12 mm bars of 6 m should weigh about 26.6 kg. If they weigh 22 kg, the delivery is about 17% light, well outside the tolerance. The full site procedure is in [how to catch steel theft on construction sites](/blog/steel-theft-construction-sites).

## Buy more than you place

The steel in a drawing is the steel placed. What you buy is more, because of cutting waste and laps. The CPWD Analysis of Rates (Delhi, 2014, item 5.22.1) allows 5%. So a quote with no allowance at all deserves a question, and so does one with a very large allowance.

## From weight to a cutting list

For a bar bending schedule, the [Bar Bending Schedule Calculator](/tools/bar-bending-schedule-calculator) gives the cutting length and weight for six common bar shapes (straight, L, U, crank, stirrup and square tie) with the bend and hook rules. For the cement, sand and aggregate side, see [the rule of thumb for a 1,000 sq ft house](/blog/cement-sand-aggregate-for-1000-sq-ft-house). Terms such as TMT, Fe 500D and cover are in the [glossary](/glossary).`,
  },
  {
    slug: "bricks-per-sq-ft",
    title: "Bricks per Sq Ft of Wall: Red Brick and Modular Brick, Full and Half Thickness",
    excerpt:
      "A 9-inch wall of the common red brick takes about 8.7 bricks per sq ft of wall, and a 4.5-inch wall about 4.6. How the numbers come from the brick size and the joint, how to deduct openings, and how much to add for wastage.",
    category: "Structural",
    readTime: 4,
    publishedDate: '2026-10-23',
    updatedDate: '2026-10-25',
    quickAnswer: "A 9-inch (230 mm) wall of 230 × 115 × 75 mm red brick takes about 94 bricks per m², or 8.7 per sq ft. The 190 × 90 × 90 mm modular brick takes 100 per m² (9.3 per sq ft) in its one-brick wall. A half-brick wall takes about half. Add 5–10% for wastage.",
    faq: [
      { question: "How many bricks are needed per sq ft of 9-inch wall?", answer: "A 9-inch (230 mm) wall of the common 230 × 115 × 75 mm red brick takes about 94 bricks per m² of wall, which is about 8.74 per sq ft, with 10 mm joints. A one-brick wall of the 190 × 90 × 90 mm modular brick is 190 mm thick, not 230, and takes 100 per m², or 9.29 per sq ft (IS 1077:1992)." },
      { question: "How many bricks per sq ft of 4.5-inch wall?", answer: "About 4.55 per sq ft (49 per m²) of red brick. A half-brick wall of modular brick takes 4.65 per sq ft (50 per m²)." },
      { question: "How many bricks are in 1,000 sq ft of 9-inch wall?", answer: "About 8,740 red bricks before wastage, and roughly 9,180 to 9,620 once 5–10% is added. The same area of 4.5-inch red brick wall needs about 4,550 before wastage." },
      { question: "How do I convert between m² and sq ft?", answer: "1 m² is about 10.764 sq ft. Divide bricks per m² by 10.764 to get bricks per sq ft." },
      { question: "Do doors and windows reduce the brick count?", answer: "Yes. Bricks are laid only in the solid wall, so deduct each opening's area first. A standard door is about 1.9 m² and a window about 1.44 m²." },
      { question: "How many AAC blocks per m²?", answer: "A 200 mm AAC block takes about 8.33 blocks per m², which is about 0.77 per sq ft of wall." },
    ],
    relatedSlugs: ["how-to-check-contractor-quote", "verify-contractor-quote-is-456-2000", "per-sqft-pricing-contractor-fraud"],
    content: `## Bricks per sq ft of wall

The count per square metre of wall depends on the size of the brick and on the thickness of the wall. With a 10 mm mortar joint, each brick takes up its size plus 10 mm in each direction, so the bricks in one square metre of wall face are (wall thickness + 10 mm) divided by the volume of one brick with its joints.

Two sizes are common. The modular clay brick of 190 × 90 × 90 mm is a nominal 200 × 100 × 100 mm unit (IS 1077:1992, IS 2212:1991). The common field brick in much of India is 230 × 115 × 75 mm. They give different counts, and different wall thicknesses:

| Brick | Wall | Thickness | Bricks per m² | Bricks per sq ft | For 1,000 sq ft of wall |
|---|---|---|---|---|---|
| Red, 230 × 115 × 75 mm | one brick (9-inch) | 230 mm | 94 | 8.74 | about 8,740 |
| Red, 230 × 115 × 75 mm | half brick (4.5-inch) | 115 mm | 49 | 4.55 | about 4,550 |
| Modular, 190 × 90 × 90 mm | one brick | 190 mm | 100 | 9.29 | about 9,290 |
| Modular, 190 × 90 × 90 mm | half brick | 90 mm | 50 | 4.65 | about 4,645 |

Since 1 m² is about 10.764 sq ft, divide the count per m² by 10.764 to get the count per sq ft of wall.

## Check your brick size

A one-brick wall of modular brick is 190 mm thick, not 230 mm, so the 100 per m² figure belongs to a thinner wall than a 9-inch one. If your drawings say 9 inches or 230 mm, the wall is built of the 230 mm brick. Measure a few bricks before you order, and check the wall thickness on the drawing.

## Add wastage

Allow 5–10% for breakage, cutting and site loss. On 1,000 sq ft of 9-inch red brick wall, 8,740 bricks becomes roughly **9,180 to 9,620** to order. On the same area of 4.5-inch wall, 4,550 becomes roughly 4,780 to 5,010.

## Wall area, not floor area

These counts are per sq ft of **wall**, which is length times height, not the floor area of the house. For a wall of 10 m by 3 m (30 m²) of red brick the count is 30 × 94 = 2,824 bricks for a 9-inch wall and about 1,470 for a 4.5-inch wall.

## Deduct the openings

Bricks are laid only in the solid part of the wall. Subtract each door and window from the wall area first: a standard door is about 1.9 m², a window about 1.44 m². Deducting a 1.9 m² door from the 30 m² wall leaves 28.1 m² and about 2,645 red bricks before wastage.

## Blocks instead of bricks

A 200 mm AAC block takes about 8.33 blocks per m², roughly 0.77 per sq ft of wall. The block count is lower, but the blocks are bigger and the mortar or adhesive differs, so compare the whole wall rather than the block count alone.

## Do the calculation yourself

The free [Brick Calculator](/tools/brick-calculator) takes the wall length and height, the brick size, the thickness and the openings, and returns the count with 5% and 10% wastage. To cross-check a mason's or contractor's number, follow [how to check a contractor's quote](/blog/how-to-check-contractor-quote). For the whole house, including mortar and plaster worked out from your rooms, see [MasonryPro](/tools/masonpro). The [glossary](/glossary) explains modular brick and wastage.`,
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
