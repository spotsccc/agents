import type {Category} from "@/shared/supabase/category.ts";
import type {TransactionEntry} from "@/shared/supabase/transaction-entry.ts";

export type TransactionKind = 'income' | 'expense' | 'transfer' | 'exchange';
export const transactionKinds = ['income', 'expense', 'transfer', 'exchange'] as const;


export type Transaction = {
  kind: TransactionKind
  description: string | null
  category: Category | null
  entries: Array<TransactionEntry>
}
