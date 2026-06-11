# AgriFlow Backend 🚜

Halo! Ini adalah repository buat backend API AgriFlow, sistem untuk ngurusin distribusi subsidi pupuk biar lebih rapi dan transparan.

## 🛠️ Tech Stack yang Dipakai

Kita pakai stack standar biar gampang di-maintain:
- **Node.js + TypeScript + Express** (Classic combo!)
- **SQL Server + Prisma ORM** (Buat database kita)
- **Redis** (Opsional sih, tapi lumayan buat caching)
- **JWT Authentication** (Buat login-loginan)
- **Zod Validation** (Biar inputnya aman)

## 🚀 Cara Jalanin (Quick Setup)

Kalo mau setup cepet, ikutin langkah ini ya:

1. **Install dependencies dulu**
   ```bash
   npm install
   ```

2. **Siapin environment variables**
   Copy aja dari example:
   ```bash
   copy .env.example .env
   ```
   Trus buka `.env` dan sesuain `DATABASE_URL`-nya, contoh:
   ```env
   DATABASE_URL="sqlserver://localhost:1433;database=AgriFlowDB;integratedSecurity=true;trustServerCertificate=true"
   ```

3. **Generate Prisma Client**
   Biar TypeScript-nya nggak error pas query:
   ```bash
   npm run prisma:generate
   ```

4. **Gasss, nyalain servernya!**
   ```bash
   npm run dev
   ```
   Udah deh! Servernya jalan di `http://localhost:3000`. 
   Kalo mau liat dokumentasi API (Swagger), bisa buka `http://localhost:3000/api-docs`.

## 📜 Daftar Command Bawaan

Beberapa command yang sering dipakai:
```bash
npm run dev          # Jalanin mode development
npm run build        # Nge-build ke production (di compile ke JS)
npm start            # Jalanin hasil build production
npm test             # Buat ngejalanin testing
npm run prisma:studio # Buka GUI database buat liat/edit data langsung
```

## 🗺️ Struktur API

Pembagian route-nya kita bikin per-role biar ga pusing:
- `/api/auth/*` 👉 Buat urusan login & register
- `/api/pemerintah/*` 👉 Khusus endpoint orang dinas/pemerintah
- `/api/distributor/*` 👉 Fitur-fitur buat distributor
- `/api/pengecer/*` 👉 Fitur-fitur buat pengecer/kios

## 🗄️ Arsitektur Database

Kita bagi jadi 4 schema utama biar rapi:
- `ref`: Data referensi (role, lokasi, jenis pupuk, dll)
- `master`: Data inti (user, petani, distributor)
- `trans`: Transaksi berjalan (kiriman, penebusan, stok)
- `evt`: Event (notifikasi, log aktivitas)

## ⚡ Performance Goal

Karena datanya bakal gede (bisa >2 juta baris), kita udah optimasi pakai:
- ✅ Pagination (dibatasi max 100 data per request)
- ✅ Database indexes (biar query wus-wus)
- ✅ Redis caching (buat data yang jarang berubah)
- ✅ Connection pooling

Target utamanya: response time harus di bawah **500ms**!

## 📚 Mau Baca Lebih Lanjut?

Cek file-file ini kalo butuh info lebih detail:
- `SETUP.md` 👉 Buat guide setup yang lebih lengkap & troubleshooting
- `API_DOCUMENTATION.md` 👉 Referensi endpoint manual
- `/api-docs` 👉 Langsung test API via Swagger UI
