export class AppError extends Error {
  constructor(message, { code = 'UNKNOWN', cause, context } = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.cause = cause;
    this.context = context;
  }
}

export class DatabaseError extends AppError {
  constructor(message, options) {
    super(message, { ...options, code: options?.code ?? 'DATABASE_ERROR' });
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends AppError {
  constructor(message, options) {
    super(message, { ...options, code: options?.code ?? 'VALIDATION_ERROR' });
    this.name = 'ValidationError';
  }
}
