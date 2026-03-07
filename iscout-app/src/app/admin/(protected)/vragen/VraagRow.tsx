'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleVraag, deleteVraag } from '@/lib/actions/admin'
import VraagForm from './VraagForm'

interface Props {
  vraag: any
}

export default function VraagRow({ vraag }: Props) {
  const [editing, setEditing] = useState(false)
  const [active, setActive] = useState(vraag.is_active)
  const router = useRouter()

  async function toggleActive() {
    const newVal = !active
    await toggleVraag(vraag.id, newVal)
    setActive(newVal)
  }

  async function handleDelete() {
    if (!confirm(`Vraag "${vraag.name}" verwijderen?`)) return
    await deleteVraag(vraag.id)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="bg-slate-800 border border-yellow-500 rounded-xl p-5">
        <VraagForm initial={vraag} onCancel={() => setEditing(false)} />
      </div>
    )
  }

  return (
    <div className={`bg-slate-800 border rounded-xl p-4 flex items-start justify-between gap-4 ${active ? 'border-slate-700' : 'border-slate-700 opacity-60'}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-white">{vraag.name}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${active ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-400'}`}>
            {active ? 'Actief' : 'Inactief'}
          </span>
        </div>
        <p className="text-slate-400 text-xs">
          {vraag.cost_credits} credits · {vraag.points_awarded} punt(en) · radius {vraag.radius_km} km
        </p>
        <p className="text-slate-500 text-xs mt-1">
          Coördinaten: {vraag.lat}, {vraag.lng}
        </p>
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
