import prisma from '../../config/database';
import { AppError } from '../../common/middleware/error.middleware';
import { Decimal } from '@prisma/client/runtime/library';

export class ShipmentService {
  async createShipment(
    distributorId: string,
    retailerId: string,
    pupukId: number,
    jumlah: number
  ) {
    if (jumlah <= 0) {
      throw new AppError('Jumlah harus lebih dari 0', 400);
    }

    // Validate retailer exists and is active
    const retailer = await prisma.user.findUnique({
      where: { UserId: retailerId },
      include: { Role: true },
    });

    if (!retailer) {
      throw new AppError('Pengecer tidak ditemukan', 404);
    }

    if (retailer.Role.RoleName !== 'PENGECER') {
      throw new AppError('User bukan pengecer', 400);
    }

    if (retailer.Status !== 'Active') {
      throw new AppError('Pengecer tidak aktif', 400);
    }

    // Validate stock
    const distributorStock = await prisma.stok.findUnique({
      where: {
        UserId_PupukId: {
          UserId: distributorId,
          PupukId: pupukId,
        },
      },
      include: {
        Pupuk: true,
      },
    });

    if (!distributorStock) {
      throw new AppError('Stok tidak ditemukan', 404);
    }

    if (distributorStock.Jumlah.lessThan(jumlah)) {
      throw new AppError('Stok tidak mencukupi', 400);
    }

    // Use transaction
    const result = await prisma.$transaction(async (tx) => {
      // Reduce distributor stock
      const newDistributorStock = distributorStock.Jumlah.minus(jumlah);
      await tx.stok.update({
        where: {
          UserId_PupukId: {
            UserId: distributorId,
            PupukId: pupukId,
          },
        },
        data: {
          Jumlah: newDistributorStock,
          Timestamp: new Date(),
        },
      });

      // Insert stock history for distributor
      await tx.riwayatStok.create({
        data: {
          UserId: distributorId,
          PupukId: pupukId,
          JumlahAwal: distributorStock.Jumlah,
          JumlahAkhir: newDistributorStock,
          TipePerubahan: 'Stok Keluar',
        },
      });

      // Create shipment
      const shipment = await tx.kirimanPupuk.create({
        data: {
          UserIdDistributor: distributorId,
          UserIdPengecer: retailerId,
          PupukId: pupukId,
          JumlahDikirim: jumlah,
          Status: 'Dikirim',
        },
        include: {
          Pupuk: true,
          Pengecer: {
            select: {
              FirstName: true,
              MiddleName: true,
              LastName: true,
              Email: true,
            },
          },
        },
      });

      // Log activity
      await tx.logAktivitas.create({
        data: {
          Aksi: 'CREATE_SHIPMENT',
          Deskripsi: `Mengirim ${jumlah} ${distributorStock.Pupuk.JenisPupuk} ke ${retailer.Email}`,
          UserId: distributorId,
        },
      });

      // Create notification for retailer
      await tx.notifikasi.create({
        data: {
          Jenis: 'SHIPMENT',
          Judul: 'Kiriman Baru',
          Pesan: `Anda menerima kiriman ${jumlah} ${distributorStock.Pupuk.JenisPupuk}`,
          UserId: retailerId,
        },
      });

      return shipment;
    });

    return result;
  }

  async getShipmentHistory(userId: string, role: string) {
    const where: any = {};

    if (role === 'DISTRIBUTOR') {
      where.UserIdDistributor = userId;
    } else if (role === 'PENGECER') {
      where.UserIdPengecer = userId;
    }

    const shipments = await prisma.kirimanPupuk.findMany({
      where,
      include: {
        Pupuk: {
          select: {
            JenisPupuk: true,
          },
        },
        Distributor: {
          select: {
            FirstName: true,
            MiddleName: true,
            LastName: true,
            Email: true,
          },
        },
        Pengecer: {
          select: {
            FirstName: true,
            MiddleName: true,
            LastName: true,
            Email: true,
          },
        },
      },
      orderBy: {
        TimestampDikirim: 'desc',
      },
    });

    return shipments;
  }

  async receiveShipment(
    kirimanId: string,
    retailerId: string,
    jumlahDiterima: number
  ) {
    if (jumlahDiterima <= 0) {
      throw new AppError('Jumlah diterima harus lebih dari 0', 400);
    }

    // Validate shipment
    const shipment = await prisma.kirimanPupuk.findUnique({
      where: { KirimanId: kirimanId },
      include: {
        Pupuk: true,
      },
    });

    if (!shipment) {
      throw new AppError('Kiriman tidak ditemukan', 404);
    }

    if (shipment.UserIdPengecer !== retailerId) {
      throw new AppError('Kiriman bukan untuk Anda', 403);
    }

    if (shipment.Status !== 'Dikirim') {
      throw new AppError('Kiriman sudah diproses', 400);
    }

    // Determine status
    const status = shipment.JumlahDikirim.equals(jumlahDiterima)
      ? 'Diterima'
      : 'Tidak Sesuai';

    // Use transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update shipment
      const updatedShipment = await tx.kirimanPupuk.update({
        where: { KirimanId: kirimanId },
        data: {
          JumlahDiterima: jumlahDiterima,
          Status: status,
          TimestampDiterima: new Date(),
        },
        include: {
          Pupuk: true,
        },
      });

      // Update retailer stock
      const existingStock = await tx.stok.findUnique({
        where: {
          UserId_PupukId: {
            UserId: retailerId,
            PupukId: shipment.PupukId,
          },
        },
      });

      const jumlahAwal = existingStock ? existingStock.Jumlah : new Decimal(0);
      const jumlahAkhir = jumlahAwal.plus(jumlahDiterima);

      if (existingStock) {
        await tx.stok.update({
          where: {
            UserId_PupukId: {
              UserId: retailerId,
              PupukId: shipment.PupukId,
            },
          },
          data: {
            Jumlah: jumlahAkhir,
            Timestamp: new Date(),
          },
        });
      } else {
        await tx.stok.create({
          data: {
            UserId: retailerId,
            PupukId: shipment.PupukId,
            Jumlah: jumlahDiterima,
          },
        });
      }

      // Insert stock history
      await tx.riwayatStok.create({
        data: {
          UserId: retailerId,
          PupukId: shipment.PupukId,
          JumlahAwal: jumlahAwal,
          JumlahAkhir: jumlahAkhir,
          TipePerubahan: 'Stok Masuk',
        },
      });

      // Log activity
      await tx.logAktivitas.create({
        data: {
          Aksi: 'RECEIVE_SHIPMENT',
          Deskripsi: `Menerima kiriman ${jumlahDiterima} ${shipment.Pupuk.JenisPupuk} (Status: ${status})`,
          UserId: retailerId,
        },
      });

      // If mismatch, create notification for distributor
      if (status === 'Tidak Sesuai') {
        await tx.notifikasi.create({
          data: {
            Jenis: 'MISMATCH',
            Judul: 'Ketidaksesuaian Kiriman',
            Pesan: `Kiriman ${shipment.Pupuk.JenisPupuk} tidak sesuai. Dikirim: ${shipment.JumlahDikirim}, Diterima: ${jumlahDiterima}`,
            UserId: shipment.UserIdDistributor,
          },
        });
      }

      return updatedShipment;
    });

    return result;
  }
}
