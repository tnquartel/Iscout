'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============================================================
// DOE-OPDRACHTEN
// ============================================================

export async function createOpdracht(data: {
  title: string
  description: string
  example_media_url: string | null
}) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('doe_opdrachten').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/admin/opdrachten')
  revalidatePath('/opdrachten')
  return { success: true }
}

export async function updateOpdracht(
  id: string,
  data: { title: string; description: string; example_media_url: string | null }
) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('doe_opdrachten').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/opdrachten')
  revalidatePath('/opdrachten')
  return { success: true }
}

export async function toggleOpdracht(id: string, isActive: boolean) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('doe_opdrachten')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/opdrachten')
  revalidatePath('/opdrachten')
  return { success: true }
}

export async function deleteOpdracht(id: string) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('doe_opdrachten').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/opdrachten')
  revalidatePath('/opdrachten')
  return { success: true }
}

// ============================================================
// REISVRAGEN
// ============================================================

export async function createVraag(data: {
  name: string
  hint: string
  lat: number
  lng: number
  radius_km: number
  cost_credits: number
  points_awarded: number
}) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('reisvragen').insert(data)
  if (error) return { error: error.message }
  revalidatePath('/admin/vragen')
  revalidatePath('/reisvragen')
  return { success: true }
}

export async function updateVraag(
  id: string,
  data: {
    name: string
    hint: string
    lat: number
    lng: number
    radius_km: number
    cost_credits: number
    points_awarded: number
  }
) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('reisvragen').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/vragen')
  revalidatePath('/reisvragen')
  return { success: true }
}

export async function toggleVraag(id: string, isActive: boolean) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('reisvragen')
    .update({ is_active: isActive })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/vragen')
  revalidatePath('/reisvragen')
  return { success: true }
}

export async function deleteVraag(id: string) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('reisvragen').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/vragen')
  revalidatePath('/reisvragen')
  return { success: true }
}
