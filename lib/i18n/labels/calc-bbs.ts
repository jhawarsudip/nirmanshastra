import type { Dict } from '@/lib/i18n/tr'

/** Hindi for the bar-shape names, dimension labels, hints and notes that bbs-engine.ts (SHAPES) sends to the Bar Bending Calculator. */
export const BBS_DICT: Dict = {
  // shape names
  'Straight bar': 'सीधा बार',
  'L-bar: one right-angle bend': 'L-बार: एक समकोण बेंड',
  'U-bar: two right-angle bends': 'U-बार: दो समकोण बेंड',
  'Cranked bar: two 45° bends': 'क्रैंक बार: दो 45° बेंड',
  'Rectangular stirrup or tie: 135° hooks': 'आयताकार स्टिरप या टाई: 135° हुक',
  'Square tie: 135° hooks': 'चौकोर टाई: 135° हुक',

  // dimension labels
  'Length (mm)': 'लंबाई (mm)',
  'First leg (mm)': 'पहली भुजा (mm)',
  'Second leg (mm)': 'दूसरी भुजा (mm)',
  'Base (mm)': 'आधार (mm)',
  'Overall length (mm)': 'कुल लंबाई (mm)',
  'Crank rise (mm)': 'क्रैंक की ऊँचाई (mm)',
  'Width (mm)': 'चौड़ाई (mm)',
  'Depth (mm)': 'गहराई (mm)',
  'Side (mm)': 'एक तरफ़ (mm)',

  // dimension hints
  'The whole length of the bar.': 'बार की पूरी लंबाई।',
  'Out to out, to the outside of the bend.': 'बाहर से बाहर, बेंड के बाहरी किनारे तक।',
  'Out to out.': 'बाहर से बाहर।',
  'Out to out, the length between the two bends.': 'बाहर से बाहर, दोनों बेंड के बीच की लंबाई।',
  'End to end, measured along the bar’s run.': 'सिरे से सिरे तक, बार की चाल के साथ नापी हुई।',
  'How far the bar steps up or down.': 'बार कितना ऊपर या नीचे उठता-गिरता है।',
  'Out to out of the stirrup, which is the member’s width less the cover on both sides.':
    'स्टिरप का बाहर से बाहर, यानी मेंबर की चौड़ाई में से दोनों तरफ़ का कवर घटाकर।',
  'Out to out of the stirrup, which is the member’s depth less the cover on both sides.':
    'स्टिरप का बाहर से बाहर, यानी मेंबर की गहराई में से दोनों तरफ़ का कवर घटाकर।',
  'Out to out of the tie, which is the column’s side less the cover on both sides.':
    'टाई का बाहर से बाहर, यानी कॉलम की एक तरफ़ की लंबाई में से दोनों तरफ़ का कवर घटाकर।',

  // shape notes
  'A plain bar. It is cut to its length.': 'सादा बार। इसे उसकी लंबाई के हिसाब से काटा जाता है।',
  'Two legs at a right angle, such as the starter bar of a column in a footing or the edge bar of a slab.':
    'समकोण पर दो भुजाएँ, जैसे फुटिंग में कॉलम का स्टार्टर बार या स्लैब का किनारे का बार।',
  'Three lengths with a right-angle bend between each, a channel or U shape.':
    'तीन लंबाइयाँ, हर एक के बीच समकोण बेंड, यानी चैनल या U आकार।',
  'A bar that steps up or down at 45°, such as a bar lifted over a support. The slope makes it longer than its run.':
    'ऐसा बार जो 45° पर ऊपर या नीचे उठता है, जैसे सपोर्ट के ऊपर उठाया गया बार। ढलान उसे उसकी सिरे-से-सिरे की लंबाई से लंबा कर देती है।',
  'A closed rectangle with a 135° hook at each end of the bar, as IS 13920 asks for a stirrup or tie.':
    'बंद आयत, बार के दोनों सिरों पर 135° का हुक, जैसा IS 13920 स्टिरप या टाई के लिए माँगता है।',
  'A closed square with a 135° hook at each end, the usual tie of a square column.':
    'बंद चौकोर, दोनों सिरों पर 135° का हुक, चौकोर कॉलम की आम टाई।',
}
