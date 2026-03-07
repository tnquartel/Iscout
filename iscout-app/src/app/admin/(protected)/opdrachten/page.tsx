import { createClient } from '@/lib/supabase/server'
import OpdrachtForm from './OpdrachtForm'
import OpdrachtRow from './OpdrachtRow'

export default async function AdminOpdrachten() {
  const supabase = await createClient()

  const { data: opdrachten } = await supabase
    .from('doe_opdrachten')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">Opdrachten beheren</h1>

      {/* Add form */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Nieuwe opdracht toevoegen</h2>
        <OpdrachtForm />
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {(opdrachten || []).map((opdracht) => (
          <OpdrachtRow key={opdracht.id} opdracht={opdracht} />
        ))}
      </div>
    </div>
  )
}
