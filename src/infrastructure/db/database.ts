import Dexie, { type Table } from 'dexie';
import { Book } from '../../domain/models/book';
import { Transaction } from '../../domain/models/transaction';
import { InventoryItem } from '../../domain/models/inventory';
import { UserProfile as AuthUserProfile } from '../../domain/models/auth';
import { Business, BusinessMember, UserProfile } from '../../domain/models/business';

export interface SecurityPinRecord {
  userId: string;
  pinHash: string;
  salt: string;
  enabled: boolean;
  failedAttempts?: number;
  lockedUntil?: number;
}

export class PotfoliooDB extends Dexie {
  books!: Table<Book, string>;
  transactions!: Table<Transaction, string>;
  inventoryItems!: Table<InventoryItem, string>;
  userProfiles!: Table<AuthUserProfile | UserProfile, string>;
  securityPins!: Table<SecurityPinRecord, string>;
  businesses!: Table<Business, string>;
  businessMembers!: Table<BusinessMember, string>;

  constructor() {
    super('PotfoliooDB');

    // Schema version 1: Base MVP schema
    this.version(1).stores({
      books: 'id, name, currencyCode, schemaVersion',
      transactions: 'id, bookId, type, transactionDate, [bookId+transactionDate], [bookId+type]',
    });

    // Schema version 2: Multi-business categories & Rental business fields
    this.version(2).stores({
      books: 'id, name, currencyCode, category, schemaVersion',
      transactions: 'id, bookId, type, transactionDate, dueDate, roomNumber, [bookId+transactionDate], [bookId+type], [bookId+dueDate]',
    }).upgrade((tx) => {
      // Default existing books to 'other'
      return tx.table('books').toCollection().modify((book) => {
        if (!book.category) {
          book.category = 'other';
        }
        book.schemaVersion = 2;
      });
    });

    // Schema version 3: Retail / Wholesale Inventory Management & Sales
    this.version(3).stores({
      books: 'id, name, currencyCode, category, schemaVersion',
      transactions: 'id, bookId, type, transactionDate, dueDate, roomNumber, itemId, [bookId+transactionDate], [bookId+type], [bookId+dueDate], [bookId+itemId]',
      inventoryItems: 'id, bookId, name, status, [bookId+status], [bookId+name]',
    });

    // Schema version 4: Normalize currency to TZS for all books
    this.version(4).stores({
      books: 'id, name, currencyCode, category, schemaVersion',
      transactions: 'id, bookId, type, transactionDate, dueDate, roomNumber, itemId, [bookId+transactionDate], [bookId+type], [bookId+dueDate], [bookId+itemId]',
      inventoryItems: 'id, bookId, name, status, [bookId+status], [bookId+name]',
    }).upgrade((tx) => {
      return tx.table('books').toCollection().modify((book) => {
        if (!book.currencyCode || book.currencyCode === 'USD') {
          book.currencyCode = 'TZS';
        }
        book.schemaVersion = 4;
      });
    });

    // Schema version 5: Secure user profiles, device PIN lock, and user-scoped books
    this.version(5).stores({
      books: 'id, name, currencyCode, category, userId, schemaVersion',
      transactions: 'id, bookId, type, transactionDate, dueDate, roomNumber, itemId, [bookId+transactionDate], [bookId+type], [bookId+dueDate], [bookId+itemId]',
      inventoryItems: 'id, bookId, name, status, [bookId+status], [bookId+name]',
      userProfiles: 'id, username, email, phone, provider',
      securityPins: 'userId',
    });

    // Schema version 6: Multi-business architecture, business memberships, and business-scoped ledgers
    this.version(6).stores({
      books: 'id, name, currencyCode, category, userId, businessId, schemaVersion',
      transactions: 'id, bookId, businessId, type, transactionDate, dueDate, roomNumber, itemId, [bookId+transactionDate], [bookId+type], [bookId+dueDate], [bookId+itemId], [businessId+transactionDate]',
      inventoryItems: 'id, bookId, businessId, name, status, [bookId+status], [bookId+name], [businessId+status]',
      userProfiles: 'id, username, email, phone, provider, fullName',
      securityPins: 'userId',
      businesses: 'id, name, type, category, currencyCode, updatedAt',
      businessMembers: 'id, businessId, userId, role, [businessId+userId]',
    });
  }
}

// Singleton database instance
export const db = new PotfoliooDB();
