import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import GameStateBar from '@/components/GameStateBar'
import ReisvraagDetail from './ReisvraagDetail'
import type { GameState, ReisvraagSafe, GespeeldeReisvraag } from '@/lib/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReisvraagPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch safe vraag data (no lat/lng/radius)
  const [{ data: vraag }, { data: gespeeld }, { data: gameState }] = await Promise.all([
    supabase.from('reisvragen_safe').select('*').eq('id', id).single(),
    supabase.from('gespeelde_reisvragen').select('*').eq('vraag_id', id).single(),
    supabase.from('game_state').select('*').eq('id', 1).single(),
  ])

  if (!vraag) notFound()

  // If not unlocked, redirect back to list
  if (!gespeeld) {
    redirect('/reisvragen')
  }

  const state: GameState = gameState || { id: 1, credits: 0, points: 0 }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-yellow-400 truncate flex-1 mr-4">
            {vraag.name}
          </h1>
          <GameStateBar initialState={state} />
        </div>

        <ReisvraagDetail
          vraag={vraag as ReisvraagSafe}
          gespeeld={gespeeld as GespeeldeReisvraag}
        />
      </main>
    </div>
  )
}
