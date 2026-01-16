import {
  CREATE_EXPENSE_TRANSACTION,
  type CreateExpenseTransactionRequest,
} from 'supabase/create-expense-transaction'
import { invokeEdgeFunction } from './invoke'
import type { EdgeFunctionResult } from './types'

export type CreateExpenseTransactionResponse = {
  transaction_id: string
  entry_id: string
  previous_balance: number
  new_balance: number
  currency: string
  timestamp: string
}

export type { CreateExpenseTransactionRequest }

export function createExpenseTransaction(
  params: CreateExpenseTransactionRequest
): Promise<EdgeFunctionResult<CreateExpenseTransactionResponse>> {
  return invokeEdgeFunction<CreateExpenseTransactionRequest, CreateExpenseTransactionResponse>(
    CREATE_EXPENSE_TRANSACTION,
    params
  )
}
