# SmartPOS Inventory

Aplikasi **Kasir (Point of Sale) + Manajemen Stok** berbasis web untuk UMKM, toko kelontong, minimarket, dan usaha retail. Dibangun sebagai Progressive Web App (PWA) sehingga bisa diinstall ke Home Screen tanpa perlu Play Store.

> **Live Demo:** [https://invita-sin.github.io/smart-pos-inventory](https://invita-sin.github.io/smart-pos-inventory)

---

## Fitur

| Fitur | Keterangan |
|-------|-----------|
| **Dashboard** | Total penjualan hari ini, total transaksi, grafik penjualan (line chart), produk terlaris (bar chart), notifikasi stok habis |
| **POS Kasir** | Cari produk, keranjang belanja, metode bayar (Tunai/Transfer/QRIS), hitung kembalian, cetak struk PDF |
| **Manajemen Produk** | CRUD, import/export CSV, search by nama/SKU/barcode, upload foto |
| **Kategori & Supplier** | CRUD kategori dan supplier |
| **Barang Masuk / Keluar** | Catat restok, barang rusak/hilang/expired, otomatis update stok |
| **Riwayat Transaksi** | Filter hari/minggu/bulan/tahun, detail transaksi, cetak ulang struk PDF |
| **Laporan** | Laporan penjualan (omzet, profit, count), laporan stok, barang masuk, barang keluar — export CSV & PDF |
| **Manajemen Pengguna** | CRUD pengguna dengan 3 role (Owner, Kasir, Gudang) |
| **Dark Mode** | Light / Dark / Auto (ikuti sistem) |
| **PWA** | Install ke Home Screen, offline cache, auto-update |
| **Realtime** | Perubahan stok & transaksi terlihat realtime di semua perangkat |

## Tech Stack

| Stack | Teknologi |
|-------|-----------|
| **Frontend** | Vue 3 (Composition API + `<script setup>`), Vite, Pinia, Vue Router |
| **Styling** | Tailwind CSS v4, Glassmorphism, Responsive (Mobile/Tablet/Desktop) |
| **Backend** | Supabase (Auth, PostgreSQL, Storage, Realtime) |
| **Charts** | Chart.js + vue-chartjs |
| **PDF** | html2pdf.js |
| **PWA** | vite-plugin-pwa (Workbox) |
| **CI/CD** | GitHub Actions → GitHub Pages |

## User Roles

| Role | Akses |
|------|-------|
| **Owner** | Full CRUD (produk, kategori, supplier, pengguna, stok, transaksi, laporan, pengaturan) |
| **Kasir** | POS transaksi, lihat produk, riwayat transaksi |
| **Gudang** | Barang masuk/keluar, lihat produk & dashboard |

## Akun Demo

| Role | Email | Password |
|------|-------|----------|
| Owner | `owner@smartpos.com` | `owner123` |
| Kasir | `kasir@smartpos.com` | `kasir123` |
| Gudang | `gudang@smartpos.com` | `gudang123` |

## Cara Install & Running Lokal

```bash
# Clone repo
git clone https://github.com/invita-sin/smart-pos-inventory.git
cd smart-pos-inventory

# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local
# Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY

# Jalankan dev server
npm run dev

# Build production
npm run build

# Preview build
npm run preview
```

## Environment Variables

| Variable | Deskripsi |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL Supabase project |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/publishable key dari Supabase |

Untuk deployment, set sebagai **GitHub Secrets**:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

## Database

Skema database lengkap ada di [`supabase-schema.sql`](./supabase-schema.sql) — includes tables, RPC functions, triggers, dan RLS policies.

Untuk seed data awal:
```bash
node scripts/seed.mjs
```
> Memerlukan `SUPABASE_SERVICE_ROLE_KEY` di `.env`

## Struktur Proyek

```
src/
  main.js                # Entry point + inisialisasi Pinia/Router/Auth
  router/index.js        # Routes + auth/role guards
  stores/                # 12 Pinia stores
  views/                 # 16 page-level views
  components/            # Shared components (ReceiptContent, SkeletonLoader, ToastContainer)
  composables/           # Reusable composition functions (useExport, useHealthCheck, useRealtime)
  lib/                   # Supabase client, seed data
  layouts/               # DefaultLayout (sidebar + bottom nav), AuthLayout
```

## Lisensi

MIT — see [LICENSE](LICENSE)
