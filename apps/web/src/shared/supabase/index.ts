import { createClient } from '@supabase/supabase-js'
import type { Database, Tables, TablesInsert } from 'supabase/scheme'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY as string | undefined

if (!supabaseUrl || !supabaseKey) {
  const msg =
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_KEY environment variables. ' +
    'Make sure they are set in your .env file or hosting environment at build time.'
  document.getElementById('app')!.textContent = msg
  throw new Error(msg)
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// Wallet types
export type Wallet = Tables<'wallets'>
export type InsertWallet = TablesInsert<'wallets'>

// Transaction types
export type Transaction = Tables<'transactions'> & {
  entries: Tables<'transaction_entries'>[]
}

// User settings types
export type UserSettings = Tables<'user_settings'>
