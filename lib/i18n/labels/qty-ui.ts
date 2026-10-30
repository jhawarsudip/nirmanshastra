/*
  Words on the screens of the trade tools' wizard and report (MasonryPro, ElectricalPro, PlumbingPro, InteriorPro):
  the step bar, registration, project picker, the form chrome, the results chrome, the rupee panel, the pack and payment prompts.
  English first, then Hindi typed as the English one, so a missing key fails tsc. Read with useCopy (client).
  The fields and options of each tool's own form are in lib/qty/forms/hi.ts; the words the SERVER sends are in qty-*.ts (Dict).
*/
import type { Copy } from '../copy'

/* ───────────── the inner-page kit: step bar, "your project so far", tips ───────────── */

const kitEn = {
  progress: 'Progress',
  yourProjectSoFar: 'Your project so far',
  yourProject: 'Your project',
  floors: 'Floors',
  builtUpArea: 'Built-up area',
  siteCondition: 'Site condition',
  concreteGrade: 'Concrete grade',
  steelGrade: 'Steel grade',
  wallType: 'Wall type',
  totalArea: 'Total area',
  finishLevel: 'Finish level',
  sqft: 'sq ft',
  sqm: 'sq m',
  answersAppear: 'Your answers will appear here as you go.',
  checkedTitle: 'Checked against Indian Standards',
  checkedText: 'Every quantity follows the IS codes and is worked out for you. This summary updates as you answer.',
  fullReport: (tool: string) => `${tool} full report`,
  aboutTip: (title: string) => `About ${title}`,
  yourNumbers: 'Your numbers',
  theAnswer: 'The answer',
  standardsUsed: 'Standards used',
}
const kitHi: typeof kitEn = {
  progress: 'प्रगति',
  yourProjectSoFar: 'अब तक आपका प्रोजेक्ट',
  yourProject: 'आपका प्रोजेक्ट',
  floors: 'मंज़िलें',
  builtUpArea: 'बिल्ट-अप एरिया',
  siteCondition: 'साइट की स्थिति',
  concreteGrade: 'कंक्रीट ग्रेड',
  steelGrade: 'स्टील ग्रेड',
  wallType: 'दीवार का प्रकार',
  totalArea: 'कुल एरिया',
  finishLevel: 'फ़िनिश का स्तर',
  sqft: 'वर्ग फ़ुट',
  sqm: 'वर्ग मीटर',
  answersAppear: 'जैसे-जैसे आप जवाब देंगे, वे यहाँ दिखते जाएँगे।',
  checkedTitle: 'भारतीय मानकों से जाँचा गया',
  checkedText: 'हर मात्रा IS कोड के अनुसार है और आपके लिए निकाली जाती है। आप जैसे-जैसे जवाब देते हैं, यह सारांश बदलता जाता है।',
  fullReport: (tool: string) => `${tool} की पूरी रिपोर्ट`,
  aboutTip: (title: string) => `${title} के बारे में`,
  yourNumbers: 'आपके आँकड़े',
  theAnswer: 'जवाब',
  standardsUsed: 'इस्तेमाल हुए मानक',
}
export const KIT: Copy<typeof kitEn> = { en: kitEn, hi: kitHi }

/* ───────────── the wizard page ───────────── */

const pageEn = {
  steps: ['About you', 'Your project', 'Your building', 'Your report'],
  fullReport: 'Full report',
  couldNotFinish: 'We could not finish',
  couldNotWork: 'We could not work this out. Please try again.',
}
const pageHi: typeof pageEn = {
  steps: ['आपके बारे में', 'आपका प्रोजेक्ट', 'आपकी इमारत', 'आपकी रिपोर्ट'],
  fullReport: 'पूरी रिपोर्ट',
  couldNotFinish: 'हम इसे पूरा नहीं कर पाए',
  couldNotWork: 'हम यह निकाल नहीं पाए। कृपया फिर कोशिश कीजिए।',
}
export const QTY_PAGE: Copy<typeof pageEn> = { en: pageEn, hi: pageHi }

/* ───────────── step 1: registration ───────────── */

const regEn = {
  step: 'Step 1 of 4',
  title: 'Tell us who and where',
  sub: 'Your report is sent to your email. It takes under a minute.',
  signedInAs: (who: string) => `Signed in as ${who}`,
  filledFromAccount: 'Your name and email are filled in from your account.',
  yourName: 'Your name',
  namePh: 'Ramesh Sharma',
  email: 'Email',
  emailHint: 'Your report is sent here.',
  emailPh: 'ramesh@example.com',
  state: 'State',
  selectState: 'Select your state',
  city: 'City',
  cityPh: 'e.g. Pune',
  project: 'Project name (optional)',
  projectHint: 'To find this report again. You can skip it.',
  projectPh: 'e.g. Sharma Residence, Kothrud',
  errName: 'Please enter your name',
  errEmail: 'Please enter a valid email address',
  errState: 'Please choose your state',
  errCity: 'Please enter your city',
  noSession: 'Could not start a session. Please try again, or log in.',
  registrationFailed: 'Registration failed',
  wentWrong: 'Something went wrong. Please try again.',
  didNotGoThrough: 'That did not go through',
  saving: 'Saving…',
  next: 'Continue',
  fine: 'We save your details securely and email you only your report and a few IS-code construction tips.',
}
const regHi: typeof regEn = {
  step: 'चरण 1 / 4',
  title: 'बताइए, आप कौन हैं और कहाँ हैं',
  sub: 'आपकी रिपोर्ट आपके ईमेल पर भेजी जाती है। एक मिनट से कम लगता है।',
  signedInAs: (who: string) => `${who} के रूप में लॉग इन हैं`,
  filledFromAccount: 'आपका नाम और ईमेल आपके खाते से भर दिए गए हैं।',
  yourName: 'आपका नाम',
  namePh: 'रमेश शर्मा',
  email: 'ईमेल',
  emailHint: 'आपकी रिपोर्ट यहीं भेजी जाती है।',
  emailPh: 'ramesh@example.com',
  state: 'राज्य',
  selectState: 'अपना राज्य चुनिए',
  city: 'शहर',
  cityPh: 'जैसे पुणे',
  project: 'प्रोजेक्ट का नाम (वैकल्पिक)',
  projectHint: 'ताकि यह रिपोर्ट दोबारा मिल सके। आप इसे छोड़ सकते हैं।',
  projectPh: 'जैसे शर्मा निवास, कोथरुड',
  errName: 'कृपया अपना नाम डालिए',
  errEmail: 'कृपया सही ईमेल पता डालिए',
  errState: 'कृपया अपना राज्य चुनिए',
  errCity: 'कृपया अपना शहर डालिए',
  noSession: 'सेशन शुरू नहीं हो पाया। कृपया फिर कोशिश कीजिए, या लॉग इन कीजिए।',
  registrationFailed: 'रजिस्ट्रेशन नहीं हो पाया',
  wentWrong: 'कुछ गड़बड़ हो गई। कृपया फिर कोशिश कीजिए।',
  didNotGoThrough: 'यह नहीं हो पाया',
  saving: 'सेव हो रहा है…',
  next: 'आगे बढ़िए',
  fine: 'हम आपकी जानकारी सुरक्षित रखते हैं और आपको सिर्फ़ आपकी रिपोर्ट और IS कोड पर आधारित निर्माण के कुछ सुझाव ईमेल करते हैं।',
}
export const QTY_REG: Copy<typeof regEn> = { en: regEn, hi: regHi }

/* ───────────── step 2: the project picker ───────────── */

const pickEn = {
  checking: 'Checking for saved projects…',
  eyebrow: (tool: string) => `${tool} · Continue or start new`,
  title: 'Continue an existing project?',
  sub: 'We found saved projects on your account. Pick one and we fill in the form for you, or start fresh.',
  legend: 'Choose a project',
  groundOnly: 'Ground only',
  groundPlus: (n: number) => `Ground + ${n}`,
  startNew: 'Start a new project',
  startNewSub: 'Enter everything fresh. A new project is saved for you.',
  prefill: 'These fill in for you on the next steps',
  projectName: 'Project name',
  city: 'City',
  state: 'State',
  floors: 'Floors',
  prefillNote: 'You can change any of these. Questions about the structure itself, like concrete grade and wall type, are always asked fresh.',
  cont: (name: string) => `Continue “${name}”`,
}
const pickHi: typeof pickEn = {
  checking: 'सेव किए हुए प्रोजेक्ट देखे जा रहे हैं…',
  eyebrow: (tool: string) => `${tool} · जारी रखिए या नया शुरू कीजिए`,
  title: 'क्या कोई पुराना प्रोजेक्ट जारी रखना है?',
  sub: 'आपके खाते में सेव किए हुए प्रोजेक्ट मिले हैं। एक चुनिए तो हम फ़ॉर्म भर देंगे, या नए सिरे से शुरू कीजिए।',
  legend: 'एक प्रोजेक्ट चुनिए',
  groundOnly: 'सिर्फ़ ग्राउंड',
  groundPlus: (n: number) => `ग्राउंड + ${n}`,
  startNew: 'नया प्रोजेक्ट शुरू कीजिए',
  startNewSub: 'सब कुछ नए सिरे से भरिए। नया प्रोजेक्ट आपके लिए सेव हो जाएगा।',
  prefill: 'अगले चरणों में ये अपने-आप भर जाएँगे',
  projectName: 'प्रोजेक्ट का नाम',
  city: 'शहर',
  state: 'राज्य',
  floors: 'मंज़िलें',
  prefillNote: 'इनमें से कुछ भी बदल सकते हैं। ढाँचे से जुड़े सवाल, जैसे कंक्रीट ग्रेड और दीवार का प्रकार, हर बार नए सिरे से पूछे जाते हैं।',
  cont: (name: string) => `“${name}” जारी रखिए`,
}
export const QTY_PICK: Copy<typeof pickEn> = { en: pickEn, hi: pickHi }

/* ───────────── step 3: the form chrome (the questions themselves are in lib/qty/forms/hi.ts) ───────────── */

const formEn = {
  back: 'Change project',
  step: 'Step 3 of 4',
  plotTitle: 'Where is the plot, and how big is the building?',
  state: 'State',
  selectState: 'Select your state or UT',
  city: 'Town or city',
  cityPh: 'e.g. Pune',
  numFloors: 'Number of floors',
  numFloorsHint: 'G means ground only. G + 1 means ground plus one floor above.',
  gOnly: 'G (ground only)',
  gPlus: (n: number) => `G + ${n}`,
  sameArea: 'Same area on every floor?',
  yes: 'Yes',
  no: 'No',
  areaOne: 'Built-up area of one floor (sq ft)',
  areaOneHint: 'Walls and balconies included, as in your plan',
  areaPh: 'e.g. 1200',
  areaFloor: 'Area (sq ft)',
  floorNames: ['Ground floor', 'First floor', 'Second floor', 'Third floor', 'Fourth floor', 'Fifth floor', 'Sixth floor', 'Seventh floor', 'Eighth floor', 'Ninth floor'],
  floorN: (n: number) => `Floor ${n}`,
  errState: 'Choose your state',
  errArea: 'Enter the area of one floor in sq ft (100 to 30,000)',
  errFloors: 'Enter an area between 100 and 30,000 sq ft for every floor',
  errEnter: (label: string) => `Enter ${label.toLowerCase()}`,
  errRange: (label: string, min: number, max: number) => `${label} must be between ${min} and ${max}`,
  checkThese: 'Please check these before continuing',
  work: 'Work out my quantities',
  oneFewer: (label: string) => `One fewer: ${label}`,
  oneMore: (label: string) => `One more: ${label}`,
}
const formHi: typeof formEn = {
  back: 'प्रोजेक्ट बदलिए',
  step: 'चरण 3 / 4',
  plotTitle: 'प्लॉट कहाँ है, और इमारत कितनी बड़ी है?',
  state: 'राज्य',
  selectState: 'अपना राज्य या केंद्र शासित प्रदेश चुनिए',
  city: 'कस्बा या शहर',
  cityPh: 'जैसे पुणे',
  numFloors: 'मंज़िलों की संख्या',
  numFloorsHint: 'G का मतलब सिर्फ़ ग्राउंड फ़्लोर। G + 1 का मतलब ग्राउंड और उसके ऊपर एक मंज़िल।',
  gOnly: 'G (सिर्फ़ ग्राउंड)',
  gPlus: (n: number) => `G + ${n}`,
  sameArea: 'क्या हर मंज़िल का एरिया एक जैसा है?',
  yes: 'हाँ',
  no: 'नहीं',
  areaOne: 'एक मंज़िल का बिल्ट-अप एरिया (वर्ग फ़ुट)',
  areaOneHint: 'दीवारें और बालकनी समेत, जैसा आपके नक्शे में है',
  areaPh: 'जैसे 1200',
  areaFloor: 'एरिया (वर्ग फ़ुट)',
  floorNames: ['ग्राउंड फ़्लोर', 'पहली मंज़िल', 'दूसरी मंज़िल', 'तीसरी मंज़िल', 'चौथी मंज़िल', 'पाँचवीं मंज़िल', 'छठी मंज़िल', 'सातवीं मंज़िल', 'आठवीं मंज़िल', 'नौवीं मंज़िल'],
  floorN: (n: number) => `मंज़िल ${n}`,
  errState: 'अपना राज्य चुनिए',
  errArea: 'एक मंज़िल का एरिया वर्ग फ़ुट में डालिए (100 से 30,000)',
  errFloors: 'हर मंज़िल के लिए 100 से 30,000 वर्ग फ़ुट के बीच का एरिया डालिए',
  errEnter: (label: string) => `${label} डालिए`,
  errRange: (label: string, min: number, max: number) => `${label} ${min} और ${max} के बीच होना चाहिए`,
  checkThese: 'आगे बढ़ने से पहले इन्हें देख लीजिए',
  work: 'मेरी मात्राएँ निकालिए',
  oneFewer: (label: string) => `${label}: एक कम`,
  oneMore: (label: string) => `${label}: एक ज़्यादा`,
}
export const QTY_FORM: Copy<typeof formEn> = { en: formEn, hi: formHi }

/* ───────────── step 4: results ───────────── */

const resEn = {
  stepProject: (project: string) => `Step 4 of 4 · ${project}`,
  yourProject: 'Your project',
  ready: 'Your quantities are ready',
  worked: 'Here is what we worked out',
  previewMode: 'Preview mode: full report open for testing',
  checked: 'Checked against the Indian Standards',
  pass: 'PASS',
  note: 'NOTE',
  fail: 'FAIL',
  pleaseRead: 'Please read',
  lockedK: 'The quantities are in the full report',
  lockedTitle: 'Know how much to buy, item by item',
  starting: 'Starting the payment…',
  checkingPay: 'Checking your payment…',
  confirmingPay: 'Confirming your payment…',
  unlock: (price: string) => `Unlock the full report · ${price}`,
  payFine: 'One payment, no subscription. Paid through Razorpay; we never see your card details.',
  putting: 'Putting your quantities together…',
  loadFailed: 'We could not load your report',
  tryAgain: 'Try again',
  previewNoPay: 'Preview mode · no payment taken',
  received: 'Payment received',
  unlocked: 'Your report is unlocked',
  preparingPdf: 'Preparing your PDF…',
  preparingDl: 'Preparing the download…',
  download: 'Download the PDF report',
  pdfFailed: 'The PDF could not be prepared just now. Everything is on this page.',
  pdfAgain: 'Try the PDF again',
  order: 'What to order',
  orderSub: 'The main totals. The line under each figure is the range the real number is likely to fall in (see “How far off can this be”).',
  off: 'How far off can this be',
  offSub: 'This is a code-based planning estimate worked out from your answers, not a design for your drawings. Your drawings will differ; the ranges say by how much the real figure is likely to.',
  band: (label: string, below: number, above: number) => `${label}: from ${below}% below to ${above}% above the figure shown.`,
  offNote: 'Use it to plan, to check a contractor’s quantities for gross errors, and to order the first lots. Final quantities come from the drawings and the professional who signs them.',
  assumptions: 'Assumptions',
  notCounted: 'Not counted in this report',
  sources: 'Standards and sources used',
  next: 'Next',
  start: (name: string) => `Start ${name}`,
  again: 'Start a new estimate',
}
const resHi: typeof resEn = {
  stepProject: (project: string) => `चरण 4 / 4 · ${project}`,
  yourProject: 'आपका प्रोजेक्ट',
  ready: 'आपकी मात्राएँ तैयार हैं',
  worked: 'हमने यह निकाला है',
  previewMode: 'प्रीव्यू मोड: जाँच के लिए पूरी रिपोर्ट खुली है',
  checked: 'भारतीय मानकों से जाँचा गया',
  pass: 'पास',
  note: 'नोट',
  fail: 'फ़ेल',
  pleaseRead: 'कृपया पढ़ें',
  lockedK: 'मात्राएँ पूरी रिपोर्ट में हैं',
  lockedTitle: 'जानिए कितना ख़रीदना है, एक-एक आइटम करके',
  starting: 'भुगतान शुरू हो रहा है…',
  checkingPay: 'आपका भुगतान जाँचा जा रहा है…',
  confirmingPay: 'आपके भुगतान की पुष्टि हो रही है…',
  unlock: (price: string) => `पूरी रिपोर्ट खोलिए · ${price}`,
  payFine: 'एक बार भुगतान, कोई सब्सक्रिप्शन नहीं। भुगतान Razorpay से होता है; आपके कार्ड की जानकारी हम कभी नहीं देखते।',
  putting: 'आपकी मात्राएँ जोड़ी जा रही हैं…',
  loadFailed: 'हम आपकी रिपोर्ट लोड नहीं कर पाए',
  tryAgain: 'फिर कोशिश कीजिए',
  previewNoPay: 'प्रीव्यू मोड · कोई भुगतान नहीं लिया गया',
  received: 'भुगतान मिल गया',
  unlocked: 'आपकी रिपोर्ट खुल गई है',
  preparingPdf: 'आपका PDF तैयार हो रहा है…',
  preparingDl: 'डाउनलोड तैयार हो रहा है…',
  download: 'PDF रिपोर्ट डाउनलोड कीजिए',
  pdfFailed: 'अभी PDF तैयार नहीं हो पाया। सब कुछ इसी पेज पर है।',
  pdfAgain: 'PDF फिर बनाइए',
  order: 'क्या ऑर्डर करना है',
  orderSub: 'मुख्य कुल मात्राएँ। हर आँकड़े के नीचे की पंक्ति वह दायरा है जिसमें असली संख्या आने की संभावना है (देखिए “यह कितना अलग हो सकता है”)।',
  off: 'यह कितना अलग हो सकता है',
  offSub: 'यह आपके जवाबों से निकाला गया, कोड पर आधारित योजना का अनुमान है, आपके नक्शों का डिज़ाइन नहीं। आपके नक्शे अलग होंगे; ये दायरे बताते हैं कि असली आँकड़ा कितना अलग होने की संभावना है।',
  band: (label: string, below: number, above: number) => `${label}: दिखाए गए आँकड़े से ${below}% कम से ${above}% ज़्यादा तक।`,
  offNote: 'इसे योजना बनाने, ठेकेदार की मात्राओं में बड़ी गलतियाँ पकड़ने और पहली खेप का ऑर्डर देने के लिए इस्तेमाल कीजिए। अंतिम मात्राएँ नक्शों से और उन पर दस्तख़त करने वाले प्रोफ़ेशनल से आती हैं।',
  assumptions: 'मान्यताएँ',
  notCounted: 'इस रिपोर्ट में नहीं गिना गया',
  sources: 'इस्तेमाल किए गए मानक और स्रोत',
  next: 'आगे',
  start: (name: string) => `${name} शुरू कीजिए`,
  again: 'नया अनुमान शुरू कीजिए',
}
export const QTY_RES: Copy<typeof resEn> = { en: resEn, hi: resHi }

/* ───────────── small pieces under the report (delivery note, swipe hint) ───────────── */

const partsEn = {
  swipe: 'Swipe sideways to see every column',
  emailFailed: 'We could not email your report',
  keepFile: (guest: boolean) => `Download it below and keep the file${guest ? ', because as a guest you cannot log back in to fetch it later' : ''}.`,
  emailedToo: 'We have also emailed you the link.',
  keepTitle: 'Keep your report',
  guestBefore: (emailed: boolean) => `${emailed ? 'We have emailed you the link. ' : ''}As a guest you cannot log back in to fetch it later, so keep the download${emailed ? ' or the email' : ''}. To keep every report on your account, secure it from `,
  accountSettings: 'Account settings',
  guestAfter: '.',
}
const partsHi: typeof partsEn = {
  swipe: 'सारे कॉलम देखने के लिए बगल में स्वाइप कीजिए',
  emailFailed: 'हम आपकी रिपोर्ट ईमेल नहीं कर पाए',
  keepFile: (guest: boolean) => `इसे नीचे से डाउनलोड कीजिए और फ़ाइल सँभालकर रखिए${guest ? ', क्योंकि गेस्ट के रूप में आप बाद में लॉग इन करके इसे दोबारा नहीं निकाल सकते' : ''}।`,
  emailedToo: 'हमने आपको लिंक ईमेल भी कर दिया है।',
  keepTitle: 'अपनी रिपोर्ट सँभालकर रखिए',
  guestBefore: (emailed: boolean) => `${emailed ? 'हमने आपको लिंक ईमेल कर दिया है। ' : ''}गेस्ट के रूप में आप बाद में लॉग इन करके इसे दोबारा नहीं निकाल सकते, इसलिए डाउनलोड${emailed ? ' या ईमेल' : ''} सँभालकर रखिए। हर रिपोर्ट अपने खाते में रखने के लिए उसे `,
  accountSettings: 'खाते की सेटिंग',
  guestAfter: ' से सुरक्षित कीजिए।',
}
export const QTY_PARTS: Copy<typeof partsEn> = { en: partsEn, hi: partsHi }

/* ───────────── the Complete House Pack prompt above the pay button ───────────── */

const packEn = {
  title: 'Your Complete House Pack',
  used: (n: number, label: string) => `Your pack has already made the ${n} ${label} ${n === 1 ? 'report' : 'reports'} it includes. You can pay for this one below.`,
  group: 'Use your Complete House Pack',
  have: 'You have a Complete House Pack',
  left: (left: number, n: number, label: string) => `${left} of ${n} ${label} ${n === 1 ? 'report' : 'reports'} left in your pack. Nothing more to pay.`,
  unlocking: 'Unlocking…',
  use: 'Use my Complete House Pack',
  orPay: 'Or pay for this report on its own:',
  notSaved: 'Your estimate is not saved yet. Please wait a moment and try again.',
  couldNot: 'We could not use your pack.',
}
const packHi: typeof packEn = {
  title: 'आपका कम्प्लीट हाउस पैक',
  used: (n: number, label: string) => `आपका पैक अपने हिस्से की ${n} ${label} रिपोर्ट पहले ही बना चुका है। इस वाली का भुगतान आप नीचे कर सकते हैं।`,
  group: 'अपना कम्प्लीट हाउस पैक इस्तेमाल कीजिए',
  have: 'आपके पास कम्प्लीट हाउस पैक है',
  left: (left: number, n: number, label: string) => `आपके पैक में ${n} में से ${left} ${label} रिपोर्ट बची हैं। कुछ और देना नहीं है।`,
  unlocking: 'खुल रहा है…',
  use: 'मेरा कम्प्लीट हाउस पैक इस्तेमाल कीजिए',
  orPay: 'या इस रिपोर्ट का अलग से भुगतान कीजिए:',
  notSaved: 'आपका अनुमान अभी सेव नहीं हुआ है। कृपया थोड़ा रुककर फिर कोशिश कीजिए।',
  couldNot: 'हम आपका पैक इस्तेमाल नहीं कर पाए।',
}
export const QTY_PACK: Copy<typeof packEn> = { en: packEn, hi: packHi }

/* ───────────── the payment and report-loading messages (useUnlock) ───────────── */

const unlockEn = {
  notSaved: 'Your estimate is not saved yet. Please wait a moment and try again.',
  payFailed: 'The payment did not go through. Please try again.',
  couldNotLoad: 'Could not load the report',
  couldNotStart: 'Could not start the payment',
  windowNotLoaded: 'The payment window did not load. Please refresh the page and try again.',
  verifyFailed: 'Verification failed',
  couldNotVerify: 'We could not verify the payment.',
  notCompleted: 'The payment was not completed. Press the button to try again.',
  wentWrong: 'Something went wrong. Please try again.',
}
const unlockHi: typeof unlockEn = {
  notSaved: 'आपका अनुमान अभी सेव नहीं हुआ है। कृपया थोड़ा रुककर फिर कोशिश कीजिए।',
  payFailed: 'भुगतान नहीं हो पाया। कृपया फिर कोशिश कीजिए।',
  couldNotLoad: 'रिपोर्ट लोड नहीं हो पाई',
  couldNotStart: 'भुगतान शुरू नहीं हो पाया',
  windowNotLoaded: 'भुगतान की विंडो लोड नहीं हुई। कृपया पेज रीफ़्रेश करके फिर कोशिश कीजिए।',
  verifyFailed: 'भुगतान की जाँच नहीं हो पाई',
  couldNotVerify: 'हम भुगतान की जाँच नहीं कर पाए।',
  notCompleted: 'भुगतान पूरा नहीं हुआ। फिर कोशिश करने के लिए बटन दबाइए।',
  wentWrong: 'कुछ गड़बड़ हो गई। कृपया फिर कोशिश कीजिए।',
}
export const QTY_UNLOCK: Copy<typeof unlockEn> = { en: unlockEn, hi: unlockHi }

/* ───────────── "Want this in rupees?" ───────────── */

const ratesEn = {
  title: 'Want this in rupees? Enter your local rates.',
  optional: 'Optional. The quantities above stay the answer; this just multiplies them by your dealer’s rates.',
  intro: 'Type the rate your dealer quotes for each material you want priced. Leave a box empty to skip it. Your rates stay on this page: they are not saved, and they are sent to us only if you ask for the PDF with rupees.',
  updated: (d: string) => ` The typical ranges were last updated ${d}; they are only a guide.`,
  noGuess: ' We do not guess a rate for you: ask your dealer.',
  youNeed: (need: string) => `You need ${need}`,
  yourRate: 'Your rate',
  badRate: 'Type a number, for example 380 or 38.50.',
  amount: 'Amount: ',
  items: (n: number) => `${n} items`,
  pricedN: (n: number) => `, ${n} priced`,
  inRupees: 'In rupees, at your rates',
  head: ['Item', 'Quantity', 'Your rate', 'Amount'],
  totalFor: (n: number) => `Total for the ${n} ${n === 1 ? 'item' : 'items'} priced`,
  gave: (priced: number, of: number, blank: number) => `You gave a rate for ${priced} of ${of} items. The other ${blank} ${blank === 1 ? 'is' : 'are'} not in this total.`,
  notPriced: 'Not priced here: ',
  making: 'Making your PDF…',
  download: 'Download the PDF with these rupees',
  clear: 'Clear my rates',
  didNotGoThrough: 'That did not go through',
  pdfFine: 'The PDF has the same report as before, with this table added after the quantities. The one already emailed to you does not change.',
  notSaved: 'Your report is not saved yet. Please wait a moment and try again.',
  pdfFailed: 'We could not make the PDF. Please try again.',
  typical: 'Typical',
  askToday: 'Ask your dealer for today’s rate',
  askDealer: 'ask your dealer',
  updatedOn: (d: string) => `updated ${d}`,
}
const ratesHi: typeof ratesEn = {
  title: 'रुपये में देखना है? अपने इलाक़े के रेट डालिए।',
  optional: 'वैकल्पिक। ऊपर की मात्राएँ ही जवाब रहती हैं; यह बस उन्हें आपके डीलर के रेट से गुणा करता है।',
  intro: 'जिस सामान की क़ीमत देखनी है, उसका वह रेट लिखिए जो आपका डीलर बताता है। किसी बॉक्स को ख़ाली छोड़ेंगे तो वह छूट जाएगा। आपके रेट इसी पेज पर रहते हैं: वे सेव नहीं होते, और हमें तभी भेजे जाते हैं जब आप रुपयों वाला PDF माँगते हैं।',
  updated: (d: string) => ` सामान्य दायरे आख़िरी बार ${d} को अपडेट हुए थे; वे सिर्फ़ एक अंदाज़ा हैं।`,
  noGuess: ' हम आपके लिए कोई रेट अंदाज़े से नहीं भरते: अपने डीलर से पूछिए।',
  youNeed: (need: string) => `आपको चाहिए: ${need}`,
  yourRate: 'आपका रेट',
  badRate: 'कोई संख्या लिखिए, जैसे 380 या 38.50।',
  amount: 'रकम: ',
  items: (n: number) => `${n} आइटम`,
  pricedN: (n: number) => `, ${n} के रेट डाले`,
  inRupees: 'रुपये में, आपके रेट पर',
  head: ['आइटम', 'मात्रा', 'आपका रेट', 'रकम'],
  totalFor: (n: number) => `जिन ${n} आइटम का रेट डाला, उनका कुल`,
  gave: (priced: number, of: number, blank: number) => `${of} में से ${priced} आइटम का रेट आपने दिया। बाक़ी ${blank} इस कुल में शामिल नहीं हैं।`,
  notPriced: 'यहाँ रेट नहीं लगा: ',
  making: 'आपका PDF बन रहा है…',
  download: 'इन रुपयों वाला PDF डाउनलोड कीजिए',
  clear: 'मेरे रेट मिटाइए',
  didNotGoThrough: 'यह नहीं हो पाया',
  pdfFine: 'PDF में वही रिपोर्ट है जो पहले थी, बस मात्राओं के बाद यह तालिका जुड़ी है। आपको पहले ईमेल की गई PDF नहीं बदलती।',
  notSaved: 'आपकी रिपोर्ट अभी सेव नहीं हुई है। कृपया थोड़ा रुककर फिर कोशिश कीजिए।',
  pdfFailed: 'हम PDF नहीं बना पाए। कृपया फिर कोशिश कीजिए।',
  typical: 'सामान्य',
  askToday: 'आज का रेट अपने डीलर से पूछिए',
  askDealer: 'अपने डीलर से पूछिए',
  updatedOn: (d: string) => `अपडेट: ${d}`,
}
export const QTY_RATES: Copy<typeof ratesEn> = { en: ratesEn, hi: ratesHi }

/** "26 Oct 2026" → "26 अक्टूबर 2026" (the rate-hint dates, which lib/rates formats in English). */
const MONTHS_HI: Record<string, string> = {
  jan: 'जनवरी', feb: 'फ़रवरी', mar: 'मार्च', apr: 'अप्रैल', may: 'मई', jun: 'जून',
  jul: 'जुलाई', aug: 'अगस्त', sep: 'सितंबर', oct: 'अक्टूबर', nov: 'नवंबर', dec: 'दिसंबर',
}
export function dateHi(d: string): string {
  return d.replace(/\b(\d{1,2}) ([A-Za-z]{3})[a-z]* (\d{4})\b/, (m, day, mon, year) => {
    const hi = MONTHS_HI[String(mon).toLowerCase()]
    return hi ? `${day} ${hi} ${year}` : m
  })
}
