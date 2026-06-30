const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nirmanshastra.in'

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>NirmanShastra</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F0;font-family:'IBM Plex Sans',Arial,sans-serif;color:#1E2227;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F0;padding:32px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #1E2227;max-width:600px;width:100%;">
      <!-- Header -->
      <tr>
        <td style="background:#1E2227;padding:20px 32px;">
          <span style="font-family:'IBM Plex Sans',Arial,sans-serif;font-size:18px;font-weight:600;color:#F4F4F0;letter-spacing:0.04em;">NIRMANSHASTRA</span>
          <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#8a8f96;margin-left:12px;">BUILD WITH CERTAINTY</span>
        </td>
      </tr>
      <!-- Body -->
      <tr><td style="padding:32px;">${body}</td></tr>
      <!-- Footer -->
      <tr>
        <td style="border-top:1px solid #e0dfd8;padding:20px 32px;background:#F4F4F0;">
          <p style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#6b7280;margin:0 0 4px;">NirmanShastra · India's IS-code construction cost platform</p>
          <p style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#6b7280;margin:0;">You received this because you registered on NirmanShastra.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

function ctaButton(label: string, href: string, colour = '#8C3A22'): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:${colour};color:#ffffff;font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;font-weight:600;text-decoration:none;border:1px solid ${colour};">${label}</a>`
}

function h2(text: string): string {
  return `<h2 style="font-family:'IBM Plex Sans',Arial,sans-serif;font-size:22px;font-weight:600;color:#1E2227;margin:0 0 16px;">${text}</h2>`
}

function p(text: string): string {
  return `<p style="font-family:'IBM Plex Sans',Arial,sans-serif;font-size:15px;line-height:1.6;color:#1E2227;margin:0 0 12px;">${text}</p>`
}

function ul(items: string[]): string {
  const lis = items
    .map((i) => `<li style="font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;line-height:1.7;color:#1E2227;">${i}</li>`)
    .join('')
  return `<ul style="margin:12px 0 16px;padding-left:20px;">${lis}</ul>`
}

function mono(text: string): string {
  return `<span style="font-family:'IBM Plex Mono',monospace;">${text}</span>`
}

// ---------------------------------------------------------------------------
// Sequence type → sequence_type values match what is stored in DB (lowercase)
// ---------------------------------------------------------------------------

type EmailContent = { subject: string; html: string }

export function getEmailContent(
  sequenceType: string,
  dayNumber: number,
  contactName: string
): EmailContent | null {
  const firstName = contactName.split(' ')[0] ?? contactName

  switch (sequenceType) {
    // -----------------------------------------------------------------------
    case 'vastupro': {
      if (dayNumber === 0) {
        return {
          subject: 'Your VastuPro Report + What to Do Next | NirmanShastra',
          html: wrap(`
            ${h2(`Your VastuPro Report is Ready, ${firstName}`)}
            ${p('Thank you for using NirmanShastra VastuPro. Your free Vastu compliance report has been generated and is available for download.')}
            ${p('Your report includes:')}
            ${ul(['16-zone Vastu Mandala analysis', 'Room-by-room compliance scores', 'Technical and actionable remedies', 'General Vastu guidelines for your home'])}
            ${p(`<b>Now that your Vastu layout is mapped</b>, the next critical step is understanding exactly what your RCC structure will cost — before your contractor gives you a quote.`)}
            ${p(`${mono('Phase 1 → RCC Structure')}: StructurePro gives you IS-code-verified material quantities and a contractor comparison report for <b>₹499</b>.`)}
            ${ctaButton('Estimate My Structure Cost → StructurePro ₹499', `${BASE_URL}/structopro`)}
          `),
        }
      }
      if (dayNumber === 7) {
        return {
          subject: '7 Things Your Contractor May Not Tell You | NirmanShastra',
          html: wrap(`
            ${h2(`Contractor Tips for ${firstName}`)}
            ${p('You registered on NirmanShastra a week ago. Here are 7 things contractors frequently omit or misrepresent in residential construction quotes:')}
            ${ul([
              `${mono('Concrete grade:')} Contractors often use M15 where IS 456:2000 mandates M20 minimum for mild exposure. Ask for grade confirmation in writing.`,
              `${mono('Steel grade:')} Fe415 is cheaper but Fe500 is the standard for G+1 to G+3. Seismic Zones III–V require Fe500D.`,
              `${mono('Cover blocks:')} 20mm for slabs, 40mm for columns. Skipped often. Leads to corrosion within 10 years.`,
              `${mono('Curing:')} IS 456:2000 requires 14-day wet curing for OPC concrete. Many contractors stop at 3–5 days.`,
              `${mono('Binding wire:')} 10kg per tonne of steel. Missing from most quotes.`,
              `${mono('Formwork:')} Labour for shuttering and de-shuttering often not itemised — check if included.`,
              `${mono('Vibration:')} Mechanical vibrator use is mandatory per IS 456. Hand-rodding is not acceptable for structural concrete.`,
            ])}
            ${p('StructurePro gives you exact IS-code quantities so you can verify every line of your contractor\'s quote.')}
            ${ctaButton('Get My Structure Estimate → ₹499', `${BASE_URL}/structopro`)}
          `),
        }
      }
      if (dayNumber === 45) {
        return {
          subject: 'Phase Timing: When Masonry Work Should Begin | NirmanShastra',
          html: wrap(`
            ${h2(`Phase 1 → Phase 2 Timing for ${firstName}`)}
            ${p('If your RCC structure is underway or complete, here is an important IS-code timing note many homeowners miss:')}
            ${p(`<b>Masonry work (brickwork) should begin 60–90 days after the RCC pour</b> — not 21 days. This is because:`)}
            ${ul([
              `IS 456:2000 mandates 14-day minimum wet curing after pour`,
              `Formwork (shuttering) removal adds another 7–14 days depending on member type`,
              `Structural drying and stabilisation before brick-laying: 4–6 weeks`,
              `Starting masonry too early causes cracks at RCC-brick junctions`,
            ])}
            ${p(`If your contractor is proposing to start masonry in 3 weeks, ask for the IS code basis. The correct window is ${mono('60–90 days')}.`)}
            ${p('When Phase 2 begins, use MasonryPro to verify brick counts, mortar ratios, and plastering quantities before your contractor starts.')}
            ${ctaButton('Estimate Masonry Cost → MasonryPro ₹499', `${BASE_URL}/masonpro`)}
          `),
        }
      }
      if (dayNumber === 75) {
        return {
          subject: 'Phases 3 & 4 Coming Up: Electrical + Plumbing | NirmanShastra',
          html: wrap(`
            ${h2(`Electrical & Plumbing Phases for ${firstName}`)}
            ${p('Your construction project is progressing. Electrical and plumbing rough-in work typically begins during or just after masonry completion.')}
            ${p('<b>Phase 3 — Electrical</b> (8–12% of total project cost):')}
            ${ul([
              'IS 732:2019 mandates circuit-wise load calculations before wiring',
              '1.5 sqmm minimum for lighting; 2.5 sqmm for power sockets; 4.0 sqmm for AC/Geyser',
              'RCCB 30mA mandatory for all bathroom circuits',
              'ElectricalPro gives you a DB panel schedule and wire schedule to verify against contractor quote',
            ])}
            ${p('<b>Phase 4 — Plumbing</b> (6–10% of total project cost):')}
            ${ul([
              'IS 1172:1993: 135 LPCD for municipal supply; tank size = daily demand × 0.67',
              '110mm SWR for soil stacks; 75mm for waste pipes',
              'PlumbingPro generates a pipe schedule and fixture count — verify against your plumber\'s quote',
            ])}
            ${ctaButton('Estimate Electrical → ElectricalPro ₹499', `${BASE_URL}/electropro`)}
            ${ctaButton('Estimate Plumbing → PlumbingPro ₹499', `${BASE_URL}/plumbpro`)}
          `),
        }
      }
      if (dayNumber === 120) {
        return {
          subject: 'Complete Your Home with Interior Estimate + Bundle Offer | NirmanShastra',
          html: wrap(`
            ${h2(`Interior Phase + Bundle Offer, ${firstName}`)}
            ${p('Four months into your project journey — Phase 5 Interior is typically where the biggest surprises in contractor quotes appear.')}
            ${p('<b>Phase 5 — Interior</b> (12–18% of total project cost):')}
            ${ul([
              'Grade multipliers: Basic 1.0× | Standard 1.6× | Premium 2.4× | Luxury 3.5×',
              'Kitchen running-foot rates vary ₹1,200–₹7,500 per rft across grades',
              'Flooring: ₹65–₹650 per sqft depending on grade',
              'InteriorPro gives you a complete BOQ with grade comparison across all interior items',
            ])}
            ${p(`<b>Bundle offer:</b> Get all 5 paid reports (StructurePro + MasonryPro + ElectricalPro + PlumbingPro + InteriorPro) for ${mono('₹1,999')} — saving ₹496 vs buying individually.`)}
            ${ctaButton('Estimate Interiors → InteriorPro ₹499', `${BASE_URL}/interiorpro`)}
            ${ctaButton('Get All 5 Reports → Bundle ₹1,999', `${BASE_URL}/#pricing`, '#1F4E79')}
          `),
        }
      }
      return null
    }

    // -----------------------------------------------------------------------
    case 'structopro': {
      if (dayNumber === 0) {
        return {
          subject: 'Your StructurePro Report + MasonryPro Is Next | NirmanShastra',
          html: wrap(`
            ${h2(`Your StructurePro Report is Ready, ${firstName}`)}
            ${p('Your Phase 1 RCC Structure estimate has been generated. It includes IS-code-verified material quantities, a contractor comparison, and full BOQ across foundation and superstructure.')}
            ${p('Your report covers:')}
            ${ul(['Foundation BOQ (excavation, PCC, steel, concrete, formwork)', 'Superstructure BOQ per floor per member', 'Material purchase schedule (cement bags, steel by diameter, aggregate, sand)', 'Cost summary in Basic / Standard / Premium bands'])}
            ${p(`<b>Next: Phase 2 — Masonry</b>. Brickwork begins 60–90 days after your RCC pour per IS 456:2000. MasonryPro gives you IS-code-verified brick counts, mortar ratios, and plastering quantities so you can verify your mason's quote line by line.`)}
            ${ctaButton('Estimate Masonry → MasonryPro ₹499', `${BASE_URL}/masonpro`)}
          `),
        }
      }
      if (dayNumber === 7) {
        return {
          subject: 'Contractor Tips: 6 Things to Check on Your Structure Quote | NirmanShastra',
          html: wrap(`
            ${h2(`6 Structure Quote Checks, ${firstName}`)}
            ${p('Your StructurePro report has the IS-code quantities. Here are the 6 most common ways contractors inflate or omit in RCC structure quotes:')}
            ${ul([
              `${mono('Concrete grade substitution:')} M15 quoted instead of IS 456:2000 minimum M20. Each grade step saves contractor ~15% on cement.`,
              `${mono('Steel weight manipulation:')} Short-weight bars (actual 9.8kg where 10kg claimed) are common in unorganised supply chains. Ask for mill test certificates.`,
              `${mono('Binding wire exclusion:')} 10kg binding wire per tonne of steel is a real cost. Often excluded from quotes.`,
              `${mono('Cover block omission:')} Plastic/cement cover blocks are small cost items but critical for durability. Confirm they are included.`,
              `${mono('Curing cost exclusion:')} 14-day curing requires a dedicated water person. Often not included in labour quotes.`,
              `${mono('Formwork type:')} Wooden formwork vs steel shuttering has different costs and reuse counts. Confirm which is quoted.`,
            ])}
            ${p('Your StructurePro report has the exact IS-code quantities. Use it as your verification checklist when reviewing contractor quotes.')}
            ${ctaButton('Estimate Masonry → MasonryPro ₹499', `${BASE_URL}/masonpro`)}
          `),
        }
      }
      if (dayNumber === 45) {
        return {
          subject: 'Masonry Phase Timing: IS 456 says 60–90 Days | NirmanShastra',
          html: wrap(`
            ${h2(`Masonry Can Begin Soon, ${firstName}`)}
            ${p('Your RCC structure is likely curing now. As per IS 456:2000 + IS 2212:1991 sequencing, masonry (brickwork) should begin <b>60–90 days after the RCC pour</b>:')}
            ${ul([
              '14-day minimum wet curing (IS 456:2000)',
              '7–28 days for formwork removal depending on member (slabs last)',
              '4–6 weeks structural stabilisation before brick-laying begins',
            ])}
            ${p(`<b>If your contractor is proposing to start in 2–4 weeks, this is within range if your pour completed 30–60 days ago.</b> The critical check is that all slab formwork has been struck.`)}
            ${p('Before your mason gives you a quote, use MasonryPro to generate your IS-code brick count, mortar schedule, and plaster BOQ.')}
            ${ctaButton('Estimate Masonry → MasonryPro ₹499', `${BASE_URL}/masonpro`)}
          `),
        }
      }
      if (dayNumber === 75) {
        return {
          subject: 'Phases 3 & 4 Are Coming: Electrical + Plumbing Estimates | NirmanShastra',
          html: wrap(`
            ${h2(`Electrical & Plumbing Are Next, ${firstName}`)}
            ${p('As masonry wraps up, electrical rough-in and plumbing rough-in typically run in parallel. Both phases involve concealed work — mistakes are expensive to fix after plastering.')}
            ${p('<b>Electrical rough-in (Phase 3):</b> Conduit laying, DB box mounting, wire pulling — done before plastering. ElectricalPro generates your IS 732:2019-based wire schedule and DB panel configuration.')}
            ${p('<b>Plumbing rough-in (Phase 4):</b> Supply piping, drainage slopes, soil stack installation — done before screed. PlumbingPro generates your IS 1172:1993-based pipe schedule and fixture count.')}
            ${ctaButton('Estimate Electrical → ElectricalPro ₹499', `${BASE_URL}/electropro`)}
            ${ctaButton('Estimate Plumbing → PlumbingPro ₹499', `${BASE_URL}/plumbpro`)}
          `),
        }
      }
      if (dayNumber === 120) {
        return {
          subject: 'Phase 5 Interior + Complete Bundle Offer | NirmanShastra',
          html: wrap(`
            ${h2(`Interior Estimate + Bundle, ${firstName}`)}
            ${p('Your structure, masonry, electrical, and plumbing phases are likely complete or nearing completion. Phase 5 Interior is where final costs land.')}
            ${p(`<b>InteriorPro</b> covers kitchen, flooring, false ceiling, paint, doors, and tiles — with a complete BOQ at your selected grade (Basic to Luxury).`)}
            ${p(`<b>Bundle offer:</b> All 5 paid reports for ${mono('₹1,999')} — saves ₹496 versus buying individually. If you have already purchased StructurePro, your remaining bundle price is reduced automatically.`)}
            ${ctaButton('Estimate Interiors → InteriorPro ₹499', `${BASE_URL}/interiorpro`)}
            ${ctaButton('Complete Bundle → ₹1,999', `${BASE_URL}/#pricing`, '#1F4E79')}
          `),
        }
      }
      return null
    }

    // -----------------------------------------------------------------------
    case 'masonpro': {
      if (dayNumber === 0) {
        return {
          subject: 'Your MasonryPro Report + Electrical Phase Next | NirmanShastra',
          html: wrap(`
            ${h2(`Your MasonryPro Report is Ready, ${firstName}`)}
            ${p('Your Phase 2 Masonry estimate is ready with IS-code-verified quantities for brickwork, plastering, and waterproofing.')}
            ${p('Your report includes:')}
            ${ul(['Wall BOQ with brick counts, mortar bags, and cement', 'Plastering BOQ per room (internal 12mm 1:4, external 15mm 1:4, ceiling 6mm 1:3)', 'Waterproofing BOQ for terrace and bathrooms', '8 wall type cost comparison at your city rates'])}
            ${p('<b>Next: Phase 3 — Electrical rough-in</b>. This runs parallel to or just after plastering. ElectricalPro gives you a DB panel schedule and IS 732:2019-compliant wire schedule to verify your electrician\'s quote.')}
            ${ctaButton('Estimate Electrical → ElectricalPro ₹499', `${BASE_URL}/electropro`)}
          `),
        }
      }
      if (dayNumber === 7) {
        return {
          subject: 'IS 2212 Masonry Curing Checklist | NirmanShastra',
          html: wrap(`
            ${h2(`Masonry Curing Checklist, ${firstName}`)}
            ${p('Your masonry work is likely underway. Here is the IS 2212:1991 site practice checklist — these are the points most commonly skipped by masons:')}
            ${ul([
              `${mono('Brick soaking:')} Bricks must be soaked minimum 2 hours before laying. Dry bricks absorb water from mortar, weakening the joint.`,
              `${mono('Frog face up:')} The frog (indent) in the brick must always face upward so mortar fills it completely.`,
              `${mono('Mortar joint:')} 10mm bed joint + 10mm perpendicular joint. Excess mortar does not add strength.`,
              `${mono('Bond pattern:')} English bond for 9" (230mm) walls; stretcher bond for 4.5" (115mm) walls. Mixed bonds weaken the wall.`,
              `${mono('Curing:')} Minimum 7 days with wet gunny bags. Dry-brick walls crack at joints. Budget a dedicated curing person.`,
              `${mono('Plaster timing:')} Minimum 14 days after brickwork before external plaster. 21 days preferred.`,
              `${mono('Chicken mesh:')} Mandatory at every RCC-brick junction before plastering. Prevents cracking at interface.`,
            ])}
            ${p('Your MasonryPro report includes the IS 2212:1991 masonry practice checklist for your contractor.')}
            ${ctaButton('Estimate Electrical → ElectricalPro ₹499', `${BASE_URL}/electropro`)}
          `),
        }
      }
      if (dayNumber === 45) {
        return {
          subject: 'Electrical Rough-In Timing: Before or During Plastering | NirmanShastra',
          html: wrap(`
            ${h2(`Electrical Timing Note, ${firstName}`)}
            ${p('A common mistake in residential construction: starting electrical work after plastering is complete. This forces wall chasing (cutting channels in plaster) — expensive and messy.')}
            ${p('<b>Correct sequence:</b>')}
            ${ul([
              'Masonry + waterproofing: complete',
              'Electrical conduit laying + DB box mounting: BEFORE plastering',
              'Plastering: after conduits are set',
              'Wire pulling: after plastering is dry (7–14 days)',
              'DB panel installation + testing: after wire pulling',
            ])}
            ${p('If your masonry is now nearing completion, this is exactly the right time to plan electrical rough-in. ElectricalPro generates a circuit-wise load calculation, DB schedule, and wire schedule per IS 732:2019.')}
            ${ctaButton('Estimate Electrical → ElectricalPro ₹499', `${BASE_URL}/electropro`)}
          `),
        }
      }
      if (dayNumber === 75) {
        return {
          subject: 'Phase 4 — Plumbing Estimate Before Screed | NirmanShastra',
          html: wrap(`
            ${h2(`Plumbing Phase Coming Up, ${firstName}`)}
            ${p('Plumbing rough-in (supply piping + drainage) must be complete before floor screed is laid. This is a common sequencing error that causes expensive rework.')}
            ${p('<b>IS 1172:1993 requirements to verify with your plumber:</b>')}
            ${ul([
              `Daily water demand: ${mono('135 LPCD')} municipal supply per person`,
              `Tank size = daily demand × 0.67 (IS 1172 formula)`,
              `Soil stack minimum: ${mono('110mm SWR')} for WC`,
              `Waste pipe minimum: ${mono('75mm SWR')} for bath + kitchen`,
              `Minimum slope: 1:48 (2%) for 75mm pipes; 1:80 (1.25%) for 110mm`,
            ])}
            ${p('PlumbingPro generates your pipe schedule, fixture count, tank sizing, and pump HP — so you can verify against your plumber\'s quote line by line.')}
            ${ctaButton('Estimate Plumbing → PlumbingPro ₹499', `${BASE_URL}/plumbpro`)}
          `),
        }
      }
      if (dayNumber === 120) {
        return {
          subject: 'Interior Phase + All-5 Bundle Offer | NirmanShastra',
          html: wrap(`
            ${h2(`Interior Estimate + Bundle, ${firstName}`)}
            ${p(`Your project is in the final stretch — interior work is typically the most visible phase and where grade decisions have the largest cost impact.`)}
            ${p(`${mono('Grade multipliers:')} Basic 1.0× | Standard 1.6× | Premium 2.4× | Luxury 3.5×`)}
            ${p('InteriorPro generates a complete BOQ across flooring, kitchen, false ceiling, paint, doors, and tiles at your selected grade — with a contractor comparison after unlock.')}
            ${p(`<b>Bundle:</b> All 5 paid reports for ${mono('₹1,999')} — saving ₹496 versus individual purchase.`)}
            ${ctaButton('Estimate Interiors → InteriorPro ₹499', `${BASE_URL}/interiorpro`)}
            ${ctaButton('Complete Bundle → ₹1,999', `${BASE_URL}/#pricing`, '#1F4E79')}
          `),
        }
      }
      return null
    }

    // -----------------------------------------------------------------------
    case 'electropro': {
      if (dayNumber === 0) {
        return {
          subject: 'Your ElectricalPro Report + Plumbing Phase Next | NirmanShastra',
          html: wrap(`
            ${h2(`Your ElectricalPro Report is Ready, ${firstName}`)}
            ${p('Your Phase 3 Electrical estimate is ready with IS 732:2019-compliant circuit load calculations, DB panel schedule, and wire schedule.')}
            ${p('Your report includes:')}
            ${ul(['Circuit-wise load analysis (lighting, power, AC, geyser circuits)', 'DB panel schedule with MCB ratings and number of ways', 'Wire schedule per room per circuit (sizes per IS 732:2019)', 'Testing and commissioning checklist'])}
            ${p('<b>Next: Phase 4 — Plumbing</b>. Plumbing rough-in runs parallel with or just after electrical. PlumbingPro gives you IS 1172:1993-based pipe schedule, tank sizing, and fixture count — so you can verify your plumber\'s quote.')}
            ${ctaButton('Estimate Plumbing → PlumbingPro ₹499', `${BASE_URL}/plumbpro`)}
          `),
        }
      }
      if (dayNumber === 7) {
        return {
          subject: 'IS 732 Electrical Safety: 5 Things to Verify on Site | NirmanShastra',
          html: wrap(`
            ${h2(`IS 732 Safety Checklist, ${firstName}`)}
            ${p('Your electrical work is underway. Here are 5 IS 732:2019 safety requirements most homeowners don\'t know to check:')}
            ${ul([
              `${mono('Licence verification:')} Your electrician must hold a valid Class B licence issued by the state electrical licensing board. Unlicensed electrical work voids home insurance and is illegal.`,
              `${mono('RCCB mandatory:')} IS 732:2019 requires a 30mA RCCB on all bathroom and kitchen circuits. This is non-negotiable.`,
              `${mono('Wire sizes:')} Confirm the actual gauge being pulled matches your ElectricalPro report. Undersized wires for power circuits are the #1 cause of residential fires.`,
              `${mono('Earth continuity:')} IS 3043:2018 requires earthing resistance <1 ohm. Ask for a test certificate after installation.`,
              `${mono('Circuit labelling:')} Every MCB in the DB panel must be labelled. This is required for maintenance and emergency response.`,
            ])}
            ${p('Your ElectricalPro report includes the DB panel schedule with circuit-wise MCB ratings. Use it to verify the panel as installed.')}
            ${ctaButton('Estimate Plumbing → PlumbingPro ₹499', `${BASE_URL}/plumbpro`)}
          `),
        }
      }
      if (dayNumber === 45) {
        return {
          subject: 'Electrical + Plumbing Coordination: What Must Happen Together | NirmanShastra',
          html: wrap(`
            ${h2(`Phase 3 + Phase 4 Coordination, ${firstName}`)}
            ${p('Electrical and plumbing phases have several coordination points that are easy to miss — and expensive to fix after walls are plastered:')}
            ${ul([
              `${mono('Geyser circuits + plumbing hot water:')} The geyser location must be agreed between electrician and plumber before conduit routing — the 4sqmm circuit and hot water pipe must converge at the same point.`,
              `${mono('Bathroom wet areas:')} RCCB protection zones must match plumbing wet areas. Coordinate with plumber on exact wet-zone boundaries.`,
              `${mono('Kitchen:')} Water purifier, dishwasher (if applicable), and chimney points — all need 2.5sqmm power points within specific distances from the plumbing outlet.`,
              `${mono('Pump + motor wiring:')} The submersible pump or pressure pump wiring (typically 4–6sqmm) must be routed before plumbing pump installation.`,
            ])}
            ${p('If your plumbing rough-in has not yet been estimated, do it now before finalising electrical point locations.')}
            ${ctaButton('Estimate Plumbing → PlumbingPro ₹499', `${BASE_URL}/plumbpro`)}
            ${ctaButton('Estimate Interiors → InteriorPro ₹499', `${BASE_URL}/interiorpro`)}
          `),
        }
      }
      if (dayNumber === 75) {
        return {
          subject: 'Phase 5 Interior — Estimate Before Contractors Quote | NirmanShastra',
          html: wrap(`
            ${h2(`Interior Phase Starting Soon, ${firstName}`)}
            ${p('With electrical and plumbing complete, interior work is next. This is where grade selection has the biggest impact on final cost.')}
            ${p('<b>What InteriorPro estimates:</b>')}
            ${ul([
              'Kitchen cabinetry (running-foot rate × grade)',
              'Flooring (sqft × grade rate + 10% wastage)',
              'False ceiling (sqft × grade rate)',
              'Paint (0.18L/sqft BUA, 40-50sqft coverage per litre)',
              'Doors and tiles with itemised BOQ',
            ])}
            ${p(`${mono('Grade multipliers:')} Basic 1.0× | Standard 1.6× | Premium 2.4× | Luxury 3.5×. The full comparison table is free — quantities unlock at ₹499.`)}
            ${ctaButton('Estimate Interiors → InteriorPro ₹499', `${BASE_URL}/interiorpro`)}
          `),
        }
      }
      if (dayNumber === 120) {
        return {
          subject: 'Complete Your Project with Bundle ₹1,999 | NirmanShastra',
          html: wrap(`
            ${h2(`Bundle Offer for ${firstName}`)}
            ${p('Your project is in the final phases. If you haven\'t already estimated masonry, plumbing, or interior costs, the complete bundle gives you all 5 IS-code reports at the best price.')}
            ${p(`<b>All 5 paid reports</b> (StructurePro + MasonryPro + ElectricalPro + PlumbingPro + InteriorPro) for ${mono('₹1,999')} — saving ₹496 versus buying individually at ₹499 each.`)}
            ${p('Each report includes: IS-code material quantities, contractor comparison, phase-specific BOQ, and IS compliance panel.')}
            ${ctaButton('Get All 5 Reports → Bundle ₹1,999', `${BASE_URL}/#pricing`)}
          `),
        }
      }
      return null
    }

    // -----------------------------------------------------------------------
    case 'plumbpro': {
      if (dayNumber === 0) {
        return {
          subject: 'Your PlumbingPro Report + Interior Phase Next | NirmanShastra',
          html: wrap(`
            ${h2(`Your PlumbingPro Report is Ready, ${firstName}`)}
            ${p('Your Phase 4 Plumbing estimate is ready with IS 1172:1993-verified pipe schedule, tank sizing, pump HP, and fixture count.')}
            ${p('Your report includes:')}
            ${ul(['Water demand calculation (LPCD × occupants = daily demand)', 'Tank size and pump HP as per IS 1172', 'Cold water supply riser diagram', 'Drainage layout with IS slope requirements', 'Complete pipe + fixture schedule'])}
            ${p('<b>Next: Phase 5 — Interior</b>. This is the final phase and often the one with the widest variance in contractor quotes. InteriorPro gives you a complete BOQ with grade comparison (Basic to Luxury) so you approach your interior contractor with verified quantities.')}
            ${ctaButton('Estimate Interiors → InteriorPro ₹499', `${BASE_URL}/interiorpro`)}
          `),
        }
      }
      if (dayNumber === 7) {
        return {
          subject: 'IS 1172 Tank & Pump Maintenance Checklist | NirmanShastra',
          html: wrap(`
            ${h2(`Plumbing Maintenance Checklist, ${firstName}`)}
            ${p('Your plumbing is being installed. Here are the IS 1172:1993 requirements for tank and pump maintenance that most homeowners are not told about at handover:')}
            ${ul([
              `${mono('Tank cleaning:')} Underground sump and overhead tanks must be cleaned every 6 months. The tank access port must be large enough for a person to enter — minimum 600mm × 600mm per IS 1172.`,
              `${mono('Overflow pipe:')} Tank overflow must discharge visibly (not into the drain inside the wall). This is how you detect a float valve failure before a flood.`,
              `${mono('Tank material:')} RCC sump requires bituminous waterproofing inside. HDPE/Sintex overhead tanks do not require this.`,
              `${mono('Pump motor:')} If a submersible pump is used, a dry-run protection float switch is mandatory. Without it, the pump burns out when the sump runs dry.`,
              `${mono('Water meter:')} Install a water meter on the supply line from OHT to building. This lets you detect pipe leaks early (sudden meter reading without usage).`,
            ])}
            ${p('Your PlumbingPro report includes tank sizing calculations per IS 1172 and pump HP recommendations for your daily demand.')}
            ${ctaButton('Estimate Interiors → InteriorPro ₹499', `${BASE_URL}/interiorpro`)}
          `),
        }
      }
      if (dayNumber === 45) {
        return {
          subject: 'Fit-Out Timing: When Interior Work Can Begin | NirmanShastra',
          html: wrap(`
            ${h2(`Interior Fit-Out Timing, ${firstName}`)}
            ${p('With plumbing rough-in complete and plastering done, interior fit-out (Phase 5) can begin. Here is the correct sequence to share with your interior contractor:')}
            ${ul([
              `${mono('Step 1:')} Floor screed / IPS / waterproofing for wet areas — complete before tiling`,
              `${mono('Step 2:')} Tile fixing (wall first, then floor) — allow 3 days curing before grouting`,
              `${mono('Step 3:')} False ceiling frame fixing (before wall paint)`,
              `${mono('Step 4:')} Electrical fixture rough-in (fan point, light points, AC bracket) — coordinate with electrician`,
              `${mono('Step 5:')} Paint — primer + 2 coats wall, ceiling paint separate`,
              `${mono('Step 6:')} Kitchen cabinet installation + countertop`,
              `${mono('Step 7:')} Plumbing fixtures (taps, showers, WCs) — last, after tiles and paint`,
              `${mono('Step 8:')} Electrical fixtures (switches, fans, lights) — very last, after paint`,
            ])}
            ${p('InteriorPro estimates the cost for all of the above with IS-code quantities and grade comparison.')}
            ${ctaButton('Estimate Interiors → InteriorPro ₹499', `${BASE_URL}/interiorpro`)}
          `),
        }
      }
      if (dayNumber === 75) {
        return {
          subject: 'Complete All 5 Phases with Bundle ₹1,999 | NirmanShastra',
          html: wrap(`
            ${h2(`Bundle Offer, ${firstName}`)}
            ${p('All structural and MEP phases are complete or winding down. If you need estimates for any remaining phases, the bundle is the most economical option.')}
            ${p(`<b>All 5 paid reports</b> for ${mono('₹1,999')} — saving ₹496. Includes StructurePro, MasonryPro, ElectricalPro, PlumbingPro, and InteriorPro.`)}
            ${p('Already purchased PlumbingPro? Your remaining bundle price is reduced. See the pricing page for your loyalty discount.')}
            ${ctaButton('Get Bundle → ₹1,999', `${BASE_URL}/#pricing`)}
            ${ctaButton('Estimate Interiors → InteriorPro ₹499', `${BASE_URL}/interiorpro`)}
          `),
        }
      }
      if (dayNumber === 120) {
        return {
          subject: 'Bundle Upgrade Offer — Save ₹496 | NirmanShastra',
          html: wrap(`
            ${h2(`Bundle Upgrade for ${firstName}`)}
            ${p('You have been on NirmanShastra for four months. If your project spans multiple phases and you need reports for phases you haven\'t estimated yet, this is the right time.')}
            ${p(`<b>Complete bundle:</b> All 5 paid reports for ${mono('₹1,999')}. Your existing PlumbingPro purchase counts toward the bundle price.`)}
            ${p('The bundle also unlocks the Grand Total Report (₹999 separately, FREE with all 5) — a 15-page integrated cost report across all phases with a phase timeline and grand total breakdown.')}
            ${ctaButton('Upgrade to Bundle → ₹1,999', `${BASE_URL}/#pricing`)}
          `),
        }
      }
      return null
    }

    // -----------------------------------------------------------------------
    case 'interiorpro': {
      if (dayNumber === 0) {
        return {
          subject: 'Your InteriorPro Report + Bundle Offer | NirmanShastra',
          html: wrap(`
            ${h2(`Your InteriorPro Report is Ready, ${firstName}`)}
            ${p('Your Phase 5 Interior estimate is ready with grade-wise BOQ across all interior items.')}
            ${p('Your report includes:')}
            ${ul(['Complete interior BOQ (flooring, kitchen, false ceiling, paint, doors, tiles)', 'Grade comparison table across Basic / Standard / Premium / Luxury', 'Room-wise flooring and wall tile schedule', 'Kitchen elevation with running-foot calculation', 'IS code references for tile installation and gypsum plaster'])}
            ${p('<b>You have completed the final phase.</b> The Grand Total Report merges all 5 phases into one 15-page report — it is FREE if you purchase all 5 paid apps, or ₹999 standalone.')}
            ${p(`<b>Bundle offer:</b> All 5 paid reports for ${mono('₹1,999')} — saving ₹496. Includes Grand Total Report free.`)}
            ${ctaButton('Get Complete Bundle → ₹1,999', `${BASE_URL}/#pricing`)}
          `),
        }
      }
      if (dayNumber === 7) {
        return {
          subject: 'Interior Tips: 5 Things Contractors Overcharge On | NirmanShastra',
          html: wrap(`
            ${h2(`Interior Contractor Tips, ${firstName}`)}
            ${p('Interior is the phase with the widest variance in contractor quotes. Here are 5 items where overcharging is most common:')}
            ${ul([
              `${mono('Kitchen running feet:')} Measure the actual running footage yourself (total length of all cabinets at counter height). Contractors sometimes count both upper and lower as separate items — confirm what is included.`,
              `${mono('Tile wastage:')} IS standard wastage is 10%. Contractors sometimes quote 15–20%. With your InteriorPro report, you have the correct tile count.`,
              `${mono('Paint coverage:')} 40–50 sqft per litre (2 coats + primer). Standard coverage. If contractor quotes higher litres, check the wall area calculation.`,
              `${mono('False ceiling area:')} Measure net ceiling area (length × width of each room). Contractors sometimes include wall area in the sqft count.`,
              `${mono('Gypsum vs cement plaster:')} Gypsum plaster (IS 2547:1976) does not need water curing, is faster, and gives a better finish. If a contractor quotes cement plaster for internal walls and a higher rate, question it.`,
            ])}
            ${p('Your InteriorPro report has the correct quantities for all items above. Use it to verify before signing any interior contract.')}
            ${ctaButton('See Bundle Offer → ₹1,999', `${BASE_URL}/#pricing`)}
          `),
        }
      }
      if (dayNumber === 45) {
        return {
          subject: 'Interior Maintenance Schedule for Your New Home | NirmanShastra',
          html: wrap(`
            ${h2(`Home Maintenance Schedule, ${firstName}`)}
            ${p('Congratulations on reaching the final phase. Here is a practical maintenance schedule to protect your investment:')}
            ${ul([
              `${mono('Monthly:')} Check all tap washers, WC flush valves, and RCCB test buttons`,
              `${mono('Every 6 months:')} Clean overhead water tank, check plumbing pipe joints for seepage, test earthing continuity`,
              `${mono('Annually:')} Repaint exterior (or reapply waterproofing if membrane type), clean AC filters and service units, check roof waterproofing at outlets`,
              `${mono('Every 2 years:')} Professional electrical inspection, check for plaster cracks at RCC-brick junctions, verify terrace waterproofing`,
              `${mono('Every 5 years:')} External wall repaint, re-grout tile joints in bathrooms and kitchen, check structural member cracks`,
              `${mono('At first monsoon:')} Critical — check all terrace drains, parapet wall joints, and external window sills for water ingress`,
            ])}
            ${p('NirmanShastra is building a maintenance reminder tool. We will notify you when it is live.')}
            ${ctaButton('See All NirmanShastra Tools', `${BASE_URL}`)}
          `),
        }
      }
      if (dayNumber === 75) {
        return {
          subject: 'NirmanShastra Bundle: All 5 Reports for ₹1,999 | NirmanShastra',
          html: wrap(`
            ${h2(`Complete Your Project Documentation, ${firstName}`)}
            ${p('If you are planning to build additional rooms, a new floor, or renovate other parts of your property, all 5 IS-code reports are available as a bundle.')}
            ${p(`<b>Bundle:</b> StructurePro + MasonryPro + ElectricalPro + PlumbingPro + InteriorPro for ${mono('₹1,999')} + Grand Total Report FREE.`)}
            ${p('Your existing InteriorPro purchase reduces the bundle price. See the pricing page for your loyalty discount.')}
            ${ctaButton('See Bundle Pricing', `${BASE_URL}/#pricing`)}
          `),
        }
      }
      if (dayNumber === 120) {
        return {
          subject: 'Planning Anything New? Bundle Upgrade | NirmanShastra',
          html: wrap(`
            ${h2(`Bundle Upgrade, ${firstName}`)}
            ${p('Four months since your InteriorPro report. If you are planning any new construction — additional floor, extension, renovation — NirmanShastra\'s full suite is available at bundle pricing.')}
            ${p(`All 5 paid reports for ${mono('₹1,999')}. Your InteriorPro purchase is credited toward the bundle.`)}
            ${ctaButton('Upgrade to Bundle → ₹1,999', `${BASE_URL}/#pricing`)}
          `),
        }
      }
      return null
    }

    default:
      return null
  }
}
