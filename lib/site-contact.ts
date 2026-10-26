/*
  How to reach NirmanShastra, in one place: social profiles, WhatsApp and the messages the WhatsApp button pre-fills.
  Every footer, menu, contact page, JSON-LD block and llms.txt line reads from here.

  To change the WhatsApp number: set NEXT_PUBLIC_WHATSAPP_NUMBER in Vercel (digits only, country code first, for example
  918697620512) and redeploy. An empty or invalid value hides every WhatsApp link and the floating button.
*/

/*
  The public contact email. Set NEXT_PUBLIC_CONTACT_EMAIL in Vercel when the domain mailbox exists (for example
  support@nirmanshastra.in) and redeploy; until then the Gmail address below is used. An invalid value is ignored.
  Report emails also use it as their Reply-To, so a reply to "Did the report help?" reaches this inbox.
*/
const RAW_EMAIL = (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '').trim()
export const CONTACT_EMAIL: string = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(RAW_EMAIL) ? RAW_EMAIL : 'nirmanshastraindia@gmail.com'

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/nirmanshastraindia/',
  youtube: 'https://www.youtube.com/@NirmanShastra',
  facebook: 'https://www.facebook.com/profile.php?id=61591652705059',
} as const

/** The three profiles, for the Organization's `sameAs` */
export const SAME_AS: string[] = [SOCIAL_LINKS.instagram, SOCIAL_LINKS.youtube, SOCIAL_LINKS.facebook]

const RAW_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '918697620512').replace(/\D/g, '')

/** Digits only with the country code, or '' when no valid number is set */
export const WHATSAPP_NUMBER: string = /^\d{10,15}$/.test(RAW_NUMBER) ? RAW_NUMBER : ''

/** "+91 86976 20512" for display */
export const WHATSAPP_DISPLAY: string = !WHATSAPP_NUMBER
  ? ''
  : WHATSAPP_NUMBER.length === 12 && WHATSAPP_NUMBER.startsWith('91')
    ? `+91 ${WHATSAPP_NUMBER.slice(2, 7)} ${WHATSAPP_NUMBER.slice(7)}`
    : `+${WHATSAPP_NUMBER}`

/** "+918697620512" for structured data */
export const WHATSAPP_E164: string = WHATSAPP_NUMBER ? `+${WHATSAPP_NUMBER}` : ''

/** https://wa.me/<number>, with a pre-filled message when one is given */
export function whatsappUrl(text?: string): string {
  if (!WHATSAPP_NUMBER) return ''
  return `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

// Names for the pre-filled message, by exact page path. scripts/check-contact.ts keeps this in step with lib/seo/site.ts.
export const WHATSAPP_PAGE_NAMES: Record<string, string> = {
  '/tools/bar-bending-schedule-calculator': 'Bar Bending Calculator',
  '/tools/water-tank-size-calculator': 'Water Tank Size Calculator',
  '/tools/concrete-mix-ratio-calculator': 'Concrete Mix Calculator',
  '/tools/brick-calculator': 'Brick Calculator',
  '/tools/wire-size-calculator': 'Wire Size Calculator',
  '/tools/ra-bill-retention-tds-calculator': 'RA Bill Calculator (Retention, GST, TDS)',
  '/tools/concrete-cube-test-calculator': 'Concrete Cube Test Calculator',
  '/tools/daily-wage-pf-esi-calculator': 'Daily-Wage PF & ESI Calculator',
  '/tools/paint-tile-calculator': 'Paint and Tile Calculator',
  '/tools/earned-value-calculator': 'Earned Value Calculator',
  '/tools/vastu-pro': 'VastuPro',
  '/tools/structopro': 'StructurePro',
  '/tools/masonpro': 'MasonryPro',
  '/tools/electropro': 'ElectricalPro',
  '/tools/plumbpro': 'PlumbingPro',
  '/tools/interiorpro': 'InteriorPro',
  '/tools/grand-total': 'Grand Total Report',
  '/tools/complete-house-pack': 'Complete House Pack',
}

const QUOTE_MESSAGE = "Hi, I want to check my contractor's quote."

/** The text the floating button pre-fills, depending on the page the visitor is on */
export function whatsappMessageFor(pathname: string): string {
  const p = (pathname || '/').replace(/\/+$/, '') || '/'
  if (p === '/hi' || p.startsWith('/hi/')) return 'नमस्ते, मुझे अपने ठेकेदार के कोटेशन की जाँच करवानी है।'
  if (p === '/' || p === '/compare-quote') return QUOTE_MESSAGE
  const name = Object.prototype.hasOwnProperty.call(WHATSAPP_PAGE_NAMES, p) ? WHATSAPP_PAGE_NAMES[p] : ''
  if (name) return `Hi, I have a question about ${name}.`
  if (p.startsWith('/blog/')) return 'Hi, I read one of your articles and have a question.'
  if (p.startsWith('/site-templates')) return 'Hi, I have a question about your Excel templates.'
  return 'Hi, I have a question about NirmanShastra.'
}
