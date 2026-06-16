import prisma from '../../config/database';
import { AppError } from '../../common/middleware/error.middleware';
import redisClient from '../../config/redis';

function esc(val: string | null | undefined): string {
  if (val == null) return 'NULL';
  return `'${val.replace(/'/g, "''")}'`;
}

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
    const cacheKey = `dashboard:pemerintah:${JSON.stringify(filters)}`;
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch { /* Redis unavailable, skip cache */ }

    const whereClause = `
      pp.Status = 'Berhasil'
      AND p.Status = 'Aktif'
      ${filters.provinsi ? `AND kp.Provinsi = '${filters.provinsi}'` : ''}
      ${filters.tahunAwal ? `AND pp.TimestampPenebusan >= '${filters.tahunAwal}-01-01'` : ''}
      ${filters.tahunAkhir ? `AND pp.TimestampPenebusan < DATEADD(YEAR, 1, '${filters.tahunAkhir}-01-01')` : ''}
      ${filters.pupukId ? `AND pp.PupukId = ${filters.pupukId}` : ''}
    `;

    const joinClause = `
      FROM trans.PENEBUSAN_PUPUK pp
      JOIN master.PETANI p ON pp.PetaniId = p.PetaniId
      JOIN ref.KODE_POS kp ON p.KodePos = kp.KodePosId
    `;

    const [totalAbsorbedRes, provRes, trendRes, sectorsRes, kuotaRes] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(`
        SELECT CAST(ISNULL(SUM(pp.Jumlah), 0) / 1000 AS DECIMAL(18,2)) AS TotalTerserapTon
        ${joinClause}
        WHERE ${whereClause}
      `),
      prisma.$queryRawUnsafe<any[]>(`
        SELECT kp.Provinsi, ISNULL(SUM(pp.Jumlah), 0) AS TotalPupuk
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
    const totalDitebus = totalTon * 1000;
    const totalAlokasi = totalDitebus + totalSisaKuota;
    const realisasiPersen = totalAlokasi > 0
      ? ((totalDitebus / totalAlokasi) * 100).toFixed(2)
      : '0.00';

    const allProvinces = provRes.map((r: any) => ({
      Provinsi: r.Provinsi,
      TotalPupuk: Number(r.TotalPupuk),
    }));

    const result = {
      mapByProvince: allProvinces,
      totalAbsorbed: { TotalTerserapTon: String(totalTon) },
      realizationPercent: { RealisasiPersen: realisasiPersen },
      topProvinces: allProvinces.slice(0, 3),
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

    try {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(result));
    } catch { /* Redis unavailable, skip cache */ }

    return result;
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
   * Get pending users for verification with pagination
   */
  async getPendingUsers(pageNumber: number = 1, pageSize: number = 10) {
    const skip = (pageNumber - 1) * pageSize;

    const [users, totalCount, totalAll, totalAktif, totalDitolak] = await Promise.all([
      prisma.user.findMany({
        where: { Status: 'Pending' },
        select: {
          UserId: true,
          FirstName: true,
          MiddleName: true,
          LastName: true,
          Email: true,
          RegistrationProof: true,
          Role: { select: { RoleName: true } },
        },
        orderBy: { CreatedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.user.count({ where: { Status: 'Pending' } }),
      prisma.user.count(),
      prisma.user.count({ where: { Status: 'Active' } }),
      prisma.user.count({ where: { Status: 'Rejected' } }),
    ]);

    const pendingUsers = users.map((u, idx) => ({
      No: skip + idx + 1,
      UserId: u.UserId,
      NamaLengkap: [u.FirstName, u.MiddleName, u.LastName].filter(Boolean).join(' '),
      Email: u.Email,
      Role: u.Role.RoleName,
      RegistrationProof: u.RegistrationProof,
      TotalRows: totalCount,
    }));

    return {
      summary: [{ Total: totalAll, TotalAktif: totalAktif, TotalDitolak: totalDitolak }],
      pendingUsers,
    };
  }

  /**
   * Approve pending user
   */
  async approveUser(userId: number, approverId: number) {
    const user = await prisma.user.findUnique({
      where: { UserId: userId },
    });

    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 404);
    }

    if (user.Status !== 'Pending') {
      throw new AppError('Pengguna sudah diproses', 400);
    }

    await prisma.user.update({
      where: { UserId: userId },
      data: {
        Status: 'Active',
        UserIdPenyetuju: approverId,
        TimestampDisetujui: new Date(),
      },
    });

    await prisma.$executeRawUnsafe(`
      INSERT INTO evt.LOG_AKTIVITAS (LogId, Aksi, Deskripsi, UserId, Timestamp)
      VALUES (
        (SELECT ISNULL(MAX(LogId), 0) + 1 FROM evt.LOG_AKTIVITAS WITH (TABLOCKX)),
        'APPROVE_USER',
        ${esc(`Pengguna disetujui: ${user.Email}`)},
        ${approverId},
        GETDATE()
      )
    `);

    await prisma.$executeRawUnsafe(`
      INSERT INTO evt.NOTIFIKASI (NotifikasiId, Jenis, Judul, Pesan, StatusDibaca, UserId, Timestamp)
      VALUES (
        (SELECT ISNULL(MAX(NotifikasiId), 0) + 1 FROM evt.NOTIFIKASI WITH (TABLOCKX)),
        'APPROVAL',
        'Akun Disetujui',
        'Akun Anda telah disetujui dan sekarang aktif.',
        0,
        ${userId},
        GETDATE()
      )
    `);

    return { message: 'User berhasil disetujui' };
  }

  /**
   * Reject pending user
   */
  async rejectUser(userId: number, approverId: number) {
    const user = await prisma.user.findUnique({
      where: { UserId: userId },
    });

    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 404);
    }

    if (user.Status !== 'Pending') {
      throw new AppError('Pengguna sudah diproses', 400);
    }

    await prisma.user.update({
      where: { UserId: userId },
      data: {
        Status: 'Rejected',
        UserIdPenyetuju: approverId,
        TimestampDisetujui: new Date(),
      },
    });

    await prisma.$executeRawUnsafe(`
      INSERT INTO evt.LOG_AKTIVITAS (LogId, Aksi, Deskripsi, UserId, Timestamp)
      VALUES (
        (SELECT ISNULL(MAX(LogId), 0) + 1 FROM evt.LOG_AKTIVITAS WITH (TABLOCKX)),
        'REJECT_USER',
        ${esc(`Pengguna ditolak: ${user.Email}`)},
        ${approverId},
        GETDATE()
      )
    `);

    await prisma.$executeRawUnsafe(`
      INSERT INTO evt.NOTIFIKASI (NotifikasiId, Jenis, Judul, Pesan, StatusDibaca, UserId, Timestamp)
      VALUES (
        (SELECT ISNULL(MAX(NotifikasiId), 0) + 1 FROM evt.NOTIFIKASI WITH (TABLOCKX)),
        'REJECTION',
        'Akun Ditolak',
        'Maaf, akun Anda telah ditolak.',
        0,
        ${userId},
        GETDATE()
      )
    `);

    return { message: 'User berhasil ditolak' };
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
