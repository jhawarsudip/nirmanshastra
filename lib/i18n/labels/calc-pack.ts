/*
  Hindi for the two pack screens: the Complete House Pack page (components/v2/qty/CompletePack.tsx) and the Grand Total
  (components/v2/qty/GrandTotal.tsx).

  1. PACK_PAGE and GRAND_UI are Copy objects (English first, Hindi typed as the English shape, so a missing key fails tsc).
     Where the trade tools' screens already say the same sentence (lib/i18n/labels/qty-ui.ts), the page reuses those.
  2. GRAND_DICT is for the words the SERVER sends the Grand Total (lib/qty/grand.ts: phase names, the checks, the table
     titles and headings, the notes). lib/qty/grand.ts is not touched and the stored report and the PDF stay English;
     the page looks each string up here at display time (useGrandTr). A string with no entry shows in English, and the words
     of the four trade reports that the Grand Total adds come from the trade tools' own dictionaries (useQtyTr('all')).
  Money is never typed here: the prices come from lib/tool-pricing.ts.
*/
import { useCallback } from 'react'
import { useLocale } from 'next-intl'
import type { Copy } from '../copy'
import type { Dict } from '../tr'
import { trQty } from '../qty-tr'
import { useQtyTr } from '../use-qty-tr'
import { structTrDetail } from './structopro-server'
import { placesHi } from './structopro-places'

/* ───────────── the Complete House Pack page ───────────── */

const packEn = {
  eyebrow: 'Best value · all six reports',
  name: 'Complete House Pack',
  blurb: 'All five quantity reports for one house: structure, masonry, electrical, plumbing and interior, plus the Grand Total buying list. Pay once, then use it where you would otherwise pay.',
  readyTitle: 'Your pack is ready',
  previewTitle: 'Preview mode',
  previewText: 'Payment is switched off on this copy of the site, so the pack is open for testing.',
  readyBefore: 'Open a tool, enter your house, and press ',
  readyButton: 'Use my Complete House Pack',
  readyAfter: ' where you would otherwise pay. A pack covers one house.',
  madeLeft: (used: number, left: number) => `${used} made · ${left} left`,
  open: (label: string) => `Open ${label}`,
  emailed: 'We have emailed you a link to this page. Keep it: it opens your pack on another phone or computer.',
  saveTitle: 'What you get, and what you save',
  oneByOne: 'Bought one by one',
  packRow: 'Complete House Pack',
  youSave: 'You save',
  fine: (n: number) => `A pack covers one house. Every report must match the same building: the same floors, the same state and a floor area within 10%. Each report can be made up to ${n} times, so you can correct a figure you typed wrongly.`,
  step1: 'Step 1 of 2',
  formSub: 'We send your pack link to this email. It takes under a minute.',
  emailHint: 'Your pack link is sent here.',
  houseName: 'House name (optional)',
  houseHint: 'To find your reports again. You can skip it.',
  toPayment: 'Continue to payment',
  formFine: 'We save your details securely and email you only your pack link and a few IS-code construction tips.',
  couldNotSave: 'We could not save your details.',
  wentWrong: 'Something went wrong. Please try again.',
  step2: 'Step 2 of 2',
  payTitle: 'Pay once for the whole house',
  payButton: (price: string) => `Pay ${price} for the Complete House Pack`,
  payFine: 'One payment, no subscription. Paid through Razorpay; we never see your card details.',
  grandTotal: 'Grand Total',
}
const packHi: typeof packEn = {
  eyebrow: 'सबसे किफ़ायती · सभी छह रिपोर्ट',
  name: 'कम्प्लीट हाउस पैक',
  blurb: 'एक घर की सभी पाँच मात्रा रिपोर्टें: ढाँचा, चिनाई, बिजली, प्लंबिंग और इंटीरियर, साथ में ग्रैंड टोटल की ख़रीद-सूची। एक बार भुगतान कीजिए, फिर जहाँ आपको अलग से भुगतान करना पड़ता, वहाँ इसे इस्तेमाल कीजिए।',
  readyTitle: 'आपका पैक तैयार है',
  previewTitle: 'प्रीव्यू मोड',
  previewText: 'साइट की इस कॉपी में भुगतान बंद है, इसलिए पैक जाँच के लिए खुला है।',
  readyBefore: 'कोई टूल खोलिए, अपने घर की जानकारी डालिए, और जहाँ आपको अलग से भुगतान करना पड़ता, वहाँ ',
  readyButton: 'मेरा कम्प्लीट हाउस पैक इस्तेमाल कीजिए',
  readyAfter: ' दबाइए। एक पैक एक ही घर के लिए है।',
  madeLeft: (used: number, left: number) => `${used} बनीं · ${left} बाक़ी`,
  open: (label: string) => `${label} खोलिए`,
  emailed: 'हमने आपको इस पेज का लिंक ईमेल किया है। इसे सँभालकर रखिए: इससे आपका पैक किसी दूसरे फ़ोन या कंप्यूटर पर भी खुल जाता है।',
  saveTitle: 'आपको क्या मिलता है, और कितनी बचत होती है',
  oneByOne: 'एक-एक करके ख़रीदने पर',
  packRow: 'कम्प्लीट हाउस पैक',
  youSave: 'आपकी बचत',
  fine: (n: number) => `एक पैक एक ही घर के लिए है। हर रिपोर्ट उसी इमारत से मेल खानी चाहिए: उतनी ही मंज़िलें, वही राज्य और 10% के भीतर का फ़्लोर एरिया। हर रिपोर्ट ज़्यादा से ज़्यादा ${n} बार बनाई जा सकती है, ताकि आप ग़लत लिखी संख्या सुधार सकें।`,
  step1: 'चरण 1 / 2',
  formSub: 'आपका पैक लिंक इसी ईमेल पर भेजा जाता है। एक मिनट से कम लगता है।',
  emailHint: 'आपका पैक लिंक यहीं भेजा जाता है।',
  houseName: 'घर का नाम (वैकल्पिक)',
  houseHint: 'ताकि आपकी रिपोर्टें दोबारा मिल सकें। आप इसे छोड़ सकते हैं।',
  toPayment: 'भुगतान पर आगे बढ़िए',
  formFine: 'हम आपकी जानकारी सुरक्षित रखते हैं और आपको सिर्फ़ आपका पैक लिंक और IS कोड पर आधारित निर्माण के कुछ सुझाव ईमेल करते हैं।',
  couldNotSave: 'हम आपकी जानकारी सेव नहीं कर पाए।',
  wentWrong: 'कुछ गड़बड़ हो गई। कृपया फिर कोशिश कीजिए।',
  step2: 'चरण 2 / 2',
  payTitle: 'पूरे घर के लिए एक बार भुगतान कीजिए',
  payButton: (price: string) => `कम्प्लीट हाउस पैक के लिए ${price} चुकाइए`,
  payFine: 'एक बार भुगतान, कोई सब्सक्रिप्शन नहीं। भुगतान Razorpay से होता है; आपके कार्ड की जानकारी हम कभी नहीं देखते।',
  grandTotal: 'ग्रैंड टोटल',
}
export const PACK_PAGE: Copy<typeof packEn> = { en: packEn, hi: packHi }

/* ───────────── the Grand Total screens ───────────── */

const grandEn = {
  name: 'Grand Total',
  fullList: (price: string) => `Full list ${price}`,
  steps: ['Your reports', 'Check and unlock', 'Your list'],
  looking: 'Looking for your paid reports…',
  couldNotLook: 'We could not look up your reports',
  couldNotLookMsg: 'We could not look up your reports.',
  couldNotJoinMsg: 'We could not put these reports together. Please try again.',
  step1: 'Grand Total · Step 1 of 3',
  whichProject: 'Which project?',
  pickSub: 'The Grand Total adds the paid reports of one project. Pick the project, then tick the phases to add.',
  chooseProject: 'Choose a project',
  builtUp: (n: string) => `${n} m² built-up`,
  reportsOf: (n: number, list: string) => `${n} paid ${n === 1 ? 'report' : 'reports'}: ${list}`,
  onlyOne: 'Only one paid report so far. You need at least two phases to add together.',
  phasesToAdd: 'Phases to add',
  latest: 'Each one is the latest report you paid for in this project.',
  phasesTogether: 'Phases to add together',
  stageLine: (stage: string, date: string, floors: string, area: string) => `${stage} · bought ${date} · ${floors}, ${area} m²`,
  notDone: 'Not done yet for this project:',
  notDoneEnd: '. The Grand Total is made from the reports you have today and does not update later.',
  groundOnly: 'Ground floor only',
  groundPlus: (n: number) => `Ground + ${n}`,
  diffFloors: 'These reports were made for buildings with a different number of floors, so they cannot be added into one list.',
  diffArea: 'The floor areas in these reports differ by more than 10%, so they are not for the same building. Untick the report that does not belong, or run that phase again with the same floor areas.',
  clashTitle: 'These reports do not match',
  finishTitle: 'We could not finish',
  earlierTitle: (n: number) => `${n} earlier ${n === 1 ? 'report is' : 'reports are'} not listed`,
  earlierText: 'Reports made before the site moved to quantities only cannot be added. Run that phase again and it will appear here.',
  earlierAcctTitle: (n: number) => `${n} earlier ${n === 1 ? 'report is' : 'reports are'} on this account`,
  earlierAcctText: 'Reports made before the site moved to quantities only cannot be added. Run that phase again and it will be listed here.',
  putting: 'Putting them together…',
  tick2: 'Tick at least two phases',
  checkThese: 'Check these reports',
  emptyTitle: 'Add your reports into one list',
  emptySigned: 'You have no paid reports for this browser yet. The Grand Total adds the reports you have already bought, for one project, into a single list of what to buy.',
  emptyGuest: 'We could not find a session for this browser. Open this page in the browser where you bought your reports, or log in. The Grand Total adds the reports you have already bought into a single list of what to buy.',
  empty1: 'Run two or more of the phases below for the same project, and buy their reports.',
  empty2: 'Come back here. They are listed, and you tick the ones to add.',
  empty3: 'One payment, and you get one list with cement, sand and stone added across phases and nothing counted twice.',
  stepProject: (n: number, project: string) => `Step ${n} of 3 · ${project}`,
  readyTitle: 'Your Grand Total is ready',
  hereIs: 'Here is what will be added',
  previewList: 'Preview mode: full list open for testing',
  inTotal: 'The reports in this total',
  phaseLine: (covers: string, floors: string, area: string) => `${covers}. ${floors}, ${area} m².`,
  stop: '.',
  notInTotal: 'Not in this total:',
  beforeRely: 'Before you rely on this list',
  lockedK: 'The list is in the full report',
  lockedTitle: 'One list of everything to buy',
  unlock: (price: string) => `Unlock the Grand Total · ${price}`,
  payFineExtra: 'The list is made from the reports above and does not update when you add a phase later.',
  adding: 'Adding your reports together…',
  loadErrTitle: 'We could not load your Grand Total',
  unlockedTitle: 'Your Grand Total is unlocked',
  orderSub: 'The main totals across your phases. The line under each figure is the range the real number is likely to fall in (see “How far off can this be”).',
  offSub: 'This is a code-based planning estimate worked out from your answers, not a design for your drawings. Each phase has its own range; these are the widest ones.',
  howAdded: 'How the reports were added',
  eachPhase: 'The assumptions in each phase',
  eachPhaseSub: 'Open a phase to read what it assumed and what it does not count.',
  assumptionsH: 'Assumptions',
  notCountedH: 'Not counted',
  openName: (name: string) => `Open ${name}`,
  different: 'Choose different reports',
}
const grandHi: typeof grandEn = {
  name: 'ग्रैंड टोटल',
  fullList: (price: string) => `पूरी सूची ${price}`,
  steps: ['आपकी रिपोर्टें', 'जाँचिए और खोलिए', 'आपकी सूची'],
  looking: 'आपकी भुगतान की हुई रिपोर्टें ढूँढी जा रही हैं…',
  couldNotLook: 'हम आपकी रिपोर्टें नहीं ढूँढ पाए',
  couldNotLookMsg: 'हम आपकी रिपोर्टें नहीं ढूँढ पाए।',
  couldNotJoinMsg: 'हम इन रिपोर्टों को जोड़ नहीं पाए। कृपया फिर कोशिश कीजिए।',
  step1: 'ग्रैंड टोटल · चरण 1 / 3',
  whichProject: 'कौन-सा प्रोजेक्ट?',
  pickSub: 'ग्रैंड टोटल एक प्रोजेक्ट की भुगतान की हुई रिपोर्टें जोड़ता है। प्रोजेक्ट चुनिए, फिर जोड़ने वाले चरणों पर टिक लगाइए।',
  chooseProject: 'एक प्रोजेक्ट चुनिए',
  builtUp: (n: string) => `${n} m² बिल्ट-अप`,
  reportsOf: (n: number, list: string) => `${n} भुगतान की हुई ${n === 1 ? 'रिपोर्ट' : 'रिपोर्टें'}: ${list}`,
  onlyOne: 'अभी तक सिर्फ़ एक भुगतान की हुई रिपोर्ट है। जोड़ने के लिए कम से कम दो चरण चाहिए।',
  phasesToAdd: 'जोड़ने वाले चरण',
  latest: 'हर एक इस प्रोजेक्ट की वह सबसे नई रिपोर्ट है जिसका आपने भुगतान किया।',
  phasesTogether: 'साथ जोड़ने वाले चरण',
  stageLine: (stage: string, date: string, floors: string, area: string) => `${stage} · ${date} को ख़रीदी · ${floors}, ${area} m²`,
  notDone: 'इस प्रोजेक्ट के लिए अभी बाक़ी:',
  notDoneEnd: '। ग्रैंड टोटल आज आपके पास मौजूद रिपोर्टों से बनता है और बाद में अपने-आप नहीं बदलता।',
  groundOnly: 'सिर्फ़ ग्राउंड फ़्लोर',
  groundPlus: (n: number) => `ग्राउंड + ${n}`,
  diffFloors: 'ये रिपोर्टें अलग-अलग मंज़िलों वाली इमारतों के लिए बनी हैं, इसलिए इन्हें एक सूची में नहीं जोड़ा जा सकता।',
  diffArea: 'इन रिपोर्टों के फ़्लोर एरिया में 10% से ज़्यादा का फ़र्क़ है, इसलिए ये एक ही इमारत की नहीं हैं। जो रिपोर्ट मेल नहीं खाती उसका टिक हटाइए, या उस चरण को उन्हीं फ़्लोर एरिया के साथ दोबारा चलाइए।',
  clashTitle: 'ये रिपोर्टें आपस में मेल नहीं खातीं',
  finishTitle: 'हम पूरा नहीं कर पाए',
  earlierTitle: (n: number) => (n === 1 ? '1 पुरानी रिपोर्ट सूची में नहीं है' : `${n} पुरानी रिपोर्टें सूची में नहीं हैं`),
  earlierText: 'साइट के सिर्फ़ मात्राओं वाले रूप में आने से पहले बनी रिपोर्टें जोड़ी नहीं जा सकतीं। वह चरण दोबारा चलाइए, तब वह यहाँ दिखेगा।',
  earlierAcctTitle: (n: number) => (n === 1 ? '1 पुरानी रिपोर्ट इस खाते में है' : `${n} पुरानी रिपोर्टें इस खाते में हैं`),
  earlierAcctText: 'साइट के सिर्फ़ मात्राओं वाले रूप में आने से पहले बनी रिपोर्टें जोड़ी नहीं जा सकतीं। वह चरण दोबारा चलाइए, तब वह यहाँ सूची में दिखेगा।',
  putting: 'इन्हें जोड़ा जा रहा है…',
  tick2: 'कम से कम दो चरणों पर टिक लगाइए',
  checkThese: 'इन रिपोर्टों की जाँच कीजिए',
  emptyTitle: 'अपनी रिपोर्टें एक सूची में जोड़िए',
  emptySigned: 'इस ब्राउज़र के लिए आपके पास अभी कोई भुगतान की हुई रिपोर्ट नहीं है। ग्रैंड टोटल एक प्रोजेक्ट की वे रिपोर्टें, जो आप पहले ही ख़रीद चुके हैं, जोड़कर ख़रीदने वाली चीज़ों की एक सूची बना देता है।',
  emptyGuest: 'इस ब्राउज़र के लिए कोई सेशन नहीं मिला। इस पेज को उसी ब्राउज़र में खोलिए जहाँ आपने रिपोर्टें ख़रीदी थीं, या लॉग इन कीजिए। ग्रैंड टोटल आपकी पहले ख़रीदी हुई रिपोर्टों को जोड़कर ख़रीदने वाली चीज़ों की एक सूची बना देता है।',
  empty1: 'नीचे दिए चरणों में से दो या ज़्यादा एक ही प्रोजेक्ट के लिए चलाइए और उनकी रिपोर्टें ख़रीदिए।',
  empty2: 'यहाँ वापस आइए। वे सूची में दिखेंगी, और आप जोड़ने वाली रिपोर्टों पर टिक लगाइए।',
  empty3: 'एक बार भुगतान, और आपको एक सूची मिलती है जिसमें सीमेंट, रेत और गिट्टी सभी चरणों में जोड़कर दी जाती है और कुछ भी दो बार नहीं गिना जाता।',
  stepProject: (n: number, project: string) => `चरण ${n} / 3 · ${project}`,
  readyTitle: 'आपका ग्रैंड टोटल तैयार है',
  hereIs: 'यह जोड़ा जाएगा',
  previewList: 'प्रीव्यू मोड: जाँच के लिए पूरी सूची खुली है',
  inTotal: 'इस कुल में शामिल रिपोर्टें',
  phaseLine: (covers: string, floors: string, area: string) => `${covers}। ${floors}, ${area} m²।`,
  stop: '।',
  notInTotal: 'इस कुल में नहीं:',
  beforeRely: 'इस सूची पर भरोसा करने से पहले',
  lockedK: 'सूची पूरी रिपोर्ट में है',
  lockedTitle: 'ख़रीदने की हर चीज़ की एक सूची',
  unlock: (price: string) => `ग्रैंड टोटल खोलिए · ${price}`,
  payFineExtra: 'सूची ऊपर की रिपोर्टों से बनती है और बाद में कोई चरण जोड़ने पर अपने-आप नहीं बदलती।',
  adding: 'आपकी रिपोर्टें जोड़ी जा रही हैं…',
  loadErrTitle: 'हम आपका ग्रैंड टोटल लोड नहीं कर पाए',
  unlockedTitle: 'आपका ग्रैंड टोटल खुल गया है',
  orderSub: 'आपके सभी चरणों के मुख्य कुल। हर आँकड़े के नीचे की पंक्ति वह दायरा है जिसमें असली संख्या आने की संभावना है (देखिए “यह कितना अलग हो सकता है”)।',
  offSub: 'यह आपके जवाबों से निकाला गया, कोड पर आधारित योजना का अनुमान है, आपके नक्शों का डिज़ाइन नहीं। हर चरण का अपना दायरा है; ये सबसे चौड़े वाले हैं।',
  howAdded: 'रिपोर्टें कैसे जोड़ी गईं',
  eachPhase: 'हर चरण की मान्यताएँ',
  eachPhaseSub: 'किसी चरण को खोलकर पढ़िए कि उसने क्या माना और क्या नहीं गिना।',
  assumptionsH: 'मान्यताएँ',
  notCountedH: 'नहीं गिना गया',
  openName: (name: string) => `${name} खोलिए`,
  different: 'दूसरी रिपोर्टें चुनिए',
}
export const GRAND_UI: Copy<typeof grandEn> = { en: grandEn, hi: grandHi }

/* ───────────── the words the server sends the Grand Total (lib/qty/grand.ts) ───────────── */

/** The five phases' "what it covers" lines. Keyed by the English line; looked up lower-cased too (the missing-phase lists lower-case them). */
const COVERS: Record<string, string> = {
  'Footings, columns, beams, slabs and stairs: concrete, steel and shuttering': 'फ़ुटिंग, कॉलम, बीम, स्लैब और सीढ़ियाँ: कंक्रीट, स्टील और शटरिंग',
  'Bricks or blocks, mortar, lintels and plaster': 'ईंट या ब्लॉक, मसाला, लिंटल और प्लास्टर',
  'Points, wire, conduit, boards and earthing': 'पॉइंट, तार, कंड्यूट, बोर्ड और अर्थिंग',
  'Pipes, tanks, pump, fittings and fixtures': 'पाइप, टंकी, पंप, फ़िटिंग और फ़िक्सचर',
  'Paint, tiles, ceilings, doors and carpentry': 'पेंट, टाइलें, सीलिंग, दरवाज़े और बढ़ईगिरी',
}
const COVERS_LC: Record<string, string> = Object.fromEntries(Object.entries(COVERS).map(([k, v]) => [k.toLowerCase(), v]))

export const GRAND_DICT: Dict = {
  ...COVERS,
  // phases
  'Frame': 'ढाँचा',
  'Walls': 'दीवारें',
  'Wiring': 'वायरिंग',
  'Plumbing': 'प्लंबिंग',
  'Finishing': 'फ़िनिशिंग',
  'Phase 1': 'चरण 1',
  'Phase 2': 'चरण 2',
  'Phase 3': 'चरण 3',
  'Phase 4': 'चरण 4',
  'Phase 5': 'चरण 5',
  'First. Excavation and lean concrete, then steel and shuttering, then cement, sand and stone for each pour.': 'सबसे पहले। खुदाई और लीन कंक्रीट, फिर स्टील और शटरिंग, फिर हर ढलाई के लिए सीमेंट, रेत और गिट्टी।',
  'After the frame has cured. Lintels are cast as the walls reach the height of the openings.': 'ढाँचे की क्योरिंग पूरी होने के बाद। दीवारें खिड़की-दरवाज़ों की ऊँचाई तक पहुँचती हैं तो लिंटल की ढलाई होती है।',
  'Conduit and boxes go in before the slab is poured and as the walls rise. Wire is pulled after plaster.': 'कंड्यूट और बॉक्स स्लैब की ढलाई से पहले और दीवारें उठने के साथ लगते हैं। तार प्लास्टर के बाद खींचा जाता है।',
  'Sleeves and pipes go in before the slab is poured and into the walls before plaster. Fixtures come last.': 'स्लीव और पाइप स्लैब की ढलाई से पहले लगते हैं और दीवारों में प्लास्टर से पहले। फ़िक्सचर सबसे आख़िर में आते हैं।',
  'After plaster. Tiles and ceilings first, doors and paint last.': 'प्लास्टर के बाद। पहले टाइलें और सीलिंग, दरवाज़े और पेंट सबसे आख़िर में।',
  // the page's own messages that travel as server errors
  'We could not look up your reports.': 'हम आपकी रिपोर्टें नहीं ढूँढ पाए।',
  'We could not put these reports together. Please try again.': 'हम इन रिपोर्टों को जोड़ नहीं पाए। कृपया फिर कोशिश कीजिए।',
  // the free part
  '{0} of 5 phases': '5 में से {0} चरण',
  '{0} m² built-up': '{0} m² बिल्ट-अप',
  'The reports agree with each other': 'रिपोर्टें आपस में मेल खाती हैं',
  'Same building in every report': 'हर रिपोर्ट में एक ही इमारत',
  'The reports are close but not identical: floor areas differ by {0}%. The list below adds them as they are.': 'रिपोर्टें करीब-करीब एक जैसी हैं, पर बिल्कुल नहीं: फ़्लोर एरिया में {0}% का फ़र्क़ है। नीचे की सूची इन्हें जैसा है वैसा ही जोड़ती है।',
  'The reports are close but not identical: floor areas differ by {0}% and the city is written differently. The list below adds them as they are.': 'रिपोर्टें करीब-करीब एक जैसी हैं, पर बिल्कुल नहीं: फ़्लोर एरिया में {0}% का फ़र्क़ है और शहर का नाम अलग तरह से लिखा है। नीचे की सूची इन्हें जैसा है वैसा ही जोड़ती है।',
  'All {0} reports are for {1} floor and about {2} m² built-up.': 'सभी {0} रिपोर्ट {1} मंज़िल और लगभग {2} m² बिल्ट-अप के लिए हैं।',
  'All {0} reports are for {1} floors and about {2} m² built-up.': 'सभी {0} रिपोर्ट {1} मंज़िलों और लगभग {2} m² बिल्ट-अप के लिए हैं।',
  'All {0} reports are for {1} floor and about {2} m² built-up in {3}.': 'सभी {0} रिपोर्ट {3} में {1} मंज़िल और लगभग {2} m² बिल्ट-अप के लिए हैं।',
  'All {0} reports are for {1} floors and about {2} m² built-up in {3}.': 'सभी {0} रिपोर्ट {3} में {1} मंज़िलों और लगभग {2} m² बिल्ट-अप के लिए हैं।',
  'These reports were made for buildings with a different number of floors, so they cannot be added into one list.': 'ये रिपोर्टें अलग-अलग मंज़िलों वाली इमारतों के लिए बनी हैं, इसलिए इन्हें एक सूची में नहीं जोड़ा जा सकता।',
  'These reports were made for different states, so they cannot be added into one list.': 'ये रिपोर्टें अलग-अलग राज्यों के लिए बनी हैं, इसलिए इन्हें एक सूची में नहीं जोड़ा जा सकता।',
  'The floor areas in the reports differ by more than 10%, so they are not for the same building. Run each phase for the same project and floor areas, then try again.': 'रिपोर्टों के फ़्लोर एरिया में 10% से ज़्यादा का फ़र्क़ है, इसलिए ये एक ही इमारत की नहीं हैं। हर चरण को एक ही प्रोजेक्ट और उन्हीं फ़्लोर एरिया के साथ चलाइए, फिर कोशिश कीजिए।',
  'Whole building or part of it': 'पूरी इमारत या उसका हिस्सा',
  'Phases in this total': 'इस कुल में शामिल चरण',
  'All five phases are in this total: frame, walls, wiring, plumbing and finishing.': 'इस कुल में पाँचों चरण शामिल हैं: ढाँचा, दीवारें, वायरिंग, प्लंबिंग और फ़िनिशिंग।',
  'Counted once': 'एक ही बार गिना गया',
  'Lintels over doors and windows': 'दरवाज़ों और खिड़कियों के ऊपर के लिंटल',
  'This total covers {0} of the 5 phases. It does not update if you add a phase later.': 'यह कुल 5 में से {0} चरणों को शामिल करता है। बाद में कोई चरण जोड़ने पर यह अपने-आप नहीं बदलता।',
  // the paid part: tiles
  'Steel bars': 'स्टील सरिया',
  'Bricks or blocks': 'ईंट या ब्लॉक',
  'Stone aggregate': 'गिट्टी',
  'Items to buy': 'ख़रीदने की चीज़ें',
  'items': 'आइटम',
  // tables
  'What is in this total': 'इस कुल में क्या-क्या है',
  'Each row is one paid report. The quantities below come from these reports and nothing else.': 'हर पंक्ति एक भुगतान की हुई रिपोर्ट है। नीचे की मात्राएँ इन्हीं रिपोर्टों से आती हैं, और कहीं से नहीं।',
  'Phase': 'चरण',
  'Floors': 'मंज़िलें',
  'Built-up area (m²)': 'बिल्ट-अप एरिया (m²)',
  'Items': 'आइटम',
  'What it covers': 'इसमें क्या शामिल है',
  'The big materials, added across phases': 'बड़ी सामग्री, सभी चरणों में जोड़कर',
  'Cement, sand and stone are used by more than one phase. Here they are added into one figure to order.': 'सीमेंट, रेत और गिट्टी एक से ज़्यादा चरणों में लगती हैं। यहाँ उन्हें जोड़कर ऑर्डर करने के लिए एक आँकड़ा बनाया गया है।',
  'Material': 'सामग्री',
  'Total': 'कुल',
  'Unit': 'यूनिट',
  'Steel bars, all sizes': 'स्टील सरिया, सभी साइज़',
  'Stone aggregate 20 mm': 'गिट्टी 20 mm',
  'Each phase rounds its own figures up to whole bags, bars and units, so the total can sit a little above the sum of unrounded figures. Steel is the sum of every bar size in the frame (and the lintel bars when no frame report is in the total).': 'हर चरण अपने आँकड़ों को पूरे बैग, सरिया और यूनिट तक ऊपर गोल करता है, इसलिए कुल, बिना गोल किए आँकड़ों के जोड़ से थोड़ा ऊपर आ सकता है। स्टील, ढाँचे में हर साइज़ के सरिये का जोड़ है (और जब कुल में ढाँचे की रिपोर्ट न हो, तब लिंटल के सरिये का)।',
  'Item': 'आइटम',
  'Quantity': 'मात्रा',
  'How it is counted': 'कैसे गिना गया',
  'When you need each phase': 'हर चरण कब चाहिए',
  'Follow the order the work follows on site, so material is not sitting on site (or running out) at the wrong time.': 'साइट पर काम जिस क्रम में होता है, उसी क्रम में चलिए, ताकि सामान ग़लत समय पर साइट पर पड़ा न रहे (या ख़त्म न हो जाए)।',
  'When': 'कब',
  // the frame's own lines
  'Concrete': 'कंक्रीट',
  'Steel': 'स्टील',
  'Shuttering and earthwork': 'शटरिंग और मिट्टी का काम',
  'Footings, columns, beams, slabs and stairs, with site wastage': 'फ़ुटिंग, कॉलम, बीम, स्लैब और सीढ़ियाँ, साइट की टूट-फूट समेत',
  'Concrete in the frame, with site wastage': 'ढाँचे का कंक्रीट, साइट की टूट-फूट समेत',
  'Fe500D bars, {0} mm': 'Fe500D सरिया, {0} mm',
  'Cut, bent and lapped, with the buying allowance': 'कटाई, मुड़ाई और ओवरलैप समेत, ख़रीद की छूट के साथ',
  'Binding wire': 'बाइंडिंग तार',
  'Tying the bars': 'सरिये बाँधने के लिए',
  'Shuttering, contact area': 'शटरिंग, छूने वाला एरिया',
  'Sides and soffits of every member': 'हर हिस्से की बग़लें और निचली सतह',
  'Excavation for footings and plinth': 'फ़ुटिंग और प्लिंथ की खुदाई',
  'Pits to the founding depth': 'नींव की गहराई तक के गड्ढे',
  // bands, assumptions, what is not counted
  '{0}: the widest range in that report': '{0} रिपोर्ट का सबसे चौड़ा दायरा',
  'Every figure comes from the paid report of its phase, as the customer received it. The Grand Total adds those reports; it does not recalculate them.': 'हर आँकड़ा अपने चरण की भुगतान की हुई रिपोर्ट से आता है, जैसी ग्राहक को मिली थी। ग्रैंड टोटल उन रिपोर्टों को जोड़ता है; उन्हें दोबारा नहीं निकालता।',
  'Quantities are added by item. Cement, sand and stone from different phases go into one figure; every other item stays under its own phase.': 'मात्राएँ आइटम के हिसाब से जोड़ी जाती हैं। अलग-अलग चरणों का सीमेंट, रेत और गिट्टी एक आँकड़े में आते हैं; बाक़ी हर आइटम अपने चरण में ही रहता है।',
  'Where two reports count the same thing, it is counted once. The lintels over doors and windows are counted in the frame, so the walls report’s lintel concrete and steel are taken out when both are present.': 'जहाँ दो रिपोर्टें एक ही चीज़ गिनती हैं, वहाँ वह एक ही बार गिनी जाती है। दरवाज़ों और खिड़कियों के ऊपर के लिंटल ढाँचे में गिने जाते हैं, इसलिए दोनों रिपोर्टें होने पर दीवारों की रिपोर्ट के लिंटल का कंक्रीट और स्टील निकाल दिया जाता है।',
  'The ranges beside the big totals add each phase’s own range for that material. The phases are separate estimates, so they can be off in the same direction, and the combined range is never narrower than the widest of them.': 'बड़े कुलों के बगल के दायरे उस सामग्री के लिए हर चरण का अपना दायरा जोड़ते हैं। चरण अलग-अलग अनुमान हैं, इसलिए वे एक ही दिशा में ग़लत हो सकते हैं, और जोड़ा हुआ दायरा उनमें से सबसे चौड़े से कभी संकरा नहीं होता।',
  'The assumptions behind every phase are listed under “The assumptions in each phase” below. Where a phase assumes a room size, a door size or a wastage, that assumption is in the total.': 'हर चरण के पीछे की मान्यताएँ नीचे “हर चरण की मान्यताएँ” में दी हैं। जहाँ कोई चरण कमरे का साइज़, दरवाज़े का साइज़ या टूट-फूट मानकर चलता है, वह मान्यता कुल में शामिल है।',
  'Labour, contractors, equipment hire and transport. The site counts quantities only.': 'मज़दूरी, ठेकेदार, मशीनों का किराया और ढुलाई। साइट सिर्फ़ मात्राएँ गिनती है।',
  'Anything a phase report lists as not counted (listed under each phase).': 'जो कुछ किसी चरण की रिपोर्ट “नहीं गिना गया” बताती है (हर चरण के नीचे दिया है)।',
  'Site-specific items no questionnaire can see: a basement, a lift, a swimming pool, a compound wall, landscaping and soil treatment beyond what a phase lists.': 'साइट की वे चीज़ें जो कोई सवालों की सूची नहीं देख सकती: बेसमेंट, लिफ़्ट, स्विमिंग पूल, बाउंड्री वॉल, लैंडस्केपिंग और मिट्टी का उपचार, उससे आगे जो कोई चरण गिनता है।',
  // the wording of the page and the PDF
  'All phases · one buying list': 'सभी चरण · ख़रीद की एक सूची',
  'Your frame, walls, wiring, plumbing and finishing reports added into one list of what to buy, with cement, sand and stone added across phases and nothing counted twice.': 'आपके ढाँचे, दीवारों, वायरिंग, प्लंबिंग और फ़िनिशिंग की रिपोर्टें जुड़कर ख़रीदने वाली चीज़ों की एक सूची बनती हैं, जिसमें सीमेंट, रेत और गिट्टी सभी चरणों में जोड़ी जाती है और कुछ भी दो बार नहीं गिना जाता।',
  'One list of what to buy, in the order the work happens on site': 'ख़रीदने की चीज़ों की एक सूची, उसी क्रम में जिसमें साइट पर काम होता है',
  'Cement, sand and stone added across every phase': 'सीमेंट, रेत और गिट्टी, हर चरण में जोड़कर',
  'Anything two reports both count (the lintels) taken out, so it is ordered once': 'जो दोनों रिपोर्टें गिनती हैं (लिंटल) वह एक बार निकाल दिया जाता है, ताकि उसका ऑर्डर एक ही बार हो',
  'A check that the reports are for the same building, and which phases are missing': 'इस बात की जाँच कि रिपोर्टें एक ही इमारत की हैं, और कौन-से चरण छूटे हैं',
  'The assumptions behind every phase, and what is not counted': 'हर चरण की मान्यताएँ, और क्या नहीं गिना गया',
  'A PDF you can hand to your contractor': 'एक PDF जो आप अपने ठेकेदार को दे सकते हैं',
  'Your reports': 'आपकी रिपोर्टें',
  'Every report you have bought stays on your account, and in the email we sent you.': 'आपकी ख़रीदी हर रिपोर्ट आपके खाते में और हमारे भेजे ईमेल में रहती है।',
}

const LINTEL_BITS: [RegExp, string][] = [
  [/^(.+) bags of cement$/, '$1 बैग सीमेंट'],
  [/^(.+) kg of steel$/, '$1 kg स्टील'],
  [/^(.+) m³ of sand$/, '$1 m³ रेत'],
  [/^(.+) m³ of stone$/, '$1 m³ गिट्टी'],
]

/** Hindi for one string of the Grand Total; `tq` is the trade tools' lookup (item names, units, ranges). */
export function trGrand(s: string, tq: (s: string) => string): string {
  if (!s) return s
  const own = trQty(s, GRAND_DICT)
  // "All 2 reports are for 2 floors ... built-up in Pune, Maharashtra.": the town and the state in Devanagari
  if (own !== s) return /^All \d+ reports are for .* built-up in /.test(s) ? placesHi(own) : own
  let m: RegExpExecArray | null
  // "1 floor", "3 floors" (the chips); a number only, so "Ground floor" is left to the trade dictionary
  if ((m = /^(\d+) floors?$/.exec(s))) return `${m[1]} ${m[1] === '1' ? 'मंज़िल' : 'मंज़िलें'}`
  // "Frame: StructurePro" (a phase table title)
  if ((m = /^(Frame|Walls|Wiring|Plumbing|Finishing): (\w+)$/.exec(s))) return `${trGrand(m[1], tq)}: ${m[2]}`
  // "Phase 1. Footings, ... shuttering." (a phase table subtitle)
  if ((m = /^(Phase \d)\. (.+)\.$/.exec(s))) return `${trGrand(m[1], tq)}। ${trGrand(m[2], tq)}।`
  // "Not in this total: StructurePro (footings, ...); MasonryPro (...). The list is for the phases you have, ..."
  if ((m = /^Not in this total: (.+)\. The list is for the phases you have, not for the whole building\. It does not update when you add a phase later\.$/.exec(s))) {
    const list = m[1].split('; ').map(it => {
      const x = /^(\w+) \((.+)\)$/.exec(it)
      return x ? `${x[1]} (${COVERS_LC[x[2]] ?? x[2]})` : it
    }).join('; ')
    return `इस कुल में नहीं: ${list}। सूची सिर्फ़ उन चरणों की है जो आपके पास हैं, पूरी इमारत की नहीं। बाद में कोई चरण जोड़ने पर यह अपने-आप नहीं बदलती।`
  }
  if ((m = /^The phases not in this total: (.+)\.$/.exec(s))) return `जो चरण इस कुल में नहीं हैं: ${m[1]}।`
  if ((m = /^The frame report already counts the lintels, and so does the walls report\. The walls report's share \((.+)\) is taken out of this list so the same concrete and steel are not ordered twice\.$/.exec(s))) {
    const bits = m[1].split(', ').map(b => {
      for (const [re, to] of LINTEL_BITS) if (re.test(b)) return b.replace(re, to)
      return b
    }).join(', ')
    return `ढाँचे की रिपोर्ट लिंटल गिन चुकी है, और दीवारों की रिपोर्ट भी गिनती है। दीवारों की रिपोर्ट का हिस्सा (${bits}) इस सूची से निकाल दिया गया है, ताकि वही कंक्रीट और स्टील दो बार ऑर्डर न हो।`
  }
  const w = tq(s)
  if (w !== s) return w
  // the StructurePro report's own sentences (its assumptions, what it does not count, its sources)
  const st = structTrDetail(s)
  if (st.text !== s) return st.text
  // "Phase 1 · Frame", "StructurePro · Frame"
  if (s.includes(' · ')) return s.split(' · ').map(p => trGrand(p, tq)).join(' · ')
  return s
}

/** `const t = useGrandTr()` then `t(server string)`: Hindi on a Hindi page, the string untouched otherwise. */
export function useGrandTr() {
  const locale = useLocale()
  const tq = useQtyTr('all')
  return useCallback((s: string) => (locale === 'hi' ? trGrand(s, tq) : s), [locale, tq])
}
