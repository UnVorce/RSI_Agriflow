import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { NotificationService } from './notification.service';

const notificationService = new NotificationService();

export class NotificationController {
  async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const unreadOnly = req.query.unreadOnly === 'true';

      const notifications = await notificationService.getNotifications(
        userId,
        unreadOnly
      );

      res.json({
        message: 'Berhasil mengambil notifikasi',
        data: notifications,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const result = await notificationService.getUnreadCount(userId);

      res.json({
        message: 'Berhasil mengambil jumlah notifikasi belum dibaca',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const notification = await notificationService.markAsRead(id, userId);

      res.json({
        message: 'Notifikasi ditandai sebagai dibaca',
        data: notification,
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const result = await notificationService.markAllAsRead(userId);

      res.json({
        message: 'Semua notifikasi ditandai sebagai dibaca',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      const result = await notificationService.deleteNotification(id, userId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async submitComplaint(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { firstName, middleName, lastName, email, topik, ringkasan } = req.body;

      const complaint = await notificationService.submitComplaint({
        firstName,
        middleName,
        lastName,
        email,
        topik,
        ringkasan,
        userId,
      });

      res.status(201).json({
        message: 'Bantuan berhasil diajukan',
        data: complaint,
      });
    } catch (error) {
      next(error);
    }
  }

  async getComplaints(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const complaints = await notificationService.getComplaints();

      res.json({
        message: 'Berhasil mengambil daftar bantuan',
        data: complaints,
      });
    } catch (error) {
      next(error);
    }
  }

  async getComplaintById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const complaint = await notificationService.getComplaintById(id);

      res.json({
        message: 'Berhasil mengambil detail bantuan',
        data: complaint,
      });
    } catch (error) {
      next(error);
    }
  }
}
