import prisma from '../../config/database';
import logger from '../../utils/logger';
import { parseDatabaseError } from '../../utils/fsdErrorHandler';
import { ERR_SYS_03 } from '../../common/errors/fsdErrors';

/**
 * Pemerintah (Government) Service - FSD-Compliant Error Handling
 * All errors mapped to FSD codes
 */
export class PemerintahService {
  async getTopNotifications(userId: number) {
    try {
      const result = await prisma.$queryRawUnsafe<any[]>(`
        EXEC dbo.usp_GetPemerintahNotifikasiTop3 @UserId = ${userId}
      `);

      return result;
    } catch (error: any) {
      logger.error('Failed to get top notifications', { userId, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async getDashboard(filters: {
    provinsi?: string;
    tahunAwal?: number;
    tahunAkhir?: number;
    pupukId?: number;
  }) {
    try {
      const provinsiParam = filters.provinsi ? `'${filters.provinsi}'` : 'NULL';
      const tahunAwalParam = filters.tahunAwal ? filters.tahunAwal : 'NULL';
      const tahunAkhirParam = filters.tahunAkhir ? filters.tahunAkhir : 'NULL';
      const pupukIdParam = filters.pupukId ? filters.pupukId : 'NULL';

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
    } catch (error: any) {
      logger.error('Failed to get pemerintah dashboard', { filters, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async getAnomalies(userId: number, pageNumber: number = 1) {
    try {
      const result = await prisma.$queryRawUnsafe<any[]>(`
        EXEC dbo.usp_GetPemerintahDeteksiAnomali
          @UserId = ${userId},
          @PageNumber = ${pageNumber}
      `);

      return result;
    } catch (error: any) {
      logger.error('Failed to get anomalies', { userId, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async getPendingUsers(pageNumber: number = 1, pageSize: number = 6) {
    try {
      const result = await prisma.$queryRawUnsafe<any>(`
        EXEC dbo.usp_GetPemerintahVerifikasiPendaftar
          @PageNumber = ${pageNumber},
          @PageSize = ${pageSize}
      `);

      // Convert BigInt to Number to avoid JSON serialization error
      const summary = result[0] ? {
        TotalUser: Number(result[0].TotalUser ?? 0),
        TotalDitolak: Number(result[0].TotalDitolak ?? 0),
        TotalAktif: Number(result[0].TotalAktif ?? 0),
      } : null;

      const pendingUsers = (result[1] || []).map((user: any) => ({
        ...user,
        TotalRows: user.TotalRows ? Number(user.TotalRows) : undefined,
      }));

      return {
        summary,
        pendingUsers,
      };
    } catch (error: any) {
      logger.error('Failed to get pending users', { pageNumber, pageSize, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async approveUser(userId: number, approverId: number) {
    try {
      await prisma.$queryRawUnsafe(`
        EXEC dbo.usp_ApproveUser
          @UserIdPenyetuju = ${approverId},
          @UserId = ${userId}
      `);

      return { message: 'User berhasil disetujui' };
    } catch (error: any) {
      logger.error('Failed to approve user', { userId, approverId, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async rejectUser(userId: number, approverId: number) {
    try {
      await prisma.$queryRawUnsafe(`
        EXEC dbo.usp_RejectUser
          @UserIdPemerintah = ${approverId},
          @UserId = ${userId}
      `);

      return { message: 'User berhasil ditolak' };
    } catch (error: any) {
      logger.error('Failed to reject user', { userId, approverId, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async getHelpRequests(pageNumber: number = 1) {
    try {
      const result = await prisma.$queryRawUnsafe<any[]>(`
        EXEC dbo.usp_GetPemerintahBantuan @PageNumber = ${pageNumber}
      `);

      // Convert BigInt to Number to avoid JSON serialization error
      return (result || []).map((item: any) => ({
        ...item,
        No: item.No ? Number(item.No) : undefined,
        TotalRows: item.TotalRows ? Number(item.TotalRows) : undefined,
      }));
    } catch (error: any) {
      logger.error('Failed to get help requests', { pageNumber, error: error.message });
      throw parseDatabaseError(error);
    }
  }
}
