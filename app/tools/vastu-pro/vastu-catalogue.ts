// What the visitor can put on the plan. Labels and sizes only: how each one is read lives in vastu-rules.ts.
// Sizes are in sheet units, where the house outline fits inside a 400 x 400 box (see vastu-model.ts).

export type CatalogueCategory =
  | 'Doors'
  | 'Living'
  | 'Bedrooms'
  | 'Kitchen and dining'
  | 'Bathrooms'
  | 'Prayer and study'
  | 'Water and tanks'
  | 'Stairs and storage'
  | 'Outdoors and vehicles'

export const CATEGORY_ORDER: CatalogueCategory[] = [
  'Living',
  'Bedrooms',
  'Kitchen and dining',
  'Bathrooms',
  'Prayer and study',
  'Water and tanks',
  'Stairs and storage',
  'Outdoors and vehicles',
]

export interface CatalogueItem {
  key: string
  label: string
  category: CatalogueCategory
  /** two-letter mark drawn on the plan */
  abbrev: string
  /** can be added more than once */
  multi: boolean
  w: number
  h: number
}

export const DOOR_KINDS: CatalogueItem[] = [
  { key: 'main_door', label: 'Main door', category: 'Doors', abbrev: 'MD', multi: false, w: 0, h: 0 },
  { key: 'back_door', label: 'Back door', category: 'Doors', abbrev: 'BD', multi: false, w: 0, h: 0 },
  { key: 'side_door', label: 'Side door', category: 'Doors', abbrev: 'SD', multi: false, w: 0, h: 0 },
]

export const ROOM_KINDS: CatalogueItem[] = [
  // Living
  { key: 'living_room', label: 'Living room', category: 'Living', abbrev: 'LR', multi: false, w: 110, h: 90 },
  { key: 'hall', label: 'Hall', category: 'Living', abbrev: 'HL', multi: false, w: 110, h: 90 },
  { key: 'lobby', label: 'Lobby', category: 'Living', abbrev: 'LB', multi: false, w: 70, h: 60 },
  { key: 'lounge', label: 'Lounge', category: 'Living', abbrev: 'LG', multi: false, w: 90, h: 80 },
  // Bedrooms
  { key: 'master_bedroom', label: 'Master bedroom', category: 'Bedrooms', abbrev: 'MB', multi: false, w: 100, h: 90 },
  { key: 'parents_room', label: 'Parents’ room', category: 'Bedrooms', abbrev: 'PR', multi: false, w: 90, h: 80 },
  { key: 'childrens_room', label: 'Children’s room', category: 'Bedrooms', abbrev: 'CR', multi: true, w: 85, h: 75 },
  { key: 'guest_bedroom', label: 'Guest bedroom', category: 'Bedrooms', abbrev: 'GB', multi: true, w: 85, h: 75 },
  // Kitchen and dining
  { key: 'kitchen', label: 'Kitchen', category: 'Kitchen and dining', abbrev: 'KT', multi: false, w: 80, h: 70 },
  { key: 'dining_room', label: 'Dining room', category: 'Kitchen and dining', abbrev: 'DR', multi: false, w: 80, h: 70 },
  // Bathrooms
  { key: 'bathroom', label: 'Bathroom', category: 'Bathrooms', abbrev: 'BT', multi: true, w: 48, h: 56 },
  { key: 'toilet', label: 'Toilet', category: 'Bathrooms', abbrev: 'TL', multi: true, w: 44, h: 52 },
  // Prayer and study
  { key: 'puja_room', label: 'Puja room', category: 'Prayer and study', abbrev: 'PJ', multi: false, w: 56, h: 56 },
  { key: 'study_room', label: 'Study room', category: 'Prayer and study', abbrev: 'SR', multi: true, w: 70, h: 66 },
  { key: 'office', label: 'Office or work area', category: 'Prayer and study', abbrev: 'OF', multi: true, w: 70, h: 66 },
  // Water and tanks
  { key: 'ug_water_tank', label: 'Underground water tank', category: 'Water and tanks', abbrev: 'UW', multi: false, w: 44, h: 44 },
  { key: 'oh_water_tank', label: 'Overhead water tank', category: 'Water and tanks', abbrev: 'OW', multi: false, w: 44, h: 44 },
  { key: 'swimming_pool', label: 'Swimming pool', category: 'Water and tanks', abbrev: 'SP', multi: false, w: 100, h: 60 },
  // Stairs and storage
  { key: 'staircase', label: 'Staircase', category: 'Stairs and storage', abbrev: 'SC', multi: false, w: 56, h: 84 },
  { key: 'lift', label: 'Lift', category: 'Stairs and storage', abbrev: 'LF', multi: false, w: 40, h: 40 },
  { key: 'store_room', label: 'Store room', category: 'Stairs and storage', abbrev: 'ST', multi: true, w: 56, h: 56 },
  // Outdoors and vehicles
  { key: 'balcony', label: 'Balcony', category: 'Outdoors and vehicles', abbrev: 'BC', multi: true, w: 90, h: 36 },
  { key: 'garden', label: 'Garden', category: 'Outdoors and vehicles', abbrev: 'GD', multi: false, w: 110, h: 80 },
  { key: 'car_parking', label: 'Car parking or garage', category: 'Outdoors and vehicles', abbrev: 'CG', multi: false, w: 90, h: 70 },
]

export const CATALOGUE: Record<string, CatalogueItem> = Object.fromEntries(
  [...DOOR_KINDS, ...ROOM_KINDS].map(k => [k.key, k]),
)
