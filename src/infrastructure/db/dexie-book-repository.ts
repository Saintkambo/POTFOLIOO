import { BookRepositoryPort } from '../../application/ports/book-repository';
import { Book, BusinessCategory } from '../../domain/models/book';
import { db } from './database';
import { StorageError } from '../../domain/errors';

export class DexieBookRepository implements BookRepositoryPort {
  async getActiveBook(): Promise<Book | null> {
    try {
      // Check for last active book ID stored in localStorage
      const lastActiveId = localStorage.getItem('potfolioo_active_book_id');
      if (lastActiveId) {
        const found = await db.books.get(lastActiveId);
        if (found) {
          if (!found.currencyCode || found.currencyCode === 'USD') {
            found.currencyCode = 'TZS';
            await db.books.update(found.id, { currencyCode: 'TZS', updatedAt: new Date().toISOString() });
          }
          return found;
        }
      }
      const books = await db.books.toArray();
      const first = books[0] || null;
      if (first && (!first.currencyCode || first.currencyCode === 'USD')) {
        first.currencyCode = 'TZS';
        await db.books.update(first.id, { currencyCode: 'TZS', updatedAt: new Date().toISOString() });
      }
      return first;
    } catch (err) {
      throw new StorageError('Failed to read active book from local storage', err);
    }
  }

  async getAllBooks(): Promise<Book[]> {
    try {
      const books = await db.books.toArray();
      return books.map((b) => {
        if (!b.currencyCode || b.currencyCode === 'USD') {
          b.currencyCode = 'TZS';
          db.books.update(b.id, { currencyCode: 'TZS', updatedAt: new Date().toISOString() }).catch(() => {});
        }
        return b;
      });
    } catch (err) {
      throw new StorageError('Failed to list all books', err);
    }
  }

  async getBookById(id: string): Promise<Book | null> {
    try {
      const book = await db.books.get(id);
      if (book && (!book.currencyCode || book.currencyCode === 'USD')) {
        book.currencyCode = 'TZS';
        await db.books.update(book.id, { currencyCode: 'TZS', updatedAt: new Date().toISOString() });
      }
      return book || null;
    } catch (err) {
      throw new StorageError('Failed to get book by id', err);
    }
  }

  async saveBook(book: Book): Promise<void> {
    try {
      await db.books.put(book);
      localStorage.setItem('potfolioo_active_book_id', book.id);
    } catch (err) {
      throw new StorageError('Failed to save book to local storage', err);
    }
  }

  async updateBookName(id: string, name: string): Promise<void> {
    try {
      await db.books.update(id, { name: name.trim(), updatedAt: new Date().toISOString() });
    } catch (err) {
      throw new StorageError('Failed to update book name', err);
    }
  }

  async updateBookCategory(id: string, category: BusinessCategory): Promise<void> {
    try {
      await db.books.update(id, { category, updatedAt: new Date().toISOString() });
    } catch (err) {
      throw new StorageError('Failed to update book category', err);
    }
  }

  async updateCurrency(id: string, currencyCode: string): Promise<void> {
    try {
      await db.books.update(id, { currencyCode, updatedAt: new Date().toISOString() });
    } catch (err) {
      throw new StorageError('Failed to update book currency', err);
    }
  }

  async updateLowStockThreshold(id: string, lowStockThreshold: number): Promise<void> {
    try {
      await db.books.update(id, { lowStockThreshold, updatedAt: new Date().toISOString() });
    } catch (err) {
      throw new StorageError('Failed to update low stock threshold', err);
    }
  }

  async getBooksByUserId(userId: string): Promise<Book[]> {
    try {
      const books = await db.books.where('userId').equals(userId).toArray();
      return books.map((b) => {
        if (!b.currencyCode || b.currencyCode === 'USD') {
          b.currencyCode = 'TZS';
        }
        return b;
      });
    } catch (err) {
      throw new StorageError('Failed to get books for user', err);
    }
  }

  async getActiveBookForUser(userId: string): Promise<Book | null> {
    try {
      const lastActiveId = localStorage.getItem(`potfolioo_active_book_${userId}`);
      if (lastActiveId) {
        const found = await db.books.get(lastActiveId);
        if (found && found.userId === userId) {
          if (!found.currencyCode || found.currencyCode === 'USD') {
            found.currencyCode = 'TZS';
          }
          return found;
        }
      }
      const userBooks = await this.getBooksByUserId(userId);
      return userBooks[0] || null;
    } catch (err) {
      throw new StorageError('Failed to get active book for user', err);
    }
  }

  async assignBooksToUser(userId: string): Promise<number> {
    try {
      const unassigned = await db.books.filter((b) => !b.userId).toArray();
      let count = 0;
      for (const b of unassigned) {
        await db.books.update(b.id, { userId, updatedAt: new Date().toISOString() });
        count++;
      }
      return count;
    } catch (err) {
      throw new StorageError('Failed to assign unassigned books to user', err);
    }
  }

  async deleteBook(id: string): Promise<void> {
    try {
      await db.transaction('rw', db.books, db.transactions, db.inventoryItems, async () => {
        await db.books.delete(id);
        await db.transactions.where('bookId').equals(id).delete();
        await db.inventoryItems.where('bookId').equals(id).delete();
      });
      const activeId = localStorage.getItem('potfolioo_active_book_id');
      if (activeId === id) {
        localStorage.removeItem('potfolioo_active_book_id');
      }
    } catch (err) {
      throw new StorageError('Failed to delete book and its records', err);
    }
  }
}
