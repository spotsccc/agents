import {
  CREATE_INCOME_TRANSACTION,
  type CreateIncomeTransactionRequest,
} from 'supabase/create-income-transaction'
import { invokeEdgeFunction } from './invoke'
import type { EdgeFunctionResult } from './types'

export type CreateIncomeTransactionResponse = {
  transaction_id: string
  entry_id: string
  previous_balance: number
  new_balance: number
  currency: string
  timestamp: string
}

export type { CreateIncomeTransactionRequest }

export function createIncomeTransaction(
  params: CreateIncomeTransactionRequest
): Promise<EdgeFunctionResult<CreateIncomeTransactionResponse>> {
  return invokeEdgeFunction<CreateIncomeTransactionRequest, CreateIncomeTransactionResponse>(
    CREATE_INCOME_TRANSACTION,
    params
  )
}
