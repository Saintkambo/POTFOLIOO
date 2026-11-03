import { Book } from '../../domain/models/book';
import { Transaction } from '../../domain/models/transaction';
import { MonthSummary } from '../../domain/models/summary';

/**
 * Public client for the POTFOLIOO Backend API.
 * Notice: This client only consumes the public VITE_API_URL and never touches or exposes
 * backend secret keys (e.g. API_SECRET_KEY, DATABASE_PATH).
 */
export class BackendApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl || import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/$/, '');
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const message = data.error?.message || `API request failed with status ${response.status}`;
      throw new Error(message);
    }

    return data.data;
  }

  async checkHealth(): Promise<{ status: string; environment: string }> {
    return this.request('/health');
  }

  async getDefaultBook(): Promise<Book | null> {
    return this.request('/books/default');
  }

  async getBook(id: string): Promise<Book> {
    return this.request(`/books/${id}`);
  }

  async createBook(payload: { name: string; currencyCode: string }): Promise<Book> {
    return this.request('/books', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateBook(id: string, payload: { name?: string; currencyCode?: string }): Promise<Book> {
    return this.request(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async listTransactions(
    bookId: string,
    filters?: { startDate?: string; endDate?: string; type?: string }
  ): Promise<Transaction[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.type) params.set('type', filters.type);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/books/${bookId}/transactions${query}`);
  }

  async createTransaction(payload: {
    bookId: string;
    type: 'income' | 'expense';
    amountMinor: number;
    transactionDate: string;
    category?: string | null;
    note?: string | null;
  }): Promise<Transaction> {
    return this.request('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateTransaction(
    id: string,
    payload: {
      type?: 'income' | 'expense';
      amountMinor?: number;
      transactionDate?: string;
      category?: string | null;
      note?: string | null;
    }
  ): Promise<Transaction> {
    return this.request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.request(`/transactions/${id}`, { method: 'DELETE' });
  }

  async getMonthlySummary(bookId: string, monthYear: string): Promise<MonthSummary> {
    return this.request(`/books/${bookId}/summary?monthYear=${monthYear}`);
  }

  async exportBackup(bookId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/books/${bookId}/backup/export`);
    if (!response.ok) {
      throw new Error(`Failed to export backup: ${response.statusText}`);
    }
    return response.json();
  }

  async restoreBackup(backupEnvelope: any, apiKey?: string): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const response = await fetch(`${this.baseUrl}/backup/restore`, {
      method: 'POST',
      headers,
      body: JSON.stringify(backupEnvelope),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error?.message || 'Restore failed');
    }
    return data.data;
  }
}
