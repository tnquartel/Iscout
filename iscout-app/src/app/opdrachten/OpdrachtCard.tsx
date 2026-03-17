'use client'

import { useState } from 'react'
import { submitDoeOpdracht } from '@/lib/actions/game'
import type { DoeOpdracht, DoeInzending } from '@/lib/types'

interface Props {
  opdracht: DoeOpdracht
  inzending: DoeInzending | null
}

function StatusBadge({ status }: { status: DoeInzending['status'] | null }) {
  if (!status) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-900 text-blue-300">
        Beschikbaar
      </span>
    )
  }
  if (status === 'pending') {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-900 text-orange-300">
        In behandeling
      </span>
    )
  }
  if (status === 'approved') {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-900 text-green-300">
        Goedgekeurd ✓
      </span>
    )
  }
  return (
    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-900 text-red-300">
      Afgekeurd
    </span>
  )
}

function isMediaUrl(url: string): { type: 'image' | 'video' | 'other'; url: string } {
  const lower = url.toLowerCase()
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/.test(lower)) return { type: 'video', url }
  if (/\.(jpg|jpeg|png|gif|webp|avif)(\?.*)?$/.test(lower)) return { type: 'image', url }
  return { type: 'other', url }
}

export default function OpdrachtCard({ opdracht, inzending }: Props) {
  const [loading, setLoading] = useState(false)
  const [localInzending, setLocalInzending] = useState(inzending)
  const [expanded, setExpanded] = useState(false)

  const status = localInzending?.status || null
  const isApproved = status === 'approved'
  const isPending = status === 'pending'
  const canSubmit = !isPending && !isApproved

  async function handleSubmit() {
    setLoading(true)
    const result = await submitDoeOpdracht(opdracht.id)
    if (!result.error) {
      setLocalInzending({
        id: 'temp',
        opdracht_id: opdracht.id,
        status: 'pending',
        credits_awarded: null,
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
        note: null,
      })
    }
    setLoading(false)
  }

  return (
    <div
      className={`rounded-xl border transition-all ${
        isApproved
          ? 'bg-slate-800/50 border-slate-700 opacity-60'
          : 'bg-slate-800 border-slate-700'
      }`}
    >
      {/* Header — altijd zichtbaar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 p-5 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-lg font-bold text-white truncate">{opdracht.title}</h2>
          <StatusBadge status={status} />
        </div>
        <span
          className={`text-slate-400 text-xl flex-shrink-0 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        >
          ▾
        </span>
      </button>

      {/* Uitklapbaar deel */}
      {expanded && (
        <div className="px-5 pb-5">
          <p className="text-slate-300 text-sm mb-4">{opdracht.description}</p>

          {/* Example media */}
          {opdracht.example_media_url && (() => {
            const media = isMediaUrl(opdracht.example_media_url)
            if (media.type === 'image') {
              return (
                <img
                  src={media.url}
                  alt="Voorbeeld"
                  className="rounded-lg mb-4 max-h-48 object-cover w-full"
                />
              )
            }
            if (media.type === 'video') {
              return (
                <video
                  src={media.url}
                  controls
                  className="rounded-lg mb-4 max-h-48 w-full"
                />
              )
            }
            return (
              <a
                href={media.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mb-4 text-yellow-400 underline break-all hover:text-yellow-300 text-sm"
              >
                {media.url}
              </a>
            )
          })()}

          {/* Rejection note */}
          {status === 'rejected' && localInzending?.note && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 text-sm text-red-300 mb-4">
              <strong>Reden afkeuring:</strong> {localInzending.note}
            </div>
          )}

          {/* Credits awarded */}
          {status === 'approved' && localInzending?.credits_awarded != null && (
            <div className="text-green-400 text-sm mb-4 font-medium">
              +{localInzending.credits_awarded} credits verdiend
            </div>
          )}

          {/* Submit button */}
          {!isApproved && (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${
                canSubmit && !loading
                  ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-900 active:bg-yellow-600'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Bezig...' : isPending ? 'Wacht op beoordeling' : 'Indienen'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}