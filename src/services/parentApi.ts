import { supabase } from '../lib/supabase/client'

export async function parentAction<T>(action: string, fields: Record<string, unknown> = {}): Promise<T> {
  if (!supabase) throw new Error('PackQuest n’est pas configuré.')
  const { data: { session }, error: authError } = await supabase.auth.getSession()
  if (authError || !session) throw new Error('Connectez-vous à votre compte parent.')
  const { data, error } = await supabase.functions.invoke('packquest', {
    body: { action, ...fields },
    headers: { Authorization: `Bearer ${session.access_token}` },
  })
  if (error) throw error
  if (data && typeof data === 'object' && 'error' in data) throw new Error(String(data.error))
  return data as T
}
