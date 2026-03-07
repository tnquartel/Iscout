'use client'

import { useState } from 'react'
import { updateGameState, resetGame } from '@/lib/actions/game'
import { useRouter } from 'next/navigation'

interface Props {
  initialCredits: number
  initialPoints: number
}

export default function InstellingenForm({ initialCredits, initialPoints }: Props) {
  const [credits, setCredits] = useState(initialCredits)
  const [points, setPoints] = useState(initialPoints)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    await updateGameState(credits, points)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  async function handleReset() {
    const confirmed = confirm(
      'Weet je zeker dat je het spel wilt resetten? Dit verwijdert alle inzendingen en gespeelde vragen en zet credits en punten op 0.'
    )
    if (!confirmed) return

    setResetting(true)
    await resetGame()
    setCredits(0)
    setPoints(0)
    setResetting(false)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Game state aanpassen */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Credits & Punten aanpassen</h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Credits</label>
              <input
                type="number"
                value={credits}
                onChange={(e) => setCredits(parseInt(e.target.value) || 0)}
                min={0}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Punten</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                min={0}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-yellow-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="self-start bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold px-6 py-2.5 rounded-xl disabled:opacity-50"
          >
            {saving ? 'Opslaan...' : saved ? 'Opgeslagen ✓' : 'Opslaan'}
          </button>
        </form>
      </div>

      {/* Reset */}
      <div className="bg-slate-800 border border-red-900 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-2">Gevaarzone</h2>
        <p className="text-slate-400 text-sm mb-4">
          Reset het volledige spel: credits en punten worden 0, alle inzendingen en gespeelde vragen worden verwijderd.
        </p>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="bg-red-700 hover:bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-50"
        >
          {resetting ? 'Resetten...' : 'Spel resetten'}
        </button>
      </div>
    </div>
  )
}
