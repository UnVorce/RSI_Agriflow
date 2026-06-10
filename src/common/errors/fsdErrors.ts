/**
 * FSD-Compliant Error Definitions
 * Based on FSD Bagian 6 - Error Handling & Exception Flows
 * 
 * MANDATORY RULES:
 * 1. NEVER expose technical details (stack trace, table names, SQL queries) to users
 * 2. Login errors are ALWAYS generic - don't reveal if email/username exists
 * 3. ROLLBACK entire transaction on system errors (ERR-SYS)
 */

export class FSDError extends Error {
  public readonly errorId: string;
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly technicalDetails?: string;

  constructor(
    errorId: string,
    userMessage: string,
    statusCode: number,
    technicalDetails?: string
  ) {
    super(userMessage);
    this.name = 'FSDError';
    this.errorId = errorId;
    this.userMessage = userMessage;
    this.statusCode = statusCode;
    this.technicalDetails = technicalDetails;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================================
// VALIDATION ERRORS (ERR-VAL)
// ============================================================================

export class ValidationError extends FSDError {
  constructor(errorId: string, userMessage: string, technicalDetails?: string) {
    super(errorId, userMessage, 422, technicalDetails);
    this.name = 'ValidationError';
  }
}

export const ERR_VAL_01 = () =>
  new ValidationError(
    'ERR-VAL-01',
    'Masukkan alamat email yang valid.'
  );

export const ERR_VAL_02 = () =>
  new ValidationError(
    'ERR-VAL-02',
    'Semua field wajib harus diisi sebelum melanjutkan.'
  );

export const ERR_VAL_03 = () =>
  new ValidationError(
    'ERR-VAL-03',
    'Data pendaftaran tidak dapat diproses. Silakan periksa kembali informasi Anda.'
  );

export const ERR_VAL_04 = () =>
  new ValidationError(
    'ERR-VAL-04',
    'Username dan password harus diisi.'
  );

export const ERR_VAL_05 = () =>
  new ValidationError(
    'ERR-VAL-05',
    'ID Petani harus terdiri dari 16 digit angka.'
  );

export const ERR_VAL_06 = () =>
  new ValidationError(
    'ERR-VAL-06',
    'Semua field wajib harus diisi sebelum mengirim laporan bantuan.'
  );

// ============================================================================
// AUTHENTICATION ERRORS (ERR-AUTH)
// ============================================================================

export class AuthenticationError extends FSDError {
  constructor(errorId: string, userMessage: string, statusCode: number, technicalDetails?: string) {
    super(errorId, userMessage, statusCode, technicalDetails);
    this.name = 'AuthenticationError';
  }
}

export const ERR_AUTH_01 = () =>
  new AuthenticationError(
    'ERR-AUTH-01',
    'Anda harus login untuk mengakses halaman ini.',
    401
  );

export const ERR_AUTH_02 = () =>
  new AuthenticationError(
    'ERR-AUTH-02',
    'Email atau password tidak valid.',
    401
  );

// ============================================================================
// ACCOUNT LOCK ERRORS (ERR-LOCK)
// ============================================================================

export const ERR_LOCK_01 = () =>
  new AuthenticationError(
    'ERR-LOCK-01',
    'Akun dikunci sementara. Silakan coba lagi dalam 15 menit.',
    403
  );

// ============================================================================
// AUTHORIZATION ERRORS (ERR-AUTHZ)
// ============================================================================

export class AuthorizationError extends FSDError {
  constructor(errorId: string, userMessage: string, technicalDetails?: string) {
    super(errorId, userMessage, 403, technicalDetails);
    this.name = 'AuthorizationError';
  }
}

export const ERR_AUTHZ_01 = () =>
  new AuthorizationError(
    'ERR-AUTHZ-01',
    'Anda tidak memiliki izin untuk mengakses fitur ini.'
  );

// ============================================================================
// BUSINESS RULE ERRORS (ERR-BUS)
// ============================================================================

export class BusinessRuleError extends FSDError {
  constructor(errorId: string, userMessage: string, statusCode: number = 422, technicalDetails?: string) {
    super(errorId, userMessage, statusCode, technicalDetails);
    this.name = 'BusinessRuleError';
  }
}

export const ERR_BUS_01 = () =>
  new BusinessRuleError(
    'ERR-BUS-01',
    'Stok tidak mencukupi untuk memproses penyaluran ini. Periksa kembali jumlah stok Anda.'
  );

export const ERR_BUS_02 = () =>
  new BusinessRuleError(
    'ERR-BUS-02',
    'Data stok tidak valid. Pastikan semua informasi yang dimasukkan benar.'
  );

export const ERR_BUS_03 = () =>
  new BusinessRuleError(
    'ERR-BUS-03',
    'Data pengiriman tidak dapat diverifikasi. Pastikan ID Pengiriman dan jumlah yang diterima sesuai.'
  );

export const ERR_BUS_04 = () =>
  new BusinessRuleError(
    'ERR-BUS-04',
    'Petani dengan ID tersebut tidak terdaftar dalam sistem. Pastikan ID yang dimasukkan benar.',
    404
  );

export const ERR_BUS_05 = () =>
  new BusinessRuleError(
    'ERR-BUS-05',
    'Kuota subsidi pupuk untuk petani ini sudah habis. Tidak dapat melanjutkan penebusan.'
  );

export const ERR_BUS_06 = () =>
  new BusinessRuleError(
    'ERR-BUS-06',
    'Stok pupuk di toko Anda tidak mencukupi. Periksa kembali ketersediaan stok.'
  );

// ============================================================================
// SYSTEM ERRORS (ERR-SYS)
// ============================================================================

export class SystemError extends FSDError {
  constructor(errorId: string, userMessage: string, statusCode: number, technicalDetails?: string) {
    super(errorId, userMessage, statusCode, technicalDetails);
    this.name = 'SystemError';
  }
}

export const ERR_SYS_01 = (technicalDetails?: string) =>
  new SystemError(
    'ERR-SYS-01',
    'Layanan sedang tidak tersedia. Silakan coba beberapa saat lagi.',
    503,
    technicalDetails
  );

export const ERR_SYS_02 = (technicalDetails?: string) =>
  new SystemError(
    'ERR-SYS-02',
    'Laporan bantuan gagal dikirim. Silakan coba lagi atau hubungi administrator.',
    500,
    technicalDetails
  );

export const ERR_SYS_03 = (technicalDetails?: string) =>
  new SystemError(
    'ERR-SYS-03',
    'Data tidak tersedia saat ini. Silakan muat ulang halaman atau coba beberapa saat lagi.',
    503,
    technicalDetails
  );

// ============================================================================
// CUSTOM ERROR MESSAGES (Not in FSD but commonly needed)
// ============================================================================

export const ERR_PENGECER_NOT_FOUND = () =>
  new BusinessRuleError(
    'ERR-BUS-04',
    'Pengecer dengan ID tersebut tidak terdaftar dalam sistem. Pastikan ID yang dimasukkan benar.',
    404
  );

export const ERR_DISTRIBUTOR_NOT_FOUND = () =>
  new BusinessRuleError(
    'ERR-BUS-04',
    'Distributor dengan ID tersebut tidak terdaftar dalam sistem. Pastikan ID yang dimasukkan benar.',
    404
  );

export const ERR_KIRIMAN_NOT_FOUND = () =>
  new BusinessRuleError(
    'ERR-BUS-03',
    'Pengiriman dengan ID tersebut tidak ditemukan. Pastikan ID yang dimasukkan benar.',
    404
  );

export const ERR_INVALID_AMOUNT = () =>
  new ValidationError(
    'ERR-VAL-02',
    'Jumlah harus berupa angka positif lebih dari 0.'
  );

export const ERR_USER_NOT_FOUND = () =>
  new BusinessRuleError(
    'ERR-BUS-04',
    'User dengan ID tersebut tidak terdaftar dalam sistem.',
    404
  );
