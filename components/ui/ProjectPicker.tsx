'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

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

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { if (!cancelled) onSelect(null); return }

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
            onSelect(null)
          } else {
            setProjects(list)
            setLoading(false)
          }
        }
      } catch {
        if (!cancelled) onSelect(null)
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
      <div className="flex items-center justify-center min-h-[200px]">
        <span style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 13, color: 'rgba(30,34,39,0.4)' }}>
          Checking saved projects…
        </span>
      </div>
    )
  }

  const selected = projects.find(p => p.projectId === selectedId)

  return (
    <div className="w-full bg-sheet-white px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <p
          style={{
            fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: '#1F4E79',
            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6,
          }}
        >
          {toolName} · CONTINUE OR START
        </p>
        <h2 style={{ fontFamily: 'var(--font-plex-serif)', fontSize: 28, fontWeight: 700, color: '#1E2227', lineHeight: 1.2 }}>
          Continue an existing project?
        </h2>
        <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 15, color: 'rgba(30,34,39,0.55)', marginTop: 6 }}>
          We found saved projects on your account. Pick one to pre-fill the form, or start fresh.
        </p>
      </div>

      {/* Picker card */}
      <div className="border border-iron-ink rounded-[2px] bg-sheet-white">
        <div className="border-b border-iron-ink px-5 py-3">
          <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            STEP 01b · SELECT PROJECT
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Project list */}
          <div className="space-y-2">
            {projects.map(p => (
              <label
                key={p.projectId}
                className="flex items-start gap-3 p-4 rounded-[2px] cursor-pointer transition-all"
                style={{
                  border: selectedId === p.projectId ? '1.5px solid #1F4E79' : '1px solid rgba(30,34,39,0.18)',
                  background: selectedId === p.projectId ? 'rgba(31,78,121,0.04)' : 'white',
                }}
              >
                <input
                  type="radio"
                  name="project_select"
                  value={p.projectId}
                  checked={selectedId === p.projectId}
                  onChange={() => setSelectedId(p.projectId)}
                  style={{ accentColor: '#1F4E79', marginTop: 2 }}
                />
                <div className="min-w-0">
                  <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, fontWeight: 600, color: '#1E2227' }}>
                    {p.projectName}
                  </p>
                  <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 11, color: 'rgba(30,34,39,0.55)', marginTop: 2 }}>
                    {p.city}, {p.state}
                    {p.numFloors ? ` · ${p.numFloors === 1 ? 'G' : `G+${p.numFloors - 1}`}` : ''}
                  </p>
                </div>
              </label>
            ))}

            {/* New project option */}
            <label
              className="flex items-start gap-3 p-4 rounded-[2px] cursor-pointer transition-all"
              style={{
                border: selectedId === 'new' ? '1.5px solid #8C3A22' : '1px solid rgba(30,34,39,0.18)',
                background: selectedId === 'new' ? 'rgba(140,58,34,0.03)' : 'white',
              }}
            >
              <input
                type="radio"
                name="project_select"
                value="new"
                checked={selectedId === 'new'}
                onChange={() => setSelectedId('new')}
                style={{ accentColor: '#8C3A22', marginTop: 2 }}
              />
              <div>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 14, fontWeight: 600, color: '#1E2227' }}>
                  Start a new project
                </p>
                <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 12, color: 'rgba(30,34,39,0.5)', marginTop: 2 }}>
                  Enter all details fresh — a new project row will be created
                </p>
              </div>
            </label>
          </div>

          {/* Pre-fill preview when a project is selected */}
          {selected && selectedId !== 'new' && (
            <div
              className="p-4 rounded-[2px]"
              style={{ background: 'rgba(20,83,45,0.05)', border: '1px solid rgba(20,83,45,0.2)' }}
            >
              <p style={{ fontFamily: 'var(--font-plex-mono)', fontSize: 10, color: '#14532D', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                ✓ WILL PRE-FILL INTO BUILD DETAILS
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[12px]">
                {[
                  ['Project Name', selected.projectName],
                  ['City', selected.city],
                  ['State', selected.state],
                  ['Floors', selected.numFloors ? (selected.numFloors === 1 ? 'G (Ground only)' : `G+${selected.numFloors - 1}`) : '—'],
                ].map(([label, val]) => (
                  <div key={label} className="flex gap-2">
                    <span style={{ fontFamily: 'var(--font-plex-mono)', color: 'rgba(30,34,39,0.5)', minWidth: 80 }}>{label}:</span>
                    <span style={{ fontFamily: 'var(--font-plex-sans)', color: '#1E2227', fontWeight: 500 }}>{val}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: 'var(--font-plex-sans)', fontSize: 11, color: 'rgba(30,34,39,0.45)', marginTop: 8 }}>
                All pre-filled fields remain editable. Tool-specific settings (concrete grade, wall type, etc.) are always asked fresh.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-iron-ink px-5 py-4">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full py-3 rounded-[6px] text-[14px] font-semibold text-white"
            style={{ background: selectedId === 'new' ? '#8C3A22' : '#1F4E79', fontFamily: 'var(--font-plex-sans)' }}
          >
            {selectedId === 'new' ? 'Start New Project →' : `Continue "${selected?.projectName}" →`}
          </button>
        </div>
      </div>
    </div>
  )
}
