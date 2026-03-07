'use client'

import { useState } from 'react'
import { createOpdracht, updateOpdracht } from '@/lib/actions/admin'

interface Props {
  initial?: {
    id: string
    title: string
    description: string
    example_media_url: string | null
  }
  onCancel?: () => void
}

export default function OpdrachtForm({ initial, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [mediaUrl, setMediaUrl] = useState(initial?.example_media_url || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      title: title.trim(),
      description: description.trim(),
      example_media_url: mediaUrl.trim() || null,
    }

    const result = initial
      ? await updateOpdracht(initial.id, data)
      : await createOpdracht(data)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (!initial) {
      setTitle('')
      setDescription('')
      setMediaUrl('')
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
        <label className="block text-slate-300 text-sm font-medium mb-1">Titel</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
          placeholder="Naam van de opdracht"
        />
      </div>

      <div>
        <label className="block text-slate-300 text-sm font-medium mb-1">Beschrijving</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 resize-none"
          placeholder="Wat moeten de spelers doen?"
        />
      </div>

      <div>
        <label className="block text-slate-300 text-sm font-medium mb-1">
          Voorbeeld media URL (optioneel)
        </label>
        <input
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
          placeholder="https://..."
        />
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
