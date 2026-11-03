import { Book, BusinessCategory } from '../../domain/models/book';

export interface BookRepositoryPort {
  getActiveBook(): Promise<Book | null>;
  getAllBooks(): Promise<Book[]>;
  getBookById(id: string): Promise<Book | null>;
  saveBook(book: Book): Promise<void>;
  updateBookName(id: string, name: string): Promise<void>;
  updateBookCategory(id: string, category: BusinessCategory): Promise<void>;
  updateCurrency(id: string, currencyCode: string): Promise<void>;
  deleteBook(id: string): Promise<void>;
}
