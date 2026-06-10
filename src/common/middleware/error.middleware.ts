import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger';
import { FSDError } from '../errors/fsdErrors';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError | FSDError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log technical details (never sent to user)
  logger.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
  });

  // FSD-compliant error handling
  if (err instanceof FSDError) {
    // Log technical details separately for debugging
    if (err.technicalDetails) {
      logger.error('Technical details:', {
        errorId: err.errorId,
        details: err.technicalDetails,
      });
    }

    // Return user-friendly message with error ID
    return res.status(err.statusCode).json({
      success: false,
      errorId: err.errorId,
      message: err.userMessage,
    });
  }

  // Legacy AppError support
  if (err instanceof AppError || (err as any).isOperational) {
    return res.status((err as any).statusCode || 500).json({
      success: false,
      error: err.message,
    });
  }

  // Default: Generic system error (ERR-SYS-01)
  // NEVER expose technical details to users
  return res.status(500).json({
    success: false,
    errorId: 'ERR-SYS-01',
    message: 'Layanan sedang tidak tersedia. Silakan coba beberapa saat lagi.',
  });
};
