import { Router } from 'express';
import { authenticate } from '../common/middleware/auth.middleware';
import { requireRole } from '../common/middleware/role.middleware';

// Import controllers
import { StockController } from '../modules/stock/stock.controller';
import { ShipmentController } from '../modules/shipment/shipment.controller';
import { BantuanController } from '../modules/bantuan/bantuan.controller';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import notificationRoutes from '../modules/notification/notification.routes';

const router = Router();
const stockController = new StockController();
const shipmentController = new ShipmentController();
const bantuanController = new BantuanController();

// All routes require authentication and DISTRIBUTOR role
router.use(authenticate);
router.use(requireRole('DISTRIBUTOR'));

// ============================================
// STOCK MANAGEMENT
// ============================================

/**
 * @swagger
 * /distributor/stok:
 *   get:
 *     summary: Get distributor stock
 *     tags: [Distributor]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stok', stockController.getStock);

/**
 * @swagger
 * /distributor/stok:
 *   post:
 *     summary: Add stock
 *     tags: [Distributor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pupukId
 *               - jumlah
 *             properties:
 *               pupukId:
 *                 type: integer
 *               jumlah:
 *                 type: number
 */
router.post('/stok', stockController.addStock);

/**
 * @swagger
 * /distributor/stok/{userId}/{pupukId}:
 *   patch:
 *     summary: Adjust stock (correction)
 *     tags: [Distributor]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/stok/:userId/:pupukId', stockController.updateStock);

/**
 * @swagger
 * /distributor/stok/riwayat:
 *   get:
 *     summary: Get stock history
 *     tags: [Distributor]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stok/riwayat', stockController.getStockHistory);

// ============================================
// SHIPMENT MANAGEMENT
// ============================================

/**
 * @swagger
 * /distributor/kiriman:
 *   post:
 *     summary: Create shipment to retailer
 *     tags: [Distributor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIdPengecer
 *               - pupukId
 *               - jumlah
 *             properties:
 *               userIdPengecer:
 *                 type: string
 *               pupukId:
 *                 type: integer
 *               jumlah:
 *                 type: number
 */
router.post('/kiriman', shipmentController.createShipment);

/**
 * @swagger
 * /distributor/kiriman/riwayat:
 *   get:
 *     summary: Get shipment history
 *     tags: [Distributor]
 *     security:
 *       - bearerAuth: []
 */
router.get('/kiriman/riwayat', shipmentController.getShipmentHistory);

// ============================================
// DASHBOARD & NOTIFICATIONS
// ============================================

/**
 * @swagger
 * /distributor/dashboard:
 *   get:
 *     summary: Get distributor dashboard
 *     tags: [Distributor]
 *     security:
 *       - bearerAuth: []
 */
router.use('/dashboard', dashboardRoutes);

/**
 * @swagger
 * /distributor/notifikasi:
 *   get:
 *     summary: Get notifications
 *     tags: [Distributor]
 *     security:
 *       - bearerAuth: []
 */
router.use('/notifikasi', notificationRoutes);

// ============================================
// BANTUAN (HELP/SUPPORT)
// ============================================

/**
 * @swagger
 * /distributor/bantuan:
 *   post:
 *     summary: Submit help request
 *     tags: [Distributor]
 *     security:
 *       - bearerAuth: []
 */
router.post('/bantuan', bantuanController.submitBantuan);

/**
 * @swagger
 * /distributor/bantuan/my:
 *   get:
 *     summary: Get my help requests
 *     tags: [Distributor]
 *     security:
 *       - bearerAuth: []
 */
router.get('/bantuan/my', bantuanController.getMyBantuan);

export default router;
