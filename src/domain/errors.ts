export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(public readonly field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class StorageError extends DomainError {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

export class BackupCorruptError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'BackupCorruptError';
  }
}
