import { breadcrumbSchema, templateJsonLd, templatesIndexSchema } from '@/lib/seo/schema'
import { abs, getTemplate } from '@/lib/seo/site'
import { getProductById } from '@/lib/site-templates'
import { localizePath } from '@/lib/i18n/paths'

type Json = Record<string, unknown>

/*
  The structured data of the Site Templates pages, in Hindi on /hi.

  English is `templatesIndexSchema()` / `templateJsonLd(path)` exactly as before. On /hi the same graph is returned with the
  words in Hindi (the breadcrumb names, the product name and one-line summary) and the Hindi addresses. lib/seo/schema.ts is
  not touched; this only post-processes what it returns. The Hindi product names are the titles in lib/site-templates.ts
  (titleHi); the prices stay whatever the schema built from the catalog. These pages emit no FAQ structured data.
*/

/** Hindi for the one-line summary of each toolkit (the English is TEMPLATE_META in lib/seo/site.ts). Keyed by catalog id. */
const SUMMARY_HI: Record<string, string> = {
  'cost-estimator': 'ठेकेदारों के लिए Excel कंस्ट्रक्शन कॉस्ट एस्टिमेटर। अपने रेट लगाकर IS कोड की मात्राओं से घर का हिसाब लगाइए, क्लाइंट के लिए कोटेशन बनाइए और 3 कोटेशन तक की तुलना कीजिए।',
  'documentation-pack': '14 शीट का Excel साइट डॉक्यूमेंटेशन पैक: ड्रॉइंग रजिस्टर, RFI रजिस्टर, NCR और टेस्ट रजिस्टर, प्रोक्योरमेंट लॉग, रोज़ का साइट लॉग और स्नैग लिस्ट।',
  'billing-measurement': '9 शीट की Excel बिलिंग और मेज़रमेंट वर्कबुक: मेज़रमेंट बुक, IS 1200 की कटौतियाँ, BOQ के सामने एब्सट्रैक्ट, और रिटेंशन, TDS (धारा 393) व GST वाले RA बिल।',
  'bar-bending-schedule': '12 शीट का Excel बार बेंडिंग शेड्यूल टेम्पलेट: शेप लाइब्रेरी, IS 2502 के अनुसार मोड़ की कटौती और हुक के भत्ते वाला कटिंग-लेंथ कैलकुलेटर, लैप और डेवलपमेंट लेंथ, कटिंग ऑप्टिमाइज़र और स्टील ऑर्डर नोट।',
  'labour-compliance': '16 शीट की Excel लेबर पेरोल और कम्प्लायंस वर्कबुक: मस्टर रोल, मज़दूरी रजिस्टर, PF/ESI और न्यूनतम मज़दूरी की जाँच, मज़दूरी पर्चियाँ और भारत के चार लेबर कोड के तहत सब-कॉन्ट्रैक्टर के कम्प्लायंस होल्ड।',
  'planning-progress': '17 शीट की Excel प्रोजेक्ट कंट्रोल्स वर्कबुक: बेसलाइन प्लान, गैंट, वैल्यू-वेटेड S-कर्व और अर्नड वैल्यू, कैश फ़्लो, साथ में डिले और EOT रजिस्टर।',
}

const HOME = 'होम'
const SHOP = 'साइट टेम्पलेट'

/** Breadcrumb of /site-templates. */
export function templatesIndexJsonLd(locale: string): Json[] {
  if (locale !== 'hi') return templatesIndexSchema() as Json[]
  return [
    breadcrumbSchema([
      { name: HOME, path: localizePath('/', 'hi') },
      { name: SHOP, path: localizePath('/site-templates', 'hi') },
    ]) as Json,
  ]
}

/** Breadcrumb and Product of one toolkit page, e.g. templateJsonLdFor('/site-templates/bar-bending-schedule', locale). */
export function templateJsonLdFor(path: string, locale: string): Json[] {
  const nodes = templateJsonLd(path) as Json[]
  if (locale !== 'hi') return nodes
  const entry = getTemplate(path)
  if (!entry) return nodes
  const titleHi = getProductById(entry.id)?.titleHi ?? entry.name
  const hiPath = localizePath(path, 'hi')
  const url = abs(hiPath)
  return nodes.map((n) => {
    switch (n['@type']) {
      case 'BreadcrumbList':
        return breadcrumbSchema([
          { name: HOME, path: localizePath('/', 'hi') },
          { name: SHOP, path: localizePath('/site-templates', 'hi') },
          { name: titleHi, path: hiPath },
        ]) as Json
      case 'Product':
        return {
          ...n,
          '@id': `${url}#product`,
          name: titleHi,
          url,
          description: SUMMARY_HI[entry.id] ?? n.description,
          offers: n.offers && typeof n.offers === 'object' ? { ...(n.offers as Json), url } : n.offers,
        }
      default:
        return n
    }
  })
}
