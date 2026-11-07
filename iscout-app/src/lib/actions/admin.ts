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
  cost_credits: number
  points_awarded: number
  map_type: 'world' | 'image'
  lat: number | null
  lng: number | null
  radius_km: number | null
  image_url: string | null
  image_width: number | null
  image_height: number | null
  answer_x: number | null
  answer_y: number | null
  answer_radius: number | null
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
    cost_credits: number
    points_awarded: number
    map_type: 'world' | 'image'
    lat: number | null
    lng: number | null
    radius_km: number | null
    image_url: string | null
    image_width: number | null
    image_height: number | null
    answer_x: number | null
    answer_y: number | null
    answer_radius: number | null
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

export async function uploadVraagImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  // TODO: dezelfde admin-check als in je andere admin-actions
  const file = formData.get('file') as File | null
  if (!file) return { error: 'Geen bestand' }

  const allowed = ['image/png', 'image/jpeg', 'image/webp']
  if (!allowed.includes(file.type)) return { error: 'Alleen PNG, JPG of WebP' }
  if (file.size > 8 * 1024 * 1024) return { error: 'Bestand is te groot (max 8 MB)' }

  const supabase = createServiceClient()
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${crypto.randomUUID()}.${ext}`

  const { error } = await supabase.storage
    .from('vraag-images')
    .upload(path, await file.arrayBuffer(), { contentType: file.type })
  if (error) return { error: error.message }

  const { data } = supabase.storage.from('vraag-images').getPublicUrl(path)
  return { url: data.publicUrl }
}
