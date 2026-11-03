export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, isOperational = true, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = 400;
  public readonly errorCode = 'VALIDATION_ERROR';

  constructor(messageOrField: string, detailsOrMessage?: unknown) {
    if (typeof detailsOrMessage === 'string') {
      super(detailsOrMessage, true, { field: messageOrField });
    } else {
      super(messageOrField, true, detailsOrMessage);
    }
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = 404;
  public readonly errorCode = 'NOT_FOUND';

  constructor(resource: string, id?: string) {
    super(id ? `${resource} with id '${id}' was not found.` : `${resource} was not found.`, true);
  }
}

export class ConflictError extends AppError {
  public readonly statusCode = 409;
  public readonly errorCode = 'CONFLICT';

  constructor(message: string) {
    super(message, true);
  }
}

export class UnauthorizedError extends AppError {
  public readonly statusCode = 401;
  public readonly errorCode = 'UNAUTHORIZED';

  constructor(message = 'Unauthorized: Invalid or missing API authentication credentials.') {
    super(message, true);
  }
}

export class ForbiddenError extends AppError {
  public readonly statusCode = 403;
  public readonly errorCode = 'FORBIDDEN';

  constructor(message = 'Forbidden: You do not have permission to access this resource.') {
    super(message, true);
  }
}

export class DatabaseError extends AppError {
  public readonly statusCode = 500;
  public readonly errorCode = 'DATABASE_ERROR';

  constructor(message: string, details?: unknown) {
    super(message, true, details);
  }
}
