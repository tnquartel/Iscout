'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { checkReisvraagAnswer, skipReisvraag } from '@/lib/actions/game'
import type { ReisvraagSafe, GespeeldeReisvraag } from '@/lib/types'

const COOLDOWN_MS = 3 * 60 * 1000
const MAX_WRONG = 3

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

function isAbsoluteUrl(str: string) {
  return /^https?:\/\//i.test(str)
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function HintText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return (
    <p className="text-slate-200 text-base whitespace-pre-wrap">
      {parts.map((part, i) =>
        isAbsoluteUrl(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer"
            className="text-yellow-400 underline break-all hover:text-yellow-300">
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  )
}

function HintContent({ hint, title }: { hint: string; title: string }) {
  const [localImageLoaded, setLocalImageLoaded] = useState<boolean | null>(null)
  const localImagePath = `/hints/${slugify(title)}.jpg`

  useEffect(() => {
    const img = new Image()
    img.onload = () => setLocalImageLoaded(true)
    img.onerror = () => setLocalImageLoaded(false)
    img.src = localImagePath
  }, [localImagePath])

  if (localImageLoaded === null) return <HintText text={hint} />

  if (localImageLoaded === true) {
    return (
      <>
        <img src={localImagePath} alt="Hint"
          className="rounded-lg max-h-96 object-contain w-full mb-2" />
        <HintText text={hint} />
      </>
    )
  }

  if (isAbsoluteUrl(hint)) {
    if (isImageUrl(hint)) return <img src={hint} alt="Hint" className="rounded-lg max-h-96 object-contain w-full" />
    if (isVideoUrl(hint)) return <video src={hint} controls className="rounded-lg max-h-64 w-full" />
    return (
      <a href={hint} target="_blank" rel="noopener noreferrer"
        className="text-yellow-400 underline break-all hover:text-yellow-300">
        {hint}
      </a>
    )
  }

  return <HintText text={hint} />
}

function CooldownDisplay({ wrongAnswerAt, onExpired }: { wrongAnswerAt: string; onExpired: () => void }) {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    function calc() {
      const end = new Date(wrongAnswerAt).getTime() + COOLDOWN_MS
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
  const [skipping, setSkipping] = useState(false)
  const [result, setResult] = useState<{
    correct: boolean
    cooldownEnd?: number
    wrongCount?: number
    canSkip?: boolean
  } | null>(null)
  const [cooldownExpired, setCooldownExpired] = useState(false)

  const isCorrect = gespeeld.status === 'answered_correct'
  const isSkipped = gespeeld.skipped === true
  const wrongCount = result?.wrongCount ?? gespeeld.wrong_answer_count ?? 0
  const canSkip = wrongCount >= MAX_WRONG

  const isInCooldown =
    gespeeld.status === 'answered_wrong' &&
    gespeeld.wrong_answer_at &&
    Date.now() < new Date(gespeeld.wrong_answer_at).getTime() + COOLDOWN_MS

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
      setResult({ correct: true })
    } else {
      setResult({
        correct: false,
        cooldownEnd: res.cooldownEnd,
        wrongCount: res.wrongCount,
        canSkip: res.canSkip,
      })
    }
  }

  async function handleSkip() {
    setSkipping(true)
    const res = await skipReisvraag(vraag.id)
    setSkipping(false)
    if (res.error) {
      alert(res.error)
    }
  }

  const mapBlocked = isCorrect || isSkipped || (isInCooldown && !cooldownExpired) || result?.correct

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Hint */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Hint</div>
        <HintContent hint={vraag.hint} title={vraag.name} />
      </div>

      {/* Fout teller */}
      {!isCorrect && !isSkipped && wrongCount > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center justify-between">
          <span className="text-slate-400 text-sm">Foute pogingen: <span className="text-red-400 font-bold">{wrongCount} / {MAX_WRONG}</span></span>
          {canSkip && (
            <button
              onClick={handleSkip}
              disabled={skipping}
              className="px-4 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm font-semibold transition-colors"
            >
              {skipping ? 'Bezig...' : 'Vraag overslaan'}
            </button>
          )}
        </div>
      )}

      {/* Geskipped melding */}
      {isSkipped && (
        <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4 text-center">
          <div className="text-slate-400 font-bold text-lg mb-1">Vraag overgeslagen</div>
          <Link href="/reisvragen"
            className="mt-2 inline-block bg-slate-600 hover:bg-slate-500 text-white px-6 py-2 rounded-xl font-semibold text-sm">
            Terug naar overzicht
          </Link>
        </div>
      )}

      {/* Correct melding */}
      {(isCorrect || result?.correct) && (
        <div className="bg-green-900/30 border border-green-800 rounded-xl p-4 text-center">
          <div className="text-green-400 font-bold text-xl mb-1">🎉 Correct!</div>
          <div className="text-slate-300 text-sm">+{vraag.points_awarded} punt verdiend</div>
          <Link href="/reisvragen"
            className="mt-3 inline-block bg-green-700 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-semibold text-sm">
            Terug naar overzicht
          </Link>
        </div>
      )}

      {/* Fout antwoord + cooldown */}
      {result?.correct === false && result.cooldownEnd && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 text-center">
          <div className="text-red-400 font-bold text-lg mb-1">Fout antwoord</div>
          <div className="text-slate-300 text-sm mb-2">Wacht 3 minuten voor een nieuwe poging.</div>
          <CooldownDisplay
            wrongAnswerAt={new Date(result.cooldownEnd - COOLDOWN_MS).toISOString()}
            onExpired={handleCooldownExpired}
          />
          <Link href="/reisvragen"
            className="mt-3 inline-block bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-xl font-semibold text-sm">
            Kies een andere vraag
          </Link>
        </div>
      )}

      {/* Cooldown vanuit DB (pagina herladen) */}
      {isInCooldown && !cooldownExpired && !result && (
        <>
          <CooldownDisplay wrongAnswerAt={gespeeld.wrong_answer_at!} onExpired={handleCooldownExpired} />
          <Link href="/reisvragen"
            className="text-center bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold">
            Kies een andere vraag
          </Link>
        </>
      )}

      {/* Kaart */}
      {!isSkipped && (
        <div className="rounded-xl border border-slate-700" style={{ height: '50vh', minHeight: '300px' }}>
          <MapComponent
            onMarkerPlaced={setMarker}
            marker={marker}
            blocked={!!mapBlocked}
          />
        </div>
      )}

      {/* Controleer knop */}
      {!isCorrect && !result?.correct && !isSkipped && (
        <div className="flex gap-3">
          <button
            onClick={handleCheck}
            disabled={!marker || checking || (!!isInCooldown && !cooldownExpired) || !!result?.cooldownEnd}
            className={`flex-1 py-4 rounded-xl font-bold text-base transition-colors ${
              marker && !checking && (!isInCooldown || cooldownExpired) && !result?.cooldownEnd
                ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-900 active:bg-yellow-600'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {checking ? 'Controleren...' : marker ? 'Controleer antwoord' : 'Klik op de kaart om een locatie te kiezen'}
          </button>
        </div>
      )}

      {/* Terug knop als correct */}
      {isCorrect && !result && (
        <Link href="/reisvragen"
          className="text-center bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold">
          Terug naar overzicht
        </Link>
      )}
    </div>
  )
}