import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import GameStateBar from '@/components/GameStateBar'
import type { GameState } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: gameState } = await supabase
    .from('game_state')
    .select('*')
    .eq('id', 1)
    .single()

  const fallback: GameState = { id: 1, credits: 0, points: 0 }
  const state: GameState = gameState || fallback

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">iScout</h1>
          <p className="text-slate-400 text-lg">Het online scoutingspel</p>
        </div>

        {/* Live game state */}
        <div className="flex justify-center mb-10">
          <GameStateBar initialState={state} />
        </div>

        {/* Main action buttons */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-lg mx-auto">
          <Link
            href="/opdrachten"
            className="flex flex-col items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-2xl p-8 text-center transition-colors shadow-lg"
          >
            <span className="text-5xl">🎯</span>
            <span className="text-xl font-bold">Doe-opdrachten</span>
            <span className="text-blue-200 text-sm">Voer opdrachten uit en verdien credits</span>
          </Link>

          <Link
            href="/reisvragen"
            className="flex flex-col items-center justify-center gap-3 bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-slate-900 rounded-2xl p-8 text-center transition-colors shadow-lg"
          >
            <span className="text-5xl">🗺️</span>
            <span className="text-xl font-bold">Reisvragen</span>
            <span className="text-yellow-800 text-sm">Zoek locaties op de wereldkaart</span>
          </Link>
        </div>

        {/* Scoreboard link */}
        <div className="text-center mt-8">
          <Link
            href="/scoreboard"
            className="text-slate-400 hover:text-slate-200 text-sm underline underline-offset-4"
          >
            Bekijk het scorebord →
          </Link>
        </div>
      </main>
    </div>
  )
}
