# 🛠️ Panduan Setup Backend AgriFlow

Buat lo yang baru gabung atau mau setup project ini di mesin baru, ikutin panduan ini pelan-pelan ya. Tenang, nggak ribet kok!

## Syarat Wajib (Prerequisites)

Sebelum mulai, pastiin di laptop lo udah ada:
- **Node.js** (minimal versi 18 ke atas)
- **SQL Server** (pastiin database engine-nya udah nyala)

---

## Langkah-langkah Setup

### 1. Install Dependencies
Pertama, kita download dulu semua package yang dibutuhin:
```bash
npm install
```

### 2. Konfigurasi Environment (`.env`)
Kita butuh file konfigurasi buat jalanin app-nya. Tinggal copy dari contoh yang ada:
```bash
copy .env.example .env
```

Terus buka file `.env` yang baru dibikin. Perhatiin bagian ini:

```env
# Koneksi Database
# Kalo pake Windows Authentication (paling gampang):
DATABASE_URL="sqlserver://localhost:1433;database=AgriFlowDB;integratedSecurity=true;trustServerCertificate=true;connection_limit=20"

# Kalo pake SQL Server Authentication (pake username sa & password):
# DATABASE_URL="sqlserver://sa:PasswordLoDisini@localhost:1433;database=AgriFlowDB;encrypt=true;trustServerCertificate=true;connection_limit=20"

# Redis (Boleh diskip kalo gak install Redis)
REDIS_HOST=localhost
REDIS_PORT=6379

# Secret buat Token JWT (bebas mau diisi apa aja kalo lagi dev)
JWT_ACCESS_SECRET=rahasia-banget-bro
JWT_REFRESH_SECRET=rahasia-banget-bro-v2

# Info Server
NODE_ENV=development
PORT=3000
```

### 3. Generate Prisma Client
Biar Prisma paham struktur database kita, jalanin command ini:
```bash
npm run prisma:generate
```

### 4. Nyalain Servernya!
Kalo semua udah siap, langsung aja kita test jalanin:
```bash
npm run dev
```

Kalo sukses, lo bakal bisa akses:
- **Base API**: `http://localhost:3000`
- **Swagger Docs (buat ngetest API)**: `http://localhost:3000/api-docs`
- **Cek Status (Health check)**: `http://localhost:3000/health`

---

## 🤕 Sering Error di Sini (Troubleshooting)

Kalo nyangkut, cek beberapa kemungkinan ini:

### 1. Gagal Konek SQL Server
- Coba cek lagi URL connection string di `.env`, pastiin typo atau ngga.
- Test koneksi ke SQL Server lewat terminal:
  ```bash
  sqlcmd -S localhost -E -Q "SELECT @@VERSION"
  ```
  Kalo error, berarti SQL Server service-nya belom jalan atau belum ke-install dengan bener.

### 2. Error Redis
Kalo lo nggak pake Redis di lokal, jangan lupa comment out bagian Redis di file `.env` biar servernya nggak nyariin:
```env
# REDIS_HOST=localhost  
# REDIS_PORT=6379
```

### 3. Error Prisma "Client is not generated"
Kalo ada error soal Prisma, biasanya cuma kurang generate aja. Tinggal jalanin lagi:
```bash
npm run prisma:generate
```

---

## 🚀 Catatan Pas Naik ke Production

Kalo app ini mau di-deploy beneran, jangan lupa lakuin ini:
1. **Ganti semua secret** di `.env` pake password yang panjang dan aman.
2. Pastiin `NODE_ENV=production`.
3. Pasang SSL/TLS (HTTPS) biar aman.
4. Setting CORS cuma buat domain frontend kita doang.
5. Pake process manager kayak **PM2** biar kalo app-nya crash bisa otomatis restart.
6. Pantau (monitoring) log servernya berkala.
