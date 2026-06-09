import prisma from '../../config/database';
import { AppError } from '../../common/middleware/error.middleware';

/**
 * Pengecer (Retailer) Service
 * Handles all retailer-related business logic using stored procedures
 */
export class PengecerService {
  /**
   * Get pengecer dashboard data
   * Composed from individual queries (avoiding multi-result-set SP limitation)
   */
  async getDashboard(userId: number) {
    const [stockRows, farmerCount, sisaKuotaRows, recentReceipts, recentRedemptions, notifications] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT COALESCE(SUM(Jumlah), 0) AS totalStock
        FROM trans.STOK WHERE UserId = ${userId}
      `,
      prisma.$queryRaw<any[]>`
        SELECT COUNT(*) AS totalPetani
        FROM master.PETANI WHERE UserIdPengecer = ${userId}
      `,
      prisma.$queryRaw<any[]>`
        SELECT COALESCE(SUM(kp.SisaKuota), 0) AS totalSisaKuota
        FROM master.KUOTA_PETANI kp
        JOIN master.PETANI p ON kp.PetaniId = p.PetaniId
        WHERE p.UserIdPengecer = ${userId}
      `,
      prisma.$queryRaw<any[]>`
        SELECT TOP 5
          k.KirimanId AS kirimanId,
          p.JenisPupuk AS jenisPupuk,
          k.JumlahDikirim AS jumlahDikirim,
          k.TimestampDikirim AS timestampDikirim,
          k.Status AS status
        FROM trans.KIRIMAN_PUPUK k
        JOIN master.PUPUK p ON k.PupukId = p.PupukId
        WHERE k.UserIdPengecer = ${userId}
        ORDER BY k.TimestampDikirim DESC
      `,
      prisma.$queryRaw<any[]>`
        SELECT TOP 5
          pb.TebusanId AS tebusanId,
          p.JenisPupuk AS jenisPupuk,
          pb.Jumlah AS jumlah,
          pb.TimestampPenebusan AS timestampPenebusan,
          pb.Status AS status,
          pt.FirstName AS petaniNama
        FROM trans.PENEBUSAN_PUPUK pb
        JOIN master.PUPUK p ON pb.PupukId = p.PupukId
        JOIN master.PETANI pt ON pb.PetaniId = pt.PetaniId
        WHERE pb.UserIdPengecer = ${userId}
        ORDER BY pb.TimestampPenebusan DESC
      `,
      prisma.$queryRaw<any[]>`EXEC dbo.usp_GetPengecerNotifikasi @UserId = ${userId}`,
    ]);

    return {
      summary: {
        totalStock: Number(stockRows[0]?.totalStock ?? 0),
        totalPetani: Number(farmerCount[0]?.totalPetani ?? 0),
        totalSisaKuota: Number(sisaKuotaRows[0]?.totalSisaKuota ?? 0),
      },
      notifications: (notifications || []).map(r => ({
        notifikasiId: String(r.NotifikasiId ?? ''),
        judul: r.JudulNotifikasi || r.Judul || '',
        pesan: r.PesanNotifikasi || r.Pesan || '',
        timestamp: r.TanggalNotifikasi || r.Timestamp || null,
      })),
      recentReceipts: (recentReceipts || []).map(r => ({
        kirimanId: String(r.kirimanId ?? ''),
        jenisPupuk: r.jenisPupuk || '',
        jumlahDikirim: Number(r.jumlahDikirim ?? 0),
        timestampDikirim: r.timestampDikirim || null,
        status: r.status || '',
      })),
      recentRedemptions: (recentRedemptions || []).map(r => ({
        tebusanId: String(r.tebusanId ?? ''),
        jenisPupuk: r.jenisPupuk || '',
        jumlah: Number(r.jumlah ?? 0),
        timestampPenebusan: r.timestampPenebusan || null,
        status: r.status || '',
        petani: r.petaniNama || '',
      })),
    };
  }

  /**
   * Get recent receipts
   * SP: dbo.usp_GetPengecerRecentPenerimaan
   */
  async getRecentReceipts(userId: number) {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      EXEC dbo.usp_GetPengecerRecentPenerimaan @UserIdPengecer = ${userId}
    `);

    return result;
  }

  /**
   * Validate shipment for receiving
   * SP: dbo.usp_ValidateKirimanForPengecer
   */
  async validateShipment(userId: number, kirimanId: number) {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      EXEC dbo.usp_ValidateKirimanForPengecer
        @UserIdPengecer = ${userId},
        @KirimanId = ${kirimanId}
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
    pengecerId: number;
    kirimanId: number;
    jumlahDiterima: number;
    timestampDiterima?: Date;
  }) {
    try {
      const timestampParam = data.timestampDiterima
        ? `'${data.timestampDiterima.toISOString()}'`
        : 'NULL';

      const result = await prisma.$queryRawUnsafe<any[]>(`
        EXEC dbo.usp_TerimaKirimanPengecer
          @UserIdPengecer = ${data.pengecerId},
          @KirimanId = ${data.kirimanId},
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
   * Get stock dashboard with pagination
   * Composed from individual queries (avoiding multi-result-set SP limitation)
   */
  async getStockDashboard(
    userId: number,
    pageNumber: number = 1,
    sortColumn: 'JumlahStok' | 'LastUpdated' = 'LastUpdated',
    sortDirection: 'ASC' | 'DESC' = 'DESC'
  ) {
    const [totalRows, stockItems] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT COALESCE(SUM(Jumlah), 0) AS totalStockTon
        FROM trans.STOK WHERE UserId = ${userId}
      `,
      prisma.$queryRaw<any[]>`
        SELECT
          s.PupukId AS pupukId,
          p.JenisPupuk AS jenisPupuk,
          s.Jumlah AS jumlahStok,
          s.Timestamp AS lastUpdated
        FROM trans.STOK s
        JOIN master.PUPUK p ON s.PupukId = p.PupukId
        WHERE s.UserId = ${userId}
        ORDER BY s.Timestamp DESC
      `,
    ]);

    return {
      totalStockTon: totalRows[0]?.totalStockTon ?? 0,
      stockItems: stockItems || [],
    };
  }

  /**
   * Add incoming stock
   * SP: dbo.usp_TambahStokPengecer
   */
  async addStock(data: {
    userId: number;
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
          @UserId = ${data.userId},
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
   */
  async getReceiptHistory(userId: number, pageNumber: number = 1) {
    const [summary, receipts] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT
          COUNT(*) AS totalPenerimaan,
          COALESCE(SUM(JumlahDikirim), 0) AS totalJumlah
        FROM trans.KIRIMAN_PUPUK
        WHERE UserIdPengecer = ${userId}
      `,
      prisma.$queryRaw<any[]>`
        SELECT
          k.KirimanId AS kirimanId,
          p.JenisPupuk AS jenisPupuk,
          k.JumlahDikirim AS jumlahDikirim,
          k.JumlahDiterima AS jumlahDiterima,
          k.TimestampDikirim AS timestampDikirim,
          k.TimestampDiterima AS timestampDiterima,
          k.Status AS status
        FROM trans.KIRIMAN_PUPUK k
        JOIN master.PUPUK p ON k.PupukId = p.PupukId
        WHERE k.UserIdPengecer = ${userId}
        ORDER BY k.TimestampDikirim DESC
      `,
    ]);

    return {
      summary: {
        totalPenerimaan: Number(summary[0]?.totalPenerimaan ?? 0),
        totalJumlah: Number(summary[0]?.totalJumlah ?? 0),
      },
      receipts: (receipts || []).map(r => ({
        kirimanId: String(r.kirimanId ?? ''),
        jenisPupuk: r.jenisPupuk || '',
        jumlahDikirim: Number(r.jumlahDikirim ?? 0),
        jumlahDiterima: r.jumlahDiterima != null ? Number(r.jumlahDiterima) : null,
        timestampDikirim: r.timestampDikirim || null,
        timestampDiterima: r.timestampDiterima || null,
        status: r.status || '',
      })),
    };
  }

  /**
   * Get redemption history
   */
  async getRedemptionHistory(userId: number, pageNumber: number = 1) {
    const [summary, redemptions] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT
          COUNT(*) AS totalPenebusan,
          COALESCE(SUM(Jumlah), 0) AS totalJumlah
        FROM trans.PENEBUSAN_PUPUK
        WHERE UserIdPengecer = ${userId}
      `,
      prisma.$queryRaw<any[]>`
        SELECT
          pb.TebusanId AS tebusanId,
          p.JenisPupuk AS jenisPupuk,
          pb.Jumlah AS jumlah,
          pb.TimestampPenebusan AS timestampPenebusan,
          pb.Status AS status,
          pt.FirstName AS petaniNamaDepan,
          pt.LastName AS petaniNamaBelakang
        FROM trans.PENEBUSAN_PUPUK pb
        JOIN master.PUPUK p ON pb.PupukId = p.PupukId
        JOIN master.PETANI pt ON pb.PetaniId = pt.PetaniId
        WHERE pb.UserIdPengecer = ${userId}
        ORDER BY pb.TimestampPenebusan DESC
      `,
    ]);

    return {
      summary: {
        totalPenebusan: Number(summary[0]?.totalPenebusan ?? 0),
        totalJumlah: Number(summary[0]?.totalJumlah ?? 0),
      },
      redemptions: (redemptions || []).map(r => ({
        tebusanId: String(r.tebusanId ?? ''),
        jenisPupuk: r.jenisPupuk || '',
        jumlah: Number(r.jumlah ?? 0),
        timestampPenebusan: r.timestampPenebusan || null,
        status: r.status || '',
        petani: [r.petaniNamaDepan, r.petaniNamaBelakang].filter(Boolean).join(' ') || '',
      })),
    };
  }

  /**
   * Get notifications with pagination
   * SP: dbo.usp_GetPengecerNotifikasi
   */
  async getNotifications(userId: number, pageNumber: number = 1) {
    const rows = await prisma.$queryRawUnsafe<any[]>(`
      EXEC dbo.usp_GetPengecerNotifikasi
        @UserId = ${userId},
        @PageNumber = ${pageNumber}
    `);

    return (rows || []).map(r => ({
      notifikasiId: String(r.NotifikasiId ?? ''),
      judul: r.JudulNotifikasi || r.Judul || '',
      pesan: r.PesanNotifikasi || r.Pesan || '',
      timestamp: r.TanggalNotifikasi || r.Timestamp || null,
    }));
  }

  /**
   * Validate petani (farmer) for redemption
   * Composed from individual queries (avoiding multi-result-set SP limitation)
   */
  async validatePetani(userId: number, petaniId: string) {
    try {
      const [petaniRows, quotaRows] = await Promise.all([
        prisma.$queryRaw<any[]>`
          SELECT
            PetaniId AS petaniId,
            FirstName AS namaDepan,
            MiddleName AS namaTengah,
            LastName AS namaBelakang,
            NomorHp AS nomorHp,
            Status AS status,
            AwalTerdaftar AS awalTerdaftar,
            AkhirTerdaftar AS akhirTerdaftar
          FROM master.PETANI
          WHERE PetaniId = ${petaniId} AND UserIdPengecer = ${userId}
        `,
        prisma.$queryRaw<any[]>`
          SELECT
            kp.PupukId AS pupukId,
            p.JenisPupuk AS jenisPupuk,
            kp.SisaKuota AS sisaKuota
          FROM master.KUOTA_PETANI kp
          JOIN master.PUPUK p ON kp.PupukId = p.PupukId
          WHERE kp.PetaniId = ${petaniId}
        `,
      ]);

      const petani = petaniRows[0];
      if (!petani) {
        throw new AppError('Petani tidak ditemukan', 400);
      }
      if (petani.status !== 'Aktif' && petani.status !== 'Active') {
        throw new AppError('Petani tidak aktif', 400);
      }

      return {
        petaniDetails: {
          petaniId: petani.petaniId,
          nama: [petani.namaDepan, petani.namaTengah, petani.namaBelakang].filter(Boolean).join(' '),
          nomorHp: petani.nomorHp,
          status: petani.status,
        },
        quotas: (quotaRows || []).map(q => ({
          pupukId: Number(q.pupukId ?? 0),
          jenisPupuk: q.jenisPupuk || '',
          sisaKuota: Number(q.sisaKuota ?? 0),
        })),
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
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
    pengecerId: number;
    petaniId: string;
    pupukId: number;
    jumlah: number;
  }) {
    try {
      const result = await prisma.$queryRawUnsafe<any[]>(`
        EXEC dbo.usp_CreatePenebusan
          @UserIdPengecer = ${data.pengecerId},
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
  async markNotificationRead(notifikasiId: number, userId: number) {
    const result = await prisma.$queryRawUnsafe<any[]>(`
      EXEC dbo.usp_MarkNotifikasiDibaca
        @NotifikasiId = ${notifikasiId},
        @UserId = ${userId}
    `);

    return result[0];
  }
}
