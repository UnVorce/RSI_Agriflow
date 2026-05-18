# AgriFlow Backend

Backend API for the AgriFlow fertilizer subsidy distribution system.

## Stack

- Node.js
- TypeScript
- Express.js
- Prisma ORM
- SQL Server
- Redis
- JWT + bcrypt
- Zod
- Swagger/OpenAPI
- Vitest

## Project Structure

```text
prisma/
  migrations/
  schema.prisma
  seed.ts
  setup-schemas.sql
src/
  common/
  config/
  modules/
  utils/
  app.ts
  server.ts
tests/
```

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env
```

3. Start infrastructure:

```bash
docker-compose up -d
```

4. Create the database:

```bash
docker exec -it agriflow-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P AgriFlow2024! -C -Q "IF DB_ID('AgriFlowDB') IS NULL CREATE DATABASE AgriFlowDB;"
```

If you prefer, run the SQL inside `prisma/setup-schemas.sql` manually from SSMS.

5. Generate Prisma client and apply migrations:

```bash
npm run prisma:generate
npm run prisma:deploy
```

6. Seed initial data:

```bash
npm run prisma:seed
```

7. Start the backend:

```bash
npm run dev
```

## Available Scripts

```bash
npm run dev
npm run build
npm test
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:seed
npm run prisma:studio
```

## Main Endpoints

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/dashboard`
- `GET /api/monitoring`
- `GET /api/notifications`

Swagger is available at `http://localhost:3000/api-docs`.

## Notes

- The database uses four SQL Server schemas: `ref`, `master`, `trans`, and `evt`.
- Prisma migrations create those schemas and tables automatically after the database exists.
- The seed script is idempotent, so it can be re-run safely.
- Initial Prisma migration history is committed in `prisma/migrations`.

## Additional Docs

- `SETUP.md`
- `PROJECT_SUMMARY.md`
- `QUICK_REFERENCE.md`
- `API_DOCUMENTATION.md`
