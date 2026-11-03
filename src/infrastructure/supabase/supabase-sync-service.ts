import { supabase, isSupabaseConfigured } from './supabase-client';
import { Book, BusinessCategory } from '../../domain/models/book';
import { Transaction } from '../../domain/models/transaction';
import { InventoryItem, StockStatus } from '../../domain/models/inventory';
import { db } from '../db/database';

export interface SyncResult {
  success: boolean;
  pushedTransactions: number;
  pulledTransactions: number;
  timestamp: string;
  error?: string;
}

export class SupabaseSyncService {
  /**
   * Check if Supabase connection is healthy
   */
  async checkConnection(): Promise<boolean> {
    if (!supabase || !isSupabaseConfigured) {
      return false;
    }

    try {
      const { error } = await supabase.from('books').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Push active local Book and Transactions to Supabase
   */
  async pushToCloud(book: Book, transactions: Transaction[]): Promise<{ count: number }> {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }

    // 1. Upsert Book
    const { error: bookError } = await supabase.from('books').upsert({
      id: book.id,
      name: book.name,
      currency_code: book.currencyCode,
      category: book.category || 'other',
      schema_version: book.schemaVersion,
      created_at: book.createdAt,
      updated_at: book.updatedAt,
    });

    if (bookError) {
      throw new Error(`Failed to push book to Supabase: ${bookError.message}`);
    }

    // 2. Upsert Transactions in batches of 100
    if (transactions.length > 0) {
      const payload = transactions.map((t) => ({
        id: t.id,
        book_id: t.bookId,
        type: t.type,
        amount_minor: t.amountMinor,
        transaction_date: t.transactionDate,
        category: t.category ?? null,
        note: t.note ?? null,
        tenant_name: t.tenantName ?? null,
        room_number: t.roomNumber ?? null,
        phone_number: t.phoneNumber ?? null,
        charge_per_room: t.chargePerRoom ?? null,
        months_paid: t.monthsPaid ?? null,
        due_date: t.dueDate ?? null,
        item_id: t.itemId ?? null,
        item_name: t.itemName ?? null,
        quantity_sold: t.quantitySold ?? null,
        unit_price_minor: t.unitPriceMinor ?? null,
        unit_cost_minor: t.unitCostMinor ?? null,
        cogs_minor: t.cogsMinor ?? null,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
      }));

      const BATCH_SIZE = 100;
      for (let i = 0; i < payload.length; i += BATCH_SIZE) {
        const batch = payload.slice(i, i + BATCH_SIZE);
        const { error: txnError } = await supabase.from('transactions').upsert(batch, {
          onConflict: 'id',
        });
        if (txnError) {
          throw new Error(`Failed to push transactions to Supabase: ${txnError.message}`);
        }
      }
    }

    // 3. Upsert Inventory Items if retail business
    if (book.category === 'retail') {
      const localItems = await db.inventoryItems.where('bookId').equals(book.id).toArray();
      if (localItems.length > 0) {
        const itemPayload = localItems.map((item) => ({
          id: item.id,
          book_id: item.bookId,
          name: item.name,
          current_quantity: item.currentQuantity,
          avg_purchase_price_minor: item.avgPurchasePriceMinor,
          status: item.status,
          created_at: item.createdAt,
          updated_at: item.updatedAt,
        }));
        const { error: itemError } = await supabase.from('inventory_items').upsert(itemPayload, {
          onConflict: 'id',
        });
        if (itemError) {
          console.warn('Failed to push inventory items to Supabase:', itemError.message);
        }
      }
    }

    return { count: transactions.length };
  }

  /**
   * Pull All Remote Books from Supabase
   */
  async pullAllBooksFromCloud(): Promise<Book[]> {
    if (!supabase || !isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
      if (error || !data) return [];

      const books: Book[] = data.map((row) => ({
        id: row.id,
        name: row.name,
        currencyCode: row.currency_code,
        category: (row.category as BusinessCategory) || 'other',
        schemaVersion: row.schema_version,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      // Reconcile with local DB
      await db.books.bulkPut(books);
      return books;
    } catch (e) {
      console.warn('Failed to pull all books from Supabase:', e);
      return [];
    }
  }

  /**
   * Pull Remote Data for a Book and synchronize with local IndexedDB
   */
  async pullFromCloud(bookId: string): Promise<{ book: Book | null; transactions: Transaction[] }> {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }

    // 1. Fetch Remote Book
    const { data: remoteBookRow, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .maybeSingle();

    if (bookError) {
      throw new Error(`Failed to fetch book from Supabase: ${bookError.message}`);
    }

    if (!remoteBookRow) {
      return { book: null, transactions: [] };
    }

    const remoteBook: Book = {
      id: remoteBookRow.id,
      name: remoteBookRow.name,
      currencyCode: remoteBookRow.currency_code,
      category: (remoteBookRow.category as BusinessCategory) || 'other',
      schemaVersion: remoteBookRow.schema_version,
      createdAt: remoteBookRow.created_at,
      updatedAt: remoteBookRow.updated_at,
    };

    // 2. Fetch Remote Transactions
    const { data: remoteTxnRows, error: txnsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('book_id', bookId)
      .order('transaction_date', { ascending: false });

    if (txnsError) {
      throw new Error(`Failed to fetch transactions from Supabase: ${txnsError.message}`);
    }

    const remoteTxns: Transaction[] = (remoteTxnRows || []).map((row) => ({
      id: row.id,
      bookId: row.book_id,
      type: row.type as 'income' | 'expense',
      amountMinor: Number(row.amount_minor),
      transactionDate: row.transaction_date,
      category: row.category ?? undefined,
      note: row.note ?? undefined,
      tenantName: row.tenant_name ?? undefined,
      roomNumber: row.room_number ?? undefined,
      phoneNumber: row.phone_number ?? undefined,
      chargePerRoom: row.charge_per_room ? Number(row.charge_per_room) : undefined,
      monthsPaid: row.months_paid !== null ? Number(row.months_paid) : undefined,
      dueDate: row.due_date ?? undefined,
      itemId: row.item_id ?? undefined,
      itemName: row.item_name ?? undefined,
      quantitySold: row.quantity_sold !== null && row.quantity_sold !== undefined ? Number(row.quantity_sold) : undefined,
      unitPriceMinor: row.unit_price_minor ? Number(row.unit_price_minor) : undefined,
      unitCostMinor: row.unit_cost_minor ? Number(row.unit_cost_minor) : undefined,
      cogsMinor: row.cogs_minor ? Number(row.cogs_minor) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // 3. Atomically reconcile with local IndexedDB
    await db.transaction('rw', db.books, db.transactions, async () => {
      await db.books.put(remoteBook);
      if (remoteTxns.length > 0) {
        await db.transactions.bulkPut(remoteTxns);
      }
    });

    // 4. If retail, pull remote inventory items
    if (remoteBook.category === 'retail') {
      const { data: remoteItemRows } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('book_id', bookId);

      if (remoteItemRows && remoteItemRows.length > 0) {
        const remoteItems: InventoryItem[] = remoteItemRows.map((r) => ({
          id: r.id,
          bookId: r.book_id,
          name: r.name,
          currentQuantity: Number(r.current_quantity),
          avgPurchasePriceMinor: Number(r.avg_purchase_price_minor),
          status: r.status as StockStatus,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
        await db.inventoryItems.bulkPut(remoteItems);
      }
    }

    return { book: remoteBook, transactions: remoteTxns };
  }

  /**
   * Delete a single transaction in Supabase
   */
  async deleteRemoteTransaction(id: string): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('transactions').delete().eq('id', id);
    } catch (e) {
      console.warn('Background Supabase delete failed:', e);
    }
  }

  /**
   * Delete a single inventory item in Supabase
   */
  async deleteRemoteInventoryItem(id: string): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('inventory_items').delete().eq('id', id);
    } catch (e) {
      console.warn('Background Supabase delete inventory item failed:', e);
    }
  }

  /**
   * Delete a book, its transactions, and its inventory items in Supabase
   */
  async deleteRemoteBook(id: string): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('transactions').delete().eq('book_id', id);
      await supabase.from('inventory_items').delete().eq('book_id', id);
      await supabase.from('books').delete().eq('id', id);
    } catch (e) {
      console.warn('Background Supabase delete book failed:', e);
    }
  }

  /**
   * Full 2-Way Sync
   */
  async syncFull(book: Book): Promise<SyncResult> {
    const timestamp = new Date().toISOString();
    try {
      // 1. Fetch all local transactions for this book
      const localTxns = await db.transactions.where('bookId').equals(book.id).toArray();

      // 2. Push local state to Cloud
      await this.pushToCloud(book, localTxns);

      // 3. Pull remote state from Cloud to catch any multi-device changes
      const { transactions: pulledTxns } = await this.pullFromCloud(book.id);

      return {
        success: true,
        pushedTransactions: localTxns.length,
        pulledTransactions: pulledTxns.length,
        timestamp,
      };
    } catch (err) {
      return {
        success: false,
        pushedTransactions: 0,
        pulledTransactions: 0,
        timestamp,
        error: err instanceof Error ? err.message : 'Unknown sync error',
      };
    }
  }
}

export const supabaseSyncService = new SupabaseSyncService();
