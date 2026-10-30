import type { Dict } from '../tr'

/*
  VastuPro, Hindi for the text of the rule table and of the reading. The English strings are the ones in
  app/[locale]/tools/vastu-pro/vastu-rules.ts and vastu-reading.ts, copied exactly; the reading is looked up here at
  display time (see vastu-hi.ts there). The English files, and so the PDF, are not touched. A string with {0} has a
  number filled in. A string with no entry shows in English, and scripts/check-hindi-leftovers.py lists it.

  Words used throughout: वास्तु शिक्षक (the teachers), पुराने ग्रंथ (the older texts), पारंपरिक ग्रंथ (the traditional texts),
  रीडिंग (the reading), ज़ोन (a zone), ब्रह्मस्थान (the centre). First mention of a diagonal direction in a string:
  उत्तर-पूर्व (ईशान), दक्षिण-पूर्व (आग्नेय), दक्षिण-पश्चिम (नैऋत्य), उत्तर-पश्चिम (वायव्य); later mentions: the short name.
*/

/**
 * Where a room is preferred, as the end of the sentence "वास्तु शिक्षक इसे ___ रखना पसंद करते हैं". A "|" splits what
 * goes before the verb from what trails after it.
 */
export const PREFER_HI: Readonly<Record<string, string>> = {
  // ─── prefer
  'a favoured position of the boundary; in the translation read these fall on the east, west and north sides': 'सीमा की किसी अनुकूल स्थिति में|; पढ़े गए अनुवाद में ये पूर्व, पश्चिम और उत्तर की ओर पड़ती हैं',
  'the south or west side': 'दक्षिण या पश्चिम की ओर',
  'the north, east or north-west side': 'उत्तर, पूर्व या उत्तर-पश्चिम (वायव्य) की ओर',
  'the north, north-east or east': 'उत्तर, उत्तर-पूर्व (ईशान) या पूर्व में',
  'the east, west or north, next to the kitchen': 'पूर्व, पश्चिम या उत्तर में, रसोई के पास',
  'the south-west': 'दक्षिण-पश्चिम (नैऋत्य) में',
  'the south-west or west': 'दक्षिण-पश्चिम (नैऋत्य) या पश्चिम में',
  'the east, west or north-west': 'पूर्व, पश्चिम या उत्तर-पश्चिम (वायव्य) में',
  'the north-west or west': 'उत्तर-पश्चिम (वायव्य) या पश्चिम में',
  'the south-east, the place Brihat Samhita names for the kitchen': 'दक्षिण-पूर्व (आग्नेय) में|, जो जगह बृहत्संहिता रसोई के लिए बताती है',
  'the east, west or north-west side, and never the north-east or the centre': 'पूर्व, पश्चिम या उत्तर-पश्चिम (वायव्य) की ओर|, और कभी उत्तर-पूर्व (ईशान) या केंद्र में नहीं',
  'the north-west, west or south side, and never the north-east or the centre': 'उत्तर-पश्चिम (वायव्य), पश्चिम या दक्षिण की ओर|, और कभी उत्तर-पूर्व (ईशान) या केंद्र में नहीं',
  'the north-east, the place Brihat Samhita names for the room of the household deity': 'उत्तर-पूर्व (ईशान) में|, जो जगह बृहत्संहिता घर के देवता के कमरे के लिए बताती है',
  'the north, north-east, east or west': 'उत्तर, उत्तर-पूर्व (ईशान), पूर्व या पश्चिम में',
  'the north-east or north': 'उत्तर-पूर्व (ईशान) या उत्तर में',
  'the south, west or south-west': 'दक्षिण, पश्चिम या दक्षिण-पश्चिम (नैऋत्य) में',
  'the south-west, west or north-west': 'दक्षिण-पश्चिम (नैऋत्य), पश्चिम या उत्तर-पश्चिम (वायव्य) में',
  'the south-east or north-west': 'दक्षिण-पूर्व (आग्नेय) या उत्तर-पश्चिम (वायव्य) में',
}

export const VASTU_RULE_TEXT: Dict = {
  // ─── principle
  'The texts do not just say which side the door is on. They say where along that side it sits: each of the 32 positions of the boundary has a guardian, and a few positions are named as favourable.': 'ग्रंथ सिर्फ़ यह नहीं बताते कि दरवाज़ा किस तरफ़ है। वे यह बताते हैं कि उस तरफ़ दरवाज़ा कहाँ पड़ता है: सीमा की 32 स्थितियों में से हर एक का एक रक्षक देवता है, और कुछ स्थितियों को अनुकूल बताया गया है।',
  'The older texts name no place for a back door. Teachers today keep it away from the north-east, so that the north-east stays the quiet, light side of the house.': 'पुराने ग्रंथ पिछले दरवाज़े की कोई जगह नहीं बताते। आज के वास्तु शिक्षक इसे उत्तर-पूर्व (ईशान) से दूर रखते हैं, ताकि ईशान घर का शांत और हल्का हिस्सा बना रहे।',
  'The older texts name no place for a side door. Teachers today follow the same preference as for the main door.': 'पुराने ग्रंथ बगल के दरवाज़े की कोई जगह नहीं बताते। आज के वास्तु शिक्षक वही पसंद मानते हैं जो मुख्य द्वार के लिए है।',
  'Teachers place the main sitting space on the north or east side, the side that opens to guests and morning light. The older texts do not fix a place for it.': 'वास्तु शिक्षक बैठने की मुख्य जगह उत्तर या पूर्व की ओर रखते हैं, यानी वह तरफ़ जो मेहमानों और सुबह की रोशनी के लिए खुलती है। पुराने ग्रंथ इसकी कोई जगह तय नहीं करते।',
  'A hall is read like the living room. A hall or open court at the centre fits the old idea of keeping the middle of the house open.': 'हॉल को लिविंग रूम की तरह ही पढ़ा जाता है। केंद्र में हॉल या खुला आँगन घर के बीच का हिस्सा खुला रखने के पुराने विचार से मेल खाता है।',
  'A lobby or foyer is the first space a visitor enters, so teachers place it on the favoured sides of the house.': 'लॉबी या फ़ॉयर वह पहली जगह है जिसमें आने वाला मेहमान घुसता है, इसलिए वास्तु शिक्षक इसे घर की अनुकूल दिशाओं में रखते हैं।',
  'A lounge is a modern room type, read like the living room.': 'लाउंज एक आधुनिक तरह का कमरा है, जिसे लिविंग रूम की तरह पढ़ा जाता है।',
  'Teachers place the dining space beside the kitchen, on the east, west or north side. Samarangana Sutradhara also keeps the dining space near the kitchen.': 'वास्तु शिक्षक खाने की जगह रसोई के बगल में, पूर्व, पश्चिम या उत्तर की ओर रखते हैं। समरांगण सूत्रधार भी खाने की जगह रसोई के पास रखता है।',
  'Teachers today put the heads of the household in the south-west, which they call the heavy, stable corner. No older text we could check names a place for the master bedroom; the south-west is a later teaching.': 'आज के वास्तु शिक्षक घर के मुखिया को दक्षिण-पश्चिम (नैऋत्य) में रखते हैं, जिसे वे भारी और स्थिर कोना कहते हैं। हमारे जाँचे किसी पुराने ग्रंथ में मास्टर बेडरूम की जगह नहीं बताई गई; नैऋत्य बाद की सीख है।',
  'Teachers place elders’ rooms on the south-west or west side, away from the north-east.': 'वास्तु शिक्षक बड़े-बुज़ुर्गों के कमरे दक्षिण-पश्चिम (नैऋत्य) या पश्चिम की ओर रखते हैं, उत्तर-पूर्व (ईशान) से दूर।',
  'Teachers place children’s rooms on the east, west or north-west side. The older texts say nothing specific.': 'वास्तु शिक्षक बच्चों के कमरे पूर्व, पश्चिम या उत्तर-पश्चिम (वायव्य) की ओर रखते हैं। पुराने ग्रंथ इस बारे में कुछ ख़ास नहीं कहते।',
  'Teachers place guest rooms on the north-west or west side. The older texts say nothing specific.': 'वास्तु शिक्षक मेहमानों के कमरे उत्तर-पश्चिम (वायव्य) या पश्चिम की ओर रखते हैं। पुराने ग्रंथ इस बारे में कुछ ख़ास नहीं कहते।',
  'Brihat Samhita ch. 53 names the south-east for the kitchen, and teachers link that side to Agni, the guardian of fire in the usual list of direction guardians. How firmly the other directions are cautioned comes from later teachers, who keep the fire room away from the north-east, the side they keep for the prayer room and for water.': 'बृहत्संहिता अध्याय 53 रसोई के लिए दक्षिण-पूर्व (आग्नेय) बताती है, और वास्तु शिक्षक उस तरफ़ को अग्नि से जोड़ते हैं, जो दिशा-रक्षकों की प्रचलित सूची में आग के रक्षक देवता हैं। बाक़ी दिशाओं के विरुद्ध सावधानी कितनी सख़्त है, यह बाद के वास्तु शिक्षकों से आता है, जो आग वाले कमरे को उत्तर-पूर्व (ईशान) से दूर रखते हैं, यानी उस तरफ़ से जिसे वे पूजा घर और पानी के लिए रखते हैं।',
  'Teachers keep wet rooms away from the north-east and the centre of the plan. No older text names a place for a bathroom; this comes from later manuals.': 'वास्तु शिक्षक पानी वाले कमरों को उत्तर-पूर्व (ईशान) और नक्शे के केंद्र से दूर रखते हैं। किसी पुराने ग्रंथ में बाथरूम की जगह नहीं बताई गई; यह बाद की किताबों से आया है।',
  'Teachers keep toilets out of the north-east and the centre of the plan, the sides kept for the prayer room, water and the open middle. No older text names a place for a toilet; this comes from later manuals.': 'वास्तु शिक्षक शौचालय को उत्तर-पूर्व (ईशान) और नक्शे के केंद्र से बाहर रखते हैं, यानी उन जगहों से जो पूजा घर, पानी और खुले बीच के हिस्से के लिए रखी जाती हैं। किसी पुराने ग्रंथ में शौचालय की जगह नहीं बताई गई; यह बाद की किताबों से आया है।',
  'Brihat Samhita ch. 53 names the north-east for the room of the household deity. The north and east next to it are accepted by most teachers.': 'बृहत्संहिता अध्याय 53 घर के देवता के कमरे के लिए उत्तर-पूर्व (ईशान) बताती है। उसके बगल के उत्तर और पूर्व को ज़्यादातर वास्तु शिक्षक मान लेते हैं।',
  'Teachers place the room used for study on the north or east side, facing the morning light. The older texts do not fix a place for it.': 'वास्तु शिक्षक पढ़ाई वाला कमरा उत्तर या पूर्व की ओर रखते हैं, सुबह की रोशनी की तरफ़। पुराने ग्रंथ इसकी कोई जगह तय नहीं करते।',
  'A work area at home is a modern room type, read like the study.': 'घर में काम की जगह एक आधुनिक तरह का कमरा है, जिसे स्टडी रूम की तरह पढ़ा जाता है।',
  'Brihat Samhita ch. 53 lists a direction for a water source (a well or pond, not a tank) and names the north-east and the north as favourable and the other directions as cautioned. Teachers today apply the same list to an underground tank and keep water away from the south-east, the side they link to fire, and from the south-west, the corner they call the heaviest.': 'बृहत्संहिता अध्याय 53 पानी के स्रोत (कुआँ या तालाब, टंकी नहीं) की दिशाएँ गिनाती है, और उत्तर-पूर्व (ईशान) तथा उत्तर को अनुकूल और बाक़ी दिशाओं को सावधानी वाली बताती है। आज के वास्तु शिक्षक यही सूची ज़मीन के नीचे की टंकी पर लागू करते हैं और पानी को दक्षिण-पूर्व (आग्नेय) से, जिसे वे आग से जोड़ते हैं, और दक्षिण-पश्चिम (नैऋत्य) से, जिसे वे सबसे भारी कोना कहते हैं, दूर रखते हैं।',
  'The older texts say nothing about an overhead tank. Teachers today put the heavy load on the south-west or west and keep the north-east light.': 'पुराने ग्रंथ ऊपर की टंकी के बारे में कुछ नहीं कहते। आज के वास्तु शिक्षक भारी बोझ दक्षिण-पश्चिम (नैऋत्य) या पश्चिम में रखते हैं और उत्तर-पूर्व (ईशान) को हल्का रखते हैं।',
  'Teachers follow the rule for water sources: a body of water belongs on the north or east side and away from the fire side and the heavy south-west.': 'वास्तु शिक्षक पानी के स्रोत वाला नियम मानते हैं: पानी का बड़ा स्रोत उत्तर या पूर्व की ओर होना चाहिए, आग वाली तरफ़ और भारी दक्षिण-पश्चिम (नैऋत्य) से दूर।',
  'Teachers put the staircase, a heavy and enclosed element, on the south, west or south-west side, away from the north-east and the centre. No older text names a place for it.': 'वास्तु शिक्षक सीढ़ी को, जो भारी और घिरा हुआ हिस्सा है, दक्षिण, पश्चिम या दक्षिण-पश्चिम (नैऋत्य) की ओर रखते हैं, उत्तर-पूर्व (ईशान) और केंद्र से दूर। किसी पुराने ग्रंथ में इसकी जगह नहीं बताई गई।',
  'A lift is a modern element, read like the staircase.': 'लिफ़्ट एक आधुनिक चीज़ है, जिसे सीढ़ी की तरह पढ़ा जाता है।',
  'Brihat Samhita puts the room for household utensils in the south-west and the granary in the north-west. Teachers extend this to storage in general and keep it out of the north-east.': 'बृहत्संहिता घर के बर्तनों का कमरा दक्षिण-पश्चिम (नैऋत्य) में और अनाज का भंडार उत्तर-पश्चिम (वायव्य) में रखती है। वास्तु शिक्षक इसे सामान रखने की हर जगह पर लागू करते हैं और उसे उत्तर-पूर्व (ईशान) से बाहर रखते हैं।',
  'Samarangana Sutradhara asks for a verandah. The direction of a balcony comes from later teachers, who keep the open side to the north and east and the closed side they call heavy to the south-west.': 'समरांगण सूत्रधार बरामदा रखने को कहता है। बालकनी की दिशा बाद के वास्तु शिक्षकों से आती है, जो खुली तरफ़ उत्तर और पूर्व में रखते हैं और बंद तरफ़, जिसे वे भारी कहते हैं, दक्षिण-पश्चिम (नैऋत्य) में।',
  'Teachers keep more open space on the north and east than on the south and west. Large trees close to the house are kept on the south and west.': 'वास्तु शिक्षक उत्तर और पूर्व में दक्षिण और पश्चिम से ज़्यादा खुली जगह रखते हैं। घर के पास के बड़े पेड़ दक्षिण और पश्चिम में रखे जाते हैं।',
  'The older texts do not mention vehicles. Teachers today put them on the south-east or north-west and keep them out of the north-east.': 'पुराने ग्रंथ गाड़ियों का ज़िक्र नहीं करते। आज के वास्तु शिक्षक उन्हें दक्षिण-पूर्व (आग्नेय) या उत्तर-पश्चिम (वायव्य) में रखते हैं और उत्तर-पूर्व (ईशान) से बाहर रखते हैं।',

  // ─── disputed
  'Some texts list a position on the south side as acceptable, while many consultants advise against a south door altogether. Teachers also differ on whether a door should be in the middle of a wall.': 'कुछ ग्रंथ दक्षिण तरफ़ की एक स्थिति को ठीक बताते हैं, जबकि कई सलाहकार दक्षिण के दरवाज़े के ही ख़िलाफ़ सलाह देते हैं। इस पर भी शिक्षकों में मतभेद है कि दरवाज़ा दीवार के बीच में होना चाहिए या नहीं।',
  'Some teachers prefer the south or west for the master bedroom; the south-west is the most common teaching.': 'कुछ वास्तु शिक्षक मास्टर बेडरूम के लिए दक्षिण या पश्चिम पसंद करते हैं; दक्षिण-पश्चिम (नैऋत्य) सबसे आम सीख है।',
  'Many teachers accept the north-west as a second choice. The older text names the south-east only.': 'कई वास्तु शिक्षक उत्तर-पश्चिम (वायव्य) को दूसरी पसंद के रूप में मान लेते हैं। पुराना ग्रंथ सिर्फ़ दक्षिण-पूर्व (आग्नेय) बताता है।',
  'Brihat Samhita cautions against the east for a water source, but most teachers today accept the east. Both views are shown, and the east reads “To review” here.': 'बृहत्संहिता पानी के स्रोत के लिए पूर्व के विरुद्ध सावधान करती है, पर आज के ज़्यादातर वास्तु शिक्षक पूर्व को मान लेते हैं। दोनों मत दिखाए गए हैं, और यहाँ पूर्व “दोबारा देखें” पढ़ा जाता है।',

  // ─── practical
  'In most of India a north-facing opening takes the least direct sun, so a room used mostly in the day stays cooler and gets even daylight there. East and west openings take the most heat (Eco-Niwas Samhita 2018 orientation factors). In cold hill climates the south sun is wanted instead.': 'भारत के ज़्यादातर हिस्सों में उत्तर की ओर खुलने वाली जगह पर सीधी धूप सबसे कम पड़ती है, इसलिए जो कमरा ज़्यादातर दिन में इस्तेमाल होता है वह वहाँ ठंडा रहता है और उसे बराबर दिन की रोशनी मिलती है। पूर्व और पश्चिम की ओर खुलने वाली जगहों पर सबसे ज़्यादा गर्मी पड़ती है (इको-निवास संहिता 2018 के ओरिएंटेशन फ़ैक्टर)। ठंडी पहाड़ी जलवायु में इसके उलट दक्षिण की धूप चाहिए होती है।',
  'Keeping bathrooms away from the kitchen and the drinking-water point, and at the lower end of the plot’s drainage, is sound on any plan.': 'बाथरूम को रसोई और पीने के पानी की जगह से दूर, और प्लॉट की निकासी के निचले सिरे पर रखना हर नक्शे में ठीक रहता है।',
  'Keeping toilets and septic lines away from the kitchen, the drinking-water source and any well or bore is sound on any plan, whatever the direction.': 'शौचालय और सेप्टिक लाइन को रसोई, पीने के पानी के स्रोत और किसी भी कुएँ या बोरवेल से दूर रखना हर नक्शे में ठीक रहता है, दिशा चाहे जो हो।',
  'A tank on the side of the plot where the ground is lowest is easy to fill and drain.': 'प्लॉट के जिस तरफ़ ज़मीन सबसे नीची हो, वहाँ टंकी भरना और खाली करना आसान रहता है।',
  'A tank is a heavy load. It must sit over a column or beam that is designed for it, wherever the Vastu preference points.': 'टंकी भारी बोझ है। वह ऐसे कॉलम या बीम के ऊपर बैठनी चाहिए जो उसी के लिए डिज़ाइन किया गया हो, वास्तु की पसंद चाहे जहाँ इशारा करे।',
  'Wherever it goes, a staircase needs enough headroom, tread and landing size to be safe. The National Building Code and local bye-laws decide that, not Vastu.': 'सीढ़ी जहाँ भी हो, सुरक्षित रहने के लिए उसमें काफ़ी हेडरूम, ट्रेड (पायदान) और लैंडिंग का साइज़ चाहिए। यह नेशनल बिल्डिंग कोड और स्थानीय बाइलॉज़ तय करते हैं, वास्तु नहीं।',

  // ─── special
  'A kitchen in the north-east is the placement teachers warn against most firmly. They keep the north-east for the prayer room and for water, and a cooking fire there is the opposite of what they put in that corner. Brihat Samhita names the south-east for the kitchen and says nothing against the north-east in so many words.': 'उत्तर-पूर्व (ईशान) में रसोई वह जगह है जिसके विरुद्ध वास्तु शिक्षक सबसे सख़्ती से चेताते हैं। वे ईशान को पूजा घर और पानी के लिए रखते हैं, और वहाँ खाना पकाने की आग उसके उलट है जो वे उस कोने में रखते हैं। बृहत्संहिता रसोई के लिए दक्षिण-पूर्व (आग्नेय) बताती है और ईशान के विरुद्ध सीधे शब्दों में कुछ नहीं कहती।',
  'A kitchen in the south-west is cautioned by teachers, who call the south-west the heaviest and most stable corner. Brihat Samhita names the south-east for the kitchen instead.': 'दक्षिण-पश्चिम (नैऋत्य) में रसोई के विरुद्ध वास्तु शिक्षक सावधान करते हैं, जो नैऋत्य को सबसे भारी और सबसे स्थिर कोना कहते हैं। बृहत्संहिता इसके बजाय रसोई के लिए दक्षिण-पूर्व (आग्नेय) बताती है।',
  'The south-east is the place Brihat Samhita ch. 53 names for the kitchen, and teachers link it to Agni, the guardian of fire.': 'दक्षिण-पूर्व (आग्नेय) वह जगह है जो बृहत्संहिता अध्याय 53 रसोई के लिए बताती है, और वास्तु शिक्षक इसे अग्नि से जोड़ते हैं, जो आग के रक्षक देवता हैं।',
  'A bedroom in the north-east is cautioned by teachers, who keep the north-east as the light, quiet part of the house, with the prayer room or an open space. No older text we could check says so.': 'उत्तर-पूर्व (ईशान) में बेडरूम के विरुद्ध वास्तु शिक्षक सावधान करते हैं, जो ईशान को घर का हल्का, शांत हिस्सा रखते हैं, पूजा घर या खुली जगह के साथ। हमारे जाँचे किसी पुराने ग्रंथ में ऐसा नहीं कहा गया।',
  'Teachers place the heads of the household in the south-west, which they call the heavy, stable corner. No older text we could check says so.': 'वास्तु शिक्षक घर के मुखिया को दक्षिण-पश्चिम (नैऋत्य) में रखते हैं, जिसे वे भारी, स्थिर कोना कहते हैं। हमारे जाँचे किसी पुराने ग्रंथ में ऐसा नहीं कहा गया।',
  'Brihat Samhita ch. 53 names the north-east for the room of the household deity.': 'बृहत्संहिता अध्याय 53 घर के देवता के कमरे के लिए उत्तर-पूर्व (ईशान) बताती है।',
  'A prayer room in the south-west is cautioned by teachers, who call the south-west the heavy corner. Brihat Samhita names the north-east for the room of the household deity.': 'दक्षिण-पश्चिम (नैऋत्य) में पूजा घर के विरुद्ध वास्तु शिक्षक सावधान करते हैं, जो नैऋत्य को भारी कोना कहते हैं। बृहत्संहिता घर के देवता के कमरे के लिए उत्तर-पूर्व (ईशान) बताती है।',
  'A toilet in the north-east is the placement teachers warn against most firmly: they keep the north-east for the prayer room, water and the open, light part of the house. No older text we could check names a place for a toilet.': 'उत्तर-पूर्व (ईशान) में शौचालय वह जगह है जिसके विरुद्ध वास्तु शिक्षक सबसे सख़्ती से चेताते हैं: वे ईशान को पूजा घर, पानी और घर के खुले, हल्के हिस्से के लिए रखते हैं। हमारे जाँचे किसी पुराने ग्रंथ में शौचालय की जगह नहीं बताई गई।',
  'A bathroom in the north-east is cautioned by teachers, who keep the north-east for the prayer room, water and light. No older text we could check names a place for a bathroom.': 'उत्तर-पूर्व (ईशान) में बाथरूम के विरुद्ध वास्तु शिक्षक सावधान करते हैं, जो ईशान को पूजा घर, पानी और रोशनी के लिए रखते हैं। हमारे जाँचे किसी पुराने ग्रंथ में बाथरूम की जगह नहीं बताई गई।',
  'A staircase in the north-east is cautioned by teachers: it is a heavy, enclosed element, and they keep the north-east as the lightest part of the house.': 'उत्तर-पूर्व (ईशान) में सीढ़ी के विरुद्ध वास्तु शिक्षक सावधान करते हैं: यह भारी, घिरा हुआ हिस्सा है, और वे ईशान को घर का सबसे हल्का हिस्सा रखते हैं।',
  'The north-east is where Brihat Samhita ch. 53 places a water source, and it is the favoured place in most teaching.': 'उत्तर-पूर्व (ईशान) वही जगह है जहाँ बृहत्संहिता अध्याय 53 पानी का स्रोत रखती है, और ज़्यादातर सीख में यही अनुकूल जगह है।',
  'Water in the south-east, the side teachers link to fire, is cautioned both in Brihat Samhita’s list of directions for a water source and by today’s teachers.': 'दक्षिण-पूर्व (आग्नेय) में पानी के विरुद्ध, जिस तरफ़ को वास्तु शिक्षक आग से जोड़ते हैं, बृहत्संहिता की पानी के स्रोत की दिशाओं की सूची में भी सावधानी दी गई है और आज के वास्तु शिक्षक भी सावधान करते हैं।',

  // ─── remedies
  'If the door is being moved or rebuilt anyway, shift it along the same wall to one of the favoured positions of the boundary shown above.': 'अगर दरवाज़ा वैसे भी हटाया या दोबारा बनाया जा रहा हो, तो उसे उसी दीवार पर ऊपर दिखाई गई सीमा की किसी अनुकूल स्थिति पर खिसका दीजिए।',
  'Do not move a wall, column, beam or plumbing line for Vastu without a structural engineer and the bye-law check.': 'वास्तु के लिए कोई दीवार, कॉलम, बीम या प्लंबिंग लाइन स्ट्रक्चरल इंजीनियर और बाइलॉज़ की जाँच के बिना मत हटाइए।',
  'Keep the entrance well lit, clean and clear of shoes and clutter.': 'प्रवेश को रोशन, साफ़ और जूतों व अव्यवस्था से मुक्त रखिए।',
  'Check the approach on site: a tree, a well, a pillar or the end of a road directly facing the door is cautioned in the older texts unless it stands farther away than twice the height of the house. Today’s equivalent is an electric pole.': 'मौक़े पर आगे का रास्ता देखिए: दरवाज़े के ठीक सामने पेड़, कुआँ, खंभा या सड़क का सिरा हो तो पुराने ग्रंथ उसके विरुद्ध सावधान करते हैं, जब तक वह घर की ऊँचाई से दोगुनी दूरी से ज़्यादा दूर न हो। आज के समय में इसका बराबर बिजली का खंभा है।',
  'A door that sticks, creaks or swings by itself is also cautioned. Fix the hinges.': 'जो दरवाज़ा अटकता हो, चरमराता हो या अपने आप झूलता हो, उसके विरुद्ध भी सावधानी बताई गई है। कब्ज़े ठीक करवाइए।',
  'If the wall is being rebuilt anyway, move the back door toward the south or west side.': 'अगर दीवार वैसे भी दोबारा बन रही हो, तो पिछले दरवाज़े को दक्षिण या पश्चिम की ओर खिसका दीजिए।',
  'Keep the back door closed when not in use.': 'पिछला दरवाज़ा इस्तेमाल न हो तब बंद रखिए।',
  'If the wall is being rebuilt anyway, move the side door toward the north, east or north-west side.': 'अगर दीवार वैसे भी दोबारा बन रही हो, तो बगल के दरवाज़े को उत्तर, पूर्व या उत्तर-पश्चिम (वायव्य) की ओर खिसका दीजिए।',
  'Keep the side door closed when not in use.': 'बगल का दरवाज़ा इस्तेमाल न हो तब बंद रखिए।',
  'Keep the living room on the north or east side if the plan is still open.': 'अगर नक्शा अभी खुला है तो लिविंग रूम उत्तर या पूर्व की ओर रखिए।',
  'Keep the room well lit and the middle of the room free of heavy furniture.': 'कमरे में अच्छी रोशनी रखिए और कमरे के बीच का हिस्सा भारी फ़र्नीचर से खाली रखिए।',
  'Keep the hall on the north or east side if the plan is still open.': 'अगर नक्शा अभी खुला है तो हॉल उत्तर या पूर्व की ओर रखिए।',
  'Keep the middle of the hall free of heavy furniture.': 'हॉल के बीच का हिस्सा भारी फ़र्नीचर से खाली रखिए।',
  'Keep the lobby clear and well lit.': 'लॉबी खाली और रोशन रखिए।',
  'Keep the dining space next to the kitchen if the plan is still open.': 'अगर नक्शा अभी खुला है तो खाने की जगह रसोई के बगल में रखिए।',
  'If the plan is still open, place the master bedroom in the south-west.': 'अगर नक्शा अभी खुला है तो मास्टर बेडरूम दक्षिण-पश्चिम (नैऋत्य) में रखिए।',
  'Sleep with your head to the south or east, as most teachers advise. Brihat Samhita cautions against the head to the north or west.': 'सिर दक्षिण या पूर्व की ओर करके सोइए, जैसा ज़्यादातर वास्तु शिक्षक सलाह देते हैं। बृहत्संहिता सिर उत्तर या पश्चिम की ओर रखने के विरुद्ध सावधान करती है।',
  'Keep the bedroom airy and free of clutter.': 'बेडरूम हवादार और अव्यवस्था से मुक्त रखिए।',
  'If the plan is still open, place the elders’ room in the south-west or west.': 'अगर नक्शा अभी खुला है तो बड़े-बुज़ुर्गों का कमरा दक्षिण-पश्चिम (नैऋत्य) या पश्चिम में रखिए।',
  'Place the bed so the head is to the south or east.': 'पलंग ऐसे रखिए कि सिर दक्षिण या पूर्व की ओर रहे।',
  'If the plan is still open, place the children’s room on the east, west or north-west.': 'अगर नक्शा अभी खुला है तो बच्चों का कमरा पूर्व, पश्चिम या उत्तर-पश्चिम (वायव्य) में रखिए।',
  'If the plan is still open, place the guest room on the north-west or west.': 'अगर नक्शा अभी खुला है तो मेहमानों का कमरा उत्तर-पश्चिम (वायव्य) या पश्चिम में रखिए।',
  'Keep the guest room closed and aired when not in use.': 'मेहमानों का कमरा इस्तेमाल न हो तब बंद रखिए, पर उसमें हवा आने देते रहिए।',
  'If you are re-planning anyway, move the kitchen to the south-east of the house.': 'अगर आप वैसे भी नक्शा दोबारा बना रहे हैं, तो रसोई को घर के दक्षिण-पूर्व (आग्नेय) में ले जाइए।',
  'If only the room is being re-laid, move the cooking platform to the south-east part of the kitchen.': 'अगर सिर्फ़ कमरे को दोबारा सजाया जा रहा है, तो खाना पकाने का प्लेटफ़ॉर्म रसोई के दक्षिण-पूर्व (आग्नेय) हिस्से में ले जाइए।',
  'Keep the stove and the sink apart, and the stove away from the doorway and from windows that draw a draught: a safety point on any plan.': 'चूल्हा और सिंक अलग-अलग रखिए, और चूल्हे को दरवाज़े से और हवा खींचने वाली खिड़कियों से दूर रखिए: यह हर नक्शे में सुरक्षा की बात है।',
  'Keep the kitchen clean, dry and well ventilated.': 'रसोई साफ़, सूखी और हवादार रखिए।',
  'If you are re-planning anyway, move the bathroom to the east, west or north-west side.': 'अगर आप वैसे भी नक्शा दोबारा बना रहे हैं, तो बाथरूम को पूर्व, पश्चिम या उत्तर-पश्चिम (वायव्य) की ओर ले जाइए।',
  'Keep the bathroom door closed and the room well ventilated.': 'बाथरूम का दरवाज़ा बंद और कमरा हवादार रखिए।',
  'Fix any leak at once; a damp wall next to the prayer room or kitchen is a problem on any plan.': 'कोई भी रिसाव तुरंत ठीक करवाइए; पूजा घर या रसोई के बगल की सीलन वाली दीवार हर नक्शे में समस्या है।',
  'If you are re-planning anyway, move the toilet to the north-west, west or south side.': 'अगर आप वैसे भी नक्शा दोबारा बना रहे हैं, तो शौचालय को उत्तर-पश्चिम (वायव्य), पश्चिम या दक्षिण की ओर ले जाइए।',
  'Keep the toilet door closed and the room well ventilated.': 'शौचालय का दरवाज़ा बंद और कमरा हवादार रखिए।',
  'Check that the septic line runs away from the kitchen and any drinking-water source.': 'देख लीजिए कि सेप्टिक लाइन रसोई और पीने के पानी के किसी भी स्रोत से दूर जाती है।',
  'If you are re-planning anyway, move the prayer room to the north-east.': 'अगर आप वैसे भी नक्शा दोबारा बना रहे हैं, तो पूजा घर को उत्तर-पूर्व (ईशान) में ले जाइए।',
  'Keep the prayer space clean and keep nothing else stored in it.': 'पूजा की जगह साफ़ रखिए और उसमें कुछ और मत रखिए।',
  'Many teachers advise facing east or north while praying.': 'कई वास्तु शिक्षक पूजा करते समय पूर्व या उत्तर की ओर मुँह करने की सलाह देते हैं।',
  'A small shelf or wall niche in the north-east of a living room is a lighter alternative where a separate room is not possible.': 'जहाँ अलग कमरा संभव न हो, वहाँ लिविंग रूम के उत्तर-पूर्व (ईशान) में छोटी शेल्फ़ या दीवार का आला हल्का विकल्प है।',
  'If the plan is still open, place the study on the north or east side.': 'अगर नक्शा अभी खुला है तो स्टडी उत्तर या पूर्व की ओर रखिए।',
  'If the tank is being built or replaced anyway, place it in the north-east or north of the plot.': 'अगर टंकी वैसे भी बन रही हो या बदली जा रही हो, तो उसे प्लॉट के उत्तर-पूर्व (ईशान) या उत्तर में रखिए।',
  'Keep the tank covered and clean.': 'टंकी ढकी और साफ़ रखिए।',
  'If the tank is being relocated anyway, place it on the south-west or west of the roof, over a column or beam designed for it.': 'अगर टंकी वैसे भी दूसरी जगह ले जाई जा रही हो, तो उसे छत के दक्षिण-पश्चिम (नैऋत्य) या पश्चिम में, उसी के लिए डिज़ाइन किए गए कॉलम या बीम के ऊपर रखिए।',
  'Keep the tank covered and its supports in good order.': 'टंकी ढकी रखिए और उसके सपोर्ट ठीक हालत में रखिए।',
  'If the pool is still being planned, place it on the north or east of the plot.': 'अगर पूल की योजना अभी बन रही है, तो उसे प्लॉट के उत्तर या पूर्व में रखिए।',
  'Keep the area around the pool clean and well drained.': 'पूल के आसपास की जगह साफ़ रखिए और पानी की निकासी अच्छी रखिए।',
  'If you are re-planning anyway, move the staircase to the south or west side.': 'अगर आप वैसे भी नक्शा दोबारा बना रहे हैं, तो सीढ़ी को दक्षिण या पश्चिम की ओर ले जाइए।',
  'Keep the staircase well lit and its landing clear.': 'सीढ़ी में अच्छी रोशनी रखिए और उसकी लैंडिंग खाली रखिए।',
  'Keep the area under the stairs free of a prayer space and a toilet.': 'सीढ़ी के नीचे की जगह में पूजा की जगह और शौचालय मत रखिए।',
  'Keep the lift lobby clear and well lit.': 'लिफ़्ट की लॉबी खाली और रोशन रखिए।',
  'If the plan is still open, place the store room in the south-west, west or north-west.': 'अगर नक्शा अभी खुला है तो स्टोर रूम दक्षिण-पश्चिम (नैऋत्य), पश्चिम या उत्तर-पश्चिम (वायव्य) में रखिए।',
  'Keep the store room dry and clear of clutter.': 'स्टोर रूम सूखा और अव्यवस्था से मुक्त रखिए।',
  'Keep the balcony railing sound and the floor drained.': 'बालकनी की रेलिंग मज़बूत और फ़र्श से पानी की निकासी ठीक रखिए।',
  'Teachers advise keeping more open space on the north and east of the plot and larger trees to the south and west.': 'वास्तु शिक्षक प्लॉट के उत्तर और पूर्व में ज़्यादा खुली जगह और बड़े पेड़ दक्षिण और पश्चिम में रखने की सलाह देते हैं।',
  'If the plan is still open, place parking on the south-east or north-west.': 'अगर नक्शा अभी खुला है तो पार्किंग दक्षिण-पूर्व (आग्नेय) या उत्तर-पश्चिम (वायव्य) में रखिए।',
  'Keep the parking area clear and well drained.': 'पार्किंग की जगह खाली रखिए और पानी की निकासी अच्छी रखिए।',

  // ─── dos
  'Keep the entrance well lit and clean.': 'प्रवेश में अच्छी रोशनी रखिए और उसे साफ़ रखिए।',
  'Make the main door the best-made door in the house.': 'मुख्य द्वार घर का सबसे अच्छी तरह बना दरवाज़ा होना चाहिए।',
  'Keep the kitchen clean and ventilated.': 'रसोई साफ़ और हवादार रखिए।',
  'Keep the prayer room clean and quiet.': 'पूजा घर साफ़ और शांत रखिए।',
  'Keep the room airy and uncluttered.': 'कमरा हवादार और व्यवस्थित रखिए।',
  'Sleep with your head to the south or east.': 'सिर दक्षिण या पूर्व की ओर करके सोइए।',
  'Keep it dry and ventilated.': 'इसे सूखा और हवादार रखिए।',
  'Keep it well lit.': 'इसमें अच्छी रोशनी रखिए।',
  'Keep it clear of stored items.': 'इसे रखे हुए सामान से खाली रखिए।',
  'Keep it covered.': 'इसे ढका रखिए।',
  'Keep the room well lit.': 'कमरे में अच्छी रोशनी रखिए।',

  // ─── donts
  'Do not put a dustbin or shoe stack at the front door.': 'सामने के दरवाज़े पर कूड़ेदान या जूतों का ढेर मत रखिए।',
  'Do not leave a door that creaks or swings by itself.': 'ऐसा दरवाज़ा मत रहने दीजिए जो चरमराता हो या अपने आप झूलता हो।',
  'Do not leave cooking waste to stand in the kitchen.': 'खाना पकाने का कचरा रसोई में पड़ा मत रहने दीजिए।',
  'Do not store anything else in the prayer room.': 'पूजा घर में कुछ और मत रखिए।',
  'Do not place it next to a toilet or under a staircase.': 'इसे शौचालय के बगल में या सीढ़ी के नीचे मत रखिए।',
  'Do not sleep under an exposed beam: Brihat Samhita cautions against it.': 'खुली बीम के नीचे मत सोइए: बृहत्संहिता इसके विरुद्ध सावधान करती है।',
  'Do not leave leaks unrepaired.': 'रिसाव को बिना ठीक किए मत छोड़िए।',
  'Do not place it next to the prayer room or the kitchen.': 'इसे पूजा घर या रसोई के बगल में मत रखिए।',
  'Do not store things under the stairs that block air or light.': 'सीढ़ी के नीचे ऐसा सामान मत रखिए जो हवा या रोशनी रोके।',
  'Do not build a septic tank near it.': 'इसके पास सेप्टिक टैंक मत बनाइए।',
  'Do not crowd the middle of the room with heavy furniture.': 'कमरे के बीच में भारी फ़र्नीचर की भीड़ मत लगाइए।',

  // ─── plot remedies
  'If you are building anyway and the plot allows it, complete the rectangle at that corner with the building, an open court or a boundary wall. Keep to the setbacks and boundary lines in the bye-laws.': 'अगर आप वैसे भी बना रहे हैं और प्लॉट इजाज़त देता है, तो उस कोने पर इमारत, खुले आँगन या चारदीवारी से आयत पूरा कर लीजिए। बाइलॉज़ के सेटबैक और सीमा-रेखाओं का पालन कीजिए।',
  'Keep the cut corner open and uncluttered, and do not store heavy goods there.': 'कटे हुए कोने को खुला और व्यवस्थित रखिए, और वहाँ भारी सामान मत रखिए।',
  // ─── the centre of the plan (the same sentences are joined to a room's own text, see vastu-hi.ts)
  'The centre of the plan, the Brahmasthana, is meant to stay open and light. The older texts say so in general. The list of rooms to keep out of it (toilets, kitchen, stairs, bedrooms) comes from later teachers.': 'नक्शे का केंद्र, ब्रह्मस्थान, खुला और हल्का रहना चाहिए। पुराने ग्रंथ यह आम तौर पर कहते हैं। इससे बाहर रखे जाने वाले कमरों की सूची (शौचालय, रसोई, सीढ़ी, बेडरूम) बाद के वास्तु शिक्षकों से आती है।',
  'The centre of the plan, the Brahmasthana, is meant to stay open. Brihat Samhita and Mayamata both treat it as the part to keep clear, and an open hall or court there fits that.': 'नक्शे का केंद्र, ब्रह्मस्थान, खुला रहना चाहिए। बृहत्संहिता और मयमत, दोनों इसे खाली रखने वाला हिस्सा मानते हैं, और वहाँ खुला हॉल या आँगन इसी से मेल खाता है।',
  'Teachers today would still advise against this direction, so both readings are shown and the verdict is lowered one step, to “acceptable”.': 'आज के वास्तु शिक्षक फिर भी इस दिशा के विरुद्ध सलाह देंगे, इसलिए दोनों रीडिंग दिखाई गई हैं और निर्णय एक क़दम घटाकर “ठीक” कर दिया गया है।',

  // ─── door: lines that carry no variable part
  'The names and ratings of the 32 positions come from one translation (N. Chidambaram Iyer, 1884) and have not yet been checked against a printed edition.': '32 स्थितियों के नाम और दर्जे एक ही अनुवाद (एन. चिदंबरम अय्यर, 1884) से आए हैं और छपे हुए संस्करण से अभी मिलाए नहीं गए हैं।',
  'The plot sits diagonally to the compass, so the entrance positions of the old texts cannot be read. Only the direction is rated, from today’s teaching and not from the old texts.': 'प्लॉट कंपास से तिरछा है, इसलिए पुराने ग्रंथों की प्रवेश स्थितियाँ नहीं पढ़ी जा सकतीं। सिर्फ़ दिशा को दर्जा दिया गया है, जो आज की सीख से है, पुराने ग्रंथों से नहीं।',

  // ─── the numbers inside a sentence are filled in at display time
  'Its middle is {0}° from a zone line, so a small error in north could change the reading.': 'इसका बीच का हिस्सा ज़ोन की रेखा से {0}° दूर है, इसलिए उत्तर की दिशा तय करने में छोटी-सी चूक रीडिंग बदल सकती है।',
  'The door is {0}° from a zone line, so a small error in north could change the reading.': 'दरवाज़ा ज़ोन की रेखा से {0}° दूर है, इसलिए उत्तर की दिशा तय करने में छोटी-सी चूक रीडिंग बदल सकती है।',
  'VP rules 1.0, 25 Oct 2026': 'VP नियम 1.0, 25 अक्टूबर 2026',

  // ─── the plot: titles and the sentences of each note
  'The outline is not a plain rectangle': 'आउटलाइन सादा आयत नहीं है',
  'The outline is not a plain rectangle, but no corner is cut': 'आउटलाइन सादा आयत नहीं है, पर कोई कोना कटा नहीं है',
  'Check these on site': 'इन्हें मौक़े पर देखिए',
  'The older texts prefer a square or rectangular site. Brihat Samhita also discusses a house that is missing a wing, but this check does not apply those individual rules; it only measures how much of the corner is missing.': 'पुराने ग्रंथ चौकोर या आयताकार जगह को पसंद करते हैं। बृहत्संहिता उस घर की भी चर्चा करती है जिसका एक हिस्सा (पंख) गायब हो, पर यह जाँच उन अलग-अलग नियमों को लागू नहीं करती; यह सिर्फ़ नापती है कि कोने का कितना हिस्सा गायब है।',
  'Teachers today treat a missing corner as a defect.': 'आज के वास्तु शिक्षक गायब कोने को दोष मानते हैं।',
  'Teachers today treat a missing corner as a defect, and a missing north-east corner as the one they stress most.': 'आज के वास्तु शिक्षक गायब कोने को दोष मानते हैं, और गायब उत्तर-पूर्व (ईशान) कोने को वह दोष जिस पर वे सबसे ज़्यादा ज़ोर देते हैं।',
  'This check reads the zones from the completed rectangle, as practitioners do, so the rest of the reading is not shifted by the cut.': 'यह जाँच ज़ोन को पूरे किए गए आयत से पढ़ती है, जैसा इस काम के जानकार करते हैं, इसलिए बाक़ी रीडिंग कटे हुए हिस्से से खिसकती नहीं।',
  'Brihat Samhita ch. 53 and Mayamata ch. 3 prefer a square or rectangular site and caution against irregular ones. This check reads the zones from the smallest rectangle that holds your outline.': 'बृहत्संहिता अध्याय 53 और मयमत अध्याय 3 चौकोर या आयताकार जगह को पसंद करते हैं और बेढंगी जगहों के विरुद्ध सावधान करते हैं। यह जाँच ज़ोन को उस सबसे छोटे आयत से पढ़ती है जिसमें आपकी आउटलाइन समा जाए।',
  'Brihat Samhita and Mayamata caution against anything standing directly in front of the gate: a tree, a well, a pillar or the end of a road, unless it is farther away than twice the height of the house. An electric pole is today’s equivalent. They also caution against a door that opens, closes or creaks by itself. A plan cannot show these, so look at the gate and the street in front of it.': 'बृहत्संहिता और मयमत गेट के ठीक सामने खड़ी किसी भी चीज़ के विरुद्ध सावधान करते हैं: पेड़, कुआँ, खंभा या सड़क का सिरा, जब तक वह घर की ऊँचाई से दोगुनी दूरी से ज़्यादा दूर न हो। बिजली का खंभा आज का बराबर है। वे उस दरवाज़े के विरुद्ध भी सावधान करते हैं जो अपने आप खुलता, बंद होता या चरमराता हो। नक्शा इन्हें दिखा नहीं सकता, इसलिए गेट और उसके सामने की गली को जाकर देखिए।',

  // ─── how this was read
  'North is set at {0}° clockwise from the top of your drawing. Check it on site: the north arrow on a builder’s plan is not always true north.': 'उत्तर आपकी ड्रॉइंग के ऊपरी सिरे से घड़ी की दिशा में {0}° पर रखा गया है। इसे मौक़े पर जाँच लीजिए: बिल्डर के नक्शे पर बना उत्तर का तीर हमेशा सच्चा उत्तर नहीं होता।',
  'Magnetic north differs from true north by only a few degrees across India (about 2° west to 3° east), but steel, wiring and phone sensors can throw a compass reading off by far more. Take the reading away from steel.': 'भारत भर में चुंबकीय उत्तर सच्चे उत्तर से केवल कुछ डिग्री अलग है (लगभग 2° पश्चिम से 3° पूर्व), लेकिन स्टील, वायरिंग और फ़ोन के सेंसर कंपास की रीडिंग को इससे कहीं ज़्यादा बिगाड़ सकते हैं। रीडिंग स्टील से दूर लीजिए।',
  'The compass is divided into 16 equal zones of 22.5° around the centre of the plot. That split is a modern convention. The older texts divide the boundary of the plot into 32 positions, which is how the main door is read.': 'कंपास को प्लॉट के केंद्र के चारों ओर 22.5° के 16 बराबर ज़ोन में बाँटा गया है। यह बँटवारा एक आधुनिक चलन है। पुराने ग्रंथ प्लॉट की सीमा को 32 स्थितियों में बाँटते हैं, और मुख्य द्वार इसी से पढ़ा जाता है।',
  'The centre is the centre of the smallest rectangle that holds your outline, and the Brahmasthan is the middle ninth of that rectangle.': 'केंद्र उस सबसे छोटे आयत का केंद्र है जिसमें आपकी आउटलाइन समाती है, और ब्रह्मस्थान उस आयत का बीच का नौवाँ हिस्सा है।',
  'Each room is judged by how much of its area lies in each zone, not by a single point.': 'हर कमरे को इससे आँका जाता है कि उसका कितना क्षेत्रफल किस ज़ोन में पड़ता है, किसी एक बिंदु से नहीं।',
  'The old texts speak of a house standing on its own plot. In a flat, read the door and the rooms of your flat only as a rough guide, against the flat’s own outline.': 'पुराने ग्रंथ अपने ही प्लॉट पर खड़े घर की बात करते हैं। फ़्लैट में अपने फ़्लैट के दरवाज़े और कमरों को सिर्फ़ मोटे अंदाज़े की तरह पढ़िए, फ़्लैट की अपनी आउटलाइन के हिसाब से।',
  'No rule here is a prediction. The old texts do state outcomes for some placements; this check does not repeat them, and no controlled study we could find shows that a layout affects health, wealth or relationships.': 'यहाँ का कोई भी नियम भविष्यवाणी नहीं है। पुराने ग्रंथ कुछ जगहों के नतीजे बताते हैं; यह जाँच उन्हें दोहराती नहीं, और हमें ऐसा कोई नियंत्रित अध्ययन नहीं मिला जो दिखाए कि लेआउट सेहत, धन या रिश्तों पर असर डालता है।',
  'A reading within {0}° of a zone line is marked borderline and the other reading is shown.': 'ज़ोन की रेखा से {0}° के भीतर की रीडिंग को सीमा पर माना जाता है और दूसरी रीडिंग भी दिखाई जाती है।',
}
