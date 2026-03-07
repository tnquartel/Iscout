'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleOpdracht, deleteOpdracht } from '@/lib/actions/admin'
import OpdrachtForm from './OpdrachtForm'

interface Props {
  opdracht: any
}

export default function OpdrachtRow({ opdracht }: Props) {
  const [editing, setEditing] = useState(false)
  const [active, setActive] = useState(opdracht.is_active)
  const router = useRouter()

  async function toggleActive() {
    const newVal = !active
    await toggleOpdracht(opdracht.id, newVal)
    setActive(newVal)
  }

  async function handleDelete() {
    if (!confirm(`Opdracht "${opdracht.title}" verwijderen?`)) return
    await deleteOpdracht(opdracht.id)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="bg-slate-800 border border-yellow-500 rounded-xl p-5">
        <OpdrachtForm initial={opdracht} onCancel={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div className={`bg-slate-800 border rounded-xl p-4 flex items-start justify-between gap-4 ${active ? 'border-slate-700' : 'border-slate-700 opacity-60'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-white">{opdracht.title}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${active ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-400'}`}>
            {active ? 'Actief' : 'Inactief'}
          </span>
        </div>
        <p className="text-slate-400 text-sm line-clamp-2">{opdracht.description}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleActive}
          className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-slate-700"
        >
          {active ? 'Deactiveren' : 'Activeren'}
        </button>
        <button
          onClick={() => setEditing(true)}
          className="text-slate-400 hover:text-white text-sm px-2 py-1 rounded-lg hover:bg-slate-700"
        >
          Bewerken
        </button>
        <button
          onClick={handleDelete}
          className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded-lg hover:bg-red-900/20"
        >
          Verwijderen
        </button>
      </div>
    </div>
  )
}
