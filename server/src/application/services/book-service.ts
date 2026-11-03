import crypto from 'node:crypto';
import { SqliteBookRepository } from '../../infrastructure/repositories/sqlite-book-repository.js';
import { Book, BusinessCategory } from '../../domain/models/book.js';
import { NotFoundError } from '../../domain/errors.js';

export class BookService {
  constructor(private bookRepo = new SqliteBookRepository()) {}

  getBook(id: string): Book {
    const book = this.bookRepo.findById(id);
    if (!book) {
      throw new NotFoundError('Book', id);
    }
    return book;
  }

  getDefaultBook(): Book | null {
    return this.bookRepo.findFirst();
  }

  listBooks(): Book[] {
    return this.bookRepo.list();
  }

  createBook(data: { id?: string; name: string; currencyCode: string; category?: BusinessCategory }): Book {
    const now = new Date().toISOString();
    const book: Book = {
      id: data.id || crypto.randomUUID(),
      name: data.name.trim(),
      currencyCode: data.currencyCode.toUpperCase(),
      category: data.category || 'other',
      createdAt: now,
      updatedAt: now,
      schemaVersion: 2,
    };

    this.bookRepo.create(book);
    return book;
  }

  updateBook(id: string, data: { name?: string; currencyCode?: string; category?: BusinessCategory }): Book {
    const existing = this.getBook(id);
    const updated: Book = {
      ...existing,
      name: data.name !== undefined ? data.name.trim() : existing.name,
      currencyCode: data.currencyCode !== undefined ? data.currencyCode.toUpperCase() : existing.currencyCode,
      category: data.category !== undefined ? data.category : existing.category,
      updatedAt: new Date().toISOString(),
    };

    this.bookRepo.update(updated);
    return updated;
  }

  deleteBook(id: string): void {
    const deleted = this.bookRepo.delete(id);
    if (!deleted) {
      throw new NotFoundError('Book', id);
    }
  }
}
