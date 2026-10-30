/*
  Hindi for the rows of "Your project so far" on the four trade tools: each form's `summary()` returns English labels and values
  (lib/qty/forms/*.ts), which the rail looks up here. A row with no entry shows as it is.
*/
import type { Dict } from '../tr'

export const QTY_SUMMARY: Dict = {
  // labels
  'Floors': 'मंज़िलें',
  'Built-up area': 'बिल्ट-अप एरिया',
  'Building': 'इमारत',
  'Walls': 'दीवारें',
  'Plaster': 'प्लास्टर',
  'Wiring': 'वायरिंग',
  'Air conditioners': 'एयर कंडीशनर',
  'Bathrooms': 'बाथरूम',
  'Water': 'पानी',
  'Waste': 'गंदा पानी',
  'Paint': 'पेंट',
  'Floor tiles': 'फ़र्श की टाइलें',
  // values
  '{0} sq ft': '{0} वर्ग फ़ुट',
  '{0} flats': '{0} फ़्लैट',
  'A house': 'एक मकान',
  'Red clay brick': 'लाल मिट्टी की ईंट',
  'Modular clay brick': 'मॉड्यूलर मिट्टी की ईंट',
  'Fly-ash brick': 'फ़्लाई-ऐश ईंट',
  'AAC block': 'AAC ब्लॉक',
  'Concrete block': 'कंक्रीट ब्लॉक',
  'Inside only': 'सिर्फ़ अंदर',
  'Outside 20 mm': 'बाहर 20 mm',
  'Outside 18 mm': 'बाहर 18 mm',
  'Basic': 'बेसिक',
  'Standard': 'स्टैंडर्ड',
  'None': 'कोई नहीं',
  '{0} in each home': 'हर घर में {0}',
  'Municipal supply': 'म्युनिसिपल सप्लाई',
  'Borewell': 'बोरवेल',
  'Tanker': 'टैंकर',
  'Septic tank and soak pit': 'सेप्टिक टैंक और सोक पिट',
  'Public sewer': 'सार्वजनिक सीवर',
  'Economy': 'इकॉनमी',
  'Premium': 'प्रीमियम',
}
