import { Router } from 'express';
import { BookService } from '../../application/services/book-service.js';
import { validate } from '../middlewares/validate.js';
import { CreateBookSchema, UpdateBookSchema } from '../../application/validation/schemas.js';

export function createBookRouter(bookService = new BookService()): Router {
  const router = Router();

  // GET /api/books
  router.get('/', (_req, res, next) => {
    try {
      const books = bookService.listBooks();
      res.json({ success: true, data: books });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/books/default
  router.get('/default', (_req, res, next) => {
    try {
      const book = bookService.getDefaultBook();
      res.json({ success: true, data: book });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/books/:id
  router.get('/:id', (req, res, next) => {
    try {
      const book = bookService.getBook(req.params.id as string);
      res.json({ success: true, data: book });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/books
  router.post('/', validate({ body: CreateBookSchema }), (req, res, next) => {
    try {
      const book = bookService.createBook(req.body);
      res.status(201).json({ success: true, data: book });
    } catch (err) {
      next(err);
    }
  });

  // PUT /api/books/:id
  router.put('/:id', validate({ body: UpdateBookSchema }), (req, res, next) => {
    try {
      const updated = bookService.updateBook(req.params.id as string, req.body);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  });

  // DELETE /api/books/:id
  router.delete('/:id', (req, res, next) => {
    try {
      bookService.deleteBook(req.params.id as string);
      res.json({ success: true, message: 'Book deleted successfully' });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
