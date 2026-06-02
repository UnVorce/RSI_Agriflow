import { Request, Response, NextFunction } from 'express';
import { PengecerService } from './pengecer.service';

const service = new PengecerService();

export class PengecerController {
  /**
   * GET /api/pengecer/dashboard
   * Get pengecer dashboard data
   */
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const data = await service.getDashboard(userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pengecer/receipts/recent
   * Get recent receipts
   */
  async getRecentReceipts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const data = await service.getRecentReceipts(userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pengecer/receipts/history
   * Get receipt history with pagination
   */
  async getReceiptHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const pageNumber = parseInt(req.query.page as string) || 1;
      const data = await service.getReceiptHistory(userId, pageNumber);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pengecer/validate-shipment/:kirimanId
   * Validate shipment before receiving
   */
  async validateShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { kirimanId } = req.params;
      const data = await service.validateShipment(userId, kirimanId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/pengecer/receipts
   * Receive shipment from distributor
   */
  async receiveShipment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { kirimanId, jumlahDiterima, timestampDiterima } = req.body;

      const data = await service.receiveShipment({
        pengecerId: userId,
        kirimanId,
        jumlahDiterima,
        timestampDiterima: timestampDiterima ? new Date(timestampDiterima) : undefined,
      });

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pengecer/stock
   * Get stock dashboard with sorting
   */
  async getStockDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const pageNumber = parseInt(req.query.page as string) || 1;
      const sortColumn = (req.query.sortColumn as 'JumlahStok' | 'LastUpdated') || 'LastUpdated';
      const sortDirection = (req.query.sortDirection as 'ASC' | 'DESC') || 'DESC';

      const data = await service.getStockDashboard(userId, pageNumber, sortColumn, sortDirection);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/pengecer/stock/add
   * Add incoming stock
   */
  async addStock(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { pupukId, jumlahMasuk, waktu } = req.body;

      const data = await service.addStock({
        userId,
        pupukId,
        jumlahMasuk,
        waktu: waktu ? new Date(waktu) : undefined,
      });

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pengecer/redemptions/history
   * Get redemption history
   */
  async getRedemptionHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const pageNumber = parseInt(req.query.page as string) || 1;
      const data = await service.getRedemptionHistory(userId, pageNumber);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pengecer/validate-petani/:petaniId
   * Validate farmer for redemption
   */
  async validatePetani(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { petaniId } = req.params;
      const data = await service.validatePetani(userId, petaniId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/pengecer/redemptions
   * Create fertilizer redemption
   */
  async createRedemption(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { petaniId, pupukId, jumlah } = req.body;

      const data = await service.createRedemption({
        pengecerId: userId,
        petaniId,
        pupukId,
        jumlah,
      });

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pengecer/notifications
   * Get notifications with pagination
   */
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const pageNumber = parseInt(req.query.page as string) || 1;
      const data = await service.getNotifications(userId, pageNumber);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/pengecer/notifications/:notifikasiId/read
   * Mark notification as read
   */
  async markNotificationRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { notifikasiId } = req.params;
      const data = await service.markNotificationRead(notifikasiId, userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
