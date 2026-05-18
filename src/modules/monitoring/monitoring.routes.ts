import { Router } from 'express';
import { MonitoringController } from './monitoring.controller';
import { authenticate } from '../../common/middleware/auth.middleware';
import { requireRole } from '../../common/middleware/role.middleware';

const router = Router();
const monitoringController = new MonitoringController();

router.use(authenticate);
router.use(requireRole('PEMERINTAH'));

/**
 * @swagger
 * /monitoring:
 *   get:
 *     summary: Get monitoring data with filters (Government only)
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: province
 *         schema:
 *           type: string
 *       - in: query
 *         name: dateStart
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateEnd
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fertilizer
 *         schema:
 *           type: string
 */
router.get('/', monitoringController.getMonitoring);

/**
 * @swagger
 * /monitoring/anomaly:
 *   get:
 *     summary: Get anomaly detection data (Government only)
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 */
router.get('/anomaly', monitoringController.getAnomalies);

/**
 * @swagger
 * /monitoring/provinces:
 *   get:
 *     summary: Get list of provinces
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 */
router.get('/provinces', monitoringController.getProvinces);

/**
 * @swagger
 * /monitoring/trends:
 *   get:
 *     summary: Get distribution trends
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 */
router.get('/trends', monitoringController.getTrends);

export default router;
