import type { BlogArticleHi } from './types'
import { HI_B1 } from './articles-b1'
import { HI_B2 } from './articles-b2'
import { HI_B3 } from './articles-b3'
import { HI_B4 } from './articles-b4'

/** Hindi editions of articles 7 to 14 (see lib/blog-content.ts for the English). Keyed by slug. Split over articles-b1.ts ... b4 for editing. */
export const HI_B: Record<string, BlogArticleHi> = { ...HI_B1, ...HI_B2, ...HI_B3, ...HI_B4 }
