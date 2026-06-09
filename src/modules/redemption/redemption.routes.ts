import { Router } from 'express';
import { RedemptionController } from './redemption.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireRole } from '../../common/middleware/role.middleware';

const router = Router();
const redemptionController = new RedemptionController();

router.use(authenticate);
router.use(requireRole('PENGECER'));

/**
 * @swagger
 * /redemption/validate:
 *   post:
 *     summary: Validate farmer
 *     tags: [Redemption]
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
 */
router.post('/validate', redemptionController.validateFarmer);

/**
 * @swagger
 * /redemption:
 *   post:
 *     summary: Redeem fertilizer
 *     tags: [Redemption]
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
 *                 type: number
 *               jumlah:
 *                 type: number
 */
router.post('/', redemptionController.redeemFertilizer);

/**
 * @swagger
 * /redemption/history:
 *   get:
 *     summary: Get redemption history
 *     tags: [Redemption]
 *     security:
 *       - bearerAuth: []
 */
router.get('/history', redemptionController.getRedemptionHistory);

export default router;
