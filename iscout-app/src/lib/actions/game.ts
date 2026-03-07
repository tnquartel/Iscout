'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { haversineDistance } from '@/lib/haversine'
import { revalidatePath } from 'next/cache'

// Submit a doe-opdracht (marks as pending)
export async function submitDoeOpdracht(opdrachtId: string) {
  const supabase = createServiceClient()

  // Check if already submitted and pending/approved
  const { data: existing } = await supabase
    .from('doe_inzendingen')
    .select('id, status')
    .eq('opdracht_id', opdrachtId)
    .in('status', ['pending', 'approved'])
    .single()

  if (existing) {
    return { error: 'Al ingediend of goedgekeurd' }
  }

  const { error } = await supabase.from('doe_inzendingen').insert({
    opdracht_id: opdrachtId,
    status: 'pending',
  })

  if (error) return { error: error.message }

  revalidatePath('/opdrachten')
  return { success: true }
}

// Unlock a reisvraag (deduct credits)
export async function unlockReisvraag(vraagId: string) {
  const supabase = createServiceClient()

  // Check if already unlocked
  const { data: existing } = await supabase
    .from('gespeelde_reisvragen')
    .select('id')
    .eq('vraag_id', vraagId)
    .single()

  if (existing) {
    return { error: 'Al ontgrendeld' }
  }

  // Get question cost
  const { data: vraag, error: vraagError } = await supabase
    .from('reisvragen')
    .select('id, cost_credits, is_active')
    .eq('id', vraagId)
    .single()

  if (vraagError || !vraag) return { error: 'Vraag niet gevonden' }
  if (!vraag.is_active) return { error: 'Vraag is niet actief' }

  // Check and deduct credits atomically
  const { data: gameState } = await supabase
    .from('game_state')
    .select('credits')
    .eq('id', 1)
    .single()

  if (!gameState) return { error: 'Game state niet gevonden' }
  if (gameState.credits < vraag.cost_credits) {
    return { error: 'Niet genoeg credits' }
  }

  // Deduct credits
  const { error: creditError } = await supabase
    .from('game_state')
    .update({ credits: gameState.credits - vraag.cost_credits })
    .eq('id', 1)

  if (creditError) return { error: creditError.message }

  // Create gespeelde_reisvraag record
  const { error: insertError } = await supabase
    .from('gespeelde_reisvragen')
    .insert({ vraag_id: vraagId, status: 'unlocked' })

  if (insertError) {
    // Rollback credits
    await supabase
      .from('game_state')
      .update({ credits: gameState.credits })
      .eq('id', 1)
    return { error: insertError.message }
  }

  revalidatePath('/reisvragen')
  return { success: true }
}

// Check a reisvraag answer (server-side only, never exposes lat/lng/radius)
export async function checkReisvraagAnswer(
  vraagId: string,
  guessLat: number,
  guessLng: number
) {
  const supabase = createServiceClient()

  // Get full question including sensitive data (server-side only)
  const { data: vraag, error: vraagError } = await supabase
    .from('reisvragen')
    .select('id, lat, lng, radius_km, points_awarded')
    .eq('id', vraagId)
    .single()

  if (vraagError || !vraag) return { error: 'Vraag niet gevonden' }

  // Get gespeelde status
  const { data: gespeeld } = await supabase
    .from('gespeelde_reisvragen')
    .select('id, status, wrong_answer_at')
    .eq('vraag_id', vraagId)
    .single()

  if (!gespeeld) return { error: 'Vraag niet ontgrendeld' }
  if (gespeeld.status === 'answered_correct') return { error: 'Al correct beantwoord' }

  // Check cooldown
  if (gespeeld.status === 'answered_wrong' && gespeeld.wrong_answer_at) {
    const cooldownEnd = new Date(gespeeld.wrong_answer_at).getTime() + 10 * 60 * 1000
    if (Date.now() < cooldownEnd) {
      return { error: 'Nog in cooldown', cooldownEnd }
    }
  }

  // Calculate distance (server-side)
  const distance = haversineDistance(guessLat, guessLng, vraag.lat, vraag.lng)
  const isCorrect = distance <= vraag.radius_km

  if (isCorrect) {
    // Add points to game_state
    const { data: gameState } = await supabase
      .from('game_state')
      .select('points')
      .eq('id', 1)
      .single()

    if (gameState) {
      await supabase
        .from('game_state')
        .update({ points: gameState.points + vraag.points_awarded })
        .eq('id', 1)
    }

    // Update gespeelde_reisvraag
    await supabase
      .from('gespeelde_reisvragen')
      .update({ status: 'answered_correct', answered_at: new Date().toISOString() })
      .eq('vraag_id', vraagId)

    revalidatePath('/reisvragen')
    revalidatePath(`/reisvragen/${vraagId}`)
    return { correct: true, distance: Math.round(distance) }
  } else {
    // Wrong answer - start cooldown
    await supabase
      .from('gespeelde_reisvragen')
      .update({
        status: 'answered_wrong',
        wrong_answer_at: new Date().toISOString(),
      })
      .eq('vraag_id', vraagId)

    revalidatePath(`/reisvragen/${vraagId}`)
    return {
      correct: false,
      distance: Math.round(distance),
      cooldownEnd: Date.now() + 10 * 60 * 1000,
    }
  }
}

// Admin: approve doe inzending
export async function approveDoeInzending(inzendingId: string, credits: number) {
  const supabase = createServiceClient()

  // Update inzending status
  const { error } = await supabase
    .from('doe_inzendingen')
    .update({
      status: 'approved',
      credits_awarded: credits,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', inzendingId)

  if (error) return { error: error.message }

  // Add credits to game_state
  const { data: gameState } = await supabase
    .from('game_state')
    .select('credits')
    .eq('id', 1)
    .single()

  if (gameState) {
    await supabase
      .from('game_state')
      .update({ credits: gameState.credits + credits })
      .eq('id', 1)
  }

  revalidatePath('/admin/inzendingen')
  revalidatePath('/')
  return { success: true }
}

// Admin: reject doe inzending
export async function rejectDoeInzending(inzendingId: string, note?: string) {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('doe_inzendingen')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      note: note || null,
    })
    .eq('id', inzendingId)

  if (error) return { error: error.message }

  revalidatePath('/admin/inzendingen')
  return { success: true }
}

// Admin: update game state
export async function updateGameState(credits: number, points: number) {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('game_state')
    .update({ credits, points })
    .eq('id', 1)

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/scoreboard')
  return { success: true }
}

// Admin: reset game
export async function resetGame() {
  const supabase = createServiceClient()

  // Reset game state
  await supabase.from('game_state').update({ credits: 0, points: 0 }).eq('id', 1)

  // Reset all inzendingen to pending would be weird - just delete them
  await supabase.from('doe_inzendingen').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Delete all gespeelde_reisvragen
  await supabase.from('gespeelde_reisvragen').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  revalidatePath('/')
  revalidatePath('/reisvragen')
  revalidatePath('/opdrachten')
  revalidatePath('/scoreboard')
  return { success: true }
}
