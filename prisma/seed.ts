// Unified seed — รัน: pnpm db:seed
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client"
import { hashPassword } from "better-auth/crypto"
import { execSync } from "node:child_process"

const connectionString = process.env.DATABASE_URL!

async function seedAdmin(prisma: PrismaClient) {
    const email = process.env.ADMIN_EMAIL || "admin@chayaponworks.com"
    const password = process.env.ADMIN_PASSWORD || "Admin1234!"
    const name = "Admin"

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        if (existing.role !== "ADMIN") {
            await prisma.user.update({ where: { email }, data: { role: "ADMIN" } })
            console.log(`  ✅ Updated ${email} to ADMIN`)
        } else {
            console.log(`  ⏭️  Admin ${email} already exists`)
        }
        return
    }

    const userId = crypto.randomUUID()
    const hashed = await hashPassword(password)

    await prisma.user.create({
        data: {
            id: userId,
            name,
            email,
            emailVerified: true,
            role: "ADMIN",
            accounts: {
                create: {
                    id: crypto.randomUUID(),
                    accountId: userId,
                    providerId: "credential",
                    password: hashed,
                },
            },
        },
    })

    console.log(`  ✅ Admin created: ${email} / ${password}`)
}

async function main() {
    console.log("\n🌱 Starting unified seed...\n")

    // Run individual seed scripts
    const scripts = ["seed-vehicles.ts", "seed-realestate.ts", "seed-parts.ts"]
    for (const script of scripts) {
        console.log(`\n── Running ${script} ──`)
        execSync(`pnpm exec tsx --env-file=.env prisma/${script}`, {
            stdio: "inherit",
            cwd: process.cwd(),
        })
    }

    // Create admin user
    console.log("\n── Creating admin user ──")
    const adapter = new PrismaPg({ connectionString })
    const prisma = new PrismaClient({ adapter })
    await seedAdmin(prisma)
    await prisma.$disconnect()

    console.log("\n🎉 All seeds complete!\n")
}

main().catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
})
