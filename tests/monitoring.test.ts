import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/config/database';
import { MonitoringService } from '../src/modules/monitoring/monitoring.service';

describe('Monitoring Module Tests', () => {
  const monitoringService = new MonitoringService();
  let distributorId: number;
  let retailerId: number;
  let pupukId: number;
  let petaniId: string;
  let testProvince: string;

  beforeAll(async () => {
    const distributorRole = await prisma.role.findFirst({ where: { RoleName: 'DISTRIBUTOR' }});
    const retailerRole = await prisma.role.findFirst({ where: { RoleName: 'PENGECER' }});
    
    // Create test users
    const distributor = await prisma.user.create({
      data: {
        UserId: Math.floor(Math.random() * 1000000) + 100000,
        FirstName: 'Test',
        LastName: 'Distributor Mon',
        Email: `dist-mon-${Date.now()}@example.com`,
        Status: 'Active',
        RoleId: distributorRole!.RoleId,
        HashedPassword: 'password',
      },
    });
    distributorId = distributor.UserId;

    const retailer = await prisma.user.create({
      data: {
        UserId: Math.floor(Math.random() * 1000000) + 100000,
        FirstName: 'Test',
        LastName: 'Retailer Mon',
        Email: `ret-mon-${Date.now()}@example.com`,
        Status: 'Active',
        RoleId: retailerRole!.RoleId,
        HashedPassword: 'password',
      },
    });
    retailerId = retailer.UserId;

    const pupuk = await prisma.pupuk.findFirst();
    pupukId = pupuk!.PupukId;

    // Get KodePos and create Petani
    const kodePos = await prisma.kodePos.findFirst();
    testProvince = kodePos!.Provinsi;
    petaniId = `9999${Date.now().toString().slice(-12)}`;

    await prisma.petani.create({
      data: {
        PetaniId: petaniId,
        FirstName: 'Test',
        LastName: 'Petani Mon',
        KodePosId: kodePos!.KodePosId,
        UserIdPengecer: retailerId,
        AwalTerdaftar: new Date(),
        AkhirTerdaftar: new Date(Date.now() + 86400000 * 30),
        Status: 'Active',
      }
    });

    // Create redemption for filtering tests
    const nextTebusanId = Math.floor(Math.random() * 1000000) + 100000;

    await prisma.penebusanPupuk.create({
      data: {
        TebusanId: nextTebusanId,
        UserIdPengecer: retailerId,
        PetaniId: petaniId,
        PupukId: pupukId,
        Jumlah: 1500, // Large redemption for anomaly
        Status: 'Selesai',
        TimestampPenebusan: new Date()
      }
    });

    // Create mismatched shipment for anomaly
    const nextKirimanId = Math.floor(Math.random() * 1000000) + 100000;

    await prisma.kirimanPupuk.create({
      data: {
        KirimanId: nextKirimanId,
        UserIdDistributor: distributorId,
        UserIdPengecer: retailerId,
        PupukId: pupukId,
        JumlahDikirim: 1000,
        JumlahDiterima: 500, // Mismatch
        Status: 'Tidak Sesuai',
        TimestampDiterima: new Date()
      }
    });

    // Create low stock for anomaly
    await prisma.stok.create({
      data: {
        UserId: retailerId,
        PupukId: pupukId,
        Jumlah: 5, // Low stock
      }
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.stok.deleteMany({ where: { UserId: retailerId }});
    await prisma.kirimanPupuk.deleteMany({ where: { UserIdDistributor: distributorId }});
    await prisma.penebusanPupuk.deleteMany({ where: { PetaniId: petaniId }});
    await prisma.kuotaPetani.deleteMany({ where: { PetaniId: petaniId }});
    await prisma.petani.deleteMany({ where: { PetaniId: petaniId }});
    await prisma.user.delete({ where: { UserId: distributorId }});
    await prisma.user.delete({ where: { UserId: retailerId }});
  });

  it('should get monitoring data', async () => {
    const data = await monitoringService.getMonitoringData({});
    expect(data).toBeDefined();
    expect(data.summary.totalAbsorbed).toBeGreaterThan(0);
    expect(data.summary.redemptionCount).toBeGreaterThan(0);
  });

  it('should filter monitoring data by province', async () => {
    const data = await monitoringService.getMonitoringData({ province: testProvince });
    expect(data).toBeDefined();
    expect(data.byProvince.length).toBeGreaterThan(0);
    expect(data.byProvince[0].province).toBe(testProvince);
  });

  it('should filter monitoring data by date range', async () => {
    const dateStart = new Date();
    dateStart.setDate(dateStart.getDate() - 1);
    const dateEnd = new Date();
    dateEnd.setDate(dateEnd.getDate() + 1);

    const data = await monitoringService.getMonitoringData({
      dateStart: dateStart.toISOString(),
      dateEnd: dateEnd.toISOString()
    });
    
    expect(data).toBeDefined();
    expect(data.summary.redemptionCount).toBeGreaterThan(0);
  });

  it('should detect shipment mismatch anomalies', async () => {
    const anomalies = await monitoringService.detectAnomalies();
    expect(anomalies).toBeDefined();
    
    const mismatchAnomaly = anomalies.anomalies.find(a => a.type === 'SHIPMENT_MISMATCH');
    expect(mismatchAnomaly).toBeDefined();
  });

  it('should detect large redemption anomalies', async () => {
    const anomalies = await monitoringService.detectAnomalies();
    const largeRedemption = anomalies.anomalies.find(a => a.type === 'LARGE_REDEMPTION');
    expect(largeRedemption).toBeDefined();
    expect(largeRedemption!.details.jumlah).toBeGreaterThanOrEqual(1500);
  });

  it('should detect low stock anomalies', async () => {
    const anomalies = await monitoringService.detectAnomalies();
    const lowStock = anomalies.anomalies.find(a => a.type === 'LOW_STOCK');
    expect(lowStock).toBeDefined();
    expect(lowStock!.details.jumlah).toBeLessThanOrEqual(50);
  });
});
