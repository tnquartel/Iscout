'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { createVraag, updateVraag } from '@/lib/actions/admin'

const PreviewMap = dynamic(() => import('./PreviewMap'), {
  ssr: false,
  loading: () => <div className="h-40 bg-slate-700 rounded-xl animate-pulse" />,
})

interface Props {
  initial?: {
    id: string
    name: string
    hint: string
    lat: number
    lng: number
    radius_km: number
    cost_credits: number
    points_awarded: number
  }
  onCancel?: () => void
}

export default function VraagForm({ initial, onCancel }: Props) {
  const [name, setName] = useState(initial?.name || '')
  const [hint, setHint] = useState(initial?.hint || '')
  const [lat, setLat] = useState(initial?.lat?.toString() || '')
  const [lng, setLng] = useState(initial?.lng?.toString() || '')
  const [radius, setRadius] = useState(initial?.radius_km?.toString() || '50')
  const [cost, setCost] = useState(initial?.cost_credits?.toString() || '10')
  const [points, setPoints] = useState(initial?.points_awarded?.toString() || '1')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedLat = parseFloat(lat)
  const parsedLng = parseFloat(lng)
  const showPreview = !isNaN(parsedLat) && !isNaN(parsedLng)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      name: name.trim(),
      hint: hint.trim(),
      lat: parsedLat,
      lng: parsedLng,
      radius_km: parseFloat(radius),
      cost_credits: parseInt(cost),
      points_awarded: parseInt(points),
    }

    const result = initial
      ? await updateVraag(initial.id, data)
      : await createVraag(data)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (!initial) {
      setName('')
      setHint('')
      setLat('')
      setLng('')
      setRadius('50')
      setCost('10')
      setPoints('1')
    }
    onCancel?.()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2">{error}</div>
      )}

      <div>
        <label className="block text-slate-300 text-sm font-medium mb-1">Naam (zichtbaar in lijst)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
          placeholder="Bijv. Parijs, Eiffeltoren"
        />
      </div>

      <div>
        <label className="block text-slate-300 text-sm font-medium mb-1">Hint</label>
        <textarea
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          required
          rows={3}
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 resize-none"
          placeholder="Tekst of URL naar afbeelding/video"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1">Breedtegraad (lat)</label>
          <input
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            required
            type="number"
            step="any"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
            placeholder="48.8566"
          />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1">Lengtegraad (lng)</label>
          <input
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            required
            type="number"
            step="any"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
            placeholder="2.3522"
          />
        </div>
      </div>

      {/* Preview map */}
      {showPreview && (
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1">Locatie preview</label>
          <div className="h-40 rounded-xl overflow-hidden border border-slate-600">
            <PreviewMap lat={parsedLat} lng={parsedLng} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1">Radius (km)</label>
          <input
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            required
            type="number"
            min={1}
            step="any"
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
          />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1">Kosten (credits)</label>
          <input
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            required
            type="number"
            min={0}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
          />
        </div>
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-1">Punten</label>
          <input
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            required
            type="number"
            min={0}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50"
        >
          {loading ? 'Opslaan...' : initial ? 'Opslaan' : 'Toevoegen'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl text-sm"
          >
            Annuleren
          </button>
        )}
      </div>
    </form>
  )
}
