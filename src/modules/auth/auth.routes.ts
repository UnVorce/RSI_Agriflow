import { Router } from 'express';
import { AuthController } from './auth.controller';
import { upload } from '../../common/middleware/upload.middleware';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireRole } from '../../common/middleware/role.middleware';
import { validate } from '../../common/validators/validate';
import { registerSchema, loginSchema } from '../../common/validators/auth.validator';

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - fullname
 *               - email
 *               - password
 *               - role
 *               - proof
 *             properties:
 *               fullname:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [DISTRIBUTOR, PENGECER]
 *               proof:
 *                 type: string
 *                 format: binary
 */
router.post('/register', upload.single('proof'), authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/pending:
 *   get:
 *     summary: Get pending users (Government only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/pending',
  authenticate,
  requireRole('PEMERINTAH'),
  authController.getPendingUsers
);

/**
 * @swagger
 * /auth/approve/:id:
 *   patch:
 *     summary: Approve user (Government only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/approve/:id',
  authenticate,
  requireRole('PEMERINTAH'),
  authController.approveUser
);

/**
 * @swagger
 * /auth/reject/:id:
 *   patch:
 *     summary: Reject user (Government only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/reject/:id',
  authenticate,
  requireRole('PEMERINTAH'),
  authController.rejectUser
);

export default router;
