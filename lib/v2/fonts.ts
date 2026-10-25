import { Rozha_One, Mukta } from 'next/font/google'

// One home for the v2 fonts so the homepage layout and the inner-page shell load the same files.
// Both carry Devanagari + Latin. preload is off so the browser fetches only the script a visitor needs (unicode-range).
export const rozha = Rozha_One({ subsets: ['latin', 'devanagari'], weight: '400', variable: '--font-rozha', display: 'swap', preload: false })
export const mukta = Mukta({ subsets: ['latin', 'devanagari'], weight: ['400', '500', '600', '700', '800'], variable: '--font-mukta', display: 'swap', preload: false })
