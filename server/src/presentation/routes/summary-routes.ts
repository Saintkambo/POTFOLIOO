import { Router } from 'express';
import { SummaryService } from '../../application/services/summary-service.js';
import { validate } from '../middlewares/validate.js';
import { MonthlySummaryQuerySchema } from '../../application/validation/schemas.js';

export function createSummaryRouter(summaryService = new SummaryService()): Router {
  const router = Router();

  // GET /api/books/:bookId/summary?monthYear=YYYY-MM
  router.get('/:bookId/summary', validate({ query: MonthlySummaryQuerySchema }), (req, res, next) => {
    try {
      const bookId = req.params.bookId as string;
      const monthYear = req.query.monthYear as string;
      const summary = summaryService.getMonthlySummary(bookId, monthYear);
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
