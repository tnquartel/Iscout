import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import GameStateBar from '@/components/GameStateBar'
import type { GameState } from '@/lib/types'

export default async function ScoreboardPage() {
  const supabase = await createClient()

  const [{ data: gameState }, { data: correctVragen }, { data: approvedInzendingen }] =
    await Promise.all([
      supabase.from('game_state').select('*').eq('id', 1).single(),
      supabase
        .from('gespeelde_reisvragen')
        .select('*, reisvragen_safe(name)')
        .eq('status', 'answered_correct')
        .order('answered_at', { ascending: false }),
      supabase
        .from('doe_inzendingen')
        .select('*, doe_opdrachten(title)')
        .eq('status', 'approved')
        .order('reviewed_at', { ascending: false }),
    ])

  const state: GameState = gameState || { id: 1, credits: 0, points: 0 }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6">Scorebord</h1>

        {/* Live stats */}
        <div className="flex justify-center mb-8">
          <GameStateBar initialState={state} />
        </div>

        <div className="grid gap-6">
          {/* Correct reisvragen */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>🗺️</span> Correcte reisvragen
              <span className="ml-auto text-sm font-normal text-slate-400">
                {(correctVragen || []).length} beantwoord
              </span>
            </h2>
            {(correctVragen || []).length === 0 ? (
              <p className="text-slate-500 text-sm">Nog geen reisvragen correct beantwoord.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(correctVragen || []).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0"
                  >
                    <span className="text-slate-200 font-medium">
                      {item.reisvragen_safe?.name || 'Onbekend'}
                    </span>
                    <span className="text-slate-400 text-xs">
                      {item.answered_at
                        ? new Date(item.answered_at).toLocaleString('nl-NL')
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved opdrachten */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span>🎯</span> Goedgekeurde doe-opdrachten
              <span className="ml-auto text-sm font-normal text-slate-400">
                {(approvedInzendingen || []).length} goedgekeurd
              </span>
            </h2>
            {(approvedInzendingen || []).length === 0 ? (
              <p className="text-slate-500 text-sm">Nog geen doe-opdrachten goedgekeurd.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {(approvedInzendingen || []).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0"
                  >
                    <div>
                      <span className="text-slate-200 font-medium">
                        {item.doe_opdrachten?.title || 'Onbekend'}
                      </span>
                      {item.credits_awarded != null && (
                        <span className="ml-2 text-yellow-400 text-sm font-semibold">
                          +{item.credits_awarded} credits
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-xs">
                      {item.reviewed_at
                        ? new Date(item.reviewed_at).toLocaleString('nl-NL')
                        : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
