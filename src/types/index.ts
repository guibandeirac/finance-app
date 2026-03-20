export type TransactionType = 'INCOME' | 'EXPENSE'
export type CategoryType = 'FIXED' | 'VARIABLE' | 'INCOME'
export type AccountType = 'CHECKING' | 'CREDIT_CARD'

export interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: CategoryType
}

export interface Account {
  id: string
  name: string
  type: AccountType
  closingDay?: number
  dueDay?: number
  creditLimit?: number
  color: string
  lastFourDigits?: string
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: TransactionType
  categoryId: string
  accountId?: string
  isRecurring: boolean
  installmentGroup?: string
  installmentCurrent?: number
  installmentTotal?: number
}

export interface RecurringTemplate {
  id: string
  description: string
  amount: number
  type: TransactionType
  categoryId: string
  accountId?: string
  dayOfMonth: number
  startDate: string
  endDate?: string
  isActive: boolean
}

export interface IncomeSource {
  id: string
  name: string
  expectedAmount: number
  dayOfMonth?: number
  isFixed: boolean
  isActive: boolean
}

export interface DailyBalance {
  date: string
  dayOfWeek: string
  entries: Transaction[]
  exits: Transaction[]
  totalIn: number
  totalOut: number
  balance: number
  isToday: boolean
  isPast: boolean
  isFuture: boolean
}
