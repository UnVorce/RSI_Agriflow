import { Router } from 'express';
import { PemerintahController } from './pemerintah.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireRole } from '../../common/middleware/role.middleware';

const router = Router();
const controller = new PemerintahController();

// All routes require authentication and Pemerintah role
router.use(authenticate);
router.use(requireRole('PEMERINTAH'));

/**
 * @swagger
 * /pemerintah/dashboard:
 *   get:
 *     summary: Get government dashboard with analytics
 *     tags: [Pemerintah]
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', controller.getDashboard.bind(controller));

/**
 * @swagger
 * /pemerintah/notifications/top:
 *   get:
 *     summary: Get top notifications
 *     tags: [Pemerintah]
 *     security:
 *       - bearerAuth: []
 */
router.get('/notifications/top', controller.getTopNotifications.bind(controller));

/**
 * @swagger
 * /pemerintah/anomalies:
 *   get:
 *     summary: Get anomalies in the system
 *     tags: [Pemerintah]
 *     security:
 *       - bearerAuth: []
 */
router.get('/anomalies', controller.getAnomalies.bind(controller));

/**
 * @swagger
 * /pemerintah/users/pending:
 *   get:
 *     summary: Get pending user registrations
 *     tags: [Pemerintah - User Management]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users/pending', controller.getPendingUsers.bind(controller));

/**
 * @swagger
 * /pemerintah/users/{userId}/approve:
 *   post:
 *     summary: Approve pending user registration
 *     tags: [Pemerintah - User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 */
router.post('/users/:userId/approve', controller.approveUser.bind(controller));

/**
 * @swagger
 * /pemerintah/users/{userId}/reject:
 *   post:
 *     summary: Reject pending user registration
 *     tags: [Pemerintah - User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 */
router.post('/users/:userId/reject', controller.rejectUser.bind(controller));

/**
 * @swagger
 * /pemerintah/help-requests:
 *   get:
 *     summary: Get help requests from users
 *     tags: [Pemerintah]
 *     security:
 *       - bearerAuth: []
 */
router.get('/help-requests', controller.getHelpRequests.bind(controller));

export default router;
