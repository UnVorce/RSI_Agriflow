import prisma from '../../config/database';
import { AppError } from '../../common/middleware/error.middleware';
import { Decimal } from '@prisma/client/runtime/library';

export class StockService {
  async getStock(userId: string, pupukId?: number, search?: string) {
    const where: any = {
      UserId: userId,
    };

    if (pupukId) {
      where.PupukId = pupukId;
    }

    if (search) {
      where.Pupuk = {
        JenisPupuk: {
          contains: search,
        },
      };
    }

    const stock = await prisma.stok.findMany({
      where,
      include: {
        Pupuk: {
          select: {
            PupukId: true,
            JenisPupuk: true,
          },
        },
      },
      orderBy: {
        Timestamp: 'desc',
      },
    });

    return stock;
  }

  async addStock(userId: string, pupukId: number, jumlah: number) {
    if (jumlah <= 0) {
      throw new AppError('Jumlah harus lebih dari 0', 400);
    }

    // Check if pupuk exists
    const pupuk = await prisma.pupuk.findUnique({
      where: { PupukId: pupukId },
    });

    if (!pupuk) {
      throw new AppError('Jenis pupuk tidak ditemukan', 404);
    }

    // Use transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if stock exists
      const existingStock = await tx.stok.findUnique({
        where: {
          UserId_PupukId: {
            UserId: userId,
            PupukId: pupukId,
          },
        },
      });

      let stock;
      const jumlahAwal = existingStock ? existingStock.Jumlah : new Decimal(0);
      const jumlahAkhir = jumlahAwal.plus(jumlah);

      if (existingStock) {
        // Update existing stock
        stock = await tx.stok.update({
          where: {
            UserId_PupukId: {
              UserId: userId,
              PupukId: pupukId,
            },
          },
          data: {
            Jumlah: jumlahAkhir,
            Timestamp: new Date(),
          },
          include: {
            Pupuk: true,
          },
        });
      } else {
        // Create new stock
        stock = await tx.stok.create({
          data: {
            UserId: userId,
            PupukId: pupukId,
            Jumlah: jumlah,
          },
          include: {
            Pupuk: true,
          },
        });
      }

      // Insert stock history
      await tx.riwayatStok.create({
        data: {
          UserId: userId,
          PupukId: pupukId,
          JumlahAwal: jumlahAwal,
          JumlahAkhir: jumlahAkhir,
          TipePerubahan: 'Stok Masuk',
        },
      });

      // Log activity
      await tx.logAktivitas.create({
        data: {
          Aksi: 'ADD_STOCK',
          Deskripsi: `Menambah stok ${pupuk.JenisPupuk} sebanyak ${jumlah}`,
          UserId: userId,
        },
      });

      return stock;
    });

    return result;
  }

  async updateStock(
    userId: string,
    pupukId: number,
    jumlah: number,
    requesterId: string
  ) {
    if (jumlah < 0) {
      throw new AppError('Jumlah tidak boleh negatif', 400);
    }

    // Check if stock exists
    const existingStock = await prisma.stok.findUnique({
      where: {
        UserId_PupukId: {
          UserId: userId,
          PupukId: pupukId,
        },
      },
      include: {
        Pupuk: true,
      },
    });

    if (!existingStock) {
      throw new AppError('Stok tidak ditemukan', 404);
    }

    // Use transaction
    const result = await prisma.$transaction(async (tx) => {
      const jumlahAwal = existingStock.Jumlah;
      const jumlahAkhir = new Decimal(jumlah);

      // Update stock
      const stock = await tx.stok.update({
        where: {
          UserId_PupukId: {
            UserId: userId,
            PupukId: pupukId,
          },
        },
        data: {
          Jumlah: jumlahAkhir,
          Timestamp: new Date(),
        },
        include: {
          Pupuk: true,
        },
      });

      // Insert stock history
      await tx.riwayatStok.create({
        data: {
          UserId: userId,
          PupukId: pupukId,
          JumlahAwal: jumlahAwal,
          JumlahAkhir: jumlahAkhir,
          TipePerubahan: 'Penyesuaian',
        },
      });

      // Log activity
      await tx.logAktivitas.create({
        data: {
          Aksi: 'UPDATE_STOCK',
          Deskripsi: `Menyesuaikan stok ${existingStock.Pupuk.JenisPupuk} dari ${jumlahAwal} menjadi ${jumlahAkhir}`,
          UserId: requesterId,
        },
      });

      return stock;
    });

    return result;
  }

  async getStockHistory(
    userId: string,
    startDate?: string,
    endDate?: string,
    pupukId?: number
  ) {
    const where: any = {
      UserId: userId,
    };

    if (pupukId) {
      where.PupukId = pupukId;
    }

    if (startDate || endDate) {
      where.Timestamp = {};
      if (startDate) {
        where.Timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.Timestamp.lte = new Date(endDate);
      }
    }

    const history = await prisma.riwayatStok.findMany({
      where,
      include: {
        Pupuk: {
          select: {
            JenisPupuk: true,
          },
        },
      },
      orderBy: {
        Timestamp: 'desc',
      },
    });

    return history;
  }
}
