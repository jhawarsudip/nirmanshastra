import type { Copy } from '@/lib/i18n/copy'
import type { LayerKey } from './structure-colors'

/* Words around the StructurePro 3D model (controls, legend, hints, captions, the plan shown when 3D cannot start), in English and Hindi. */

const en = {
  loading: 'Setting up your 3D model…',
  views: { '3d': '3D', plan: 'Plan', front: 'Side' } as Record<string, string>,
  viewAria: 'View',
  desc: (cols: number, beams: number, slabs: number, balconies: number, storeys: number, L: string, W: string) =>
    `3D model of the frame: ${cols} column pieces, ${beams} beam pieces and ${slabs} slab panels${balconies ? `, ${balconies} balconies` : ''} over ${storeys} ${storeys === 1 ? 'floor' : 'floors'}, ${L} m by ${W} m. The ground floor is laid on filled earth, so it has no structural slab.`,
  tagNominal: 'Typical member sizes',
  tagDesigned: 'Designed member sizes',
  hintTouch: 'Swipe sideways to turn · pinch to zoom',
  hintMouse: 'Drag to turn · click, then scroll to zoom',
  replay: 'Replay the build-up',
  pause: 'Pause turning',
  turn: 'Turn slowly',
  layersSr: 'Show or hide parts of the structure',
  layers: {
    foundation: { label: 'Foundation', note: 'Footings or raft, and the plinth beams' },
    ground: { label: 'Ground floor', note: 'Laid on filled earth inside the plinth beams. Not a structural slab, so it is not counted in this report' },
    columns: { label: 'Columns', note: 'Carry the load down to the footings' },
    beams: { label: 'Beams', note: 'Carry the slabs to the columns' },
    slabs: { label: 'Slabs', note: 'Floors and the roof' },
    balconies: { label: 'Balconies', note: 'Slabs that stick out beyond the walls, held only at the building edge' },
    stair: { label: 'Staircase', note: 'Dog-legged stair and the head-room on the roof' },
  } as Record<LayerKey, { label: string; note: string }>,
  capNominal: 'Your real column grid, floors and stair, drawn with typical member sizes. The designed sizes are in the full report.',
  capDesigned: 'Your frame as designed for this report: every column, beam, slab and footing at its designed size.',
  capGround: 'The grey plate at the bottom is the ground floor, laid on filled earth inside the plinth beams. It is not a structural slab and is not counted in this report.',
  // the plan drawing shown when 3D cannot start
  stair: 'Stair',
  planAria: (L: string, W: string, cols: number, storeys: number) => `Plan of the frame: ${L} m by ${W} m, ${cols} columns on the ground floor, ${storeys} ${storeys === 1 ? 'floor' : 'floors'}.`,
  planNoLoad: 'The 3D view did not load.',
  planNoStart: 'The 3D view could not start on this device.',
  planWhat: ' This is the plan of your frame: footings (light), plinth and floor beams, columns (dark), and the stair well.',
  planRetry: 'Try the 3D view again',
  // the older massing preview (not on the StructurePro page today)
  massingFailLine: "3D preview couldn't load on this device — your report data is unaffected",
  massingLoading: 'LOADING 3D SCENE…',
}

const hi: typeof en = {
  loading: 'आपका 3D मॉडल तैयार हो रहा है…',
  views: { '3d': '3D', plan: 'नक्शा', front: 'बगल' },
  viewAria: 'दृश्य',
  desc: (cols, beams, slabs, balconies, storeys, L, W) =>
    `ढाँचे का 3D मॉडल: ${storeys} मंज़िल${storeys === 1 ? '' : 'ें'} पर ${cols} कॉलम, ${beams} बीम और ${slabs} स्लैब पैनल${balconies ? `, ${balconies} बालकनी` : ''}, ${L} m गुणा ${W} m। ग्राउंड फ़्लोर भरी हुई मिट्टी पर बिछी है, इसलिए उसमें ढाँचे की स्लैब नहीं है।`,
  tagNominal: 'सामान्य साइज़ के हिस्से',
  tagDesigned: 'डिज़ाइन किए गए साइज़ के हिस्से',
  hintTouch: 'घुमाने के लिए बगल में स्वाइप कीजिए · ज़ूम के लिए पिंच कीजिए',
  hintMouse: 'घुमाने के लिए खींचिए · ज़ूम के लिए क्लिक करके स्क्रॉल कीजिए',
  replay: 'बनने का क्रम फिर चलाइए',
  pause: 'घूमना रोकिए',
  turn: 'धीरे-धीरे घुमाइए',
  layersSr: 'ढाँचे के हिस्से दिखाइए या छिपाइए',
  layers: {
    foundation: { label: 'नींव', note: 'फुटिंग या रैफ़्ट, और प्लिंथ बीम' },
    ground: { label: 'ग्राउंड फ़्लोर', note: 'प्लिंथ बीम के भीतर भरी हुई मिट्टी पर बिछी। यह ढाँचे की स्लैब नहीं है, इसलिए इस रिपोर्ट में नहीं गिनी गई' },
    columns: { label: 'कॉलम', note: 'भार को नीचे फुटिंग तक पहुँचाते हैं' },
    beams: { label: 'बीम', note: 'स्लैब का भार कॉलम तक पहुँचाते हैं' },
    slabs: { label: 'स्लैब', note: 'फ़र्श और छत' },
    balconies: { label: 'बालकनी', note: 'दीवारों से बाहर निकली स्लैब, जो सिर्फ़ इमारत के किनारे पर थमी होती हैं' },
    stair: { label: 'सीढ़ी', note: 'डॉग-लेग्ड सीढ़ी और छत पर हेड-रूम' },
  },
  capNominal: 'आपका असली कॉलम ग्रिड, मंज़िलें और सीढ़ी, सामान्य साइज़ के हिस्सों के साथ बनाए गए हैं। डिज़ाइन किए गए साइज़ पूरी रिपोर्ट में हैं।',
  capDesigned: 'इस रिपोर्ट के लिए डिज़ाइन किया गया आपका ढाँचा: हर कॉलम, बीम, स्लैब और फुटिंग अपने डिज़ाइन किए साइज़ में।',
  capGround: 'सबसे नीचे की स्लेटी पट्टी ग्राउंड फ़्लोर है, जो प्लिंथ बीम के भीतर भरी हुई मिट्टी पर बिछी है। यह ढाँचे की स्लैब नहीं है और इस रिपोर्ट में नहीं गिनी गई है।',
  stair: 'सीढ़ी',
  planAria: (L, W, cols, storeys) => `ढाँचे का नक्शा: ${L} m गुणा ${W} m, ग्राउंड फ़्लोर पर ${cols} कॉलम, ${storeys} मंज़िल${storeys === 1 ? '' : 'ें'}।`,
  planNoLoad: '3D दृश्य लोड नहीं हुआ।',
  planNoStart: 'इस डिवाइस पर 3D दृश्य शुरू नहीं हो सका।',
  planWhat: ' यह आपके ढाँचे का नक्शा है: फुटिंग (हल्के रंग में), प्लिंथ और फ़्लोर बीम, कॉलम (गहरे रंग में), और सीढ़ी की जगह।',
  planRetry: '3D दृश्य फिर से आज़माइए',
  massingFailLine: 'इस डिवाइस पर 3D प्रीव्यू लोड नहीं हो सका — आपकी रिपोर्ट का डेटा सुरक्षित है',
  massingLoading: '3D दृश्य लोड हो रहा है…',
}

export const COPY: Copy<typeof en> = { en, hi }
