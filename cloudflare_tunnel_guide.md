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

1. Pastikan SQL Server sudah berjalan normal di komputer Anda.
2. Jalankan Backend Node.js/Express Anda seperti biasa. Misalnya berjalan di `http://localhost:3001`.
3. **PENTING (Update CORS):** Ubah file konfigurasi CORS di backend Express Anda agar menerima *request* dari Vercel:
   ```typescript
   app.use(cors({
     // Nanti ganti domain vercel ini dengan URL Frontend asli Anda
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
   * Pilih sistem operasi komputer kantor Anda (Windows/Linux/Mac).
   * Anda akan diberikan *command* (perintah terminal) untuk di-copy.
   * Buka terminal/Command Prompt di komputer Anda (Run as Administrator), lalu *paste* perintah tersebut.
   * Tunggu sampai status konektor di *dashboard* Cloudflare berubah menjadi **Connected**.
6. Klik **Next**. Di halaman *Route Traffic*:
   * **Public Hostname**: Isi dengan domain/subdomain Anda (misal `api.agriflow.id` atau biarkan Cloudflare memberikan domain default).
   * **Service Type**: Pilih `HTTP`.
   * **URL**: Isi dengan `localhost:3001` (Port backend Express Anda).
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
Dengan cara ini:
- Jika komputer kantor Anda dimatikan, Frontend (Vercel) tetap bisa dibuka, namun *user* tidak akan bisa menarik/mengubah data.
- Saat komputer kantor dinyalakan lagi, Cloudflare Tunnel akan otomatis menyambung (*reconnect*), dan aplikasi akan langsung berfungsi normal kembali tanpa perlu setting ulang.
- Tidak ada orang luar yang bisa langsung mengakses SQL Server Anda. Sangat aman.
