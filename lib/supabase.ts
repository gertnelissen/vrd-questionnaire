import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type Answer = {
  id: string
  question_id: string
  text: string
  created_at: string
}

export type Question = {
  id: string
  text: string
  is_active: boolean
  created_at: string
  answers?: Answer[]
}

export type Vote = {
  id: string
  answer_id: string
  created_at: string
}

let _supabase: SupabaseClient | null = null

function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabase
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabase()[prop as keyof SupabaseClient]
  },
})
