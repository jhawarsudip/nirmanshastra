import { toolJsonLd, breadcrumbSchema, faqPageSchema, howToSchema } from '@/lib/seo/schema'
import { CALC_CONTENT, pickFaq, pickHowTo } from '@/lib/seo/calc-content'
import { PAID_CONTENT, pickPaid } from '@/lib/seo/paid-content'
import { CALCULATORS } from '@/lib/v2/calculators'
import { localizePath } from '@/lib/i18n/paths'
import { abs } from '@/lib/seo/site'

type Json = Record<string, unknown>

/**
 * The structured data of a free calculator page. English is `toolJsonLd(path)` exactly as before. On /hi the same
 * graph is returned with the words in Hindi: the breadcrumb ("होम" and the Hindi tool name), the app name and
 * one-line description, the language tag, the Hindi addresses, the HowTo steps and the FAQ questions and answers
 * (the same Hindi that is on the page, so markup and text cannot drift apart). lib/seo/schema.ts is not touched;
 * this only post-processes what it returns. The Hindi name and description come from the homepage list
 * (lib/v2/calculators.ts).
 */
export function calcJsonLd(path: string, locale: string): Json[] {
  const nodes = toolJsonLd(path) as Json[]
  if (locale !== 'hi') return nodes
  const def = CALCULATORS.find((c) => c.href === path)
  const content = CALC_CONTENT[path]
  const hiPath = localizePath(path, 'hi')
  const url = abs(hiPath)
  return nodes.map((n) => {
    switch (n['@type']) {
      case 'BreadcrumbList': {
        const items = n.itemListElement as { name: string }[]
        const last = items[items.length - 1]?.name ?? ''
        return breadcrumbSchema([
          { name: 'होम', path: localizePath('/', 'hi') },
          { name: def?.title.hi ?? last, path: hiPath },
        ])
      }
      case 'WebApplication':
        return {
          ...n,
          '@id': `${url}#app`,
          name: def?.title.hi ?? n.name,
          url,
          description: def?.desc.hi ?? n.description,
          inLanguage: 'hi-IN',
          offers: n.offers && typeof n.offers === 'object' ? { ...(n.offers as Json), url } : n.offers,
        }
      case 'HowTo': {
        const how = content ? pickHowTo(content, 'hi') : undefined
        return how ? howToSchema(how) : n
      }
      case 'FAQPage':
        return content?.faq?.length ? faqPageSchema(pickFaq(content.faq, 'hi')) : n
      default:
        return n
    }
  })
}

/**
 * For the paid-tool layouts (MasonryPro, ElectricalPro, ...): hand the nodes they already build (after localizeToolLd) to this
 * and, on /hi, the FAQPage node carries the Hindi questions and answers that ToolInfo shows. English pages get the nodes back untouched.
 *     <JsonLd data={withHindiFaq(localizeToolLd(toolJsonLd(path), locale, SUMMARY), path, locale)} />
 */
export function withHindiFaq<T extends object>(nodes: T[], path: string, locale: string): T[] {
  if (locale !== 'hi') return nodes
  const paid = PAID_CONTENT[path]
  if (!paid) return nodes
  const faq = pickPaid(paid, 'hi').faq
  return nodes.map((n) => ((n as Json)['@type'] === 'FAQPage' ? (faqPageSchema(faq) as unknown as T) : n))
}
