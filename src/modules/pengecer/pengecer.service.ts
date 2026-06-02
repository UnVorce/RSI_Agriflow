import prisma from '../../config/database';
import { AppError } from '../../common/middleware/error.middleware';

/**
 * Pengecer (Retailer) Service
 * Handles all retailer-related business logic using stored procedures
 */
export class PengecerService {
  /**
   * Get pengecer dashboard data
   * SP: dbo.usp_GetPengecerDashboard
   */
  async getDashboard(userId: string) {
    const result = await prisma.$queryRawUnsafe<any>(`
      EXEC dbo.usp_GetPengecerDashboard @UserId = '${userId}'
    `);

    return {
      summary: result[0],
      notifications: result[1] || [],
      recentReceipts: result[2] || [],
      recentRedemptions: result[3] || [],
    };
  }

  /**
   * Get recent receipts
   * SP: dbo.usp_GetPengecerRecentPenerimaan
   */
  async getRecentReceipts(userId: string) {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      EXEC dbo.usp_GetPengecerRecentPenerimaan @UserIdPengecer = '${userId}'
    `);

    return result;
  }

  /**
   * Validate shipment for receiving
   * SP: dbo.usp_ValidateKirimanForPengecer
   */
  async validateShipment(userId: string, kirimanId: string) {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      EXEC dbo.usp_ValidateKirimanForPengecer
        @UserIdPengecer = '${userId}',
        @KirimanId = '${kirimanId}'
    `);

    const validation = result[0];

    if (!validation.IsValid) {
      throw new AppError(validation.Message, 400);
    }

    return validation;
  }

  /**
   * Receive shipment from distributor
   * SP: dbo.usp_TerimaKirimanPengecer
   */
  async receiveShipment(data: {
    pengecerId: string;
    kirimanId: string;
    jumlahDiterima: number;
    timestampDiterima?: Date;
  }) {
    try {
      const timestampParam = data.timestampDiterima
        ? `'${data.timestampDiterima.toISOString()}'`
        : 'NULL';

      const result = await prisma.$queryRawUnsafe<any[]>(`
        EXEC dbo.usp_TerimaKirimanPengecer
          @UserIdPengecer = '${data.pengecerId}',
          @KirimanId = '${data.kirimanId}',
          @JumlahDiterima = ${data.jumlahDiterima},
          @TimestampDiterima = ${timestampParam}
      `);

      return result[0];
    } catch (error: any) {
      if (error.message.includes('tidak valid') || error.message.includes('melebihi')) {
        throw new AppError(error.message, 400);
      }
      throw error;
    }
  }

  /**
   * Get stock dashboard with sorting and pagination
   * SP: dbo.usp_GetPengecerStokDashboard
   */
  async getStockDashboard(
    userId: string,
    pageNumber: number = 1,
    sortColumn: 'JumlahStok' | 'LastUpdated' = 'LastUpdated',
    sortDirection: 'ASC' | 'DESC' = 'DESC'
  ) {
    const result = await prisma.$queryRawUnsafe<any>(`
      EXEC dbo.usp_GetPengecerStokDashboard
        @UserId = '${userId}',
        @PageNumber = ${pageNumber},
        @SortColumn = '${sortColumn}',
        @SortDirection = '${sortDirection}'
    `);

    return {
      totalStockTon: result[0],
      stockItems: result[1] || [],
    };
  }

  /**
   * Add incoming stock
   * SP: dbo.usp_TambahStokPengecer
   */
  async addStock(data: {
    userId: string;
    pupukId: number;
    jumlahMasuk: number;
    waktu?: Date;
  }) {
    try {
      if (data.jumlahMasuk <= 0) {
        throw new AppError('Jumlah stok masuk harus lebih dari 0', 400);
      }

      const waktuParam = data.waktu
        ? `'${data.waktu.toISOString()}'`
        : 'NULL';

      const result = await prisma.$queryRawUnsafe<any[]>(`
        EXEC dbo.usp_TambahStokPengecer
          @UserId = '${data.userId}',
          @PupukId = ${data.pupukId},
          @JumlahMasuk = ${data.jumlahMasuk},
          @Waktu = ${waktuParam}
      `);

      return result[0];
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Get receipt history (incoming stock)
   * SP: dbo.usp_GetPengecerRiwayatPenerimaan
   */
  async getReceiptHistory(userId: string, pageNumber: number = 1) {
    const result = await prisma.$queryRawUnsafe<any>(`
      EXEC dbo.usp_GetPengecerRiwayatPenerimaan
        @UserId = '${userId}',
        @PageNumber = ${pageNumber}
    `);

    return {
      summary: result[0],
      receipts: result[1] || [],
    };
  }

  /**
   * Get redemption history
   * SP: dbo.usp_GetPengecerRiwayatPenebusan
   */
  async getRedemptionHistory(userId: string, pageNumber: number = 1) {
    const result = await prisma.$queryRawUnsafe<any>(`
      EXEC dbo.usp_GetPengecerRiwayatPenebusan
        @UserId = '${userId}',
        @PageNumber = ${pageNumber}
    `);

    return {
      summary: result[0],
      redemptions: result[1] || [],
    };
  }

  /**
   * Get notifications with pagination
   * SP: dbo.usp_GetPengecerNotifikasi
   */
  async getNotifications(userId: string, pageNumber: number = 1) {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      EXEC dbo.usp_GetPengecerNotifikasi
        @UserId = '${userId}',
        @PageNumber = ${pageNumber}
    `);

    return result;
  }

  /**
   * Validate petani (farmer) for redemption
   * SP: dbo.usp_ValidatePetaniForPenebusan
   */
  async validatePetani(userId: string, petaniId: string) {
    try {
      const result = await prisma.$queryRawUnsafe<any>(`
        EXEC dbo.usp_ValidatePetaniForPenebusan
          @UserIdPengecer = '${userId}',
          @PetaniId = '${petaniId}'
      `);

      return {
        petaniDetails: result[0],
        quotas: result[1] || [],
      };
    } catch (error: any) {
      if (error.message.includes('tidak ditemukan') || error.message.includes('tidak aktif')) {
        throw new AppError(error.message, 400);
      }
      throw error;
    }
  }

  /**
   * Create fertilizer redemption for farmer
   * SP: dbo.usp_CreatePenebusan
   */
  async createRedemption(data: {
    pengecerId: string;
    petaniId: string;
    pupukId: number;
    jumlah: number;
  }) {
    try {
      const result = await prisma.$queryRawUnsafe<any[]>(`
        EXEC dbo.usp_CreatePenebusan
          @UserIdPengecer = '${data.pengecerId}',
          @PetaniId = '${data.petaniId}',
          @PupukId = ${data.pupukId},
          @Jumlah = ${data.jumlah}
      `);

      return result[0];
    } catch (error: any) {
      if (
        error.message.includes('Stok tidak mencukupi') ||
        error.message.includes('Kuota tidak mencukupi') ||
        error.message.includes('tidak valid')
      ) {
        throw new AppError(error.message, 400);
      }
      throw error;
    }
  }

  /**
   * Mark notification as read
   * SP: dbo.usp_MarkNotifikasiDibaca
   */
  async markNotificationRead(notifikasiId: string, userId: string) {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      EXEC dbo.usp_MarkNotifikasiDibaca
        @NotifikasiId = '${notifikasiId}',
        @UserId = '${userId}'
    `);

    return result[0];
  }
}
