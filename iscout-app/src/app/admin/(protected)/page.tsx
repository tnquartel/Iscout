import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [{ data: gameState }, { count: pendingCount }] = await Promise.all([
    supabase.from('game_state').select('*').eq('id', 1).single(),
    supabase
      .from('doe_inzendingen')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  const state = gameState || { credits: 0, points: 0 }

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400 mb-8">Admin Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 text-center">
          <div className="text-3xl font-bold text-yellow-400">{state.credits}</div>
          <div className="text-slate-400 text-sm mt-1">Credits</div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 text-center">
          <div className="text-3xl font-bold text-green-400">{state.points}</div>
          <div className="text-slate-400 text-sm mt-1">Punten</div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 text-center">
          <div className={`text-3xl font-bold ${pendingCount ? 'text-orange-400' : 'text-slate-400'}`}>
            {pendingCount || 0}
          </div>
          <div className="text-slate-400 text-sm mt-1">Openstaand</div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/inzendingen"
          className="bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-yellow-500 rounded-xl p-5 transition-colors"
        >
          <div className="text-xl mb-1">📥</div>
          <div className="font-bold text-white">Inzendingen beoordelen</div>
          {pendingCount ? (
            <div className="text-orange-400 text-sm mt-1">{pendingCount} wacht op beoordeling</div>
          ) : (
            <div className="text-slate-400 text-sm mt-1">Geen openstaande inzendingen</div>
          )}
        </Link>

        <Link
          href="/admin/opdrachten"
          className="bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-yellow-500 rounded-xl p-5 transition-colors"
        >
          <div className="text-xl mb-1">🎯</div>
          <div className="font-bold text-white">Opdrachten beheren</div>
          <div className="text-slate-400 text-sm mt-1">Toevoegen, bewerken, activeren</div>
        </Link>

        <Link
          href="/admin/vragen"
          className="bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-yellow-500 rounded-xl p-5 transition-colors"
        >
          <div className="text-xl mb-1">🗺️</div>
          <div className="font-bold text-white">Reisvragen beheren</div>
          <div className="text-slate-400 text-sm mt-1">Toevoegen, bewerken, locaties instellen</div>
        </Link>

        <Link
          href="/admin/instellingen"
          className="bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-yellow-500 rounded-xl p-5 transition-colors"
        >
          <div className="text-xl mb-1">⚙️</div>
          <div className="font-bold text-white">Instellingen</div>
          <div className="text-slate-400 text-sm mt-1">Credits, punten, spel resetten</div>
        </Link>
      </div>
    </div>
  )
}
