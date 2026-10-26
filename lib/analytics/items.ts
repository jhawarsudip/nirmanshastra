import { priceForAppType } from '@/lib/tool-pricing'

/*
  How a paid product is described to GA4 and the Pixel. The price is read from lib/tool-pricing.ts,
  the same file the checkout charges from, so a reported value can never differ from the amount charged.
*/

export interface TrackItem {
  item_id: string
  item_name: string
  item_category: string
  price: number
  quantity: number
}

const NAMES: Record<string, { name: string; category: string }> = {
  structopro: { name: 'StructurePro', category: 'Quantity report' },
  masonpro: { name: 'MasonryPro', category: 'Quantity report' },
  electropro: { name: 'ElectricalPro', category: 'Quantity report' },
  plumbpro: { name: 'PlumbingPro', category: 'Quantity report' },
  interiorpro: { name: 'InteriorPro', category: 'Quantity report' },
  grandtotal: { name: 'Grand Total Report', category: 'Quantity report' },
  completepack: { name: 'Complete House Pack', category: 'Bundle' },
}

/** The item for an `estimates.app_type`, or null for anything that is not a paid product */
export function itemFor(appType: string | null | undefined): TrackItem | null {
  if (!appType) return null
  const meta = Object.prototype.hasOwnProperty.call(NAMES, appType) ? NAMES[appType] : null
  const paise = priceForAppType(appType)
  if (!meta || paise === null) return null
  return { item_id: appType, item_name: meta.name, item_category: meta.category, price: paise / 100, quantity: 1 }
}
