export type WalletBalance = {
  currency: string
  amount: number
}

export type SetupWalletWithBalanceRequest = {
  walletName: string
  walletDescription?: string
  balances: WalletBalance[]
}

export const SETUP_WALLET_WITH_BALANCE = 'setup-wallet-with-balance'
