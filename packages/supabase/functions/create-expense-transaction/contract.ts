export type CreateExpenseTransactionRequest = {
  userId: string
  walletId: string
  amount: number
  currency: string
  categoryId: string
  description: string
}

export const CREATE_EXPENSE_TRANSACTION = 'create-expense-transaction'
