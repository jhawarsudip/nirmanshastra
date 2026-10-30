'use client'

import { useMemo, useState } from 'react'
import { useL } from '@/lib/i18n/labels/calc-l'
import { useTr } from '@/lib/i18n/use-tr'
import { PAINT_TILE_DICT, WASTE_TEXT_HI } from '@/lib/i18n/labels/calc-paint-tile'
import { ToolHead, Field, Input, Select, Note } from '@/components/v2/inner/kit'
import { ReportTable } from '@/components/v2/qty/parts'
import {
  CalcPage, CalcGrid, CalcLabel, Big, Figures, Rows, Chips, CalcSection, Prose, Formula, CalcCta, CalcFine,
} from '@/components/v2/inner/calc'
import {
  IN_SYS,
  TILES,
  TIER_ORDER,
  TIER_NAME,
  TILE_ORDER,
  calculatePaint,
  calculateTiles,
  type Lay,
  type PaintTier,
  type TileFixing,
  type TileKey,
  type TileWhere,
  type Unit,
} from './paint-tile-engine'
import QuickAnswer from '@/components/seo/QuickAnswer'
import CalcFaq from '@/components/seo/CalcFaq'
import RelatedLinks from '@/components/seo/RelatedLinks'
import { PAINT_TILE_CONTENT } from '@/lib/seo/calc-content'

type Mode = 'paint' | 'tiles'

const num = (n: number, dp: number) => n.toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })
const pct = (f: number) => `${num(f * 100, 0)}%`

const WASTE_TEXT = (lay: Lay, small: boolean, large: boolean) =>
  small ? 'a small room or bathroom: more tiles are cut' : lay === 'diagonal' ? (large ? 'diagonal lay of a large tile' : 'diagonal lay') : large ? 'a large tile breaks more in cutting' : 'straight lay of a small tile'

export default function PaintTileCalculatorPage() {
  const { hi, L } = useL()
  const t = useTr(PAINT_TILE_DICT)
  const [mode, setMode] = useState<Mode>('paint')
  const [areaText, setAreaText] = useState('1000')
  const [unit, setUnit] = useState<Unit>('sqft')
  const [tier, setTier] = useState<PaintTier>('standard')
  const [size, setSize] = useState<TileKey>('600x600')
  const [lay, setLay] = useState<Lay>('straight')
  const [small, setSmall] = useState(false)
  const [where, setWhere] = useState<TileWhere>('floor')
  const [fixing, setFixing] = useState<TileFixing>('mortar')

  const area = Math.max(0, parseFloat(areaText || '0') || 0)
  const valid = area > 0
  const unitText = unit === 'sqft' ? 'sq ft' : 'm²'
  const paint = useMemo(() => calculatePaint({ area, unit, tier }), [area, unit, tier])
  const tiles = useMemo(() => calculateTiles({ area, unit, size, lay, small, where, fixing }), [area, unit, size, lay, small, where, fixing])
  const sys = IN_SYS[tier]
  const tile = TILES[size]

  // worked examples, worked by the same functions
  const exPaint = TIER_ORDER.map((t) => calculatePaint({ area: 1000, unit: 'sqft', tier: t }))
  const exTile = calculateTiles({ area: 100, unit: 'm2', size: '600x600', lay: 'straight', small: false, where: 'floor', fixing: 'mortar' })

  const waste = hi ? WASTE_TEXT_HI : WASTE_TEXT
  const asEntered = L('as entered', 'जैसा डाला')

  return (
    <CalcPage>
      <ToolHead
        eyebrow={L('Free calculator · no sign-in', 'मुफ़्त कैलकुलेटर · बिना साइन-इन')}
        name={L('Paint and Tile Calculator', 'पेंट और टाइल कैलकुलेटर')}
        blurb={L(
          'Find the paint, putty and primer for a wall or ceiling, or the tiles, grout and fixing for a floor or wall. Enter the area and pick the finish; the quantities, and how they change from one finish to the next, follow.',
          'दीवार या छत के लिए पेंट, पुट्टी और प्राइमर निकालिए, या फ़र्श या दीवार के लिए टाइल, ग्राउट और फ़िक्सिंग। एरिया डालिए और फ़िनिश चुनिए; मात्राएँ, और एक फ़िनिश से दूसरी में वे कैसे बदलती हैं, आगे दिखती हैं।',
        )}
      />
      <QuickAnswer content={PAINT_TILE_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>{L('The surface', 'सतह')}</CalcLabel>
            <div className="ns-i-fields">
              <Field id="pt-mode" label={L('What are you finishing?', 'आप क्या फ़िनिश कर रहे हैं?')} wide>
                <Select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                  <option value="paint">{L('Walls and ceilings: paint', 'दीवारें और छतें: पेंट')}</option>
                  <option value="tiles">{L('A floor or wall: tiles', 'फ़र्श या दीवार: टाइल')}</option>
                </Select>
              </Field>
              <Field
                id="pt-area"
                label={mode === 'paint' ? L('Area to paint', 'पेंट करने का एरिया') : L('Area to tile', 'टाइल लगाने का एरिया')}
                hint={
                  mode === 'paint'
                    ? L(
                        'Walls and ceiling together. For a room: the distance around it times the height, plus the floor area, less doors and windows over half a square metre.',
                        'दीवारें और छत मिलाकर। एक कमरे के लिए: उसके चारों ओर की दूरी गुणा ऊँचाई, जमा फ़र्श का एरिया, आधे वर्ग मीटर से बड़े दरवाज़े और खिड़कियाँ घटाकर।',
                      )
                    : L(
                        'The area of the floor or wall, before the extra for cutting. Take out anything that is not tiled.',
                        'फ़र्श या दीवार का एरिया, कटिंग के अतिरिक्त से पहले। जो हिस्सा टाइल नहीं होगा, उसे घटा दीजिए।',
                      )
                }
              >
                <Input type="number" inputMode="decimal" min={0} step="any" value={areaText} onChange={(e) => setAreaText(e.target.value)} placeholder="0" />
              </Field>
              <Field id="pt-unit" label={L('Unit', 'इकाई')}>
                <Select value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
                  <option value="sqft">sq ft</option>
                  <option value="m2">m²</option>
                </Select>
              </Field>
              {mode === 'paint' ? (
                <Field id="pt-tier" label={L('Paint system', 'पेंट सिस्टम')} wide hint={t(sys.coats)}>
                  <Select value={tier} onChange={(e) => setTier(e.target.value as PaintTier)}>
                    {TIER_ORDER.map((k) => (
                      <option key={k} value={k}>{t(IN_SYS[k].label)}</option>
                    ))}
                  </Select>
                </Field>
              ) : (
                <>
                  <Field id="pt-size" label={L('Tile size', 'टाइल का साइज़')} wide>
                    <Select value={size} onChange={(e) => setSize(e.target.value as TileKey)}>
                      {TILE_ORDER.map((k) => (
                        <option key={k} value={k}>{TILES[k].label}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field id="pt-where" label={L('Where?', 'कहाँ?')}>
                    <Select value={where} onChange={(e) => setWhere(e.target.value as TileWhere)}>
                      <option value="floor">{L('Floor', 'फ़र्श')}</option>
                      <option value="wall">{L('Wall', 'दीवार')}</option>
                    </Select>
                  </Field>
                  <Field id="pt-lay" label={L('How laid?', 'कैसे बिछाई?')}>
                    <Select value={lay} onChange={(e) => setLay(e.target.value as Lay)}>
                      <option value="straight">{L('Straight', 'सीधी')}</option>
                      <option value="diagonal">{L('Diagonal', 'तिरछी')}</option>
                    </Select>
                  </Field>
                  <Field id="pt-small" label={L('Small room or bathroom?', 'छोटा कमरा या बाथरूम?')}>
                    <Select value={small ? 'yes' : 'no'} onChange={(e) => setSmall(e.target.value === 'yes')}>
                      <option value="no">{L('No', 'नहीं')}</option>
                      <option value="yes">{L('Yes: more tiles are cut', 'हाँ: ज़्यादा टाइलें कटती हैं')}</option>
                    </Select>
                  </Field>
                  <Field id="pt-fix" label={L('Fixed with', 'किससे लगाई?')}>
                    <Select value={fixing} onChange={(e) => setFixing(e.target.value as TileFixing)}>
                      <option value="mortar">{L('Cement mortar bed', 'सीमेंट मसाले की परत')}</option>
                      <option value="adhesive">{L('Tile adhesive', 'टाइल एडहेसिव')}</option>
                    </Select>
                  </Field>
                </>
              )}
            </div>
          </>
        }
        result={
          !valid ? (
            <p className="ns-calc-empty">{L('Enter the area to see what it needs.', 'क्या-क्या लगेगा, यह देखने के लिए एरिया डालिए।')}</p>
          ) : mode === 'paint' ? (
            <>
              <Big
                k={L(`${sys.finish.label}, to buy`, `${t(sys.finish.label)}, ख़रीदने के लिए`)}
                v={num(paint.finishL, 1)}
                unit={L('litres', 'लीटर')}
                sub={`${num(area, 0)} ${unitText} = ${num(paint.m2, 1)} m²`}
              />
              <Figures
                items={[
                  { k: L('Primer', 'प्राइमर'), v: num(paint.primerL, 1), unit: 'L', tone: 'ok' },
                  {
                    k: sys.putty ? t(sys.putty.label) : L('Putty', 'पुट्टी'),
                    v: sys.putty ? num(paint.puttyKg, 1) : L('None', 'कोई नहीं'),
                    unit: sys.putty ? 'kg' : undefined,
                    tone: sys.putty ? 'ok' : undefined,
                  },
                ]}
              />
              {!sys.putty ? (
                <Note kind="info" title={L('No putty with this system', 'इस सिस्टम में पुट्टी नहीं')}>
                  {L(
                    'Distemper goes straight over primer on the plaster. Choose Standard or Premium for a smooth putty finish under emulsion.',
                    'डिस्टेंपर प्लास्टर पर प्राइमर के ऊपर सीधे लगता है। इमल्शन के नीचे चिकनी पुट्टी की फ़िनिश के लिए स्टैंडर्ड या प्रीमियम चुनिए।',
                  )}
                </Note>
              ) : null}

              <CalcLabel>{L('The working', 'हिसाब')}</CalcLabel>
              <Rows
                rows={[
                  { label: L('Area', 'एरिया'), detail: unit === 'sqft' ? `${num(area, 0)} sq ft × 0.0929` : asEntered, value: `${num(paint.m2, 1)} m²` },
                  ...(sys.putty
                    ? [{ label: L('Putty', 'पुट्टी'), detail: L(`${num(sys.putty.kg, 2)} kg a m², +5%`, `${num(sys.putty.kg, 2)} kg प्रति m², +5%`), value: `${num(paint.puttyKg, 1)} kg`, tone: 'ok' as const }]
                    : []),
                  { label: L('Primer', 'प्राइमर'), detail: L(`${num(sys.primer.l, 3)} L a m², +5%`, `${num(sys.primer.l, 3)} L प्रति m², +5%`), value: `${num(paint.primerL, 1)} L`, tone: 'ok' },
                  { label: t(sys.finish.label), detail: L(`${num(sys.finish.l, 3)} L a m², +5%`, `${num(sys.finish.l, 3)} L प्रति m², +5%`), value: `${num(paint.finishL, 1)} L`, tone: 'ok' },
                ]}
              />
              <p className="ns-calc-help">
                <strong>{t(sys.label)}.</strong> {t(sys.coats)}. {t(sys.finish.src)}.{' '}
                {L(
                  'All figures include 5% for paint left in the tin and the brush; no sheet gives that allowance, so it is an assumption.',
                  'सभी आँकड़ों में टिन और ब्रश में बचे पेंट के लिए 5% शामिल है; कोई शीट यह अतिरिक्त मात्रा नहीं देती, इसलिए यह एक मान्यता है।',
                )}
              </p>
            </>
          ) : (
            <>
              <Big
                k={L(`${tile.label} tiles, to buy`, `${tile.label} टाइलें, ख़रीदने के लिए`)}
                v={num(tiles.pcs, 0)}
                unit={
                  tiles.boxes !== null
                    ? L(`tiles · ${num(tiles.boxes, 0)} boxes`, `टाइलें · ${num(tiles.boxes, 0)} बॉक्स`)
                    : L('tiles', 'टाइलें')
                }
                sub={L(
                  `${num(area, 0)} ${unitText} = ${num(tiles.netM2, 1)} m², plus ${pct(tiles.waste)} for cutting`,
                  `${num(area, 0)} ${unitText} = ${num(tiles.netM2, 1)} m², और कटिंग के लिए ${pct(tiles.waste)} अतिरिक्त`,
                )}
              />
              <Figures
                items={[
                  { k: L('Tile area to buy', 'ख़रीदने के लिए टाइल एरिया'), v: num(tiles.buyM2, 1), unit: 'm²', tone: 'ok' },
                  { k: L('Grout', 'ग्राउट'), v: num(tiles.groutKg, 1), unit: 'kg', tone: 'ok' },
                  fixing === 'mortar'
                    ? { k: L('Cement for the bed', 'परत के लिए सीमेंट'), v: num(tiles.cementBags, 0), unit: L('bags', 'बैग'), tone: 'ok' }
                    : { k: L('Tile adhesive', 'टाइल एडहेसिव'), v: num(tiles.adhesiveBags, 0), unit: L('bags of 20 kg', '20 kg के बैग'), tone: 'ok' },
                ]}
              />

              <CalcLabel>{L('The working', 'हिसाब')}</CalcLabel>
              <Rows
                rows={[
                  { label: L('Area', 'एरिया'), detail: unit === 'sqft' ? `${num(area, 0)} sq ft × 0.0929` : asEntered, value: `${num(tiles.netM2, 2)} m²` },
                  { label: L('Extra for cutting', 'कटिंग के लिए अतिरिक्त'), detail: waste(lay, small, tile.large), value: pct(tiles.waste) },
                  { label: L('Tile area to buy', 'ख़रीदने के लिए टाइल एरिया'), detail: '', value: `${num(tiles.buyM2, 2)} m²` },
                  {
                    label: L('Tiles a m²', 'प्रति m² टाइलें'),
                    detail: L(`with a ${num(tile.J * 1000, 0)} mm joint`, `${num(tile.J * 1000, 0)} mm जोड़ के साथ`),
                    value: num(tiles.perM2, 2),
                  },
                  { label: L('Tiles to buy', 'ख़रीदने की टाइलें'), detail: L('rounded up', 'ऊपर के पूर्णांक में'), value: num(tiles.pcs, 0), tone: 'ok' },
                  ...(tiles.boxes !== null
                    ? [{
                        label: L('Boxes', 'बॉक्स'),
                        detail: L(`${tile.pcsBox} tiles in a box`, `एक बॉक्स में ${tile.pcsBox} टाइलें`),
                        value: num(tiles.boxes, 0),
                        tone: 'ok' as const,
                      }]
                    : []),
                  { label: L('Grout', 'ग्राउट'), detail: L('joint geometry, +10%', 'जोड़ की माप से, +10%'), value: `${num(tiles.groutKg, 1)} kg` },
                  ...(fixing === 'mortar'
                    ? [
                        {
                          label: L('Cement for the bed', 'परत के लिए सीमेंट'),
                          detail: L(`${tiles.netM2 > 0 ? num(tiles.cementKg / tiles.netM2, 1) : '0'} kg a m²`, `${tiles.netM2 > 0 ? num(tiles.cementKg / tiles.netM2, 1) : '0'} kg प्रति m²`),
                          value: L(`${num(tiles.cementKg, 0)} kg · ${num(tiles.cementBags, 0)} bags`, `${num(tiles.cementKg, 0)} kg · ${num(tiles.cementBags, 0)} बैग`),
                        },
                        {
                          label: L('Sand for the bed', 'परत के लिए रेत'),
                          detail: where === 'floor' ? L('22 litres a m²', '22 लीटर प्रति m²') : L('12.5 litres a m²', '12.5 लीटर प्रति m²'),
                          value: `${num(tiles.sandM3, 2)} m³`,
                        },
                      ]
                    : [{
                        label: L('Tile adhesive', 'टाइल एडहेसिव'),
                        detail: L(`${num(tiles.adhesiveKg / Math.max(tiles.netM2, 1e-9), 2)} kg a m²`, `${num(tiles.adhesiveKg / Math.max(tiles.netM2, 1e-9), 2)} kg प्रति m²`),
                        value: L(`${num(tiles.adhesiveKg, 0)} kg · ${num(tiles.adhesiveBags, 0)} bags`, `${num(tiles.adhesiveKg, 0)} kg · ${num(tiles.adhesiveBags, 0)} बैग`),
                      }]),
                ]}
              />
              <p className="ns-calc-help">
                {L(
                  'Wastage is the allowance for cutting and breakage; no standard gives it, so the percentages are assumptions: 5% for a small tile laid straight, 10% for a large tile, a diagonal lay of a small tile, or a small room, and 15% for a large tile laid diagonally. The tile count is the area to buy times the tiles a m², rounded up.',
                  'वेस्टेज वह अतिरिक्त मात्रा है जो कटिंग और टूट-फूट के लिए जोड़ी जाती है; कोई मानक इसे नहीं देता, इसलिए ये प्रतिशत मान्यताएँ हैं: सीधी बिछी छोटी टाइल के लिए 5%, बड़ी टाइल, छोटी टाइल की तिरछी बिछाई या छोटे कमरे के लिए 10%, और तिरछी बिछी बड़ी टाइल के लिए 15%। टाइलों की गिनती ख़रीदने वाले एरिया को प्रति m² टाइलों से गुणा करके, ऊपर के पूर्णांक में निकलती है।',
                )}
              </p>
            </>
          )
        }
      />

      <CalcCta
        kicker={L('Finishing the whole house?', 'पूरे घर की फ़िनिशिंग करनी है?')}
        text={L(
          'This page counts one surface. InteriorPro measures every wall, ceiling and floor from your plan, the way IS 1200 does, and counts the paint, putty, primer, tiles, grout, fixing, false ceiling, doors, windows and carpentry sheets.',
          'यह पेज एक सतह गिनता है। InteriorPro आपके नक्शे से हर दीवार, छत और फ़र्श को IS 1200 के तरीक़े से नापता है, और पेंट, पुट्टी, प्राइमर, टाइल, ग्राउट, फ़िक्सिंग, फ़ॉल्स सीलिंग, दरवाज़े, खिड़कियाँ और कारपेंट्री की शीटें गिनता है।',
        )}
        href="/tools/interiorpro"
        label={L('Open InteriorPro', 'InteriorPro खोलिए')}
      />

      {valid && mode === 'paint' ? (
        <CalcSection
          title={L('The three paint systems side by side', 'तीनों पेंट सिस्टम एक साथ')}
          sub={L(
            `For ${num(area, 0)} ${unitText} of wall and ceiling. Each figure includes 5% wastage.`,
            `${num(area, 0)} ${unitText} दीवार और छत के लिए। हर आँकड़े में 5% वेस्टेज शामिल है।`,
          )}
        >
          <ReportTable
            head={[L('System', 'सिस्टम'), L('Putty (kg)', 'पुट्टी (kg)'), L('Primer (L)', 'प्राइमर (L)'), L('Paint (L)', 'पेंट (L)')]}
            num={[1, 2, 3]}
            rows={paint.all.map((p) => [t(TIER_NAME[p.tier]), p.system.putty ? num(p.puttyKg, 1) : L('none', 'नहीं'), num(p.primerL, 1), num(p.finishL, 1)])}
          />
          <p className="ns-r-tblnote">
            {L(
              'Economy is distemper over primer. Standard adds cement putty and uses an emulsion. Premium uses a finer acrylic putty, which goes on thinner, and a luxury emulsion that spreads less far, so it takes more paint but less putty.',
              'इकोनॉमी में प्राइमर पर डिस्टेंपर लगता है। स्टैंडर्ड में सीमेंट पुट्टी जुड़ती है और इमल्शन लगता है। प्रीमियम में ज़्यादा बारीक एक्रिलिक पुट्टी लगती है, जो पतली चढ़ती है, और लक्ज़री इमल्शन, जो कम दूर तक फैलता है, इसलिए पेंट ज़्यादा लगता है पर पुट्टी कम।',
            )}
          </p>
        </CalcSection>
      ) : null}

      {valid && mode === 'tiles' ? (
        <CalcSection
          title={L('The same area in each tile size', 'हर टाइल साइज़ में वही एरिया')}
          sub={
            hi
              ? `${num(area, 0)} ${unitText}, ${where === 'floor' ? 'फ़र्श' : 'दीवार'}, ${lay === 'straight' ? 'सीधी' : 'तिरछी'} बिछाई${small ? ', छोटे कमरे में' : ''}।`
              : `For ${num(area, 0)} ${unitText}, ${where === 'floor' ? 'floor' : 'wall'}, laid ${lay}${small ? ', in a small room' : ''}.`
          }
        >
          <ReportTable
            head={[
              L('Tile', 'टाइल'),
              L('Extra for cutting', 'कटिंग के लिए अतिरिक्त'),
              L('Tiles', 'टाइलें'),
              L('Boxes', 'बॉक्स'),
              L('Grout (kg)', 'ग्राउट (kg)'),
            ]}
            num={[1, 2, 3, 4]}
            rows={tiles.all.map((x) => [x.tile.label, pct(x.waste), num(x.pcs, 0), x.boxes !== null ? num(x.boxes, 0) : '–', num(x.groutKg, 1)])}
          />
          <p className="ns-r-tblnote">
            {L(
              'A larger tile needs fewer tiles and less grout, because there is less joint, but more of it is lost in cutting. The 300 × 300 mm tile is not counted in boxes: boxes of that size vary too much to fix a figure.',
              'बड़ी टाइल में टाइलें कम लगती हैं और ग्राउट भी कम, क्योंकि जोड़ कम होते हैं, पर कटिंग में उसका ज़्यादा हिस्सा बेकार जाता है। 300 × 300 mm टाइल की गिनती बॉक्स में नहीं की जाती: उस साइज़ के बॉक्स इतने अलग-अलग होते हैं कि कोई आँकड़ा तय नहीं किया जा सकता।',
            )}
          </p>
        </CalcSection>
      ) : null}

      <article className="ns-calc-articles">
        <Prose title={L('How much paint a wall takes', 'दीवार पर कितना पेंट लगता है')}>
          {hi ? (
            <>
              <p>
                पेंट, पुट्टी और प्राइमर की गिनती <strong>एरिया</strong> और <strong>फैलाव (स्प्रेड)</strong> से होती है: एक लीटर या एक किलोग्राम अपने सभी कोट मिलाकर कितने वर्ग मीटर ढकता है। कैलकुलेटर हर सिस्टम का फैलाव निर्माताओं की डेटा शीट से लेता है, और प्राइमर का 0.070 लीटर प्रति m² CPWD के दर विश्लेषण (2016) से। टिन और ब्रश में जो बचा रह जाता है, उसके लिए 5% जोड़िए।
              </p>
              <Formula>1,000 sq ft = 92.9 m² · स्टैंडर्ड: {num(exPaint[1].puttyKg, 1)} kg पुट्टी, {num(exPaint[1].primerL, 1)} L प्राइमर, {num(exPaint[1].finishL, 1)} L इमल्शन</Formula>
              <p>
                एरिया उसी तरह नापा जाता है जैसे IS 1200 (भाग 13) पेंट नापता है: आधे वर्ग मीटर तक के खुले हिस्से (दरवाज़े-खिड़कियाँ) घटाए नहीं जाते, और आधे से तीन वर्ग मीटर तक के खुले हिस्सों की एक तरफ़ की सतह घटाई जाती है। छत भी पेंट में गिनी जाती है। प्लास्टर यहाँ नहीं गिना जाता; वह MasonryPro का हिस्सा है।
              </p>
            </>
          ) : (
            <>
              <p>
                Paint, putty and primer are counted from the <strong>area</strong> and the <strong>spread</strong>: how many square metres a litre or a kilogram covers over all its coats. The calculator uses the spread of each system from the makers’ data sheets, and 0.070 litres of primer a m² from the CPWD analysis of rates (2016). Add 5% for what is left in the tin and the brush.
              </p>
              <Formula>1,000 sq ft = 92.9 m² · Standard: {num(exPaint[1].puttyKg, 1)} kg putty, {num(exPaint[1].primerL, 1)} L primer, {num(exPaint[1].finishL, 1)} L emulsion</Formula>
              <p>
                The area is measured the way IS 1200 (Part 13) measures paint: openings up to half a square metre are not taken out, and openings from half to three square metres have one face taken out. The ceiling counts as paint too. Plaster is not counted here; it belongs to MasonryPro.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('Three systems, three amounts', 'तीन सिस्टम, तीन मात्राएँ')}>
          {hi ? (
            <p>
              <strong>इकोनॉमी</strong> प्राइमर के एक कोट पर एक्रिलिक डिस्टेंपर है, बिना पुट्टी के। <strong>स्टैंडर्ड</strong> में लगभग 1 mm मोटी सीमेंट पुट्टी, प्राइमर का एक कोट और इमल्शन के दो कोट जुड़ते हैं। <strong>प्रीमियम</strong> में एक्रिलिक पुट्टी के दो कोट और लक्ज़री इमल्शन लगता है। 1,000 वर्ग फ़ुट दीवार और छत के लिए फ़िनिश कोट के {num(exPaint[0].finishL, 1)}, {num(exPaint[1].finishL, 1)} और {num(exPaint[2].finishL, 1)} लीटर बनते हैं।
            </p>
          ) : (
            <p>
              <strong>Economy</strong> is acrylic distemper over a coat of primer, with no putty. <strong>Standard</strong> adds a cement putty, about 1 mm thick, one coat of primer and two coats of emulsion. <strong>Premium</strong> uses an acrylic putty in two coats and a luxury emulsion. For 1,000 sq ft of wall and ceiling that is {num(exPaint[0].finishL, 1)}, {num(exPaint[1].finishL, 1)} and {num(exPaint[2].finishL, 1)} litres of finish coat.
            </p>
          )}
        </Prose>

        <Prose title={L('How many tiles an area takes', 'एक एरिया में कितनी टाइलें लगती हैं')}>
          {hi ? (
            <>
              <p>
                एक टाइल और उसका जोड़ (लंबाई + जोड़) × (चौड़ाई + जोड़) ढकते हैं। 2 mm जोड़ वाली 600 × 600 mm टाइल के लिए यह 0.602 × 0.602 m है, इसलिए <strong>एक वर्ग मीटर में {num(exTile.perM2, 2)} टाइलें लगती हैं</strong>। ख़रीदने की टाइलें एरिया में कटिंग की अतिरिक्त मात्रा जोड़कर, उस आँकड़े से गुणा करके, ऊपर के पूर्णांक में निकलती हैं।
              </p>
              <Formula>100 m² + {pct(exTile.waste)} = {num(exTile.buyM2, 0)} m² · × {num(exTile.perM2, 2)} = {num(exTile.pcs, 0)} टाइलें · {num(exTile.boxes ?? 0, 0)} बॉक्स (हर बॉक्स में 4)</Formula>
              <p>
                बाथरूम, बालकनी और रसोई के फ़र्श की टाइलें विट्रिफ़ाइड या पोर्सिलेन होनी चाहिए (पानी सोखना 0.08% तक, IS 15622:2006 का समूह BIa); ग्लेज़्ड सिरेमिक दीवारों के लिए है। कैलकुलेटर आपके चुने साइज़ की गिनती करता है; समूह आप दुकान पर चुनते हैं।
              </p>
            </>
          ) : (
            <>
              <p>
                One tile and its joint cover (length + joint) × (width + joint). For a 600 × 600 mm tile with a 2 mm joint that is 0.602 × 0.602 m, so <strong>{num(exTile.perM2, 2)} tiles cover a square metre</strong>. The tiles to buy are the area plus the allowance for cutting, times that figure, rounded up.
              </p>
              <Formula>100 m² + {pct(exTile.waste)} = {num(exTile.buyM2, 0)} m² · × {num(exTile.perM2, 2)} = {num(exTile.pcs, 0)} tiles · {num(exTile.boxes ?? 0, 0)} boxes of 4</Formula>
              <p>
                Floor tiles for bathrooms, balconies and kitchens should be vitrified or porcelain (water absorption up to 0.08%, group BIa of IS 15622:2006); glazed ceramic is for walls. The calculator counts the size you pick; the group is your choice at the shop.
              </p>
            </>
          )}
        </Prose>

        <Prose title={L('Grout, mortar and adhesive', 'ग्राउट, मसाला और एडहेसिव')}>
          {hi ? (
            <>
              <p>
                <strong>ग्राउट</strong> जोड़ों से निकलता है: एक वर्ग मीटर में जोड़ की लंबाई, गुणा उसकी चौड़ाई और टाइल की मोटाई, गुणा ग्राउट का घनत्व 1.6 kg प्रति लीटर (यह एक मान्यता है; 1.4 से 1.6), और वेस्टेज के लिए 10%। <strong>सीमेंट मसाले की परत</strong> में फ़र्श की टाइल के नीचे प्रति m² लगभग 11.0 kg सीमेंट और 22 लीटर रेत लगती है, और दीवार की टाइल के नीचे 9.2 kg और 12.5 लीटर, CPWD के आइटम के पाठ से। <strong>टाइल एडहेसिव</strong> में 900 cm² तक की टाइलों के लिए 5.25 kg प्रति m², 3,600 cm² तक 10.5 kg और उससे बड़ी के लिए 12 kg लगता है, निर्माता की शीट से; सबसे बड़ा आँकड़ा एक मान्यता है।
              </p>
              <p>
                एडहेसिव के लिए समतल, पक्का (क्योर हो चुका) फ़र्श चाहिए। उसके नीचे की लेवलिंग स्क्रीड यहाँ नहीं गिनी गई है।
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>Grout</strong> is worked from the joints: the length of joint in a square metre, times its width and the tile thickness, times a grout density of 1.6 kg a litre (an assumption; 1.4 to 1.6), with 10% for waste. <strong>A cement mortar bed</strong> takes about 11.0 kg of cement and 22 litres of sand a m² under a floor tile, and 9.2 kg and 12.5 litres under a wall tile, from the CPWD item text. <strong>Tile adhesive</strong> takes 5.25 kg a m² for tiles up to 900 cm², 10.5 kg up to 3,600 cm² and 12 kg above that, from a maker’s sheet; the largest figure is an assumption.
              </p>
              <p>
                Adhesive needs a level, cured floor. A levelling screed under it is not counted here.
              </p>
            </>
          )}
        </Prose>
      </article>

      <CalcFaq items={PAINT_TILE_CONTENT.faq} />
      <RelatedLinks path="/tools/paint-tile-calculator" />

      <Chips codes={hi ? ['IS 1200 (भाग 11, 13)', 'IS 15622:2006', 'CPWD दर विश्लेषण 2016'] : ['IS 1200 (Part 11, 13)', 'IS 15622:2006', 'CPWD DAR 2016']} />
      <CalcFine>
        {L(
          'For planning. The spread of paint and the coverage of adhesive differ from maker to maker, and the wastage depends on the room and the tiler, so check the maker’s sheet and let the tiler confirm the count. The quantities cover one surface; a house is measured from its plan. Not a substitute for that.',
          'योजना बनाने के लिए। पेंट का फैलाव और एडहेसिव का कवरेज निर्माता-निर्माता में अलग होता है, और वेस्टेज कमरे और टाइल लगाने वाले मिस्त्री पर निर्भर है, इसलिए निर्माता की शीट देखिए और गिनती टाइल मिस्त्री से पक्की करवाइए। मात्राएँ एक सतह की हैं; घर नक्शे से नापा जाता है। यह उसकी जगह नहीं ले सकता।',
        )}
      </CalcFine>
    </CalcPage>
  )
}
