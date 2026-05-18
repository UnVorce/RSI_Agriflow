import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../utils/jwt';
import redisClient from '../../config/redis';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token tidak ditemukan' 
      });
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted
    const isBlacklisted = await redisClient.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ 
        error: 'Token tidak valid' 
      });
    }

    const payload = verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (error) {
    return res.status(401).json({ 
      error: 'Token tidak valid atau sudah kadaluarsa' 
    });
  }
};
