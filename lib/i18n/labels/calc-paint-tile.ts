import type { Dict } from '@/lib/i18n/tr'

/**
 * Hindi for the paint-system labels, coats and sources that lib/qty/interior/finish.ts (IN_SYS) and paint-tile-engine.ts
 * (TIER_NAME) send to the Paint and Tile Calculator. Looked up at display time; the engine is untouched.
 */
export const PAINT_TILE_DICT: Dict = {
  Economy: 'इकोनॉमी',
  Standard: 'स्टैंडर्ड',
  Premium: 'प्रीमियम',

  // economy
  'Economy: acrylic distemper over primer': 'इकोनॉमी: प्राइमर पर एक्रिलिक डिस्टेंपर',
  'One coat of primer and two coats of distemper': 'प्राइमर का एक कोट और डिस्टेंपर के दो कोट',
  'CPWD DAR 2016 item 13.42 (0.070 L a m²); maker sheets 0.067 to 0.083':
    'CPWD दर विश्लेषण 2016 आइटम 13.42 (0.070 L प्रति m²); निर्माताओं की शीट 0.067 से 0.083',
  'Acrylic distemper, 2 coats': 'एक्रिलिक डिस्टेंपर, 2 कोट',
  'Maker sheet: 65 to 75 sq ft a litre for two coats (0.14 to 0.17 L a m²)':
    'निर्माता की शीट: दो कोट के लिए 65 से 75 वर्ग फ़ुट प्रति लीटर (0.14 से 0.17 L प्रति m²)',

  // standard
  'Standard: putty, primer and emulsion': 'स्टैंडर्ड: पुट्टी, प्राइमर और इमल्शन',
  'Cement putty (about 1 mm), one coat of primer, two coats of emulsion':
    'सीमेंट पुट्टी (लगभग 1 mm), प्राइमर का एक कोट, इमल्शन के दो कोट',
  'Wall putty, cement based': 'वॉल पुट्टी, सीमेंट आधारित',
  'Maker sheet: 10 to 15 sq ft a kg for 1.5 mm in two coats, scaled to 1 mm (0.48 to 0.72 kg a m²)':
    'निर्माता की शीट: दो कोट में 1.5 mm के लिए 10 से 15 वर्ग फ़ुट प्रति kg, 1 mm के हिसाब से बदला हुआ (0.48 से 0.72 kg प्रति m²)',
  'Maker sheet: 130 to 160 sq ft a litre (0.067 to 0.083 L a m²)':
    'निर्माता की शीट: 130 से 160 वर्ग फ़ुट प्रति लीटर (0.067 से 0.083 L प्रति m²)',
  'Interior emulsion, 2 coats': 'इंटीरियर इमल्शन, 2 कोट',
  'Maker sheets: 0.083 to 0.100 L a m² for two coats': 'निर्माताओं की शीट: दो कोट के लिए 0.083 से 0.100 L प्रति m²',

  // premium
  'Premium: acrylic putty, primer and luxury emulsion': 'प्रीमियम: एक्रिलिक पुट्टी, प्राइमर और लक्ज़री इमल्शन',
  'Acrylic putty in two coats, one coat of primer, two coats of luxury emulsion':
    'एक्रिलिक पुट्टी के दो कोट, प्राइमर का एक कोट, लक्ज़री इमल्शन के दो कोट',
  'Wall putty, acrylic': 'वॉल पुट्टी, एक्रिलिक',
  'Maker sheet: 24 to 35 sq ft a kg in two coats (0.31 to 0.45 kg a m²)':
    'निर्माता की शीट: दो कोट में 24 से 35 वर्ग फ़ुट प्रति kg (0.31 से 0.45 kg प्रति m²)',
  'Luxury emulsion, 2 coats': 'लक्ज़री इमल्शन, 2 कोट',
  'Maker sheet: 14.5 m² a litre a coat at 30 microns (0.138 L a m² for two coats)':
    'निर्माता की शीट: 30 माइक्रोन पर प्रति कोट 14.5 m² प्रति लीटर (दो कोट के लिए 0.138 L प्रति m²)',
}

/** Hindi for the wastage reasons the page builds from the lay, the room and the tile size. */
export const WASTE_TEXT_HI = (lay: 'straight' | 'diagonal', small: boolean, large: boolean) =>
  small
    ? 'छोटा कमरा या बाथरूम: ज़्यादा टाइलें कटती हैं'
    : lay === 'diagonal'
      ? large ? 'बड़ी टाइल की तिरछी बिछाई' : 'तिरछी बिछाई'
      : large ? 'बड़ी टाइल कटिंग में ज़्यादा टूटती है' : 'छोटी टाइल की सीधी बिछाई'
