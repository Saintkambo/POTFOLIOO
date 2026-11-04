import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../../application/services/auth-service.js';
import { getDb } from '../../infrastructure/db/connection.js';
import { UnauthorizedError, ValidationError } from '../../domain/errors.js';

export function createAuthRouter(): Router {
  const router = Router();

  // Middleware to authenticate Bearer session token
  const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Missing or invalid Authorization header.'));
    }
    const token = authHeader.substring(7).trim();
    const user = await authService.authenticateByToken(token);
    if (!user) {
      return next(new UnauthorizedError('Invalid or expired session token. Please log in again.'));
    }
    (req as any).user = user;
    next();
  };

  // 1. User Registration
  router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password, email, fullName, contact, contactType, verificationCode } = req.body;
      if (!username || !password) {
        throw new ValidationError('fields', 'Username and password are required.');
      }
      const result = await authService.register({
        username,
        password,
        email: email || (contactType === 'email' ? contact : undefined),
        fullName,
        contact,
        contactType,
        verificationCode,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  });

  // 2. User Login
  router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        throw new ValidationError('credentials', 'Username/Email/Phone and password are required.');
      }
      const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || 'default';
      const result = await authService.login(identifier, password, clientIp);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  });

  // 3. Google Sign-In
  router.post('/google', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { googleId, email, name } = req.body;
      if (!email) {
        throw new ValidationError('email', 'Email is required for Google Sign-In.');
      }
      const result = await authService.googleAuth({
        googleId: googleId || `goog_${Date.now()}`,
        email,
        name,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  });

  // 4. Password Recovery Request (Does NOT reveal whether an account exists)
  router.post('/recover-request', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contact } = req.body;
      if (!contact) {
        throw new ValidationError('contact', 'Email or phone number is required.');
      }
      const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || 'default';
      const result = await authService.requestPasswordRecovery(contact, clientIp);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  });

  // 5. Password Recovery Verify & Reset
  router.post('/recover-verify', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contact, code, newPassword } = req.body;
      if (!contact || !code || !newPassword) {
        throw new ValidationError('fields', 'Contact, recovery code, and new password are required.');
      }
      const result = await authService.verifyPasswordRecovery({
        contact,
        code,
        newPassword,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  });

  // 6. Get Current Authenticated Profile
  router.get('/me', authenticate, async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: (req as any).user,
    });
  });

  // 7. Set / Update 4-Digit Device App Lock PIN
  router.post('/pin', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { pin } = req.body;
      if (!pin) {
        throw new ValidationError('pin', '4-digit PIN is required.');
      }
      const updatedUser = await authService.setPin(user.id, pin);

      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  });

  // 8. Remove PIN
  router.post('/pin-remove', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const updatedUser = await authService.removePin(user.id);

      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  });

  // 9. Verify PIN
  router.post('/pin-verify', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { pin } = req.body;
      if (!pin) {
        throw new ValidationError('pin', 'PIN is required.');
      }
      const isValid = await authService.verifyPin(user.id, pin);

      res.json({
        success: true,
        data: { isValid },
      });
    } catch (err) {
      next(err);
    }
  });

  // 10. User Cloud Data Sync: Push and Pull User Scoped Data
  router.post('/sync', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const db = getDb();
      const { books = [], transactions = [], inventoryItems = [] } = req.body;

      // 1. Save / Upsert pushed user books
      for (const b of books) {
        const existing = db.prepare('SELECT id, updated_at FROM books WHERE id = ?').get(b.id) as
          | { id: string; updated_at: string }
          | undefined;

        if (!existing) {
          db.prepare(`
            INSERT INTO books (id, name, currency_code, category, user_id, created_at, updated_at, schema_version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(b.id, b.name, b.currencyCode || 'TZS', b.category || 'other', user.id, b.createdAt, b.updatedAt, b.schemaVersion || 4);
        } else if (new Date(b.updatedAt) >= new Date(existing.updated_at)) {
          db.prepare(`
            UPDATE books
            SET name = ?, currency_code = ?, category = ?, user_id = ?, updated_at = ?, schema_version = ?
            WHERE id = ?
          `).run(b.name, b.currencyCode || 'TZS', b.category || 'other', user.id, b.updatedAt, b.schemaVersion || 4, b.id);
        }
      }

      // 2. Save / Upsert pushed user transactions
      for (const t of transactions) {
        const existing = db.prepare('SELECT id, updated_at FROM transactions WHERE id = ?').get(t.id) as
          | { id: string; updated_at: string }
          | undefined;

        if (!existing) {
          db.prepare(`
            INSERT INTO transactions (
              id, book_id, type, amount_minor, transaction_date, category, note,
              tenant_name, room_number, phone_number, charge_per_room, months_paid, due_date,
              item_id, item_name, quantity_sold, unit_price_minor, unit_cost_minor, cogs_minor,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            t.id, t.bookId, t.type, t.amountMinor, t.transactionDate, t.category || null, t.note || null,
            t.tenantName || null, t.roomNumber || null, t.phoneNumber || null, t.chargePerRoom || null,
            t.monthsPaid || null, t.dueDate || null, t.itemId || null, t.itemName || null,
            t.quantitySold || null, t.unitPriceMinor || null, t.unitCostMinor || null, t.cogsMinor || null,
            t.createdAt, t.updatedAt
          );
        } else if (new Date(t.updatedAt) >= new Date(existing.updated_at)) {
          db.prepare(`
            UPDATE transactions
            SET type = ?, amount_minor = ?, transaction_date = ?, category = ?, note = ?,
                tenant_name = ?, room_number = ?, phone_number = ?, charge_per_room = ?,
                months_paid = ?, due_date = ?, item_id = ?, item_name = ?, quantity_sold = ?,
                unit_price_minor = ?, unit_cost_minor = ?, cogs_minor = ?, updated_at = ?
            WHERE id = ?
          `).run(
            t.type, t.amountMinor, t.transactionDate, t.category || null, t.note || null,
            t.tenantName || null, t.roomNumber || null, t.phoneNumber || null, t.chargePerRoom || null,
            t.monthsPaid || null, t.dueDate || null, t.itemId || null, t.itemName || null,
            t.quantitySold || null, t.unitPriceMinor || null, t.unitCostMinor || null, t.cogsMinor || null,
            t.updatedAt, t.id
          );
        }
      }

      // 3. Save / Upsert pushed user inventory items
      for (const item of inventoryItems) {
        const existing = db.prepare('SELECT id, updated_at FROM inventory_items WHERE id = ?').get(item.id) as
          | { id: string; updated_at: string }
          | undefined;

        if (!existing) {
          db.prepare(`
            INSERT INTO inventory_items (id, book_id, name, current_quantity, avg_purchase_price_minor, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(item.id, item.bookId, item.name, item.currentQuantity, item.avgPurchasePriceMinor, item.status, item.createdAt, item.updatedAt);
        } else if (new Date(item.updatedAt) >= new Date(existing.updated_at)) {
          db.prepare(`
            UPDATE inventory_items
            SET name = ?, current_quantity = ?, avg_purchase_price_minor = ?, status = ?, updated_at = ?
            WHERE id = ?
          `).run(item.name, item.currentQuantity, item.avgPurchasePriceMinor, item.status, item.updatedAt, item.id);
        }
      }

      // 4. Fetch all remote records for this user to return back to client
      const userBooks = db.prepare('SELECT * FROM books WHERE user_id = ?').all(user.id) as any[];
      const userBookIds = userBooks.map((b) => b.id);

      let remoteTxns: any[] = [];
      let remoteItems: any[] = [];

      if (userBookIds.length > 0) {
        const placeholders = userBookIds.map(() => '?').join(',');
        remoteTxns = db.prepare(`SELECT * FROM transactions WHERE book_id IN (${placeholders})`).all(...userBookIds) as any[];
        remoteItems = db.prepare(`SELECT * FROM inventory_items WHERE book_id IN (${placeholders})`).all(...userBookIds) as any[];
      }

      res.json({
        success: true,
        data: {
          books: userBooks.map((b) => ({
            id: b.id,
            name: b.name,
            currencyCode: b.currency_code,
            category: b.category,
            userId: b.user_id,
            schemaVersion: b.schema_version,
            createdAt: b.created_at,
            updatedAt: b.updated_at,
          })),
          transactions: remoteTxns.map((t) => ({
            id: t.id,
            bookId: t.book_id,
            type: t.type,
            amountMinor: t.amount_minor,
            transactionDate: t.transaction_date,
            category: t.category,
            note: t.note,
            tenantName: t.tenant_name,
            roomNumber: t.room_number,
            phoneNumber: t.phone_number,
            chargePerRoom: t.charge_per_room,
            monthsPaid: t.months_paid,
            dueDate: t.due_date,
            itemId: t.item_id,
            itemName: t.item_name,
            quantitySold: t.quantity_sold,
            unitPriceMinor: t.unit_price_minor,
            unitCostMinor: t.unit_cost_minor,
            cogsMinor: t.cogs_minor,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
          })),
          inventoryItems: remoteItems.map((i) => ({
            id: i.id,
            bookId: i.book_id,
            name: i.name,
            currentQuantity: i.current_quantity,
            avgPurchasePriceMinor: i.avg_purchase_price_minor,
            status: i.status,
            createdAt: i.created_at,
            updatedAt: i.updated_at,
          })),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
