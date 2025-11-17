// Shared TypeScript types for Monetaire

export interface Category {
  id: number;
  name: string;
  description?: string;
  isUserDefined: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Expense {
  id: number;
  date: string; // YYYY-MM-DD
  customName?: string;
  originalTitle: string;
  amount: number;
  paymentType: 'credit' | 'debit' | 'pix' | 'cash' | 'other';
  source: 'imported' | 'manual';
  vendorName: string;
  category?: Category;
  categoryId?: number;
  importSessionId?: number;
  installmentCurrent?: number;
  installmentTotal?: number;
  billingCycleMonth?: number;
  billingCycleYear?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ImportSession {
  id: number;
  filename: string;
  importDate: string;
  expensesImported: number;
  expensesFailed: number;
  month: number;
  year: number;
  billingCycleCloseDay: number;
}

export interface ImportResult {
  sessionId: number;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
  classificationSummary?: {
    deterministic: number;
    ai: number;
    uncategorized: number;
  };
}

export interface CreateExpenseRequest {
  date: string;
  title: string;
  customName?: string;
  amount: number;
  paymentType: 'credit' | 'debit' | 'pix' | 'cash' | 'other';
  categoryId?: number;
}
