/*
  Customer testimonials. SWITCHED OFF: the list below is empty on purpose, and the homepage section shows nothing until at
  least TESTIMONIALS_MIN real, permitted testimonials are in it.

  HOW TO ADD ONE (only a real customer's words, nothing written or improved by us):
    1. A customer replies to the report email ("Did the report help? Reply with one line we can share, using your first name and city").
       That reply is the permission.
    2. Paste their words below, exactly as sent (trim greetings and signatures only; fix nothing else).
    3. Use their first name and city as they gave them. `source` and `receivedOn` say where and when the words arrived.
  There are no star ratings and no review markup anywhere: a rating we did not collect is not shown.
*/

export type TestimonialSource = 'email-reply' | 'instagram-dm' | 'contact-form'

export interface Testimonial {
  /** first name only, as the customer gave it */
  name: string
  city: string
  /** the customer's own words */
  quote: string
  /** the report it is about, when they said */
  tool?: string
  /** where the words came from: every entry must have a trace */
  source: TestimonialSource
  /** the day the words arrived, YYYY-MM-DD */
  receivedOn: string
  /** the customer agreed we may publish it with their first name and city. Must be `true`. */
  permission: true
}

/** Real testimonials only. Empty until there are some. */
export const TESTIMONIALS: Testimonial[] = []

/** The section stays off until there are at least this many. */
export const TESTIMONIALS_MIN = 3

/** An entry is shown only if it is complete. */
export function isComplete(t: Testimonial): boolean {
  return t.permission === true
    && t.name.trim().length > 0 && !/\s/.test(t.name.trim())
    && t.city.trim().length > 0
    && t.quote.trim().length >= 10 && t.quote.length <= 400
    && /^\d{4}-\d{2}-\d{2}$/.test(t.receivedOn)
}

/** The testimonials to show, or none at all when there are too few. */
export function visibleTestimonials(list: Testimonial[] = TESTIMONIALS, min: number = TESTIMONIALS_MIN): Testimonial[] {
  const ok = list.filter(isComplete)
  return ok.length >= min ? ok : []
}
