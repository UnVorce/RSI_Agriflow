import { Router } from 'express';
import { BantuanController } from './bantuan.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireRole } from '../../common/middleware/role.middleware';

const router = Router();
const bantuanController = new BantuanController();

/**
 * @swagger
 * /bantuan:
 *   post:
 *     summary: Submit help/support request
 *     tags: [Bantuan]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - email
 *               - topik
 *               - ringkasan
 *             properties:
 *               firstName:
 *                 type: string
 *               middleName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               topik:
 *                 type: string
 *               ringkasan:
 *                 type: string
 */
router.post('/', bantuanController.submitBantuan);

/**
 * @swagger
 * /bantuan:
 *   get:
 *     summary: Get all help requests with pagination
 *     tags: [Bantuan]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: topik
 *         schema:
 *           type: string
 */
router.get('/', bantuanController.getAllBantuan);

/**
 * @swagger
 * /bantuan/my:
 *   get:
 *     summary: Get my help requests
 *     tags: [Bantuan]
 *     security:
 *       - bearerAuth: []
 */
router.get('/my', authenticate, bantuanController.getMyBantuan);

export default router;
