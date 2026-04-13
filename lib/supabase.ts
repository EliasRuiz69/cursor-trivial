/**
 * lib/supabase.ts
 * Clientes Supabase para servidor y cliente.
 * - createServerSupabaseClient: para API routes y Server Components (usa service_role)
 * - createBrowserSupabaseClient: para Client Components (usa anon key + RLS)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ---------------------------------------------------------------
// Cliente SERVIDOR — usa service_role key, bypasses RLS.
// Solo usar en API routes y Server Components.
// ---------------------------------------------------------------
export function createServerSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Faltan variables de entorno de Supabase para el servidor.')
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ---------------------------------------------------------------
// Cliente NAVEGADOR — usa anon key, respeta RLS.
// Singleton para evitar múltiples instancias en el cliente.
// ---------------------------------------------------------------
let browserClient: ReturnType<typeof createClient> | null = null

export function createBrowserSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan variables de entorno de Supabase para el cliente.')
  }
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return browserClient
}
