// Cross-tool project continuity via localStorage.
// Used for both non-auth users (DB write returns 401, so only localStorage works)
// and auth users (localStorage bridges the gap before the DB table is queried).

export interface LocalProject {
  projectId:     string       // DB UUID if auth user, '' if not yet persisted
  projectName:   string
  city:          string
  state:         string
  numFloors:     number | null  // normalized: total floors incl. ground (G=1, G+1=2 …)
  perFloorAreas: number[] | null
}

const KEY = 'ns_current_project'
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

export function saveProjectToSession(project: LocalProject): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...project, savedAt: Date.now() }))
  } catch { /* ignore quota errors */ }
}

export function loadProjectFromSession(): LocalProject | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Record<string, unknown>
    if (!data.projectName || !data.city || !data.state) return null
    if (typeof data.savedAt === 'number' && Date.now() - data.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(KEY)
      return null
    }
    return {
      projectId:     typeof data.projectId === 'string' ? data.projectId : '',
      projectName:   String(data.projectName),
      city:          String(data.city),
      state:         String(data.state),
      numFloors:     typeof data.numFloors === 'number' ? data.numFloors : null,
      perFloorAreas: Array.isArray(data.perFloorAreas) ? (data.perFloorAreas as number[]) : null,
    }
  } catch { return null }
}
