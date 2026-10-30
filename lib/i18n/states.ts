import type { Locale } from './paths'

/**
 * State and union-territory names in Devanagari, for the dropdowns on Hindi pages.
 * The value stored and sent to the server is always the English name (it keys the city lists and the rules);
 * only the label the visitor reads changes. City names are proper nouns and stay as they are.
 */
export const STATE_HI: Readonly<Record<string, string>> = {
  'Andaman and Nicobar Islands': 'अंडमान और निकोबार द्वीप समूह',
  'Andhra Pradesh': 'आंध्र प्रदेश',
  'Arunachal Pradesh': 'अरुणाचल प्रदेश',
  'Assam': 'असम',
  'Bihar': 'बिहार',
  'Chandigarh': 'चंडीगढ़',
  'Chhattisgarh': 'छत्तीसगढ़',
  'Dadra and Nagar Haveli and Daman and Diu': 'दादरा और नगर हवेली तथा दमन और दीव',
  'Delhi': 'दिल्ली',
  'Goa': 'गोवा',
  'Gujarat': 'गुजरात',
  'Haryana': 'हरियाणा',
  'Himachal Pradesh': 'हिमाचल प्रदेश',
  'Jammu and Kashmir': 'जम्मू और कश्मीर',
  'Jharkhand': 'झारखंड',
  'Karnataka': 'कर्नाटक',
  'Kerala': 'केरल',
  'Ladakh': 'लद्दाख',
  'Lakshadweep': 'लक्षद्वीप',
  'Madhya Pradesh': 'मध्य प्रदेश',
  'Maharashtra': 'महाराष्ट्र',
  'Manipur': 'मणिपुर',
  'Meghalaya': 'मेघालय',
  'Mizoram': 'मिज़ोरम',
  'Nagaland': 'नागालैंड',
  'Odisha': 'ओडिशा',
  'Puducherry': 'पुदुचेरी',
  'Punjab': 'पंजाब',
  'Rajasthan': 'राजस्थान',
  'Sikkim': 'सिक्किम',
  'Tamil Nadu': 'तमिलनाडु',
  'Telangana': 'तेलंगाना',
  'Tripura': 'त्रिपुरा',
  'Uttar Pradesh': 'उत्तर प्रदेश',
  'Uttarakhand': 'उत्तराखंड',
  'West Bengal': 'पश्चिम बंगाल',
}

/** The state's name as the visitor should read it: Devanagari on a Hindi page, the English name otherwise. */
export function stateLabel(state: string, locale: Locale | string): string {
  return locale === 'hi' ? (STATE_HI[state] ?? state) : state
}
