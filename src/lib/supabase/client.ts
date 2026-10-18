import { createClient } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl as string, supabasePublishableKey as string, {
      auth: {
        autoRefreshToken: true,
        // Native callbacks arrive through the App plugin and are exchanged in App.tsx.
        detectSessionInUrl: !Capacitor.isNativePlatform(),
        flowType: 'pkce',
        persistSession: true,
      },
    })
  : null
