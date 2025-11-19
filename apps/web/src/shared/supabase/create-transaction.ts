import {supabase} from "@/shared/supabase/index.ts";
import {useMutation} from "@tanstack/vue-query";
import {useUser} from "@/shared/auth/use-user.ts";
import type {Json} from "@/shared/supabase/types.ts";

export type EntryInsert = {
  currency_code: string,
  amount: number,
  wallet_id: string,
}

export type TransactionInsert = {
  kind: 'expense' | 'income' | 'transfer' | 'exchange'
  category_id?: string,
  metadata?: Json,
  occured_at?: string,
  description?: string,
}

export async function addTransaction({userId, transaction, entries}: {
  userId: string,
  transaction: TransactionInsert,
  entries: Array<EntryInsert>,
}) {
  const {data, error} = await supabase.rpc("create_transaction", {
    p_user_id: userId,
    p_kind: transaction.kind,
    p_category_id: transaction.category_id,
    p_metadata: transaction.metadata,
    p_occured_at: transaction.occured_at,
    p_description: "Кофе",
    p_entries: entries,
  });

  if (error) {
    throw error;
  }
  return data;
}

export function useCreateTransaction() {
  const user = useUser()
  return useMutation({
    mutationFn({
                 transaction,
                 entries,
               }: { transaction: TransactionInsert, entries: Array<EntryInsert> }) {
      if (!user.isSuccess.value) {
        throw new Error("User not found")
      }

      return addTransaction({
        userId: user.data.value!.id,
        transaction,
        entries,
      })
    }
  })
}
