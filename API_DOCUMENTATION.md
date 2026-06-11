# 📖 Dokumentasi API AgriFlow

Ini daftar lengkap API untuk Backend AgriFlow. Kalo ada yang bingung atau nemu bug, langsung infoin aja ya!

## 🌍 Base URL

Semua request ngarah ke sini ya:
```
http://localhost:3000/api
```

## 🔐 Autentikasi

Hampir semua endpoint butuh token JWT. Cara pakainya, masukin token lu di header `Authorization`:

```
Authorization: Bearer <TOKEN_LU_DISINI>
```

---

## 📋 Daftar Isi

1. [Auth & Login](#-1-auth--login)
2. [Dashboard](#-2-dashboard)
3. [Manajemen Stok](#-3-manajemen-stok)
4. [Pengiriman (Shipment)](#-4-pengiriman-shipment)
5. [Penebusan (Redemption)](#-5-penebusan-redemption)
6. [Monitoring (Khusus Pemerintah)](#-6-monitoring-khusus-pemerintah)
7. [Notifikasi & Komplain](#-7-notifikasi--komplain)
8. [Landing Page (Public)](#-8-landing-page-public)

---

## 🔑 1. Auth & Login

### Register User Baru

Endpoint ini buat user (Distributor/Pengecer) daftar. Formatnya `multipart/form-data` karena ada upload bukti.

```http
POST /auth/register
```

**Body Form-Data:**
- `fullname` (string, wajib)
- `email` (string, wajib)
- `password` (string, wajib, minimal 8 karakter)
- `role` (string, wajib): Pilih antara "DISTRIBUTOR" atau "PENGECER"
- `proof` (file, wajib): Gambar JPG/PNG, ukuran max 5MB

**Contoh Response Sukses:**
```json
{
  "message": "Registrasi berhasil. Menunggu persetujuan dari Dinas.",
  "data": {
    "userId": "123-abc-uuid",
    "email": "contoh@email.com",
    "status": "Pending"
  }
}
```

### Login

Buat dapet token akses.

```http
POST /auth/login
Content-Type: application/json
```

**Body JSON:**
```json
{
  "email": "contoh@email.com",
  "password": "password123"
}
```

**Contoh Response Sukses:**
```json
{
  "message": "Mantap, login berhasil!",
  "data": {
    "accessToken": "ey...",
    "refreshToken": "ey...",
    "user": {
      "userId": "123-abc",
      "email": "contoh@email.com",
      "name": "Budi Santoso",
      "role": "DISTRIBUTOR",
      "status": "Active"
    }
  }
}
```

### Ambil Data User Pending (Khusus Pemerintah)

Daftar user yang nunggu di-approve sama dinas.

```http
GET /auth/pending
Authorization: Bearer {token}
```

### Approve User (Khusus Pemerintah)

Acc user yang baru daftar.

```http
PATCH /auth/approve/:userId
Authorization: Bearer {token}
```

### Reject User (Khusus Pemerintah)

Tolak pendaftaran user.

```http
PATCH /auth/reject/:userId
Authorization: Bearer {token}
```

---

## 📊 2. Dashboard

### Ambil Data Dashboard

Satu endpoint, tapi data yang dikeluarin beda-beda tergantung role lu apa.

```http
GET /dashboard
Authorization: Bearer {token}
```

**Kalo lu Distributor:**
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

**Kalo lu Pengecer:**
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

**Kalo lu Pemerintah:**
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

## 📦 3. Manajemen Stok

### Cek Daftar Stok

```http
GET /stock?pupukId={id}&search={query}
Authorization: Bearer {token}
```
**Parameter (opsional):**
- `pupukId`: Filter berdasarkan ID pupuk
- `search`: Cari nama pupuknya

### Tambah Stok Baru

```http
POST /stock
Authorization: Bearer {token}
Content-Type: application/json
```

**Body JSON:**
```json
{
  "pupukId": 1,
  "jumlah": 1000
}
```

### Update Stok Manual (Khusus Distributor)

```http
PATCH /stock/:userId/:pupukId
Authorization: Bearer {token}
Content-Type: application/json
```

**Body JSON:**
```json
{
  "jumlah": 1500
}
```

### Riwayat Stok

Buat ngecek keluar masuk stok.

```http
GET /stock/history?startDate={date}&endDate={date}&pupukId={id}
Authorization: Bearer {token}
```

---

## 🚚 4. Pengiriman (Shipment)

### Bikin Pengiriman Baru (Khusus Distributor)

Distributor kirim barang ke pengecer.

```http
POST /shipments
Authorization: Bearer {token}
Content-Type: application/json
```

**Body JSON:**
```json
{
  "retailerId": "id-pengecer-tujuan",
  "pupukId": 1,
  "jumlah": 500
}
```

### Riwayat Pengiriman

```http
GET /shipments/history
Authorization: Bearer {token}
```

### Terima Pengiriman (Khusus Pengecer)

Pengecer konfirmasi barang yang dikirim distributor udah sampe.

```http
POST /shipments/receive
Authorization: Bearer {token}
Content-Type: application/json
```

**Body JSON:**
```json
{
  "kirimanId": "id-kirimannya",
  "jumlahDiterima": 500
}
```

---

## 🌾 5. Penebusan (Redemption)

### Cek Validitas Petani (Khusus Pengecer)

Cek sisa kuota petani pake NIK sebelum nebus.

```http
POST /redemption/validate
Authorization: Bearer {token}
Content-Type: application/json
```

**Body JSON:**
```json
{
  "petaniId": "1234567890123456"
}
```

**Contoh Response:**
```json
{
  "message": "Data petani ditemukan",
  "data": {
    "petani": {
      "petaniId": "1234567890123456",
      "nama": "Pak Tani",
      "nomorHp": "08123456789",
      "alamat": "Desa Sukamaju",
      "sektor": "Pertanian",
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

### Proses Penebusan Pupuk (Khusus Pengecer)

Kalo validasi aman, baru gas tebus.

```http
POST /redemption
Authorization: Bearer {token}
Content-Type: application/json
```

**Body JSON:**
```json
{
  "petaniId": "1234567890123456",
  "pupukId": 1,
  "jumlah": 50
}
```

### Riwayat Penebusan (Khusus Pengecer)

```http
GET /redemption/history
Authorization: Bearer {token}
```

---

## 📈 6. Monitoring (Khusus Pemerintah)

Pemerintah bisa liat keseluruhan data lewat sini.

### Rekap Data Monitoring

```http
GET /monitoring?province={name}&dateStart={date}&dateEnd={date}&fertilizer={name}
Authorization: Bearer {token}
```

**Parameter (semua opsional):**
- `province`: Filter nama provinsi
- `dateStart`: Dari tanggal berapa (YYYY-MM-DD)
- `dateEnd`: Sampai tanggal berapa (YYYY-MM-DD)
- `fertilizer`: Nama pupuknya

### Deteksi Kejanggalan (Anomaly Detection)

Ngecek kalo ada indikasi penyelewengan.

```http
GET /monitoring/anomaly
Authorization: Bearer {token}
```

**Contoh Response:**
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
      "description": "Kiriman gak sinkron nih: Dikirim 1000, Diterima 900 doang",
      "details": {...},
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```
*Tipe anomali yang dideteksi:*
- `SHIPMENT_MISMATCH`: Jumlah dikirim vs diterima beda
- `LARGE_REDEMPTION`: Penebusan gede banget (>500kg)
- `LOW_STOCK`: Stok tipis (≤50kg)
- `LOW_QUOTA`: Kuota petani mau abis (≤10kg)

### List Provinsi
```http
GET /monitoring/provinces
Authorization: Bearer {token}
```

### Trend Distribusi
```http
GET /monitoring/trends?months={number}
Authorization: Bearer {token}
```
*Parameter:* `months` (default 12 bulan)

---

## 🔔 7. Notifikasi & Komplain

### Ambil List Notif
```http
GET /notifications?unreadOnly={boolean}
Authorization: Bearer {token}
```

### Hitung Notif Belum Dibaca
```http
GET /notifications/unread-count
Authorization: Bearer {token}
```

### Tandai Satu Notif Udah Dibaca
```http
PATCH /notifications/:notificationId/read
Authorization: Bearer {token}
```

### Tandai Semua Notif Udah Dibaca
```http
PATCH /notifications/mark-all-read
Authorization: Bearer {token}
```

### Hapus Notif
```http
DELETE /notifications/:notificationId
Authorization: Bearer {token}
```

### Kirim Komplain Baru
```http
POST /notifications/complaints
Authorization: Bearer {token}
Content-Type: application/json
```

**Body JSON:**
```json
{
  "firstName": "Budi",
  "middleName": "",
  "lastName": "Santoso",
  "email": "budi@example.com",
  "topik": "Kendala Sistem",
  "ringkasan": "Nggak bisa login dari kemaren nih min"
}
```

### Ambil Semua Komplain (Khusus Pemerintah)
```http
GET /notifications/complaints
Authorization: Bearer {token}
```

### Detail Komplain (Khusus Pemerintah)
```http
GET /notifications/complaints/:complaintId
Authorization: Bearer {token}
```

---

## 🌐 8. Landing Page (Public)

Endpoint ini gak butuh login/token. Biasa dipake buat nampilin data di halaman depan (Home).

### Statistik Global
```http
GET /landing/stats
```

### Info "Tentang Kami"
```http
GET /landing/about
```

### List Pupuk Tersedia
```http
GET /landing/fertilizers
```

---

## 🛑 Info Tambahan

### Format Response Kalo Error
Kalo ada error, response body-nya bakal selalu kayak gini (dalam Bahasa Indonesia biar gampang dimengerti):
```json
{
  "error": "Pesan errornya bakal muncul di sini"
}
```

### Daftar HTTP Status Codes yang Sering Kepake
- `200 OK`: Aman bro, berhasil!
- `201 Created`: Data baru berhasil disimpen
- `400 Bad Request`: Data yang lo kirim gak valid/kurang lengkap
- `401 Unauthorized`: Token lu salah, basi, atau lupa dimasukin
- `403 Forbidden`: Lu gak punya akses buat buka halaman ini (beda role)
- `404 Not Found`: Datanya nggak ada
- `500 Internal Server Error`: Ada error di kodingan backend/database

### Rate Limiting & Pagination
- Saat ini belum ada **rate limiting** (bebas hit). Ntar pas production mungkin bakal ditambahin.
- Saat ini semua data di-load tanpa **pagination**. Nanti kita bakal update biar query-nya lebih enteng.

### Butuh Testing Cepat?
Langsung buka aja Swagger UI di:
👉 `http://localhost:3000/api-docs`
