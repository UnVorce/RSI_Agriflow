import prisma from '../../config/database';
import { AppError } from '../../common/middleware/error.middleware';

export class RedemptionService {
  async validateFarmer(petaniId: string, retailerId: string) {
    // Validate PetaniId format (exactly 16 digits)
    if (!/^\d{16}$/.test(petaniId)) {
      throw new AppError('ID Petani harus 16 digit', 400);
    }

    // Find farmer
    const farmer = await prisma.petani.findUnique({
      where: { PetaniId: petaniId },
      include: {
        KodePos: true,
        KuotaPetani: {
          include: {
            Pupuk: true,
          },
        },
      },
    });

    if (!farmer) {
      throw new AppError('Petani tidak ditemukan', 404);
    }

    // Validate ownership
    if (farmer.UserIdPengecer !== retailerId) {
      throw new AppError('Petani bukan milik pengecer ini', 403);
    }

    // Check if registration is still valid
    const now = new Date();
    if (now < farmer.AwalTerdaftar || now > farmer.AkhirTerdaftar) {
      throw new AppError('Periode registrasi petani tidak valid', 400);
    }

    return {
      petani: {
        petaniId: farmer.PetaniId,
        nama: `${farmer.FirstName} ${farmer.MiddleName || ''} ${farmer.LastName || ''}`.trim(),
        nomorHp: farmer.NomorHp,
        alamat: `${farmer.Jalan}, RT ${farmer.Rt}/RW ${farmer.Rw}, ${farmer.KodePos.KelurahanDesa}, ${farmer.KodePos.Kecamatan}, ${farmer.KodePos.KabupatenKota}, ${farmer.KodePos.Provinsi}`,
        sektor: farmer.Sektor,
        luasLahan: farmer.LuasLahan,
        status: farmer.Status,
      },
      kuota: farmer.KuotaPetani.map((k) => ({
        pupukId: k.PupukId,
        jenisPupuk: k.Pupuk.JenisPupuk,
        sisaKuota: k.SisaKuota,
      })),
    };
  }

  async redeemFertilizer(
    retailerId: string,
    petaniId: string,
    pupukId: number,
    jumlah: number
  ) {
    if (jumlah <= 0) {
      throw new AppError('Jumlah harus lebih dari 0', 400);
    }

    // Validate PetaniId format
    if (!/^\d{16}$/.test(petaniId)) {
      throw new AppError('ID Petani harus 16 digit', 400);
    }

    // Validate farmer
    const farmer = await prisma.petani.findUnique({
      where: { PetaniId: petaniId },
    });

    if (!farmer) {
      throw new AppError('Petani tidak ditemukan', 404);
    }

    if (farmer.UserIdPengecer !== retailerId) {
      throw new AppError('Petani bukan milik pengecer ini', 403);
    }

    // Check registration period
    const now = new Date();
    if (now < farmer.AwalTerdaftar || now > farmer.AkhirTerdaftar) {
      throw new AppError('Periode registrasi petani tidak valid', 400);
    }

    // Validate retailer stock
    const retailerStock = await prisma.stok.findUnique({
      where: {
        UserId_PupukId: {
          UserId: retailerId,
          PupukId: pupukId,
        },
      },
      include: {
        Pupuk: true,
      },
    });

    if (!retailerStock) {
      throw new AppError('Stok pupuk tidak ditemukan', 404);
    }

    if (retailerStock.Jumlah.lessThan(jumlah)) {
      throw new AppError('Stok pengecer tidak mencukupi', 400);
    }

    // Validate farmer quota
    const quota = await prisma.kuotaPetani.findUnique({
      where: {
        PetaniId_PupukId: {
          PetaniId: petaniId,
          PupukId: pupukId,
        },
      },
    });

    if (!quota) {
      throw new AppError('Kuota pupuk tidak ditemukan untuk petani ini', 404);
    }

    if (quota.SisaKuota.lessThan(jumlah)) {
      throw new AppError('Kuota petani tidak mencukupi', 400);
    }

    // Use transaction
    const result = await prisma.$transaction(async (tx) => {
      // Reduce quota
      const newQuota = quota.SisaKuota.minus(jumlah);
      await tx.kuotaPetani.update({
        where: {
          PetaniId_PupukId: {
            PetaniId: petaniId,
            PupukId: pupukId,
          },
        },
        data: {
          SisaKuota: newQuota,
        },
      });

      // Reduce retailer stock
      const newStock = retailerStock.Jumlah.minus(jumlah);
      await tx.stok.update({
        where: {
          UserId_PupukId: {
            UserId: retailerId,
            PupukId: pupukId,
          },
        },
        data: {
          Jumlah: newStock,
          Timestamp: new Date(),
        },
      });

      // Insert stock history
      await tx.riwayatStok.create({
        data: {
          UserId: retailerId,
          PupukId: pupukId,
          JumlahAwal: retailerStock.Jumlah,
          JumlahAkhir: newStock,
          TipePerubahan: 'Stok Keluar',
        },
      });

      // Create redemption record
      const redemption = await tx.penebusanPupuk.create({
        data: {
          UserIdPengecer: retailerId,
          PetaniId: petaniId,
          PupukId: pupukId,
          Jumlah: jumlah,
          Status: 'Selesai',
        },
        include: {
          Pupuk: true,
          Petani: {
            select: {
              FirstName: true,
              MiddleName: true,
              LastName: true,
            },
          },
        },
      });

      // Log activity
      await tx.logAktivitas.create({
        data: {
          Aksi: 'REDEMPTION',
          Deskripsi: `Penebusan ${jumlah} ${retailerStock.Pupuk.JenisPupuk} oleh petani ${petaniId}`,
          UserId: retailerId,
        },
      });

      return redemption;
    });

    return result;
  }

  async getRedemptionHistory(retailerId: string) {
    const redemptions = await prisma.penebusanPupuk.findMany({
      where: {
        UserIdPengecer: retailerId,
      },
      include: {
        Pupuk: {
          select: {
            JenisPupuk: true,
          },
        },
        Petani: {
          select: {
            FirstName: true,
            MiddleName: true,
            LastName: true,
            NomorHp: true,
          },
        },
      },
      orderBy: {
        TimestampPenebusan: 'desc',
      },
    });

    return redemptions;
  }
}
