import prisma from '../../config/database';
import { AppError } from '../../common/middleware/error.middleware';

/**
 * Pemerintah (Government) Service
 * Handles all government-related business logic using stored procedures
 */
export class PemerintahService {
  /**
   * Get top 3 unread notifications for home page
   * SP: dbo.usp_GetPemerintahNotifikasiTop3
   */
  async getTopNotifications(userId: number) {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      EXEC dbo.usp_GetPemerintahNotifikasiTop3 @UserId = ${userId}
    `);

    return result;
  }

  /**
   * Get comprehensive dashboard with filters
   * SP: dbo.usp_GetPemerintahDashboard
   */
  async getDashboard(filters: {
    provinsi?: string;
    tahunAwal?: number;
    tahunAkhir?: number;
    pupukId?: number;
  }) {
    const provinsiParam = filters.provinsi ? `'${filters.provinsi}'` : 'NULL';
    const tahunAwalParam = filters.tahunAwal || 'NULL';
    const tahunAkhirParam = filters.tahunAkhir || 'NULL';
    const pupukIdParam = filters.pupukId || 'NULL';

    const result = await prisma.$queryRawUnsafe<any>(`
      EXEC dbo.usp_GetPemerintahDashboard
        @Provinsi = ${provinsiParam},
        @TahunAwal = ${tahunAwalParam},
        @TahunAkhir = ${tahunAkhirParam},
        @PupukId = ${pupukIdParam}
    `);

    return {
      mapByProvince: result[0] || [],
      totalAbsorbed: result[1],
      realizationPercent: result[2],
      topProvinces: result[3] || [],
      monthlyTrend: result[4] || [],
      topSectors: result[5] || [],
    };
  }

  /**
   * Get anomaly detection notifications
   * SP: dbo.usp_GetPemerintahDeteksiAnomali
   */
  async getAnomalies(userId: number, pageNumber: number = 1) {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      EXEC dbo.usp_GetPemerintahDeteksiAnomali
        @UserId = ${userId},
        @PageNumber = ${pageNumber}
    `);

    return result;
  }

  /**
   * Get pending users for verification
   * SP: dbo.usp_GetPemerintahVerifikasiPendaftar
   */
  async getPendingUsers(pageNumber: number = 1, pageSize: number = 6) {
    const result = await prisma.$queryRawUnsafe<any>(`
      EXEC dbo.usp_GetPemerintahVerifikasiPendaftar
        @PageNumber = ${pageNumber},
        @PageSize = ${pageSize}
    `);

    return {
      summary: result[0],
      pendingUsers: result[1] || [],
    };
  }

  /**
   * Approve pending user
   * SP: dbo.usp_ApproveUser
   */
  async approveUser(userId: number, approverId: number) {
    try {
      await prisma.$queryRawUnsafe(`
        EXEC dbo.usp_ApproveUser
          @UserIdPenyetuju = ${approverId},
          @UserId = ${userId}
      `);

      return { message: 'User berhasil disetujui' };
    } catch (error: any) {
      if (error.message.includes('tidak ditemukan') || error.message.includes('tidak Pending')) {
        throw new AppError(error.message, 400);
      }
      throw error;
    }
  }

  /**
   * Reject pending user
   * SP: dbo.usp_RejectUser
   */
  async rejectUser(userId: number, approverId: number) {
    try {
      await prisma.$queryRawUnsafe(`
        EXEC dbo.usp_RejectUser
          @UserIdPemerintah = ${approverId},
          @UserId = ${userId}
      `);

      return { message: 'User berhasil ditolak' };
    } catch (error: any) {
      if (error.message.includes('tidak ditemukan') || error.message.includes('tidak Pending')) {
        throw new AppError(error.message, 400);
      }
      throw error;
    }
  }

  /**
   * Get help requests (bantuan)
   * SP: dbo.usp_GetPemerintahBantuan
   */
  async getHelpRequests(pageNumber: number = 1) {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      EXEC dbo.usp_GetPemerintahBantuan @PageNumber = ${pageNumber}
    `);

    return result;
  }
}
