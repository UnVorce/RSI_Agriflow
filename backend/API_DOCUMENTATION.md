# AgriFlow API Documentation

Complete API reference for AgriFlow Backend.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 📋 Table of Contents

1. [Authentication](#authentication-endpoints)
2. [Dashboard](#dashboard-endpoints)
3. [Stock Management](#stock-management-endpoints)
4. [Shipment](#shipment-endpoints)
5. [Redemption](#redemption-endpoints)
6. [Monitoring](#monitoring-endpoints)
7. [Notifications](#notification-endpoints)
8. [Landing Page](#landing-page-endpoints)

---

## Authentication Endpoints

### Register User

```http
POST /auth/register
Content-Type: multipart/form-data
```

**Body:**
- `fullname` (string, required)
- `email` (string, required)
- `password` (string, required, min 8 chars)
- `role` (string, required): "DISTRIBUTOR" or "PENGECER"
- `proof` (file, required): JPG or PNG, max 5MB

**Response:**
```json
{
  "message": "Registrasi berhasil. Menunggu persetujuan.",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "status": "Pending"
  }
}
```

### Login

```http
POST /auth/login
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login berhasil",
  "data": {
    "accessToken": "jwt_token",
    "refreshToken": "jwt_refresh_token",
    "user": {
      "userId": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "DISTRIBUTOR",
      "status": "Active"
    }
  }
}
```

### Get Pending Users (Government Only)

```http
GET /auth/pending
Authorization: Bearer {token}
```

### Approve User (Government Only)

```http
PATCH /auth/approve/:userId
Authorization: Bearer {token}
```

### Reject User (Government Only)

```http
PATCH /auth/reject/:userId
Authorization: Bearer {token}
```

---

## Dashboard Endpoints

### Get Dashboard (Role-Specific)

```http
GET /dashboard
Authorization: Bearer {token}
```

Returns different data based on user role:

**Distributor Dashboard:**
```json
{
  "totalStock": 5000,
  "totalOutbound": 2000,
  "pendingShipments": 5,
  "stockByType": [...],
  "recentActivities": [...],
  "notifications": [...]
}
```

**Retailer Dashboard:**
```json
{
  "totalStock": 1000,
  "farmerCount": 150,
  "activeFarmers": 120,
  "totalRedemptions": 800,
  "pendingShipments": 2,
  "stockByType": [...],
  "recentActivities": [...],
  "notifications": [...]
}
```

**Government Dashboard:**
```json
{
  "userStats": [...],
  "pendingApprovals": 3,
  "totalDistributed": 10000,
  "totalFarmers": 500,
  "activeFarmers": 450,
  "totalShipments": 100,
  "mismatchShipments": 5,
  "distributionByType": [...],
  "recentComplaints": [...],
  "recentActivities": [...]
}
```

---

## Stock Management Endpoints

### Get Stock

```http
GET /stock?pupukId={id}&search={query}
Authorization: Bearer {token}
```

**Query Parameters:**
- `pupukId` (optional): Filter by fertilizer ID
- `search` (optional): Search fertilizer name

### Add Stock

```http
POST /stock
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "pupukId": 1,
  "jumlah": 1000
}
```

### Update Stock (Distributor Only)

```http
PATCH /stock/:userId/:pupukId
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "jumlah": 1500
}
```

### Get Stock History

```http
GET /stock/history?startDate={date}&endDate={date}&pupukId={id}
Authorization: Bearer {token}
```

---

## Shipment Endpoints

### Create Shipment (Distributor Only)

```http
POST /shipments
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "retailerId": "uuid",
  "pupukId": 1,
  "jumlah": 500
}
```

### Get Shipment History

```http
GET /shipments/history
Authorization: Bearer {token}
```

### Receive Shipment (Retailer Only)

```http
POST /shipments/receive
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "kirimanId": "uuid",
  "jumlahDiterima": 500
}
```

---

## Redemption Endpoints

### Validate Farmer (Retailer Only)

```http
POST /redemption/validate
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "petaniId": "1234567890123456"
}
```

**Response:**
```json
{
  "message": "Validasi petani berhasil",
  "data": {
    "petani": {
      "petaniId": "1234567890123456",
      "nama": "Farmer Name",
      "nomorHp": "08123456789",
      "alamat": "Full address",
      "sektor": "Agriculture",
      "luasLahan": 2.5,
      "status": "Active"
    },
    "kuota": [
      {
        "pupukId": 1,
        "jenisPupuk": "Urea",
        "sisaKuota": 100
      }
    ]
  }
}
```

### Redeem Fertilizer (Retailer Only)

```http
POST /redemption
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "petaniId": "1234567890123456",
  "pupukId": 1,
  "jumlah": 50
}
```

### Get Redemption History (Retailer Only)

```http
GET /redemption/history
Authorization: Bearer {token}
```

---

## Monitoring Endpoints

All monitoring endpoints require Government role.

### Get Monitoring Data

```http
GET /monitoring?province={name}&dateStart={date}&dateEnd={date}&fertilizer={name}
Authorization: Bearer {token}
```

**Query Parameters:**
- `province` (optional): Filter by province name
- `dateStart` (optional): Start date (YYYY-MM-DD)
- `dateEnd` (optional): End date (YYYY-MM-DD)
- `fertilizer` (optional): Filter by fertilizer name

**Response:**
```json
{
  "summary": {
    "totalAbsorbed": 10000,
    "topProvince": {
      "province": "Jawa Barat",
      "amount": 3000
    },
    "totalFarmers": 500,
    "activeFarmers": 450,
    "redemptionCount": 1000
  },
  "byProvince": [...],
  "byFertilizer": [...],
  "monthlyTrend": [...]
}
```

### Get Anomaly Detection

```http
GET /monitoring/anomaly
Authorization: Bearer {token}
```

**Response:**
```json
{
  "total": 25,
  "bySeverity": {
    "high": 5,
    "medium": 10,
    "low": 10
  },
  "anomalies": [
    {
      "type": "SHIPMENT_MISMATCH",
      "severity": "HIGH",
      "description": "Ketidaksesuaian kiriman: Dikirim 1000, Diterima 900",
      "details": {...},
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Anomaly Types:**
- `SHIPMENT_MISMATCH`: Shipment quantity mismatch
- `LARGE_REDEMPTION`: Unusually large redemption (>500kg)
- `LOW_STOCK`: Stock below threshold (≤50kg)
- `LOW_QUOTA`: Farmer quota near exhaustion (≤10kg)

### Get Provinces

```http
GET /monitoring/provinces
Authorization: Bearer {token}
```

### Get Distribution Trends

```http
GET /monitoring/trends?months={number}
Authorization: Bearer {token}
```

**Query Parameters:**
- `months` (optional, default: 12): Number of months to retrieve

---

## Notification Endpoints

### Get Notifications

```http
GET /notifications?unreadOnly={boolean}
Authorization: Bearer {token}
```

**Query Parameters:**
- `unreadOnly` (optional): If true, returns only unread notifications

### Get Unread Count

```http
GET /notifications/unread-count
Authorization: Bearer {token}
```

### Mark as Read

```http
PATCH /notifications/:notificationId/read
Authorization: Bearer {token}
```

### Mark All as Read

```http
PATCH /notifications/mark-all-read
Authorization: Bearer {token}
```

### Delete Notification

```http
DELETE /notifications/:notificationId
Authorization: Bearer {token}
```

### Submit Complaint

```http
POST /notifications/complaints
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "firstName": "John",
  "middleName": "Middle",
  "lastName": "Doe",
  "email": "john@example.com",
  "topik": "Technical Issue",
  "ringkasan": "Brief description (max 100 chars)"
}
```

### Get All Complaints (Government Only)

```http
GET /notifications/complaints
Authorization: Bearer {token}
```

### Get Complaint by ID (Government Only)

```http
GET /notifications/complaints/:complaintId
Authorization: Bearer {token}
```

---

## Landing Page Endpoints

Public endpoints (no authentication required).

### Get Statistics

```http
GET /landing/stats
```

**Response:**
```json
{
  "totalFarmers": 500,
  "distributedTon": 10.5,
  "fertilizerCount": 6,
  "mostPopularFertilizer": "Urea",
  "activeDistributors": 10,
  "activeRetailers": 50,
  "totalShipments": 100,
  "topProvinces": [...]
}
```

### Get About Information

```http
GET /landing/about
```

**Response:**
```json
{
  "name": "AgriFlow",
  "description": "...",
  "version": "1.0.0",
  "features": [...],
  "roles": [...],
  "contact": {...}
}
```

### Get Fertilizers

```http
GET /landing/fertilizers
```

**Response:**
```json
[
  {
    "pupukId": 1,
    "jenisPupuk": "Urea",
    "totalDistributed": 5000,
    "availableStock": 2000,
    "redemptionCount": 500
  }
]
```

---

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "error": "Error message in Bahasa Indonesia"
}
```

### Common HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Rate Limiting

Currently no rate limiting is implemented. Consider implementing rate limiting for production.

---

## Pagination

Currently no pagination is implemented. Large datasets return all results. Consider implementing pagination for production.

---

## Swagger Documentation

Interactive API documentation is available at:

```
http://localhost:3000/api-docs
```

---

## Postman Collection

You can import the API into Postman using the Swagger/OpenAPI specification at:

```
http://localhost:3000/api-docs/swagger.json
```

---

## Support

For issues or questions:
- Check the Swagger documentation
- Review error messages (in Bahasa Indonesia)
- Check application logs in `logs/` directory
