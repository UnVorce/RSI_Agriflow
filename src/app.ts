import express, { Application } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './common/middleware/error.middleware';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import stockRoutes from './modules/stock/stock.routes';
import shipmentRoutes from './modules/shipment/shipment.routes';
import redemptionRoutes from './modules/redemption/redemption.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import monitoringRoutes from './modules/monitoring/monitoring.routes';
import notificationRoutes from './modules/notification/notification.routes';
import landingRoutes from './modules/landing/landing.routes';

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AgriFlow Backend is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/redemption', redemptionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/landing', landingRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
