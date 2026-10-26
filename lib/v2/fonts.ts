import { Rozha_One, Mukta } from 'next/font/google'

/*
  One home for the v2 fonts so the homepage layout and the inner-page shell load the same files.

  Weights: Mukta is loaded at 400, 600 and 700 only. A style that asks for 500 is drawn in 400 and one that asks for 800 in 700
  (the browser picks the nearest weight the family has), so no style is left without a face and two files are not fetched.
  Rozha One has one weight (400).

  Preload: the headline face, Rozha One Latin, is preloaded (the one file the first screen's headline needs; display: swap shows the
  words at once in the fallback and swaps when it arrives). Mukta is not preloaded: its Latin, Latin-extended (the rupee sign) and
  Devanagari files each have a unicode-range, so a visitor fetches only the scripts on their page. Rozha's Devanagari face
  (used by the Hindi headline) is still in the stylesheet and loads on demand.
*/
export const rozha = Rozha_One({ subsets: ['latin'], weight: '400', variable: '--font-rozha', display: 'swap', preload: true })
export const mukta = Mukta({ subsets: ['latin', 'devanagari'], weight: ['400', '600', '700'], variable: '--font-mukta', display: 'swap', preload: false })
