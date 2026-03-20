'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { haversineDistance } from '@/lib/haversine'
import { revalidatePath } from 'next/cache'

const COOLDOWN_MS = 3 * 60 * 1000   // 3 minuten
const MAX_WRONG   = 3                 // na 3 foute pogingen mag je skippen

// Submit a doe-opdracht (marks as pending)
export async function submitDoeOpdracht(opdrachtId: string) {
  const supabase = createServiceClient()

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

// Unlock a reisvraag — only allowed if previous question is done (correct or skipped)
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

  // Get this question's order_index
  const { data: vraag, error: vraagError } = await supabase
    .from('reisvragen')
    .select('id, cost_credits, is_active, order_index')
    .eq('id', vraagId)
    .single()

  if (vraagError || !vraag) return { error: 'Vraag niet gevonden' }
  if (!vraag.is_active) return { error: 'Vraag is niet actief' }

  // Check that previous question is done (correct or skipped)
  if (vraag.order_index && vraag.order_index > 1) {
    const { data: prevVraag } = await supabase
      .from('reisvragen')
      .select('id')
      .eq('order_index', vraag.order_index - 1)
      .eq('is_active', true)
      .single()

    if (prevVraag) {
      const { data: prevGespeeld } = await supabase
        .from('gespeelde_reisvragen')
        .select('status, skipped')
        .eq('vraag_id', prevVraag.id)
        .single()

      const prevDone =
        prevGespeeld?.status === 'answered_correct' || prevGespeeld?.skipped === true

      if (!prevDone) {
        return { error: 'Beantwoord eerst de vorige vraag' }
      }
    }
  }

  // Check and deduct credits
  const { data: gameState } = await supabase
    .from('game_state')
    .select('credits')
    .eq('id', 1)
    .single()

  if (!gameState) return { error: 'Game state niet gevonden' }
  if (gameState.credits < vraag.cost_credits) {
    return { error: 'Niet genoeg credits' }
  }

  const { error: creditError } = await supabase
    .from('game_state')
    .update({ credits: gameState.credits - vraag.cost_credits })
    .eq('id', 1)

  if (creditError) return { error: creditError.message }

  const { error: insertError } = await supabase
    .from('gespeelde_reisvragen')
    .insert({ vraag_id: vraagId, status: 'unlocked', wrong_answer_count: 0, skipped: false })

  if (insertError) {
    await supabase
      .from('game_state')
      .update({ credits: gameState.credits })
      .eq('id', 1)
    return { error: insertError.message }
  }

  revalidatePath('/reisvragen')
  return { success: true }
}

// Check a reisvraag answer (server-side only)
export async function checkReisvraagAnswer(
  vraagId: string,
  guessLat: number,
  guessLng: number
) {
  const supabase = createServiceClient()

  const { data: vraag, error: vraagError } = await supabase
    .from('reisvragen')
    .select('id, lat, lng, radius_km, points_awarded')
    .eq('id', vraagId)
    .single()

  if (vraagError || !vraag) return { error: 'Vraag niet gevonden' }

  const { data: gespeeld } = await supabase
    .from('gespeelde_reisvragen')
    .select('id, status, wrong_answer_at, wrong_answer_count, skipped')
    .eq('vraag_id', vraagId)
    .single()

  if (!gespeeld) return { error: 'Vraag niet ontgrendeld' }
  if (gespeeld.status === 'answered_correct') return { error: 'Al correct beantwoord' }
  if (gespeeld.skipped) return { error: 'Vraag is geskipped' }

  // Check cooldown (3 minuten)
  if (gespeeld.status === 'answered_wrong' && gespeeld.wrong_answer_at) {
    const cooldownEnd = new Date(gespeeld.wrong_answer_at).getTime() + COOLDOWN_MS
    if (Date.now() < cooldownEnd) {
      return { error: 'Nog in cooldown', cooldownEnd }
    }
  }

  const distance = haversineDistance(guessLat, guessLng, vraag.lat, vraag.lng)
  const isCorrect = distance <= vraag.radius_km

  if (isCorrect) {
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

    await supabase
      .from('gespeelde_reisvragen')
      .update({ status: 'answered_correct', answered_at: new Date().toISOString() })
      .eq('vraag_id', vraagId)

    revalidatePath('/reisvragen')
    revalidatePath(`/reisvragen/${vraagId}`)
    return { correct: true }
  } else {
    const newCount = (gespeeld.wrong_answer_count ?? 0) + 1

    await supabase
      .from('gespeelde_reisvragen')
      .update({
        status: 'answered_wrong',
        wrong_answer_at: new Date().toISOString(),
        wrong_answer_count: newCount,
      })
      .eq('vraag_id', vraagId)

    revalidatePath(`/reisvragen/${vraagId}`)
    return {
      correct: false,
      cooldownEnd: Date.now() + COOLDOWN_MS,
      wrongCount: newCount,
      canSkip: newCount >= MAX_WRONG,
    }
  }
}

// Skip a reisvraag (only after 3 wrong answers)
export async function skipReisvraag(vraagId: string) {
  const supabase = createServiceClient()

  const { data: gespeeld } = await supabase
    .from('gespeelde_reisvragen')
    .select('id, wrong_answer_count, skipped, status')
    .eq('vraag_id', vraagId)
    .single()

  if (!gespeeld) return { error: 'Vraag niet ontgrendeld' }
  if (gespeeld.skipped) return { error: 'Al geskipped' }
  if (gespeeld.status === 'answered_correct') return { error: 'Al correct beantwoord' }
  if ((gespeeld.wrong_answer_count ?? 0) < MAX_WRONG) {
    return { error: 'Nog niet 3 keer fout beantwoord' }
  }

  await supabase
    .from('gespeelde_reisvragen')
    .update({ skipped: true })
    .eq('vraag_id', vraagId)

  revalidatePath('/reisvragen')
  revalidatePath(`/reisvragen/${vraagId}`)
  return { success: true }
}

// Admin: approve doe inzending
export async function approveDoeInzending(inzendingId: string, credits: number) {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('doe_inzendingen')
    .update({
      status: 'approved',
      credits_awarded: credits,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', inzendingId)

  if (error) return { error: error.message }

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

  await supabase.from('game_state').update({ credits: 0, points: 0 }).eq('id', 1)
  await supabase.from('doe_inzendingen').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('gespeelde_reisvragen').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  revalidatePath('/')
  revalidatePath('/reisvragen')
  revalidatePath('/opdrachten')
  revalidatePath('/scoreboard')
  return { success: true }
}