import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { RedemptionService } from './redemption.service';

const redemptionService = new RedemptionService();

export class RedemptionController {
  async validateFarmer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const retailerId = req.user!.userId;
      const { petaniId } = req.body;

      const result = await redemptionService.validateFarmer(petaniId, retailerId);

      res.json({
        message: 'Validasi petani berhasil',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async redeemFertilizer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const retailerId = req.user!.userId;
      const { petaniId, pupukId, jumlah } = req.body;

      const redemption = await redemptionService.redeemFertilizer(
        retailerId,
        petaniId,
        pupukId,
        jumlah
      );

      res.status(201).json({
        message: 'Penebusan berhasil',
        data: redemption,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRedemptionHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const retailerId = req.user!.userId;

      const redemptions = await redemptionService.getRedemptionHistory(retailerId);

      res.json({
        message: 'Berhasil mengambil riwayat penebusan',
        data: redemptions,
      });
    } catch (error) {
      next(error);
    }
  }
}
