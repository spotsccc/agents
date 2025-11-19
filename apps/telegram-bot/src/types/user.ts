export interface User {
  id: string;
  telegramId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  telegramId: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}