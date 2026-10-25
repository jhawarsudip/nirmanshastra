'use client'

import { useMemo, useState } from 'react'
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

  return (
    <CalcPage>
      <ToolHead
        eyebrow="Free calculator · no sign-in"
        name="Paint and Tile Calculator"
        blurb="Find the paint, putty and primer for a wall or ceiling, or the tiles, grout and fixing for a floor or wall. Enter the area and pick the finish; the quantities, and how they change from one finish to the next, follow."
      />
      <QuickAnswer content={PAINT_TILE_CONTENT} />

      <CalcGrid
        input={
          <>
            <CalcLabel>The surface</CalcLabel>
            <div className="ns-i-fields">
              <Field id="pt-mode" label="What are you finishing?" wide>
                <Select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
                  <option value="paint">Walls and ceilings: paint</option>
                  <option value="tiles">A floor or wall: tiles</option>
                </Select>
              </Field>
              <Field
                id="pt-area"
                label={mode === 'paint' ? 'Area to paint' : 'Area to tile'}
                hint={mode === 'paint' ? 'Walls and ceiling together. For a room: the distance around it times the height, plus the floor area, less doors and windows over half a square metre.' : 'The area of the floor or wall, before the extra for cutting. Take out anything that is not tiled.'}
              >
                <Input type="number" inputMode="decimal" min={0} step="any" value={areaText} onChange={(e) => setAreaText(e.target.value)} placeholder="0" />
              </Field>
              <Field id="pt-unit" label="Unit">
                <Select value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
                  <option value="sqft">sq ft</option>
                  <option value="m2">m²</option>
                </Select>
              </Field>
              {mode === 'paint' ? (
                <Field id="pt-tier" label="Paint system" wide hint={sys.coats}>
                  <Select value={tier} onChange={(e) => setTier(e.target.value as PaintTier)}>
                    {TIER_ORDER.map((t) => (
                      <option key={t} value={t}>{IN_SYS[t].label}</option>
                    ))}
                  </Select>
                </Field>
              ) : (
                <>
                  <Field id="pt-size" label="Tile size" wide>
                    <Select value={size} onChange={(e) => setSize(e.target.value as TileKey)}>
                      {TILE_ORDER.map((k) => (
                        <option key={k} value={k}>{TILES[k].label}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field id="pt-where" label="Where?">
                    <Select value={where} onChange={(e) => setWhere(e.target.value as TileWhere)}>
                      <option value="floor">Floor</option>
                      <option value="wall">Wall</option>
                    </Select>
                  </Field>
                  <Field id="pt-lay" label="How laid?">
                    <Select value={lay} onChange={(e) => setLay(e.target.value as Lay)}>
                      <option value="straight">Straight</option>
                      <option value="diagonal">Diagonal</option>
                    </Select>
                  </Field>
                  <Field id="pt-small" label="Small room or bathroom?">
                    <Select value={small ? 'yes' : 'no'} onChange={(e) => setSmall(e.target.value === 'yes')}>
                      <option value="no">No</option>
                      <option value="yes">Yes: more tiles are cut</option>
                    </Select>
                  </Field>
                  <Field id="pt-fix" label="Fixed with">
                    <Select value={fixing} onChange={(e) => setFixing(e.target.value as TileFixing)}>
                      <option value="mortar">Cement mortar bed</option>
                      <option value="adhesive">Tile adhesive</option>
                    </Select>
                  </Field>
                </>
              )}
            </div>
          </>
        }
        result={
          !valid ? (
            <p className="ns-calc-empty">Enter the area to see what it needs.</p>
          ) : mode === 'paint' ? (
            <>
              <Big k={`${sys.finish.label}, to buy`} v={num(paint.finishL, 1)} unit="litres" sub={`${num(area, 0)} ${unitText} = ${num(paint.m2, 1)} m²`} />
              <Figures
                items={[
                  { k: 'Primer', v: num(paint.primerL, 1), unit: 'L', tone: 'ok' },
                  { k: sys.putty ? sys.putty.label : 'Putty', v: sys.putty ? num(paint.puttyKg, 1) : 'None', unit: sys.putty ? 'kg' : undefined, tone: sys.putty ? 'ok' : undefined },
                ]}
              />
              {!sys.putty ? (
                <Note kind="info" title="No putty with this system">
                  Distemper goes straight over primer on the plaster. Choose Standard or Premium for a smooth putty finish under emulsion.
                </Note>
              ) : null}

              <CalcLabel>The working</CalcLabel>
              <Rows
                rows={[
                  { label: 'Area', detail: unit === 'sqft' ? `${num(area, 0)} sq ft × 0.0929` : 'as entered', value: `${num(paint.m2, 1)} m²` },
                  ...(sys.putty
                    ? [{ label: 'Putty', detail: `${num(sys.putty.kg, 2)} kg a m², +5%`, value: `${num(paint.puttyKg, 1)} kg`, tone: 'ok' as const }]
                    : []),
                  { label: 'Primer', detail: `${num(sys.primer.l, 3)} L a m², +5%`, value: `${num(paint.primerL, 1)} L`, tone: 'ok' },
                  { label: sys.finish.label, detail: `${num(sys.finish.l, 3)} L a m², +5%`, value: `${num(paint.finishL, 1)} L`, tone: 'ok' },
                ]}
              />
              <p className="ns-calc-help">
                <strong>{sys.label}.</strong> {sys.coats}. {sys.finish.src}. All figures include 5% for paint left in the tin and the brush; no sheet gives that allowance, so it is an assumption.
              </p>
            </>
          ) : (
            <>
              <Big
                k={`${tile.label} tiles, to buy`}
                v={num(tiles.pcs, 0)}
                unit={tiles.boxes !== null ? `tiles · ${num(tiles.boxes, 0)} boxes` : 'tiles'}
                sub={`${num(area, 0)} ${unitText} = ${num(tiles.netM2, 1)} m², plus ${pct(tiles.waste)} for cutting`}
              />
              <Figures
                items={[
                  { k: 'Tile area to buy', v: num(tiles.buyM2, 1), unit: 'm²', tone: 'ok' },
                  { k: 'Grout', v: num(tiles.groutKg, 1), unit: 'kg', tone: 'ok' },
                  fixing === 'mortar'
                    ? { k: 'Cement for the bed', v: num(tiles.cementBags, 0), unit: 'bags', tone: 'ok' }
                    : { k: 'Tile adhesive', v: num(tiles.adhesiveBags, 0), unit: 'bags of 20 kg', tone: 'ok' },
                ]}
              />

              <CalcLabel>The working</CalcLabel>
              <Rows
                rows={[
                  { label: 'Area', detail: unit === 'sqft' ? `${num(area, 0)} sq ft × 0.0929` : 'as entered', value: `${num(tiles.netM2, 2)} m²` },
                  { label: 'Extra for cutting', detail: WASTE_TEXT(lay, small, tile.large), value: pct(tiles.waste) },
                  { label: 'Tile area to buy', detail: '', value: `${num(tiles.buyM2, 2)} m²` },
                  { label: 'Tiles a m²', detail: `with a ${num(tile.J * 1000, 0)} mm joint`, value: num(tiles.perM2, 2) },
                  { label: 'Tiles to buy', detail: 'rounded up', value: num(tiles.pcs, 0), tone: 'ok' },
                  ...(tiles.boxes !== null ? [{ label: 'Boxes', detail: `${tile.pcsBox} tiles in a box`, value: num(tiles.boxes, 0), tone: 'ok' as const }] : []),
                  { label: 'Grout', detail: 'joint geometry, +10%', value: `${num(tiles.groutKg, 1)} kg` },
                  ...(fixing === 'mortar'
                    ? [
                        { label: 'Cement for the bed', detail: `${tiles.netM2 > 0 ? num(tiles.cementKg / tiles.netM2, 1) : '0'} kg a m²`, value: `${num(tiles.cementKg, 0)} kg · ${num(tiles.cementBags, 0)} bags` },
                        { label: 'Sand for the bed', detail: where === 'floor' ? '22 litres a m²' : '12.5 litres a m²', value: `${num(tiles.sandM3, 2)} m³` },
                      ]
                    : [{ label: 'Tile adhesive', detail: `${num(tiles.adhesiveKg / Math.max(tiles.netM2, 1e-9), 2)} kg a m²`, value: `${num(tiles.adhesiveKg, 0)} kg · ${num(tiles.adhesiveBags, 0)} bags` }]),
                ]}
              />
              <p className="ns-calc-help">
                Wastage is the allowance for cutting and breakage; no standard gives it, so the percentages are assumptions: 5% for a small tile laid straight, 10% for a large tile, a diagonal lay of a small tile, or a small room, and 15% for a large tile laid diagonally. The tile count is the area to buy times the tiles a m², rounded up.
              </p>
            </>
          )
        }
      />

      <CalcCta
        kicker="Finishing the whole house?"
        text="This page counts one surface. InteriorPro measures every wall, ceiling and floor from your plan, the way IS 1200 does, and counts the paint, putty, primer, tiles, grout, fixing, false ceiling, doors, windows and carpentry sheets."
        href="/tools/interiorpro"
        label="Open InteriorPro"
      />

      {valid && mode === 'paint' ? (
        <CalcSection title="The three paint systems side by side" sub={`For ${num(area, 0)} ${unitText} of wall and ceiling. Each figure includes 5% wastage.`}>
          <ReportTable
            head={['System', 'Putty (kg)', 'Primer (L)', 'Paint (L)']}
            num={[1, 2, 3]}
            rows={paint.all.map((p) => [TIER_NAME[p.tier], p.system.putty ? num(p.puttyKg, 1) : 'none', num(p.primerL, 1), num(p.finishL, 1)])}
          />
          <p className="ns-r-tblnote">
            Economy is distemper over primer. Standard adds cement putty and uses an emulsion. Premium uses a finer acrylic putty, which goes on thinner, and a luxury emulsion that spreads less far, so it takes more paint but less putty.
          </p>
        </CalcSection>
      ) : null}

      {valid && mode === 'tiles' ? (
        <CalcSection title="The same area in each tile size" sub={`For ${num(area, 0)} ${unitText}, ${where === 'floor' ? 'floor' : 'wall'}, laid ${lay}${small ? ', in a small room' : ''}.`}>
          <ReportTable
            head={['Tile', 'Extra for cutting', 'Tiles', 'Boxes', 'Grout (kg)']}
            num={[1, 2, 3, 4]}
            rows={tiles.all.map((t) => [t.tile.label, pct(t.waste), num(t.pcs, 0), t.boxes !== null ? num(t.boxes, 0) : '–', num(t.groutKg, 1)])}
          />
          <p className="ns-r-tblnote">
            A larger tile needs fewer tiles and less grout, because there is less joint, but more of it is lost in cutting. The 300 × 300 mm tile is not counted in boxes: boxes of that size vary too much to fix a figure.
          </p>
        </CalcSection>
      ) : null}

      <article className="ns-calc-articles">
        <Prose title="How much paint a wall takes">
          <p>
            Paint, putty and primer are counted from the <strong>area</strong> and the <strong>spread</strong>: how many square metres a litre or a kilogram covers over all its coats. The calculator uses the spread of each system from the makers’ data sheets, and 0.070 litres of primer a m² from the CPWD analysis of rates (2016). Add 5% for what is left in the tin and the brush.
          </p>
          <Formula>1,000 sq ft = 92.9 m² · Standard: {num(exPaint[1].puttyKg, 1)} kg putty, {num(exPaint[1].primerL, 1)} L primer, {num(exPaint[1].finishL, 1)} L emulsion</Formula>
          <p>
            The area is measured the way IS 1200 (Part 13) measures paint: openings up to half a square metre are not taken out, and openings from half to three square metres have one face taken out. The ceiling counts as paint too. Plaster is not counted here; it belongs to MasonryPro.
          </p>
        </Prose>

        <Prose title="Three systems, three amounts">
          <p>
            <strong>Economy</strong> is acrylic distemper over a coat of primer, with no putty. <strong>Standard</strong> adds a cement putty, about 1 mm thick, one coat of primer and two coats of emulsion. <strong>Premium</strong> uses an acrylic putty in two coats and a luxury emulsion. For 1,000 sq ft of wall and ceiling that is {num(exPaint[0].finishL, 1)}, {num(exPaint[1].finishL, 1)} and {num(exPaint[2].finishL, 1)} litres of finish coat.
          </p>
        </Prose>

        <Prose title="How many tiles an area takes">
          <p>
            One tile and its joint cover (length + joint) × (width + joint). For a 600 × 600 mm tile with a 2 mm joint that is 0.602 × 0.602 m, so <strong>{num(exTile.perM2, 2)} tiles cover a square metre</strong>. The tiles to buy are the area plus the allowance for cutting, times that figure, rounded up.
          </p>
          <Formula>100 m² + {pct(exTile.waste)} = {num(exTile.buyM2, 0)} m² · × {num(exTile.perM2, 2)} = {num(exTile.pcs, 0)} tiles · {num(exTile.boxes ?? 0, 0)} boxes of 4</Formula>
          <p>
            Floor tiles for bathrooms, balconies and kitchens should be vitrified or porcelain (water absorption up to 0.08%, group BIa of IS 15622:2006); glazed ceramic is for walls. The calculator counts the size you pick; the group is your choice at the shop.
          </p>
        </Prose>

        <Prose title="Grout, mortar and adhesive">
          <p>
            <strong>Grout</strong> is worked from the joints: the length of joint in a square metre, times its width and the tile thickness, times a grout density of 1.6 kg a litre (an assumption; 1.4 to 1.6), with 10% for waste. <strong>A cement mortar bed</strong> takes about 11.0 kg of cement and 22 litres of sand a m² under a floor tile, and 9.2 kg and 12.5 litres under a wall tile, from the CPWD item text. <strong>Tile adhesive</strong> takes 5.25 kg a m² for tiles up to 900 cm², 10.5 kg up to 3,600 cm² and 12 kg above that, from a maker’s sheet; the largest figure is an assumption.
          </p>
          <p>
            Adhesive needs a level, cured floor. A levelling screed under it is not counted here.
          </p>
        </Prose>
      </article>

      <CalcFaq items={PAINT_TILE_CONTENT.faq} />
      <RelatedLinks path="/tools/paint-tile-calculator" />

      <Chips codes={['IS 1200 (Part 11, 13)', 'IS 15622:2006', 'CPWD DAR 2016']} />
      <CalcFine>
        For planning. The spread of paint and the coverage of adhesive differ from maker to maker, and the wastage depends on the room and the tiler, so check the maker’s sheet and let the tiler confirm the count. The quantities cover one surface; a house is measured from its plan. Not a substitute for that.
      </CalcFine>
    </CalcPage>
  )
}
