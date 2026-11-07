'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { createVraag, updateVraag } from '@/lib/actions/admin'

const PreviewMap = dynamic(() => import('./PreviewMap'), {
  ssr: false,
  loading: () => <div className="h-40 bg-slate-700 rounded-xl animate-pulse" />,
})
const ImagePickerMap = dynamic(() => import('./ImagePickerMap'), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-700 rounded-xl animate-pulse" />,
})

interface Props {
  initial?: {
    id: string
    name: string
    hint: string
    lat: number | null
    lng: number | null
    radius_km: number | null
    cost_credits: number
    points_awarded: number
    map_type?: 'world' | 'image'
    image_url?: string | null
    image_width?: number | null
    image_height?: number | null
    answer_x?: number | null
    answer_y?: number | null
    answer_radius?: number | null
  }
  onCancel?: () => void
}

const inputCls =
  'w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500'
const labelCls = 'block text-slate-300 text-sm font-medium mb-1'

export default function VraagForm({ initial, onCancel }: Props) {
  const [mapType, setMapType] = useState<'world' | 'image'>(initial?.map_type || 'world')
  const [name, setName] = useState(initial?.name || '')
  const [hint, setHint] = useState(initial?.hint || '')
  const [lat, setLat] = useState(initial?.lat?.toString() || '')
  const [lng, setLng] = useState(initial?.lng?.toString() || '')
  const [radius, setRadius] = useState(initial?.radius_km?.toString() || '50')
  const [cost, setCost] = useState(initial?.cost_credits?.toString() || '10')
  const [points, setPoints] = useState(initial?.points_awarded?.toString() || '1')

  // Afbeeldingskaart
  const [imageUrl, setImageUrl] = useState(initial?.image_url || '')
  const [imageW, setImageW] = useState(initial?.image_width || 0)
  const [imageH, setImageH] = useState(initial?.image_height || 0)
  const [ansX, setAnsX] = useState<number | null>(initial?.answer_x ?? null)
  const [ansY, setAnsY] = useState<number | null>(initial?.answer_y ?? null)
  // Radius in procenten van de breedte (UI), opgeslagen als fractie
  const [radiusPct, setRadiusPct] = useState(
    initial?.answer_radius ? (initial.answer_radius * 100).toString() : '5'
  )
  const [urlInput, setUrlInput] = useState(initial?.image_url || '')
  const [urlLoading, setUrlLoading] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedLat = parseFloat(lat)
  const parsedLng = parseFloat(lng)
  const showPreview = mapType === 'world' && !isNaN(parsedLat) && !isNaN(parsedLng)
  const parsedRadiusPct = parseFloat(radiusPct)

  // Afbeelding via een URL van het internet: laad hem om de afmetingen te bepalen
  async function handleUrl() {
    const url = urlInput.trim()
    setError(null)
    if (!/^https:\/\//i.test(url)) {
      setError('Gebruik een link die met https:// begint')
      return
    }
    setUrlLoading(true)
    const dims = await new Promise<{ w: number; h: number } | null>((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
      img.onerror = () => resolve(null)
      img.src = url
    })
    setUrlLoading(false)
    if (!dims) {
      setError('Kon de afbeelding niet laden. Is de link een directe afbeeldingslink (en niet geblokkeerd)?')
      return
    }
    setImageUrl(url)
    setImageW(dims.w)
    setImageH(dims.h)
    setAnsX(null)
    setAnsY(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (mapType === 'image') {
      if (!imageUrl || !imageW || !imageH) return setError('Upload eerst een afbeelding')
      if (ansX == null || ansY == null) return setError('Klik op de afbeelding om het juiste punt te kiezen')
      if (isNaN(parsedRadiusPct) || parsedRadiusPct <= 0) return setError('Vul een geldige radius in')
    }

    setLoading(true)

    const base = {
      name: name.trim(),
      hint: hint.trim(),
      cost_credits: parseInt(cost),
      points_awarded: parseInt(points),
      map_type: mapType,
    }

    const data =
      mapType === 'world'
        ? {
            ...base,
            lat: parsedLat,
            lng: parsedLng,
            radius_km: parseFloat(radius),
            image_url: null,
            image_width: null,
            image_height: null,
            answer_x: null,
            answer_y: null,
            answer_radius: null,
          }
        : {
            ...base,
            lat: null,
            lng: null,
            radius_km: null,
            image_url: imageUrl,
            image_width: imageW,
            image_height: imageH,
            answer_x: ansX,
            answer_y: ansY,
            answer_radius: parsedRadiusPct / 100,
          }

    const result = initial ? await updateVraag(initial.id, data) : await createVraag(data)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (!initial) {
      setName(''); setHint(''); setLat(''); setLng('')
      setRadius('50'); setCost('10'); setPoints('1')
      setMapType('world'); setImageUrl(''); setImageW(0); setImageH(0)
      setAnsX(null); setAnsY(null); setRadiusPct('5')
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
        <label className={labelCls}>Naam (zichtbaar in lijst)</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls}
          placeholder="Bijv. Parijs, Eiffeltoren" />
      </div>

      <div>
        <label className={labelCls}>Hint</label>
        <textarea value={hint} onChange={(e) => setHint(e.target.value)} required rows={3}
          className={inputCls + ' resize-none'} placeholder="Tekst of URL naar afbeelding/video" />
      </div>

      {/* Kaarttype */}
      <div>
        <label className={labelCls}>Type kaart</label>
        <div className="grid grid-cols-2 gap-2">
          {(['world', 'image'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setMapType(t)}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                mapType === t ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {t === 'world' ? 'Wereldkaart' : 'Eigen afbeelding'}
            </button>
          ))}
        </div>
      </div>

      {mapType === 'world' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Breedtegraad (lat)</label>
              <input value={lat} onChange={(e) => setLat(e.target.value)} required type="number" step="any"
                className={inputCls} placeholder="48.8566" />
            </div>
            <div>
              <label className={labelCls}>Lengtegraad (lng)</label>
              <input value={lng} onChange={(e) => setLng(e.target.value)} required type="number" step="any"
                className={inputCls} placeholder="2.3522" />
            </div>
          </div>

          {showPreview && (
            <div>
              <label className={labelCls}>Locatie preview</label>
              <div className="h-40 rounded-xl overflow-hidden border border-slate-600">
                <PreviewMap lat={parsedLat} lng={parsedLng} />
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Radius (km)</label>
            <input value={radius} onChange={(e) => setRadius(e.target.value)} required type="number" min={1}
              step="any" className={inputCls} />
          </div>
        </>
      )}

      {mapType === 'image' && (
        <>
          <div>
            <label className={labelCls}>Afbeeldings-URL</label>
            <div className="flex gap-2">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className={inputCls}
                placeholder="https://..."
                inputMode="url"
              />
              <button
                type="button"
                onClick={handleUrl}
                disabled={urlLoading || !urlInput.trim()}
                className="shrink-0 bg-slate-600 hover:bg-slate-500 text-white px-4 rounded-xl text-sm disabled:opacity-50"
              >
                {urlLoading ? 'Laden...' : 'Laden'}
              </button>
            </div>
          </div>

          {imageUrl && imageW > 0 && (
            <>
              <div>
                <label className={labelCls}>Klik op de afbeelding om het juiste antwoord te kiezen</label>
                <div className="h-72 rounded-xl overflow-hidden border border-slate-600">
                  <ImagePickerMap
                    key={imageUrl}
                    imageUrl={imageUrl}
                    width={imageW}
                    height={imageH}
                    x={ansX}
                    y={ansY}
                    radius={isNaN(parsedRadiusPct) ? null : parsedRadiusPct / 100}
                    onPick={(x, y) => { setAnsX(x); setAnsY(y) }}
                  />
                </div>
                <p className="text-slate-500 text-xs mt-1">
                  {ansX == null ? 'Nog geen punt gekozen' : `Gekozen: ${(ansX * 100).toFixed(1)}% , ${(ansY! * 100).toFixed(1)}%`}
                </p>
              </div>

              <div>
                <label className={labelCls}>Radius (% van de afbeeldingsbreedte)</label>
                <input value={radiusPct} onChange={(e) => setRadiusPct(e.target.value)} required type="number"
                  min={0.5} max={100} step="any" className={inputCls} />
              </div>
            </>
          )}
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Kosten (credits)</label>
          <input value={cost} onChange={(e) => setCost(e.target.value)} required type="number" min={0}
            className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Punten</label>
          <input value={points} onChange={(e) => setPoints(e.target.value)} required type="number" min={0}
            className={inputCls} />
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading}
          className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold px-6 py-2.5 rounded-xl text-sm disabled:opacity-50">
          {loading ? 'Opslaan...' : initial ? 'Opslaan' : 'Toevoegen'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2.5 rounded-xl text-sm">
            Annuleren
          </button>
        )}
      </div>
    </form>
  )
}