import { apiClient, apiClientFormData } from './api';
import type { Expense, ImportResult, ImportSession } from '../../../shared/types';

export interface GetExpensesParams {
  month?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  vendor?: string;
  paymentType?: string;
  sortBy?: 'date' | 'amount' | 'vendor_name' | 'category';
  sortOrder?: 'asc' | 'desc';
}

export interface GetExpensesResponse {
  expenses: Expense[];
  total: number;
}

export async function getExpenses(params?: GetExpensesParams): Promise<GetExpensesResponse> {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
  }

  const queryString = queryParams.toString();
  const endpoint = `/expenses${queryString ? `?${queryString}` : ''}`;

  return apiClient<GetExpensesResponse>(endpoint);
}

export async function importCSV(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  return apiClientFormData<ImportResult>('/import/csv', formData);
}

export async function getExpenseById(id: number): Promise<Expense> {
  return apiClient<Expense>(`/expenses/${id}`);
}

export interface GetImportSessionsResponse {
  sessions: ImportSession[];
}

export async function getImportSessions(limit: number = 20): Promise<GetImportSessionsResponse> {
  return apiClient<GetImportSessionsResponse>(`/import/sessions?limit=${limit}`);
}

export async function deleteImportSession(sessionId: number): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/import/${sessionId}`, {
    method: 'DELETE',
  });
}

export async function deleteExpense(expenseId: number): Promise<{ message: string; expenseId: number }> {
  return apiClient<{ message: string; expenseId: number }>(`/expenses/${expenseId}`, {
    method: 'DELETE',
  });
}

export async function deleteBillingCycle(month: number, year: number): Promise<{ message: string; month: number; year: number; deletedCount: number }> {
  return apiClient<{ message: string; month: number; year: number; deletedCount: number }>(`/expenses/billing-cycle/${month}/${year}`, {
    method: 'DELETE',
  });
}

export async function updateExpenseName(expenseId: number, customName: string | null): Promise<{ message: string; expenseId: number; customName: string | null }> {
  return apiClient<{ message: string; expenseId: number; customName: string | null }>(`/expenses/${expenseId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ customName }),
  });
}
