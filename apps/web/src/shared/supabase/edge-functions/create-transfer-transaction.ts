import {
  CREATE_TRANSFER_TRANSACTION,
  type CreateTransferTransactionRequest,
} from 'supabase/create-transfer-transaction'
import { invokeEdgeFunction } from './invoke'
import type { EdgeFunctionResult } from './types'

export type CreateTransferTransactionResponse = {
  transaction_id: string
  debit_entry_id: string
  credit_entry_id: string
  from_wallet_id: string
  to_wallet_id: string
  from_currency: string
  to_currency: string
  from_previous_balance: number
  from_new_balance: number
  to_previous_balance: number
  to_new_balance: number
  timestamp: string
}

export type { CreateTransferTransactionRequest }

export function createTransferTransaction(
  params: CreateTransferTransactionRequest
): Promise<EdgeFunctionResult<CreateTransferTransactionResponse>> {
  return invokeEdgeFunction<CreateTransferTransactionRequest, CreateTransferTransactionResponse>(
    CREATE_TRANSFER_TRANSACTION,
    params
  )
}
