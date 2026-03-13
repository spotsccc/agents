export type CreateExchangeTransactionRequest = {
  userId: string
  walletId: string
  fromCurrency: string
  toCurrency: string
  fromAmount: number
  toAmount: number
  description: string
}

export const CREATE_EXCHANGE_TRANSACTION = 'create-exchange-transaction'
