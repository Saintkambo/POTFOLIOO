import { Router, Request, Response, NextFunction } from 'express';
import { BookService } from '../../application/services/book-service.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/auth.js';
import { CreateBookSchema, UpdateBookSchema } from '../../application/validation/schemas.js';

export function createBookRouter(bookService = new BookService()): Router {
  const router = Router();

  // Enforce authentication on all book routes
  router.use(requireAuth);

  // GET /api/books
  router.get('/', (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const books = bookService.listBooks(userId);
      res.json({ success: true, data: books });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/books/default
  router.get('/default', (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const book = bookService.getDefaultBook(userId);
      res.json({ success: true, data: book });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/books/:id
  router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const book = bookService.getBook(req.params.id as string, userId);
      res.json({ success: true, data: book });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/books
  router.post('/', validate({ body: CreateBookSchema }), (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const book = bookService.createBook({
        ...req.body,
        userId,
      });
      res.status(201).json({ success: true, data: book });
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/books/:id
  router.put('/:id', validate({ body: UpdateBookSchema }), (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const updated = bookService.updateBook(req.params.id as string, req.body, userId);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/books/:id
  router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      bookService.deleteBook(req.params.id as string, userId);
      res.json({ success: true, message: 'Book deleted successfully' });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
