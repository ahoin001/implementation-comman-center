import { supabase, icc, isSupabaseConfigured } from '@/lib/supabase'
import type { IntakeFlags, IntakeSlotState } from '@/lib/clientIntake'

const BUCKET = 'client-deliverables'

export interface IntakeReview {
  taskKey: string
  note: string
}

export interface IntakeView {
  projectName: string
  abbreviation: string
  flags: IntakeFlags
  tasks: Record<string, string>
  slots: IntakeSlotState[]
  reviews: IntakeReview[]
}

export interface ClientSubmission {
  id: string
  taskKey: string
  slotKey: string
  kind: 'file' | 'text' | 'credentials'
  storagePath: string | null
  fileName: string | null
  contentType: string | null
  width: number | null
  height: number | null
  body: { text?: string; username?: string; password?: string } | null
  updatedAt: string
}

function endpoint() {
  const url = import.meta.env.VITE_SUPABASE_URL as string
  return `${url}/functions/v1/client-intake`
}

function newToken() {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function postIntake(body: Record<string, unknown>) {
  if (!isSupabaseConfigured()) throw new Error('Supabase is not configured')
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string
  const response = await fetch(endpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  })
  const payload = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) throw new Error(payload.error || 'Something went wrong')
  return payload as Record<string, unknown>
}

export async function resolveIntake(token: string): Promise<IntakeView> {
  const payload = await postIntake({ action: 'resolve', token })
  return payload as unknown as IntakeView
}

export async function saveIntakeText(token: string, taskKey: string, slotKey: string, text: string) {
  await postIntake({ action: 'save', token, taskKey, slotKey, body: { text } })
}

export async function saveIntakeCredentials(
  token: string,
  taskKey: string,
  slotKey: string,
  username: string,
  password: string
) {
  await postIntake({ action: 'save', token, taskKey, slotKey, body: { username, password } })
}

export async function uploadIntakeFile(
  token: string,
  taskKey: string,
  slotKey: string,
  file: File,
  size?: { width: number; height: number }
) {
  const prepared = (await postIntake({
    action: 'prepare',
    token,
    taskKey,
    slotKey,
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    byteSize: file.size,
    width: size?.width,
    height: size?.height,
  })) as { path: string; token: string }

  const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(prepared.path, prepared.token, file)
  if (error) throw new Error(error.message)

  await postIntake({
    action: 'commit',
    token,
    taskKey,
    slotKey,
    path: prepared.path,
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    byteSize: file.size,
    width: size?.width,
    height: size?.height,
  })
}

export async function ensureClientLink(implementationId: string) {
  const { data, error } = await icc()
    .from('client_links')
    .select('token')
    .eq('implementation_id', implementationId)
    .is('revoked_at', null)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (data?.token) return data.token as string
  return regenerateClientLink(implementationId)
}

export async function regenerateClientLink(implementationId: string) {
  const token = newToken()
  const { error: revokeError } = await icc()
    .from('client_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('implementation_id', implementationId)
    .is('revoked_at', null)
  if (revokeError) throw new Error(revokeError.message)
  const { error } = await icc().from('client_links').insert({
    implementation_id: implementationId,
    token,
  })
  if (error) throw new Error(error.message)
  return token
}

export function clientLinkUrl(token: string) {
  return `${window.location.origin}/c/${token}`
}

export async function listIntakeReviews(implementationId: string): Promise<IntakeReview[]> {
  const { data, error } = await icc()
    .from('client_intake_reviews')
    .select('task_key, note')
    .eq('implementation_id', implementationId)
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({ taskKey: row.task_key as string, note: row.note as string }))
}

export async function requestIntakeChanges(implementationId: string, taskKey: string, note: string) {
  const trimmed = note.trim()
  if (!trimmed) throw new Error('Write what they should send again')
  const { error } = await icc().from('client_intake_reviews').upsert(
    {
      implementation_id: implementationId,
      task_key: taskKey,
      note: trimmed,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'implementation_id,task_key' }
  )
  if (error) throw new Error(error.message)
}

export async function clearIntakeReview(implementationId: string, taskKey: string) {
  const { error } = await icc()
    .from('client_intake_reviews')
    .delete()
    .eq('implementation_id', implementationId)
    .eq('task_key', taskKey)
  if (error) throw new Error(error.message)
}

export async function listClientSubmissions(implementationId: string): Promise<ClientSubmission[]> {
  const { data, error } = await icc()
    .from('client_submissions')
    .select('id, task_key, slot_key, kind, storage_path, file_name, content_type, width, height, body, updated_at')
    .eq('implementation_id', implementationId)
    .order('updated_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => ({
    id: row.id as string,
    taskKey: row.task_key as string,
    slotKey: row.slot_key as string,
    kind: row.kind as ClientSubmission['kind'],
    storagePath: (row.storage_path as string | null) ?? null,
    fileName: (row.file_name as string | null) ?? null,
    contentType: (row.content_type as string | null) ?? null,
    width: (row.width as number | null) ?? null,
    height: (row.height as number | null) ?? null,
    body: (row.body as ClientSubmission['body']) ?? null,
    updatedAt: row.updated_at as string,
  }))
}

export async function deliverableDownloadUrl(path: string, fileName: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10, {
    download: fileName,
  })
  if (error || !data?.signedUrl) throw new Error(error?.message ?? 'Could not prepare the download')
  return data.signedUrl
}

export async function deliverablePreviewUrl(path: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 30)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}
