import { createClient } from 'npm:@supabase/supabase-js@2'

const SCHEMA = 'app_implementation_center_v1'
const BUCKET = 'client-deliverables'
const MAX_BYTES = 8 * 1024 * 1024

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type SlotKind = 'image' | 'file' | 'credentials' | 'text' | 'confirm'

const NAMED: Record<string, Record<string, { kind: SlotKind; width?: number; height?: number }>> = {
  header_images: {
    homepage: { kind: 'image', width: 1920, height: 424 },
    career: { kind: 'image', width: 1920, height: 334 },
    pricing: { kind: 'image', width: 1920, height: 257 },
    logo: { kind: 'file' },
  },
  sso_credentials: {
    member: { kind: 'credentials' },
    non_member: { kind: 'credentials' },
  },
  provide_ach_w9: {
    ach: { kind: 'confirm' },
    w9: { kind: 'confirm' },
  },
  job_categories: { body: { kind: 'text' } },
  send_initial_export: {
    jobseekers: { kind: 'file' },
    employers: { kind: 'file' },
    resumes: { kind: 'file' },
    jobs: { kind: 'file' },
    billing: { kind: 'file' },
  },
}

const MULTI = new Set(['branding', 'send_resumes'])
const FILE_SLOT = /^file-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const INTAKE_KEYS = [...Object.keys(NAMED), ...MULTI]

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function ruleFor(taskKey: string, slotKey: string) {
  if (MULTI.has(taskKey) && FILE_SLOT.test(slotKey)) return { kind: 'file' as SlotKind }
  return NAMED[taskKey]?.[slotKey] ?? null
}

function requiredKeys(taskKey: string): string[] | 'any' {
  if (MULTI.has(taskKey)) return 'any'
  return Object.keys(NAMED[taskKey] ?? {})
}

function secureUploadUrl(abbreviation: string, override: unknown) {
  const custom = typeof override === 'string' ? override.trim() : ''
  if (custom) {
    try {
      if (new URL(custom).protocol === 'https:') return custom
    } catch {
      /* fall through to the abbreviation default */
    }
  }
  const host = abbreviation.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!host) return ''
  return `https://${host}.webscribble.com/smartway/file-manager`
}

function safeName(name: string) {
  const slash = Math.max(name.lastIndexOf('/'), name.lastIndexOf(String.fromCharCode(92)))
  const base = (slash >= 0 ? name.slice(slash + 1) : name) || 'file'
  const cleaned = base.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80)
  return cleaned || 'file'
}

function pngSize(bytes: Uint8Array) {
  const sig = [137, 80, 78, 71, 13, 10, 26, 10]
  if (bytes.length < 24) return null
  for (let i = 0; i < sig.length; i += 1) if (bytes[i] !== sig[i]) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return { width: view.getUint32(16), height: view.getUint32(20) }
}

function jpegSize(bytes: Uint8Array) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let offset = 2
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) return null
    const marker = bytes[offset + 1]
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2
      continue
    }
    if (offset + 4 > bytes.length) return null
    const length = view.getUint16(offset + 2)
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    if (isSof && offset + 9 <= bytes.length) {
      return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) }
    }
    offset += 2 + length
  }
  return null
}

function imageSize(bytes: Uint8Array, contentType: string) {
  if (contentType === 'image/png') return pngSize(bytes)
  if (contentType === 'image/jpeg') return jpegSize(bytes)
  return pngSize(bytes) ?? jpegSize(bytes)
}

function filled(row: { kind: string; storage_path: string | null; body: Record<string, string> | null }) {
  if (row.kind === 'file') return Boolean(row.storage_path)
  if (row.kind === 'text') return Boolean(row.body?.text?.trim())
  if (row.kind === 'credentials') return Boolean(row.body?.username?.trim() && row.body?.password?.trim())
  return false
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405)

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: SCHEMA },
  })
  const db = admin.schema(SCHEMA)

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid request' }, 400)
  }

  const token = String(payload.token ?? '')
  if (!token) return json({ error: 'Missing link' }, 400)

  const { data: link, error: linkError } = await db
    .from('client_links')
    .select('implementation_id, revoked_at')
    .eq('token', token)
    .maybeSingle()
  if (linkError) return json({ error: linkError.message }, 500)
  if (!link || link.revoked_at) return json({ error: 'This link is no longer active' }, 404)

  const implementationId = link.implementation_id as string
  const { data: project, error: projectError } = await db
    .from('implementations')
    .select('id, name, abbreviation, path_config, deliverables')
    .eq('id', implementationId)
    .maybeSingle()
  if (projectError) return json({ error: projectError.message }, 500)
  if (!project) return json({ error: 'This link is no longer active' }, 404)

  const pathConfig = (project.path_config ?? {}) as Record<string, unknown>
  const dataAssets = (pathConfig.dataAssets ?? {}) as Record<string, boolean>
  const flags = {
    ssoEnabled: pathConfig.ssoEnabled !== false,
    imageAssets: typeof pathConfig.imageAssets === 'string' ? pathConfig.imageAssets : 'pending',
    hasResumeData: pathConfig.hasResumeData === true || Boolean(dataAssets.resumes),
  }

  const { data: taskRows, error: taskError } = await db
    .from('implementation_tasks')
    .select('task_key, status')
    .eq('implementation_id', implementationId)
    .in('task_key', [...INTAKE_KEYS, 'confirm_thrive'])
  if (taskError) return json({ error: taskError.message }, 500)
  const tasks: Record<string, string> = {}
  for (const row of taskRows ?? []) tasks[row.task_key] = row.status
  const thriveNa = tasks.confirm_thrive === 'na'

  const blocked = (taskKey: string) => {
    if (tasks[taskKey] === 'complete') return 'This was already accepted'
    if (tasks[taskKey] === 'na') return 'That item is not needed'
    if (taskKey === 'header_images' && flags.imageAssets === 'not_providing') return 'Images are not needed'
    if (taskKey === 'sso_credentials' && !flags.ssoEnabled) return 'SSO is not on for this project'
    if (taskKey === 'send_resumes' && !flags.hasResumeData) return 'Resumes are not on for this project'
    if (taskKey === 'thrive_credentials' && thriveNa) return 'Thrive Jobs is not needed'
    return null
  }

  if (payload.action === 'resolve') {
    const { data: rows, error } = await db
      .from('client_submissions')
      .select('task_key, slot_key, kind, file_name, width, height, body, storage_path')
      .eq('implementation_id', implementationId)
    if (error) return json({ error: error.message }, 500)
    const { data: reviewRows, error: reviewError } = await db
      .from('client_intake_reviews')
      .select('task_key, note')
      .eq('implementation_id', implementationId)
    if (reviewError) return json({ error: reviewError.message }, 500)
    const slots = (rows ?? []).filter((row) => filled(row)).map((row) => ({
      taskKey: row.task_key,
      slotKey: row.slot_key,
      kind: row.kind,
      fileName: row.file_name ?? undefined,
      width: row.width ?? undefined,
      height: row.height ?? undefined,
      text: row.kind === 'text' && row.task_key !== 'provide_ach_w9' ? String(row.body?.text ?? '') : undefined,
    }))
    return json({
      projectName: project.name,
      abbreviation: project.abbreviation,
      flags: { ...flags, thriveNa },
      tasks,
      slots,
      reviews: (reviewRows ?? []).map((row) => ({ taskKey: row.task_key, note: row.note })),
      secureUploadUrl: secureUploadUrl(String(project.abbreviation ?? ''), pathConfig.secureUploadUrl),
    })
  }

  if (payload.action === 'reopen') {
    const reopenKey = String(payload.taskKey ?? '')
    if (!INTAKE_KEYS.includes(reopenKey)) return json({ error: 'Unknown item' }, 400)
    const { error } = await db
      .from('implementation_tasks')
      .update({ status: 'in_progress', completed_at: null, updated_at: new Date().toISOString() })
      .eq('implementation_id', implementationId)
      .eq('task_key', reopenKey)
      .eq('status', 'complete')
    if (error) return json({ error: error.message }, 500)
    return json({ ok: true })
  }

  const taskKey = String(payload.taskKey ?? '')
  const slotKey = String(payload.slotKey ?? '')
  const rule = ruleFor(taskKey, slotKey)
  if (!rule) return json({ error: 'Unknown item' }, 400)
  const block = blocked(taskKey)
  if (block) return json({ error: block }, 400)

  if (payload.action === 'clear') {
    if (rule.kind !== 'confirm') return json({ error: 'That item stays on this page' }, 400)
    const { error } = await db
      .from('client_submissions')
      .delete()
      .eq('implementation_id', implementationId)
      .eq('task_key', taskKey)
      .eq('slot_key', slotKey)
    if (error) return json({ error: error.message }, 500)
    const syncError = await syncProgress(db, implementationId, taskKey, project)
    if (syncError) return json({ error: syncError }, 500)
    return json({ ok: true })
  }

  if (payload.action === 'save') {
    if (rule.kind !== 'text' && rule.kind !== 'credentials' && rule.kind !== 'confirm') {
      return json({ error: 'This item is a file' }, 400)
    }
    const raw = (payload.body ?? {}) as Record<string, unknown>
    let body: Record<string, string>
    if (rule.kind === 'confirm') {
      body = { text: 'uploaded' }
    } else if (rule.kind === 'text') {
      const text = String(raw.text ?? '').trim()
      if (!text) return json({ error: 'Write something before saving' }, 400)
      if (text.length > 8000) return json({ error: 'That note is too long' }, 400)
      body = { text }
    } else {
      const username = String(raw.username ?? '').trim()
      const password = String(raw.password ?? '')
      if (!username || !password.trim()) return json({ error: 'Username and password are both required' }, 400)
      if (username.length > 200 || password.length > 200) return json({ error: 'Keep each field under 200 characters' }, 400)
      body = { username, password }
    }
    const now = new Date().toISOString()
    const { error } = await db.from('client_submissions').upsert(
      {
        implementation_id: implementationId,
        task_key: taskKey,
        slot_key: slotKey,
        kind: rule.kind === 'credentials' ? 'credentials' : 'text',
        body,
        updated_at: now,
      },
      { onConflict: 'implementation_id,task_key,slot_key' }
    )
    if (error) return json({ error: error.message }, 500)
    await db.from('client_intake_reviews').delete().eq('implementation_id', implementationId).eq('task_key', taskKey)
    const syncError = await syncProgress(db, implementationId, taskKey, project)
    if (syncError) return json({ error: syncError }, 500)
    return json({ ok: true })
  }

  if (payload.action === 'prepare') {
    if (rule.kind === 'confirm') return json({ error: 'Upload that document in the file manager, then mark it here.' }, 400)
    if (rule.kind !== 'image' && rule.kind !== 'file') return json({ error: 'This item is not a file' }, 400)
    const byteSize = Number(payload.byteSize ?? 0)
    if (!byteSize || byteSize > MAX_BYTES) return json({ error: 'Files need to be 8 MB or smaller' }, 400)
    const contentType = String(payload.contentType ?? '')
    if (rule.kind === 'image' && contentType !== 'image/png' && contentType !== 'image/jpeg') {
      return json({ error: 'Use a PNG or JPG' }, 400)
    }
    const width = Number(payload.width ?? 0)
    const height = Number(payload.height ?? 0)
    if (rule.kind === 'image' && (width !== rule.width || height !== rule.height)) {
      return json({
        error: `That image is ${width}×${height}. This one needs ${rule.width}×${rule.height}.`,
      }, 400)
    }
    const path = `${implementationId}/${taskKey}/${slotKey}/${safeName(String(payload.fileName ?? 'file'))}`
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true })
    if (error || !data) return json({ error: error?.message ?? 'Could not start the upload' }, 500)
    return json({ path: data.path, token: data.token })
  }

  if (payload.action === 'commit') {
    if (rule.kind === 'confirm') return json({ error: 'Upload that document in the file manager, then mark it here.' }, 400)
    if (rule.kind !== 'image' && rule.kind !== 'file') return json({ error: 'This item is not a file' }, 400)
    const path = String(payload.path ?? '')
    const prefix = `${implementationId}/${taskKey}/${slotKey}/`
    if (!path.startsWith(prefix)) return json({ error: 'Unexpected file' }, 400)
    const contentType = String(payload.contentType ?? '')
    const { data: file, error: downloadError } = await admin.storage.from(BUCKET).download(path)
    if (downloadError || !file) {
      await admin.storage.from(BUCKET).remove([path])
      return json({ error: 'The upload did not finish' }, 400)
    }
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (bytes.byteLength > MAX_BYTES) {
      await admin.storage.from(BUCKET).remove([path])
      return json({ error: 'Files need to be 8 MB or smaller' }, 400)
    }
    let width: number | null = null
    let height: number | null = null
    if (rule.kind === 'image') {
      const measured = imageSize(bytes, contentType)
      if (!measured || measured.width !== rule.width || measured.height !== rule.height) {
        await admin.storage.from(BUCKET).remove([path])
        const got = measured ? `${measured.width}×${measured.height}` : 'unreadable'
        return json({ error: `That image is ${got}. This one needs ${rule.width}×${rule.height}.` }, 400)
      }
      width = measured.width
      height = measured.height
    }
    const { data: previous } = await db
      .from('client_submissions')
      .select('storage_path')
      .eq('implementation_id', implementationId)
      .eq('task_key', taskKey)
      .eq('slot_key', slotKey)
      .maybeSingle()
    const now = new Date().toISOString()
    const { error } = await db.from('client_submissions').upsert(
      {
        implementation_id: implementationId,
        task_key: taskKey,
        slot_key: slotKey,
        kind: 'file',
        storage_path: path,
        file_name: safeName(String(payload.fileName ?? 'file')),
        content_type: contentType || file.type || null,
        byte_size: bytes.byteLength,
        width,
        height,
        updated_at: now,
      },
      { onConflict: 'implementation_id,task_key,slot_key' }
    )
    if (error) return json({ error: error.message }, 500)
    if (previous?.storage_path && previous.storage_path !== path) {
      await admin.storage.from(BUCKET).remove([previous.storage_path])
    }
    await db.from('client_intake_reviews').delete().eq('implementation_id', implementationId).eq('task_key', taskKey)
    const syncError = await syncProgress(db, implementationId, taskKey, project)
    if (syncError) return json({ error: syncError }, 500)
    return json({ ok: true })
  }

  return json({ error: 'Unknown action' }, 400)
})

async function syncProgress(
  db: ReturnType<ReturnType<typeof createClient>['schema']>,
  implementationId: string,
  taskKey: string,
  project: { path_config: unknown; deliverables: unknown }
) {
  const { data: rows, error } = await db
    .from('client_submissions')
    .select('slot_key, kind, storage_path, body')
    .eq('implementation_id', implementationId)
    .eq('task_key', taskKey)
  if (error) return error.message
  const ready = new Set((rows ?? []).filter((row) => filled(row)).map((row) => row.slot_key as string))
  const required = requiredKeys(taskKey)
  const done = required === 'any' ? ready.size > 0 : required.every((key) => ready.has(key))
  if (ready.size > 0) {
    const { error: taskError } = await db
      .from('implementation_tasks')
      .update({
        status: 'in_progress',
        completed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('implementation_id', implementationId)
      .eq('task_key', taskKey)
      .neq('status', 'na')
      .neq('status', 'complete')
    if (taskError) return taskError.message
  } else if (taskKey === 'provide_ach_w9') {
    const { error: taskError } = await db
      .from('implementation_tasks')
      .update({
        status: 'not_started',
        completed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('implementation_id', implementationId)
      .eq('task_key', taskKey)
      .eq('status', 'in_progress')
    if (taskError) return taskError.message
  }

  const pathConfig = { ...((project.path_config ?? {}) as Record<string, unknown>) }
  const deliverables = { ...((project.deliverables ?? {}) as Record<string, Record<string, unknown>>) }
  let changed = false
  const mark = (key: string) => {
    const prev = deliverables[key] ?? {}
    deliverables[key] = { ...prev, received: true, receivedAt: prev.receivedAt ?? new Date().toISOString() }
    changed = true
  }
  if (taskKey === 'header_images' && done) {
    pathConfig.imageAssets = 'provided'
    changed = true
  }
  if (taskKey === 'provide_ach_w9') {
    if (ready.has('ach')) mark('ach')
    if (ready.has('w9')) mark('w9')
  }
  if (taskKey === 'sso_credentials' && done) mark('sso_test_credentials')
  if (taskKey === 'job_categories' && done) mark('custom_categories')
  if (!changed) return null
  const { error: updateError } = await db
    .from('implementations')
    .update({
      path_config: pathConfig,
      deliverables,
      updated_at: new Date().toISOString(),
    })
    .eq('id', implementationId)
  return updateError?.message ?? null
}
