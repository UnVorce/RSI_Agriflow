import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/config/database';
import { ShipmentService } from '../src/modules/shipment/shipment.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('Shipment Module Tests', () => {
  const shipmentService = new ShipmentService();
  let testDistributorId: string;
  let testRetailerId: string;
  let testPupukId: string;

  beforeAll(async () => {
    // Get roles
    const distributorRole = await prisma.role.findUnique({
      where: { RoleName: 'DISTRIBUTOR' },
    });
    const retailerRole = await prisma.role.findUnique({
      where: { RoleName: 'PENGECER' },
    });

    // Create test distributor
    const distributor = await prisma.user.create({
      data: {
        FirstName: 'Test',
        LastName: 'Distributor',
        Email: `test-dist-${Date.now()}@example.com`,
        HashedPassword: 'hashed',
        Status: 'Active',
        RoleId: distributorRole!.RoleId,
      },
    });
    testDistributorId = distributor.UserId;

    // Create test retailer
    const retailer = await prisma.user.create({
      data: {
        FirstName: 'Test',
        LastName: 'Retailer',
        Email: `test-retail-${Date.now()}@example.com`,
        HashedPassword: 'hashed',
        Status: 'Active',
        RoleId: retailerRole!.RoleId,
      },
    });
    testRetailerId = retailer.UserId;

    // Get or create test fertilizer
    let pupuk = await prisma.pupuk.findFirst({
      where: { JenisPupuk: 'NPK' },
    });

    if (!pupuk) {
      pupuk = await prisma.pupuk.create({
        data: { JenisPupuk: 'NPK' },
      });
    }
    testPupukId = pupuk.PupukId;

    // Add initial stock to distributor
    await prisma.stok.create({
      data: {
        UserId: testDistributorId,
        PupukId: testPupukId,
        Jumlah: new Decimal(1000),
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.notifikasi.deleteMany({
      where: {
        OR: [
          { UserId: testDistributorId },
          { UserId: testRetailerId },
        ],
      },
    });
    await prisma.riwayatStok.deleteMany({
      where: {
        OR: [
          { UserId: testDistributorId },
          { UserId: testRetailerId },
        ],
      },
    });
    await prisma.kirimanPupuk.deleteMany({
      where: { UserIdDistributor: testDistributorId },
    });
    await prisma.stok.deleteMany({
      where: {
        OR: [
          { UserId: testDistributorId },
          { UserId: testRetailerId },
        ],
      },
    });
    await prisma.logAktivitas.deleteMany({
      where: {
        OR: [
          { UserId: testDistributorId },
          { UserId: testRetailerId },
        ],
      },
    });
    await prisma.user.deleteMany({
      where: {
        UserId: {
          in: [testDistributorId, testRetailerId],
        },
      },
    });
  });

  describe('BR-02: Stock Validation on Shipment', () => {
    it('should create shipment when stock is sufficient', async () => {
      const result = await shipmentService.createShipment({
        userIdDistributor: testDistributorId,
        userIdPengecer: testRetailerId,
        pupukId: testPupukId,
        jumlahDikirim: 100,
      });

      expect(result).toBeDefined();
      expect(result.JumlahDikirim.toNumber()).toBe(100);
      expect(result.Status).toBe('Dikirim');
    });

    it('should reject shipment when stock is insufficient', async () => {
      await expect(
        shipmentService.createShipment({
          userIdDistributor: testDistributorId,
          userIdPengecer: testRetailerId,
          pupukId: testPupukId,
          jumlahDikirim: 10000, // More than available
        })
      ).rejects.toThrow('Stok tidak mencukupi');
    });

    it('should reduce distributor stock after shipment', async () => {
      const beforeStock = await prisma.stok.findUnique({
        where: {
          UserId_PupukId: {
            UserId: testDistributorId,
            PupukId: testPupukId,
          },
        },
      });

      await shipmentService.createShipment({
        userIdDistributor: testDistributorId,
        userIdPengecer: testRetailerId,
        pupukId: testPupukId,
        jumlahDikirim: 50,
      });

      const afterStock = await prisma.stok.findUnique({
        where: {
          UserId_PupukId: {
            UserId: testDistributorId,
            PupukId: testPupukId,
          },
        },
      });

      expect(afterStock!.Jumlah.toNumber()).toBe(
        beforeStock!.Jumlah.toNumber() - 50
      );
    });
  });

  describe('BR-04: Shipment Receiving', () => {
    let testShipmentId: string;

    beforeAll(async () => {
      const shipment = await shipmentService.createShipment({
        userIdDistributor: testDistributorId,
        userIdPengecer: testRetailerId,
        pupukId: testPupukId,
        jumlahDikirim: 100,
      });
      testShipmentId = shipment.KirimanId;
    });

    it('should receive shipment with matching quantity', async () => {
      const result = await shipmentService.receiveShipment({
        kirimanId: testShipmentId,
        userIdPengecer: testRetailerId,
        jumlahDiterima: 100,
      });

      expect(result).toBeDefined();
      expect(result.Status).toBe('Diterima');
      expect(result.JumlahDiterima?.toNumber()).toBe(100);
    });

    it('should detect mismatch and create notification', async () => {
      const shipment = await shipmentService.createShipment({
        userIdDistributor: testDistributorId,
        userIdPengecer: testRetailerId,
        pupukId: testPupukId,
        jumlahDikirim: 100,
      });

      const result = await shipmentService.receiveShipment({
        kirimanId: shipment.KirimanId,
        userIdPengecer: testRetailerId,
        jumlahDiterima: 80, // Mismatch
      });

      expect(result.Status).toBe('Tidak Sesuai');

      // Check notification was created
      const notification = await prisma.notifikasi.findFirst({
        where: {
          UserId: testDistributorId,
          Jenis: 'SHIPMENT_MISMATCH',
        },
        orderBy: { Timestamp: 'desc' },
      });

      expect(notification).toBeDefined();
    });

    it('should increase retailer stock after receiving', async () => {
      const shipment = await shipmentService.createShipment({
        userIdDistributor: testDistributorId,
        userIdPengecer: testRetailerId,
        pupukId: testPupukId,
        jumlahDikirim: 50,
      });

      const beforeStock = await prisma.stok.findUnique({
        where: {
          UserId_PupukId: {
            UserId: testRetailerId,
            PupukId: testPupukId,
          },
        },
      });

      await shipmentService.receiveShipment({
        kirimanId: shipment.KirimanId,
        userIdPengecer: testRetailerId,
        jumlahDiterima: 50,
      });

      const afterStock = await prisma.stok.findUnique({
        where: {
          UserId_PupukId: {
            UserId: testRetailerId,
            PupukId: testPupukId,
          },
        },
      });

      const beforeAmount = beforeStock?.Jumlah.toNumber() || 0;
      expect(afterStock!.Jumlah.toNumber()).toBe(beforeAmount + 50);
    });

    it('should reject receiving by wrong retailer', async () => {
      const shipment = await shipmentService.createShipment({
        userIdDistributor: testDistributorId,
        userIdPengecer: testRetailerId,
        pupukId: testPupukId,
        jumlahDikirim: 50,
      });

      await expect(
        shipmentService.receiveShipment({
          kirimanId: shipment.KirimanId,
          userIdPengecer: 'wrong-user-id',
          jumlahDiterima: 50,
        })
      ).rejects.toThrow();
    });
  });

  describe('BR-05: Atomic Transactions', () => {
    it('should rollback on failure during shipment creation', async () => {
      const beforeStock = await prisma.stok.findUnique({
        where: {
          UserId_PupukId: {
            UserId: testDistributorId,
            PupukId: testPupukId,
          },
        },
      });

      try {
        // Try to create shipment with invalid retailer
        await shipmentService.createShipment({
          userIdDistributor: testDistributorId,
          userIdPengecer: 'invalid-id',
          pupukId: testPupukId,
          jumlahDikirim: 50,
        });
      } catch (error) {
        // Expected to fail
      }

      const afterStock = await prisma.stok.findUnique({
        where: {
          UserId_PupukId: {
            UserId: testDistributorId,
            PupukId: testPupukId,
          },
        },
      });

      // Stock should remain unchanged
      expect(afterStock!.Jumlah.toNumber()).toBe(
        beforeStock!.Jumlah.toNumber()
      );
    });
  });

  describe('Shipment History', () => {
    it('should retrieve shipment history', async () => {
      const history = await shipmentService.getShipmentHistory(
        testDistributorId,
        {}
      );

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should filter history by status', async () => {
      const history = await shipmentService.getShipmentHistory(
        testDistributorId,
        { status: 'Diterima' }
      );

      expect(history.every((h) => h.Status === 'Diterima')).toBe(true);
    });
  });
});
