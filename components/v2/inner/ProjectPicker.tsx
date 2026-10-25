'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { loadProjectFromSession } from '@/lib/project-session'
import { IcArrow, IcCheck } from './kit'

// v2 look for the shared "continue a saved project?" step. The behaviour is the same as components/ui/ProjectPicker.tsx
// (which the not-yet-converted tools still use); only the markup and wording changed.

// Normalized project data shared across tools.
// num_floors = total floors including ground (G=1, G+1=2 …)
// per_floor_areas = sqft array, one entry per floor; null if not applicable
export interface SelectedProject {
  projectId:     string
  projectName:   string
  city:          string
  state:         string
  numFloors:     number | null   // normalized: total floors
  perFloorAreas: number[] | null
}

interface RawProject {
  id:              string
  project_name:    string
  city:            string
  state:           string
  num_floors:      number | null
  per_floor_areas: number[] | null
}

interface Props {
  // Called with the selected project, or null when user starts a new project.
  // Also called immediately with null if the user is not logged in or has no saved projects.
  onSelect:  (project: SelectedProject | null) => void
  toolName:  string
}

export default function ProjectPicker({ onSelect, toolName }: Props) {
  const [projects,    setProjects]    = useState<SelectedProject[]>([])
  const [loading,     setLoading]     = useState(true)
  const [selectedId,  setSelectedId]  = useState<string>('new')
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let cancelled = false

    function showLocal() {
      const local = loadProjectFromSession()
      if (!cancelled) {
        if (local) {
          setProjects([{
            projectId:     local.projectId,
            projectName:   local.projectName,
            city:          local.city,
            state:         local.state,
            numFloors:     local.numFloors,
            perFloorAreas: local.perFloorAreas,
          }])
          setLoading(false)
        } else {
          onSelect(null)
        }
      }
    }

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()

      // Non-auth users: no DB access possible, fall back to localStorage
      if (!user) { showLocal(); return }

      try {
        const res = await fetch('/api/projects')
        if (!res.ok) throw new Error('fetch failed')
        const json = await res.json()
        const list: SelectedProject[] = (json.projects ?? [] as RawProject[]).map((p: RawProject) => ({
          projectId:     p.id,
          projectName:   p.project_name,
          city:          p.city,
          state:         p.state,
          numFloors:     p.num_floors ?? null,
          perFloorAreas: p.per_floor_areas ?? null,
        }))
        if (!cancelled) {
          if (list.length === 0) {
            showLocal()
          } else {
            setProjects(list)
            setLoading(false)
          }
        }
      } catch {
        if (!cancelled) showLocal()
      }
    }

    load()
    return () => { cancelled = true }
  }, [supabase, onSelect])

  function handleContinue() {
    if (selectedId === 'new') {
      onSelect(null)
    } else {
      const p = projects.find(pr => pr.projectId === selectedId)
      onSelect(p ?? null)
    }
  }

  if (loading) {
    return (
      <div className="ns-plate ns-i-card">
        <div className="ns-i-loading" role="status"><span className="ns-i-spin" />Checking for saved projects…</div>
      </div>
    )
  }

  const selected = projects.find(p => p.projectId === selectedId)
  const floorsLabel = (n: number | null) => (n ? (n === 1 ? 'Ground only' : `Ground + ${n - 1}`) : '—')

  return (
    <div className="ns-plate ns-i-card">
      <p className="ns-i-card__eyebrow">{toolName} · Continue or start new</p>
      <h2>Continue an existing project?</h2>
      <p className="ns-i-card__sub">We found saved projects on your account. Pick one and we fill in the form for you, or start fresh.</p>

      <fieldset className="ns-i-choices ns-i-card__body">
        <legend className="ns-sr">Choose a project</legend>
        {projects.map(p => (
          <label key={p.projectId} className="ns-i-choice">
            <input
              type="radio"
              name="project_select"
              value={p.projectId}
              checked={selectedId === p.projectId}
              onChange={() => setSelectedId(p.projectId)}
            />
            <span>
              <span className="ns-i-choice__t">{p.projectName}</span>
              <span className="ns-i-choice__d">{p.city}, {p.state}{p.numFloors ? ` · ${floorsLabel(p.numFloors)}` : ''}</span>
            </span>
          </label>
        ))}

        <label className="ns-i-choice ns-i-choice--new">
          <input
            type="radio"
            name="project_select"
            value="new"
            checked={selectedId === 'new'}
            onChange={() => setSelectedId('new')}
          />
          <span>
            <span className="ns-i-choice__t">Start a new project</span>
            <span className="ns-i-choice__d">Enter everything fresh. A new project is saved for you.</span>
          </span>
        </label>
      </fieldset>

      {selected && selectedId !== 'new' && (
        <div className="ns-i-prefill">
          <p className="ns-i-prefill__t"><IcCheck width={18} height={18} />These fill in for you on the next steps</p>
          <dl>
            <div><dt>Project name</dt><dd>{selected.projectName}</dd></div>
            <div><dt>City</dt><dd>{selected.city}</dd></div>
            <div><dt>State</dt><dd>{selected.state}</dd></div>
            <div><dt>Floors</dt><dd>{floorsLabel(selected.numFloors)}</dd></div>
          </dl>
          <p className="ns-i-fine" style={{ marginTop: 10 }}>You can change any of these. Questions about the structure itself, like concrete grade and wall type, are always asked fresh.</p>
        </div>
      )}

      <div className="ns-i-card__foot">
        <button type="button" onClick={handleContinue} className="ns-btn">
          {selectedId === 'new' ? 'Start a new project' : `Continue “${selected?.projectName}”`}
          <IcArrow width={22} height={11} />
        </button>
      </div>
    </div>
  )
}
