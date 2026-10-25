/*
  The server's list of trade models, by the slug in the URL. Only API routes import this file:
  it carries the models, and the models carry every coefficient, so none of it may reach the browser.
*/

import type { TradeModel } from './types'
import type { TradeSlug } from './meta'
import { plumbingModel } from './plumbing/model'
import { masonryModel } from './masonry/model'
import { electricalModel } from './electrical/model'
import { interiorModel } from './interior/model'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MODELS: Partial<Record<TradeSlug, TradeModel<any>>> = {
  plumbpro: plumbingModel,
  masonpro: masonryModel,
  electropro: electricalModel,
  interiorpro: interiorModel,
}

/** The model for a slug, or null when the tool is unknown or not ready yet. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function modelFor(slug: string): TradeModel<any> | null {
  return Object.prototype.hasOwnProperty.call(MODELS, slug) ? MODELS[slug as TradeSlug] ?? null : null
}
