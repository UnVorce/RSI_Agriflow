import { Request, Response, NextFunction } from 'express';
import { LandingService } from './landing.service';

const landingService = new LandingService();

export class LandingController {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await landingService.getStats();

      res.json({
        message: 'Berhasil mengambil statistik',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAbout(req: Request, res: Response, next: NextFunction) {
    try {
      const about = await landingService.getAbout();

      res.json({
        message: 'Berhasil mengambil informasi tentang AgriFlow',
        data: about,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFertilizers(req: Request, res: Response, next: NextFunction) {
    try {
      const fertilizers = await landingService.getFertilizers();

      res.json({
        message: 'Berhasil mengambil daftar pupuk',
        data: fertilizers,
      });
    } catch (error) {
      next(error);
    }
  }
}
