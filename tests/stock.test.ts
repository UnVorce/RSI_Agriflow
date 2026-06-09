import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import prisma from '../src/config/database';
import { StockService } from '../src/modules/stock/stock.service';

describe('Stock Module Tests', () => {
  const stockService = new StockService();
  let testUserId: string;
  let testPupukId: string;

  beforeAll(async () => {
    // Create test user (Distributor)
    const role = await prisma.role.findUnique({
      where: { RoleName: 'DISTRIBUTOR' },
    });

    const testUser = await prisma.user.create({
      data: {
        UserId: Math.floor(Math.random() * 1000000) + 100000,
        FirstName: 'Test',
        LastName: 'Distributor',
        Email: `test-stock-${Date.now()}@example.com`,
        HashedPassword: 'hashed',
        Status: 'Active',
        RoleId: role!.RoleId,
      },
    });
    testUserId = testUser.UserId;

    // Get or create test fertilizer
    let pupuk = await prisma.pupuk.findFirst({
      where: { JenisPupuk: 'Urea' },
    });

    if (!pupuk) {
      pupuk = await prisma.pupuk.create({
        data: { JenisPupuk: 'Urea' },
      });
    }
    testPupukId = pupuk.PupukId;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.riwayatStok.deleteMany({
      where: { UserId: testUserId },
    });
    await prisma.stok.deleteMany({
      where: { UserId: testUserId },
    });
    await prisma.logAktivitas.deleteMany({
      where: { UserId: testUserId },
    });
    await prisma.user.delete({
      where: { UserId: testUserId },
    });
  });

  describe('BR-02: Stock Validation', () => {
    it('should add stock successfully', async () => {
      const result = await stockService.addStock(
        testUserId,
        testPupukId,
        100
      );

      expect(result).toBeDefined();
      expect(result.Jumlah.toNumber()).toBe(100);
    });

    it('should get stock for user', async () => {
      const stocks = await stockService.getStock(testUserId);

      expect(stocks).toBeDefined();
      expect(stocks.length).toBeGreaterThan(0);
      expect(stocks[0].Jumlah.toNumber()).toBe(100);
    });

    it('should update stock (adjustment)', async () => {
      const result = await stockService.updateStock(
        testUserId,
        testPupukId,
        150,
        testUserId
      );

      expect(result).toBeDefined();
      expect(result.Jumlah.toNumber()).toBe(150);
    });

    it('should track stock history', async () => {
      const history = await stockService.getStockHistory(testUserId);

      expect(history).toBeDefined();
      expect(history.length).toBeGreaterThanOrEqual(2); // Add + Update
      expect(history[0].TipePerubahan).toBeDefined();
    });

    it('should filter stock by fertilizer', async () => {
      const stocks = await stockService.getStock(testUserId, testPupukId);

      expect(stocks).toBeDefined();
      expect(stocks.every((s) => s.PupukId === testPupukId)).toBe(true);
    });

    it('should reject negative stock', async () => {
      await expect(
        stockService.addStock(
          testUserId,
          testPupukId,
          -50
        )
      ).rejects.toThrow();
    });
  });

  describe('Stock History Tracking', () => {
    it('should create history entry on stock change', async () => {
      const beforeCount = await prisma.riwayatStok.count({
        where: { UserId: testUserId },
      });

      await stockService.addStock(
        testUserId,
        testPupukId,
        50
      );

      const afterCount = await prisma.riwayatStok.count({
        where: { UserId: testUserId },
      });

      expect(afterCount).toBeGreaterThan(beforeCount);
    });

    it('should filter history by date range', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const history = await stockService.getStockHistory(testUserId, yesterday.toISOString(), today.toISOString());

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Activity Logging', () => {
    it('should log stock addition', async () => {
      await stockService.addStock(
        testUserId,
        testPupukId,
        25
      );

      const logs = await prisma.logAktivitas.findMany({
        where: {
          UserId: testUserId,
          Aksi: 'ADD_STOCK',
        },
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('should log stock update', async () => {
      await stockService.updateStock(
        testUserId,
        testPupukId,
        200,
        testUserId // requesterId
      );

      const logs = await prisma.logAktivitas.findMany({
        where: {
          UserId: testUserId,
          Aksi: 'UPDATE_STOCK',
        },
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });
});
