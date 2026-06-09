import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/config/database';
import { DashboardService } from '../src/modules/dashboard/dashboard.service';

describe('Dashboard Module Tests', () => {
  const dashboardService = new DashboardService();
  let distributorId: number;
  let retailerId: number;
  let pupukId: number;

  beforeAll(async () => {
    const distributorRole = await prisma.role.findFirst({ where: { RoleName: 'DISTRIBUTOR' }});
    const retailerRole = await prisma.role.findFirst({ where: { RoleName: 'PENGECER' }});
    
    // Create test distributor
    const distributor = await prisma.user.create({
      data: {
        UserId: Math.floor(Math.random() * 1000000) + 100000,
        FirstName: 'Test',
        LastName: 'Distributor',
        Email: `dist-${Date.now()}@example.com`,
        Status: 'Active',
        RoleId: distributorRole!.RoleId,
        HashedPassword: 'password',
      },
    });
    distributorId = distributor.UserId;

    // Create test retailer
    const retailer = await prisma.user.create({
      data: {
        UserId: Math.floor(Math.random() * 1000000) + 100000,
        FirstName: 'Test',
        LastName: 'Retailer',
        Email: `ret-${Date.now()}@example.com`,
        Status: 'Active',
        RoleId: retailerRole!.RoleId,
        HashedPassword: 'password',
      },
    });
    retailerId = retailer.UserId;

    const pupuk = await prisma.pupuk.findFirst();
    pupukId = pupuk!.PupukId;

    // Create stok for distributor
    await prisma.stok.create({
      data: {
        UserId: distributorId,
        PupukId: pupukId,
        Jumlah: 1000,
      }
    });

    // Create stok for retailer
    await prisma.stok.create({
      data: {
        UserId: retailerId,
        PupukId: pupukId,
        Jumlah: 500,
      }
    });

    // Create kiriman from distributor to retailer
    const nextKirimanId = Math.floor(Math.random() * 1000000) + 100000;
    
    await prisma.kirimanPupuk.create({
      data: {
        KirimanId: nextKirimanId,
        UserIdDistributor: distributorId,
        UserIdPengecer: retailerId,
        PupukId: pupukId,
        JumlahDikirim: 100,
        Status: 'Dikirim'
      }
    });

    // Get KodePos for Petani
    const kodePos = await prisma.kodePos.findFirst();

    // Create petani for retailer
    await prisma.petani.create({
      data: {
        PetaniId: `1234${Date.now().toString().slice(-12)}`,
        FirstName: 'Test',
        LastName: 'Petani',
        KodePosId: kodePos!.KodePosId,
        UserIdPengecer: retailerId,
        AwalTerdaftar: new Date(),
        AkhirTerdaftar: new Date(Date.now() + 86400000 * 30),
        Status: 'Active',
      }
    });
  });

  afterAll(async () => {
    // Cleanup
    const testPetani = await prisma.petani.findMany({ where: { UserIdPengecer: retailerId } });
    const testPetaniIds = testPetani.map(p => p.PetaniId);
    await prisma.kuotaPetani.deleteMany({ where: { PetaniId: { in: testPetaniIds } }});
    
    await prisma.kirimanPupuk.deleteMany({ where: { UserIdDistributor: distributorId }});
    await prisma.petani.deleteMany({ where: { UserIdPengecer: retailerId }});
    await prisma.stok.deleteMany({ where: { UserId: distributorId }});
    await prisma.stok.deleteMany({ where: { UserId: retailerId }});
    await prisma.user.delete({ where: { UserId: distributorId }});
    await prisma.user.delete({ where: { UserId: retailerId }});
  });

  it('should get distributor dashboard service', async () => {
    const dashboard = await dashboardService.getDistributorDashboard(distributorId);
    expect(dashboard).toBeDefined();
    expect(dashboard.totalStock).toBeGreaterThanOrEqual(1000);
    expect(dashboard.pendingShipments).toBeGreaterThanOrEqual(1);
    expect(dashboard.totalOutbound).toBeGreaterThanOrEqual(100);
    expect(dashboard.stockByType.length).toBeGreaterThan(0);
  });

  it('should get retailer dashboard service', async () => {
    const dashboard = await dashboardService.getRetailerDashboard(retailerId);
    expect(dashboard).toBeDefined();
    expect(dashboard.totalStock).toBeGreaterThanOrEqual(500);
    expect(dashboard.farmerCount).toBeGreaterThanOrEqual(1);
    expect(dashboard.activeFarmers).toBeGreaterThanOrEqual(1);
    expect(dashboard.stockByType.length).toBeGreaterThan(0);
  });

  it('should get government dashboard service', async () => {
    const dashboard = await dashboardService.getGovernmentDashboard();
    expect(dashboard).toBeDefined();
    expect(dashboard.totalFarmers).toBeGreaterThanOrEqual(1);
    expect(dashboard.userStats.length).toBeGreaterThan(0);
    expect(dashboard.distributionByType).toBeDefined();
  });
});
