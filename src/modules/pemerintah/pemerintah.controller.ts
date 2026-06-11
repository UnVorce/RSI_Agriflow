import { Response, NextFunction } from 'express';
import { AuthRequest as Request } from '../../common/middleware/auth.middleware';
import { PemerintahService } from './pemerintah.service';

const service = new PemerintahService();

export class PemerintahController {
  /**
   * GET /api/pemerintah/notifications/top
   * Get top 3 unread notifications
   */
  async getTopNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.userId);
      if (isNaN(userId)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const data = await service.getTopNotifications(userId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pemerintah/dashboard
   * Get comprehensive dashboard with filters
   */
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const provinsi = req.query.provinsi as string | undefined;
      const tahunAwal = req.query.tahunAwal ? parseInt(req.query.tahunAwal as string) : undefined;
      const tahunAkhir = req.query.tahunAkhir ? parseInt(req.query.tahunAkhir as string) : undefined;
      const pupukId = req.query.pupukId ? parseInt(req.query.pupukId as string) : undefined;

      const data = await service.getDashboard({
        provinsi,
        tahunAwal,
        tahunAkhir,
        pupukId,
      });

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pemerintah/anomalies
   * Get anomaly detection notifications
   */
  async getAnomalies(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = Number(req.user?.userId);
      if (isNaN(userId)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const pageNumber = parseInt(req.query.page as string) || 1;
      const data = await service.getAnomalies(userId, pageNumber);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pemerintah/users/pending
   * Get pending users for verification
   */
  async getPendingUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const pageNumber = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 6;
      const data = await service.getPendingUsers(pageNumber, pageSize);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/pemerintah/users/:userId/approve
   * Approve pending user
   */
  async approveUser(req: Request, res: Response, next: NextFunction) {
    try {
      const approverId = Number(req.user?.userId);
      if (isNaN(approverId)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const userId = Number(req.params.userId);
      if (isNaN(userId)) { res.status(400).json({ success: false, message: 'userId tidak valid' }); return; }
      const data = await service.approveUser(userId, approverId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/pemerintah/users/:userId/reject
   * Reject pending user
   */
  async rejectUser(req: Request, res: Response, next: NextFunction) {
    try {
      const approverId = Number(req.user?.userId);
      if (isNaN(approverId)) { res.status(401).json({ success: false, message: 'Unauthorized' }); return; }
      const userId = Number(req.params.userId);
      if (isNaN(userId)) { res.status(400).json({ success: false, message: 'userId tidak valid' }); return; }
      const data = await service.rejectUser(userId, approverId);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/pemerintah/help-requests
   * Get help requests (bantuan)
   */
  async getHelpRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const pageNumber = parseInt(req.query.page as string) || 1;
      const data = await service.getHelpRequests(pageNumber);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
