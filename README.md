# AgriFlow

Sistem Manajemen Distribusi Subsidi Pupuk. Platform digital untuk mengelola penyaluran pupuk bersubsidi dari distributor hingga ke petani secara transparan dan terintegrasi.

## Fitur

- Manajemen stok pupuk di gudang distributor
- Pengiriman (shipment) pupuk ke pengecer
- Penebusan pupuk oleh petani
- Dashboard monitoring real-time
- Notifikasi dan analytic
- Manajemen pengguna multi-role

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, Leaflet |
| Backend | Express.js, TypeScript, Prisma ORM, PostgreSQL, Redis |
| Auth | JWT, bcrypt |
| Dokumentasi API | Swagger |

## Struktur Proyek

```
agriflow/
├── backend/          # API server
│   ├── prisma/       # Schema & migrasi database
│   ├── src/          # Source code (controllers, services, routes, middleware)
│   └── tests/        # Unit & integration tests
├── frontend/         # Next.js web application
│   ├── app/          # Halaman & layout
│   └── components/   # UI components
└── README.md
```

## Memulai

### Prasyarat

- Node.js >= 18
- PostgreSQL
- Redis

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Scripts

### Backend

| Perintah | Deskripsi |
|----------|-----------|
| `npm run dev` | Jalankan server development |
| `npm run build` | Build TypeScript |
| `npm start` | Jalankan production server |
| `npm test` | Jalankan unit test |
| `npx prisma studio` | Buka database visual editor |

### Frontend

| Perintah | Deskripsi |
|----------|-----------|
| `npm run dev` | Jalankan Next.js development |
| `npm run build` | Build untuk production |
| `npm run lint` | Lint kode |

## Role Pengguna

- **Pemerintah** — memantau distribusi dan menetapkan kebijakan
- **Distributor** — mengelola stok dan mengirim pupuk ke pengecer
- **Pengecer** — menerima kiriman dan melayani penebusan petani

---

**Kelompok 1**

| No | Nama | NIM |
|----|------|-----|
| 1 | Anindya Artanti Pambudi | L0224002 |
| 2 | Jonnathan Azarel Gunawan | L0224005 |
| 3 | Theodosius Rexy Mahardika | L0224025 |
| 4 | Viola Herfina Putri | L0224026 |
| 5 | Muhammad Darell Hylmi | L0224045 |
