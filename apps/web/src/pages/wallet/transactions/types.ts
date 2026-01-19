import type { Tables } from 'supabase/scheme'

export type TransactionEntry = Pick<
  Tables<'transaction_entries'>,
  | 'id'
  | 'wallet_id'
  | 'currency_code'
  | 'amount'
  | 'balance_after'
  | 'category_id'
  | 'source_id'
  | 'notes'
  | 'created_at'
>

export type Transaction = Pick<
  Tables<'transactions'>,
  'id' | 'type' | 'description' | 'date' | 'created_at'
> & {
  entries: TransactionEntry[]
}
