'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { unlockReisvraag } from '@/lib/actions/game'
import type { ReisvraagWithStatus } from '@/lib/types'

interface Props {
  vragen: ReisvraagWithStatus[]
  credits: number
}

function CooldownTimer({ wrongAnswerAt, cooldownMs }: { wrongAnswerAt: string; cooldownMs: number }) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    function calc() {
      const end = new Date(wrongAnswerAt).getTime() + cooldownMs
      const rem = Math.max(0, end - Date.now())
      setRemaining(rem)
    }
    calc()
    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [wrongAnswerAt, cooldownMs])

  if (remaining === 0) return <span className="text-orange-400 font-semibold">Open</span>

  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)
  return (
    <span className="text-red-400 font-semibold">
      Wacht {mins}:{secs.toString().padStart(2, '0')}
    </span>
  )
}

function StatusBadge({ vraag, credits, isLocked }: { vraag: ReisvraagWithStatus; credits: number; isLocked: boolean }) {
  const g = vraag.gespeeld

  if (isLocked) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-700 text-slate-500">
        🔒 Geblokkeerd
      </span>
    )
  }

  if (g?.skipped) {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-600 text-slate-400">
        Geskipped
      </span>
    )
  }

  if (!g) {
    const canAfford = credits >= vraag.cost_credits
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
        canAfford ? 'bg-yellow-900 text-yellow-300' : 'bg-slate-700 text-slate-400'
      }`}>
        {vraag.cost_credits} credits
      </span>
    )
  }

  if (g.status === 'answered_correct') {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-900 text-green-300">
        Correct ✓
      </span>
    )
  }

  if (g.status === 'answered_wrong' && g.wrong_answer_at) {
    return <CooldownTimer wrongAnswerAt={g.wrong_answer_at} cooldownMs={3 * 60 * 1000} />
  }

  return (
    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-900 text-orange-300">
      Open
    </span>
  )
}

export default function ReisvraagList({ vragen, credits }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  // Bepaal welke vragen geblokkeerd zijn (vorige moet correct of geskipped zijn)
  function isLocked(index: number): boolean {
    if (index === 0) return false
    const prev = vragen[index - 1]
    const g = prev?.gespeeld
    return !(g?.status === 'answered_correct' || g?.skipped === true)
  }

  async function handleClick(vraag: ReisvraagWithStatus, index: number) {
    if (isLocked(index)) return

    const g = vraag.gespeeld

    if (g?.skipped) return
    if (g?.status === 'answered_correct') return

    // Check cooldown
    if (g?.status === 'answered_wrong' && g.wrong_answer_at) {
      const end = new Date(g.wrong_answer_at).getTime() + 3 * 60 * 1000
      if (Date.now() < end) return
    }

    if (!g) {
      if (credits < vraag.cost_credits) return
      setLoading(vraag.id)
      const result = await unlockReisvraag(vraag.id)
      setLoading(null)
      if (result.error) {
        alert(result.error)
        return
      }
    }

    router.push(`/reisvragen/${vraag.id}`)
  }

  return (
    <div className="flex flex-col gap-3">
      {vragen.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          Nog geen reisvragen beschikbaar.
        </div>
      )}
      {vragen.map((vraag, index) => {
        const g = vraag.gespeeld
        const locked = isLocked(index)
        const isCorrect = g?.status === 'answered_correct'
        const isSkipped = g?.skipped === true
        const isLoading = loading === vraag.id
        const number = vraag.order_index ?? index + 1

        const inCooldown =
          g?.status === 'answered_wrong' &&
          g.wrong_answer_at &&
          Date.now() < new Date(g.wrong_answer_at).getTime() + 3 * 60 * 1000

        let isClickable = true
        if (locked) isClickable = false
        if (isCorrect) isClickable = false
        if (isSkipped) isClickable = false
        if (!g && credits < vraag.cost_credits) isClickable = false
        if (inCooldown) isClickable = false

        return (
          <button
            key={vraag.id}
            onClick={() => handleClick(vraag, index)}
            disabled={!isClickable || isLoading}
            className={`w-full text-left rounded-xl border p-4 flex items-center justify-between gap-4 transition-all ${
              locked || isSkipped
                ? 'bg-slate-800/30 border-slate-800 opacity-50 cursor-not-allowed'
                : isCorrect
                ? 'bg-slate-800/40 border-slate-700 opacity-50 cursor-not-allowed'
                : isClickable
                ? 'bg-slate-800 border-slate-600 hover:border-yellow-500 active:bg-slate-700 cursor-pointer'
                : 'bg-slate-800 border-slate-700 cursor-not-allowed'
            }`}
          >
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <span className="text-yellow-400 font-bold text-sm shrink-0">#{number}</span>
              <div className="min-w-0">
                <div className="font-semibold text-white truncate">{vraag.name}</div>
                {isCorrect && g?.answered_at && (
                  <div className="text-slate-500 text-xs mt-1">
                    Beantwoord op {new Date(g.answered_at).toLocaleString('nl-NL')}
                  </div>
                )}
                {g && !isCorrect && !isSkipped && (
                  <div className="text-slate-500 text-xs mt-1">
                    {g.wrong_answer_count ?? 0}/3 foute pogingen
                  </div>
                )}
              </div>
            </div>
            <div className="shrink-0">
              {isLoading ? (
                <span className="text-slate-400 text-sm">Laden...</span>
              ) : (
                <StatusBadge vraag={vraag} credits={credits} isLocked={locked} />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}