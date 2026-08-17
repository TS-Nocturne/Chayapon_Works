import { readFileSync } from "node:fs"
import { prisma } from "../lib/prisma"

interface ServerReference { exportedName: string }

const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as {
    node: Record<string, ServerReference>
}

function actionId(name: string) {
    const id = Object.entries(manifest.node).find(([, action]) => action.exportedName === name)?.[0]
    if (!id) throw new Error(`${name} server action not found`)
    return id
}

async function callAction(name: string, route: string, args: unknown[], cookie = "") {
    const response = await fetch(`http://localhost:3000${route}`, {
        method: "POST",
        headers: {
            accept: "text/x-component",
            "next-action": actionId(name),
            "content-type": "text/plain;charset=UTF-8",
            origin: "http://localhost:3000",
            ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify(args),
    })
    return { response, body: await response.text() }
}

async function main() {
    const stamp = Date.now()
    const email = `qa-settings-${stamp}@hybrid.test`
    const password = `QaSafe!${stamp}`
    const original = await prisma.storeSettings.findUnique({ where: { id: "primary" } })
    let userId = ""

    try {
        const signup = await fetch("http://localhost:3000/api/auth/sign-up/email", {
            method: "POST",
            headers: { "content-type": "application/json", origin: "http://localhost:3000", "x-real-ip": `198.51.100.${Math.floor(Math.random() * 200) + 1}` },
            body: JSON.stringify({ name: "QA Settings Admin", email, password, policyAccepted: true }),
        })
        const signupBody = await signup.json()
        userId = signupBody.user?.id ?? ""
        const cookie = signup.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ")
        if (!signup.ok || !userId || !cookie) throw new Error("Unable to create QA settings admin")
        await prisma.user.update({ where: { id: userId }, data: { role: "ADMIN" } })

        const values = {
            storeName: "QA Chayapon Works",
            contactPhone: "0812345678",
            lineUrl: "https://line.me/R/ti/p/@qa-hybrid",
            promptPayId: "0812345678",
            promptPayAccountName: "QA Payment",
            bankName: "QA Bank",
            bankAccountName: "QA Chayapon Works",
            bankAccountNumber: "1234567890",
        }
        const update = await callAction("updateStoreSettings", "/dashboard/settings", [values], cookie)
        const stored = await prisma.storeSettings.findUnique({ where: { id: "primary" } })
        const audit = await prisma.auditLog.findFirst({ where: { userId, action: "UPDATE_STORE_SETTINGS" } })
        const publicResponse = await fetch("http://localhost:3000/api/store-settings")
        const publicSettings = await publicResponse.json()
        const qr = await callAction("generatePromptPayQr", "/checkout", [7250])

        const result = {
            updateStatus: update.response.status,
            updateSucceeded: update.body.includes("success"),
            encryptedAtRest: Boolean(stored?.promptPayIdEncrypted && !stored.promptPayIdEncrypted.includes(values.promptPayId) && stored.bankAccountNumberEncrypted && !stored.bankAccountNumberEncrypted.includes(values.bankAccountNumber)),
            auditCreated: Boolean(audit),
            publicStatus: publicResponse.status,
            publicDataSafe: publicSettings.contactPhone === values.contactPhone && publicSettings.bankAccountNumberMasked?.endsWith("7890") && !("promptPayId" in publicSettings) && !("bankAccountNumber" in publicSettings),
            qrStatus: qr.response.status,
            qrGenerated: qr.body.includes("data:image/png;base64"),
        }
        console.log(JSON.stringify(result))
        if (Object.values(result).some((value) => value === false) || result.updateStatus >= 400 || result.publicStatus >= 400 || result.qrStatus >= 400) {
            throw new Error("Store settings QA assertions failed")
        }
    } finally {
        if (userId) {
            await prisma.auditLog.deleteMany({ where: { userId } })
            if (original) {
                await prisma.storeSettings.upsert({
                    where: { id: original.id },
                    create: original,
                    update: {
                        storeName: original.storeName,
                        contactPhone: original.contactPhone,
                        lineUrl: original.lineUrl,
                        promptPayIdEncrypted: original.promptPayIdEncrypted,
                        promptPayAccountName: original.promptPayAccountName,
                        bankName: original.bankName,
                        bankAccountName: original.bankAccountName,
                        bankAccountNumberEncrypted: original.bankAccountNumberEncrypted,
                        updatedById: original.updatedById,
                        updatedAt: original.updatedAt,
                    },
                })
            } else {
                await prisma.storeSettings.deleteMany({ where: { id: "primary" } })
            }
            await prisma.user.delete({ where: { id: userId } }).catch(() => undefined)
        }
        console.log(JSON.stringify({ cleanup: "Store settings, audit log and QA admin restored" }))
        await prisma.$disconnect()
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
