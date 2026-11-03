import { Book, validateBook, CURRENT_SCHEMA_VERSION, BusinessCategory } from '../../domain/models/book';
import { BookRepositoryPort } from '../ports/book-repository';
import { DEFAULT_CURRENCY } from '../../domain/money';

export interface InitializeBookParams {
  name?: string;
  currencyCode?: string;
  category?: BusinessCategory;
  businessId?: string;
  userId?: string;
}

export async function initializeBook(
  repo: BookRepositoryPort,
  params: InitializeBookParams = {}
): Promise<Book> {
  const existing = await repo.getActiveBook();
  if (existing) {
    return existing;
  }

  return createBook(repo, params);
}

export async function createBook(
  repo: BookRepositoryPort,
  params: InitializeBookParams = {}
): Promise<Book> {
  const now = new Date().toISOString();
  const newBook: Book = {
    id: crypto.randomUUID(),
    name: params.name?.trim() || 'My Business',
    currencyCode: params.currencyCode || DEFAULT_CURRENCY,
    category: params.category || 'other',
    businessId: params.businessId,
    userId: params.userId,
    createdAt: now,
    updatedAt: now,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  };

  validateBook(newBook);
  await repo.saveBook(newBook);
  return newBook;
}
