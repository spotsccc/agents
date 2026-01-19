import {
  SETUP_WALLET_WITH_BALANCE,
  type SetupWalletWithBalanceRequest,
  type WalletBalance,
} from 'supabase/setup-wallet-with-balance'
import { invokeEdgeFunction } from './invoke'
import type { EdgeFunctionResult } from './types'

export type SetupWalletWithBalanceResponse = {
  wallet_id: string
  wallet_name: string
  wallet_description: string | null
  balances: Array<{
    id: string
    currency_code: string
    balance: number
  }>
  timestamp: string
}

export type { SetupWalletWithBalanceRequest, WalletBalance }

export function setupWalletWithBalance(
  params: SetupWalletWithBalanceRequest
): Promise<EdgeFunctionResult<SetupWalletWithBalanceResponse>> {
  return invokeEdgeFunction<SetupWalletWithBalanceRequest, SetupWalletWithBalanceResponse>(
    SETUP_WALLET_WITH_BALANCE,
    params
  )
}
