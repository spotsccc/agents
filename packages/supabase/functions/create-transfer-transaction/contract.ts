export type CreateTransferTransactionRequest = {
  userId: string
  fromWalletId: string
  toWalletId: string
  fromCurrency: string
  toCurrency: string
  fromAmount: number
  toAmount: number
  description: string
}

export const CREATE_TRANSFER_TRANSACTION = 'create-transfer-transaction'
