// Emits schema.org JSON-LD. Works from server components and from client pages
// (it is plain markup: no hooks, no browser APIs), so it is server-rendered into
// the HTML that crawlers read either way.

type JsonObject = Record<string, unknown>

function strip(obj: JsonObject): JsonObject {
  const { '@context': _ctx, ...rest } = obj
  void _ctx
  return rest
}

export default function JsonLd({ data }: { data: JsonObject | JsonObject[] }) {
  const payload: JsonObject = Array.isArray(data)
    ? { '@context': 'https://schema.org', '@graph': data.map(strip) }
    : { '@context': 'https://schema.org', ...strip(data) }

  // "<" is escaped so no string in the data can close the script tag.
  const json = JSON.stringify(payload).replace(/</g, '\\u003c')

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
