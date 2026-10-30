// VastuPro in Hindi. The reading (vastu-reading.ts) builds its sentences in English, and the PDF is made from those English
// sentences, so neither is touched. On a Hindi page the finished reading is turned into Hindi here, at display time:
//   - the parts that come from the rule table are looked up (lib/i18n/labels/vastu-text.ts, keyed by the English text),
//   - the sentences the engine assembles from templates are rebuilt in Hindi from the same pieces (zone, door, side,
//     entrance position, severity, basis),
//   - anything not recognised stays in English, and the leftover scan lists it.
// Nothing here changes a verdict, a zone or a number.

import { tr } from '@/lib/i18n/tr'
import { CATEGORY_HI, DIRECTION_HI, KIND_HI, PADA_HI, SEVERITY_HI, BASIS_HI, SIDE_HI, TONE_HI, ZONE_CODES, ZONE_HI, labelHi } from '@/lib/i18n/labels/vastu-terms'
import { PREFER_HI, VASTU_RULE_TEXT } from '@/lib/i18n/labels/vastu-text'
import { CATALOGUE } from './vastu-catalogue'
import { ROOM_RULES } from './vastu-rules'
import type { Basis, Finding, PlotNote, Reading, RemedySet, Severity } from './vastu-types'

const D = VASTU_RULE_TEXT

// ─── small look-ups used by the screens ───────────────────────────────────────────────────────
export const zoneShortOf = (hi: boolean, i: number, en: string): string => (hi ? ZONE_HI[i]?.short ?? en : en)
export const kindLabelOf = (hi: boolean, kind: string, en: string): string => (hi ? KIND_HI[kind]?.label ?? en : en)
export const kindAbbrevOf = (hi: boolean, kind: string, en: string): string => (hi ? KIND_HI[kind]?.abbrev ?? en : en)
export const categoryOf = (hi: boolean, cat: string): string => (hi ? CATEGORY_HI[cat] ?? cat : cat)
export const padaNameOf = (hi: boolean, name: string): string => (hi ? PADA_HI[name] ?? name : name)
export const severityOf = (hi: boolean, s: Severity, en: string): string => (hi ? SEVERITY_HI[s] : en)
export const basisOf = (hi: boolean, b: Basis, en: string): string => (hi ? BASIS_HI[b] : en)

/** The zone, as "उत्तर-पूर्व (ईशान)", for one of 0 to 15; -1 is the centre. */
export const zoneName = (z: number): string => (z < 0 ? 'नक्शे का केंद्र (ब्रह्मस्थान)' : ZONE_HI[z].text)
const zoneIn = (z: number): string => (z < 0 ? 'नक्शे के केंद्र (ब्रह्मस्थान) में' : `${ZONE_HI[z].text} में`)
const zoneList = (z: number): string => ZONE_HI[z].list

const zoneOfCode = (code: string): number => ZONE_CODES.indexOf(code)
/** 0 to 15 from "North-east (NE)", -1 from "Centre of the plan (the Brahmasthan)". */
function zoneOfText(t: string): number {
  const m = /\(([A-Z]+)\)$/.exec(t)
  return m ? zoneOfCode(m[1]) : -1
}
/** "North-east (NE)" wherever it stands in a sentence. */
const ZONE_EN_RE = /(?:North|East|South|West)(?:-(?:north|east|south|west)){0,2} \(([A-Z]+)\)/g
const zonesInText = (s: string): string => s.replace(ZONE_EN_RE, (_, code: string) => zoneName(zoneOfCode(code)))

// ─── text from the rule table ───────────────────────────────────────────────────────────────
const SEGMENT_KEYS = Object.keys(D).filter(k => !k.includes('{')).sort((a, b) => b.length - a.length)

/**
 * Hindi for a sentence or a run of sentences of the rule table. A text the engine has joined from known sentences
 * ("the centre of the plan..." added to a room's own text) is translated sentence by sentence.
 */
export function ruleText(s: string): string {
  if (!s) return s
  const direct = tr('hi', s, D)
  if (direct !== s) return direct
  const out: string[] = []
  let rest = s
  while (rest) {
    const key = SEGMENT_KEYS.find(k => rest.startsWith(k) && (rest.length === k.length || rest[k.length] === ' '))
    if (!key) { out.push(rest); break }
    out.push(D[key])
    rest = rest.slice(key.length).trimStart()
  }
  return out.join(' ')
}

const sourceHi = (s: string): string => {
  const m = /^Brihat Samhita ch\. (\d+)(?: \(directions for a water source\))?$/.exec(s)
  if (!m) return s
  return `बृहत्संहिता, अध्याय ${m[1]}${s.includes('(') ? ' (पानी के स्रोत की दिशाएँ)' : ''}`
}

// ─── who is speaking ───────────────────────────────────────────────────────────────────────
const SUBJECT: Record<Basis, { plain: string; today: string; plural: boolean }> = {
  classical: { plain: 'पारंपरिक ग्रंथ', today: 'पारंपरिक ग्रंथ', plural: true },
  taught: { plain: 'वास्तु शिक्षक', today: 'आज के वास्तु शिक्षक', plural: true },
  modern: { plain: 'हाल का चलन', today: 'हाल का चलन', plural: false },
}
const verb = (b: Basis, many: string, one: string) => (SUBJECT[b].plural ? many : one)

function preferHi(rule: string, basis: Basis): string {
  const p = PREFER_HI[rule]
  if (!p) return ''
  const [main, trail = ''] = p.split('|')
  return `${SUBJECT[basis].today} इसे ${main} रखना ${verb(basis, 'पसंद करते हैं', 'पसंद करता है')}${trail}।`
}

function silentHi(basis: Basis): string {
  if (basis === 'classical') return 'पारंपरिक ग्रंथ इसे न अनुकूल कहते हैं, न इसके विरुद्ध सावधान करते हैं।'
  if (basis === 'taught') return 'वास्तु शिक्षक इस जगह का अलग से ज़िक्र नहीं करते।'
  return 'हाल का चलन इस जगह का अलग से ज़िक्र नहीं करता।'
}

function headlineHi(f: Finding, label: string, where: string): string {
  const rule = ROOM_RULES[f.kind]
  const b = f.basis
  const head = `${label} ${where} है`
  switch (f.severity) {
    case 'POSITIVE':
      return `${head}, ऐसी जगह जिसे ${SUBJECT[b].today} अनुकूल ${verb(b, 'मानते हैं', 'मानता है')}।`
    case 'NEUTRAL':
      return `${head}। ${silentHi(b)}`
    case 'MODERATE':
      return `${head}। ${preferHi(rule?.prefer ?? '', b)}`
    case 'CRITICAL':
      return `${head}, ऐसी जगह जिसके विरुद्ध ${SUBJECT[b].plain} सावधान ${verb(b, 'करते हैं', 'करता है')}। ${preferHi(rule?.prefer ?? '', b)}`
  }
}

// ─── lines of a finding ────────────────────────────────────────────────────────────────────
const SIDE_RE = '(east|south|west|north)'
const CORNER_RE = '(north-east|south-east|south-west|north-west)'
const TONE_RE = '(favourable|mixed|cautioned)'
const side = (s: string) => SIDE_HI[s as keyof typeof SIDE_HI]
const corner = (s: string) => DIRECTION_HI[s] ?? s
const tone = (s: string) => TONE_HI[s as keyof typeof TONE_HI]
const pada = (s: string) => PADA_HI[s] ?? s
const RATING_SEV: Record<string, Severity> = { favoured: 'POSITIVE', acceptable: 'NEUTRAL', 'to review': 'MODERATE', cautioned: 'CRITICAL' }

const DETAIL: [RegExp, (m: RegExpExecArray) => string][] = [
  [
    new RegExp(`^The door is on the ${SIDE_RE} side of the plot, in position (\\d+) of 8 counted from the ${CORNER_RE} corner\\. In the translation of Brihat Samhita we read, that position is called (\\w+) and is named ${TONE_RE}\\.$`),
    m => `दरवाज़ा प्लॉट की ${side(m[1])} वाली तरफ़ है, ${corner(m[3])} कोने से गिनने पर 8 में से स्थिति ${m[2]} पर। हमने बृहत्संहिता का जो अनुवाद पढ़ा, उसमें उस स्थिति का नाम ${pada(m[4])} है और उसे ${tone(m[5])} स्थिति बताया गया है।`,
  ],
  [
    new RegExp(`^The door is on the ${SIDE_RE} wall of the plot, at the far end, next to the corner it shares with the ${SIDE_RE} wall\\. The texts count that corner as position 1 of the ${SIDE_RE} side, counted from the ${CORNER_RE} corner\\. In the translation of Brihat Samhita we read, it is called (\\w+) and is named ${TONE_RE}\\.$`),
    m => `दरवाज़ा प्लॉट की ${side(m[1])} वाली दीवार पर, आख़िरी सिरे पर, उस कोने के पास है जो यह दीवार ${side(m[2])} वाली दीवार के साथ साझा करती है। ग्रंथ उस कोने को ${side(m[3])} वाली तरफ़ की स्थिति 1 गिनते हैं, ${corner(m[4])} कोने से गिनते हुए। हमने बृहत्संहिता का जो अनुवाद पढ़ा, उसमें उसका नाम ${pada(m[5])} है और उसे ${tone(m[6])} स्थिति बताया गया है।`,
  ],
  [
    /^Direction from the centre of the plot: (.+?)\. Teachers today rate that direction for a main door as (favoured|acceptable|to review|cautioned)\. That rating comes from the 16-way compass, which is a modern convention\.$/,
    m => `प्लॉट के केंद्र से दिशा: ${zonesInText(m[1])}। आज के वास्तु शिक्षक मुख्य द्वार के लिए इस दिशा को “${SEVERITY_HI[RATING_SEV[m[2]]]}” दर्जा देते हैं। यह दर्जा 16 दिशाओं वाले कंपास से आता है, जो एक आधुनिक चलन है।`,
  ],
  [
    new RegExp(`^The door is close to the line between two positions\\. The next one, (\\w+), is named ${TONE_RE}\\.$`),
    m => `दरवाज़ा दो स्थितियों के बीच की रेखा के पास है। अगली, ${pada(m[1])}, को ${tone(m[2])} स्थिति बताया गया है।`,
  ],
  [/^Direction from the centre of the plot: (.+?)\.$/, m => `प्लॉट के केंद्र से दिशा: ${zonesInText(m[1])}।`],
  [
    /^Where it lies: (.+)\.$/,
    m => `यह यहाँ है: ${m[1].split(', ').map(part => {
      const c = /^centre (\d+%)$/.exec(part)
      if (c) return `केंद्र ${c[1]}`
      const z = /^([A-Z]+) (\d+%)$/.exec(part)
      return z ? `${zoneList(zoneOfCode(z[1]))} ${z[2]}` : part
    }).join(', ')}।`,
  ],
]

function detailHi(line: string): string {
  for (const [re, build] of DETAIL) {
    const m = re.exec(line)
    if (m) return build(m)
  }
  return ruleText(line)
}

function alsoHi(s: string): string {
  const m = /^also covers (.+)$/.exec(s)
  if (!m) return s
  const list = m[1].split(', ').map(part => {
    const z = /^([A-Z]+) (\(\d+%\))$/.exec(part)
    return z ? `${zoneList(zoneOfCode(z[1]))} ${z[2]}` : part
  })
  return `${list.join(', ')} में भी फैला है`
}

const remedies = (r: RemedySet): RemedySet => ({ structural: r.structural.map(ruleText), practical: r.practical.map(ruleText) })

export function hiFinding(f: Finding): Finding {
  const z = zoneOfText(f.zoneText)
  const base = CATALOGUE[f.kind]?.label ?? f.label
  const label = labelHi(f.kind, f.label, base)
  return {
    ...f,
    label,
    zoneText: zoneName(z),
    alsoText: f.alsoText ? alsoHi(f.alsoText) : undefined,
    headline: headlineHi(f, label, zoneIn(z)),
    tradition: ruleText(f.tradition),
    disputed: f.disputed ? ruleText(f.disputed) : undefined,
    practical: f.practical ? ruleText(f.practical) : undefined,
    source: f.source ? sourceHi(f.source) : undefined,
    detail: f.detail.map(detailHi),
    remedies: remedies(f.remedies),
    dos: f.dos.map(ruleText),
    donts: f.donts.map(ruleText),
  }
}

// ─── the plot ─────────────────────────────────────────────────────────────────────────────
export function hiPlotNote(n: PlotNote): PlotNote {
  let title = ruleText(n.title)
  let text = ruleText(n.text)
  const cutTitle = /^The (.+) corner of the plot is cut$/.exec(n.title)
  if (cutTitle) title = `प्लॉट का ${DIRECTION_HI[cutTitle[1]] ?? cutTitle[1]} कोना कटा है`
  const cut = /^(All of|About (\d+)% of) the (.+?) corner of the plot is missing\. ([\s\S]*)$/.exec(n.text)
  if (cut) {
    const part = cut[2] ? `लगभग ${cut[2]}% हिस्सा` : 'पूरा हिस्सा'
    text = `प्लॉट के ${DIRECTION_HI[cut[3]] ?? cut[3]} कोने का ${part} गायब है। ${ruleText(cut[4])}`
  }
  return { ...n, title, text, remedies: n.remedies ? remedies(n.remedies) : undefined }
}

const MISSING_HI: Record<string, string> = {
  'main door': 'मुख्य द्वार',
  'kitchen': 'रसोई',
  'a toilet or bathroom': 'शौचालय या बाथरूम',
}

/** The whole reading in Hindi. Counts, ids, severities and shares are carried over untouched. */
export function hiReading(r: Reading): Reading {
  return {
    ...r,
    findings: r.findings.map(hiFinding),
    plot: r.plot.map(hiPlotNote),
    missing: r.missing.map(m => MISSING_HI[m] ?? m),
    basisNotes: r.basisNotes.map(ruleText),
    rulesVersion: ruleText(r.rulesVersion),
  }
}
