import prisma from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';

export class LandingService {
  async getStats() {
    // Total farmers
    const totalFarmers = await prisma.petani.count();

    // Total distributed (in tons)
    const redemptions = await prisma.penebusanPupuk.findMany();
    const totalDistributedKg = redemptions.reduce(
      (sum, r) => sum.plus(r.Jumlah),
      new Decimal(0)
    );
    const distributedTon = totalDistributedKg.dividedBy(1000).toNumber();

    // Fertilizer count
    const fertilizerCount = await prisma.pupuk.count();

    // Most popular fertilizer
    const redemptionsByFertilizer = await prisma.penebusanPupuk.groupBy({
      by: ['PupukId'],
      _sum: {
        Jumlah: true,
      },
      orderBy: {
        _sum: {
          Jumlah: 'desc',
        },
      },
      take: 1,
    });

    let mostPopularFertilizer = 'N/A';
    if (redemptionsByFertilizer.length > 0) {
      const pupuk = await prisma.pupuk.findUnique({
        where: { PupukId: redemptionsByFertilizer[0].PupukId },
      });
      mostPopularFertilizer = pupuk?.JenisPupuk || 'N/A';
    }

    // Active distributors and retailers
    const activeDistributors = await prisma.user.count({
      where: {
        Status: 'Active',
        Role: {
          RoleName: 'DISTRIBUTOR',
        },
      },
    });

    const activeRetailers = await prisma.user.count({
      where: {
        Status: 'Active',
        Role: {
          RoleName: 'PENGECER',
        },
      },
    });

    // Total shipments
    const totalShipments = await prisma.kirimanPupuk.count();

    // Distribution by province
    const redemptionsWithLocation = await prisma.penebusanPupuk.findMany({
      include: {
        Petani: {
          include: {
            KodePos: true,
          },
        },
      },
    });

    const byProvince = new Map<string, Decimal>();
    redemptionsWithLocation.forEach((r) => {
      const province = r.Petani.KodePos.Provinsi;
      const current = byProvince.get(province) || new Decimal(0);
      byProvince.set(province, current.plus(r.Jumlah));
    });

    const topProvinces = Array.from(byProvince.entries())
      .map(([province, amount]) => ({
        province,
        amount: amount.toNumber(),
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalFarmers,
      distributedTon: Math.round(distributedTon * 100) / 100,
      fertilizerCount,
      mostPopularFertilizer,
      activeDistributors,
      activeRetailers,
      totalShipments,
      topProvinces,
    };
  }

  async getAbout() {
    return {
      name: 'AgriFlow',
      description:
        'Sistem Manajemen Distribusi Subsidi Pupuk untuk mengelola alur stok dan penebusan subsidi dari Pemerintah → Distributor → Pengecer → Petani.',
      version: '1.0.0',
      features: [
        'Manajemen stok pupuk bersubsidi',
        'Pelacakan pengiriman distributor ke pengecer',
        'Validasi dan penebusan kuota petani',
        'Monitoring dan analitik distribusi',
        'Deteksi anomali otomatis',
        'Sistem notifikasi real-time',
      ],
      roles: [
        {
          name: 'Pemerintah',
          description:
            'Menyetujui registrasi pengguna, monitoring distribusi, dan melihat laporan anomali',
        },
        {
          name: 'Distributor',
          description:
            'Mengelola stok pupuk dan membuat pengiriman ke pengecer',
        },
        {
          name: 'Pengecer',
          description:
            'Menerima pengiriman, memvalidasi petani, dan memproses penebusan pupuk',
        },
      ],
      contact: {
        email: 'support@agriflow.com',
        phone: '+62-xxx-xxxx-xxxx',
      },
    };
  }

  async getFertilizers() {
    const fertilizers = await prisma.pupuk.findMany({
      orderBy: {
        JenisPupuk: 'asc',
      },
    });

    // Get distribution stats for each fertilizer
    const fertilizerStats = await Promise.all(
      fertilizers.map(async (f) => {
        const redemptions = await prisma.penebusanPupuk.findMany({
          where: { PupukId: f.PupukId },
        });

        const totalDistributed = redemptions.reduce(
          (sum, r) => sum.plus(r.Jumlah),
          new Decimal(0)
        );

        const totalStock = await prisma.stok.findMany({
          where: { PupukId: f.PupukId },
        });

        const availableStock = totalStock.reduce(
          (sum, s) => sum.plus(s.Jumlah),
          new Decimal(0)
        );

        return {
          pupukId: f.PupukId,
          jenisPupuk: f.JenisPupuk,
          totalDistributed: totalDistributed.toNumber(),
          availableStock: availableStock.toNumber(),
          redemptionCount: redemptions.length,
        };
      })
    );

    return fertilizerStats;
  }
}
