import { Router } from 'express';
import { DistributorController } from './distributor.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireRole } from '../../common/middleware/role.middleware';

const router = Router();
const controller = new DistributorController();

// All routes require authentication and Distributor role
router.use(authenticate);
router.use(requireRole('DISTRIBUTOR'));

/**
 * @swagger
 * /distributor/dashboard:
 *   get:
 *     summary: Get distributor dashboard data
 *     tags: [Distributor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 */
router.get('/dashboard', controller.getDashboard.bind(controller));

/**
 * @swagger
 * /distributor/shipments:
 *   post:
 *     summary: Create new shipment to pengecer
 *     tags: [Distributor - Shipments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pengecerId
 *               - pupukId
 *               - jumlah
 *             properties:
 *               pengecerId:
 *                 type: integer
 *               pupukId:
 *                 type: integer
 *               jumlah:
 *                 type: number
 *               timestamp:
 *                 type: string
 *                 format: date-time
 */
router.post('/shipments', controller.createShipment.bind(controller));

/**
 * @swagger
 * /distributor/pengiriman:
 *   post:
 *     summary: Create new shipment (Indonesian alias)
 *     tags: [Distributor - Shipments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pengecerId
 *               - pupukId
 *               - jumlah
 *             properties:
 *               pengecerId:
 *                 type: integer
 *               pupukId:
 *                 type: integer
 *               jumlah:
 *                 type: number
 *               timestamp:
 *                 type: string
 *                 format: date-time
 */
router.post('/pengiriman', controller.createShipment.bind(controller));

/**
 * @swagger
 * /distributor/shipments/recent:
 *   get:
 *     summary: Get recent shipments
 *     tags: [Distributor - Shipments]
 *     security:
 *       - bearerAuth: []
 */
router.get('/shipments/recent', controller.getRecentShipments.bind(controller));

/**
 * @swagger
 * /distributor/shipments/history:
 *   get:
 *     summary: Get shipment history with pagination
 *     tags: [Distributor - Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 */
router.get('/shipments/history', controller.getShipmentHistory.bind(controller));

/**
 * @swagger
 * /distributor/pengiriman/history:
 *   get:
 *     summary: Get shipment history (Indonesian alias)
 *     tags: [Distributor - Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 */
router.get('/pengiriman/history', controller.getShipmentHistory.bind(controller));

/**
 * @swagger
 * /distributor/validate-pengecer/{pengecerId}:
 *   get:
 *     summary: Validate pengecer before creating shipment
 *     tags: [Distributor - Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pengecerId
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/validate-pengecer/:pengecerId', controller.validatePengecer.bind(controller));

/**
 * @swagger
 * /distributor/validasi-pengecer/{pengecerId}:
 *   get:
 *     summary: Validate pengecer (Indonesian alias)
 *     tags: [Distributor - Shipments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pengecerId
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/validasi-pengecer/:pengecerId', controller.validatePengecer.bind(controller));

/**
 * @swagger
 * /distributor/stock:
 *   get:
 *     summary: Get stock dashboard with pagination
 *     tags: [Distributor - Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 */
router.get('/stock', controller.getStockDashboard.bind(controller));

/**
 * @swagger
 * /distributor/stok:
 *   get:
 *     summary: Get stock dashboard (Indonesian alias)
 *     tags: [Distributor - Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 */
router.get('/stok', controller.getStockDashboard.bind(controller));

/**
 * @swagger
 * /distributor/stock/{pupukId}:
 *   get:
 *     summary: Get current stock for specific fertilizer
 *     tags: [Distributor - Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pupukId
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/stock/:pupukId', controller.getCurrentStock.bind(controller));

/**
 * @swagger
 * /distributor/stok/{pupukId}:
 *   get:
 *     summary: Get current stock (Indonesian alias)
 *     tags: [Distributor - Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: pupukId
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/stok/:pupukId', controller.getCurrentStock.bind(controller));

/**
 * @swagger
 * /distributor/stock/adjust:
 *   post:
 *     summary: Adjust stock (add or reduce)
 *     tags: [Distributor - Stock]
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
 *               - jumlahPenyesuaian
 *             properties:
 *               pupukId:
 *                 type: integer
 *               jumlahPenyesuaian:
 *                 type: number
 *               waktu:
 *                 type: string
 *                 format: date-time
 */
router.post('/stock/adjust', controller.adjustStock.bind(controller));

/**
 * @swagger
 * /distributor/stok/adjust:
 *   post:
 *     summary: Adjust stock (Indonesian alias)
 *     tags: [Distributor - Stock]
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
 *               - jumlahPenyesuaian
 *             properties:
 *               pupukId:
 *                 type: integer
 *               jumlahPenyesuaian:
 *                 type: number
 *               waktu:
 *                 type: string
 *                 format: date-time
 */
router.post('/stok/adjust', controller.adjustStock.bind(controller));

/**
 * @swagger
 * /distributor/stock/add:
 *   post:
 *     summary: Add incoming stock
 *     tags: [Distributor - Stock]
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
 *               - jumlahMasuk
 *             properties:
 *               pupukId:
 *                 type: integer
 *               jumlahMasuk:
 *                 type: number
 *               waktu:
 *                 type: string
 *                 format: date-time
 */
router.post('/stock/add', controller.addStock.bind(controller));

/**
 * @swagger
 * /distributor/stok/add:
 *   post:
 *     summary: Add incoming stock (Indonesian alias)
 *     tags: [Distributor - Stock]
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
 *               - jumlahMasuk
 *             properties:
 *               pupukId:
 *                 type: integer
 *               jumlahMasuk:
 *                 type: number
 *               waktu:
 *                 type: string
 *                 format: date-time
 */
router.post('/stok/add', controller.addStock.bind(controller));

/**
 * @swagger
 * /distributor/stock/history/incoming:
 *   get:
 *     summary: Get incoming stock history
 *     tags: [Distributor - Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 */
router.get('/stock/history/incoming', controller.getIncomingStockHistory.bind(controller));

/**
 * @swagger
 * /distributor/stok/history/masuk:
 *   get:
 *     summary: Get incoming stock history (Indonesian alias)
 *     tags: [Distributor - Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 */
router.get('/stok/history/masuk', controller.getIncomingStockHistory.bind(controller));

/**
 * @swagger
 * /distributor/stock/history/outgoing:
 *   get:
 *     summary: Get outgoing stock history
 *     tags: [Distributor - Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 */
router.get('/stock/history/outgoing', controller.getOutgoingStockHistory.bind(controller));

/**
 * @swagger
 * /distributor/stok/history/keluar:
 *   get:
 *     summary: Get outgoing stock history (Indonesian alias)
 *     tags: [Distributor - Stock]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 */
router.get('/stok/history/keluar', controller.getOutgoingStockHistory.bind(controller));

/**
 * @swagger
 * /distributor/notifications:
 *   get:
 *     summary: Get notifications with pagination
 *     tags: [Distributor - Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 */
router.get('/notifications', controller.getNotifications.bind(controller));

/**
 * @swagger
 * /distributor/notifikasi:
 *   get:
 *     summary: Get notifications (Indonesian alias)
 *     tags: [Distributor - Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 */
router.get('/notifikasi', controller.getNotifications.bind(controller));

/**
 * @swagger
 * /distributor/notifications/{notifikasiId}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Distributor - Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notifikasiId
 *         required: true
 *         schema:
 *           type: integer
 */
router.patch('/notifications/:notifikasiId/read', controller.markNotificationRead.bind(controller));

/**
 * @swagger
 * /distributor/notifikasi/{notifikasiId}/baca:
 *   patch:
 *     summary: Mark notification as read (Indonesian alias)
 *     tags: [Distributor - Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notifikasiId
 *         required: true
 *         schema:
 *           type: integer
 */
router.patch('/notifikasi/:notifikasiId/baca', controller.markNotificationRead.bind(controller));

export default router;
