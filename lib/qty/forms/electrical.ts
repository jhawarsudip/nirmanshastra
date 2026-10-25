import type { FormSpec } from './types'

/*
  ElectricalPro questions. They match the inputs read by lib/qty/electrical/model.ts (parseElec);
  the defaults here are the same defaults the model uses when an answer is missing.
*/

export const electricalForm: FormSpec = {
  slug: 'electropro',
  heading: 'Tell us about the wiring',
  sub: 'A few plain questions about the rooms and the big appliances. We count the points room by room, size the circuits and boards, and work out the wire, conduit and fittings. You do not need a plan.',
  groups: [
    {
      title: 'What are you wiring?',
      fields: [
        {
          kind: 'choice', id: 'dwelling', label: 'Building type', def: 'house',
          options: [
            { value: 'house', label: 'A house', note: 'One home for one family, on every floor you entered' },
            { value: 'flats', label: 'Flats', note: 'Several homes in the building, each with its own meter and board' },
          ],
        },
        { kind: 'count', id: 'homesPerFloor', label: 'Homes on each floor', def: 2, min: 1, max: 8, showIf: { id: 'dwelling', is: 'flats' }, hint: 'Count the flats you can reach from one landing.' },
        { kind: 'count', id: 'bedrooms', label: 'Bedrooms in each home', def: 3, min: 1, max: 8, hint: 'For a house, the bedrooms in the whole house. Add a study or guest room here if you want it wired.' },
        { kind: 'count', id: 'bathrooms', label: 'Bathrooms in each home', def: 3, min: 1, max: 10, hint: 'A toilet with or without a shower. Count each one.' },
        { kind: 'count', id: 'kitchens', label: 'Kitchens in each home', def: 1, min: 1, max: 3 },
        { kind: 'count', id: 'balconies', label: 'Balconies in each home', def: 1, min: 0, max: 6, hint: 'For a house, the balconies in the whole house.' },
        { kind: 'yesno', id: 'dining', label: 'A dining room apart from the kitchen?', def: false, hint: 'Say no if you eat in the kitchen or in the hall.' },
        { kind: 'yesno', id: 'pooja', label: 'A pooja room?', def: false },
        { kind: 'yesno', id: 'utility', label: 'A wash area or dry balcony for a washing machine?', def: true },
      ],
    },
    {
      title: 'Big appliances and extras',
      intro: 'Each of these gets a circuit of its own, so they change the boards and the wire.',
      fields: [
        {
          kind: 'count', id: 'acRooms', label: 'Rooms with an air conditioner', def: 1, min: 0, max: 10,
          hint: 'In each home. Count the bedrooms and the hall that will have one, now or later.',
          tip: { title: 'Air conditioner circuits', body: 'An air conditioner draws a lot, so it has its own thicker wire (4 mm²), its own breaker and its own outlet. Wiring for one that you add later is far cheaper before the walls are plastered.', is: 'Draft IS 4648 cl 6.2.2' },
        },
        { kind: 'yesno', id: 'geyser', label: 'A water heater in every bathroom?', def: true, hint: 'Say no if you will heat water another way, such as solar.' },
        { kind: 'yesno', id: 'inverter', label: 'An inverter for lights and fans?', def: false, hint: 'Counted for each home.' },
        { kind: 'yesno', id: 'ev', label: 'A charger for an electric car or scooter?', def: false, hint: 'One circuit is counted at the parking, and one for every five spaces in a building of flats.' },
        { kind: 'number', id: 'parking', label: 'Parking spaces', optional: true, min: 0, max: 200, placeholder: '1', hint: 'For a house, the cars you can park on the plot (1 if you leave it empty). For flats, the spaces in the whole building (none if you leave it empty).' },
      ],
    },
    {
      title: 'How much wiring do you want?',
      fields: [
        {
          kind: 'choice', id: 'wiring', label: 'How many points and sockets?', def: 'standard',
          tip: { title: 'Standard or basic', body: 'The standard of 1968 asks for very few sockets. The BIS has drafted a new one for modern homes with many more, in every room. Standard follows the new draft. Basic follows the old standard.', is: 'IS 4648:1968 and its draft revision' },
          options: [
            { value: 'standard', label: 'Standard', note: 'The room-by-room points of the new BIS draft. Many sockets in every room, as in most new flats' },
            { value: 'basic', label: 'Basic', note: 'The sockets of the old IS 4648. Fewer points, a lower count of everything' },
          ],
        },
        {
          kind: 'choice', id: 'supply', label: 'What supply will you take?', def: 'auto',
          tip: { title: 'Single or three-phase', body: 'Your electricity board decides this from the load you ask for. Small homes are usually single-phase. Large homes with many air conditioners are three-phase. If you do not know, we choose from the design load.', is: 'Draft IS 4648 Table 4' },
          options: [
            { value: 'auto', label: 'Not sure', note: 'We choose from the load of your home' },
            { value: 'single', label: 'Single-phase', note: 'Two wires and an earth to the board' },
            { value: 'three', label: 'Three-phase', note: 'Four wires and an earth to the board' },
          ],
        },
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
    return [
      ['Floors', ctx.floors === 1 ? 'G' : `G+${ctx.floors - 1}`],
      ['Built-up area', ctx.areaSqft > 0 ? `${Math.round(ctx.areaSqft).toLocaleString('en-IN')} sq ft` : ''],
      ['Building', flats ? `${homes} flats` : 'A house'],
      ['Wiring', v.wiring === 'basic' ? 'Basic' : 'Standard'],
      ['Air conditioners', Number(v.acRooms ?? 1) > 0 ? `${v.acRooms ?? 1} in each home` : 'None'],
    ].filter(([, x]) => x) as [string, string][]
  },
  freeLine: 'Free: the Indian Standards checks, the design load and the supply. Points, wire, conduit, boards and fittings are in the full report',
}
