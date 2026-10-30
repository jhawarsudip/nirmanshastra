import { toolJsonLd, breadcrumbSchema } from '@/lib/seo/schema'
import { localizePath } from '@/lib/i18n/paths'
import { abs } from '@/lib/seo/site'

type Json = Record<string, unknown>

/** The one-line description of VastuPro in Hindi, for the structured data (the same sense as the English `summary` in lib/seo/site.ts). */
const SUMMARY_HI =
  'घर के नक्शे की निःशुल्क वास्तु रीडिंग: उत्तर किस ओर है यह तय कीजिए, अपने घर की आउटलाइन बनाइए, दरवाज़े और कमरे चिह्नित कीजिए, और हर एक को पुराने ग्रंथों और आज के वास्तु शिक्षकों के हिसाब से पढ़वाइए, उसके स्रोत के साथ, और अपने निष्कर्षों का PDF पाइए। यह एक पारंपरिक पद्धति है, IS कोड नहीं।'

/**
 * The structured data of the VastuPro page. English is `toolJsonLd('/tools/vastu-pro')` exactly as before. On /hi the same graph is
 * returned with the breadcrumb ("होम"), the one-line description, the language tag and the Hindi address in Hindi. lib/seo/schema.ts
 * is not touched; this only post-processes what it returns. The tool name is a brand name and stays as it is.
 */
export function vastuJsonLd(locale: string): Json[] {
  const path = '/tools/vastu-pro'
  const nodes = toolJsonLd(path) as Json[]
  if (locale !== 'hi') return nodes
  const hiPath = localizePath(path, 'hi')
  const url = abs(hiPath)
  return nodes.map((n) => {
    switch (n['@type']) {
      case 'BreadcrumbList': {
        const items = n.itemListElement as { name: string }[]
        const last = items[items.length - 1]?.name ?? 'VastuPro'
        return breadcrumbSchema([
          { name: 'होम', path: localizePath('/', 'hi') },
          { name: last, path: hiPath },
        ])
      }
      case 'WebApplication':
        return {
          ...n,
          '@id': `${url}#app`,
          url,
          description: SUMMARY_HI,
          inLanguage: 'hi-IN',
          offers: n.offers && typeof n.offers === 'object' ? { ...(n.offers as Json), url } : n.offers,
        }
      default:
        return n
    }
  })
}
