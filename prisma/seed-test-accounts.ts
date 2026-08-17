import { randomUUID } from "node:crypto"
import { PrismaPg } from "@prisma/adapter-pg"
import { hashPassword, verifyPassword } from "better-auth/crypto"
import { PrismaClient } from "../app/generated/prisma/client"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    throw new Error("DATABASE_URL is required")
}

if (process.env.NODE_ENV === "production" && process.env.ALLOW_TEST_ACCOUNTS !== "true") {
    throw new Error("Refusing to create test accounts in production without ALLOW_TEST_ACCOUNTS=true")
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

const testAccounts = [
    {
        name: "ผู้ดูแลระบบทดสอบ",
        email: "admin.demo@chayaponworks.example",
        password: "AdminDemo#2026",
        role: "ADMIN",
        phoneNumber: "0810000001",
    },
    {
        name: "พนักงานทดสอบ",
        email: "staff.demo@chayaponworks.example",
        password: "StaffDemo#2026",
        role: "STAFF",
        phoneNumber: "0810000002",
    },
    {
        name: "ลูกค้าทดสอบ",
        email: "customer.demo@chayaponworks.example",
        password: "CustomerDemo#2026",
        role: "USER",
        phoneNumber: "0810000003",
    },
] as const

async function upsertTestAccount(account: (typeof testAccounts)[number]) {
    const passwordHash = await hashPassword(account.password)
    const user = await prisma.user.upsert({
        where: { email: account.email },
        create: {
            id: randomUUID(),
            name: account.name,
            email: account.email,
            emailVerified: true,
            role: account.role,
            phoneNumber: account.phoneNumber,
        },
        update: {
            name: account.name,
            emailVerified: true,
            role: account.role,
            phoneNumber: account.phoneNumber,
        },
    })

    const credential = await prisma.account.findFirst({
        where: { userId: user.id, providerId: "credential" },
        select: { id: true },
    })

    if (credential) {
        await prisma.account.update({
            where: { id: credential.id },
            data: { accountId: user.id, password: passwordHash },
        })
    } else {
        await prisma.account.create({
            data: {
                id: randomUUID(),
                userId: user.id,
                accountId: user.id,
                providerId: "credential",
                password: passwordHash,
            },
        })
    }

    const savedCredential = await prisma.account.findFirstOrThrow({
        where: { userId: user.id, providerId: "credential" },
        select: { password: true },
    })
    const passwordValid = Boolean(savedCredential.password) && await verifyPassword({
        hash: savedCredential.password!,
        password: account.password,
    })

    if (!passwordValid) throw new Error(`Password verification failed for ${account.email}`)

    return { id: user.id, email: user.email, role: user.role, passwordVerified: passwordValid }
}

async function main() {
    const results = []
    for (const account of testAccounts) results.push(await upsertTestAccount(account))
    console.log(JSON.stringify({ createdOrUpdated: results }, null, 2))
}

main()
    .catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
