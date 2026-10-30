/*
  Hindi for the messages the server sends back to VastuPro's "email me the PDF" form (app/api/vastu-pro/report and
  lib/vastu-plan.ts). Looked up on the page at display time (useTr); a message with no entry shows in English. The route is
  not touched. "{label} can be placed only once." is handled on the page, because the label inside it needs its own Hindi.
*/
import type { Dict } from '../tr'

export const VASTU_ERRORS: Dict = {
  'That is a lot of PDFs in a short time. Please try again in a little while.': 'थोड़े समय में बहुत सारे PDF माँगे गए हैं। कृपया थोड़ी देर बाद फिर कोशिश कीजिए।',
  'Please enter a valid email address.': 'कृपया सही ईमेल पता डालिए।',
  'The North angle is missing.': 'उत्तर का कोण नहीं मिला।',
  'The outline of the house is missing.': 'घर की आउटलाइन नहीं मिली।',
  'The outline of the house has too many corners.': 'घर की आउटलाइन में कोने बहुत ज़्यादा हैं।',
  'One corner of the house outline is not valid.': 'घर की आउटलाइन का एक कोना सही नहीं है।',
  'That is more rooms than the plan can hold.': 'यह नक्शे में समाने से ज़्यादा कमरे हैं।',
  'One of the rooms is not valid.': 'कमरों में से एक सही नहीं है।',
  'That is more doors than the plan can hold.': 'यह नक्शे में समाने से ज़्यादा दरवाज़े हैं।',
  'One of the doors is not valid.': 'दरवाज़ों में से एक सही नहीं है।',
  'Mark at least one door or room on the plan first.': 'पहले नक्शे पर कम से कम एक दरवाज़ा या कमरा चिह्नित कीजिए।',
  'We could not make the PDF. Please try again.': 'हम PDF नहीं बना पाए। कृपया फिर कोशिश कीजिए।',
}
