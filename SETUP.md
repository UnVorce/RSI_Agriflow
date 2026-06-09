# AgriFlow Backend - Setup Guide

## Prerequisites

- Node.js 18+
- SQL Server (database sudah siap)

## Setup Steps

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
# Database connection
DATABASE_URL="sqlserver://localhost:1433;database=AgriFlowDB;integratedSecurity=true;trustServerCertificate=true;connection_limit=20"

# Or SQL Authentication
# DATABASE_URL="sqlserver://sa:YourPassword@localhost:1433;database=AgriFlowDB;encrypt=true;trustServerCertificate=true;connection_limit=20"

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Secrets
JWT_ACCESS_SECRET=change-this-in-production
JWT_REFRESH_SECRET=change-this-in-production

# Server
NODE_ENV=development
PORT=3000
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Start Server

```bash
npm run dev
```

Server akan berjalan di:
- API: http://localhost:3000
- Swagger: http://localhost:3000/api-docs
- Health: http://localhost:3000/health

## Troubleshooting

### SQL Server Connection Error

1. Check connection string di `.env`
2. Test connection:
```bash
sqlcmd -S localhost -E -Q "SELECT @@VERSION"
```

### Redis Error (jika pakai)

Jika tidak pakai Redis, comment di `.env`:
```env
# REDIS_HOST=localhost  
# REDIS_PORT=6379
```

### Prisma Error

Generate ulang Prisma client:
```bash
npm run prisma:generate
```

## Production Notes

1. Change all secrets di `.env`
2. Set `NODE_ENV=production`
3. Setup SSL/TLS
4. Configure CORS
5. Use PM2 atau systemd
6. Setup monitoring
