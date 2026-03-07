export interface GameState {
  id: number
  credits: number
  points: number
}

export interface DoeOpdracht {
  id: string
  title: string
  description: string
  example_media_url: string | null
  is_active: boolean
  created_at: string
}

export interface DoeInzending {
  id: string
  opdracht_id: string
  status: 'pending' | 'approved' | 'rejected'
  credits_awarded: number | null
  submitted_at: string
  reviewed_at: string | null
  note: string | null
  doe_opdrachten?: DoeOpdracht
}

// Safe version without lat/lng/radius (for client)
export interface ReisvraagSafe {
  id: string
  name: string
  hint: string
  cost_credits: number
  points_awarded: number
  is_active: boolean
  created_at: string
}

// Full version with sensitive data (server-only)
export interface ReisvraagFull extends ReisvraagSafe {
  lat: number
  lng: number
  radius_km: number
}

export interface GespeeldeReisvraag {
  id: string
  vraag_id: string
  status: 'unlocked' | 'answered_correct' | 'answered_wrong'
  wrong_answer_at: string | null
  unlocked_at: string
  answered_at: string | null
  reisvragen?: ReisvraagSafe
}

export type ReisvraagWithStatus = ReisvraagSafe & {
  gespeeld?: GespeeldeReisvraag | null
}
