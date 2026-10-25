import type { FormSpec } from './types'

/*
  InteriorPro questions. They match the inputs read by lib/qty/interior/model.ts (parseInterior);
  the defaults here are the same defaults the model uses when an answer is missing.
*/

export const interiorForm: FormSpec = {
  slug: 'interiorpro',
  heading: 'Tell us about the finishing',
  sub: 'A few plain questions about the rooms and the finishes you have in mind. We measure the walls, ceilings and floors room by room, then work out the paint, the tiles, the doors and windows, the false ceiling and the plywood. You do not need a plan.',
  groups: [
    {
      title: 'What are you finishing?',
      fields: [
        {
          kind: 'choice', id: 'dwelling', label: 'Building type', def: 'house',
          options: [
            { value: 'house', label: 'A house', note: 'One home for one family, on every floor you entered' },
            { value: 'flats', label: 'Flats', note: 'Several homes in the building, finished the same way' },
          ],
        },
        { kind: 'count', id: 'homesPerFloor', label: 'Homes on each floor', def: 2, min: 1, max: 8, showIf: { id: 'dwelling', is: 'flats' }, hint: 'Count the flats you can reach from one landing.' },
        { kind: 'count', id: 'bedrooms', label: 'Bedrooms in each home', def: 3, min: 1, max: 8, hint: 'For a house, the bedrooms in the whole house.' },
        { kind: 'count', id: 'bathrooms', label: 'Bathrooms in each home', def: 3, min: 1, max: 10, hint: 'A toilet with or without a shower. Count each one.' },
        { kind: 'count', id: 'kitchens', label: 'Kitchens in each home', def: 1, min: 1, max: 3 },
        { kind: 'count', id: 'balconies', label: 'Balconies in each home', def: 1, min: 0, max: 6, hint: 'For a house, the balconies in the whole house.' },
        {
          kind: 'number', id: 'storeyM', label: 'Floor to floor height (m)', optional: true, min: 2.7, max: 4.0, placeholder: '3.0', unit: 'm',
          hint: 'Leave it empty for 3.0 m, which is what the structure report uses.',
        },
      ],
    },
    {
      title: 'Paint',
      fields: [
        {
          kind: 'choice', id: 'paint', label: 'Paint inside the rooms', def: 'standard',
          tip: { title: 'What the three levels mean', body: 'The level sets the layers on the wall. Economy is primer and two coats of distemper. Standard adds cement putty and uses an interior emulsion. Premium uses two coats of acrylic putty and a luxury emulsion, which spreads less far.', is: 'Makers’ data sheets; IS 2395 (Part 1)' },
          options: [
            { value: 'economy', label: 'Economy', note: 'Primer and two coats of distemper' },
            { value: 'standard', label: 'Standard', note: 'Cement putty, primer, two coats of emulsion' },
            { value: 'premium', label: 'Premium', note: 'Acrylic putty, primer, two coats of luxury emulsion' },
          ],
        },
        {
          kind: 'choice', id: 'exterior', label: 'Paint on the outside walls', def: 'acrylic',
          tip: { title: 'Outside finishes', body: 'Cement paint is the cheapest and goes on in two coats with curing between them. Acrylic emulsion is smooth and washable. A textured finish hides cracks but takes about twice the material of a smooth coat.', is: 'CPWD Delhi Analysis of Rates 2016; IS 2395 (Part 1)' },
          options: [
            { value: 'none', label: 'Leave it', note: 'The outside is not painted now' },
            { value: 'cement', label: 'Cement paint', note: 'Two coats, cured with water' },
            { value: 'acrylic', label: 'Acrylic emulsion', note: 'Smooth, over an exterior primer' },
            { value: 'textured', label: 'Textured', note: 'A rough finish over an exterior primer' },
          ],
        },
        {
          kind: 'choice', id: 'falseCeiling', label: 'A false ceiling?', def: 'none',
          options: [
            { value: 'none', label: 'No', note: 'Paint the slab' },
            { value: 'hall', label: 'Living rooms', note: 'Gypsum board in the living and dining areas' },
            { value: 'rooms', label: 'Living rooms and bedrooms', note: 'Gypsum board in every room but the kitchen and bathrooms' },
          ],
        },
      ],
    },
    {
      title: 'Floors and walls',
      fields: [
        {
          kind: 'choice', id: 'tileSize', label: 'Floor tile size', def: '600x600',
          tip: { title: 'Bigger tiles', body: 'Large tiles have fewer joints, so they look neater, but more of them break while cutting and they need a thicker bed of adhesive. The report allows more extra for them.', is: 'IS 15622:2006; makers’ data sheets' },
          options: [
            { value: '600x600', label: '600 × 600 mm', note: 'The usual floor tile' },
            { value: '800x800', label: '800 × 800 mm', note: 'Fewer joints, more breakage' },
            { value: '600x1200', label: '600 × 1200 mm', note: 'Long and large, for open rooms' },
          ],
        },
        {
          kind: 'choice', id: 'lay', label: 'How will they be laid?', def: 'straight',
          options: [
            { value: 'straight', label: 'Straight', note: 'In rows parallel to the walls' },
            { value: 'diagonal', label: 'Diagonal', note: 'At 45 degrees. Takes more tile for the cuts at the edges' },
          ],
        },
        {
          kind: 'choice', id: 'tileFix', label: 'How will the tiles be fixed?', def: 'mortar',
          options: [
            { value: 'mortar', label: 'Cement mortar bed', note: 'Cement and sand under the tile, the common way' },
            { value: 'adhesive', label: 'Tile adhesive', note: 'A thin bed of adhesive on a level floor' },
          ],
        },
        {
          kind: 'choice', id: 'bathTile', label: 'Bathroom wall tiles', def: 'full',
          options: [
            { value: 'full', label: 'To the door height', note: 'About 2.1 m, 300 × 600 mm tiles' },
            { value: 'half', label: 'Half way up', note: 'About 1.2 m, paint above' },
          ],
        },
      ],
    },
    {
      title: 'Kitchen and cupboards',
      fields: [
        {
          kind: 'choice', id: 'kitchenShape', label: 'Kitchen counter shape', def: 'l',
          options: [
            { value: 'straight', label: 'Straight', note: 'One run along a wall' },
            { value: 'l', label: 'L shape', note: 'Two runs at a corner' },
            { value: 'u', label: 'U shape', note: 'Three runs' },
          ],
        },
        { kind: 'yesno', id: 'kitchenCabinets', label: 'Cabinets under and above the counter?', def: false, hint: 'Say no if you will buy a ready kitchen or fit it later.' },
        {
          kind: 'choice', id: 'wardrobes', label: 'Built-in wardrobes', def: 'none',
          options: [
            { value: 'none', label: 'None', note: 'You will buy furniture or fit them later' },
            { value: 'master', label: 'Master bedroom', note: 'One 2.4 m wardrobe in each home' },
            { value: 'all', label: 'Every bedroom', note: '2.4 m in the master, 1.8 m in the others' },
          ],
        },
      ],
    },
  ],
  summary(v, ctx) {
    const flats = v.dwelling === 'flats'
    const homes = flats ? Number(v.homesPerFloor || 2) * ctx.floors : 1
    const paint = { economy: 'Economy', standard: 'Standard', premium: 'Premium' }[String(v.paint || 'standard')]
    const tile = { '600x600': '600 × 600 mm', '800x800': '800 × 800 mm', '600x1200': '600 × 1200 mm' }[String(v.tileSize || '600x600')]
    return [
      ['Floors', ctx.floors === 1 ? 'G' : `G+${ctx.floors - 1}`],
      ['Built-up area', ctx.areaSqft > 0 ? `${Math.round(ctx.areaSqft).toLocaleString('en-IN')} sq ft` : ''],
      ['Building', flats ? `${homes} flats` : 'A house'],
      ['Paint', paint || ''],
      ['Floor tiles', tile || ''],
    ].filter(([, x]) => x) as [string, string][]
  },
  freeLine: 'Free: the Indian Standards checks and what each finish means. Paint, tiles, doors, windows, false ceiling and plywood are in the full report',
}
