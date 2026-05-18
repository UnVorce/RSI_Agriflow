import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../common/middleware/auth.middleware';
import { ShipmentService } from './shipment.service';

const shipmentService = new ShipmentService();

export class ShipmentController {
  async createShipment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const distributorId = req.user!.userId;
      const { retailerId, pupukId, jumlah } = req.body;

      const shipment = await shipmentService.createShipment(
        distributorId,
        retailerId,
        pupukId,
        jumlah
      );

      res.status(201).json({
        message: 'Kiriman berhasil dibuat',
        data: shipment,
      });
    } catch (error) {
      next(error);
    }
  }

  async getShipmentHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const role = req.user!.role;

      const shipments = await shipmentService.getShipmentHistory(userId, role);

      res.json({
        message: 'Berhasil mengambil riwayat kiriman',
        data: shipments,
      });
    } catch (error) {
      next(error);
    }
  }

  async receiveShipment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const retailerId = req.user!.userId;
      const { kirimanId, jumlahDiterima } = req.body;

      const shipment = await shipmentService.receiveShipment(
        kirimanId,
        retailerId,
        jumlahDiterima
      );

      res.json({
        message: 'Kiriman berhasil diterima',
        data: shipment,
      });
    } catch (error) {
      next(error);
    }
  }
}
