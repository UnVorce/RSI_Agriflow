import express, { Application } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './common/middleware/error.middleware';
import { apiRateLimiter } from './common/middleware/rate-limit.middleware';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import landingRoutes from './modules/landing/landing.routes';
import bantuanRoutes from './modules/bantuan/bantuan.routes';

// Import role-based routes
import pemerintahRoutes from './routes/pemerintah.routes';
import distributorRoutes from './routes/distributor.routes';
import pengecerRoutes from './routes/pengecer.routes';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global rate limiting for all API routes
app.use('/api', apiRateLimiter);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', message: 'AgriFlow Backend is running' });
});

// API Routes
// Public & Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/landing', landingRoutes);
app.use('/api/bantuan', bantuanRoutes);

// Role-based routes with prefix
app.use('/api/pemerintah', pemerintahRoutes);
app.use('/api/distributor', distributorRoutes);
app.use('/api/pengecer', pengecerRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
