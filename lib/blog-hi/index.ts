import type { BlogArticleHi } from './types'
import { HI_A } from './articles-a'
import { HI_B } from './articles-b'

export type { BlogArticleHi }
/** slug -> Hindi edition. An article with no entry here is shown in English on the Hindi blog. */
export const BLOG_HI: Record<string, BlogArticleHi> = { ...HI_A, ...HI_B }
