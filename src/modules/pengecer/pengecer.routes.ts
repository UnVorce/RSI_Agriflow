import { Router } from 'express';
import { PengecerController } from './pengecer.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireRole } from '../../common/middleware/role.middleware';

const router = Router();
const controller = new PengecerController();

// All routes require authentication and Pengecer role
router.use(authenticate);
router.use(requireRole('PENGECER'));

/**
 * @swagger
 * /pengecer/dashboard:
 *   get:
 *     summary: Get pengecer dashboard data
 *     tags: [Pengecer]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', controller.getDashboard.bind(controller));

/**
 * @swagger
 * /pengecer/receipts/recent:
 *   get:
 *     summary: Get recent receipts from distributor
 *     tags: [Pengecer - Receipts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/receipts/recent', controller.getRecentReceipts.bind(controller));

/**
 * @swagger
 * /pengecer/penerimaan/recent:
 *   get:
 *     summary: Get recent receipts (Indonesian alias)
 *     tags: [Pengecer - Receipts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/penerimaan/recent', controller.getRecentReceipts.bind(controller));

/**
 * @swagger
 * /pengecer/receipts/history:
 *   get:
 *     summary: Get receipt history with pagination
 *     tags: [Pengecer - Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 */
router.get('/receipts/history', controller.getReceiptHistory.bind(controller));

/**
 * @swagger
 * /pengecer/penerimaan/history:
 *   get:
 *     summary: Get receipt history (Indonesian alias)
 *     tags: [Pengecer - Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 */
router.get('/penerimaan/history', controller.getReceiptHistory.bind(controller));

/**
 * @swagger
 * /pengecer/validate-shipment/{kirimanId}:
 *   get:
 *     summary: Validate shipment before receiving
 *     tags: [Pengecer - Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kirimanId
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/validate-shipment/:kirimanId', controller.validateShipment.bind(controller));

/**
 * @swagger
 * /pengecer/validasi-kiriman/{kirimanId}:
 *   get:
 *     summary: Validate shipment (Indonesian alias)
 *     tags: [Pengecer - Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: kirimanId
 *         required: true
 *         schema:
 *           type: integer
 */
router.get('/validasi-kiriman/:kirimanId', controller.validateShipment.bind(controller));

/**
 * @swagger
 * /pengecer/receipts:
 *   post:
 *     summary: Receive shipment from distributor
 *     tags: [Pengecer - Receipts]
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
 *                 type: integer
 *               jumlahDiterima:
 *                 type: number
 *               timestamp:
 *                 type: string
 *                 format: date-time
 */
router.post('/receipts', controller.receiveShipment.bind(controller));

/**
 * @swagger
 * /pengecer/terima-stok:
 *   post:
 *     summary: Receive shipment (Indonesian alias)
 *     tags: [Pengecer - Receipts]
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
 *                 type: integer
 *               jumlahDiterima:
 *                 type: number
 *               timestamp:
 *                 type: string
 *                 format: date-time
 */
router.post('/terima-stok', controller.receiveShipment.bind(controller));

/**
 * @swagger
 * /pengecer/stock:
 *   get:
 *     summary: Get stock dashboard with pagination
 *     tags: [Pengecer - Stock]
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
 * /pengecer/stok:
 *   get:
 *     summary: Get stock dashboard (Indonesian alias)
 *     tags: [Pengecer - Stock]
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
 * /pengecer/stock/add:
 *   post:
 *     summary: Add incoming stock manually
 *     tags: [Pengecer - Stock]
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
 * /pengecer/stok/add:
 *   post:
 *     summary: Add incoming stock (Indonesian alias)
 *     tags: [Pengecer - Stock]
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
 * /pengecer/redemptions/history:
 *   get:
 *     summary: Get redemption history with pagination
 *     tags: [Pengecer - Redemptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 */
router.get('/redemptions/history', controller.getRedemptionHistory.bind(controller));

/**
 * @swagger
 * /pengecer/penebusan/history:
 *   get:
 *     summary: Get redemption history (Indonesian alias)
 *     tags: [Pengecer - Redemptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 */
router.get('/penebusan/history', controller.getRedemptionHistory.bind(controller));

/**
 * @swagger
 * /pengecer/validate-petani/{petaniId}:
 *   get:
 *     summary: Validate farmer before creating redemption
 *     tags: [Pengecer - Redemptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: petaniId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/validate-petani/:petaniId', controller.validatePetani.bind(controller));

/**
 * @swagger
 * /pengecer/validasi-petani/{petaniId}:
 *   get:
 *     summary: Validate farmer (Indonesian alias)
 *     tags: [Pengecer - Redemptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: petaniId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/validasi-petani/:petaniId', controller.validatePetani.bind(controller));

/**
 * @swagger
 * /pengecer/redemptions:
 *   post:
 *     summary: Create redemption for farmer
 *     tags: [Pengecer - Redemptions]
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
 *               timestamp:
 *                 type: string
 *                 format: date-time
 */
router.post('/redemptions', controller.createRedemption.bind(controller));

/**
 * @swagger
 * /pengecer/penebusan:
 *   post:
 *     summary: Create redemption (Indonesian alias)
 *     tags: [Pengecer - Redemptions]
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
 *               timestamp:
 *                 type: string
 *                 format: date-time
 */
router.post('/penebusan', controller.createRedemption.bind(controller));

/**
 * @swagger
 * /pengecer/notifications:
 *   get:
 *     summary: Get notifications with pagination
 *     tags: [Pengecer - Notifications]
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
 * /pengecer/notifikasi:
 *   get:
 *     summary: Get notifications (Indonesian alias)
 *     tags: [Pengecer - Notifications]
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
 * /pengecer/notifications/{notifikasiId}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Pengecer - Notifications]
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
 * /pengecer/notifikasi/{notifikasiId}/baca:
 *   patch:
 *     summary: Mark notification as read (Indonesian alias)
 *     tags: [Pengecer - Notifications]
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
