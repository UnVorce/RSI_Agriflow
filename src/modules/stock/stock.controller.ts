import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { StockService } from './stock.service';

const stockService = new StockService();

export class StockController {
  async getStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { pupukId, search } = req.query;

      const stock = await stockService.getStock(
        userId,
        pupukId ? parseInt(pupukId as string) : undefined,
        search as string
      );

      res.json({
        message: 'Berhasil mengambil data stok',
        data: stock,
      });
    } catch (error) {
      next(error);
    }
  }

  async addStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { pupukId, jumlah } = req.body;

      const stock = await stockService.addStock(userId, pupukId, jumlah);

      res.status(201).json({
        message: 'Stok berhasil ditambahkan',
        data: stock,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId, pupukId } = req.params;
      const { jumlah } = req.body;
      const requesterId = req.user!.userId;

      const stock = await stockService.updateStock(
        userId,
        parseInt(pupukId),
        jumlah,
        requesterId
      );

      res.json({
        message: 'Stok berhasil diperbarui',
        data: stock,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStockHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { startDate, endDate, pupukId } = req.query;

      const history = await stockService.getStockHistory(
        userId,
        startDate as string,
        endDate as string,
        pupukId ? parseInt(pupukId as string) : undefined
      );

      res.json({
        message: 'Berhasil mengambil riwayat stok',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}
