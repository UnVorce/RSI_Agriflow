import { Response, NextFunction } from 'express';
import { AuthRequest as Request } from '../../common/middleware/auth.middleware';
import { DistributorService } from './distributor.service';

const service = new DistributorService();

export class DistributorController {
  /**
   * GET /api/distributor/dashboard
   * Get distributor dashboard data
   */
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.userId);
      if (isNaN(userId)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const data = await service.getDashboard(userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/distributor/shipments
   * Create new shipment
   */
  async createShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.userId);
      if (isNaN(userId)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const { pengecerId, pupukId, jumlah, timestamp } = req.body;
      const numPengecerId = Number(pengecerId);
      if (isNaN(numPengecerId)) { res.status(400).json({ success: false, message: 'pengecerId tidak valid' }); return; }
      const numPupukId = Number(pupukId);
      if (isNaN(numPupukId)) { res.status(400).json({ success: false, message: 'pupukId tidak valid' }); return; }

      const data = await service.createShipment({
        distributorId: userId,
        pengecerId: numPengecerId,
        pupukId: numPupukId,
        jumlah,
        timestamp: timestamp ? new Date(timestamp) : undefined,
      });

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/distributor/shipments/recent
   * Get recent shipments
   */
  async getRecentShipments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.userId);
      if (isNaN(userId)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const data = await service.getRecentShipments(userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/distributor/shipments/history
   * Get shipment history with pagination
   */
  async getShipmentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.userId);
      if (isNaN(userId)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const pageNumber = parseInt(req.query.page as string) || 1;
      const data = await service.getShipmentHistory(userId, pageNumber);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/distributor/validate-pengecer/:pengecerId
   * Validate pengecer before shipment
   */
  async validatePengecer(req: Request, res: Response, next: NextFunction) {
    try {
      const pengecerId = Number(req.params.pengecerId);
      if (isNaN(pengecerId)) { res.status(400).json({ success: false, message: 'pengecerId tidak valid' }); return; }
      const data = await service.validatePengecer(pengecerId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/distributor/stock
   * Get stock dashboard
   */
  async getStockDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.userId);
      if (isNaN(userId)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const pageNumber = parseInt(req.query.page as string) || 1;
      const data = await service.getStockDashboard(userId, pageNumber);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/distributor/stock/:pupukId
   * Get current stock for specific fertilizer
   */
  async getCurrentStock(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.userId);
      if (isNaN(userId)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const pupukId = parseInt(req.params.pupukId);
      const data = await service.getCurrentStock(userId, pupukId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/distributor/stock/adjust
   * Adjust stock (add or reduce)
   */
  async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.userId);
      if (isNaN(userId)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const { pupukId, jumlahPenyesuaian, waktu } = req.body;
      const numPupukId = Number(pupukId);
      if (isNaN(numPupukId)) { res.status(400).json({ success: false, message: 'pupukId tidak valid' }); return; }

      const data = await service.adjustStock({
        userId,
        pupukId: numPupukId,
        jumlahPenyesuaian,
        waktu: waktu ? new Date(waktu) : undefined,
      });

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/distributor/stock/add
   * Add incoming stock
   */
  async addStock(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.userId);
      if (isNaN(userId)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const { pupukId, jumlahMasuk, waktu } = req.body;
      const numPupukId = Number(pupukId);
      if (isNaN(numPupukId)) { res.status(400).json({ success: false, message: 'pupukId tidak valid' }); return; }

      const data = await service.addStock({
        userId,
        pupukId: numPupukId,
        jumlahMasuk,
        waktu: waktu ? new Date(waktu) : undefined,
      });

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/distributor/stock/history/incoming
   * Get incoming stock history
   */
  async getIncomingStockHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.userId);
      if (isNaN(userId)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const pageNumber = parseInt(req.query.page as string) || 1;
      const data = await service.getIncomingStockHistory(userId, pageNumber);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/distributor/stock/history/outgoing
   * Get outgoing stock history
   */
  async getOutgoingStockHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.userId);
      if (isNaN(userId)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const pageNumber = parseInt(req.query.page as string) || 1;
      const data = await service.getOutgoingStockHistory(userId, pageNumber);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/distributor/notifications
   * Get notifications with pagination
   */
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.userId);
      if (isNaN(userId)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const pageNumber = parseInt(req.query.page as string) || 1;
      const data = await service.getNotifications(userId, pageNumber);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/distributor/notifications/:notifikasiId/read
   * Mark notification as read
   */
  async markNotificationRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.userId);
      if (isNaN(userId)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const notifikasiId = Number(req.params.notifikasiId);
      if (isNaN(notifikasiId)) { res.status(400).json({ success: false, message: 'notifikasiId tidak valid' }); return; }
      const data = await service.markNotificationRead(notifikasiId, userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
