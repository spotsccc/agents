import {
  CREATE_EXCHANGE_TRANSACTION,
  type CreateExchangeTransactionRequest,
} from 'supabase/create-exchange-transaction'
import { invokeEdgeFunction } from './invoke'
import type { EdgeFunctionResult } from './types'

export type CreateExchangeTransactionResponse = {
  transaction_id: string
  debit_entry_id: string
  credit_entry_id: string
  from_currency: string
  to_currency: string
  from_previous_balance: number
  from_new_balance: number
  to_previous_balance: number
  to_new_balance: number
  timestamp: string
}

export type { CreateExchangeTransactionRequest }

export function createExchangeTransaction(
  params: CreateExchangeTransactionRequest
): Promise<EdgeFunctionResult<CreateExchangeTransactionResponse>> {
  return invokeEdgeFunction<CreateExchangeTransactionRequest, CreateExchangeTransactionResponse>(
    CREATE_EXCHANGE_TRANSACTION,
    params
  )
}
