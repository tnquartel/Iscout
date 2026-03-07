import { createServiceClient } from '@/lib/supabase/server'
import VraagForm from './VraagForm'
import VraagRow from './VraagRow'

export default async function AdminVragen() {
  const supabase = createServiceClient()

  const { data: vragen } = await supabase
    .from('reisvragen')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">Reisvragen beheren</h1>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Nieuwe reisvraag toevoegen</h2>
        <VraagForm />
      </div>

      <div className="flex flex-col gap-3">
        {(vragen || []).map((vraag: any) => (
          <VraagRow key={vraag.id} vraag={vraag} />
        ))}
      </div>
    </div>
  )
}
