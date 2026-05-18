# AgriFlow Backend

Fertilizer Subsidy Distribution Management System - Backend API

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **ORM**: Prisma
- **Database**: SQL Server
- **Cache**: Redis
- **Authentication**: JWT + bcrypt
- **Documentation**: Swagger/OpenAPI
- **Validation**: Zod
- **Logging**: Winston

## Prerequisites

- Node.js (v18 or higher)
- Docker & Docker Compose (for SQL Server & Redis)
- npm or yarn

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

Copy `.env.example` to `.env` and configure:

```bash
copy .env.example .env
```

Update the `.env` file with your configuration.

### 3. Start Database & Redis

```bash
docker-compose up -d
```

This will start:
- SQL Server on port 1433
- Redis on port 6379

### 4. Setup Database

Create the database schemas:

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Seed Initial Data (Optional)

Run the seed script to populate initial roles and fertilizer types:

```bash
npx tsx prisma/seed.ts
```

### 6. Start Development Server

```bash
npm run dev
```

The server will start on http://localhost:3000

## API Documentation

Once the server is running, access the Swagger documentation at:

http://localhost:3000/api-docs

## Project Structure

```
src/
├── config/          # Configuration files (env, database, redis, swagger)
├── common/          # Shared utilities
│   ├── middleware/  # Auth, role, upload, error middleware
│   └── validators/  # Zod validation schemas
├── modules/         # Feature modules
│   ├── auth/        # Authentication & authorization
│   ├── stock/       # Stock management
│   ├── shipment/    # Shipment operations
│   └── redemption/  # Fertilizer redemption
├── utils/           # Utility functions (jwt, password, logger)
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## User Roles

- **PEMERINTAH** (Government): Approve/reject registrations, monitoring
- **DISTRIBUTOR**: Stock management, create shipments
- **PENGECER** (Retailer): Receive shipments, farmer validation, redemption

## Key Features

### Phase 1 (Implemented)
- ✅ Authentication & Authorization (JWT + RBAC)
- ✅ User Registration with Approval Flow
- ✅ Stock Management
- ✅ Shipment Creation & Receiving
- ✅ Fertilizer Redemption with Quota Validation

### Phase 2 (To Be Implemented)
- Dashboard endpoints
- Monitoring & analytics
- Notification system

### Phase 3 (Future)
- Anomaly detection
- Advanced analytics

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/pending` - Get pending users (Government)
- `PATCH /api/auth/approve/:id` - Approve user (Government)
- `PATCH /api/auth/reject/:id` - Reject user (Government)

### Stock
- `GET /api/stock` - Get user stock
- `POST /api/stock` - Add stock
- `PATCH /api/stock/:userId/:pupukId` - Update stock
- `GET /api/stock/history` - Get stock history

### Shipment
- `POST /api/shipments` - Create shipment (Distributor)
- `GET /api/shipments/history` - Get shipment history
- `POST /api/shipments/receive` - Receive shipment (Retailer)

### Redemption
- `POST /api/redemption/validate` - Validate farmer
- `POST /api/redemption` - Redeem fertilizer
- `GET /api/redemption/history` - Get redemption history

## Business Rules

### BR-01: Farmer Validation
- PetaniId must be exactly 16 digits
- Farmer must exist and belong to the retailer

### BR-02: Stock Validation
- Stock must be sufficient for shipments and redemptions

### BR-03: Quota Validation
- Redemption quantity cannot exceed farmer's quota

### BR-04: Shipment Receiving
- Matched quantity → Status: "Diterima"
- Mismatched quantity → Status: "Tidak Sesuai" + Notification

### BR-05: Atomic Transactions
- All operations use Prisma transactions for data consistency

## Testing

Run tests:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

## Database Management

### Generate Prisma Client

```bash
npm run prisma:generate
```

### Create Migration

```bash
npm run prisma:migrate
```

### Open Prisma Studio

```bash
npm run prisma:studio
```

## Logging

Logs are stored in the `logs/` directory:
- `error.log` - Error logs only
- `combined.log` - All logs

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 8-hour access and 30-day refresh expiry
- Role-based access control (RBAC)
- File upload validation (JPG/PNG only, max 5MB)
- Private file storage (never public)

## Performance Targets

- Normal request: < 3 seconds
- Farmer validation: < 2 seconds
- Shipment operations: < 5 seconds
- Concurrent users: 10

## License

ISC
