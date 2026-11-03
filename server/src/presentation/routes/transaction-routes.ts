import { Router } from 'express';
import { TransactionService } from '../../application/services/transaction-service.js';
import { validate } from '../middlewares/validate.js';
import {
  CreateTransactionSchema,
  UpdateTransactionSchema,
  ListTransactionsQuerySchema,
} from '../../application/validation/schemas.js';

export function createTransactionRouter(txService = new TransactionService()): Router {
  const router = Router();

  // GET /api/books/:bookId/transactions
  router.get('/books/:bookId/transactions', validate({ query: ListTransactionsQuerySchema }), (req, res, next) => {
    try {
      const transactions = txService.listTransactions(req.params.bookId as string, req.query as any);
      res.json({ success: true, data: transactions });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/transactions/:id
  router.get('/transactions/:id', (req, res, next) => {
    try {
      const tx = txService.getTransaction(req.params.id as string);
      res.json({ success: true, data: tx });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/transactions
  router.post('/transactions', validate({ body: CreateTransactionSchema }), (req, res, next) => {
    try {
      const tx = txService.createTransaction(req.body);
      res.status(201).json({ success: true, data: tx });
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/transactions/:id
  router.put('/transactions/:id', validate({ body: UpdateTransactionSchema }), (req, res, next) => {
    try {
      const tx = txService.updateTransaction(req.params.id as string, req.body);
      res.json({ success: true, data: tx });
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/transactions/:id
  router.delete('/transactions/:id', (req, res, next) => {
    try {
      txService.deleteTransaction(req.params.id as string);
      res.json({ success: true, message: 'Transaction deleted successfully' });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
