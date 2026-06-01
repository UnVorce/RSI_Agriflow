import { Router } from 'express';
import { authenticate } from '../common/middleware/auth.middleware';
import { requireRole } from '../common/middleware/role.middleware';

// Import controllers
import { AuthController } from '../modules/auth/auth.controller';
import { BantuanController } from '../modules/bantuan/bantuan.controller';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import monitoringRoutes from '../modules/monitoring/monitoring.routes';
import notificationRoutes from '../modules/notification/notification.routes';

const router = Router();
const authController = new AuthController();
const bantuanController = new BantuanController();

// All routes require authentication and PEMERINTAH role
router.use(authenticate);
router.use(requireRole('PEMERINTAH'));

// ============================================
// USER APPROVAL MANAGEMENT
// ============================================

/**
 * @swagger
 * /pemerintah/users/pending:
 *   get:
 *     summary: Get pending user registrations
 *     tags: [Pemerintah]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users/pending', authController.getPendingUsers);

/**
 * @swagger
 * /pemerintah/users/approve/{id}:
 *   patch:
 *     summary: Approve user registration
 *     tags: [Pemerintah]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/users/approve/:id', authController.approveUser);

/**
 * @swagger
 * /pemerintah/users/reject/{id}:
 *   patch:
 *     summary: Reject user registration
 *     tags: [Pemerintah]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/users/reject/:id', authController.rejectUser);

// ============================================
// DASHBOARD & MONITORING
// ============================================

/**
 * @swagger
 * /pemerintah/dashboard:
 *   get:
 *     summary: Get government dashboard data
 *     tags: [Pemerintah]
 *     security:
 *       - bearerAuth: []
 */
router.use('/dashboard', dashboardRoutes);

/**
 * @swagger
 * /pemerintah/monitoring:
 *   get:
 *     summary: Get monitoring data with filters
 *     tags: [Pemerintah]
 *     security:
 *       - bearerAuth: []
 */
router.use('/monitoring', monitoringRoutes);

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * @swagger
 * /pemerintah/notifikasi:
 *   get:
 *     summary: Get all notifications
 *     tags: [Pemerintah]
 *     security:
 *       - bearerAuth: []
 */
router.use('/notifikasi', notificationRoutes);

// ============================================
// BANTUAN (HELP/SUPPORT)
// ============================================

/**
 * @swagger
 * /pemerintah/bantuan:
 *   get:
 *     summary: Get all help requests
 *     tags: [Pemerintah]
 *     security:
 *       - bearerAuth: []
 */
router.get('/bantuan', bantuanController.getAllBantuan);

/**
 * @swagger
 * /pemerintah/bantuan/{id}:
 *   get:
 *     summary: Get help request by ID
 *     tags: [Pemerintah]
 *     security:
 *       - bearerAuth: []
 */
router.get('/bantuan/:id', bantuanController.getBantuanById);

export default router;
