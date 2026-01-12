export type CreateIncomeTransactionRequest = {
    userId: string;
    walletId: string;
    amount: number;
    currency: string;
    sourceId: string;
    description: string;
  }

export const CREATE_INCOME_TRANSACTION = 'create-income-transaction';