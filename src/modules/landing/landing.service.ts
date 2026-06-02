import prisma from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';
import { StoredProcedureExecutor } from '../../utils/stored-procedures';

interface LandingMetrics {
  JumlahPetani: number;
  JumlahPupukTersalurkan: number;
  JumlahJenisPupuk: number;
}

interface DistribusiPupuk {
  NamaPupuk: string;
  JumlahTersalurkan: number;
}

export class LandingService {
  async getStats() {
    // Execute stored procedure: dbo.usp_GetLandingPageData
    const result = await prisma.$queryRawUnsafe<any[]>(`
      EXEC dbo.usp_GetLandingPageData
    `);

    // SQL Server returns multiple result sets as nested arrays
    const metrics = result[0] as LandingMetrics;
    const distribusi = result.slice(1) as DistribusiPupuk[];

    return {
      totalFarmers: metrics.JumlahPetani,
      distributedTon: Math.round((metrics.JumlahPupukTersalurkan / 1000) * 100) / 100,
      fertilizerCount: metrics.JumlahJenisPupuk,
      mostPopularFertilizer: distribusi[0]?.NamaPupuk || 'N/A',
      fertilizerDistribution: distribusi.map(d => ({
        name: d.NamaPupuk,
        amount: d.JumlahTersalurkan,
      })),
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
