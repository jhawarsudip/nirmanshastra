import type { TradeSlug } from '../meta'
import type { FormSpec } from './types'
import { plumbingForm } from './plumbing'
import { masonryForm } from './masonry'
import { electricalForm } from './electrical'
import { interiorForm } from './interior'

/** Every trade tool's form. A tool is added here as its model lands. */
export const FORMS: Partial<Record<TradeSlug, FormSpec>> = {
  plumbpro: plumbingForm,
  masonpro: masonryForm,
  electropro: electricalForm,
  interiorpro: interiorForm,
}
