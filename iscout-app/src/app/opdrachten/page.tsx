import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import OpdrachtCard from './OpdrachtCard'
import type { DoeOpdracht, DoeInzending } from '@/lib/types'

export default async function OpdrachtenPage() {
  const supabase = await createClient()

  const [{ data: opdrachten }, { data: inzendingen }] = await Promise.all([
    supabase
      .from('doe_opdrachten')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true }),
    supabase
      .from('doe_inzendingen')
      .select('*')
      .order('submitted_at', { ascending: false }),
  ])

  const allOpdrachten: DoeOpdracht[] = opdrachten || []
  const allInzendingen: DoeInzending[] = inzendingen || []

  // Determine latest status per opdracht
  const statusMap = new Map<string, DoeInzending>()
  for (const inz of allInzendingen) {
    const existing = statusMap.get(inz.opdracht_id)
    if (!existing || new Date(inz.submitted_at) > new Date(existing.submitted_at)) {
      statusMap.set(inz.opdracht_id, inz)
    }
  }

  // Sort: approved goes to the bottom
  const sorted = [...allOpdrachten].sort((a, b) => {
    const aStatus = statusMap.get(a.id)?.status
    const bStatus = statusMap.get(b.id)?.status
    if (aStatus === 'approved' && bStatus !== 'approved') return 1
    if (aStatus !== 'approved' && bStatus === 'approved') return -1
    return (a.order_index ?? 999) - (b.order_index ?? 999)  // ← aanpassen
  })

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">Doe-opdrachten</h1>
        <p className="text-slate-400 mb-6">
          Voer opdrachten uit en stuur bewijs via WhatsApp. De organisator kent credits toe.
        </p>

        {sorted.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            Nog geen opdrachten beschikbaar.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sorted.map((opdracht, index) => (
              <OpdrachtCard
                key={opdracht.id}
                opdracht={opdracht}
                inzending={statusMap.get(opdracht.id) || null}
                number={opdracht.order_index ?? index + 1}  // ← toevoegen
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
