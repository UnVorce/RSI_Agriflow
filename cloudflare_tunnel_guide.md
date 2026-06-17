# Panduan Deployment: Database & Backend Lokal + Vercel (Menggunakan Cloudflare Tunnels)

Pilihan yang sangat bijak! Dengan "Jalan 1", data SQL Server Anda tetap aman berada di komputer/server kantor (tanpa perlu diekspos ke internet), namun aplikasi Frontend Anda tetap bisa diakses dari mana saja secara online melalui Vercel.

Berikut adalah panduan teknis langkah demi langkahnya:

---

## Konsep Arsitektur
1. **Komputer Kantor (Lokal):** Menjalankan SQL Server (Port 1433) dan Backend Node.js (misal Port 3001).
2. **Cloudflare Tunnel (`cloudflared`):** Di-install di komputer kantor. Tugasnya adalah membuat "terowongan rahasia" yang aman dari komputer Anda langsung ke jaringan global Cloudflare.
3. **Vercel (Frontend):** Menjalankan Next.js dan mengambil data melalui URL Cloudflare Tunnel.

---

## TAHAP 1: Menyiapkan Backend Lokal

1. **Pastikan Database Berjalan:** Pastikan SQL Server sudah berjalan normal di komputer Anda. (Bisa dicek melalui SQL Server Management Studio).
2. **Konfigurasi Environment Backend:** Buka file `.env` di folder `backend/` Anda. Pastikan port dan URL database sudah dikonfigurasi dengan benar, contoh:
   ```env
   PORT=3001
   DATABASE_URL="sqlserver://localhost:1433;database=AgriflowDB;integratedSecurity=true;trustServerCertificate=true;"
   ```
3. **Jalankan Backend:** Jalankan backend Node.js/Express Anda (misalnya dengan `npm run start` atau `npm run dev`). Pastikan aplikasi menyala tanpa *error* di `http://localhost:3002`.
4. **PENTING (Update CORS):** Ubah konfigurasi CORS (di `main.ts` atau `app.ts`) agar backend mau menerima *request* dari Vercel. Jika tidak, browser akan memblokirnya:
   ```typescript
   app.use(cors({
     // Ganti domain vercel ini dengan URL Frontend asli Anda nanti
     origin: ['http://localhost:3000', 'https://agriflow.vercel.app'], 
     credentials: true
   }));
   ```

---

## TAHAP 2: Membuat Cloudflare Tunnel (Aman & Gratis)

Langkah ini akan membuatkan URL publik (HTTPS) yang terhubung langsung ke `localhost:3001` Anda, **tanpa perlu setting Port Forwarding atau IP Publik**.

1. Buat akun di [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) (Gratis).
2. Di sidebar kiri, masuk ke menu **Networks** -> **Tunnels**.
3. Klik tombol **Create a tunnel**.
4. Pilih **Cloudflared** lalu beri nama tunnel Anda (misalnya: `agriflow-api-lokal`), lalu klik Save.
5. Anda akan masuk ke halaman **Install and run a connector**.
   * Pilih sistem operasi komputer kantor Anda (Windows).
   * Anda akan diberikan *command* (perintah terminal) untuk di-copy.
   * Buka **Command Prompt (CMD) atau PowerShell** di komputer Anda (Wajib **Run as Administrator**), lalu *paste* perintah tersebut. Perintah ini akan mengunduh dan memasang `cloudflared` sebagai Windows Service.
   * **Info Penting:** Karena berjalan sebagai *Service*, Tunnel ini akan **otomatis menyala sendiri** (Auto-start) setiap kali komputer di-restart atau dihidupkan, meskipun Anda belum login ke Windows.
   * Tunggu sampai status konektor di *dashboard* Cloudflare berubah menjadi **Connected**.
6. Klik **Next**. Di halaman *Route Traffic*:
   * **Public Hostname**: Isi dengan domain/subdomain Anda (misal `api.agriflow.id` atau biarkan Cloudflare memberikan domain default).
   * **Service Type**: Pilih `HTTP`.
   * **URL**: Isi dengan `localhost:3002` (Port backend Express Anda).
7. Klik **Save tunnel**.

Sekarang, coba buka URL Publik dari Cloudflare Tunnel tersebut di HP/browser lain. Voila! API lokal Anda sudah bisa diakses secara global dengan HTTPS yang aman.

---

## TAHAP 3: Deployment Frontend ke Vercel

1. Buka kode Frontend Anda (Next.js).
2. Pastikan semua *fetch/axios call* mengambil *Base URL* dari Environment Variable, bukan di-*hardcode*.
3. Push kode Frontend ke **GitHub**.
4. Login ke [Vercel](https://vercel.com) dan buat Project baru (Import dari GitHub).
5. Masuk ke bagian **Environment Variables** sebelum menekan tombol Deploy.
   * Masukkan **Key**: `NEXT_PUBLIC_API_URL` (atau variabel apapun yang Anda gunakan di aplikasi).
   * Masukkan **Value**: URL Publik dari Cloudflare Tunnel Anda (misal: `https://api.agriflow.id`).
6. Klik **Deploy**!

---

### Kesimpulan
Dengan arsitektur ini:
- Jika komputer kantor Anda dimatikan/mati lampu, web Frontend (Vercel) tetap bisa diakses *user*, namun request ke API akan gagal/timeout.
- Begitu komputer kantor menyala kembali, Windows Service Cloudflare Tunnel akan otomatis *reconnect*, dan aplikasi langsung berfungsi normal kembali tanpa sentuhan apa-apa.
- Tidak ada *Port Forwarding* di router, dan tidak ada orang luar yang bisa mengakses server database Anda. Semuanya melewati *tunnel* yang aman.

---

## TAHAP 4: Troubleshooting (Penyelesaian Masalah Umum)

1. **Frontend (Vercel) menampilkan pesan "Network Error" atau gagal memuat data:**
   - **Cek Komputer Kantor:** Pastikan komputer hidup dan terhubung ke internet.
   - **Cek Backend Lokal:** Pastikan program backend (Node.js/NestJS) sudah dijalankan. (Tunnel hanya menyambungkan jaringan, Anda tetap harus merunning backend-nya).
   - **Cek Dashboard Cloudflare:** Periksa di menu *Networks > Tunnels*, pastikan statusnya **Connected** (hijau), bukan **Down** (merah).
   - **Cek CORS:** Buka aplikasi Anda di browser, klik kanan -> *Inspect* -> masuk ke *Console* atau *Network*. Jika ada peringatan berwarna merah tentang *CORS policy*, pastikan URL Vercel sudah ditambahkan ke daftar `origin` di file backend Anda (lihat Tahap 1 Langkah 4).

2. **Status Tunnel Cloudflare menjadi "Down":**
   - Buka aplikasi **Services** di komputer Windows lokal (`services.msc`).
   - Cari *service* bernama `Cloudflared agent` atau sejenisnya.
   - Klik kanan, lalu pilih **Restart** atau **Start**.
   - Cek kembali koneksi internet komputer tersebut.
