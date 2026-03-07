import { createClient } from '@/lib/supabase/server'
import InstellingenForm from './InstellingenForm'

export default async function AdminInstellingen() {
  const supabase = await createClient()
  const { data: gameState } = await supabase.from('game_state').select('*').eq('id', 1).single()

  return (
    <div>
      <h1 className="text-2xl font-bold text-yellow-400 mb-6">Instellingen</h1>
      <InstellingenForm
        initialCredits={gameState?.credits || 0}
        initialPoints={gameState?.points || 0}
      />
    </div>
  )
}
