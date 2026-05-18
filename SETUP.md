# AgriFlow Backend - Setup Guide

## Quick Start

Follow these steps to get the AgriFlow backend up and running.

## Step 1: Start Docker Services

Start SQL Server and Redis using Docker Compose:

```bash
docker-compose up -d
```

Wait about 30 seconds for SQL Server to fully initialize.

## Step 2: Create Database Schemas

SQL Server doesn't automatically create schemas, so we need to create them manually.

### Option A: Using SQL Server Management Studio (SSMS)

1. Connect to `localhost,1433`
   - Username: `sa`
   - Password: `AgriFlow2024!`

2. Create the database:
```sql
CREATE DATABASE AgriFlowDB;
GO
```

3. Create the schemas:
```sql
USE AgriFlowDB;
GO

CREATE SCHEMA ref;
CREATE SCHEMA master;
CREATE SCHEMA trans;
CREATE SCHEMA evt;
GO
```

### Option B: Using sqlcmd (Command Line)

```bash
docker exec -it agriflow-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P AgriFlow2024! -C -Q "CREATE DATABASE AgriFlowDB;"

docker exec -it agriflow-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P AgriFlow2024! -d AgriFlowDB -C -Q "CREATE SCHEMA ref; CREATE SCHEMA master; CREATE SCHEMA trans; CREATE SCHEMA evt;"
```

## Step 3: Run Prisma Migrations

Generate Prisma client and create tables:

```bash
npm run prisma:generate
npm run prisma:migrate
```

When prompted for migration name, enter: `init`

## Step 4: Seed Initial Data

Populate the database with initial roles, fertilizer types, and a test government user:

```bash
npx tsx prisma/seed.ts
```

This will create:
- 3 Roles (PEMERINTAH, DISTRIBUTOR, PENGECER)
- 6 Fertilizer types (Urea, NPK, ZA, Organik, SP-36, KCl)
- Sample postal codes
- Government test user:
  - Email: `government@agriflow.com`
  - Password: `password123`

## Step 5: Start Development Server

```bash
npm run dev
```

The server will start on http://localhost:3000

## Step 6: Test the API

### Access Swagger Documentation

Open your browser and go to:
```
http://localhost:3000/api-docs
```

### Test Health Endpoint

```bash
curl http://localhost:3000/health
```

### Test Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"government@agriflow.com\",\"password\":\"password123\"}"
```

## Troubleshooting

### SQL Server Connection Issues

If you get connection errors:

1. Check if SQL Server is running:
```bash
docker ps
```

2. Check SQL Server logs:
```bash
docker logs agriflow-sqlserver
```

3. Wait 30-60 seconds after starting Docker Compose for SQL Server to fully initialize

### Redis Connection Issues

Check if Redis is running:
```bash
docker ps
docker logs agriflow-redis
```

### Prisma Migration Issues

If migrations fail:

1. Ensure schemas are created in SQL Server
2. Check DATABASE_URL in `.env` file
3. Try resetting the database:
```bash
docker-compose down -v
docker-compose up -d
# Wait 30 seconds, then repeat Step 2 and Step 3
```

## Testing User Registration Flow

### 1. Register a Distributor

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -F "fullname=John Distributor" \
  -F "email=distributor@test.com" \
  -F "password=password123" \
  -F "role=DISTRIBUTOR" \
  -F "proof=@/path/to/image.jpg"
```

### 2. Login as Government

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"government@agriflow.com\",\"password\":\"password123\"}"
```

Copy the `accessToken` from the response.

### 3. Get Pending Users

```bash
curl http://localhost:3000/api/auth/pending \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Approve User

```bash
curl -X PATCH http://localhost:3000/api/auth/approve/USER_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Login as Approved User

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"distributor@test.com\",\"password\":\"password123\"}"
```

## Next Steps

- Explore the API documentation at http://localhost:3000/api-docs
- Test stock management endpoints
- Test shipment creation and receiving
- Test redemption flow

## Stopping the Services

```bash
# Stop the Node.js server
Ctrl+C

# Stop Docker services
docker-compose down

# Stop and remove volumes (WARNING: This deletes all data)
docker-compose down -v
```

## Production Deployment Notes

For production deployment:

1. Change all default passwords and secrets
2. Use proper SSL/TLS certificates
3. Configure proper CORS origins
4. Set NODE_ENV=production
5. Use a proper process manager (PM2, systemd)
6. Set up proper backup strategies for SQL Server
7. Configure Redis persistence
8. Set up monitoring and alerting
9. Review and harden security settings
10. Use environment-specific configuration files

## Support

For issues or questions, refer to:
- README.md for project overview
- claude.md for detailed specifications
- Swagger docs at /api-docs for API reference
