import { Router, Request, Response, NextFunction } from 'express';
import { TransactionService } from '../../application/services/transaction-service.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  ListTransactionsQuerySchema,
} from '../../application/validation/schemas.js';

export function createTransactionRouter(txService = new TransactionService()): Router {
  const router = Router();

  // Enforce authentication on all transaction routes
  router.use(requireAuth);

  // GET /api/books/:bookId/transactions
  router.get('/books/:bookId/transactions', validate({ query: ListTransactionsQuerySchema }), (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const transactions = txService.listTransactions(req.params.bookId as string, req.query as any, userId);
      res.json({ success: true, data: transactions });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/transactions/:id
  router.get('/transactions/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const tx = txService.getTransaction(req.params.id as string, userId);
      res.json({ success: true, data: tx });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/transactions
  router.post('/transactions', validate({ body: CreateTransactionSchema }), (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const tx = txService.createTransaction(req.body, userId);
      res.status(201).json({ success: true, data: tx });
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/transactions/:id
  router.put('/transactions/:id', validate({ body: UpdateTransactionSchema }), (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const tx = txService.updateTransaction(req.params.id as string, req.body, userId);
      res.json({ success: true, data: tx });
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/transactions/:id
  router.delete('/transactions/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      txService.deleteTransaction(req.params.id as string, undefined, userId);
      res.json({ success: true, message: 'Transaction deleted successfully' });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
