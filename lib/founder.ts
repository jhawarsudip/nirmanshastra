/*
  Who is behind NirmanShastra, in one place. Every page, structured-data block and PDF that says it reads from here.

  The founder's NAME stays private (SJ, 26 Oct 2026): it appears nowhere on the site, in structured data, in the chat
  assistant's knowledge or in a PDF. What may be said is the line below, word for word.

  Founder photo (optional): set NEXT_PUBLIC_FOUNDER_PHOTO in Vercel to either a path under /public (for example
  /founder.jpg) or an https:// image address, and redeploy. While it is empty nothing about a photo is shown.
*/

export const FOUNDER_LINE = {
  en: 'Built by a civil engineer (B.Tech Civil, NIT), formerly at a leading real estate construction company',
  hi: 'एक सिविल इंजीनियर (B.Tech सिविल, NIT) द्वारा बनाया गया, जो पहले एक अग्रणी रियल एस्टेट निर्माण कंपनी में थे',
} as const

/** A site path or an https address with no tricks in it; '' when the value is empty or not usable. */
export function cleanPhotoUrl(raw: string | undefined): string {
  const v = (raw ?? '').trim()
  return /^(\/[A-Za-z0-9._/-]+|https:\/\/[^\s"'<>]+)$/.test(v) && !v.includes('..') && !v.startsWith('//') ? v : ''
}

/** The photo to show, or '' (nothing is shown) while NEXT_PUBLIC_FOUNDER_PHOTO is not set. */
export const FOUNDER_PHOTO: string = cleanPhotoUrl(process.env.NEXT_PUBLIC_FOUNDER_PHOTO)

/** Alt text for the photo: describes the picture without naming the person. */
export const FOUNDER_PHOTO_ALT = 'The civil engineer who builds NirmanShastra'
