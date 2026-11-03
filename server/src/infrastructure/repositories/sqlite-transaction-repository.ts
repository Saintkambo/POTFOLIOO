import { getDb } from '../db/connection.js';
import { Transaction, TransactionType } from '../../domain/models/transaction.js';
import { MonthlySummary } from '../../domain/models/summary.js';

interface TransactionRow {
  id: string;
  book_id: string;
  type: string;
  amount_minor: number;
  transaction_date: string;
  category: string | null;
  note: string | null;
  tenant_name?: string | null;
  room_number?: string | null;
  phone_number?: string | null;
  charge_per_room?: number | null;
  months_paid?: number | null;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    bookId: row.book_id,
    type: row.type as TransactionType,
    amountMinor: Number(row.amount_minor),
    transactionDate: row.transaction_date,
    category: row.category,
    note: row.note,
    tenantName: row.tenant_name,
    roomNumber: row.room_number,
    phoneNumber: row.phone_number,
    chargePerRoom: row.charge_per_room ? Number(row.charge_per_room) : null,
    monthsPaid: row.months_paid !== null && row.months_paid !== undefined ? Number(row.months_paid) : null,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteTransactionRepository {
  findById(id: string): Transaction | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as unknown as TransactionRow | undefined;
    return row ? mapRowToTransaction(row) : null;
  }

  listByBook(
    bookId: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      type?: TransactionType;
      category?: string;
      limit?: number;
      offset?: number;
    }
  ): Transaction[] {
    const db = getDb();
    const conditions: string[] = ['book_id = ?'];
    const params: (string | number)[] = [bookId];

    if (filters?.startDate) {
      conditions.push('transaction_date >= ?');
      params.push(filters.startDate);
    }
    if (filters?.endDate) {
      conditions.push('transaction_date <= ?');
      params.push(filters.endDate);
    }
    if (filters?.type) {
      conditions.push('type = ?');
      params.push(filters.type);
    }
    if (filters?.category) {
      conditions.push('category = ?');
      params.push(filters.category);
    }

    let query = `
      SELECT * FROM transactions
      WHERE ${conditions.join(' AND ')}
      ORDER BY transaction_date DESC, created_at DESC
    `;

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      if (filters?.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const rows = db.prepare(query).all(...params) as unknown as TransactionRow[];
    return rows.map(mapRowToTransaction);
  }

  create(tx: Transaction): void {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO transactions (
        id, book_id, type, amount_minor, transaction_date, category, note,
        tenant_name, room_number, phone_number, charge_per_room, months_paid, due_date,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      tx.id,
      tx.bookId,
      tx.type,
      tx.amountMinor,
      tx.transactionDate,
      tx.category,
      tx.note,
      tx.tenantName ?? null,
      tx.roomNumber ?? null,
      tx.phoneNumber ?? null,
      tx.chargePerRoom ?? null,
      tx.monthsPaid ?? null,
      tx.dueDate ?? null,
      tx.createdAt,
      tx.updatedAt
    );
  }

  update(tx: Transaction): void {
    const db = getDb();
    const stmt = db.prepare(`
      UPDATE transactions
      SET type = ?, amount_minor = ?, transaction_date = ?, category = ?, note = ?,
          tenant_name = ?, room_number = ?, phone_number = ?, charge_per_room = ?, months_paid = ?, due_date = ?,
          updated_at = ?
      WHERE id = ? AND book_id = ?
    `);
    stmt.run(
      tx.type,
      tx.amountMinor,
      tx.transactionDate,
      tx.category,
      tx.note,
      tx.tenantName ?? null,
      tx.roomNumber ?? null,
      tx.phoneNumber ?? null,
      tx.chargePerRoom ?? null,
      tx.monthsPaid ?? null,
      tx.dueDate ?? null,
      tx.updatedAt,
      tx.id,
      tx.bookId
    );
  }

  delete(id: string, bookId?: string): boolean {
    const db = getDb();
    let query = 'DELETE FROM transactions WHERE id = ?';
    const params: string[] = [id];

    if (bookId) {
      query += ' AND book_id = ?';
      params.push(bookId);
    }

    const stmt = db.prepare(query);
    const result = stmt.run(...params);
    return result.changes > 0;
  }

  countByBook(bookId: string): number {
    const db = getDb();
    const row = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE book_id = ?').get(bookId) as unknown as { count: number };
    return row.count;
  }

  getMonthlySummary(bookId: string, monthYear: string, startDate: string, endDate: string): MonthlySummary {
    const db = getDb();
    const rows = db.prepare(`
      SELECT 
        type, 
        COALESCE(SUM(amount_minor), 0) as total, 
        COUNT(*) as count
      FROM transactions
      WHERE book_id = ? AND transaction_date >= ? AND transaction_date <= ?
      GROUP BY type
    `).all(bookId, startDate, endDate) as unknown as Array<{ type: string; total: number; count: number }>;

    let totalIncomeMinor = 0;
    let totalExpenseMinor = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    for (const row of rows) {
      if (row.type === 'income') {
        totalIncomeMinor = Number(row.total);
        incomeCount = Number(row.count);
      } else if (row.type === 'expense') {
        totalExpenseMinor = Number(row.total);
        expenseCount = Number(row.count);
      }
    }

    return {
      monthYear,
      totalIncomeMinor,
      totalExpenseMinor,
      netProfitMinor: totalIncomeMinor - totalExpenseMinor,
      transactionCount: incomeCount + expenseCount,
      incomeCount,
      expenseCount,
    };
  }
}
