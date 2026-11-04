import { SqliteTransactionRepository } from '../../infrastructure/repositories/sqlite-transaction-repository.js';
import { SqliteBookRepository } from '../../infrastructure/repositories/sqlite-book-repository.js';
import { MonthlySummary } from '../../domain/models/summary.js';
import { NotFoundError, ForbiddenError } from '../../domain/errors.js';

export class SummaryService {
  constructor(
    private txRepo = new SqliteTransactionRepository(),
    private bookRepo = new SqliteBookRepository()
  ) {}

  getMonthlySummary(bookId: string, monthYear: string, userId?: string): MonthlySummary {
    const book = this.bookRepo.findById(bookId);
    if (!book) {
      throw new NotFoundError('Book', bookId);
    }
    if (userId && book.userId && book.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access summaries for this book.');
    }

    const [yearStr, monthStr] = monthYear.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    // Calculate last day of calendar month
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${monthYear}-01`;
    const endDate = `${monthYear}-${String(lastDay).padStart(2, '0')}`;

    return this.txRepo.getMonthlySummary(bookId, monthYear, startDate, endDate);
  }
}
