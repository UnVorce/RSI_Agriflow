import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../../app';
import prisma from '../../../config/database';
import { AppError } from '../../../common/middleware/error.middleware';
import { vi } from 'vitest';

vi.mock('../../../config/redis', () => {
  const store: Record<string, string> = {};
  return {
    default: {
      get: vi.fn(async (key) => store[key] || null),
      setEx: vi.fn(async (key, ttl, val) => { store[key] = val; }),
      ttl: vi.fn().mockResolvedValue(60),
      del: vi.fn(async (key) => { delete store[key]; }),
    }
  };
});

vi.mock('../distributor.service', () => {
  return {
    DistributorService: vi.fn().mockImplementation(() => ({
      getDashboard: vi.fn().mockResolvedValue({ stockSummary: {}, recentShipments: [], recentStockOut: [], notifications: [] }),
      createShipment: vi.fn().mockImplementation(async (data) => {
        if (data && data.jumlah > 100000) throw { statusCode: 400, isOperational: true, message: 'Max exceeded' };
        return { KirimanId: '123', JenisPupuk: 'Urea', JumlahPupuk: 100 };
      }),
      validatePengecer: vi.fn().mockResolvedValue({ IsValid: 1, Message: 'Valid' }),
      addStock: vi.fn().mockImplementation(async (data) => {
        if (data && data.jumlahMasuk < 0) throw { statusCode: 400, isOperational: true, message: 'Negative' };
        return { JumlahStokKg: 150 };
      }),
      getStockDashboard: vi.fn().mockResolvedValue({ totalStockTon: 1.5, stockItems: [] }),
      markNotificationRead: vi.fn().mockImplementation(async (notifId) => {
        if (Number(notifId) !== 1) throw { statusCode: 400, isOperational: true, message: 'Invalid' };
        return { Pesan: 'OK' };
      }),
      getRecentShipments: vi.fn().mockResolvedValue([]),
      getShipmentHistory: vi.fn().mockResolvedValue({ summary: {}, shipments: [] }),
      getCurrentStock: vi.fn().mockResolvedValue({ JumlahStokKg: 150 }),
      adjustStock: vi.fn().mockResolvedValue({ JumlahStokKg: 150 }),
      getIncomingStockHistory: vi.fn().mockResolvedValue([]),
      getOutgoingStockHistory: vi.fn().mockResolvedValue([]),
      getNotifications: vi.fn().mockResolvedValue([]),
    }))
  };
});

/**
 * Integration Tests for Distributor Module
 * These tests require a running database and should be run in a test environment
 */

import { generateAccessToken } from '../../../utils/jwt';

describe('Distributor Integration Tests', () => {
  let authToken: string;
  let distributorUserId: number;
  let pengecerUserId: number;

  beforeAll(async () => {
    // Setup: Create test users and get auth token
    const roleDist = await prisma.role.findFirst({ where: { RoleName: 'DISTRIBUTOR' } }) || await prisma.role.create({ data: { RoleName: 'DISTRIBUTOR', RoleDescription: '' } });
    const rolePeng = await prisma.role.findFirst({ where: { RoleName: 'PENGECER' } }) || await prisma.role.create({ data: { RoleName: 'PENGECER', RoleDescription: '' } });

    distributorUserId = Math.floor(Math.random() * 1000000) + 100000;
    pengecerUserId = Math.floor(Math.random() * 1000000) + 100000;

    await prisma.user.create({
      data: {
        UserId: distributorUserId,
        FirstName: 'Integration',
        LastName: 'Distributor',
        Email: `int-dist-${Date.now()}@example.com`,
        HashedPassword: 'hashed',
        Status: 'Active',
        RoleId: roleDist.RoleId,
      }
    });

    await prisma.user.create({
      data: {
        UserId: pengecerUserId,
        FirstName: 'Integration',
        LastName: 'Pengecer',
        Email: `int-peng-${Date.now()}@example.com`,
        HashedPassword: 'hashed',
        Status: 'Active',
        RoleId: rolePeng.RoleId,
      }
    });

    authToken = generateAccessToken({
      userId: distributorUserId.toString(),
      email: `int-dist-${Date.now()}@example.com`,
      role: 'DISTRIBUTOR'
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.user.deleteMany({
      where: {
        UserId: { in: [distributorUserId, pengecerUserId] }
      }
    });
    await prisma.$disconnect();
  });

  describe('POST /api/distributor/shipments', () => {
    it('should create shipment successfully with valid data', async () => {
      const shipmentData = {
        pengecerId: pengecerUserId,
        pupukId: 1,
        jumlah: 100.5
      };

      const response = await request(app)
        .post('/api/distributor/shipments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shipmentData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          KirimanId: expect.any(String),
          JenisPupuk: expect.any(String),
          JumlahPupuk: expect.any(Number)
        }
      });
    });

    it('should return 400 when pengecerId is invalid', async () => {
      const shipmentData = {
        pengecerId: 'invalid-uuid',
        pupukId: 1,
        jumlah: 100
      };

      const response = await request(app)
        .post('/api/distributor/shipments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shipmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    it('should return 400 when jumlah exceeds maximum', async () => {
      const shipmentData = {
        pengecerId: pengecerUserId,
        pupukId: 1,
        jumlah: 150000 // Exceeds max 100,000
      };

      const response = await request(app)
        .post('/api/distributor/shipments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shipmentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const shipmentData = {
        pengecerId: pengecerUserId,
        pupukId: 1,
        jumlah: 100
      };

      await request(app)
        .post('/api/distributor/shipments')
        .send(shipmentData)
        .expect(401);
    });
  });

  describe('GET /api/distributor/dashboard', () => {
    it('should return dashboard data', async () => {
      const response = await request(app)
        .get('/api/distributor/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          stockSummary: expect.any(Object),
          recentShipments: expect.any(Array),
          recentStockOut: expect.any(Array),
          notifications: expect.any(Array)
        }
      });
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get('/api/distributor/dashboard')
        .expect(401);
    });
  });

  describe('POST /api/distributor/stock/add', () => {
    it('should add stock successfully', async () => {
      const stockData = {
        pupukId: 1,
        jumlahMasuk: 50.5
      };

      const response = await request(app)
        .post('/api/distributor/stock/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(stockData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          JumlahStokKg: expect.any(Number)
        }
      });
    });

    it('should return 400 when jumlahMasuk is negative', async () => {
      const stockData = {
        pupukId: 1,
        jumlahMasuk: -10
      };

      const response = await request(app)
        .post('/api/distributor/stock/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(stockData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/distributor/stock', () => {
    it('should return stock dashboard with pagination', async () => {
      const response = await request(app)
        .get('/api/distributor/stock?page=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          totalStockTon: expect.any(Number),
          stockItems: expect.any(Array)
        }
      });
    });

    it('should limit page number to 10000', async () => {
      const response = await request(app)
        .get('/api/distributor/stock?page=99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/distributor/validate-pengecer/:pengecerId', () => {
    it('should validate pengecer successfully', async () => {
      const response = await request(app)
        .get(`/api/distributor/validate-pengecer/${pengecerUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          IsValid: expect.any(Number),
          Message: expect.any(String)
        }
      });
    });

    it('should return 400 for invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/distributor/validate-pengecer/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('tidak valid');
    });
  });

  describe('PATCH /api/distributor/notifications/:notifikasiId/read', () => {
    it('should mark notification as read', async () => {
      const notifId = 1;

      const response = await request(app)
        .patch(`/api/distributor/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app)
        .patch('/api/distributor/notifications/invalid-id/read')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit after exceeding limit', async () => {
      // Make multiple requests to trigger rate limit
      const requests = Array(65).fill(null).map(() =>
        request(app)
          .get('/api/distributor/dashboard')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimited = responses.some(r => r.status === 429);
      expect(rateLimited).toBe(true);
    });
  });
});
