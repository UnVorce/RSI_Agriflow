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

    return result.map((r: any) => ({
      ...r,
      NotifikasiId: r.NotifikasiId !== undefined ? String(r.NotifikasiId) : undefined,
    }));
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

    // Run each result set as separate lightweight queries instead of one heavy SP
    const whereClause = `
      pp.Status = 'Berhasil'
      AND p.Status = 'Aktif'
      ${filters.provinsi ? `AND kp.Provinsi = '${filters.provinsi}'` : ''}
      ${filters.tahunAwal ? `AND YEAR(pp.TimestampPenebusan) >= ${filters.tahunAwal}` : ''}
      ${filters.tahunAkhir ? `AND YEAR(pp.TimestampPenebusan) <= ${filters.tahunAkhir}` : ''}
      ${filters.pupukId ? `AND pp.PupukId = ${filters.pupukId}` : ''}
    `;

    const joinClause = `
      FROM trans.PENEBUSAN_PUPUK pp
      JOIN master.PETANI p ON pp.PetaniId = p.PetaniId
      JOIN ref.KODE_POS kp ON p.KodePos = kp.KodePosId
    `;

    const [totalAbsorbedRes, top3Res, trendRes, sectorsRes, kuotaRes] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT CAST(ISNULL(SUM(pp.Jumlah), 0) / 1000 AS DECIMAL(18,2)) AS TotalTerserapTon
        ${joinClause}
        WHERE ${whereClause}
      `),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT TOP 3 kp.Provinsi, ISNULL(SUM(pp.Jumlah), 0) AS TotalPupuk
        ${joinClause}
        WHERE ${whereClause}
        GROUP BY kp.Provinsi
        ORDER BY TotalPupuk DESC
      `),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT TOP 24
          YEAR(pp.TimestampPenebusan) AS Tahun,
          MONTH(pp.TimestampPenebusan) AS Bulan,
          SUM(pp.Jumlah) AS TotalPupuk
        ${joinClause}
        WHERE ${whereClause}
        GROUP BY YEAR(pp.TimestampPenebusan), MONTH(pp.TimestampPenebusan)
        ORDER BY Tahun DESC, Bulan DESC
      `),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT TOP 3 p.Sektor, SUM(pp.Jumlah) AS TotalPupuk
        ${joinClause}
        WHERE ${whereClause}
        AND p.Sektor IS NOT NULL
        GROUP BY p.Sektor
        ORDER BY TotalPupuk DESC
      `),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT ISNULL(SUM(kp2.SisaKuota), 0) AS TotalSisaKuota
        FROM master.KUOTA_PETANI kp2
        JOIN master.PETANI p2 ON kp2.PetaniId = p2.PetaniId
        WHERE p2.Status = 'Aktif'
        ${filters.pupukId ? `AND kp2.PupukId = ${filters.pupukId}` : ''}
      `),
    ]);

    const totalTon = Number(totalAbsorbedRes[0]?.TotalTerserapTon ?? 0);
    const totalSisaKuota = Number(kuotaRes[0]?.TotalSisaKuota ?? 0);
    const totalDitebus = totalTon * 1000; // convert back from ton to kg
    const totalAlokasi = totalDitebus + totalSisaKuota;
    const realisasiPersen = totalAlokasi > 0
      ? ((totalDitebus / totalAlokasi) * 100).toFixed(2)
      : '0.00';

    return {
      mapByProvince: [],
      totalAbsorbed: { TotalTerserapTon: String(totalTon) },
      realizationPercent: { RealisasiPersen: realisasiPersen },
      topProvinces: top3Res.map((r: any) => ({
        Provinsi: r.Provinsi,
        TotalPupuk: Number(r.TotalPupuk),
      })),
      monthlyTrend: trendRes.map((r: any) => ({
        Tahun: Number(r.Tahun),
        Bulan: Number(r.Bulan),
        TotalPupuk: Number(r.TotalPupuk),
      })),
      topSectors: sectorsRes.map((r: any) => ({
        Sektor: r.Sektor,
        TotalPupuk: Number(r.TotalPupuk),
      })),
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

    return result.map((r: any) => ({
      ...r,
      TotalRows: r.TotalRows !== undefined ? Number(r.TotalRows) : undefined,
    }));
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

    // Serialize BigInt fields to string/number
    return result.map((r: any) => ({
      ...r,
      No: r.No !== undefined ? Number(r.No) : undefined,
      TotalRows: r.TotalRows !== undefined ? Number(r.TotalRows) : undefined,
    }));
  }
}
