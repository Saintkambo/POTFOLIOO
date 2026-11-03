import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const { method, url } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    // Log only method, sanitized path, status code, and latency (NO financial data, notes, or request payload)
    console.log(`[HTTP] ${method} ${url.split('?')[0]} ${status} (${duration}ms)`);
  });

  next();
}
