'use client'

// Speler: toont de afbeelding, de speler klikt een plek aan.
// onSelect krijgt genormaliseerde coördinaten (0..1) die naar de server action gaan.
import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, CircleMarker, LeafletMouseEvent } from 'leaflet'

type LeafletModule = typeof import('leaflet')

interface Props {
  imageUrl: string
  width: number
  height: number
  selected: { x: number; y: number } | null
  onSelect: (pos: { x: number; y: number }) => void
  disabled?: boolean
}

function upsertMarker(
  L: LeafletModule,
  map: LeafletMap,
  existing: CircleMarker | null,
  pos: { x: number; y: number },
  width: number,
  height: number
): CircleMarker {
  const latlng: [number, number] = [(1 - pos.y) * height, pos.x * width]
  if (existing) {
    existing.setLatLng(latlng)
    return existing
  }
  return L.circleMarker(latlng, {
    radius: 9,
    color: '#fff',
    weight: 2,
    fillColor: '#eab308',
    fillOpacity: 1,
  }).addTo(map)
}

export default function ImageMap({ imageUrl, width, height, selected, onSelect, disabled }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<CircleMarker | null>(null)
  const onSelectRef = useRef(onSelect)
  const disabledRef = useRef(disabled)
  const selectedRef = useRef(selected)

  useEffect(() => {
    onSelectRef.current = onSelect
    disabledRef.current = disabled
    selectedRef.current = selected
  })

  useEffect(() => {
    let cancelled = false
    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return
      const el = containerRef.current as HTMLDivElement & { _leaflet_id?: number }
      if (el._leaflet_id) delete el._leaflet_id

      const bounds: [[number, number], [number, number]] = [[0, 0], [height, width]]
      const map = L.map(containerRef.current, {
        crs: L.CRS.Simple,
        minZoom: -3,
        maxZoom: 3,
        zoomSnap: 0.25,
        attributionControl: false,
      })
      L.imageOverlay(imageUrl, bounds).addTo(map)
      map.fitBounds(bounds)
      map.setMaxBounds(L.latLngBounds(bounds).pad(0.3))

      map.on('click', (e: LeafletMouseEvent) => {
        if (disabledRef.current) return
        const px = Math.min(Math.max(e.latlng.lng, 0), width)
        const py = Math.min(Math.max(height - e.latlng.lat, 0), height)
        onSelectRef.current({ x: px / width, y: py / height })
      })

      mapRef.current = map
      markerRef.current = null
      if (selectedRef.current) {
        markerRef.current = upsertMarker(L, map, null, selectedRef.current, width, height)
      }
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [imageUrl, width, height])

  // Marker bijwerken als de selectie verandert
  useEffect(() => {
    if (!selected) return
    import('leaflet').then((L) => {
      const map = mapRef.current
      if (!map) return
      markerRef.current = upsertMarker(L, map, markerRef.current, selected, width, height)
    })
  }, [selected, width, height])

  return <div ref={containerRef} style={{ height: '100%', width: '100%', background: '#0f172a' }} />
}