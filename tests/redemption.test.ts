import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '../src/config/database';
import { RedemptionService } from '../src/modules/redemption/redemption.service';
import { Decimal } from '@prisma/client/runtime/library';

describe('Redemption Module Tests', () => {
  const redemptionService = new RedemptionService();
  let testRetailerId: string;
  let testPetaniId: string;
  let testPupukId: string;
  let testKodePosId: number;

  beforeAll(async () => {
    // Get retailer role
    const retailerRole = await prisma.role.findUnique({
      where: { RoleName: 'PENGECER' },
    });

    // Create test retailer
    const retailer = await prisma.user.create({
      data: {
        UserId: Math.floor(Math.random() * 1000000) + 100000,
        FirstName: 'Test',
        LastName: 'Retailer',
        Email: `test-redemption-${Date.now()}@example.com`,
        HashedPassword: 'hashed',
        Status: 'Active',
        RoleId: retailerRole!.RoleId,
      },
    });
    testRetailerId = retailer.UserId;

    // Get or create KodePos
    let kodePos = await prisma.kodePos.findFirst();
    if (!kodePos) {
      kodePos = await prisma.kodePos.create({
        data: {
          KelurahanDesa: 'Test Desa',
          Kecamatan: 'Test Kecamatan',
          KabupatenKota: 'Test Kota',
          Provinsi: 'Test Provinsi',
        },
      });
    }
    testKodePosId = kodePos.KodePosId;

    // Create test farmer (16 digits)
    const petaniId = `2222${Date.now().toString().slice(-12)}`;
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    await prisma.petani.create({
      data: {
        PetaniId: petaniId,
        FirstName: 'Test',
        LastName: 'Farmer',
        NomorHp: '081234567890',
        Jalan: 'Test Street',
        Rt: '001',
        Rw: '002',
        KodePosId: testKodePosId,
        Sektor: 'Pertanian',
        LuasLahan: new Decimal(1.5),
        UserIdPengecer: testRetailerId,
        AwalTerdaftar: today,
        AkhirTerdaftar: futureDate,
        Status: 'Active',
      },
    });
    testPetaniId = petaniId;

    // Get or create fertilizer
    let pupuk = await prisma.pupuk.findFirst({
      where: { JenisPupuk: 'Urea' },
    });
    if (!pupuk) {
      pupuk = await prisma.pupuk.create({
        data: { JenisPupuk: 'Urea' },
      });
    }
    testPupukId = pupuk.PupukId;

    // Add stock to retailer
    await prisma.stok.create({
      data: {
        UserId: testRetailerId,
        PupukId: testPupukId,
        Jumlah: new Decimal(500),
      },
    });

    // Add quota to farmer
    await prisma.kuotaPetani.create({
      data: {
        PetaniId: testPetaniId,
        PupukId: testPupukId,
        SisaKuota: new Decimal(100),
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.penebusanPupuk.deleteMany({
      where: { UserIdPengecer: testRetailerId },
    });
    await prisma.kuotaPetani.deleteMany({
      where: { PetaniId: testPetaniId },
    });
    await prisma.riwayatStok.deleteMany({
      where: { UserId: testRetailerId },
    });
    await prisma.stok.deleteMany({
      where: { UserId: testRetailerId },
    });
    await prisma.logAktivitas.deleteMany({
      where: { UserId: testRetailerId },
    });
    await prisma.petani.delete({
      where: { PetaniId: testPetaniId },
    });
    await prisma.user.delete({
      where: { UserId: testRetailerId },
    });
  });

  describe('BR-01: Farmer Validation', () => {
    it('should validate farmer with 16-digit ID', async () => {
      const result = await redemptionService.validateFarmer(
        testPetaniId,
        testRetailerId
      );

      expect(result).toBeDefined();
      expect(result.petani.petaniId).toBe(testPetaniId);
      expect(result.petani.petaniId.length).toBe(16);
    });

    it('should reject farmer ID with wrong length', async () => {
      await expect(
        redemptionService.validateFarmer('12345', testRetailerId)
      ).rejects.toThrow('ID Petani harus 16 digit');
    });

    it('should reject non-existent farmer', async () => {
      await expect(
        redemptionService.validateFarmer('9999999999999999', testRetailerId)
      ).rejects.toThrow('Petani tidak ditemukan');
    });

    it('should reject farmer not belonging to retailer', async () => {
      await expect(
        redemptionService.validateFarmer(testPetaniId, 'wrong-retailer-id')
      ).rejects.toThrow('Petani bukan milik pengecer ini');
    });

    it('should check registration period', async () => {
      const result = await redemptionService.validateFarmer(
        testPetaniId,
        testRetailerId
      );

      expect(result.petani.status).toBeDefined();
    });
  });

  describe('BR-02: Stock Validation on Redemption', () => {
    it('should redeem when stock is sufficient', async () => {
      const result = await redemptionService.redeemFertilizer(
        testRetailerId,
        testPetaniId,
        testPupukId,
        10
      );

      expect(result).toBeDefined();
      expect(result.Jumlah.toNumber()).toBe(10);
      expect(result.Status).toBe('Selesai');
    });

    it('should reject when stock is insufficient', async () => {
      await expect(
        redemptionService.redeemFertilizer(
          testRetailerId,
          testPetaniId,
          testPupukId,
          10000 // More than available
        )
      ).rejects.toThrow('Stok pengecer tidak mencukupi');
    });

    it('should reduce retailer stock after redemption', async () => {
      const beforeStock = await prisma.stok.findUnique({
        where: {
          UserId_PupukId: {
            UserId: testRetailerId,
            PupukId: testPupukId,
          },
        },
      });

      await redemptionService.redeemFertilizer(
        testRetailerId,
        testPetaniId,
        testPupukId,
        5
      );

      const afterStock = await prisma.stok.findUnique({
        where: {
          UserId_PupukId: {
            UserId: testRetailerId,
            PupukId: testPupukId,
          },
        },
      });

      expect(afterStock!.Jumlah.toNumber()).toBe(
        beforeStock!.Jumlah.toNumber() - 5
      );
    });
  });

  describe('BR-03: Quota Validation', () => {
    it('should reject when quota is insufficient', async () => {
      await expect(
        redemptionService.redeemFertilizer(
          testRetailerId,
          testPetaniId,
          testPupukId,
          150 // More than quota (100)
        )
      ).rejects.toThrow('Kuota petani tidak mencukupi');
    });

    it('should reduce quota after redemption', async () => {
      const beforeQuota = await prisma.kuotaPetani.findUnique({
        where: {
          PetaniId_PupukId: {
            PetaniId: testPetaniId,
            PupukId: testPupukId,
          },
        },
      });

      await redemptionService.redeemFertilizer(
        testRetailerId,
        testPetaniId,
        testPupukId,
        5
      );

      const afterQuota = await prisma.kuotaPetani.findUnique({
        where: {
          PetaniId_PupukId: {
            PetaniId: testPetaniId,
            PupukId: testPupukId,
          },
        },
      });

      expect(afterQuota!.SisaKuota.toNumber()).toBe(
        beforeQuota!.SisaKuota.toNumber() - 5
      );
    });

    it('should not allow negative quota', async () => {
      const quota = await prisma.kuotaPetani.findUnique({
        where: {
          PetaniId_PupukId: {
            PetaniId: testPetaniId,
            PupukId: testPupukId,
          },
        },
      });

      await expect(
        redemptionService.redeemFertilizer(
          testRetailerId,
          testPetaniId,
          testPupukId,
          quota!.SisaKuota.toNumber() + 10
        )
      ).rejects.toThrow('Kuota petani tidak mencukupi');
    });
  });

  describe('BR-05: Atomic Transactions', () => {
    it('should rollback on failure', async () => {
      const beforeStock = await prisma.stok.findUnique({
        where: {
          UserId_PupukId: {
            UserId: testRetailerId,
            PupukId: testPupukId,
          },
        },
      });

      const beforeQuota = await prisma.kuotaPetani.findUnique({
        where: {
          PetaniId_PupukId: {
            PetaniId: testPetaniId,
            PupukId: testPupukId,
          },
        },
      });

      try {
        // Try with invalid fertilizer ID
        await redemptionService.redeemFertilizer(
          testRetailerId,
          testPetaniId,
          'invalid-pupuk-id',
          5
        );
      } catch (error) {
        // Expected to fail
      }

      const afterStock = await prisma.stok.findUnique({
        where: {
          UserId_PupukId: {
            UserId: testRetailerId,
            PupukId: testPupukId,
          },
        },
      });

      const afterQuota = await prisma.kuotaPetani.findUnique({
        where: {
          PetaniId_PupukId: {
            PetaniId: testPetaniId,
            PupukId: testPupukId,
          },
        },
      });

      // Both should remain unchanged
      expect(afterStock!.Jumlah.toNumber()).toBe(
        beforeStock!.Jumlah.toNumber()
      );
      expect(afterQuota!.SisaKuota.toNumber()).toBe(
        beforeQuota!.SisaKuota.toNumber()
      );
    });
  });

  describe('Redemption History', () => {
    it('should retrieve redemption history', async () => {
      const history = await redemptionService.getRedemptionHistory(
        testRetailerId,
        {}
      );

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should filter history by date', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const history = await redemptionService.getRedemptionHistory(
        testRetailerId,
        {
          dateStart: yesterday.toISOString(),
          dateEnd: today.toISOString(),
        }
      );

      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Activity Logging', () => {
    it('should log redemption activity', async () => {
      await redemptionService.redeemFertilizer(
        testRetailerId,
        testPetaniId,
        testPupukId,
        5 // using 5 to not exceed remaining quota
      );

      const logs = await prisma.logAktivitas.findMany({
        where: {
          UserId: testRetailerId,
          Aksi: 'REDEMPTION',
        },
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });
});
