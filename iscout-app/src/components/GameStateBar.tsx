'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GameState } from '@/lib/types'

interface GameStateBarProps {
  initialState: GameState
}

export default function GameStateBar({ initialState }: GameStateBarProps) {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('game_state_bar')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'game_state' },
        (payload) => {
          setState(payload.new as GameState)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="flex items-center gap-6 bg-slate-800 rounded-xl px-6 py-4 border border-slate-700">
      <div className="flex items-center gap-2">
        <span className="text-2xl">💰</span>
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">Credits</div>
          <div className="text-2xl font-bold text-yellow-400">{state.credits}</div>
        </div>
      </div>
      <div className="w-px h-12 bg-slate-700" />
      <div className="flex items-center gap-2">
        <span className="text-2xl">⭐</span>
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wide">Punten</div>
          <div className="text-2xl font-bold text-green-400">{state.points}</div>
        </div>
      </div>
    </div>
  )
}
