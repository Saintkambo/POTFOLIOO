import crypto from 'node:crypto';
import { SqliteBookRepository } from '../../infrastructure/repositories/sqlite-book-repository.js';
import { Book, BusinessCategory } from '../../domain/models/book.js';
import { NotFoundError, ForbiddenError } from '../../domain/errors.js';

export class BookService {
  constructor(private bookRepo = new SqliteBookRepository()) {}

  getBook(id: string, userId?: string): Book {
    const book = this.bookRepo.findById(id);
    if (!book) {
      throw new NotFoundError('Book', id);
    }
    if (userId && book.userId && book.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this book.');
    }
    return book;
  }

  getDefaultBook(userId?: string): Book | null {
    if (userId) {
      const userBooks = this.bookRepo.findByUserId(userId);
      return userBooks[0] || null;
    }
    return this.bookRepo.findFirst();
  }

  listBooks(userId?: string): Book[] {
    return this.bookRepo.list(userId);
  }

  createBook(data: { id?: string; name: string; currencyCode: string; category?: BusinessCategory; userId?: string }): Book {
    const now = new Date().toISOString();
    const book: Book = {
      id: data.id || crypto.randomUUID(),
      name: data.name.trim(),
      currencyCode: data.currencyCode.toUpperCase(),
      category: data.category || 'other',
      userId: data.userId,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 2,
    };

    this.bookRepo.create(book);
    return book;
  }

  updateBook(id: string, data: { name?: string; currencyCode?: string; category?: BusinessCategory }, userId?: string): Book {
    const existing = this.getBook(id, userId);
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

  deleteBook(id: string, userId?: string): void {
    this.getBook(id, userId);
    const deleted = this.bookRepo.delete(id);
    if (!deleted) {
      throw new NotFoundError('Book', id);
    }
  }
}
