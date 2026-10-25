import type { FormSpec } from './types'

/*
  MasonryPro questions. They match the inputs read by lib/qty/masonry/model.ts (parseMason);
  the defaults here are the same defaults the model uses when an answer is missing.
*/

const WALL: Record<string, string> = {
  brick: 'Red clay brick',
  modular: 'Modular clay brick',
  flyash: 'Fly-ash brick',
  aac: 'AAC block',
  block: 'Concrete block',
}

export const masonryForm: FormSpec = {
  slug: 'masonpro',
  heading: 'Tell us about the walls',
  sub: 'A few plain questions about the rooms and the wall material. We work out the length of every wall, take out the doors and windows the way the Indian Standards measure them, and count the bricks or blocks, mortar, cement, sand and plaster.',
  groups: [
    {
      title: 'What are you building?',
      fields: [
        {
          kind: 'choice', id: 'dwelling', label: 'Building type', def: 'house',
          options: [
            { value: 'house', label: 'A house', note: 'One home for one family, on every floor you entered' },
            { value: 'flats', label: 'Flats', note: 'Several homes in the building, each with its own rooms' },
          ],
        },
        { kind: 'count', id: 'homesPerFloor', label: 'Homes on each floor', def: 2, min: 1, max: 8, showIf: { id: 'dwelling', is: 'flats' }, hint: 'Count the flats you can reach from one landing.' },
        { kind: 'count', id: 'bedrooms', label: 'Bedrooms in each home', def: 3, min: 1, max: 8, hint: 'For a house, the bedrooms in the whole house.' },
        { kind: 'count', id: 'bathrooms', label: 'Bathrooms in each home', def: 3, min: 1, max: 10, hint: 'A toilet with or without a shower. Count each one.' },
        { kind: 'count', id: 'kitchens', label: 'Kitchens in each home', def: 1, min: 1, max: 3 },
        {
          kind: 'count', id: 'balconies', label: 'Balconies in each home', def: 1, min: 0, max: 6,
          hint: 'For a house, the balconies in the whole house. Each is counted as 3 m wide and 1.5 m deep.',
        },
      ],
    },
    {
      title: 'Wall material',
      fields: [
        {
          kind: 'choice', id: 'system', label: 'What will the walls be built of?', def: 'brick',
          tip: { title: 'Wall material', body: 'Bricks and blocks come in different sizes, so the same wall needs a different count. The size, the joints and the mortar all follow from this choice.', is: 'IS 1077, 12894, 2185, 6041, 2572' },
          options: [
            { value: 'brick', label: 'Red clay brick', note: 'The usual brick, about 9 × 4.5 × 3 inches. Sizes vary from kiln to kiln' },
            { value: 'modular', label: 'Modular clay brick', note: '190 × 90 × 90 mm, the BIS modular size' },
            { value: 'flyash', label: 'Fly-ash brick', note: '230 × 110 × 70 mm, grey, from a fly-ash plant' },
            { value: 'aac', label: 'AAC block', note: 'Light grey blocks, 600 × 200 mm face, laid in thin adhesive' },
            { value: 'block', label: 'Concrete block', note: 'Solid or hollow cement blocks, 400 × 200 mm face' },
          ],
        },
        {
          kind: 'yesno', id: 'thickOuter', label: 'Make the outer walls 200 mm thick?', def: true, showIf: { id: 'system', in: ['aac', 'block'] },
          hint: 'Say no for 150 mm. A 150 mm outer wall in a frame needs bracing and reinforcement, which your engineer decides.',
          tip: { title: 'Outer wall thickness', body: 'A block wall of at least 200 mm in a frame needs no separate check for storeys up to 3.5 m. A 150 mm wall is allowed only if it is braced and reinforced.', is: 'IS 6041 cl 4.2.1, IS 2572 cl 7.2.1.2' },
        },
        {
          kind: 'choice', id: 'aacJoint', label: 'How will the AAC blocks be joined?', def: 'thin', showIf: { id: 'system', is: 'aac' },
          options: [
            { value: 'thin', label: 'Thin adhesive', note: 'A 3 mm bed of block adhesive, as the makers advise' },
            { value: 'mortar', label: 'Cement mortar', note: 'The old way: a 10 mm bed of 1:6 mortar' },
          ],
        },
      ],
    },
    {
      title: 'Plaster and the roof',
      fields: [
        {
          kind: 'choice', id: 'plasterExt', label: 'How will the outside be plastered?', def: 'twocoat',
          tip: { title: 'Outside plaster', body: 'Two coats (12 mm, then 6 mm) is the usual advice for outer walls. A single 20 mm coat is common too, but IS 2402 allows only up to 18 mm in one coat.', is: 'IS 2402 cl 6.13' },
          options: [
            { value: 'twocoat', label: 'Two coats, 18 mm', note: '12 mm base and a 6 mm finish' },
            { value: 'single', label: 'One coat, 20 mm', note: 'One thick coat, usual in CPWD work' },
            { value: 'none', label: 'Not plastered', note: 'Bare brick outside, pointed. Pointing is not counted' },
          ],
        },
        { kind: 'yesno', id: 'plasterCeil', label: 'Plaster the ceilings?', def: true, hint: 'Say no if you will paint the slab directly or put up a false ceiling.' },
        { kind: 'yesno', id: 'parapet', label: 'A masonry parapet round the terrace?', def: true },
        { kind: 'yesno', id: 'mumty', label: 'A small stair room on the terrace?', def: true, hint: 'About 3 × 3 m. Ignored for a single-storey building.' },
        { kind: 'yesno', id: 'balconyWall', label: 'Are balcony edges masonry walls?', def: true, hint: 'Say no if they will have a metal or glass railing.' },
        { kind: 'yesno', id: 'bigDoor', label: 'Large sliding doors to the balcony?', def: false, hint: 'A sliding door of about 1.8 m. The usual door is 1.2 m wide.' },
        {
          kind: 'number', id: 'storeyM', label: 'Floor to floor height (m)', optional: true, min: 2.7, max: 4.0, placeholder: '3.0', unit: 'm',
          hint: 'Leave it empty for 3.0 m, which is what the structure report uses.',
        },
      ],
    },
  ],
  summary(v, ctx) {
    const flats = v.dwelling === 'flats'
    const homes = flats ? Number(v.homesPerFloor || 2) * ctx.floors : 1
    const plaster = v.plasterExt === 'none' ? 'Inside only' : v.plasterExt === 'single' ? 'Outside 20 mm' : 'Outside 18 mm'
    return [
      ['Floors', ctx.floors === 1 ? 'G' : `G+${ctx.floors - 1}`],
      ['Built-up area', ctx.areaSqft > 0 ? `${Math.round(ctx.areaSqft).toLocaleString('en-IN')} sq ft` : ''],
      ['Building', flats ? `${homes} flats` : 'A house'],
      ['Walls', WALL[String(v.system)] ?? ''],
      ['Plaster', plaster],
    ].filter(([, x]) => x) as [string, string][]
  },
  freeLine: 'Free: the Indian Standards checks, the wall thicknesses and a count of rooms and openings. Bricks, mortar, cement, sand and plaster are in the full report',
}
