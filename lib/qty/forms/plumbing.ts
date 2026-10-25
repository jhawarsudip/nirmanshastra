import type { FormSpec } from './types'

/*
  PlumbingPro questions. They match the inputs read by lib/qty/plumbing/model.ts (parsePlumb);
  the defaults here are the same defaults the model uses when an answer is missing.
*/

const WATER: Record<string, string> = { municipal: 'Municipal supply', borewell: 'Borewell', tanker: 'Tanker' }

export const plumbingForm: FormSpec = {
  slug: 'plumbpro',
  heading: 'Tell us about the plumbing',
  sub: 'A few plain questions about the homes, the bathrooms and where the water comes from. Pipe sizes, tank sizes and the drains are worked out for you from the Indian Standards, and written into your report.',
  groups: [
    {
      title: 'What are you building?',
      fields: [
        {
          kind: 'choice', id: 'dwelling', label: 'Building type', def: 'house',
          options: [
            { value: 'house', label: 'A house', note: 'One home for one family, on every floor you entered' },
            { value: 'flats', label: 'Flats', note: 'Several homes in the building, each with its own bathrooms and kitchen' },
          ],
        },
        { kind: 'count', id: 'homesPerFloor', label: 'Homes on each floor', def: 2, min: 1, max: 8, showIf: { id: 'dwelling', is: 'flats' }, hint: 'Count the flats you can reach from one landing.' },
        { kind: 'count', id: 'bedrooms', label: 'Bedrooms in each home', def: 3, min: 1, max: 8, hint: 'For a house, the bedrooms in the whole house.' },
        { kind: 'count', id: 'bathrooms', label: 'Bathrooms with a WC in each home', def: 3, min: 1, max: 10, hint: 'A toilet with or without a shower. Count each one.' },
        { kind: 'count', id: 'kitchens', label: 'Kitchens in each home', def: 1, min: 1, max: 3 },
        {
          kind: 'number', id: 'persons', label: 'People living in each home', optional: true, min: 1, max: 20, placeholder: 'e.g. 5',
          hint: 'Leave this empty and we count the bedrooms plus three.',
          tip: { title: 'People per home', body: 'The tank and the drains are sized on the number of people. If you expect a joint family or a lot of guests, enter the larger number.', is: 'IS 1172:1993 cl 4.1' },
        },
      ],
    },
    {
      title: 'Where does the water come from, and where does it go?',
      fields: [
        {
          kind: 'choice', id: 'water', label: 'Water supply', def: 'municipal',
          tip: { title: 'Water supply', body: 'The source decides how much water you must store. A tanker or a borewell is less steady than a municipal line, so the tanks are larger.', is: 'NBC Part 9 Sec 1 cl 4.4.10' },
          options: [
            { value: 'municipal', label: 'Municipal supply', note: 'A pipe from the town or the society, at set hours or all day' },
            { value: 'borewell', label: 'Borewell', note: 'Your own pump fills the tank when it is needed' },
            { value: 'tanker', label: 'Tanker', note: 'Water arrives by tanker and goes into an underground tank' },
          ],
        },
        {
          kind: 'yesno', id: 'sewer', label: 'Is there a public sewer line at your plot?', def: true,
          hint: 'Ask your neighbours or the local body. If there is none, we size a septic tank and a soak pit instead.',
          tip: { title: 'Sewer or septic tank', body: 'Where a sewer line runs past the plot, the waste connects to it. Where it does not, the waste goes to a septic tank and then a soak pit on your own plot.', is: 'IS 2470 (Part 1 and 2)' },
        },
        {
          kind: 'choice', id: 'soil', label: 'How fast does the ground soak up water?', def: 'medium', showIf: { id: 'sewer', is: false },
          hint: 'This sets the size of the soak pit.',
          tip: { title: 'Ground and the soak pit', body: 'A soak pit lets the treated water seep into the ground. Sandy ground takes it fast, clay takes it slowly and needs a bigger pit. A percolation test by a lab gives the true figure.', is: 'IS 2470 (Part 2) Table 2' },
          options: [
            { value: 'good', label: 'Quickly', note: 'Sandy or gravelly, water disappears within minutes' },
            { value: 'medium', label: 'Ordinary', note: 'Mixed soil, the usual case' },
            { value: 'poor', label: 'Slowly', note: 'Clay or black cotton soil, water stands for a long time' },
          ],
        },
      ],
    },
    {
      title: 'Fixtures and rain',
      fields: [
        { kind: 'yesno', id: 'geyser', label: 'Hot water in the bathrooms (geysers)?', def: true },
        { kind: 'yesno', id: 'washer', label: 'A washing machine point in every home?', def: true },
        { kind: 'yesno', id: 'gardenTap', label: 'A tap in the garden or the parking?', def: false },
        {
          kind: 'choice', id: 'rain', label: 'How hard does it rain in your town?', def: 'heavy',
          hint: 'The roof drains are sized for the heaviest hour. If you are unsure, pick Heavy for most towns and Very heavy near the coast.',
          tip: { title: 'Rain and down-pipes', body: 'The standard does not give a rainfall for each town, so you choose the one that fits. A heavier rain needs more down-pipes for the same roof.', is: 'IS 1742:1983 cl 4.10.3.8' },
          options: [
            { value: 'heavy', label: 'Heavy', note: 'About 75 mm in an hour. Most towns on the plains and the plateau' },
            { value: 'veryheavy', label: 'Very heavy', note: 'About 100 mm in an hour. The west coast, Kerala and the north-east' },
            { value: 'extreme', label: 'Extreme', note: 'About 150 mm in an hour. Cloudburst-prone hills and the wettest places' },
          ],
        },
      ],
    },
  ],
  summary(v, ctx) {
    const flats = v.dwelling === 'flats'
    const homes = flats ? Number(v.homesPerFloor || 2) * ctx.floors : 1
    return [
      ['Floors', ctx.floors === 1 ? 'G' : `G+${ctx.floors - 1}`],
      ['Built-up area', ctx.areaSqft > 0 ? `${Math.round(ctx.areaSqft).toLocaleString('en-IN')} sq ft` : ''],
      ['Building', flats ? `${homes} flats` : 'A house'],
      ['Bathrooms', String(Number(v.bathrooms || 0) * homes)],
      ['Water', WATER[String(v.water)] ?? ''],
      ['Waste', v.sewer === false ? 'Septic tank and soak pit' : 'Public sewer'],
    ].filter(([, x]) => x) as [string, string][]
  },
  freeLine: 'Free: the Indian Standards checks, the main sizes and a count of what you have. The itemised quantities are in the full report',
}
