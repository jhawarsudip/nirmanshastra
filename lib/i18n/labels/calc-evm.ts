import type { Dict } from '@/lib/i18n/tr'

/** Hindi for the 2 x 2 SPI/CPI readings that evm-engine.ts (readQuadrant) sends to the Earned Value Calculator. */
export const EVM_DICT: Dict = {
  'Not enough to read yet': 'पढ़ने के लिए अभी काफ़ी नहीं',
  'Both a Planned Value and an Actual Cost are needed to place the project on the schedule × cost grid. Enter non-zero PV and AC to read the quadrant.':
    'प्रोजेक्ट को शेड्यूल × कॉस्ट ग्रिड पर रखने के लिए प्लान्ड वैल्यू और असल लागत दोनों चाहिए। यह देखने के लिए कि प्रोजेक्ट किस खाने में है, शून्य से अलग PV और AC डालिए।',

  'Ahead / on schedule and on budget': 'शेड्यूल से आगे / शेड्यूल पर और बजट में',
  'SPI ≥ 1 and CPI ≥ 1 — the best quadrant. You have earned at least as much value as was planned by now, and spent no more than that value cost. The project is both on time and on cost.':
    'SPI ≥ 1 और CPI ≥ 1 — सबसे अच्छा खाना। आपने अब तक कम से कम उतनी वैल्यू अर्न की है जितनी प्लान थी, और उस वैल्यू की लागत से ज़्यादा ख़र्च नहीं किया। प्रोजेक्ट समय पर भी है और लागत में भी।',

  'On time but over cost': 'समय पर, पर लागत से ऊपर',
  'SPI ≥ 1 but CPI < 1 — progress is on or ahead of schedule, but each rupee of earned value is costing more than budgeted. The slip is in money, not time: watch the cost run, not the calendar.':
    'SPI ≥ 1 पर CPI < 1 — प्रोग्रेस शेड्यूल पर या आगे है, पर अर्न की गई वैल्यू का हर रुपया बजट से ज़्यादा में पड़ रहा है। चूक पैसे में है, समय में नहीं: कैलेंडर नहीं, लागत की दौड़ पर नज़र रखिए।',

  'Behind schedule but under cost': 'शेड्यूल से पीछे, पर लागत के भीतर',
  'SPI < 1 but CPI ≥ 1 — spending is efficient, but less value has been earned than planned by now. The project is running slow, not expensive: the risk is the schedule, and any liquidated-damages exposure with it.':
    'SPI < 1 पर CPI ≥ 1 — ख़र्च कुशल है, पर अब तक प्लान से कम वैल्यू अर्न हुई है। प्रोजेक्ट धीमा चल रहा है, महँगा नहीं: जोखिम शेड्यूल का है, और उसके साथ लिक्विडेटेड डैमेजेज़ के जोखिम का।',

  'Behind schedule and over cost': 'शेड्यूल से पीछे और लागत से ऊपर',
  'SPI < 1 and CPI < 1 — the worst quadrant. Less value earned than planned, and what has been earned cost more than budgeted. The project is both late and over budget; this is where recovery action is most urgent.':
    'SPI < 1 और CPI < 1 — सबसे बुरा खाना। प्लान से कम वैल्यू अर्न हुई, और जो अर्न हुई वह बजट से ज़्यादा में पड़ी। प्रोजेक्ट देर से भी है और बजट से ऊपर भी; यहाँ भरपाई की कार्रवाई सबसे ज़रूरी है।',
}
