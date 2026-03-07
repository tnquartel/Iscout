'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Ongeldig e-mailadres of wachtwoord')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
      {error && (
        <div className="mb-4 bg-red-900/30 border border-red-800 rounded-lg px-3 py-2 text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-slate-300 text-sm font-medium mb-2">
          E-mailadres
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-yellow-500"
          placeholder="admin@iscout.nl"
        />
      </div>

      <div className="mb-6">
        <label className="block text-slate-300 text-sm font-medium mb-2">
          Wachtwoord
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-yellow-500"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? 'Bezig...' : 'Inloggen'}
      </button>
    </form>
  )
}
