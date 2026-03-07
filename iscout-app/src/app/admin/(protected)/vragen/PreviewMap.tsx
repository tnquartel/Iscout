'use client'

import { useEffect, useRef } from 'react'

interface Props {
  lat: number
  lng: number
}

export default function PreviewMap({ lat, lng }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current) return

    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!mapInstanceRef.current) {
        // Clear stale Leaflet state (React Strict Mode mounts effects twice)
        const container = mapRef.current as any
        if (container._leaflet_id) delete container._leaflet_id

        const map = L.map(mapRef.current!, {
          center: [lat, lng],
          zoom: 6,
          zoomControl: true,
          dragging: true,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
        }).addTo(map)

        markerRef.current = L.marker([lat, lng]).addTo(map)
        mapInstanceRef.current = map
      } else {
        mapInstanceRef.current.panTo([lat, lng])
        markerRef.current?.setLatLng([lat, lng])
      }
    })
  }, [lat, lng])

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
}
