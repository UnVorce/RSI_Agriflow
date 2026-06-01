import { Router } from 'express';
import { authenticate } from '../common/middleware/auth.middleware';
import { requireRole } from '../common/middleware/role.middleware';

// Import controllers
import { StockController } from '../modules/stock/stock.controller';
import { ShipmentController } from '../modules/shipment/shipment.controller';
import { RedemptionController } from '../modules/redemption/redemption.controller';
import { BantuanController } from '../modules/bantuan/bantuan.controller';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import notificationRoutes from '../modules/notification/notification.routes';
import petaniRoutes from '../modules/petani/petani.routes';

const router = Router();
const stockController = new StockController();
const shipmentController = new ShipmentController();
const redemptionController = new RedemptionController();
const bantuanController = new BantuanController();

// All routes require authentication and PENGECER role
router.use(authenticate);
router.use(requireRole('PENGECER'));

// ============================================
// STOCK MANAGEMENT
// ============================================

/**
 * @swagger
 * /pengecer/stok:
 *   get:
 *     summary: Get retailer stock
 *     tags: [Pengecer]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stok', stockController.getStock);

/**
 * @swagger
 * /pengecer/stok:
 *   post:
 *     summary: Add stock (manual entry)
 *     tags: [Pengecer]
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
 * /pengecer/stok/riwayat:
 *   get:
 *     summary: Get stock history
 *     tags: [Pengecer]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stok/riwayat', stockController.getStockHistory);

// ============================================
// SHIPMENT RECEIVING
// ============================================

/**
 * @swagger
 * /pengecer/kiriman/terima:
 *   post:
 *     summary: Receive shipment from distributor
 *     tags: [Pengecer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kirimanId
 *               - jumlahDiterima
 *             properties:
 *               kirimanId:
 *                 type: string
 *               jumlahDiterima:
 *                 type: number
 */
router.post('/kiriman/terima', shipmentController.receiveShipment);

/**
 * @swagger
 * /pengecer/kiriman/riwayat:
 *   get:
 *     summary: Get shipment history
 *     tags: [Pengecer]
 *     security:
 *       - bearerAuth: []
 */
router.get('/kiriman/riwayat', shipmentController.getShipmentHistory);

// ============================================
// REDEMPTION (PENEBUSAN)
// ============================================

/**
 * @swagger
 * /pengecer/tebus/validasi:
 *   post:
 *     summary: Validate farmer by 16-digit ID
 *     tags: [Pengecer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - petaniId
 *             properties:
 *               petaniId:
 *                 type: string
 *                 description: 16-digit farmer ID
 */
router.post('/tebus/validasi', redemptionController.validateFarmer);

/**
 * @swagger
 * /pengecer/tebus:
 *   post:
 *     summary: Process fertilizer redemption
 *     tags: [Pengecer]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - petaniId
 *               - pupukId
 *               - jumlah
 *             properties:
 *               petaniId:
 *                 type: string
 *               pupukId:
 *                 type: integer
 *               jumlah:
 *                 type: number
 */
router.post('/tebus', redemptionController.redeemFertilizer);

/**
 * @swagger
 * /pengecer/tebus/riwayat:
 *   get:
 *     summary: Get redemption history
 *     tags: [Pengecer]
 *     security:
 *       - bearerAuth: []
 */
router.get('/tebus/riwayat', redemptionController.getRedemptionHistory);

// ============================================
// DASHBOARD & NOTIFICATIONS
// ============================================

/**
 * @swagger
 * /pengecer/dashboard:
 *   get:
 *     summary: Get retailer dashboard
 *     tags: [Pengecer]
 *     security:
 *       - bearerAuth: []
 */
router.use('/dashboard', dashboardRoutes);

/**
 * @swagger
 * /pengecer/notifikasi:
 *   get:
 *     summary: Get notifications
 *     tags: [Pengecer]
 *     security:
 *       - bearerAuth: []
 */
router.use('/notifikasi', notificationRoutes);

// ============================================
// PETANI MANAGEMENT
// ============================================

/**
 * @swagger
 * /pengecer/petani:
 *   get:
 *     summary: Get all farmers
 *     tags: [Pengecer]
 *     security:
 *       - bearerAuth: []
 */
router.use('/petani', petaniRoutes);

// ============================================
// BANTUAN (HELP/SUPPORT)
// ============================================

/**
 * @swagger
 * /pengecer/bantuan:
 *   post:
 *     summary: Submit help request
 *     tags: [Pengecer]
 *     security:
 *       - bearerAuth: []
 */
router.post('/bantuan', bantuanController.submitBantuan);

/**
 * @swagger
 * /pengecer/bantuan/my:
 *   get:
 *     summary: Get my help requests
 *     tags: [Pengecer]
 *     security:
 *       - bearerAuth: []
 */
router.get('/bantuan/my', bantuanController.getMyBantuan);

export default router;
