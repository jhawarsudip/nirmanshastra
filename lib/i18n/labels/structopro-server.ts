/**
 * Hindi for the sentences the StructurePro SERVER sends (lib/structopro-qty, app/api/structopro, payments).
 *
 * The model returns finished English strings and freezes them into each saved report, and the PDFs stay English, so
 * nothing at the source is touched. The page looks every string up here at display time (see structopro-tr.ts).
 *
 * How it works. A server string is often several sentences joined by a space (the "Engineer review" check lists every
 * warning, a compliance line adds a wind sentence to a speed sentence, an assumption holds the zone note). So the
 * dictionary below is written in SENTENCES, and `structTr` reads a string from the left, finds the longest sentence
 * that fits at that point, and moves on. {0} {1}... stand for the numbers or names that change; they are copied over
 * as they are. A sentence with no entry is left in English, never dropped. Names of towns and states are swapped to
 * Devanagari at the very end (structopro-places.ts).
 *
 * `scratchpad/hi-B/coverage.ts` runs the real model over many inputs and lists every string this does not cover.
 */
import type { Dict } from '@/lib/i18n/tr'
import { tr } from '@/lib/i18n/tr'
import { QTY_ERRORS } from './qty-errors'
import { placesHi } from './structopro-places'

// ---- parts that vary by site, wall, exposure -------------------------------------------------------------------

const SITE_HI: Record<string, string> = {
  'ordinary firm soil': 'सामान्य कड़ी मिट्टी',
  'mild slope, footings stepped': 'हल्की ढलान, सीढ़ीनुमा फुटिंग',
  'steep slope': 'तेज़ ढलान',
  'rock, footings cut into rock': 'चट्टान, फुटिंग चट्टान को काटकर',
  'black cotton soil': 'काली कपास मिट्टी',
  'soft or marshy ground': 'नरम या दलदली ज़मीन',
  'high water table': 'ऊँचे भूजल वाली ज़मीन',
  'coastal, salt-laden air': 'तटीय इलाक़ा, नमकीन हवा',
}
const FOUNDATION_HI: Record<string, string> = { 'raft': 'रैफ़्ट', 'isolated footings': 'अलग-अलग फुटिंग' }
const WALL_HI: Record<string, string> = { brick: 'ईंट की', block: 'ब्लॉक की' }
const EXPOSURE_HI: Record<string, string> = {
  'mild': 'हल्के',
  'moderate': 'मध्यम',
  'severe': 'तीव्र',
  'very severe': 'बहुत तीव्र',
  'extreme': 'अत्यधिक',
}
const QUOTE_NAME_HI: Record<string, string> = { concrete: 'कंक्रीट', steel: 'स्टील', cement: 'सीमेंट', shuttering: 'शटरिंग' }

// the wind sentence has two optional / alternative parts
const WIND_STATE_PAREN_EN = ' (your town is not in the speed table, so the highest speed this state commonly sees is used)'
const WIND_STATE_PAREN_HI = ' (आपका शहर हवा की गति की तालिका में नहीं है, इसलिए इस राज्य में आम तौर पर दिखने वाली सबसे ज़्यादा गति ली गई है)'
const WIND_GOVERNS: [string, string][] = [
  ['the earthquake governs in both directions', 'दोनों दिशाओं में भूकंप का बल बड़ा है'],
  ['the wind governs in both directions', 'दोनों दिशाओं में हवा का बल बड़ा है'],
  ['the wind governs in one direction', 'एक दिशा में हवा का बल बड़ा है'],
]

// ---- the dictionary ---------------------------------------------------------------------------------------------

const D: Record<string, string> = {
  // seismic zone and where it came from (lib/structopro-qty/zones.ts)
  'Seismic zone {0}.': 'भूकंप ज़ोन {0}।',
  'Zone {0} for {1} (IS 1893:2002 Annex E). IS 1893:2016 is the edition in force: confirm with a local structural engineer.':
    'ज़ोन {0}, {1} के लिए (IS 1893:2002 का परिशिष्ट E)। IS 1893:2016 अब लागू संस्करण है: किसी स्थानीय स्ट्रक्चरल इंजीनियर से पक्का कर लीजिए।',
  'Your town is not in the IS 1893:2002 Annex E list. Zone {0} is used as the typical value for {1} (listed towns there range from Zone {2} to Zone {3}). Confirm with a local structural engineer.':
    'आपका शहर IS 1893:2002 के परिशिष्ट E की सूची में नहीं है। {1} के लिए सामान्य मान के रूप में ज़ोन {0} लिया गया है (वहाँ की सूची के शहर ज़ोन {2} से ज़ोन {3} तक आते हैं)। किसी स्थानीय स्ट्रक्चरल इंजीनियर से पक्का कर लीजिए।',
  'No listed town for {0}; Zone {1} used as a conservative state value. Confirm with a local structural engineer.':
    '{0} के लिए सूची में कोई शहर नहीं है; सुरक्षित पक्ष का राज्य-मान ज़ोन {1} लिया गया है। किसी स्थानीय स्ट्रक्चरल इंजीनियर से पक्का कर लीजिए।',
  'Zone {0} set by the user.': 'ज़ोन {0} आपने खुद तय किया है।',

  // assumptions
  'Layout: regular grid of {0} x {1} bays of about {2} x {3} m, storey height {4} m, plinth {5} m. Your own drawing will differ.':
    'नक्शे का ढाँचा: {0} × {1} खानों का नियमित ग्रिड, हर खाना लगभग {2} × {3} m, मंज़िल की ऊँचाई {4} m, प्लिंथ {5} m। आपका अपना नक्शा इससे अलग होगा।',
  'Zone III and above: special moment-resisting frame, ductile detailing to IS 13920:1993 (closer stirrups at the ends and tie spacing to cl. 7.4.6, a strong-column weak-beam check at the tool\'s own factor of 1.1; the confining-steel area of cl. 7.4.8 is not checked).':
    'ज़ोन III और उससे ऊपर: विशेष मोमेंट-रेज़िस्टिंग फ़्रेम, IS 13920:1993 के अनुसार डक्टाइल डिटेलिंग (सिरों पर पास-पास स्टिरप और टाई की दूरी cl. 7.4.6 के अनुसार, मज़बूत कॉलम-कमज़ोर बीम की जाँच टूल के अपने गुणक 1.1 पर; cl. 7.4.8 का कन्फ़ाइनिंग स्टील एरिया जाँचा नहीं गया है)।',
  'Zone II: ordinary moment-resisting frame, detailing to IS 456.':
    'ज़ोन II: साधारण मोमेंट-रेज़िस्टिंग फ़्रेम, IS 456 के अनुसार डिटेलिंग।',
  'Concrete: {0} above ground and {1} for foundations, chosen from the exposure condition (IS 456 Table 5). Steel: Fe500D.':
    'कंक्रीट: ज़मीन के ऊपर {0} और नींव के लिए {1}, एक्सपोज़र की स्थिति के हिसाब से चुना गया (IS 456 तालिका 5)। स्टील: Fe500D।',
  'Slab {0} mm thick (span/depth, IS 456 cl 23.2); beams {1} mm wide with depth from bending, shear and deflection; columns sized by the biaxial check of IS 456 cl 39.6.':
    'स्लैब {0} mm मोटी (स्पैन/डेप्थ, IS 456 cl 23.2); बीम {1} mm चौड़ी, गहराई बेंडिंग, शियर और डिफ़्लेक्शन से तय; कॉलम का साइज़ IS 456 cl 39.6 की द्विअक्षीय जाँच से तय।',
  'Reinforcement is bought in 12 m bars (6 mm comes as a coil, cut and bent on site) with 5 % wastage (CPWD DAR 5.22.1). Binding wire is {0} kg per tonne.':
    'सरिया 12 m की छड़ों में ख़रीदा जाता है (6 mm कॉइल में आता है, साइट पर काटा और मोड़ा जाता है), 5 % कटाई की बर्बादी के साथ (CPWD डीएआर 5.22.1)। बाइंडिंग तार {0} kg प्रति टन है।',
  'Cement, sand and aggregate: CPWD Delhi Analysis of Rates 2014 for M20 and below, IS 10262 mix design above that, plus {0} % site wastage.':
    'सीमेंट, रेत और गिट्टी: M20 और उससे नीचे के लिए CPWD दिल्ली दर-विश्लेषण (डीएआर) 2014, उससे ऊपर IS 10262 मिक्स डिज़ाइन, साथ में {0} % साइट पर बर्बादी।',
  'Lintels, sunshades, the terrace parapet band and the stair head-room roof are counted from the plan perimeter and floor area ({0} lintels over doors and windows, {1} sunshades (chajjas), {2} terrace parapet coping band); their sizes are site practice, not code values.':
    'लिंटल, सनशेड, छत का पैरापेट बैंड और सीढ़ी के हेड-रूम की छत नक्शे के घेरे और फ़र्श के एरिया से गिने गए हैं ({0} लिंटल दरवाज़ों-खिड़कियों के ऊपर, {1} सनशेड (छज्जे), {2} छत का पैरापेट कॉपिंग बैंड); इनके साइज़ साइट की प्रचलित रीति से हैं, कोड के मान नहीं।',
  'Lintels, sunshades, the terrace parapet band and the stair head-room roof are counted from the plan perimeter and floor area ({0} lintels over doors and windows, {1} sunshades (chajjas), {2} terrace parapet coping band, {3} stair head-room (mumty) roof); their sizes are site practice, not code values.':
    'लिंटल, सनशेड, छत का पैरापेट बैंड और सीढ़ी के हेड-रूम की छत नक्शे के घेरे और फ़र्श के एरिया से गिने गए हैं ({0} लिंटल दरवाज़ों-खिड़कियों के ऊपर, {1} सनशेड (छज्जे), {2} छत का पैरापेट कॉपिंग बैंड, {3} सीढ़ी के हेड-रूम (ममटी) की छत); इनके साइज़ साइट की प्रचलित रीति से हैं, कोड के मान नहीं।',
  'Soil-structure interaction and torsion are not analysed; the earthquake forces are IS 1893 equivalent static forces shared equally between frames. Wind pressures use the 1987 basis with no directionality factor and no hill or shielding effect. The wind speed for a town comes from a published city table: the engineer should confirm it against the wind map of IS 875 (Part 3).':
    'मिट्टी और ढाँचे का आपसी असर और टॉर्शन नहीं जाँचे गए हैं; भूकंप के बल IS 1893 के समतुल्य स्थैतिक बल हैं, जो फ़्रेमों में बराबर बाँटे गए हैं। हवा के दबाव 1987 के आधार पर लिए गए हैं, बिना दिशा-गुणक और बिना पहाड़ी या आड़ के असर के। किसी शहर की हवा की गति प्रकाशित शहर-तालिका से आती है: इंजीनियर इसे IS 875 (Part 3) के हवा-नक्शे से मिला लें।',
  'Zone II: 6 mm links and ties, which IS 456 allows (cl 26.5.3.2); the ductile detailing of Zones III and above keeps 8 mm at least.':
    'ज़ोन II: 6 mm के लिंक और टाई, जिनकी IS 456 अनुमति देता है (cl 26.5.3.2); ज़ोन III और उससे ऊपर की डक्टाइल डिटेलिंग में कम से कम 8 mm रहता है।',

  // stilt (open parking level)
  'The ground level is open for parking: columns only, no walls. Its earthquake shear and moment are multiplied by {0} (IS 1893:2002 cl 7.10.3), its columns are at least {1} mm, and the ties are the closely spaced confining ties over the full height (IS 13920). A structural engineer must analyse such a building: shear walls or bracing at the open level are often added.':
    'ग्राउंड लेवल पार्किंग के लिए खुला है: सिर्फ़ कॉलम, कोई दीवार नहीं। इसका भूकंप शियर और मोमेंट {0} गुना किया गया है (IS 1893:2002 cl 7.10.3), इसके कॉलम कम से कम {1} mm के हैं, और टाई पूरी ऊँचाई पर पास-पास कन्फ़ाइनिंग टाई हैं (IS 13920)। ऐसी इमारत का विश्लेषण स्ट्रक्चरल इंजीनियर को करना होगा: खुले तल पर अक्सर शियर वॉल या ब्रेसिंग जोड़ी जाती है।',
  'The ground level is open for parking: columns only, no walls. Its earthquake shear and moment are multiplied by {0} (IS 1893:2002 cl 7.10.3), its columns are at least {1} mm, with the ties of IS 456. A structural engineer must analyse such a building: shear walls or bracing at the open level are often added.':
    'ग्राउंड लेवल पार्किंग के लिए खुला है: सिर्फ़ कॉलम, कोई दीवार नहीं। इसका भूकंप शियर और मोमेंट {0} गुना किया गया है (IS 1893:2002 cl 7.10.3), इसके कॉलम कम से कम {1} mm के हैं, और टाई IS 456 के अनुसार हैं। ऐसी इमारत का विश्लेषण स्ट्रक्चरल इंजीनियर को करना होगा: खुले तल पर अक्सर शियर वॉल या ब्रेसिंग जोड़ी जाती है।',
  'Open parking level (stilt): IS 1893:2002 asks for {0} times the earthquake force in the open storey, and the later IS 1893:2016 treats such a storey as an irregularity that needs a dynamic analysis by an engineer. This report adds the {1} factor, {2} mm minimum columns and full-height confinement; it is a planning figure and not a design of the open level.':
    'खुला पार्किंग तल (स्टिल्ट): IS 1893:2002 खुली मंज़िल में भूकंप के बल का {0} गुना माँगता है, और बाद का IS 1893:2016 ऐसी मंज़िल को अनियमितता मानता है जिसका डायनामिक विश्लेषण इंजीनियर को करना होगा। यह रिपोर्ट {1} का गुणक, कम से कम {2} mm के कॉलम और पूरी ऊँचाई पर कन्फ़ाइनमेंट जोड़ती है; यह योजना के लिए आँकड़ा है, खुले तल का डिज़ाइन नहीं।',

  // balcony
  'Each balcony projects {0} m, {1} m along the wall, {2} mm thick, carrying 3.0 kN/m2 and a 1 m brick parapet on its three edges. The top bars run {3} m back into the floor slab. The slab is taken as continuous with the floor, so the supporting beam is designed for the balcony as a load. A balcony that does not continue into the floor slab needs its supporting beam designed for torsion by an engineer.':
    'हर बालकनी {0} m बाहर निकली है, दीवार के साथ {1} m लंबी, {2} mm मोटी, 3.0 kN/m2 का भार उठाती हुई और अपने तीनों किनारों पर 1 m की ईंट की पैरापेट के साथ। ऊपर के सरिये {3} m पीछे फ़र्श की स्लैब में जाते हैं। स्लैब को फ़र्श के साथ लगातार माना गया है, इसलिए सहारा देने वाली बीम बालकनी को भार मानकर डिज़ाइन की गई है। जो बालकनी फ़र्श की स्लैब में आगे नहीं जाती, उसकी सहारा देने वाली बीम का टॉर्शन के लिए डिज़ाइन इंजीनियर से कराना होगा।',
  '{0} mm @ {1} mm, top': '{0} mm @ {1} mm, ऊपर',

  // not included
  'Brick or block masonry, plaster, flooring, doors, windows, painting, waterproofing':
    'ईंट या ब्लॉक की चिनाई, प्लास्टर, फ़र्श की फ़िनिशिंग, दरवाज़े, खिड़कियाँ, पेंटिंग, वॉटरप्रूफ़िंग',
  'Lift shaft, basement, water tank, sump, septic tank, compound wall, boundary gate':
    'लिफ़्ट शाफ़्ट, बेसमेंट, पानी की टंकी, सम्प, सेप्टिक टैंक, कंपाउंड वॉल, बाउंड्री गेट',
  'Balconies beyond the number you gave, porticos, canopies and other cantilevers; balcony railings and the brick parapet (brickwork is in MasonryPro)':
    'आपके बताए हुए से ज़्यादा बालकनी, पोर्टिको, कैनोपी और दूसरे कैंटिलीवर; बालकनी की रेलिंग और ईंट की पैरापेट (ईंट की चिनाई MasonryPro में है)',
  'Balconies, porticos, canopies and other cantilevers beyond the main grid':
    'मुख्य ग्रिड से बाहर निकली बालकनी, पोर्टिको, कैनोपी और दूसरे कैंटिलीवर',
  'Backfilling, plinth filling, anti-termite treatment, curing water, scaffolding hire':
    'मिट्टी की भराई, प्लिंथ की भराई, दीमक-रोधी उपचार, तराई का पानी, स्कैफ़ोल्डिंग का किराया',
  'Plumbing, electrical and finishing works': 'प्लंबिंग, बिजली और फ़िनिशिंग का काम',

  // mixes
  'above ground': 'ज़मीन के ऊपर',
  'foundations and below ground': 'नींव और ज़मीन के नीचे',
  'lean concrete under footings': 'फुटिंग के नीचे लीन कंक्रीट',
  'CPWD DAR 2014 item {0}, nominal mix {1}': 'CPWD डीएआर 2014 मद {0}, नॉमिनल मिक्स {1}',
  'IS 10262:2009 design mix, w/c {0}, water {1} L, {2} mm aggregate': 'IS 10262:2009 डिज़ाइन मिक्स, पानी-सीमेंट अनुपात {0}, पानी {1} L, {2} mm की गिट्टी',

  // schedules
  'corner': 'कोने का',
  'edge': 'किनारे का',
  'interior': 'बीच का',
  'edge beam': 'किनारे की बीम',
  'inner beam': 'भीतरी बीम',
  '{0} @ {1} full height': '{0} @ {1}, पूरी ऊँचाई पर',
  'bottom {0}, top {1}; stirrups {2}': 'नीचे {0}, ऊपर {1}; स्टिरप {2}',

  // lintels, sunshades and the rest (lib/structopro-qty/secondary.ts)
  'Lintels over doors and windows': 'दरवाज़ों और खिड़कियों के ऊपर लिंटल',
  'Sunshades (chajjas)': 'सनशेड (छज्जे)',
  'Terrace parapet coping band': 'छत का पैरापेट कॉपिंग बैंड',
  'Stair head-room (mumty) roof': 'सीढ़ी के हेड-रूम (ममटी) की छत',
  '{0} mm deep, {1} mm bearing each side; {2} m windows every {3} m of outer wall, one door per {4} m2. Site practice: ASSUMPTION.':
    '{0} mm गहरा, हर तरफ़ {1} mm टिकाव; बाहरी दीवार पर हर {3} m पर {2} m की खिड़की, हर {4} m2 पर एक दरवाज़ा। साइट की रीति: मान्यता।',
  '{0} mm projection, {1} mm thick, {2} mm @ {3} main and {4} mm @ {5} distribution over every window and the main door. Site practice: ASSUMPTION.':
    '{0} mm बाहर निकला हुआ, {1} mm मोटा, हर खिड़की और मुख्य दरवाज़े के ऊपर {2} mm @ {3} मुख्य और {4} mm @ {5} वितरण सरिया। साइट की रीति: मान्यता।',
  '{0} x {1} mm band with {2} and {3} mm @ {4} along the roof edge. Site practice: ASSUMPTION.':
    'छत के किनारे के साथ {0} × {1} mm का बैंड, {2} और {3} mm @ {4} के साथ। साइट की रीति: मान्यता।',
  '{0} mm roof slab with {1} mm @ {2} each way and a {3} x {4} mm ring beam ({5}, {6} mm @ {7}) over the stair well. Site practice: ASSUMPTION.':
    '{0} mm की छत की स्लैब, दोनों दिशाओं में {1} mm @ {2}, और सीढ़ी की जगह के ऊपर {3} × {4} mm की रिंग बीम ({5}, {6} mm @ {7})। साइट की रीति: मान्यता।',

  // practice range (lib/structopro-qty/payload.ts)
  'buildings of up to four storeys': 'चार मंज़िल तक की इमारतें',
  'buildings of five to twelve storeys': 'पाँच से बारह मंज़िल की इमारतें',
  'GKSPL, Building the Baseline: Embodied Carbon in India’s Urban Housing, v1, March 2026 (26 residential buildings, from Bills of Quantities), as reported by Conserve Consultants, 29 April 2026.':
    'जीकेएसपीएल, Building the Baseline: Embodied Carbon in India’s Urban Housing, v1, मार्च 2026 (26 आवासीय इमारतें, बिल ऑफ़ क्वांटिटीज़ से), जैसा कंज़र्व कंसल्टेंट्स ने 29 अप्रैल 2026 को बताया।',

  // IS-code checks (payload.ts): clause, description, detail
  'IS 456:2000 cl 6.1, Table 5': 'IS 456:2000 cl 6.1, तालिका 5',
  'IS 13920:1993 cl 5.3 (Amendment No. 2); IS 1786:2008': 'IS 13920:1993 cl 5.3 (संशोधन सं. 2); IS 1786:2008',
  'IS 13920:1993 cl 6 and 7': 'IS 13920:1993 cl 6 और 7',
  'IS 456:2000 cl 26.4, Table 16': 'IS 456:2000 cl 26.4, तालिका 16',
  'IS 456:2000 cl 23.2.1, 26.2.1; IS 875 (Part 2) Table 1': 'IS 456:2000 cl 23.2.1, 26.2.1; IS 875 (Part 2) तालिका 1',
  'Model limits': 'मॉडल की सीमाएँ',
  'Concrete grade against exposure': 'एक्सपोज़र के हिसाब से कंक्रीट ग्रेड',
  'Reinforcement grade': 'सरिये का ग्रेड',
  'Ductile detailing': 'डक्टाइल डिटेलिंग',
  'Foundation': 'नींव',
  'Nominal cover': 'नॉमिनल कवर',
  'Wind load check': 'हवा के भार की जाँच',
  'Open parking level (stilt)': 'खुला पार्किंग तल (स्टिल्ट)',
  'Balconies': 'बालकनी',
  'Engineer review': 'इंजीनियर की समीक्षा',
  'Zone {0} calls for ductile steel: this report uses Fe500D throughout.':
    'ज़ोन {0} में डक्टाइल स्टील चाहिए: इस रिपोर्ट में पूरे में Fe500D लिया गया है।',
  'Zone {0}: Fe500D is used throughout; Fe500 is also acceptable.':
    'ज़ोन {0}: पूरे में Fe500D लिया गया है; Fe500 भी चल सकता है।',
  'Zone {0}: closer stirrups at beam and column ends and {1}-degree hooks are in the bar counts. The strong-column weak-beam check uses the tool\'s own factor of {2}, where IS 13920:2016 asks for {3}, and the confining steel of the columns is not checked, so the ties on signed drawings are likely to be heavier. Your contractor must follow the engineer\'s drawings on site.':
    'ज़ोन {0}: बीम और कॉलम के सिरों पर पास-पास स्टिरप और {1}-डिग्री के हुक सरिये की गिनती में शामिल हैं। मज़बूत कॉलम-कमज़ोर बीम की जाँच टूल के अपने गुणक {2} पर होती है, जबकि IS 13920:2016 {3} माँगता है, और कॉलमों का कन्फ़ाइनिंग स्टील जाँचा नहीं गया है, इसलिए दस्तख़त वाले नक्शों में टाई शायद भारी होंगी। आपके ठेकेदार को साइट पर इंजीनियर के नक्शों के हिसाब से ही काम करना होगा।',
  'Zone {0}: ordinary detailing to IS 456 is enough. Closer stirrups at joints are still good practice.':
    'ज़ोन {0}: IS 456 के अनुसार साधारण डिटेलिंग काफ़ी है। जोड़ों पर पास-पास स्टिरप फिर भी अच्छा तरीक़ा है।',
  'The soil or the loads call for a raft. The raft figures here are indicative. A soil test and a structural engineer must confirm the foundation before work starts.':
    'मिट्टी या भार के हिसाब से रैफ़्ट चाहिए। यहाँ के रैफ़्ट के आँकड़े सिर्फ़ अंदाज़े के लिए हैं। काम शुरू होने से पहले मिट्टी की जाँच और स्ट्रक्चरल इंजीनियर को नींव पक्की करनी होगी।',
  'Isolated footings on the bearing capacity assumed for your site type. Replace the assumed value with a soil test result.':
    'आपकी साइट के प्रकार के लिए मानी गई वहन क्षमता पर अलग-अलग फुटिंग। मानी हुई क़ीमत को मिट्टी की जाँच के नतीजे से बदल लीजिए।',
  'Footing {0} mm, column {1} mm, beam {2} mm, slab {3} mm, the same for every site. For moderate or severe exposure IS 456 Table 16 asks for more cover than the beam and slab figures here, which the engineer sets on the drawings. Cover blocks must be placed on site.':
    'फुटिंग {0} mm, कॉलम {1} mm, बीम {2} mm, स्लैब {3} mm, हर साइट के लिए एक जैसा। मध्यम या तीव्र एक्सपोज़र में IS 456 तालिका 16 यहाँ की बीम और स्लैब के आँकड़ों से ज़्यादा कवर माँगती है, जो इंजीनियर नक्शों पर तय करता है। कवर ब्लॉक साइट पर लगाने होंगे।',
  'Basic wind speed {0} m/s for {1}. The wind force is compared with the earthquake force storey by storey and the larger of the two is designed for; they are never added.':
    '{1} के लिए हवा की बुनियादी गति {0} m/s है। हवा के बल की तुलना मंज़िल-दर-मंज़िल भूकंप के बल से की जाती है और दोनों में जो बड़ा है उसी का डिज़ाइन होता है; दोनों को कभी जोड़ा नहीं जाता।',
  'Basic wind speed {0} m/s for {1} (the highest speed this state commonly sees: your town is not in the speed table). The wind force is compared with the earthquake force storey by storey and the larger of the two is designed for; they are never added.':
    '{1} के लिए हवा की बुनियादी गति {0} m/s है (इस राज्य में आम तौर पर दिखने वाली सबसे ज़्यादा गति: आपका शहर गति की तालिका में नहीं है)। हवा के बल की तुलना मंज़िल-दर-मंज़िल भूकंप के बल से की जाती है और दोनों में जो बड़ा है उसी का डिज़ाइन होता है; दोनों को कभी जोड़ा नहीं जाता।',
  'In at least one direction the wind force is the larger one, so the frame is stronger than the earthquake alone would need.':
    'कम से कम एक दिशा में हवा का बल बड़ा है, इसलिए ढाँचा सिर्फ़ भूकंप के लिए ज़रूरी ढाँचे से ज़्यादा मज़बूत है।',
  'In both directions the earthquake force is the larger one.': 'दोनों दिशाओं में भूकंप का बल बड़ा है।',
  '1 balcony projecting {0} m. The slab thickness is set from the IS 456 cantilever span-to-depth limit, the top bars are anchored back into the floor slab and the imposed load is 3.0 kN/m2. A balcony that does not continue into the floor slab needs its supporting beam checked for torsion by an engineer.':
    '1 बालकनी {0} m बाहर निकली है। स्लैब की मोटाई IS 456 की कैंटिलीवर स्पैन-टू-डेप्थ सीमा से तय हुई है, ऊपर के सरिये पीछे फ़र्श की स्लैब में जमाए गए हैं और लाइव लोड 3.0 kN/m2 है। जो बालकनी फ़र्श की स्लैब में आगे नहीं जाती, उसकी सहारा देने वाली बीम की टॉर्शन के लिए जाँच इंजीनियर से करानी होगी।',
  '{0} balconies projecting {1} m. The slab thickness is set from the IS 456 cantilever span-to-depth limit, the top bars are anchored back into the floor slab and the imposed load is 3.0 kN/m2. A balcony that does not continue into the floor slab needs its supporting beam checked for torsion by an engineer.':
    '{0} बालकनी {1} m बाहर निकली हैं। स्लैब की मोटाई IS 456 की कैंटिलीवर स्पैन-टू-डेप्थ सीमा से तय हुई है, ऊपर के सरिये पीछे फ़र्श की स्लैब में जमाए गए हैं और लाइव लोड 3.0 kN/m2 है। जो बालकनी फ़र्श की स्लैब में आगे नहीं जाती, उसकी सहारा देने वाली बीम की टॉर्शन के लिए जाँच इंजीनियर से करानी होगी।',

  // warnings
  'The soil or load calls for a raft foundation. The raft figures are indicative; a soil test and a structural engineer must confirm the foundation.':
    'मिट्टी या भार के हिसाब से रैफ़्ट नींव चाहिए। रैफ़्ट के आँकड़े सिर्फ़ अंदाज़े के लिए हैं; मिट्टी की जाँच और स्ट्रक्चरल इंजीनियर को नींव पक्की करनी होगी।',
  'Black cotton soil: an under-reamed pile or a deeper raft is normally specified. The foundation quantities here are indicative only.':
    'काली कपास मिट्टी: आम तौर पर अंडर-रीम्ड पाइल या ज़्यादा गहरा रैफ़्ट बताया जाता है। यहाँ की नींव की मात्राएँ सिर्फ़ अंदाज़े के लिए हैं।',
  'A heavily loaded column reached the 4 % steel limit: a larger section or higher grade of concrete would normally be chosen by the engineer.':
    'ज़्यादा भार वाला एक कॉलम 4 % स्टील की सीमा तक पहुँच गया: इंजीनियर आम तौर पर बड़ा सेक्शन या कंक्रीट का ऊँचा ग्रेड चुनेगा।',
  'The building is tall and narrow (height at least five times its width): wind sway and dynamic effects are not covered here and need an engineer.':
    'इमारत ऊँची और पतली है (ऊँचाई चौड़ाई की कम से कम पाँच गुना): हवा से हिलना और डायनामिक असर यहाँ शामिल नहीं हैं, इंजीनियर को देखना होगा।',
  'Over 30 m high: the wind gust factor and dynamic response (IS 875 Part 3 cl 7) are not covered here and need an engineer.':
    '30 m से ऊँची: हवा के झोंके का गुणक और डायनामिक प्रतिक्रिया (IS 875 Part 3 cl 7) यहाँ शामिल नहीं हैं, इंजीनियर को देखना होगा।',
  'A balcony reached the limit of a singly reinforced slab: a thicker slab or a higher grade of concrete would normally be chosen by the engineer.':
    'एक बालकनी सिंगली रीइन्फ़ोर्स्ड स्लैब की सीमा तक पहुँच गई: इंजीनियर आम तौर पर मोटी स्लैब या कंक्रीट का ऊँचा ग्रेड चुनेगा।',
  'Balconies were asked for but this building has no upper floor for them: none are included.':
    'बालकनी माँगी गई थीं, लेकिन इस इमारत में उनके लिए कोई ऊपरी मंज़िल नहीं है: कोई बालकनी शामिल नहीं है।',
  'Some floors have fewer bays than the balconies asked for: only the balconies that fit are included.':
    'कुछ मंज़िलों पर माँगी गई बालकनी से कम खाने हैं: सिर्फ़ वही बालकनी शामिल हैं जो समा सकती हैं।',
  'Five or more floors (about {0} m and above): lifts, shear walls and a soil test change the structure a lot. Use this as a planning figure only; a structural engineer must design the building.':
    'पाँच या ज़्यादा मंज़िलें (लगभग {0} m और उससे ऊँची): लिफ़्ट, शियर वॉल और मिट्टी की जाँच से ढाँचा बहुत बदल जाता है। इसे सिर्फ़ योजना के आँकड़े की तरह लीजिए; इमारत का डिज़ाइन स्ट्रक्चरल इंजीनियर को ही करना होगा।',
  'Steel per square metre is outside the usual range for this type of building: the result needs an engineer\'s review.':
    'प्रति वर्ग मीटर स्टील इस तरह की इमारत की आम सीमा से बाहर है: नतीजे को इंजीनियर से जँचवाना होगा।',
  'Beam section limit reached; deeper section or higher grade will be needed.':
    'बीम के सेक्शन की सीमा आ गई है; गहरा सेक्शन या ऊँचा ग्रेड चाहिए होगा।',

  // errors the model and the routes send (Hindi for the visitor; the English stays in the saved data and the logs)
  'The quantity model could not complete this input.': 'इस जानकारी पर हम मात्राएँ नहीं निकाल पाए। कृपया जानकारी जाँचकर फिर कोशिश कीजिए।',
  'beam design did not converge': 'इस जानकारी के लिए बीम का डिज़ाइन पूरा नहीं हो पाया। कृपया जानकारी बदलकर फिर कोशिश कीजिए।',
  'Cannot read properties of undefined (reading \'{0}\')': 'इस जानकारी पर हम ढाँचे का हिसाब नहीं निकाल पाए। कृपया जानकारी बदलकर फिर कोशिश कीजिए।',
  'Floors must be between 1 and 10.': 'मंज़िलें 1 से 10 के बीच होनी चाहिए।',
  'Floors must be between 1 and 5.': 'मंज़िलें 1 से 5 के बीच होनी चाहिए।',
  'Area of one floor must be between 300 and 3,000 sq ft.': 'एक मंज़िल का एरिया 300 से 3,000 वर्ग फ़ुट के बीच होना चाहिए।',
  'Balconies per floor must be between 0 and 4.': 'हर मंज़िल पर बालकनी 0 से 4 के बीच होनी चाहिए।',
  'A balcony may project 1.0, 1.2 or 1.5 m.': 'बालकनी 1.0, 1.2 या 1.5 m बाहर निकल सकती है।',
  'Plot sides must be between 10 and 1000 ft.': 'प्लॉट की भुजाएँ 10 से 1000 फ़ुट के बीच होनी चाहिए।',
  'Unknown site condition.': 'साइट की यह स्थिति पहचानी नहीं गई।',
  'Unknown wall type.': 'दीवार का यह प्रकार पहचाना नहीं गया।',
  'That contact is not valid.': 'यह संपर्क सही नहीं है।',
  'Project name is required.': 'प्रोजेक्ट का नाम ज़रूरी है।',
  'Enter at least one figure from your contractor.': 'अपने ठेकेदार का कम से कम एक आँकड़ा डालिए।',
  'Too many tries. Please wait a little while and try again.': 'बहुत बार कोशिश हो चुकी है। कृपया थोड़ी देर रुककर फिर कोशिश कीजिए।',
  'Your estimate is not saved yet. Please wait a moment and try again.': 'आपका अनुमान अभी सहेजा नहीं गया है। कृपया थोड़ा रुककर फिर कोशिश कीजिए।',
  'Please enter your name': 'कृपया अपना नाम लिखिए',
  'Please enter a valid email address': 'कृपया सही ईमेल पता लिखिए',
  'We could not find that estimate. Please run it again.': 'हमें वह अनुमान नहीं मिला। कृपया उसे फिर से चलाइए।',
  'We could not work out your structure. Please try again.': 'हम आपके ढाँचे का हिसाब नहीं निकाल पाए। कृपया फिर कोशिश कीजिए।',
  'The payment did not go through. Please try again.': 'भुगतान पूरा नहीं हुआ। कृपया फिर कोशिश कीजिए।',
  'Could not load the report': 'रिपोर्ट लोड नहीं हो पाई',
  'Could not start the payment': 'भुगतान शुरू नहीं हो पाया',
  'Could not start the payment. Please try again.': 'भुगतान शुरू नहीं हो पाया। कृपया फिर कोशिश कीजिए।',
  'The payment window did not load. Please refresh the page and try again.': 'भुगतान की विंडो खुली नहीं। कृपया पेज रीफ़्रेश करके फिर कोशिश कीजिए।',
  'Verification failed': 'भुगतान की जाँच नहीं हो पाई',
  'We could not verify the payment.': 'हम भुगतान की जाँच नहीं कर पाए।',
  'The payment was not completed. Press the button to try again.': 'भुगतान पूरा नहीं हुआ। फिर कोशिश करने के लिए बटन दबाइए।',
  'Something went wrong. Please try again.': 'कुछ गड़बड़ हो गई। कृपया फिर कोशिश कीजिए।',
  'Payment required': 'भुगतान ज़रूरी है',
  'Payment not verified': 'भुगतान की पुष्टि नहीं हुई',
  'Estimate already paid': 'इस अनुमान का भुगतान हो चुका है',
  'This report is already paid for.': 'इस रिपोर्ट का भुगतान पहले ही हो चुका है।',
  'Invalid payment signature': 'भुगतान का सिग्नेचर सही नहीं है',
  'This payment does not match the report': 'यह भुगतान इस रिपोर्ट से मेल नहीं खाता',
  'Failed to create payment order': 'भुगतान का ऑर्डर नहीं बन पाया',
  'Please add your name and email first, so we know where to send your report.': 'पहले अपना नाम और ईमेल डालिए, ताकि हमें पता रहे कि रिपोर्ट कहाँ भेजनी है।',
  'Could not start a session. Please try again, or log in to continue.': 'सेशन शुरू नहीं हो पाया। कृपया फिर कोशिश कीजिए, या आगे बढ़ने के लिए लॉग इन कीजिए।',
  'Could not start a session. Please try again, or log in.': 'सेशन शुरू नहीं हो पाया। कृपया फिर कोशिश कीजिए, या लॉग इन कीजिए।',
}

// ---- sentences built from a few alternatives --------------------------------------------------------------------

for (const [expEn, expHi] of Object.entries(EXPOSURE_HI)) {
  D[`{0} above ground and {1} below ground meet the minimum grade, cement content and water-cement ratio for ${expEn} exposure.`] =
    `ज़मीन के ऊपर {0} और ज़मीन के नीचे {1}, ${expHi} एक्सपोज़र के लिए न्यूनतम ग्रेड, सीमेंट की मात्रा और पानी-सीमेंट अनुपात की शर्तें पूरी करते हैं।`
}

for (const [fEn, fHi] of Object.entries(FOUNDATION_HI)) {
  for (const [sEn, sHi] of Object.entries(SITE_HI)) {
    D[`Foundation: ${fEn} on ${sEn}, safe bearing capacity {0} kN/m2 assumed, founding depth {1} m. Replace with a soil test.`] =
      `नींव: ${sHi} पर ${fHi}, सुरक्षित वहन क्षमता {0} kN/m2 मानी गई, नींव की गहराई {1} m। इसे मिट्टी की जाँच से बदल लीजिए।`
  }
}

for (const [wEn, wHi] of Object.entries(WALL_HI)) {
  D[`Loads: floor finish {0} kN/m2, imposed {1} kN/m2 on floors and {2} kN/m2 on the roof (IS 875), ${wEn} walls {3} mm outside, 115 mm brick partitions on half the inner beams, 15 % off for openings.`] =
    `भार: फ़र्श की फ़िनिश {0} kN/m2, फ़र्श पर लाइव लोड {1} kN/m2 और छत पर {2} kN/m2 (IS 875), बाहर ${wHi} दीवारें {3} mm की, आधी भीतरी बीमों पर 115 mm की ईंट की पार्टीशन दीवारें, खिड़की-दरवाज़ों के खुले हिस्से के लिए 15 % की कटौती।`
}

for (const withParen of [true, false]) {
  for (const [gEn, gHi] of WIND_GOVERNS) {
    const paren = withParen ? WIND_STATE_PAREN_EN : ''
    D[`Wind to IS 875 (Part 3): basic speed {0} m/s for {1}${paren}, open terrain, roof-level pressure {2} kN/m2. Base shear {3} / {4} kN (along x / y) against {5} / {6} kN for the earthquake: ${gEn}. The larger force sets the design, storey by storey; wind and earthquake are never added (IS 1893 cl 6.2).`] =
      `हवा IS 875 (Part 3) के अनुसार: {1} के लिए हवा की बुनियादी गति {0} m/s${withParen ? WIND_STATE_PAREN_HI : ''}, खुला इलाक़ा, छत के स्तर पर दबाव {2} kN/m2। बेस शियर {3} / {4} kN (x / y दिशा में), जबकि भूकंप के लिए {5} / {6} kN: ${gHi}। जो बल बड़ा है उसी से मंज़िल-दर-मंज़िल डिज़ाइन तय होता है; हवा और भूकंप को कभी जोड़ा नहीं जाता (IS 1893 cl 6.2)।`
  }
}

for (const [nEn, nHi] of Object.entries(QUOTE_NAME_HI)) {
  D[`The ${nEn} figure needs to be a number above zero.`] = `${nHi} का आँकड़ा शून्य से बड़ी संख्या होना चाहिए।`
}

export const STRUCT_DICT: Dict = D

// ---- reading a string sentence by sentence ----------------------------------------------------------------------

type Atom = { re: RegExp; hi: string; lit: number }

const ATOMS: Atom[] = Object.entries(D).map(([en, hi]) => {
  const parts = en.split(/(\{\d\})/).filter((p, i, a) => p !== '' || i < a.length - 1)
  const src = parts
    // a placeholder at the very end takes the rest of the string; one in the middle takes as little as will fit
    .map((part, i) => (/^\{\d\}$/.test(part) ? (i === parts.length - 1 ? '(.+)' : '(.+?)') : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    .join('')
  return { re: new RegExp(src, 'y'), hi, lit: en.replace(/\{\d\}/g, '').length }
})

const IS_REF = /\bIS\s?\d[\d:\-–/ ()A-Za-z]*/g
const fill = (hi: string, m: RegExpExecArray) => hi.replace(/\{(\d)\}/g, (_, i) => m[Number(i) + 1] ?? '')

export interface StructTrResult {
  text: string
  /** false when some sentence had no entry and was left in English */
  complete: boolean
}

const memo = new Map<string, StructTrResult>()

/** Hindi for a StructurePro server string, sentence by sentence. Anything without an entry is left as it is. */
export function structTrDetail(s: string): StructTrResult {
  const hit = memo.get(s)
  if (hit) return hit
  const out: string[] = []
  let pos = 0
  let complete = true
  while (pos < s.length) {
    // the sentence that covers the most text wins; when two cover the same, the one with more fixed words (fewer {n} gaps)
    let best: { end: number; text: string; lit: number } | null = null
    for (const a of ATOMS) {
      a.re.lastIndex = pos
      const m = a.re.exec(s)
      if (!m || m[0].length === 0) continue
      const end = pos + m[0].length
      if (!best || end > best.end || (end === best.end && a.lit > best.lit)) best = { end, text: fill(a.hi, m), lit: a.lit }
    }
    if (!best) {
      out.push(s.slice(pos))
      complete = false
      break
    }
    out.push(best.text)
    pos = best.end
    if (s[pos] === ' ') pos++
  }
  let text = out.join(' ')
  if (!complete) {
    // a message the shared server list already knows (errors common to every tool)
    const shared = tr('hi', s, QTY_ERRORS)
    if (shared !== s) text = shared
  }
  text = placesHi(text)
  // a string with no English words left needs no entry: "IS 1904:1986; IS 456 cl 34", or a town name that is now Devanagari
  if (!/[A-Za-z]{3,}/.test(text.replace(IS_REF, ' '))) complete = true
  const res = { text, complete }
  memo.set(s, res)
  return res
}

/** The Hindi text of a StructurePro server string (the string itself when nothing matches). */
export const structTr = (s: string): string => (s ? structTrDetail(s).text : s)
