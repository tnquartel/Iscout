'use client'

// Admin: klik op de afbeelding om het juiste punt te kiezen; de cirkel toont de radius.
import { useEffect, useRef } from 'react'
import type { Map as LeafletMap, LayerGroup, LeafletMouseEvent } from 'leaflet'

interface Props {
  imageUrl: string
  width: number
  height: number
  x: number | null // genormaliseerd 0..1
  y: number | null // genormaliseerd 0..1
  radius: number | null // fractie van breedte
  onPick: (x: number, y: number) => void
}

export default function ImagePickerMap({ imageUrl, width, height, x, y, radius, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const layerRef = useRef<LayerGroup | null>(null)
  const drawRef = useRef<() => void>(() => {})
  const onPickRef = useRef(onPick)

  useEffect(() => {
    onPickRef.current = onPick
  })

  // Altijd de nieuwste props tekenen
  useEffect(() => {
    drawRef.current = () => {
      const map = mapRef.current
      if (!map) return
      if (x == null || y == null) {
        layerRef.current?.clearLayers()
        return
      }
      import('leaflet').then((L) => {
        const currentMap = mapRef.current
        if (!currentMap) return
        if (!layerRef.current) layerRef.current = L.layerGroup().addTo(currentMap)
        layerRef.current.clearLayers()
        const pos: [number, number] = [(1 - y) * height, x * width]
        L.circleMarker(pos, {
          radius: 6,
          color: '#facc15',
          fillColor: '#facc15',
          fillOpacity: 1,
        }).addTo(layerRef.current)
        if (radius && radius > 0) {
          L.circle(pos, {
            radius: radius * width,
            color: '#facc15',
            weight: 2,
            fillOpacity: 0.15,
          }).addTo(layerRef.current)
        }
      })
    }
    drawRef.current()
  }, [x, y, radius, width, height])

  useEffect(() => {
    let cancelled = false
    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return
      const el = containerRef.current as HTMLDivElement & { _leaflet_id?: number }
      if (el._leaflet_id) delete el._leaflet_id // React Strict Mode

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
        const px = Math.min(Math.max(e.latlng.lng, 0), width)
        const py = Math.min(Math.max(height - e.latlng.lat, 0), height)
        onPickRef.current(px / width, py / height)
      })

      mapRef.current = map
      layerRef.current = null
      drawRef.current()
    })
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [imageUrl, width, height])

  return <div ref={containerRef} style={{ height: '100%', width: '100%', background: '#0f172a' }} />
}