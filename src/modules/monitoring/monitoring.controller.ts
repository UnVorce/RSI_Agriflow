import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { MonitoringService } from './monitoring.service';

const monitoringService = new MonitoringService();

export class MonitoringController {
  async getMonitoring(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { province, dateStart, dateEnd, fertilizer } = req.query;

      const data = await monitoringService.getMonitoringData({
        province: province as string,
        dateStart: dateStart as string,
        dateEnd: dateEnd as string,
        fertilizer: fertilizer as string,
      });

      res.json({
        message: 'Berhasil mengambil data monitoring',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAnomalies(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const anomalies = await monitoringService.detectAnomalies();

      res.json({
        message: 'Berhasil mengambil data anomali',
        data: anomalies,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProvinces(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const provinces = await monitoringService.getProvinces();

      res.json({
        message: 'Berhasil mengambil daftar provinsi',
        data: provinces,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTrends(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { months } = req.query;
      const monthCount = months ? parseInt(months as string) : 12;

      const trends = await monitoringService.getDistributionTrends(monthCount);

      res.json({
        message: 'Berhasil mengambil data tren distribusi',
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  }
}
