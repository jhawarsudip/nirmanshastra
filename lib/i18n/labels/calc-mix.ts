import type { Dict } from '@/lib/i18n/tr'

/** Hindi for the exposure names, grade notes and mix basis lines that concrete-mix-engine.ts and lib/structopro-qty/materials.ts send to the Concrete Mix Calculator. */
export const MIX_DICT: Dict = {
  'Mild: inland, dry, normal weather': 'हल्का: भीतरी इलाक़ा, सूखा, सामान्य मौसम',
  'Moderate: wet, sheltered from rain, or buried in non-aggressive soil': 'मध्यम: नम, बारिश से बचा हुआ, या ग़ैर-हानिकारक मिट्टी में दबा',
  'Severe: rain-exposed, often wet, or in coastal air': 'कठोर: बारिश में खुला, अक्सर गीला, या समुद्री हवा में',
  'Very severe: salt spray, tidal, or sulphate soil': 'बहुत कठोर: नमक की फुहार, ज्वार वाला, या सल्फ़ेट मिट्टी',
  'Extreme: tidal zone, or in contact with aggressive chemicals': 'अत्यंत कठोर: ज्वार क्षेत्र, या हानिकारक रसायनों के संपर्क में',

  'Plain concrete for levelling.': 'लेवलिंग के लिए सादा कंक्रीट।',
  'Plain concrete: the levelling course under footings and floors. Not for reinforced work.':
    'सादा कंक्रीट: फुटिंग और फ़र्श के नीचे की लेवलिंग परत। सरिया वाले काम के लिए नहीं।',
  'Plain concrete: the bed under footings and floors. Below the minimum for reinforced work.':
    'सादा कंक्रीट: फुटिंग और फ़र्श के नीचे की परत। सरिया वाले काम के न्यूनतम से नीचे।',
  'The lowest grade IS 456 allows for reinforced concrete, in a mild site.':
    'हल्की साइट में रीइन्फ़ोर्स्ड कंक्रीट के लिए IS 456 जो सबसे कम ग्रेड मानता है।',
  'Reinforced concrete in a moderate site, and a common choice for frames of several floors.':
    'मध्यम साइट में रीइन्फ़ोर्स्ड कंक्रीट, और कई मंज़िलों के ढाँचों के लिए आम पसंद।',
  'Reinforced concrete in a severe site.': 'कठोर साइट में रीइन्फ़ोर्स्ड कंक्रीट।',
  'Reinforced concrete in a very severe site.': 'बहुत कठोर साइट में रीइन्फ़ोर्स्ड कंक्रीट।',
  'Reinforced concrete in an extreme site.': 'अत्यंत कठोर साइट में रीइन्फ़ोर्स्ड कंक्रीट।',

  'CPWD DAR 2014 item {0}, nominal mix {1}': 'CPWD दर विश्लेषण 2014 आइटम {0}, नामिनल मिक्स {1}',
  'IS 10262:2009 design mix, w/c {0}, water {1} L, 20 mm aggregate': 'IS 10262:2009 डिज़ाइन मिक्स, जल-सीमेंट अनुपात {0}, पानी {1} L, 20 mm गिट्टी',
}
