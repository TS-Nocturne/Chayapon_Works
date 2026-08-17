# Chayapon Works E-Commerce

แพลตฟอร์ม E-Commerce ครบวงจร — ช้อปรถมือสอง อสังหาริมทรัพย์ และอะไหล่รถยนต์ ครบ จบ ในที่เดียว

## Tech Stack

- **Next.js 16** (App Router)
- **Prisma 7** + PostgreSQL (Neon)
- **Better Auth** (Email/Password + Google OAuth)
- **Tailwind CSS 4** + shadcn/ui

## Getting Started

### 1. ติดตั้ง dependencies

```bash
pnpm install
```

### 2. ตั้งค่า Environment

```bash
cp .env.example .env
```

แก้ไขค่าใน `.env`:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret key สำหรับ auth (สุ่ม 32+ ตัวอักษร) |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | URL ของแอป (dev: `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | OAuth Client ID จาก Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret (เก็บเฉพาะฝั่ง Server) |

### ตั้งค่า Google OAuth

1. สร้าง OAuth 2.0 Client แบบ Web application ใน Google Cloud Console
2. เพิ่ม Authorized JavaScript origin เป็น `http://localhost:3000`
3. เพิ่ม Authorized redirect URI เป็น `http://localhost:3000/api/auth/callback/google`
4. กรอก `GOOGLE_CLIENT_ID` และ `GOOGLE_CLIENT_SECRET` ใน `.env`
5. Restart แอป ระบบจะแสดงและเปิดปุ่ม Google อัตโนมัติเมื่อ credentials ครบ

Production ต้องเพิ่ม origin และ callback ของโดเมนจริงอีกชุด เช่น
`https://example.com/api/auth/callback/google` และตั้ง `BETTER_AUTH_URL` ให้ตรงโดเมนจริง

Google sign-up จะสร้างบัญชีได้เฉพาะเมื่อเริ่มจากหน้าสมัครสมาชิกและผู้ใช้ติ๊ก
ยอมรับข้อกำหนด/รับทราบนโยบายแล้วเท่านั้น ส่วนหน้า sign-in ปิด implicit sign-up
เพื่อป้องกันการสร้างบัญชีโดยข้ามขั้นตอนดังกล่าว

### 3. Sync Database

```bash
pnpm exec prisma db push
pnpm exec prisma generate
```

### 4. Seed ข้อมูลตัวอย่าง

```bash
pnpm db:seed
```

จะสร้าง:
- รถยนต์, อสังหาฯ, อะไหล่ ตัวอย่าง
- Admin account: `admin@chayaponworks.com` / `Admin1234!`

### 5. รัน Dev Server

```bash
pnpm dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## Features

### สำหรับลูกค้า
- ค้นหารถยนต์ / อสังหาฯ / อะไหล่ พร้อม Filter
- หน้ารายละเอียดสินค้า + นับ View
- ติดต่อร้าน / นัดหมาย (Lead)
- ตะกร้าสินค้า + Checkout อะไหล่ (COD)
- สมัครสมาชิก / เข้าสู่ระบบ / ลืมรหัสผ่าน
- ดูประวัติคำสั่งซื้อ

### สำหรับ Admin (`/dashboard`)
- ภาพรวมสถิติ
- จัดการสินค้า (CRUD ทุกประเภท)
- จัดการคำสั่งซื้อ
- จัดการ Lead
- จัดการผู้ใช้ / เปลี่ยน Role

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | รัน development server |
| `pnpm build` | Build production |
| `pnpm qa:google-oauth` | ตรวจเงื่อนไข consent ของ Google OAuth |
| `pnpm db:seed` | Seed ข้อมูลตัวอย่าง + admin |
| `pnpm exec prisma studio` | เปิด Prisma Studio |

## Project Structure

```
app/
├── (auth)/          # Sign in, sign up, forgot password
├── vehicles/        # รถยนต์ listing + detail
├── real-estate/     # อสังหาฯ listing + detail
├── parts/           # อะไหล่ listing + detail
├── cart/            # ตะกร้าสินค้า
├── checkout/        # ชำระเงิน
├── orders/          # ประวัติคำสั่งซื้อ
├── dashboard/       # Admin panel
└── actions/         # Server actions
```
