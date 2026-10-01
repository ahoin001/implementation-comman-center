import type { User } from '@supabase/supabase-js'
import { icc, supabase } from '@/lib/supabase'
import { setActorId } from '@/lib/session'

function fallbackName(user: User): string {
  const meta = user.user_metadata?.display_name
  if (typeof meta === 'string' && meta.trim()) return meta.trim()
  return user.email?.split('@')[0] || 'Teammate'
}

/** Create the profile row if the signup trigger has not yet. */
export async function ensureProfile(user: User, displayName?: string) {
  const name = displayName?.trim() || fallbackName(user)
  if (displayName?.trim()) {
    const { error } = await icc()
      .from('profiles')
      .upsert({ id: user.id, display_name: name }, { onConflict: 'id' })
    if (error) throw new Error(error.message)
    return
  }

  const { data, error } = await icc().from('profiles').select('id').eq('id', user.id).maybeSingle()
  if (error) throw new Error(error.message)
  if (data) return

  const { error: insertError } = await icc().from('profiles').insert({ id: user.id, display_name: name })
  if (insertError) throw new Error(insertError.message)
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw new Error(error.message)
  if (!data.session || !data.user) {
    throw new Error('Check your email to confirm this account, then sign in.')
  }
  setActorId(data.user.id)
  await ensureProfile(data.user)
  return data.session
}

export async function signUp(displayName: string, email: string, password: string) {
  const name = displayName.trim()
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { display_name: name } },
  })
  if (error) throw new Error(error.message)
  if (!data.session || !data.user) {
    return { needsConfirmation: true as const }
  }
  setActorId(data.user.id)
  await ensureProfile(data.user, name)
  return { needsConfirmation: false as const }
}

export async function signOut() {
  setActorId(null)
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function updateOwnProfile(displayName: string) {
  const name = displayName.trim()
  if (!name) return
  const { data } = await supabase.auth.getUser()
  const id = data.user?.id
  if (!id) return
  const { error } = await icc().from('profiles').update({ display_name: name }).eq('id', id)
  if (error) throw new Error(error.message)
}
