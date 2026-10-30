import type { Dict } from '@/lib/i18n/tr'

/**
 * Hindi for the words lib/qty/electrical/wire.ts and wire-size-engine.ts send to the Wire Size Calculator
 * (circuit names, examples, basis, limits, risks, cable sets, colours, load bands). The model is not touched.
 */
export const WIRE_DICT: Dict = {
  // circuits
  'Lights, fans and the bell': 'लाइट, पंखे और बेल',
  'Ceiling lights, tube lights, LED panels, ceiling fans, exhaust fans, the door bell.':
    'छत की लाइटें, ट्यूब लाइटें, LED पैनल, छत के पंखे, एग्ज़ॉस्ट फ़ैन, दरवाज़े की घंटी।',
  'CPWD GS 3.12(ii) and draft IS 4648 Table 4 give 1.5 mm² for light, fan and bell points; draft cl 6.2.8 puts a breaker of up to 6 A on a lighting circuit.':
    'CPWD GS 3.12(ii) और मसौदा IS 4648 Table 4 लाइट, पंखे और बेल के पॉइंट के लिए 1.5 mm² देते हैं; मसौदा cl 6.2.8 लाइट सर्किट पर 6 A तक का ब्रेकर रखता है।',
  'Up to 10 points and 800 W on a circuit in IS 4648:1968 cl 7.2; the draft says 8 points or 1,000 W.':
    'IS 4648:1968 cl 7.2 में एक सर्किट पर 10 पॉइंट और 800 W तक; मसौदा 8 पॉइंट या 1,000 W कहता है।',
  'Thinner than 1.5 mm² is not allowed, even for a single light.':
    'एक अकेली लाइट के लिए भी 1.5 mm² से पतला तार मंज़ूर नहीं है।',

  '6 A sockets: chargers, TV, small appliances': '6 A सॉकेट: चार्जर, TV, छोटे उपकरण',
  'Ordinary 3-pin wall sockets for chargers, the TV, a mixer, a lamp.':
    'चार्जर, TV, मिक्सर, लैंप के लिए आम 3-पिन दीवार सॉकेट।',
  'Draft IS 4648 Table 4 gives 2.5 mm² from the board to the sockets; draft cl 6.2.8 allows up to 10 A where a circuit has more than two 6 A sockets.':
    'मसौदा IS 4648 Table 4 बोर्ड से सॉकेट तक 2.5 mm² देता है; मसौदा cl 6.2.8 जहाँ सर्किट में दो से ज़्यादा 6 A सॉकेट हों वहाँ 10 A तक की इजाज़त देता है।',
  'The sources disagree: CPWD GS 3.10 allows up to three 6 A outlets on a power circuit, and the model here counts up to eight sockets on one.':
    'स्रोत आपस में अलग हैं: CPWD GS 3.10 पावर सर्किट पर तीन 6 A आउटलेट तक की इजाज़त देता है, और यहाँ का मॉडल एक सर्किट पर आठ सॉकेट तक गिनता है।',
  'On 1.5 mm² the wire can overheat when a heater or iron is plugged into a 6 A socket, and the insulation weakens inside the wall.':
    '1.5 mm² पर, 6 A सॉकेट में हीटर या आयरन लगाने से तार गरम हो सकता है, और दीवार के अंदर इन्सुलेशन कमज़ोर पड़ता है।',

  '16 A power sockets: fridge, microwave, iron': '16 A पावर सॉकेट: फ़्रिज, माइक्रोवेव, आयरन',
  'Heavier 3-pin sockets for the fridge, microwave, iron, mixer-grinder, kitchen appliances.':
    'फ़्रिज, माइक्रोवेव, आयरन, मिक्सर-ग्राइंडर, रसोई के उपकरणों के लिए भारी 3-पिन सॉकेट।',
  'Draft IS 4648 Table 4 gives 2.5 mm² from the board to two 6/16 A outlets; draft cl 6.2.8 gives a 16 A breaker for up to two 16 A outlets.':
    'मसौदा IS 4648 Table 4 बोर्ड से दो 6/16 A आउटलेट तक 2.5 mm² देता है; मसौदा cl 6.2.8 दो 16 A आउटलेट तक के लिए 16 A का ब्रेकर देता है।',
  'Up to two 16 A outlets on one circuit, or 3 kW (CPWD GS 3.10(iii); draft IS 4648 cl 6.2.2).':
    'एक सर्किट पर दो 16 A आउटलेट तक, या 3 kW (CPWD GS 3.10(iii); मसौदा IS 4648 cl 6.2.2)।',
  'CPWD GS 3.12(ii) asks for 4 mm² on power wiring in its own works. The draft allows 2.5 mm²; choose 4 mm² if the run is long or you want spare capacity.':
    'CPWD GS 3.12(ii) अपने कामों में पावर वायरिंग पर 4 mm² माँगता है। मसौदा 2.5 mm² की इजाज़त देता है; रन लंबा हो या फ़ालतू क्षमता चाहिए तो 4 mm² चुनिए।',

  'Water heater, washing machine or dishwasher': 'वॉटर हीटर, वॉशिंग मशीन या डिशवॉशर',
  'A storage geyser, an instant geyser, a washing machine, a dishwasher, a microwave or induction cooker on its own circuit.':
    'स्टोरेज गीज़र, इंस्टेंट गीज़र, वॉशिंग मशीन, डिशवॉशर, अपने अलग सर्किट पर माइक्रोवेव या इंडक्शन कुकर।',
  'Draft IS 4648 Table 4 gives 2.5 mm² from the board to one dedicated point of up to 3 kW (geyser, microwave, induction).':
    'मसौदा IS 4648 Table 4 बोर्ड से 3 kW तक के एक अलग पॉइंट (गीज़र, माइक्रोवेव, इंडक्शन) के लिए 2.5 mm² देता है।',
  'Every appliance of 2 kW or more has a circuit of its own (draft IS 4648 cl 6.2.2).':
    '2 kW या उससे ज़्यादा के हर उपकरण का अपना अलग सर्किट होता है (मसौदा IS 4648 cl 6.2.2)।',
  'An appliance of 2 kW or more on a shared circuit overloads it. Above 3 kW, the size is worked out for the load and is not this one.':
    '2 kW या उससे ज़्यादा का उपकरण साझा सर्किट पर उसे ओवरलोड कर देता है। 3 kW से ऊपर, साइज़ लोड के हिसाब से निकाला जाता है और यह वाला नहीं रहता।',

  'Air conditioner (2 to 3 TR)': 'एयर कंडीशनर (2 से 3 TR)',
  'A split or window air conditioner of 2 to 3 TR, on a circuit of its own.':
    '2 से 3 TR का स्प्लिट या विंडो एयर कंडीशनर, अपने अलग सर्किट पर।',
  'Draft IS 4648 Table 4 gives 4 mm² from the board to one 16 or 25 A point of up to 5 kW (an air conditioner of 2 to 3 TR); draft cl 6.2.8 gives 20 or 25 A, with a C-curve breaker for the motor.':
    'मसौदा IS 4648 Table 4 बोर्ड से 5 kW तक के एक 16 या 25 A पॉइंट (2 से 3 TR का एयर कंडीशनर) के लिए 4 mm² देता है; मसौदा cl 6.2.8 मोटर के लिए C-कर्व ब्रेकर के साथ 20 या 25 A देता है।',
  'One circuit for each air conditioner (draft IS 4648 cl 6.2.2).':
    'हर एयर कंडीशनर के लिए एक सर्किट (मसौदा IS 4648 cl 6.2.2)।',
  'On 2.5 mm² the wire runs hot all the time an air conditioner works, and the breaker may nuisance-trip or fail to protect the wire.':
    '2.5 mm² पर एयर कंडीशनर चलने भर तार गरम रहता है, और ब्रेकर बेवजह ट्रिप हो सकता है या तार को बचा नहीं पाता।',

  // supply
  'The supply into the house or a flat, from the meter': 'मीटर से घर या फ़्लैट में आने वाली सप्लाई',
  '{0} × {1} mm² + {2} mm² earth': '{0} × {1} mm² + {2} mm² अर्थ',
  '{0} A, {1}-pole': '{0} A, {1}-पोल',
  'The draft IS 4648 Table 4 only hints at three phase (4 or 6 mm² with the load balanced to within 10%), so these sizes are an assumption. Your electricity board fixes the supply and the cable.':
    'मसौदा IS 4648 Table 4 थ्री फ़ेज़ का सिर्फ़ इशारा करता है (लोड 10% के भीतर संतुलित हो तो 4 या 6 mm²), इसलिए ये साइज़ एक मान्यता हैं। सप्लाई और केबल आपका बिजली बोर्ड तय करता है।',
  'Draft IS 4648 Table 4: up to 5 kW 4 mm², over 5 up to 7 kW 6 mm², over 7 up to 10 kW 10 mm². The table leaves exactly 7 kW out of its two bands; it is put with 6 mm² here.':
    'मसौदा IS 4648 Table 4: 5 kW तक 4 mm², 5 से ऊपर 7 kW तक 6 mm², 7 से ऊपर 10 kW तक 10 mm²। तालिका अपने दोनों बैंड में से ठीक 7 kW को छोड़ देती है; यहाँ इसे 6 mm² के साथ रखा गया है।',
  'The draft IS 4648 Table 4 stops at 10 kW. Above that it asks for diversity, a size worked from the IS 732:2019 current ratings, a derating factor and one size up, so this size is an assumption.':
    'मसौदा IS 4648 Table 4 10 kW पर रुक जाती है। उससे ऊपर वह डाइवर्सिटी, IS 732:2019 की करंट रेटिंग से निकाला साइज़, एक डिरेटिंग फ़ैक्टर और एक साइज़ ऊपर माँगता है, इसलिए यह साइज़ एक मान्यता है।',
  'The main breaker is never larger than the cable can carry. 32 A is the usual home incomer in tender board items, a secondary source; 40 and 63 A are assumptions.':
    'मेन ब्रेकर कभी उससे बड़ा नहीं होता जितना केबल झेल सकती है। टेंडर बोर्ड आइटमों में घर का आम इनकमर 32 A दिखता है, जो एक सहायक स्रोत है; 40 और 63 A मान्यताएँ हैं।',
  'The supply cable carries the load of every circuit in the home at once, so an undersized one is the weakest point of the whole installation.':
    'सप्लाई केबल घर के हर सर्किट का लोड एक साथ ढोती है, इसलिए छोटे साइज़ की केबल पूरी वायरिंग की सबसे कमज़ोर कड़ी होती है।',
  'Red, yellow and blue lines, black neutral, green earth': 'लाल, पीली और नीली लाइनें, काला न्यूट्रल, हरा अर्थ',
  'Red live, black neutral, green earth': 'लाल लाइव, काला न्यूट्रल, हरा अर्थ',

  // load bands
  'Up to {0} kW': '{0} kW तक',
  'Over {0} up to {1} kW': '{0} से ऊपर {1} kW तक',
  'Over {0} kW': '{0} kW से ऊपर',

  // basis column
  'Draft IS 4648 Table 4': 'मसौदा IS 4648 Table 4',
  Assumed: 'मान्यता',
  'CPWD GS 3.12 and draft IS 4648': 'CPWD GS 3.12 और मसौदा IS 4648',
}
