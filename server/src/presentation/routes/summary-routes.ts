import { Router, Request, Response, NextFunction } from 'express';
import { SummaryService } from '../../application/services/summary-service.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { MonthlySummaryQuerySchema } from '../../application/validation/schemas.js';

export function createSummaryRouter(summaryService = new SummaryService()): Router {
  const router = Router();

  // Enforce authentication on summary routes
  router.use(requireAuth);

  // GET /api/books/:bookId/summary?monthYear=YYYY-MM
  router.get('/:bookId/summary', validate({ query: MonthlySummaryQuerySchema }), (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const bookId = req.params.bookId as string;
      const monthYear = req.query.monthYear as string;
      const summary = summaryService.getMonthlySummary(bookId, monthYear, userId);
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
