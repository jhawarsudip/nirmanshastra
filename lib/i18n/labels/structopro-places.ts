import { STATE_HI } from '@/lib/i18n/states'

/**
 * Town names of the IS 1893 Annex E list (and the wind-speed table) in Devanagari, for the StructurePro text that
 * names a town ("Zone III for Pune ..."). The server sends the English spelling of the table; only the label changes.
 * A name the visitor typed themselves is never touched.
 */
export const TOWN_HI: Readonly<Record<string, string>> = {
  'Agra': 'आगरा', 'Ahmedabad': 'अहमदाबाद', 'Ajmer': 'अजमेर', 'Allahabad': 'इलाहाबाद', 'Almora': 'अल्मोड़ा', 'Ambala': 'अंबाला',
  'Amritsar': 'अमृतसर', 'Asansol': 'आसनसोल', 'Aurangabad': 'औरंगाबाद', 'Bahraich': 'बहराइच', 'Bangalore': 'बेंगलुरु', 'Barauni': 'बरौनी',
  'Bareilly': 'बरेली', 'Belgaum': 'बेलगाम', 'Bhatinda': 'बठिंडा', 'Bhilai': 'भिलाई', 'Bhopal': 'भोपाल', 'Bhubaneswar': 'भुवनेश्वर',
  'Bhuj': 'भुज', 'Bijapur': 'बीजापुर', 'Bikaner': 'बीकानेर', 'Bokaro': 'बोकारो', 'Bulandshahr': 'बुलंदशहर', 'Burdwan': 'बर्धमान',
  'Calicut': 'कालीकट', 'Chandigarh': 'चंडीगढ़', 'Chennai': 'चेन्नई', 'Chitradurga': 'चित्रदुर्ग', 'Coimbatore': 'कोयंबटूर', 'Cuddalore': 'कडलूर',
  'Cuttack': 'कटक', 'Darbhanga': 'दरभंगा', 'Darjeeling': 'दार्जिलिंग', 'Dharwad': 'धारवाड़', 'Dehra Dun': 'देहरादून', 'Dharampuri': 'धर्मपुरी',
  'Delhi': 'दिल्ली', 'Durgapur': 'दुर्गापुर', 'Gangtok': 'गंगटोक', 'Guwahati': 'गुवाहाटी', 'Goa': 'गोवा', 'Gulbarga': 'गुलबर्गा',
  'Gaya': 'गया', 'Gorakhpur': 'गोरखपुर', 'Hyderabad': 'हैदराबाद', 'Imphal': 'इंफाल', 'Jabalpur': 'जबलपुर', 'Jaipur': 'जयपुर',
  'Jamshedpur': 'जमशेदपुर', 'Jhansi': 'झाँसी', 'Jodhpur': 'जोधपुर', 'Jorhat': 'जोरहाट', 'Kakrapara': 'काकरापार', 'Kalpakkam': 'कलपक्कम',
  'Kanchipuram': 'कांचीपुरम', 'Kanpur': 'कानपुर', 'Karwar': 'कारवार', 'Kohima': 'कोहिमा', 'Kolkata': 'कोलकाता', 'Kota': 'कोटा',
  'Kurnool': 'कुरनूल', 'Lucknow': 'लखनऊ', 'Ludhiana': 'लुधियाना', 'Madurai': 'मदुरै', 'Mandi': 'मंडी', 'Mangalore': 'मंगलुरु',
  'Monghyr': 'मुंगेर', 'Moradabad': 'मुरादाबाद', 'Mumbai': 'मुंबई', 'Mysore': 'मैसूर', 'Nagpur': 'नागपुर', 'Nagarjunasagar': 'नागार्जुनसागर',
  'Nainital': 'नैनीताल', 'Nasik': 'नासिक', 'Nellore': 'नेल्लोर', 'Osmanabad': 'उस्मानाबाद', 'Panjim': 'पणजी', 'Patiala': 'पटियाला',
  'Patna': 'पटना', 'Pilibhit': 'पीलीभीत', 'Pondicherry': 'पांडिचेरी', 'Pune': 'पुणे', 'Raipur': 'रायपुर', 'Rajkot': 'राजकोट',
  'Ranchi': 'राँची', 'Roorkee': 'रुड़की', 'Rourkela': 'राउरकेला', 'Sadiya': 'सादिया', 'Salem': 'सेलम', 'Simla': 'शिमला',
  'Sironj': 'सिरोंज', 'Solapur': 'सोलापुर', 'Srinagar': 'श्रीनगर', 'Surat': 'सूरत', 'Tarapur': 'तारापुर', 'Tezpur': 'तेज़पुर',
  'Thane': 'ठाणे', 'Thanjavur': 'तंजावुर', 'Thiruvananthapuram': 'तिरुवनंतपुरम', 'Tiruchirappalli': 'तिरुचिरापल्ली', 'Tiruvannamalai': 'तिरुवन्नामलाई',
  'Udaipur': 'उदयपुर', 'Vadodara': 'वडोदरा', 'Varanasi': 'वाराणसी', 'Vellore': 'वेल्लोर', 'Vijayawada': 'विजयवाड़ा', 'Visakhapatnam': 'विशाखापत्तनम',
}

const NAMES_HI: Readonly<Record<string, string>> = { ...TOWN_HI, ...STATE_HI }

const NAME_RE = new RegExp(`(?<![A-Za-z])(${Object.keys(NAMES_HI).sort((a, b) => b.length - a.length).join('|')})(?![A-Za-z])`, 'g')

/** Swap the English spelling of a listed town or a state for its Devanagari name inside a Hindi sentence. */
export function placesHi(s: string): string {
  return s.replace(NAME_RE, m => NAMES_HI[m] ?? m)
}
