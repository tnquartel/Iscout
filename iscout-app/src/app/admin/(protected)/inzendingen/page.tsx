import { createClient } from '@/lib/supabase/server'
import InzendingCard from './InzendingCard'

export default async function AdminInzendingen() {
  const supabase = await createClient()

  const { data: inzendingen } = await supabase
    .from('doe_inzendingen')
    .select('*, doe_opdrachten(title, description)')
    .order('submitted_at', { ascending: false })

  const all = inzendingen || []
  const pending = all.filter((i) => i.status === 'pending')
  const rest = all.filter((i) => i.status !== 'pending')

  return (
    <div>
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">Inzendingen beoordelen</h1>

      {pending.length === 0 && rest.length === 0 && (
        <p className="text-slate-500">Nog geen inzendingen.</p>
      )}

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-orange-400 mb-4">
            Wacht op beoordeling ({pending.length})
          </h2>
          <div className="flex flex-col gap-4">
            {pending.map((inz) => (
              <InzendingCard key={inz.id} inzending={inz} />
            ))}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-400 mb-4">
            Beoordeeld ({rest.length})
          </h2>
          <div className="flex flex-col gap-3">
            {rest.map((inz) => (
              <InzendingCard key={inz.id} inzending={inz} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
