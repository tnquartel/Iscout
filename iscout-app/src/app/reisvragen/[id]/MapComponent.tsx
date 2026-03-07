'use client'

import { useEffect, useRef } from 'react'

interface Props {
  onMarkerPlaced: (pos: { lat: number; lng: number }) => void
  marker: { lat: number; lng: number } | null
  blocked: boolean
  correctLocation?: { lat: number; lng: number } | null
}

export default function MapComponent({ onMarkerPlaced, marker, blocked, correctLocation }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const correctMarkerRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return

      // Fix default icon paths for Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Clear stale Leaflet state (React Strict Mode mounts effects twice)
      const container = mapRef.current as any
      if (container._leaflet_id) delete container._leaflet_id

      const map = L.map(mapRef.current!, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map)

      mapInstanceRef.current = map

      map.on('click', (e: any) => {
        if (blocked) return

        const { lat, lng } = e.latlng

        // Update or create marker
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map)
        }

        onMarkerPlaced({ lat, lng })
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
        correctMarkerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update blocked state
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    if (blocked) {
      map.getContainer().style.cursor = 'not-allowed'
      map.getContainer().style.pointerEvents = 'none'
    } else {
      map.getContainer().style.cursor = ''
      map.getContainer().style.pointerEvents = ''
    }
  }, [blocked])

  // Show correct location marker if provided
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !correctLocation) return

    import('leaflet').then((L) => {
      const greenIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      })

      if (correctMarkerRef.current) {
        correctMarkerRef.current.remove()
      }
      correctMarkerRef.current = L.marker([correctLocation.lat, correctLocation.lng], {
        icon: greenIcon,
      })
        .addTo(map)
        .bindPopup('Correcte locatie')
        .openPopup()

      map.panTo([correctLocation.lat, correctLocation.lng])
    })
  }, [correctLocation])

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', background: '#1e293b' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
