// Prisma Client Singleton (Day 2 Pattern — Prisma v7 Driver Adapter)
// ใช้ PrismaPg adapter เชื่อมต่อ Neon PostgreSQL
// Singleton pattern ป้องกันการสร้าง PrismaClient หลายตัวใน development (hot reload)

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/app/generated/prisma/client"

const connectionString = `${process.env.DATABASE_URL}`

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

const adapter = new PrismaPg({ connectionString })

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma
}
