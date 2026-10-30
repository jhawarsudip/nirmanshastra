/** The Hindi (Devanagari) edition of one blog article. The English article stays in lib/blog-content.ts; this is looked up by its slug. */
export interface BlogArticleHi {
  title: string
  excerpt: string
  category: string
  /** same facts and figures as the English quickAnswer */
  quickAnswer?: string
  faq?: { question: string; answer: string }[]
  /** same markdown dialect as the English `content` (## and ### headings, - and 1. lists, | tables |, ---, **bold**, [links](/path)) */
  content: string
}
