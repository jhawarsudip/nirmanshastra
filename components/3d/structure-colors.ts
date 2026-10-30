// One palette for the 3D model and its legend. Warm, concrete-toned: it sits on the charcoal "wet concrete" stage in both day and night themes.

export type LayerKey = 'foundation' | 'ground' | 'columns' | 'beams' | 'slabs' | 'balconies' | 'stair'
export type ViewKey = '3d' | 'plan' | 'front'

export const LAYERS: { key: LayerKey; label: string; color: string; note: string }[] = [
  { key: 'foundation', label: 'Foundation', color: '#A89F8D', note: 'Footings or raft, and the plinth beams' },
  { key: 'ground', label: 'Ground floor', color: '#9AA39C', note: 'Laid on filled earth inside the plinth beams. Not a structural slab, so it is not counted in this report' },
  { key: 'columns', label: 'Columns', color: '#E27B58', note: 'Carry the load down to the footings' },
  { key: 'beams', label: 'Beams', color: '#E6C97A', note: 'Carry the slabs to the columns' },
  { key: 'slabs', label: 'Slabs', color: '#EDE6D4', note: 'Floors and the roof' },
  { key: 'balconies', label: 'Balconies', color: '#8FB8D0', note: 'Slabs that stick out beyond the walls, held only at the building edge' },
  { key: 'stair', label: 'Staircase', color: '#7CC3A0', note: 'Dog-legged stair and the head-room on the roof' },
]

export const COLOR = {
  foundation: '#A89F8D',
  plinth: '#B8A672',
  groundFloor: '#9AA39C',
  columns: '#E27B58',
  beams: '#E6C97A',
  slabs: '#EDE6D4',
  balcony: '#8FB8D0',
  stair: '#7CC3A0',
  mumty: '#D8CFBD',
  ground: '#6B665D',
  grid: '#8A857B',
}
