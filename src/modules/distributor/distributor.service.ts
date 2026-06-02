import prisma from '../../config/database';
import { AppError } from '../../common/middleware/error.middleware';
import logger from '../../utils/logger';

/**
 * Distributor Service
 * Handles all distributor-related business logic using stored procedures
 * All queries use parameterized queries to prevent SQL injection
 */
export class DistributorService {
  /**
   * Get distributor dashboard data
   * SP: dbo.usp_GetDistributorDashboard
   */
  async getDashboard(userId: string) {
    const startTime = Date.now();
    
    try {
      const result = await prisma.$queryRaw<any>`
        EXEC dbo.usp_GetDistributorDashboard @UserId = ${userId}
      `;

      logger.info('Dashboard retrieved', {
        userId,
        duration: Date.now() - startTime
      });

      return {
        stockSummary: result[0],
        recentShipments: result[1] || [],
        recentStockOut: result[2] || [],
        notifications: result[3] || [],
      };
    } catch (error: any) {
      logger.error('Failed to get dashboard', { userId, error: error.message });
      throw new AppError('Gagal mengambil data dashboard', 500);
    }
  }

  /**
   * Get recent shipments
   * SP: dbo.usp_GetRecentKiriman
   */
  async getRecentShipments(userId: string) {
    try {
      const result = await prisma.$queryRaw<any[]>`
        EXEC dbo.usp_GetRecentKiriman @UserIdDistributor = ${userId}
      `;
      return result;
    } catch (error: any) {
      logger.error('Failed to get recent shipments', { userId, error: error.message });
      throw new AppError('Gagal mengambil data pengiriman', 500);
    }
  }

  /**
   * Validate pengecer (retailer) before creating shipment
   * SP: dbo.usp_ValidatePengecer
   */
  async validatePengecer(pengecerId: string) {
    try {
      const result = await prisma.$queryRaw<any[]>`
        EXEC dbo.usp_ValidatePengecer @UserIdPengecer = ${pengecerId}
      `;

      const validation = result[0];
      
      if (!validation.IsValid) {
        throw new AppError(validation.Message, 400);
      }

      return validation;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to validate pengecer', { pengecerId, error: error.message });
      throw new AppError('Gagal validasi pengecer', 500);
    }
  }

  /**
   * Create new shipment to pengecer
   * SP: dbo.usp_CreateKiriman
   */
  async createShipment(data: {
    distributorId: string;
    pengecerId: string;
    pupukId: number;
    jumlah: number;
    timestamp?: Date;
  }) {
    const startTime = Date.now();
    
    try {
      const result = await prisma.$queryRaw<any[]>`
        EXEC dbo.usp_CreateKiriman
          @UserIdDistributor = ${data.distributorId},
          @UserIdPengecer = ${data.pengecerId},
          @PupukId = ${data.pupukId},
          @Jumlah = ${data.jumlah},
          @TimestampKirim = ${data.timestamp || null}
      `;

      logger.info('Shipment created', {
        distributorId: data.distributorId,
        shipmentId: result[0]?.KirimanId,
        duration: Date.now() - startTime
      });

      return result[0];
    } catch (error: any) {
      if (error.message.includes('Stok tidak mencukupi')) {
        logger.warn('Insufficient stock', { 
          distributorId: data.distributorId, 
          pupukId: data.pupukId 
        });
        throw new AppError(error.message, 400);
      }
      
      logger.error('Failed to create shipment', { 
        data, 
        error: error.message 
      });
      throw new AppError('Gagal membuat pengiriman', 500);
    }
  }

  /**
   * Get stock dashboard with pagination
   * SP: dbo.usp_GetDistributorStokDashboard
   */
  async getStockDashboard(userId: string, pageNumber: number = 1) {
    try {
      const result = await prisma.$queryRaw<any>`
        EXEC dbo.usp_GetDistributorStokDashboard
          @UserId = ${userId},
          @PageNumber = ${pageNumber}
      `;

      return {
        totalStockTon: result[0],
        stockItems: result[1] || [],
      };
    } catch (error: any) {
      logger.error('Failed to get stock dashboard', { userId, error: error.message });
      throw new AppError('Gagal mengambil data stok', 500);
    }
  }

  /**
   * Get current stock for specific fertilizer
   * SP: dbo.usp_GetStokPupukSaatIni
   */
  async getCurrentStock(userId: string, pupukId: number) {
    try {
      const result = await prisma.$queryRaw<any[]>`
        EXEC dbo.usp_GetStokPupukSaatIni
          @UserId = ${userId},
          @PupukId = ${pupukId}
      `;

      return result[0];
    } catch (error: any) {
      logger.error('Failed to get current stock', { userId, pupukId, error: error.message });
      throw new AppError('Gagal mengambil data stok', 500);
    }
  }

  /**
   * Adjust stock (add or reduce)
   * SP: dbo.usp_AdjustStokDistributor
   */
  async adjustStock(data: {
    userId: string;
    pupukId: number;
    jumlahPenyesuaian: number;
    waktu?: Date;
  }) {
    try {
      const result = await prisma.$queryRaw<any[]>`
        EXEC dbo.usp_AdjustStokDistributor
          @UserId = ${data.userId},
          @PupukId = ${data.pupukId},
          @JumlahPenyesuaian = ${data.jumlahPenyesuaian},
          @Waktu = ${data.waktu || null}
      `;

      logger.info('Stock adjusted', { 
        userId: data.userId, 
        pupukId: data.pupukId,
        adjustment: data.jumlahPenyesuaian 
      });

      return result[0];
    } catch (error: any) {
      if (error.message.includes('Stok tidak mencukupi')) {
        throw new AppError(error.message, 400);
      }
      logger.error('Failed to adjust stock', { data, error: error.message });
      throw new AppError('Gagal menyesuaikan stok', 500);
    }
  }

  /**
   * Add incoming stock
   * SP: dbo.usp_TambahStokDistributor
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

      const result = await prisma.$queryRaw<any[]>`
        EXEC dbo.usp_TambahStokDistributor
          @UserId = ${data.userId},
          @PupukId = ${data.pupukId},
          @JumlahMasuk = ${data.jumlahMasuk},
          @Waktu = ${data.waktu || null}
      `;

      logger.info('Stock added', { 
        userId: data.userId, 
        pupukId: data.pupukId,
        amount: data.jumlahMasuk 
      });

      return result[0];
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error('Failed to add stock', { data, error: error.message });
      throw new AppError('Gagal menambah stok', 500);
    }
  }

  /**
   * Get shipment history with pagination
   * SP: dbo.usp_GetDistributorRiwayatPengiriman
   */
  async getShipmentHistory(userId: string, pageNumber: number = 1) {
    try {
      const result = await prisma.$queryRaw<any>`
        EXEC dbo.usp_GetDistributorRiwayatPengiriman
          @UserId = ${userId},
          @PageNumber = ${pageNumber}
      `;

      return {
        summary: result[0],
        shipments: result[1] || [],
      };
    } catch (error: any) {
      logger.error('Failed to get shipment history', { userId, error: error.message });
      throw new AppError('Gagal mengambil riwayat pengiriman', 500);
    }
  }

  /**
   * Get incoming stock history
   * SP: dbo.usp_GetDistributorRiwayatStokMasuk
   */
  async getIncomingStockHistory(userId: string, pageNumber: number = 1) {
    try {
      const result = await prisma.$queryRaw<any[]>`
        EXEC dbo.usp_GetDistributorRiwayatStokMasuk
          @UserId = ${userId},
          @PageNumber = ${pageNumber}
      `;

      return result;
    } catch (error: any) {
      logger.error('Failed to get incoming stock history', { userId, error: error.message });
      throw new AppError('Gagal mengambil riwayat stok masuk', 500);
    }
  }

  /**
   * Get outgoing stock history
   * SP: dbo.usp_GetDistributorRiwayatStokKeluar
   */
  async getOutgoingStockHistory(userId: string, pageNumber: number = 1) {
    try {
      const result = await prisma.$queryRaw<any[]>`
        EXEC dbo.usp_GetDistributorRiwayatStokKeluar
          @UserId = ${userId},
          @PageNumber = ${pageNumber}
      `;

      return result;
    } catch (error: any) {
      logger.error('Failed to get outgoing stock history', { userId, error: error.message });
      throw new AppError('Gagal mengambil riwayat stok keluar', 500);
    }
  }

  /**
   * Get notifications with pagination
   * SP: dbo.usp_GetDistributorNotifikasi
   */
  async getNotifications(userId: string, pageNumber: number = 1) {
    try {
      const result = await prisma.$queryRaw<any[]>`
        EXEC dbo.usp_GetDistributorNotifikasi
          @UserId = ${userId},
          @PageNumber = ${pageNumber}
      `;

      return result;
    } catch (error: any) {
      logger.error('Failed to get notifications', { userId, error: error.message });
      throw new AppError('Gagal mengambil notifikasi', 500);
    }
  }

  /**
   * Mark notification as read
   * SP: dbo.usp_MarkNotifikasiDibaca
   */
  async markNotificationRead(notifikasiId: string, userId: string) {
    try {
      const result = await prisma.$queryRaw<any[]>`
        EXEC dbo.usp_MarkNotifikasiDibaca
          @NotifikasiId = ${notifikasiId},
          @UserId = ${userId}
      `;

      return result[0];
    } catch (error: any) {
      logger.error('Failed to mark notification as read', { 
        notifikasiId, 
        userId, 
        error: error.message 
      });
      throw new AppError('Gagal menandai notifikasi', 500);
    }
  }
}
