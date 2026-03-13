export const TRANSACTION_TYPES = ['income', 'expense', 'transfer', 'exchange'] as const

export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  income: 'Income',
  expense: 'Expense',
  transfer: 'Transfer',
  exchange: 'Exchange',
}

export function isValidTransactionType(value: unknown): value is TransactionType {
  return typeof value === 'string' && TRANSACTION_TYPES.includes(value as TransactionType)
}
