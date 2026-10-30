/**
 * Which pages have a real Hindi version.
 *
 * Every page can be opened under /hi (the header, footer and menus follow the language), but a page whose
 * body is still English must not tell search engines it is a Hindi page. So:
 *   - a page listed here declares the en-IN / hi-IN pair (hreflang), has its own /hi canonical address,
 *     and is listed in the sitemap in both languages;
 *   - a page not listed here, if opened under /hi, canonicalises to the English address and is not paired.
 *
 * Add a path here in the same commit that gives the page its Hindi text. A trailing "/*" means "this path and
 * everything below it" (use it for a section whose pages are all translated together).
 * The home page is written in Hindi already.
 */
export const HINDI_READY: readonly string[] = [
  '/',
]

export function isHindiReady(path: string): boolean {
  return HINDI_READY.some(p => (p.endsWith('/*') ? path === p.slice(0, -2) || path.startsWith(p.slice(0, -1)) : path === p))
}
