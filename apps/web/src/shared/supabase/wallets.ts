import type {Database} from "@/shared/supabase/types.ts";

export type UpdateWallet = Database['public']['Tables']['wallets']['Update']
export type InsertWallet = Database['public']['Tables']['wallets']['Insert']

export type Wallet = Database['public']['Tables']['wallets']['Row'] & {
  balances: Database['public']['Tables']['wallet_balances']['Row'][]
}
