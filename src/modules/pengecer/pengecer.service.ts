import prisma from '../../config/database';
import logger from '../../utils/logger';
import { parseDatabaseError } from '../../utils/fsdErrorHandler';
import { ERR_BUS_04, ERR_BUS_05, ERR_BUS_06, ERR_INVALID_AMOUNT, ERR_VAL_05 } from '../../common/errors/fsdErrors';

/**
 * Pengecer (Retailer) Service - FSD-Compliant Error Handling
 * All errors mapped to FSD codes for user-friendly messages
 */
export class PengecerService {
  async getDashboard(userId: number) {
    try {
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
    } catch (error: any) {
      logger.error('Failed to get pengecer dashboard', { userId, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async getRecentReceipts(userId: number) {
    try {
      const result = await prisma.$queryRawUnsafe<any[]>(`
        EXEC dbo.usp_GetPengecerRecentPenerimaan @UserIdPengecer = ${userId}
      `);
      return result;
    } catch (error: any) {
      logger.error('Failed to get recent receipts', { userId, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async validateShipment(userId: number, kirimanId: number) {
    try {
      const result = await prisma.$queryRawUnsafe<any[]>(`
        EXEC dbo.usp_ValidateKirimanForPengecer
          @UserIdPengecer = ${userId},
          @KirimanId = ${kirimanId}
      `);

      const validation = result[0];

      if (!validation.IsValid) {
        throw parseDatabaseError({ message: validation.Message });
      }

      return validation;
    } catch (error: any) {
      if (error.name === 'BusinessRuleError' || error.name === 'FSDError') throw error;
      logger.error('Failed to validate shipment', { userId, kirimanId, error: error.message });
      throw parseDatabaseError(error);
    }
  }

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
      logger.error('Failed to receive shipment', { data, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async getStockDashboard(
    userId: number,
    pageNumber: number = 1,
    sortColumn: 'JumlahStok' | 'LastUpdated' = 'LastUpdated',
    sortDirection: 'ASC' | 'DESC' = 'DESC'
  ) {
    try {
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
    } catch (error: any) {
      logger.error('Failed to get stock dashboard', { userId, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async addStock(data: {
    userId: number;
    pupukId: number;
    jumlahMasuk: number;
    waktu?: Date;
  }) {
    try {
      if (data.jumlahMasuk <= 0) {
        throw ERR_INVALID_AMOUNT();
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
      if (error.name === 'ValidationError' || error.name === 'FSDError') throw error;
      logger.error('Failed to add stock', { data, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async getReceiptHistory(userId: number, pageNumber: number = 1) {
    try {
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
    } catch (error: any) {
      logger.error('Failed to get receipt history', { userId, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async getRedemptionHistory(userId: number, pageNumber: number = 1) {
    try {
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
    } catch (error: any) {
      logger.error('Failed to get redemption history', { userId, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async getNotifications(userId: number, pageNumber: number = 1) {
    try {
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
    } catch (error: any) {
      logger.error('Failed to get notifications', { userId, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async validatePetani(userId: number, petaniId: string) {
    try {
      // ERR-VAL-05: Format validation
      if (!/^\d{16}$/.test(petaniId)) {
        throw ERR_VAL_05();
      }

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
        throw ERR_BUS_04(); // Petani not found
      }
      if (petani.status !== 'Aktif' && petani.status !== 'Active') {
        throw ERR_BUS_04(); // Petani not active
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
      if (error.name === 'ValidationError' || error.name === 'BusinessRuleError' || error.name === 'FSDError') throw error;
      logger.error('Failed to validate petani', { userId, petaniId, error: error.message });
      throw parseDatabaseError(error);
    }
  }

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
      logger.error('Failed to create redemption', { data, error: error.message });
      throw parseDatabaseError(error);
    }
  }

  async markNotificationRead(notifikasiId: number, userId: number) {
    try {
      const result = await prisma.$queryRawUnsafe<any[]>(`
        EXEC dbo.usp_MarkNotifikasiDibaca
          @NotifikasiId = ${notifikasiId},
          @UserId = ${userId}
      `);

      return result[0];
    } catch (error: any) {
      logger.error('Failed to mark notification as read', { notifikasiId, userId, error: error.message });
      throw parseDatabaseError(error);
    }
  }
}
