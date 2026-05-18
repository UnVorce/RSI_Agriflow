# AgriFlow Backend - Project Summary

## Overview

AgriFlow is a **Fertilizer Subsidy Distribution Management System** designed to manage the flow of subsidized fertilizers from Government → Distributor → Retailer → Farmer.

**Key Points:**
- Farmers are NOT system users (data exists externally via e-RDKK)
- Financial transactions are OUT OF SCOPE
- Focus on stock flow and subsidy redemption tracking

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js v24.14.0 |
| Framework | Express.js |
| Language | TypeScript |
| ORM | Prisma |
| Database | SQL Server 2022 |
| Cache | Redis 7 |
| Authentication | JWT + bcrypt |
| Validation | Zod |
| Logging | Winston |
| Documentation | Swagger/OpenAPI |
| Testing | Vitest |
| Containerization | Docker + Docker Compose |

## Architecture

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│         (REST API Endpoints)            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Service Layer                   │
│    (Business Logic & Validation)        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       Repository Layer (Prisma)         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          SQL Server Database            │
│   (ref, master, trans, evt schemas)     │
└─────────────────────────────────────────┘
```

## Database Schema Design

### Four-Layer Schema Architecture

1. **ref** (Reference Layer)
   - `ROLE` - User roles (PEMERINTAH, DISTRIBUTOR, PENGECER)
   - `KODE_POS` - Postal codes with location hierarchy

2. **master** (Master Data Layer)
   - `USER` - System users with approval workflow
   - `PUPUK` - Fertilizer types
   - `PETANI` - Farmer data (16-digit ID)
   - `KUOTA_PETANI` - Farmer quotas per fertilizer type

3. **trans** (Transaction Layer)
   - `STOK` - Current stock levels (Distributor + Retailer)
   - `RIWAYAT_STOK` - Stock history/audit trail
   - `KIRIMAN_PUPUK` - Shipments between Distributor and Retailer
   - `PENEBUSAN_PUPUK` - Fertilizer redemptions by farmers

4. **evt** (Event Layer)
   - `NOTIFIKASI` - System notifications
   - `BANTUAN` - Help/support requests
   - `LOG_AKTIVITAS` - Activity audit logs

## User Roles & Permissions

### PEMERINTAH (Government)
- ✅ Approve/reject user registrations
- ✅ View monitoring dashboard
- ✅ View anomaly reports
- ✅ View help requests
- ✅ Access all notifications

### DISTRIBUTOR
- ✅ Manage stock inventory
- ✅ Create shipments to retailers
- ✅ View shipment history
- ✅ Receive notifications
- ❌ Cannot approve users
- ❌ Cannot redeem fertilizer

### PENGECER (Retailer)
- ✅ Receive shipments from distributors
- ✅ Manage local stock
- ✅ Validate farmers (16-digit ID)
- ✅ Process fertilizer redemptions
- ✅ View transaction history
- ❌ Cannot create shipments
- ❌ Cannot approve users

### PETANI (Farmer)
- ❌ NO system access
- ❌ NO login capability
- ✅ Data managed by retailers
- ✅ Validated via 16-digit ID

## Core Business Rules

### BR-01: Farmer Validation
- PetaniId must be exactly 16 digits
- Farmer must exist in database
- Farmer must belong to the requesting retailer
- Registration period must be valid (AwalTerdaftar ≤ now ≤ AkhirTerdaftar)

### BR-02: Stock Validation
- Distributor stock must be sufficient before creating shipment
- Retailer stock must be sufficient before redemption
- Stock cannot go negative

### BR-03: Quota Validation
- Redemption quantity cannot exceed farmer's remaining quota
- Quota decreases after successful redemption
- Quota is per farmer per fertilizer type

### BR-04: Shipment Receiving
- If received quantity == sent quantity → Status: "Diterima"
- If received quantity ≠ sent quantity → Status: "Tidak Sesuai"
- Mismatch generates notification to distributor

### BR-05: Atomic Transactions
- All multi-step operations use Prisma transactions
- Ensures data consistency (stock, history, logs)
- Rollback on any failure

## API Endpoints Summary

### Authentication (`/api/auth`)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/register` | Public | Register new user (with file upload) |
| POST | `/login` | Public | Login and get JWT tokens |
| GET | `/pending` | PEMERINTAH | Get pending user registrations |
| PATCH | `/approve/:id` | PEMERINTAH | Approve user registration |
| PATCH | `/reject/:id` | PEMERINTAH | Reject user registration |

### Stock Management (`/api/stock`)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/` | All | Get user's stock |
| POST | `/` | DISTRIBUTOR, PENGECER | Add stock |
| PATCH | `/:userId/:pupukId` | DISTRIBUTOR | Adjust stock |
| GET | `/history` | All | Get stock history |

### Shipment (`/api/shipments`)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/` | DISTRIBUTOR | Create shipment to retailer |
| GET | `/history` | DISTRIBUTOR, PENGECER | Get shipment history |
| POST | `/receive` | PENGECER | Receive shipment |

### Redemption (`/api/redemption`)
| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/validate` | PENGECER | Validate farmer by 16-digit ID |
| POST | `/` | PENGECER | Process fertilizer redemption |
| GET | `/history` | PENGECER | Get redemption history |

## Implementation Status

### ✅ Phase 1 - COMPLETED
- [x] Project setup with TypeScript + Express
- [x] Prisma schema with 4-layer architecture
- [x] Docker Compose (SQL Server + Redis)
- [x] Authentication & JWT
- [x] Role-based access control (RBAC)
- [x] User registration with approval workflow
- [x] File upload middleware (JPG/PNG only)
- [x] Stock management (add, update, history)
- [x] Shipment creation and receiving
- [x] Redemption with farmer validation
- [x] Atomic transactions
- [x] Activity logging
- [x] Error handling
- [x] Swagger documentation
- [x] Seed script

### 🚧 Phase 2 - TO BE IMPLEMENTED
- [ ] Dashboard endpoints (Distributor, Retailer, Government)
- [ ] Monitoring endpoints with filters
- [ ] Notification system (read/unread)
- [ ] Help/complaint system
- [ ] Landing page endpoints

### 🔮 Phase 3 - FUTURE
- [ ] Anomaly detection
- [ ] Advanced analytics
- [ ] Reporting system

## Security Features

✅ **Implemented:**
- Password hashing with bcrypt (10 rounds)
- JWT access tokens (8-hour expiry)
- JWT refresh tokens (30-day expiry)
- Token blacklisting via Redis
- Role-based access control
- File upload validation (type + size)
- Private file storage
- SQL injection protection (Prisma)
- Input validation (Zod)
- Audit logging

## File Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Seed script
│   └── setup-schemas.sql      # SQL setup script
├── src/
│   ├── config/
│   │   ├── database.ts        # Prisma client
│   │   ├── env.ts             # Environment config
│   │   ├── redis.ts           # Redis client
│   │   └── swagger.ts         # Swagger config
│   ├── common/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── role.middleware.ts
│   │   │   ├── upload.middleware.ts
│   │   │   └── error.middleware.ts
│   │   └── validators/
│   │       ├── validate.ts
│   │       └── auth.validator.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.routes.ts
│   │   ├── stock/
│   │   │   ├── stock.controller.ts
│   │   │   ├── stock.service.ts
│   │   │   └── stock.routes.ts
│   │   ├── shipment/
│   │   │   ├── shipment.controller.ts
│   │   │   ├── shipment.service.ts
│   │   │   └── shipment.routes.ts
│   │   └── redemption/
│   │       ├── redemption.controller.ts
│   │       ├── redemption.service.ts
│   │       └── redemption.routes.ts
│   ├── utils/
│   │   ├── jwt.ts             # JWT utilities
│   │   ├── password.ts        # Password hashing
│   │   └── logger.ts          # Winston logger
│   ├── app.ts                 # Express app
│   └── server.ts              # Server entry point
├── tests/
│   └── auth.test.ts           # Sample tests
├── docker-compose.yml         # Docker services
├── package.json
├── tsconfig.json
├── .env                       # Environment variables
├── README.md                  # Project documentation
├── SETUP.md                   # Setup instructions
└── PROJECT_SUMMARY.md         # This file
```

## Getting Started

### Prerequisites
- Node.js v18+
- Docker & Docker Compose
- npm or yarn

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Start Docker services
docker-compose up -d

# 3. Setup database (wait 30s after Docker start)
# Run setup-schemas.sql or use sqlcmd

# 4. Generate Prisma client
npm run prisma:generate

# 5. Run migrations
npm run prisma:migrate

# 6. Seed data
npx tsx prisma/seed.ts

# 7. Start server
npm run dev
```

### Access Points
- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

### Test Credentials
- **Email**: government@agriflow.com
- **Password**: password123
- **Role**: PEMERINTAH

## Performance Targets

| Operation | Target |
|-----------|--------|
| Normal request | < 3 seconds |
| Farmer validation | < 2 seconds |
| Shipment operations | < 5 seconds |
| Concurrent users | 10 |

## Out of Scope

❌ Payment/financial transactions
❌ GPS tracking
❌ Fertilizer production flow
❌ Farmer self-registration
❌ HTTPS/SSL (local HTTP only)
❌ Mobile app
❌ Email notifications

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm test -- --coverage
```

## Logging

Logs are stored in `logs/` directory:
- `error.log` - Errors only
- `combined.log` - All logs

## Redis Usage

| Key Pattern | Purpose |
|-------------|---------|
| `session:{userId}` | User sessions |
| `search:{query}` | Search cache |
| `blacklist:{token}` | Blacklisted tokens |

## Common Issues & Solutions

### SQL Server not ready
**Solution**: Wait 30-60 seconds after `docker-compose up`

### Prisma migration fails
**Solution**: Ensure schemas are created in SQL Server first

### Redis connection error
**Solution**: Check if Redis container is running: `docker ps`

### File upload fails
**Solution**: Ensure `uploads/` directory exists and is writable

## Next Steps

1. ✅ Complete Phase 1 (DONE)
2. 🚧 Implement Phase 2 (Dashboard, Monitoring, Notifications)
3. 🔮 Plan Phase 3 (Anomaly detection, Analytics)
4. 📝 Write comprehensive tests
5. 🔒 Security audit
6. 📊 Performance optimization
7. 📚 API client libraries
8. 🚀 Production deployment guide

## Contributing

When adding new features:
1. Follow existing folder structure
2. Use TypeScript strict mode
3. Add Zod validation for inputs
4. Use Prisma transactions for multi-step operations
5. Log all important actions
6. Add Swagger documentation
7. Write tests
8. Update this documentation

## License

ISC

---

**Built with ❤️ for AgriFlow**
