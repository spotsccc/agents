import type {Database} from "@/shared/supabase/types.ts";

export type TransactionEntry = Omit<Database['public']['Tables']['transaction_entries']['Row'], 'created_at' | 'transaction_id' | 'updated_at' | 'user_id'>
