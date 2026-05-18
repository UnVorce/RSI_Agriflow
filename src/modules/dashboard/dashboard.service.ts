import prisma from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';

export class DashboardService {
  async getDistributorDashboard(userId: string) {
    // Get total stock
    const stocks = await prisma.stok.findMany({
      where: { UserId: userId },
      include: {
        Pupuk: true,
      },
    });

    const totalStock = stocks.reduce((sum, s) => sum.plus(s.Jumlah), new Decimal(0));

    // Get total outbound (shipments sent)
    const shipments = await prisma.kirimanPupuk.findMany({
      where: { UserIdDistributor: userId },
    });

    const totalOutbound = shipments.reduce(
      (sum, s) => sum.plus(s.JumlahDikirim),
      new Decimal(0)
    );

    // Get recent activities
    const recentActivities = await prisma.logAktivitas.findMany({
      where: { UserId: userId },
      orderBy: { Timestamp: 'desc' },
      take: 10,
    });

    // Get unread notifications
    const notifications = await prisma.notifikasi.findMany({
      where: {
        UserId: userId,
        StatusDibaca: false,
      },
      orderBy: { Timestamp: 'desc' },
      take: 5,
    });

    // Get stock by fertilizer type
    const stockByType = stocks.map((s) => ({
      pupukId: s.PupukId,
      jenisPupuk: s.Pupuk.JenisPupuk,
      jumlah: s.Jumlah,
    }));

    // Get pending shipments
    const pendingShipments = await prisma.kirimanPupuk.count({
      where: {
        UserIdDistributor: userId,
        Status: 'Dikirim',
      },
    });

    return {
      totalStock: totalStock.toNumber(),
      totalOutbound: totalOutbound.toNumber(),
      pendingShipments,
      stockByType,
      recentActivities: recentActivities.map((a) => ({
        aksi: a.Aksi,
        deskripsi: a.Deskripsi,
        timestamp: a.Timestamp,
      })),
      notifications: notifications.map((n) => ({
        id: n.NotifikasiId,
        jenis: n.Jenis,
        judul: n.Judul,
        pesan: n.Pesan,
        timestamp: n.Timestamp,
      })),
    };
  }

  async getRetailerDashboard(userId: string) {
    // Get total stock
    const stocks = await prisma.stok.findMany({
      where: { UserId: userId },
      include: {
        Pupuk: true,
      },
    });

    const totalStock = stocks.reduce((sum, s) => sum.plus(s.Jumlah), new Decimal(0));

    // Get farmer count
    const farmerCount = await prisma.petani.count({
      where: { UserIdPengecer: userId },
    });

    // Get active farmers (within registration period)
    const now = new Date();
    const activeFarmers = await prisma.petani.count({
      where: {
        UserIdPengecer: userId,
        AwalTerdaftar: { lte: now },
        AkhirTerdaftar: { gte: now },
        Status: 'Active',
      },
    });

    // Get total redemptions
    const redemptions = await prisma.penebusanPupuk.findMany({
      where: { UserIdPengecer: userId },
    });

    const totalRedemptions = redemptions.reduce(
      (sum, r) => sum.plus(r.Jumlah),
      new Decimal(0)
    );

    // Get recent activities
    const recentActivities = await prisma.logAktivitas.findMany({
      where: { UserId: userId },
      orderBy: { Timestamp: 'desc' },
      take: 10,
    });

    // Get unread notifications
    const notifications = await prisma.notifikasi.findMany({
      where: {
        UserId: userId,
        StatusDibaca: false,
      },
      orderBy: { Timestamp: 'desc' },
      take: 5,
    });

    // Get stock by fertilizer type
    const stockByType = stocks.map((s) => ({
      pupukId: s.PupukId,
      jenisPupuk: s.Pupuk.JenisPupuk,
      jumlah: s.Jumlah,
    }));

    // Get pending shipments to receive
    const pendingShipments = await prisma.kirimanPupuk.count({
      where: {
        UserIdPengecer: userId,
        Status: 'Dikirim',
      },
    });

    return {
      totalStock: totalStock.toNumber(),
      farmerCount,
      activeFarmers,
      totalRedemptions: totalRedemptions.toNumber(),
      pendingShipments,
      stockByType,
      recentActivities: recentActivities.map((a) => ({
        aksi: a.Aksi,
        deskripsi: a.Deskripsi,
        timestamp: a.Timestamp,
      })),
      notifications: notifications.map((n) => ({
        id: n.NotifikasiId,
        jenis: n.Jenis,
        judul: n.Judul,
        pesan: n.Pesan,
        timestamp: n.Timestamp,
      })),
    };
  }

  async getGovernmentDashboard() {
    // Get total users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['RoleId', 'Status'],
      _count: true,
    });

    const roles = await prisma.role.findMany();
    const roleMap = new Map(roles.map((r) => [r.RoleId, r.RoleName]));

    const userStats = usersByRole.map((u) => ({
      role: roleMap.get(u.RoleId),
      status: u.Status,
      count: u._count,
    }));

    // Get pending approvals
    const pendingApprovals = await prisma.user.count({
      where: { Status: 'Pending' },
    });

    // Get total fertilizer distributed
    const allRedemptions = await prisma.penebusanPupuk.findMany();
    const totalDistributed = allRedemptions.reduce(
      (sum, r) => sum.plus(r.Jumlah),
      new Decimal(0)
    );

    // Get total farmers
    const totalFarmers = await prisma.petani.count();

    // Get active farmers
    const now = new Date();
    const activeFarmers = await prisma.petani.count({
      where: {
        AwalTerdaftar: { lte: now },
        AkhirTerdaftar: { gte: now },
        Status: 'Active',
      },
    });

    // Get total shipments
    const totalShipments = await prisma.kirimanPupuk.count();

    // Get shipments with mismatch
    const mismatchShipments = await prisma.kirimanPupuk.count({
      where: { Status: 'Tidak Sesuai' },
    });

    // Get recent complaints
    const recentComplaints = await prisma.bantuan.findMany({
      orderBy: { Timestamp: 'desc' },
      take: 10,
      select: {
        BantuanId: true,
        FirstName: true,
        LastName: true,
        Email: true,
        Topik: true,
        Ringkasan: true,
        Timestamp: true,
      },
    });

    // Get system activities
    const recentActivities = await prisma.logAktivitas.findMany({
      orderBy: { Timestamp: 'desc' },
      take: 20,
      include: {
        User: {
          select: {
            Email: true,
            Role: {
              select: {
                RoleName: true,
              },
            },
          },
        },
      },
    });

    // Get fertilizer distribution by type
    const distributionByType = await prisma.penebusanPupuk.groupBy({
      by: ['PupukId'],
      _sum: {
        Jumlah: true,
      },
    });

    const fertilizers = await prisma.pupuk.findMany();
    const fertilizerMap = new Map(fertilizers.map((f) => [f.PupukId, f.JenisPupuk]));

    const distributionStats = distributionByType.map((d) => ({
      jenisPupuk: fertilizerMap.get(d.PupukId),
      totalDistributed: d._sum.Jumlah?.toNumber() || 0,
    }));

    return {
      userStats,
      pendingApprovals,
      totalDistributed: totalDistributed.toNumber(),
      totalFarmers,
      activeFarmers,
      totalShipments,
      mismatchShipments,
      distributionByType: distributionStats,
      recentComplaints,
      recentActivities: recentActivities.map((a) => ({
        aksi: a.Aksi,
        deskripsi: a.Deskripsi,
        timestamp: a.Timestamp,
        user: a.User?.Email,
        role: a.User?.Role.RoleName,
      })),
    };
  }
}
