/**
 * FSD Error Handler Utility
 * Maps SQL Server and Prisma errors to FSD-compliant error codes
 * 
 * This utility intelligently parses error messages from stored procedures
 * and database constraints to return user-friendly, specific error messages
 */

import { Prisma } from '@prisma/client';
import {
  FSDError,
  ERR_BUS_01,
  ERR_BUS_02,
  ERR_BUS_03,
  ERR_BUS_04,
  ERR_BUS_05,
  ERR_BUS_06,
  ERR_SYS_01,
  ERR_SYS_03,
  ERR_VAL_01,
  ERR_VAL_02,
  ERR_VAL_03,
  ERR_PENGECER_NOT_FOUND,
  ERR_KIRIMAN_NOT_FOUND,
  ERR_INVALID_AMOUNT,
  ERR_USER_NOT_FOUND,
} from '../common/errors/fsdErrors';

/**
 * Parse database/Prisma errors and map to FSD error codes
 * Returns specific FSD errors based on error message patterns
 */
export function parseDatabaseError(error: any): FSDError {
  // If already an FSDError, pass through
  if (error instanceof FSDError) {
    return error;
  }

  const errorMessage = error.message || '';
  const lowerMessage = errorMessage.toLowerCase();

  // ============================================================================
  // STOCK ERRORS (ERR-BUS-01, ERR-BUS-06)
  // ============================================================================
  
  // Pattern: "Stok tidak mencukupi", "insufficient stock", "Stok saat ini"
  if (
    lowerMessage.includes('stok tidak mencukupi') ||
    lowerMessage.includes('stok tidak cukup') ||
    lowerMessage.includes('insufficient stock') ||
    lowerMessage.includes('stok saat ini') ||
    lowerMessage.includes('stock is insufficient')
  ) {
    // Differentiate between distributor (ERR-BUS-01) and pengecer (ERR-BUS-06)
    if (lowerMessage.includes('pengecer') || lowerMessage.includes('retailer')) {
      return ERR_BUS_06();
    }
    return ERR_BUS_01();
  }

  // ============================================================================
  // VALIDATION ERRORS (ERR-BUS-02, ERR-VAL)
  // ============================================================================

  // Pattern: amount validation
  if (
    lowerMessage.includes('harus lebih dari 0') ||
    lowerMessage.includes('must be greater than 0') ||
    lowerMessage.includes('must be positive') ||
    lowerMessage.includes('jumlah tidak valid')
  ) {
    return ERR_INVALID_AMOUNT();
  }

  // Pattern: invalid data format
  if (
    lowerMessage.includes('format tidak valid') ||
    lowerMessage.includes('invalid format') ||
    lowerMessage.includes('data tidak valid') ||
    lowerMessage.includes('invalid data')
  ) {
    return ERR_BUS_02();
  }

  // ============================================================================
  // NOT FOUND ERRORS (ERR-BUS-04)
  // ============================================================================

  // Pattern: Pengecer not found
  if (
    lowerMessage.includes('pengecer tidak ditemukan') ||
    lowerMessage.includes('pengecer tidak valid') ||
    lowerMessage.includes('retailer not found') ||
    lowerMessage.includes('id pengecer') && lowerMessage.includes('tidak')
  ) {
    return ERR_PENGECER_NOT_FOUND();
  }

  // Pattern: Petani not found
  if (
    lowerMessage.includes('petani tidak ditemukan') ||
    lowerMessage.includes('petani tidak terdaftar') ||
    lowerMessage.includes('farmer not found') ||
    lowerMessage.includes('id petani') && lowerMessage.includes('tidak')
  ) {
    return ERR_BUS_04();
  }

  // Pattern: Kiriman not found
  if (
    lowerMessage.includes('kiriman tidak ditemukan') ||
    lowerMessage.includes('pengiriman tidak ditemukan') ||
    lowerMessage.includes('shipment not found') ||
    lowerMessage.includes('id pengiriman') && lowerMessage.includes('tidak')
  ) {
    return ERR_KIRIMAN_NOT_FOUND();
  }

  // Pattern: Generic "tidak ditemukan" / "not found"
  if (
    lowerMessage.includes('tidak ditemukan') ||
    lowerMessage.includes('not found') ||
    lowerMessage.includes('does not exist')
  ) {
    return ERR_USER_NOT_FOUND();
  }

  // ============================================================================
  // QUOTA ERRORS (ERR-BUS-05)
  // ============================================================================

  if (
    lowerMessage.includes('kuota habis') ||
    lowerMessage.includes('kuota tidak cukup') ||
    lowerMessage.includes('quota exceeded') ||
    lowerMessage.includes('quota insufficient') ||
    lowerMessage.includes('sisa kuota')
  ) {
    return ERR_BUS_05();
  }

  // ============================================================================
  // SHIPMENT MISMATCH ERRORS (ERR-BUS-03)
  // ============================================================================

  if (
    lowerMessage.includes('tidak sesuai') ||
    lowerMessage.includes('mismatch') ||
    lowerMessage.includes('selisih') ||
    lowerMessage.includes('discrepancy')
  ) {
    return ERR_BUS_03();
  }

  // ============================================================================
  // EMAIL DUPLICATE (ERR-VAL-03) - for user enumeration prevention
  // ============================================================================

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002' &&
    error.meta?.target?.includes('Email')
  ) {
    return ERR_VAL_03(); // Generic message to prevent user enumeration
  }

  // ============================================================================
  // PRISMA ERRORS
  // ============================================================================

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2000':
        return ERR_BUS_02(); // Value too long
      case 'P2001':
        return ERR_USER_NOT_FOUND(); // Record not found
      case 'P2002':
        return ERR_VAL_03(); // Unique constraint (generic for security)
      case 'P2003':
        return ERR_BUS_02(); // Foreign key constraint
      case 'P2025':
        return ERR_USER_NOT_FOUND(); // Record not found
      default:
        return ERR_SYS_01(error.message);
    }
  }

  // ============================================================================
  // PRISMA VALIDATION ERRORS
  // ============================================================================

  if (error instanceof Prisma.PrismaClientValidationError) {
    return ERR_VAL_02();
  }

  // ============================================================================
  // CONNECTION ERRORS (ERR-SYS-01)
  // ============================================================================

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError ||
    lowerMessage.includes('connection') ||
    lowerMessage.includes('timeout') ||
    lowerMessage.includes('econnrefused')
  ) {
    return ERR_SYS_01(error.message);
  }

  // ============================================================================
  // EMPTY DATA ERRORS (ERR-SYS-03)
  // ============================================================================

  if (
    lowerMessage.includes('data kosong') ||
    lowerMessage.includes('no data') ||
    lowerMessage.includes('empty result')
  ) {
    return ERR_SYS_03(error.message);
  }

  // ============================================================================
  // SQL SERVER SPECIFIC ERRORS
  // ============================================================================

  // Extract SQL Server error codes
  if (errorMessage.includes('Code: `') || errorMessage.includes('Code: \'')) {
    const codeMatch = errorMessage.match(/Code: [`'](\d+)[`']/);
    if (codeMatch) {
      const sqlCode = codeMatch[1];
      
      switch (sqlCode) {
        case '208': // Invalid object name (table not found)
        case '207': // Invalid column name
          return ERR_SYS_03(error.message);
        
        case '547': // Foreign key constraint violation
          return ERR_BUS_02();
        
        case '2627': // Unique constraint violation
        case '2601': // Duplicate key
          return ERR_VAL_03();
        
        case '515': // Cannot insert NULL
          return ERR_VAL_02();
        
        default:
          return ERR_SYS_01(error.message);
      }
    }
  }

  // ============================================================================
  // STORED PROCEDURE ERRORS - Extract message from RAISERROR
  // ============================================================================

  // Pattern: Extract message from Prisma raw query error
  if (errorMessage.includes('Raw query failed')) {
    const messageMatch = errorMessage.match(/Message: [`']([^`']+)[`']/);
    if (messageMatch) {
      const sqlMessage = messageMatch[1];
      // Recursively parse the extracted SQL message
      return parseDatabaseError({ message: sqlMessage });
    }
  }

  // ============================================================================
  // DEFAULT: GENERIC SYSTEM ERROR
  // ============================================================================

  return ERR_SYS_01(error.message);
}

/**
 * Extract clean error message for logging purposes
 */
export function extractTechnicalDetails(error: any): string {
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.error) return error.error;
  return 'Unknown error';
}
