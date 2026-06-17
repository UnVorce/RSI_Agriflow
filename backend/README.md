# AgriFlow Backend

Backend API untuk sistem distribusi subsidi pupuk.

## Tech Stack

- Node.js + TypeScript + Express
- SQL Server + Prisma ORM  
- Redis (optional)
- JWT Authentication
- Zod Validation

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
copy .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="sqlserver://localhost:1433;database=AgriFlowDB;integratedSecurity=true;trustServerCertificate=true"
```

### 3. Generate Prisma Client
```bash
npm run prisma:generate
```

### 4. Start Server
```bash
npm run dev
```

API: http://localhost:3002
Docs: http://localhost:3002/api-docs

## Scripts

```bash
npm run dev          # Development
npm run build        # Build production
npm start            # Start production
npm test             # Run tests
npm run prisma:studio # Database GUI
```

## API Structure

```
/api/auth/*         - Authentication
/api/pemerintah/*   - Government endpoints
/api/distributor/*  - Distributor endpoints  
/api/pengecer/*     - Retailer endpoints
```

## Database Architecture

4 schemas:
- `ref` - Reference data (roles, locations, products)
- `master` - Master data (users, farmers, distributors)
- `trans` - Transactions (shipments, redemptions, stock)
- `evt` - Events (notifications, logs)

## Performance

Optimized for 2M+ rows:
- ✅ Pagination (max 100/request)
- ✅ Database indexes
- ✅ Redis caching
- ✅ Connection pooling

Target: < 500ms response time

## Documentation

- `SETUP.md` - Detailed setup guide
- `API_DOCUMENTATION.md` - API reference
- `/api-docs` - Swagger UI
