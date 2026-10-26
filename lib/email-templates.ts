import { TOOL_PRICE_PAISE, type PaidAppType } from '@/lib/tool-pricing'
import { CONTACT_EMAIL } from './site-contact'

// Follow-up emails sent on days 0, 7, 45, 75 and 120 after a person registers for a tool.
// NirmanShastra works out QUANTITIES only. No email here states a price for materials, labour or a house, and none
// quotes a share of project cost. The only rupee figures are the report prices from lib/tool-pricing, so they cannot drift.

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.nirmanshastra.in'

const rupees = (k: PaidAppType) => `₹${(TOOL_PRICE_PAISE[k] / 100).toLocaleString('en-IN')}`

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
          <p style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#6b7280;margin:0 0 4px;">NirmanShastra · Material quantities for Indian homes, worked out to the Indian Standards</p>
          <p style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#6b7280;margin:0 0 4px;">You received this because you registered on NirmanShastra.</p>
          <p style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#6b7280;margin:0;">Questions, or to stop these emails: write to <a href="mailto:${CONTACT_EMAIL}" style="color:#6b7280;">${CONTACT_EMAIL}</a>.</p>
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

const STRUCT = `${BASE_URL}/tools/structopro`
const MASON = `${BASE_URL}/tools/masonpro`
const ELEC = `${BASE_URL}/tools/electropro`
const PLUMB = `${BASE_URL}/tools/plumbpro`
const INTERIOR = `${BASE_URL}/tools/interiorpro`
const GRAND = `${BASE_URL}/tools/grand-total`
const COMPARE = `${BASE_URL}/compare-quote`

const GRAND_LINE = `The Grand Total report (${rupees('grandtotal')}, an add-on) puts the phase reports you have already bought for one house into a single buying list, with the order in which each phase needs its material.`

type EmailContent = { subject: string; html: string }

const mail = (subject: string, heading: string, body: string): EmailContent => ({
  subject: `${subject} | NirmanShastra`,
  html: wrap(`${h2(heading)}${body}`),
})

// ---------------------------------------------------------------------------
// sequence_type values match what is stored in the DB (lowercase)
// ---------------------------------------------------------------------------

export function getEmailContent(sequenceType: string, dayNumber: number, contactName: string): EmailContent | null {
  // The name is optional on VastuPro, so a heading must read well without one: "Your Vastu check" or "Your Vastu check, Ramesh".
  const firstName = (contactName ?? '').trim().split(/\s+/)[0] ?? ''
  const who = firstName ? `, ${firstName}` : ''

  switch (sequenceType) {
    // -----------------------------------------------------------------------
    case 'vastupro': {
      if (dayNumber === 0) {
        return mail('Your VastuPro check, and what to look at next', `Your Vastu check${who}`, `
            ${p('Thank you for trying VastuPro. The free PDF of your findings was sent in a separate email, and it downloaded when you asked for it. It has:')}
            ${ul(['Your plan with the 16 zones turned to your North', 'Every door and room you marked, read against the old texts and today’s teachers, with where each rule comes from', 'A count of the findings by how the old texts and today’s teachers read them, with no overall mark out of 100', 'What could be done about each concern if the plan can still change'])}
            ${p('Vastu is a traditional system. It is not part of any BIS code and says nothing about the strength of the structure.')}
            ${p('Once the layout is settled, the next question is how much material the frame of the house will need. StructurePro answers that from a few plain questions about your plot and plan.')}
            ${p('The first look is free: your earthquake zone, the concrete and steel grades that apply, the IS-code checks and a 3D model of your frame. The full quantity report is paid.')}
            ${ctaButton('See your frame, free', STRUCT)}
          `)
      }
      if (dayNumber === 7) {
        return mail('Seven questions to ask before you sign a quote', `Questions to ask a contractor${who}`, `
            ${p('A quote that arrives as one number cannot be checked. These are the questions that make it checkable:')}
            ${ul([
              `${mono('Quantities:')} Can I have a line-item list with the unit, quantity and specification of every material?`,
              `${mono('Concrete grade:')} Which grade is each pour? IS 456 sets a minimum by exposure: M20 for mild and M25 for moderate.`,
              `${mono('Steel:')} Which grade and which bar diameters? Fe 500D (ductile) is the grade StructurePro assumes.`,
              `${mono('Cover:')} What cover is specified for columns, beams, slabs and footings, and how is it held in place?`,
              `${mono('Curing:')} How long, and who is responsible for it?`,
              `${mono('Drawings:')} Will the work follow a structural engineer's drawings and a bar bending schedule?`,
              `${mono('Exclusions:')} What is not in the quote?`,
            ])}
            ${p('StructurePro works out the quantities of your frame from your own plan, so you have something to put beside the answers.')}
            ${ctaButton('Work out my frame', STRUCT)}
          `)
      }
      if (dayNumber === 45) {
        return mail('Next phase: what the masonry will need', `Brickwork and plaster${who}`, `
            ${p('If your frame is done or underway, the walls are next. Bricks, mortar and plaster are the quantities people most often guess.')}
            ${p('MasonryPro works from your rooms: the wall lengths and heights, the openings, the wall material you choose and the plaster on each face. The report lists every assumption it made and what it leaves out.')}
            ${ctaButton(`Work out masonry, ${rupees('masonpro')}`, MASON)}
          `)
      }
      if (dayNumber === 75) {
        return mail('Next phases: wiring and pipes', `Wiring and plumbing${who}`, `
            ${p('Wiring and pipes are counted before they are buried in the walls and floors, which is the cheapest moment to catch a missing item.')}
            ${ul([
              `ElectricalPro counts points, wire by size, conduit and the protection devices for your plan (${rupees('electropro')}).`,
              `PlumbingPro counts pipe by size, fittings, fixtures and tank capacity for your plan and family size (${rupees('plumbpro')}).`,
            ])}
            ${ctaButton('ElectricalPro', ELEC)}
            ${ctaButton('PlumbingPro', PLUMB)}
          `)
      }
      if (dayNumber === 120) {
        return mail('Finishes: tiles, paint and ceilings', `The finishing phase${who}`, `
            ${p('Finishing quantities depend on room areas and on the specification you choose. InteriorPro counts flooring, wall tiles, paint, ceilings and the like from your rooms, so you can check a finishing quote line by line.')}
            ${p(GRAND_LINE)}
            ${ctaButton(`Work out finishes, ${rupees('interiorpro')}`, INTERIOR)}
          `)
      }
      return null
    }

    // -----------------------------------------------------------------------
    case 'structopro': {
      if (dayNumber === 0) {
        return mail('Your StructurePro report, and masonry next', `Your StructurePro report is ready${who}`, `
            ${p('Your report counts the RCC frame: footings, plinth beams, columns, beams, slabs, balconies, the staircase and the small RCC items such as lintels and sunshades. It has:')}
            ${ul([
              'Every quantity with its unit, as a low figure, a central figure and a high figure',
              'The IS clause behind each rule it applied',
              'The assumptions made on your behalf, and what the report does not count',
              'A PDF you can hand to your contractor or structural engineer',
            ])}
            ${p('The report is a planning baseline, not a structural design. An engineer\'s drawings and bar bending schedule always override it.')}
            ${p('Brick walls and plaster are not in this report. MasonryPro counts them from your rooms.')}
            ${ctaButton(`Work out masonry, ${rupees('masonpro')}`, MASON)}
          `)
      }
      if (dayNumber === 7) {
        return mail('Checking a structure quote against your report', `Using your report on a quote${who}`, `
            ${p('Put your contractor\'s quantities beside the report, line by line:')}
            ${ul([
              `${mono('Concrete:')} Compare volume by grade. A gap inside the low and high figures is normal. A gap outside them needs an explanation.`,
              `${mono('Steel:')} Compare kilograms in total and by bar diameter. Real buildings can carry more steel than a code-based model gives, so ask what the extra is for.`,
              `${mono('Formwork:')} Compare the contact area. It is the line most often left out.`,
              `${mono('Not counted:')} Read the report's list of what it does not count, then check whether the quote includes those items.`,
              `${mono('Drawings:')} Ask for the structural drawings and the bar bending schedule. They decide what is built.`,
            ])}
            ${p(`You can also paste a quote's quantities into the free <a href="${COMPARE}">contractor quantity check</a>.`)}
            ${ctaButton('Check a quote', COMPARE)}
          `)
      }
      if (dayNumber === 45) {
        return mail('Brickwork and plaster quantities', `Next phase: masonry${who}`, `
            ${p('Your report covers the frame. The walls are the next quantity a quote can get wrong, because brick sizes differ from kiln to kiln and openings must be deducted.')}
            ${p('MasonryPro works from your rooms and states the brick size it assumed, so you can measure a few bricks and see how the count changes.')}
            ${ctaButton(`Work out masonry, ${rupees('masonpro')}`, MASON)}
          `)
      }
      if (dayNumber === 75) {
        return mail('Wiring and pipes before they are buried', `Wiring and plumbing${who}`, `
            ${p('Conduit and pipes go into walls and floors before plaster and screed. A missing point or a short run is cheapest to fix at that stage.')}
            ${ul([
              `ElectricalPro: points, wire by size, conduit and protection devices (${rupees('electropro')})`,
              `PlumbingPro: pipe by size, fittings, fixtures and tank capacity (${rupees('plumbpro')})`,
            ])}
            ${ctaButton('ElectricalPro', ELEC)}
            ${ctaButton('PlumbingPro', PLUMB)}
          `)
      }
      if (dayNumber === 120) {
        return mail('Finishing quantities', `Finishes${who}`, `
            ${p('If you have not yet counted the finishing, InteriorPro does it from your room areas: flooring, wall tiles, paint, ceilings and the like, with wastage stated.')}
            ${p(GRAND_LINE)}
            ${ctaButton(`Work out finishes, ${rupees('interiorpro')}`, INTERIOR)}
          `)
      }
      return null
    }

    // -----------------------------------------------------------------------
    case 'masonpro': {
      if (dayNumber === 0) {
        return mail('Your MasonryPro report, and wiring next', `Your MasonryPro report is ready${who}`, `
            ${p('Your report counts the brickwork or blockwork, the mortar, and the plaster on every face, from your rooms and openings. It states the brick size it assumed and what it does not count.')}
            ${p('Wiring is next. ElectricalPro counts points, wire by size, conduit and protection devices from your plan.')}
            ${ctaButton(`Work out wiring, ${rupees('electropro')}`, ELEC)}
          `)
      }
      if (dayNumber === 7) {
        return mail('Reading a brick count', `Checking a brick count${who}`, `
            ${p('Four things decide a brick count:')}
            ${ul([
              `${mono('Brick size:')} bricks from different kilns differ in size. Measure a few and compare with the size in your report.`,
              `${mono('Joint:')} the mortar joint adds to the size of each course.`,
              `${mono('Openings:')} doors and windows are deducted from the wall area.`,
              `${mono('Wastage:')} breakage and cutting add to what you order. Your report states the allowance it used.`,
            ])}
            ${p('If your mason\'s count is outside the low and high figures in the report, ask which of these four differs.')}
          `)
      }
      if (dayNumber === 45) {
        return mail('Wiring before plaster', `Next phase: electrical${who}`, `
            ${p('Conduit and boxes are fixed before plaster goes on. That is the moment to count points and wire runs.')}
            ${p('ElectricalPro counts them from your plan and lists what it leaves out, such as fittings, fans, lights and the meter.')}
            ${ctaButton(`Work out wiring, ${rupees('electropro')}`, ELEC)}
          `)
      }
      if (dayNumber === 75) {
        return mail('Pipes before the floor is laid', `Next phase: plumbing${who}`, `
            ${p('Supply and drainage pipes go in before the floor finish. PlumbingPro counts pipe by size, fittings, fixtures and tank capacity for your plan and family size, so you can check your plumber\'s list line by line.')}
            ${ctaButton(`Work out plumbing, ${rupees('plumbpro')}`, PLUMB)}
          `)
      }
      if (dayNumber === 120) {
        return mail('Finishing quantities', `Finishes${who}`, `
            ${p('InteriorPro counts flooring, wall tiles, paint, ceilings and the like from your room areas, with wastage stated.')}
            ${p(GRAND_LINE)}
            ${ctaButton(`Work out finishes, ${rupees('interiorpro')}`, INTERIOR)}
          `)
      }
      return null
    }

    // -----------------------------------------------------------------------
    case 'electropro': {
      if (dayNumber === 0) {
        return mail('Your ElectricalPro report, and plumbing next', `Your ElectricalPro report is ready${who}`, `
            ${p('Your report counts points, wire by size, conduit, boxes, and the protection devices for your plan. What it does not count, such as fittings, fans, lights and the meter, is listed in the report.')}
            ${p('Pipes are next. PlumbingPro counts pipe by size, fittings, fixtures and tank capacity.')}
            ${ctaButton(`Work out plumbing, ${rupees('plumbpro')}`, PLUMB)}
          `)
      }
      if (dayNumber === 7) {
        return mail('Five things to ask your electrician to put in writing', `Electrical checks${who}`, `
            ${ul([
              'Which MCB or RCBO rating protects each circuit.',
              'Which RCCB protects which circuits, and its rating.',
              'The wire size on each circuit, and that it is copper.',
              'The earth electrode, and an earth resistance reading after installation.',
              'The list of what the quote does not include.',
            ])}
            ${p('Put the answers beside the counts in your report. A difference is not always an error, but it should have a reason.')}
          `)
      }
      if (dayNumber === 45) {
        return mail('Wiring and pipes: what has to be settled together', `Coordinating wiring and plumbing${who}`, `
            ${p('Both run inside the walls and floors, and both need their positions fixed before plaster and screed. Settle switch, socket, tap and drain positions on one plan before either trade starts.')}
            ${p('If you have not yet counted the pipes, PlumbingPro does it from your plan and family size.')}
            ${ctaButton(`Work out plumbing, ${rupees('plumbpro')}`, PLUMB)}
          `)
      }
      if (dayNumber === 75) {
        return mail('Finishing quantities', `Finishes${who}`, `
            ${p('With wiring and plumbing counted, finishing is next. InteriorPro counts flooring, wall tiles, paint, ceilings and the like from your room areas, so you can check a finishing quote before it is signed.')}
            ${ctaButton(`Work out finishes, ${rupees('interiorpro')}`, INTERIOR)}
          `)
      }
      if (dayNumber === 120) {
        return mail('Phases you have not counted yet', `Remaining phases${who}`, `
            ${p('If masonry, plumbing or finishes are still uncounted, each report gives you the quantities for that phase to put beside a quote.')}
            ${p(GRAND_LINE)}
            ${ctaButton('See all the tools', `${BASE_URL}/#pricing`)}
          `)
      }
      return null
    }

    // -----------------------------------------------------------------------
    case 'plumbpro': {
      if (dayNumber === 0) {
        return mail('Your PlumbingPro report, and finishes next', `Your PlumbingPro report is ready${who}`, `
            ${p('Your report counts pipe by size and material, fittings, fixtures and tank capacity for your plan and family size, and lists what it does not count.')}
            ${p('Finishes are next. InteriorPro counts flooring, wall tiles, paint and ceilings from your room areas.')}
            ${ctaButton(`Work out finishes, ${rupees('interiorpro')}`, INTERIOR)}
          `)
      }
      if (dayNumber === 7) {
        return mail('What to ask your plumber to put in writing', `Plumbing checks${who}`, `
            ${ul([
              'The tank capacity, and how many people it was sized for.',
              'The pipe material and sizes for supply and for drainage.',
              'The fixture list, bathroom by bathroom.',
              'Whether the pump and the standby pump are included.',
              'What the quote does not include.',
            ])}
            ${p('Put the answers beside the counts in your report. Ask for a reason wherever they differ.')}
          `)
      }
      if (dayNumber === 45) {
        return mail('Before the finishing work starts', `Finishes next${who}`, `
            ${p('Once pipes and wiring are in and tested, finishes can go on. InteriorPro counts the finishing from your room areas and states the wastage it allowed.')}
            ${ctaButton(`Work out finishes, ${rupees('interiorpro')}`, INTERIOR)}
          `)
      }
      if (dayNumber === 75) {
        return mail('Phases you have not counted yet', `Remaining phases${who}`, `
            ${p('If any phase of your house is still uncounted, its report gives you the quantities to put beside a quote.')}
            ${ctaButton('See all the tools', `${BASE_URL}/#pricing`)}
          `)
      }
      if (dayNumber === 120) {
        return mail('One buying list for the whole house', `Grand Total${who}`, `
            ${p(GRAND_LINE)}
            ${ctaButton('See the Grand Total report', GRAND)}
          `)
      }
      return null
    }

    // -----------------------------------------------------------------------
    case 'interiorpro': {
      if (dayNumber === 0) {
        return mail('Your InteriorPro report, and the Grand Total', `Your InteriorPro report is ready${who}`, `
            ${p('Your report counts flooring, wall tiles, paint, ceilings and the like from your rooms, with wastage stated. What it does not count, such as plaster, stairs, sanitary fittings and loose furniture, is listed in the report.')}
            ${p(GRAND_LINE)}
            ${ctaButton('See the Grand Total report', GRAND)}
          `)
      }
      if (dayNumber === 7) {
        return mail('Five things to check on a finishing quote', `Finishing checks${who}`, `
            ${ul([
              `${mono('Areas:')} measure a room or two yourself and compare with the areas in the quote.`,
              `${mono('Wastage:')} ask what allowance was added for tiles and boards. It is larger for diagonal lays and small rooms.`,
              `${mono('Kitchen:')} measure the running length of the counter yourself. Check that upper and lower runs are not counted twice.`,
              `${mono('Specification:')} ask for the tile size, board thickness and paint system in writing.`,
              `${mono('Exclusions:')} ask what is not in the quote.`,
            ])}
          `)
      }
      if (dayNumber === 45) {
        return mail('Keep your reports', `Keep your reports${who}`, `
            ${p('Your reports are a record of what each phase was counted to need. Keep the PDFs with the drawings and the bills. If a repair or an extension comes later, they show what was assumed.')}
            ${p(GRAND_LINE)}
          `)
      }
      if (dayNumber === 75) {
        return mail('If you are counting another phase', `Other phases${who}`, `
            ${p('Each phase has its own report: StructurePro, MasonryPro, ElectricalPro, PlumbingPro and InteriorPro. Each states its assumptions and what it leaves out.')}
            ${ctaButton('See all the tools', `${BASE_URL}/#pricing`)}
          `)
      }
      if (dayNumber === 120) {
        return mail('Planning anything new?', `Planning anything new${who}`, `
            ${p('If you are planning a new house, an extension or a renovation, each phase can be counted before you ask for a quote. Start with the free first look at the frame.')}
            ${ctaButton('See all the tools', `${BASE_URL}/#pricing`)}
          `)
      }
      return null
    }

    default:
      return null
  }
}
