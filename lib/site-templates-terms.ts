// Terms for the Excel Site Templates sold at /site-templates.
//
// One source for the page at /site-templates/terms. The wording follows the
// "Terms of Use and Licence" PDF that ships inside every download (SJ's own
// terms, with Etsy removed); only the product-specific details differ there.
// "{email}" in a paragraph is replaced by a mailto link wherever it is rendered.

export const ST_TERMS_UPDATED = '25 October 2026'

export const ST_TERMS_INTRO =
  'These terms cover the Excel Site Templates sold at nirmanshastra.in/site-templates: the six toolkits and the Site Operations Suite bundle. In them, NirmanShastra is "the Seller" and the person who bought the file is "the Purchaser". The same terms are in the Terms of Use and Licence PDF inside every download. By downloading or using a file, the Purchaser accepts them. The Terms of Use and Privacy Policy of the website apply as well.'

export interface StTermsSection {
  id: string
  heading: string
  paragraphs: string[]
}

export const ST_TERMS_SECTIONS: StTermsSection[] = [
  {
    id: 'buying',
    heading: '1. What you are buying',
    paragraphs: [
      'A licence to use the workbook and its accompanying documents. You are not buying ownership of the file or of the underlying design, formulas, libraries, diagrams, structure or documentation, all of which remain the property of the Seller.',
    ],
  },
  {
    id: 'may',
    heading: '2. What you may do',
    paragraphs: [
      'Use the file for your own work, personal or commercial, on an unlimited number of your own projects. Edit, adapt, extend and re-brand it for your own internal use. Issue outputs generated from it, such as schedules, bills, registers, reports and notes, to your own clients, consultants, contractors and suppliers, including commercially. Install it on any device you personally use.',
    ],
  },
  {
    id: 'may-not',
    heading: '3. What you may not do',
    paragraphs: [
      'Resell, re-license, sublicense, rent, lend, share, gift or distribute the file or any modified version of it. Upload it to any file-sharing service, template marketplace, course, membership site or public repository. Share it with people outside your own organisation. Sell it as your own product or as part of a bundle. Claim authorship of the workbook, its libraries, its diagrams or its methodology.',
    ],
  },
  {
    id: 'team',
    heading: '4. Team and organisation use',
    paragraphs: [
      'One purchase covers use within one organisation by the people who work in it. If you wish to distribute the file beyond a single organisation, for example across separate companies, or to your own clients as a deliverable in itself, contact the Seller for an extended licence.',
    ],
  },
  {
    id: 'delivery',
    heading: '5. Delivery',
    paragraphs: [
      'After payment, the download link is shown on the page and emailed to the address you entered. The link works for 48 hours and needs no login. Save the file after you download it. If the email does not arrive, use the link on the page. If you have lost both, write to {email} from the email address you bought with and a fresh link, or the current file, will be sent.',
    ],
  },
  {
    id: 'refunds',
    heading: '6. Refunds',
    paragraphs: [
      'Because this is a digital file delivered immediately and in full, it cannot be returned once downloaded. If the file is faulty, does not open, or does not match its description, write to the Seller at {email} from the email address you bought with and it will be fixed or refunded. Most issues are resolved the same day.',
    ],
  },
  {
    id: 'updates',
    heading: '7. Updates',
    paragraphs: [
      'Free lifetime updates to the edition you bought. To receive the current file, write to {email} from the email address you bought with.',
    ],
  },
  {
    id: 'liability',
    heading: '8. Not professional advice, and limits of liability',
    paragraphs: [
      'Each workbook is a quantity, scheduling, documentation or compliance tool supplied as-is. It does not replace a licensed structural engineer, the approved drawings, the project specification, a qualified professional, or the current text of the Indian Standards and the laws that apply to your project. Rates, constants, wage and statutory figures, formulas and rules vary with the project, the place and the date, and are revised from time to time.',
      'The Purchaser is solely responsible for confirming every constant, rate, quantity and figure against the approved drawings, the specification and the current version of each code or law before ordering, paying, fabricating, filing or building anything from it. The Seller accepts no liability for any loss, cost, rework, rejected material, wrong or excess order, penalty, delay, structural consequence or damage arising from the use of the file, or of anything produced from it.',
    ],
  },
  {
    id: 'contact',
    heading: '9. Questions',
    paragraphs: [
      'Write to {email}. For governing law and disputes, see the Terms of Use of the website.',
    ],
  },
]

export const ST_TERMS_SUMMARY =
  'In one line: use it on as many of your own projects as you like, forever. Just do not pass the file on to anyone else, and always check what it produces against your approved drawings and the current codes before relying on it.'
