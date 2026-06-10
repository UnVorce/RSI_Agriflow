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

// Import module routes
import distributorRoutes from './modules/distributor/distributor.routes';
import pengecerRoutes from './modules/pengecer/pengecer.routes';
import pemerintahRoutes from './modules/pemerintah/pemerintah.routes';

// Import additional module routes
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import monitoringRoutes from './modules/monitoring/monitoring.routes';
import notificationRoutes from './modules/notification/notification.routes';
import petaniRoutes from './modules/petani/petani.routes';
import redemptionRoutes from './modules/redemption/redemption.routes';
import shipmentRoutes from './modules/shipment/shipment.routes';
import stockRoutes from './modules/stock/stock.routes';
import pupukRoutes from './modules/pupuk/pupuk.routes';

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

// Additional route mounts
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/petani', petaniRoutes);
app.use('/api/redemption', redemptionRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/pupuk', pupukRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
