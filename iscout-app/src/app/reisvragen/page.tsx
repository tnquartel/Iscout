import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import GameStateBar from '@/components/GameStateBar'
import ReisvraagList from './ReisvraagList'
import type { GameState, ReisvraagWithStatus } from '@/lib/types'

export default async function ReisvragenPage() {
  const supabase = await createClient()

  const [{ data: gameState }, { data: vragen }, { data: gespeeld }] = await Promise.all([
    supabase.from('game_state').select('*').eq('id', 1).single(),
    supabase
      .from('reisvragen_safe')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase.from('gespeelde_reisvragen').select('*'),
  ])

  const state: GameState = gameState || { id: 1, credits: 0, points: 0 }

  // Map gespeeld by vraag_id
  const gespeeldMap = new Map(
    (gespeeld || []).map((g) => [g.vraag_id, g])
  )

  const vragenWithStatus: ReisvraagWithStatus[] = (vragen || []).map((v) => ({
    ...v,
    gespeeld: gespeeldMap.get(v.id) || null,
  }))

  // Sort: correct at bottom
  const sorted = [...vragenWithStatus].sort((a, b) => {
    const aCorrect = a.gespeeld?.status === 'answered_correct'
    const bCorrect = b.gespeeld?.status === 'answered_correct'
    if (aCorrect && !bCorrect) return 1
    if (!aCorrect && bCorrect) return -1
    return 0
  })

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400">Reisvragen</h1>
            <p className="text-slate-400 text-sm mt-1">
              Koop een vraag en zoek de locatie op de kaart
            </p>
          </div>
          <GameStateBar initialState={state} />
        </div>

        <ReisvraagList vragen={sorted} credits={state.credits} />
      </main>
    </div>
  )
}
