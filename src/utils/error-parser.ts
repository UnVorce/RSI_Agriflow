/**
 * Error Parser Utility
 * Converts Prisma and database errors into user-friendly messages
 */

import { Prisma } from '@prisma/client';

/**
 * Parse Prisma error and return user-friendly message
 */
export function parsePrismaError(error: any): { message: string; statusCode: number } {
  // Already an AppError - pass through
  if (error.isOperational) {
    return {
      message: error.message,
      statusCode: error.statusCode || 500,
    };
  }

  // Handle Prisma-specific errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2000':
        return {
          message: 'Nilai input terlalu panjang',
          statusCode: 400,
        };
      case 'P2001':
        return {
          message: 'Data tidak ditemukan',
          statusCode: 404,
        };
      case 'P2002':
        return {
          message: 'Data sudah ada (duplikat)',
          statusCode: 409,
        };
      case 'P2003':
        return {
          message: 'Referensi data tidak valid',
          statusCode: 400,
        };
      case 'P2025':
        return {
          message: 'Data tidak ditemukan',
          statusCode: 404,
        };
      default:
        return {
          message: 'Terjadi kesalahan pada database',
          statusCode: 500,
        };
    }
  }

  // Handle raw SQL errors from stored procedures
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return {
      message: 'Terjadi kesalahan sistem',
      statusCode: 500,
    };
  }

  // Handle validation errors from Prisma
  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      message: 'Data input tidak valid',
      statusCode: 400,
    };
  }

  // Parse SQL Server errors (from stored procedures)
  const errorMessage = error.message || '';

  // Stok tidak mencukupi
  if (
    errorMessage.includes('Stok tidak mencukupi') ||
    errorMessage.includes('insufficient stock') ||
    errorMessage.includes('Stok saat ini')
  ) {
    return {
      message: 'Stok tidak mencukupi',
      statusCode: 400,
    };
  }

  // Invalid amount
  if (
    errorMessage.includes('harus lebih dari 0') ||
    errorMessage.includes('must be greater than 0') ||
    errorMessage.includes('amount must be')
  ) {
    return {
      message: 'Jumlah harus lebih dari 0',
      statusCode: 400,
    };
  }

  // Invalid pengecer/petani/user
  if (
    errorMessage.includes('tidak ditemukan') ||
    errorMessage.includes('not found') ||
    errorMessage.includes('tidak valid') ||
    errorMessage.includes('invalid')
  ) {
    return {
      message: errorMessage.includes('Pengecer')
        ? 'Pengecer tidak ditemukan'
        : errorMessage.includes('Petani')
        ? 'Petani tidak ditemukan'
        : errorMessage.includes('User')
        ? 'User tidak ditemukan'
        : 'Data tidak ditemukan',
      statusCode: 400,
    };
  }

  // Quota exceeded
  if (errorMessage.includes('kuota') || errorMessage.includes('quota')) {
    return {
      message: 'Kuota terlampaui',
      statusCode: 400,
    };
  }

  // Amount mismatch
  if (errorMessage.includes('tidak sesuai') || errorMessage.includes('mismatch')) {
    return {
      message: 'Jumlah tidak sesuai',
      statusCode: 400,
    };
  }

  // SQL injection detected
  if (
    errorMessage.includes('DROP TABLE') ||
    errorMessage.includes('DELETE FROM') ||
    errorMessage.includes('EXEC ') ||
    errorMessage.includes('UNION SELECT')
  ) {
    return {
      message: 'Input tidak valid',
      statusCode: 400,
    };
  }

  // Generic Prisma query error - extract meaningful part
  if (errorMessage.includes('prisma.$queryRaw')) {
    // Extract the SQL error message after "Message:"
    const messageMatch = errorMessage.match(/Message: `([^`]+)`/);
    if (messageMatch) {
      return {
        message: messageMatch[1],
        statusCode: 400,
      };
    }
    
    // Extract error after "Raw query failed"
    const rawMatch = errorMessage.match(/Raw query failed\. Code: `\d+`\. Message: `([^`]+)`/);
    if (rawMatch) {
      return {
        message: rawMatch[1],
        statusCode: 400,
      };
    }
  }

  // Default generic error
  return {
    message: 'Terjadi kesalahan pada server',
    statusCode: 500,
  };
}

/**
 * Extract clean error message from error object
 */
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error) return error.error;
  return 'Terjadi kesalahan tidak dikenal';
}
