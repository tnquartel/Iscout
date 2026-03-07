'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { checkReisvraagAnswer } from '@/lib/actions/game'
import type { ReisvraagSafe, GespeeldeReisvraag } from '@/lib/types'

// Leaflet must be loaded client-side only
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 bg-slate-800 rounded-xl flex items-center justify-center">
      <span className="text-slate-400">Kaart laden...</span>
    </div>
  ),
})

interface Props {
  vraag: ReisvraagSafe
  gespeeld: GespeeldeReisvraag
}

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|avif)(\?.*)?$/i.test(url)
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)
}

function isUrl(str: string) {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

function CooldownDisplay({
  wrongAnswerAt,
  onExpired,
}: {
  wrongAnswerAt: string
  onExpired: () => void
}) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    function calc() {
      const end = new Date(wrongAnswerAt).getTime() + 10 * 60 * 1000
      const rem = Math.max(0, end - Date.now())
      setRemaining(rem)
      if (rem === 0) onExpired()
    }
    calc()
    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [wrongAnswerAt, onExpired])

  const mins = Math.floor(remaining / 60000)
  const secs = Math.floor((remaining % 60000) / 1000)

  return (
    <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-center">
      <div className="text-red-400 font-bold text-lg mb-1">Fout antwoord!</div>
      <div className="text-slate-300 text-sm mb-2">Wacht voor de volgende poging:</div>
      <div className="text-4xl font-mono font-bold text-red-400">
        {mins}:{secs.toString().padStart(2, '0')}
      </div>
    </div>
  )
}

export default function ReisvraagDetail({ vraag, gespeeld }: Props) {
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<{
    correct: boolean
    distance?: number
    cooldownEnd?: number
    correctLocation?: { lat: number; lng: number } | null
  } | null>(null)
  const [cooldownExpired, setCooldownExpired] = useState(false)

  // Determine initial state based on gespeeld status
  const isCorrect = gespeeld.status === 'answered_correct'
  const isInCooldown =
    gespeeld.status === 'answered_wrong' &&
    gespeeld.wrong_answer_at &&
    Date.now() < new Date(gespeeld.wrong_answer_at).getTime() + 10 * 60 * 1000

  const handleCooldownExpired = useCallback(() => {
    setCooldownExpired(true)
  }, [])

  async function handleCheck() {
    if (!marker) return
    setChecking(true)

    const res = await checkReisvraagAnswer(vraag.id, marker.lat, marker.lng)
    setChecking(false)

    if (res.error) {
      alert(res.error)
      return
    }

    if (res.correct) {
      setResult({ correct: true, distance: res.distance, correctLocation: null })
      // After 2 seconds, the server will return the correct location
      // We'll show a "terug" button but not the correct location (we don't have it client-side)
    } else {
      setResult({
        correct: false,
        distance: res.distance,
        cooldownEnd: res.cooldownEnd,
      })
    }
  }

  const mapBlocked = isCorrect || (isInCooldown && !cooldownExpired)

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Hint */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Hint</div>
        {isUrl(vraag.hint) ? (
          isImageUrl(vraag.hint) ? (
            <img src={vraag.hint} alt="Hint" className="rounded-lg max-h-48 object-cover w-full" />
          ) : isVideoUrl(vraag.hint) ? (
            <video src={vraag.hint} controls className="rounded-lg max-h-48 w-full" />
          ) : (
            <a href={vraag.hint} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline break-all">
              {vraag.hint}
            </a>
          )
        ) : (
          <p className="text-slate-200 text-base">{vraag.hint}</p>
        )}
      </div>

      {/* Status overlays */}
      {isCorrect && (
        <div className="bg-green-900/30 border border-green-800 rounded-xl p-4 text-center">
          <div className="text-green-400 font-bold text-lg mb-1">Correct beantwoord! ✓</div>
          <div className="text-slate-300 text-sm">+{vraag.points_awarded} punt(en) verdiend</div>
        </div>
      )}

      {result?.correct && (
        <div className="bg-green-900/30 border border-green-800 rounded-xl p-4 text-center">
          <div className="text-green-400 font-bold text-xl mb-1">🎉 Correct!</div>
          <div className="text-slate-300 text-sm">
            +{vraag.points_awarded} punt(en) verdiend
            {result.distance != null && ` — op ${result.distance} km van het doel`}
          </div>
          <Link
            href="/reisvragen"
            className="mt-3 inline-block bg-green-700 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-semibold text-sm"
          >
            Terug naar overzicht
          </Link>
        </div>
      )}

      {result?.correct === false && result.cooldownEnd && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-center">
          <div className="text-red-400 font-bold text-lg mb-1">Fout antwoord</div>
          <div className="text-slate-300 text-sm mb-2">
            {result.distance != null && `Je zat ${result.distance} km van het doel.`} Wacht 10 minuten voor een nieuwe poging.
          </div>
          <CooldownDisplay
            wrongAnswerAt={new Date(result.cooldownEnd - 10 * 60 * 1000).toISOString()}
            onExpired={handleCooldownExpired}
          />
          <Link
            href="/reisvragen"
            className="mt-3 inline-block bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-xl font-semibold text-sm"
          >
            Kies een andere vraag
          </Link>
        </div>
      )}

      {isInCooldown && !cooldownExpired && !result && (
        <CooldownDisplay
          wrongAnswerAt={gespeeld.wrong_answer_at!}
          onExpired={handleCooldownExpired}
        />
      )}

      {isInCooldown && !cooldownExpired && (
        <Link
          href="/reisvragen"
          className="text-center bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Kies een andere vraag
        </Link>
      )}

      {/* Map */}
      <div className="rounded-xl border border-slate-700" style={{ height: '50vh', minHeight: '300px' }}>
        <MapComponent
          onMarkerPlaced={setMarker}
          marker={marker}
          blocked={!!mapBlocked || !!result?.correct}
        />
      </div>

      {/* Answer button */}
      {!isCorrect && !result?.correct && (
        <div className="flex gap-3">
          <button
            onClick={handleCheck}
            disabled={!marker || checking || (!!isInCooldown && !cooldownExpired)}
            className={`flex-1 py-4 rounded-xl font-bold text-base transition-colors ${
              marker && !checking && (!isInCooldown || cooldownExpired)
                ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-900 active:bg-yellow-600'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {checking
              ? 'Controleren...'
              : marker
              ? 'Controleer antwoord'
              : 'Klik op de kaart om een locatie te kiezen'}
          </button>
        </div>
      )}

      {/* Back link for correct */}
      {isCorrect && (
        <Link
          href="/reisvragen"
          className="text-center bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Terug naar overzicht
        </Link>
      )}
    </div>
  )
}
