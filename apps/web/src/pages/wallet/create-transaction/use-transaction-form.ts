import { createInjectionState } from '@vueuse/core'
import {useQueryClient} from "@tanstack/vue-query";
import {useCreateTransaction} from "@/shared/supabase/create-transaction.ts";
import {z} from "zod";
import {useForm} from "vee-validate";
import {toTypedSchema} from "@vee-validate/zod";

export const [useProvideTransactionForm, useTransactionForm] = createInjectionState((walletId: string) => {
  const queryClient = useQueryClient();
  const createTransactionMutation = useCreateTransaction()

  const scheme = z.object({
    amount: z.number(),
    currency: z.string(),
    description: z.string(),
    kind: z.enum(['income', 'expense', 'transfer', 'exchange']),
    to_wallet: z.string().optional(),
    to_currency: z.string().optional(),
    to_amount: z.number().optional(),
    category: z.string().optional(),
  }).refine(form => form.kind === 'transfer' && !form.to_wallet, {path: ['to_wallet', "To wallet should be chosen"]})
    .refine(form => form.kind === 'transfer' && !form.to_amount, {path: ['to_amount', "To amount should be filled"]})
    .refine(form => form.kind === 'transfer' && !form.to_currency, {path: ['to_amount', "To currency should be filled"]})
    .refine(form => form.kind === 'exchange' && !form.to_amount, {path: ['to_amount', "To amount should be filled"]})
    .refine(form => form.kind === 'exchange' && !form.to_currency, {path: ['to_currency', "To amount should be filled"]})
    .refine(form => form.kind === 'expense' && !form.category, {path: ['category_id', "Category should be chosen"]})

  const form = useForm({
    validationSchema: toTypedSchema(scheme),
    initialValues: {
      amount: 0,
      currency: 'USD',
      description: '',
      kind: 'income',
      to_currency: 'USD',
    }
  })

  const onSubmit = form.handleSubmit(async (form) => {
    try {
      switch (form.kind) {
        case "income":
          await createTransactionMutation.mutateAsync({
            transaction: {
              kind: form.kind,
              description: form.description,
            },
            entries: [
              {
                amount: Number(form.amount),
                wallet_id: walletId,
                currency_code: form.currency,
              }
            ]
          })
          break;
        case "exchange":
          await createTransactionMutation.mutateAsync({
            transaction: {
              kind: form.kind,
              description: form.description,
            },
            entries: [
              {
                amount: Number(form.to_amount!),
                wallet_id: walletId,
                currency_code: form.to_currency!,
              },
              {
                amount: Number(form.amount),
                wallet_id: walletId,
                currency_code: form.currency,
              }
            ]
          })
          break;
        case "expense":
          await createTransactionMutation.mutateAsync({
            transaction: {
              kind: form.kind,
              category_id: form.category!,
              description: form.description,
            },
            entries: [
              {
                amount: -Number(form.amount),
                wallet_id: walletId,
                currency_code: form.currency,
              }
            ]
          })
          break;
        case "transfer":
          await createTransactionMutation.mutateAsync({
            transaction: {
              kind: form.kind,
              description: form.description,
            },
            entries: [
              {
                amount: Number(form.to_amount!),
                wallet_id: form.to_wallet!,
                currency_code: form.to_currency!,
              },
              {
                amount: -Number(form.amount),
                wallet_id: walletId,
                currency_code: form.currency,
              },
            ]
          })
      }

      void queryClient.invalidateQueries({queryKey: ['walletTransactions', walletId]});
      void queryClient.invalidateQueries({queryKey: ['wallets', {id: walletId}]});

    } catch (error) {
      console.log(error)
    }
  })

  return {
    form,
    onSubmit,
    walletId,
  }
})
