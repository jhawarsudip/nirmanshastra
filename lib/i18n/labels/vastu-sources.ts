/*
  VastuPro, Hindi for the "Where the rules come from" list. Keyed by the English `work` text of each entry in SOURCES
  (vastu-rules.ts), so the English list and the PDF are untouched. A book title or a publisher stays in English, as
  titles do: those parts are marked `en` so the page can set them with lang="en".
*/
export type SourcePart = string | { en: string }

export interface SourceHi { work: SourcePart[]; note: SourcePart[] }

export const VASTU_SOURCES_HI: Record<string, SourceHi> = {
  'Brihat Samhita, ch. 53, “On House-building” (Varahamihira, about the 6th century)': {
    work: ['बृहत्संहिता, अध्याय 53, “गृह-निर्माण पर” (वराहमिहिर, लगभग छठी सदी)'],
    note: ['एक शुरुआती ग्रंथ, जिसमें घर पर एक अध्याय है (कौटिल्य के अर्थशास्त्र 3.8 में इससे पहले का एक अध्याय है)। एन. चिदंबरम अय्यर के 1884 के अनुवाद से पढ़ा गया, ऑनलाइन प्रतियों के ज़रिए, किसी छपे संस्करण से नहीं। 32 प्रवेश स्थितियों, रसोई और पूजा घर की दिशाओं, और जल स्रोत की दिशाओं का स्रोत।'],
  },
  'Mayamata (south India; scholars date it variously within the first millennium CE)': {
    work: ['मयमत (दक्षिण भारत; विद्वान इसका काल पहली सहस्राब्दी ई. के भीतर अलग-अलग बताते हैं)'],
    note: ['ब्रूनो डागेंस के अनुवाद के ऑनलाइन पुनःप्रकाशनों से पढ़ा गया, जो छपा संस्करण नहीं हैं, और रिपन घोष के 2024 के अध्ययन से। वास्तु ग्रिड, खुले रखे गए ब्रह्मस्थान, और इस नियम का स्रोत कि कोई दरवाज़ा उसके सामने नहीं खुलता।'],
  },
  'Samarangana Sutradhara (Bhoja, 11th century)': {
    work: ['समरांगण सूत्रधार (भोज, 11वीं सदी)'],
    note: ['डी. एन. शुक्ला के सार-संग्रह से पढ़ा गया। दरवाज़ों के दोषों और घरों के प्रकारों का स्रोत।'],
  },
  'Vibhuti Chakrabarti, Indian Architectural Theory and Practice (Routledge, 2013)': {
    work: ['विभूति चक्रवर्ती, ', { en: 'Indian Architectural Theory and Practice' }, ' (', { en: 'Routledge' }, ', 2013)'],
    note: ['ग्रंथ क्या कहते हैं और आज सलाहकार उन्हें कैसे इस्तेमाल करते हैं, इसका सबसे अच्छा सार। यह सलाहकारों के चलन की आलोचना भी करती है। समीक्षाओं और अंशों से पढ़ी गई, पूरी पुस्तक से नहीं।'],
  },
  'En-Yu Huang, Comparing the Do’s and Taboos in Chinese Feng-Shui and Indian Vastu-Shastra (Leiden, 2012)': {
    work: ['एन-यू हुआंग, ', { en: 'Comparing the Do’s and Taboos in Chinese Feng-Shui and Indian Vastu-Shastra' }, ' (लाइडन, 2012)'],
    note: ['पुराने ग्रंथ जो कहते हैं और आज के मैनुअल जो सिखाते हैं, इन दोनों को अलग करती है।'],
  },
  'Bureau of Energy Efficiency, Eco-Niwas Samhita 2018 (energy code for residential buildings)': {
    work: ['ऊर्जा दक्षता ब्यूरो, इको-निवास संहिता 2018 (आवासीय इमारतों के लिए ऊर्जा कोड)'],
    note: ['उत्तर की ओर खुलने वाले कमरों के लिए दिए गए एक व्यावहारिक कारण में इस्तेमाल हुए ओरिएंटेशन फ़ैक्टरों का स्रोत।'],
  },
}
