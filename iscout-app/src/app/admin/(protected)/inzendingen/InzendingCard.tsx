'use client'

import { useState } from 'react'
import { approveDoeInzending, rejectDoeInzending } from '@/lib/actions/game'

interface Props {
  inzending: any
}

const statusLabels: Record<string, { label: string; cls: string }> = {
  pending: { label: 'In behandeling', cls: 'bg-orange-900 text-orange-300' },
  approved: { label: 'Goedgekeurd ✓', cls: 'bg-green-900 text-green-300' },
  rejected: { label: 'Afgekeurd', cls: 'bg-red-900 text-red-300' },
}

export default function InzendingCard({ inzending }: Props) {
  const [localStatus, setLocalStatus] = useState(inzending.status)
  const [credits, setCredits] = useState(10)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const isPending = localStatus === 'pending'
  const badge = statusLabels[localStatus] || statusLabels.pending

  async function handleApprove() {
    setLoading(true)
    const res = await approveDoeInzending(inzending.id, credits)
    if (!res.error) setLocalStatus('approved')
    setLoading(false)
  }

  async function handleReject() {
    setLoading(true)
    const res = await rejectDoeInzending(inzending.id, note || undefined)
    if (!res.error) setLocalStatus('rejected')
    setLoading(false)
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-bold text-white">{inzending.doe_opdrachten?.title || 'Onbekend'}</div>
          <div className="text-slate-400 text-sm mt-1">{inzending.doe_opdrachten?.description}</div>
        </div>
        <span className={`shrink-0 px-2 py-1 rounded-full text-xs font-semibold ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      <div className="text-slate-500 text-xs mb-4">
        Ingediend: {new Date(inzending.submitted_at).toLocaleString('nl-NL')}
        {inzending.reviewed_at && (
          <> · Beoordeeld: {new Date(inzending.reviewed_at).toLocaleString('nl-NL')}</>
        )}
        {inzending.credits_awarded != null && (
          <> · +{inzending.credits_awarded} credits</>
        )}
      </div>

      {inzending.note && (
        <div className="text-red-300 text-sm bg-red-900/20 rounded-lg px-3 py-2 mb-4">
          {inzending.note}
        </div>
      )}

      {isPending && (
        <div className="flex flex-col gap-3">
          {/* Credits input */}
          <div className="flex items-center gap-3">
            <label className="text-slate-300 text-sm shrink-0">Credits toekennen:</label>
            <input
              type="number"
              value={credits}
              onChange={(e) => setCredits(parseInt(e.target.value) || 0)}
              min={0}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white w-24 text-sm focus:outline-none focus:border-yellow-500"
            />
          </div>

          {/* Note for rejection */}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optionele reden bij afkeuren..."
            rows={2}
            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500 resize-none"
          />

          <div className="flex gap-3">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 bg-green-700 hover:bg-green-600 text-white py-2 rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              {loading ? 'Bezig...' : 'Goedkeuren'}
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex-1 bg-red-700 hover:bg-red-600 text-white py-2 rounded-xl font-semibold text-sm disabled:opacity-50"
            >
              {loading ? 'Bezig...' : 'Afkeuren'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
