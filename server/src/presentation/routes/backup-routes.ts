import { Router, Request, Response, NextFunction } from 'express';
import { BackupService } from '../../infrastructure/backup/backup-service.js';
import { serializeTransactionsToCsv } from '../../infrastructure/backup/csv-serializer.js';
import { SqliteTransactionRepository } from '../../infrastructure/repositories/sqlite-transaction-repository.js';
import { SqliteBookRepository } from '../../infrastructure/repositories/sqlite-book-repository.js';
import { validate } from '../middlewares/validate.js';
import { requireApiKey, requireAuth } from '../middlewares/auth.js';
import { RestoreBackupSchema } from '../../application/validation/schemas.js';
import { NotFoundError, ForbiddenError } from '../../domain/errors.js';

export function createBackupRouter(
  backupService = new BackupService(),
  bookRepo = new SqliteBookRepository(),
  txRepo = new SqliteTransactionRepository()
): Router {
  const router = Router();

  // GET /api/books/:bookId/backup/export
  router.get('/books/:bookId/backup/export', requireAuth, (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const bookId = req.params.bookId as string;
      const book = bookRepo.findById(bookId);
      if (!book) {
        throw new NotFoundError('Book', bookId);
      }
      if (userId && book.userId && book.userId !== userId) {
        throw new ForbiddenError('You do not have permission to export this book.');
      }

      const backup = backupService.exportBackup(bookId);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="potfolioo-backup-${bookId}-${new Date().toISOString().slice(0, 10)}.json"`
      );
      res.json(backup);
    } catch (err) {
      next(err);
    }
  });

  // POST /api/backup/restore (Atomic backup restore)
  router.post(
    '/backup/restore',
    requireApiKey,
    validate({ body: RestoreBackupSchema }),
    (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = backupService.restoreBackup(req.body);
        res.json({ success: true, data: result });
      } catch (err) {
        next(err);
      }
    }
  );

  // GET /api/books/:bookId/export/csv
  router.get('/books/:bookId/export/csv', requireAuth, (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const bookId = req.params.bookId as string;
      const book = bookRepo.findById(bookId);
      if (!book) {
        throw new NotFoundError('Book', bookId);
      }
      if (userId && book.userId && book.userId !== userId) {
        throw new ForbiddenError('You do not have permission to export this book.');
      }

      const transactions = txRepo.listByBook(bookId);
      const csv = serializeTransactionsToCsv(transactions, book.currencyCode);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="potfolioo-${book.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv"`
      );
      res.send(csv);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
