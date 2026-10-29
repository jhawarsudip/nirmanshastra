/*
  How to reach NirmanShastra, in one place: the contact email and the social profiles.
  Every footer, menu, contact page, JSON-LD block and llms.txt line reads from here.

  There is no phone number and no chat-app link on the site (SJ, 29 Oct 2026): people write by email or through the contact form,
  and the support assistant (the chat in the corner) answers the common questions and points to the email for the rest.
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
