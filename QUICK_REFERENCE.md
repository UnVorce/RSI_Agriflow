# AgriFlow Backend - Quick Reference

## 🚀 Quick Commands

```bash
# Development
npm run dev                    # Start dev server with hot reload
npm run build                  # Build for production
npm start                      # Start production server

# Database
npm run prisma:generate        # Generate Prisma client
npm run prisma:migrate         # Create/apply dev migrations
npm run prisma:deploy          # Apply committed migrations
npm run prisma:studio          # Open Prisma Studio GUI
npm run prisma:seed            # Seed database

# Testing
npm test                       # Run tests once
npm run test:watch             # Run tests in watch mode

# Docker
docker-compose up -d           # Start services
docker-compose down            # Stop services
docker-compose logs -f         # View logs
docker ps                      # List running containers
```

## 🔑 Default Credentials

| User | Email | Password | Role |
|------|-------|----------|------|
| Government | government@agriflow.com | password123 | PEMERINTAH |

## 🌐 URLs

| Service | URL |
|---------|-----|
| API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api-docs |
| Health Check | http://localhost:3000/health |
| SQL Server | localhost:1433 |
| Redis | localhost:6379 |

## 📊 Database Connection

```
Server: localhost,1433
Username: sa
Password: AgriFlow2024!
Database: AgriFlowDB
```

## 🗂️ Database Schemas

| Schema | Purpose | Tables |
|--------|---------|--------|
| ref | Reference data | ROLE, KODE_POS |
| master | Master data | USER, PUPUK, PETANI, KUOTA_PETANI |
| trans | Transactions | STOK, RIWAYAT_STOK, KIRIMAN_PUPUK, PENEBUSAN_PUPUK |
| evt | Events | NOTIFIKASI, BANTUAN, LOG_AKTIVITAS |

## 👥 User Roles

| Role | Code | Permissions |
|------|------|-------------|
| Government | PEMERINTAH | Approve users, monitoring, complaints |
| Distributor | DISTRIBUTOR | Stock, shipments |
| Retailer | PENGECER | Receive shipments, redemptions |

## 🔐 JWT Configuration

| Token Type | Expiry | Secret Env Var |
|------------|--------|----------------|
| Access | 8 hours | JWT_ACCESS_SECRET |
| Refresh | 30 days | JWT_REFRESH_SECRET |

## 📝 API Endpoints Cheat Sheet

### Auth
```bash
POST   /api/auth/register      # Register (multipart/form-data)
POST   /api/auth/login         # Login
POST   /api/auth/logout        # Logout (blacklist token)
POST   /api/auth/refresh       # Refresh access token
GET    /api/auth/pending       # Get pending users (Gov)
PATCH  /api/auth/approve/:id   # Approve user (Gov)
PATCH  /api/auth/reject/:id    # Reject user (Gov)
```

### Stock
```bash
GET    /api/stock              # Get stock
POST   /api/stock              # Add stock
PATCH  /api/stock/:userId/:pupukId  # Update stock (Dist)
GET    /api/stock/history      # Get history
```

### Shipment
```bash
POST   /api/shipments          # Create shipment (Dist)
GET    /api/shipments/history  # Get history
POST   /api/shipments/receive  # Receive shipment (Ret)
```

### Redemption
```bash
POST   /api/redemption/validate  # Validate farmer (Ret)
POST   /api/redemption           # Redeem fertilizer (Ret)
GET    /api/redemption/history   # Get history (Ret)
```

### Monitoring (Government Only)
```bash
GET    /api/monitoring                    # Get monitoring data
GET    /api/monitoring/anomaly            # Basic anomaly detection
GET    /api/monitoring/advanced-anomaly   # ML-based anomaly detection
GET    /api/monitoring/forecast           # Demand forecasting
GET    /api/monitoring/correlations       # Province-fertilizer correlation
GET    /api/monitoring/performance        # Performance metrics
GET    /api/monitoring/provinces          # Get provinces list
GET    /api/monitoring/trends             # Distribution trends
```

### Dashboard
```bash
GET    /api/dashboard            # Role-specific dashboard
```

### Notifications
```bash
GET    /api/notifications                 # Get notifications
GET    /api/notifications/unread-count    # Get unread count
PATCH  /api/notifications/:id/read        # Mark as read
PATCH  /api/notifications/mark-all-read   # Mark all as read
DELETE /api/notifications/:id             # Delete notification
POST   /api/notifications/complaints      # Submit complaint
GET    /api/notifications/complaints      # Get complaints (Gov)
```

## 🧪 Sample API Calls

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"government@agriflow.com","password":"password123"}'
```

### Register Distributor
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -F "fullname=John Doe" \
  -F "email=john@example.com" \
  -F "password=password123" \
  -F "role=DISTRIBUTOR" \
  -F "proof=@image.jpg"
```

### Get Stock (with auth)
```bash
curl http://localhost:3000/api/stock \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Shipment
```bash
curl -X POST http://localhost:3000/api/shipments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"retailerId":"uuid","pupukId":1,"jumlah":100}'
```

### Validate Farmer
```bash
curl -X POST http://localhost:3000/api/redemption/validate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"petaniId":"1234567890123456"}'
```

### Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

### Advanced Anomaly Detection
```bash
curl http://localhost:3000/api/monitoring/advanced-anomaly?days=30 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Demand Forecast
```bash
curl http://localhost:3000/api/monitoring/forecast?months=3 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🥬 Fertilizer Types (Seeded)

1. Urea
2. NPK
3. ZA
4. Organik
5. SP-36
6. KCl

## 📋 User Status Values

| Status | Description |
|--------|-------------|
| Pending | Awaiting government approval |
| Active | Approved and can login |
| Rejected | Registration rejected |

## 📦 Shipment Status Values

| Status | Description |
|--------|-------------|
| Dikirim | Sent by distributor |
| Diterima | Received (quantity matched) |
| Tidak Sesuai | Received (quantity mismatch) |

## 🔄 Stock Change Types

| Type | Description |
|------|-------------|
| Stok Masuk | Stock in (shipment received, manual add) |
| Stok Keluar | Stock out (shipment sent, redemption) |
| Penyesuaian | Adjustment (manual correction) |

## 🚨 Common Error Messages

| Error | Meaning |
|-------|---------|
| Token tidak ditemukan | No Authorization header |
| Token tidak valid | Invalid/expired token |
| Terlalu banyak permintaan | Rate limit exceeded |
| Email sudah terdaftar | Email already exists |
| Akun masih menunggu persetujuan | User status is Pending |
| Akun telah ditolak | User status is Rejected |
| Stok tidak mencukupi | Insufficient stock |
| Kuota petani tidak mencukupi | Farmer quota exceeded |
| ID Petani harus 16 digit | Invalid farmer ID format |
| Petani bukan milik pengecer ini | Farmer doesn't belong to retailer |

## 🎯 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| All API endpoints | 60 requests | 1 minute |
| Login | 5 attempts | 15 minutes |
| Strict endpoints | 10 requests | 1 minute |

## 🔍 Debugging Tips

### Check if services are running
```bash
docker ps
```

### View SQL Server logs
```bash
docker logs agriflow-sqlserver
```

### View Redis logs
```bash
docker logs agriflow-redis
```

### Check application logs
```bash
# In logs/ directory
cat logs/combined.log
cat logs/error.log
```

### Test Redis connection
```bash
docker exec -it agriflow-redis redis-cli
> PING
PONG
```

### Test SQL Server connection
```bash
docker exec -it agriflow-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P AgriFlow2024! -C -Q "SELECT @@VERSION"
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables |
| `prisma/schema.prisma` | Database schema |
| `src/server.ts` | Server entry point |
| `src/app.ts` | Express app setup |
| `docker-compose.yml` | Docker services |
| `package.json` | Dependencies & scripts |

## 🛠️ Environment Variables

```env
DATABASE_URL=sqlserver://localhost:1433;database=AgriFlowDB;...
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-secret
JWT_ACCESS_EXPIRY=8h
JWT_REFRESH_EXPIRY=30d
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

## 🎯 Business Rule Quick Reference

| Rule | Description |
|------|-------------|
| BR-01 | Farmer ID must be 16 digits, must belong to retailer |
| BR-02 | Stock must be sufficient for operations |
| BR-03 | Redemption cannot exceed quota |
| BR-04 | Shipment mismatch triggers notification |
| BR-05 | All operations use atomic transactions |

## 📊 Performance Targets

| Operation | Target |
|-----------|--------|
| Normal request | < 3s |
| Farmer validation | < 2s |
| Shipment | < 5s |
| Concurrent users | 10 |

## 🔒 Security Checklist

- [x] Passwords hashed with bcrypt
- [x] JWT authentication
- [x] Role-based access control
- [x] File upload validation
- [x] Input validation (Zod)
- [x] SQL injection protection (Prisma)
- [x] Token blacklisting
- [x] Audit logging
- [x] Private file storage
- [x] Rate limiting
- [x] Redis caching

## 📈 Phase 3 Features

### ML-Based Anomaly Detection
- Z-Score method (threshold: |Z| > 3)
- IQR (Interquartile Range) method
- Pattern-based detection
- Confidence scoring (0-1)

### Time Series Forecasting
- Simple Moving Average (SMA)
- Trend analysis
- 3-month forecast window
- Historical pattern analysis

### Analytics
- Province-fertilizer correlation
- Performance metrics
- Optimization recommendations
- Distribution efficiency tracking

## 📚 Documentation Files

| File | Content |
|------|---------|
| README.md | Project overview & setup |
| SETUP.md | Detailed setup instructions |
| PROJECT_SUMMARY.md | Complete project documentation |
| QUICK_REFERENCE.md | This file |
| PHASE_3_COMPLETION.md | Phase 3 completion report |
| claude.md | Original specifications |

## 🆘 Getting Help

1. Check Swagger docs: http://localhost:3000/api-docs
2. Review logs in `logs/` directory
3. Check Docker container logs
4. Review error messages (in Bahasa Indonesia)
5. Verify environment variables in `.env`

---

**Quick Tip**: Keep this file open while developing! 🚀
