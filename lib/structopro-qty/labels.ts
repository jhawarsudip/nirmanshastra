// Small, pure helpers shared by the results page and the PDF so the two never word things differently.

const ORD = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth']

/** "G", "G+1", "G+2" ... from the number of floors above ground. */
export const buildingLabel = (floors: number): string => (floors <= 1 ? 'G' : `G+${floors - 1}`)

/** With an open parking level the listed floors stand on it: "Stilt + 2 floors". */
export const buildingLabelStilt = (floors: number, stilt: boolean): string => (stilt ? `Stilt + ${floors} floor${floors === 1 ? '' : 's'}` : buildingLabel(floors))

/** Columns: the storey they stand in. Storey 0 is the ground floor, or the open parking level when `stilt`. */
export const storeyLabel = (k: number, stilt = false): string => (k === 0 ? (stilt ? 'Open parking level' : 'Ground floor') : `${ORD[k - 1] ?? `Floor ${k}`} floor`)

/** Beams: the slab level they carry. Level 0 carries the first-floor slab; the last level is the roof. */
export const beamLevelLabel = (k: number, storeys: number): string => (k >= storeys - 1 ? 'Roof' : `${ORD[k] ?? `Floor ${k + 1}`} floor`)

/** Mass per metre of a plain round bar, kg/m (IS 1786: d squared over 162.2). */
export const barKgPerM = (phiMm: number): number => (phiMm * phiMm) / 162.2

/** 6 mm bar is bought as a coil and cut and bent on site; every larger size comes as 12 m lengths (IS 1786 allows coils up to 12 mm, house practice is 6 mm). */
export const isCoil = (phiMm: number): boolean => phiMm <= 6

/** Whole 12 m lengths needed to supply `kg` of a bar of diameter `phiMm`. A coil is not counted in lengths: 0. */
export const bars12m = (phiMm: number, kg: number): number => (isCoil(phiMm) ? 0 : Math.ceil(kg / (barKgPerM(phiMm) * 12)))

/** Percent below and above the point value that an uncertainty band covers. */
export const bandBelowPct = (b: [number, number]): number => Math.round((1 - b[0]) * 100)
export const bandAbovePct = (b: [number, number]): number => Math.round((b[1] - 1) * 100)

/** Indian digit grouping (12,34,567). */
export const fmtIN = (v: number, d = 0): string => v.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d })
