# MitraAI - AI-Powered Academic Writing Assistant

MitraAI adalah platform berbasis AI yang membantu peneliti, mahasiswa, dan akademisi dalam menulis karya ilmiah, melakukan riset, dan mengedit dokumen dengan bantuan kecerdasan buatan.

## Fitur Utama

### 🔬 Mode Riset
- Bantuan pembuatan kerangka penelitian
- Analisis topik dan literatur
- Generasi pertanyaan penelitian
- Ekstraksi kata kunci

### ✍️ Mode Penulisan
- Bantuan pembuatan draft dokumen
- Struktur penulisan akademik
- Saran konten berdasarkan topik
- Export ke format Word

### ✏️ Mode Edit
- Review dan perbaikan tata bahasa
- Peningkatan kualitas tulisan
- Konsistensi gaya penulisan
- Analisis readability

### 👥 Manajemen User
- Sistem kredits untuk penggunaan AI
- Paket langganan (Basic, Pro, Enterprise)
- Dashboard admin lengkap
- Tracking penggunaan API

## Teknologi

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Neon)
- **AI**: OpenRouter API integration
- **Authentication**: Passport.js + Sessions
- **ORM**: Drizzle ORM

## Setup Development

1. Clone repository
2. Install dependencies: `npm install`
3. Setup database environment variables
4. Run development server: `npm run dev`

## Database Schema

- **users**: Data pengguna dan admin
- **user_credits**: Sistem kredit untuk AI usage
- **subscription_packages**: Paket langganan
- **user_subscriptions**: Langganan aktif user
- **chats**: Percakapan dengan AI
- **messages**: Pesan dalam chat
- **documents**: Dokumen yang dibuat/diedit
- **payments**: Riwayat pembayaran
- **llm_models**: Konfigurasi model AI
- **system_settings**: Pengaturan sistem

## Admin Dashboard

Akses `/admin` untuk:
- Manajemen user dan paket langganan
- Konfigurasi model AI dan biaya kredit
- Monitoring penggunaan dan pembayaran
- Pengaturan API keys

## Deployment

Aplikasi ini sudah dikonfigurasi untuk deployment di Replit dengan:
- Database eksternal Neon PostgreSQL
- Session management
- Production-ready environment

## Demo Users

Untuk testing, tersedia user dummy:
- researcher1@example.com
- student1@example.com  
- professor1@example.com
- writer1@example.com
- analyst1@example.com

Password default: `password123`

## License

Copyright © 2025 MitraAI. All rights reserved.