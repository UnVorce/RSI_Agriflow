import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { AuthRequest } from '../../common/middleware/auth.middleware';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { fullname, email, password, role } = req.body;
      const proofPath = req.file?.filename;

      if (!proofPath) {
        return res.status(400).json({ 
          error: 'Bukti registrasi wajib diunggah' 
        });
      }

      const user = await authService.register({
        fullname,
        email,
        password,
        role,
        proofPath,
      });

      res.status(201).json({
        message: 'Registrasi berhasil. Menunggu persetujuan.',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      res.json({
        message: 'Login berhasil',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const users = await authService.getPendingUsers();

      res.json({
        message: 'Berhasil mengambil daftar pengguna pending',
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const approverId = req.user!.userId;

      const user = await authService.approveUser(id, approverId);

      res.json({
        message: 'Pengguna berhasil disetujui',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const approverId = req.user!.userId;

      const user = await authService.rejectUser(id, approverId);

      res.json({
        message: 'Pengguna berhasil ditolak',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
