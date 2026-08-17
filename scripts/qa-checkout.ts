import { readFileSync } from "node:fs"
import { createCipheriv, createHash, randomBytes } from "node:crypto"
import { prisma } from "../lib/prisma"

interface ServerReference {
    exportedName: string
}

async function signUpCheckoutUser() {
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const response = await fetch("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000", "x-real-ip": "198.51.100.71" },
        body: JSON.stringify({ name: "QA Checkout Member", email: `qa-checkout-${stamp}@hybrid.test`, password: `QaCheckout!${stamp}`, policyAccepted: true }),
    })
    const body = await response.json()
    return { id: body.user?.id as string, cookie: response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ") }
}

function encryptQaSetting(value: string) {
    const secret = process.env.STORE_SETTINGS_ENCRYPTION_KEY || process.env.BETTER_AUTH_SECRET
    if (!secret) throw new Error("Missing settings encryption key for Checkout QA")
    const iv = randomBytes(12)
    const cipher = createCipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), iv)
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
    return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".")
}

async function main() {
    const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as {
        node: Record<string, ServerReference>
    }
    const actionId = Object.entries(manifest.node).find(([, action]) => action.exportedName === "createOrder")?.[0]
    if (!actionId) throw new Error("createOrder server action not found in production build")

    const product = await prisma.product.findFirst({
        where: { productType: "part", status: "active", part: { stock: { gte: 1 } } },
        include: { part: true },
    })
    if (!product?.part) throw new Error("No active part with stock available for checkout QA")

    const qaUser = await signUpCheckoutUser()
    if (!qaUser.id || !qaUser.cookie) throw new Error("Unable to create checkout QA member")
    const stockBefore = product.part.stock
    const originalSettings = await prisma.storeSettings.findUnique({ where: { id: "primary" } })
    let orderId = ""

    try {
        await prisma.storeSettings.upsert({
            where: { id: "primary" },
            create: { id: "primary", promptPayIdEncrypted: encryptQaSetting("0812345678"), promptPayAccountName: "QA Payment" },
            update: { promptPayIdEncrypted: encryptQaSetting("0812345678"), promptPayAccountName: "QA Payment" },
        })

        const data = {
            shippingName: "QA Checkout",
            shippingPhone: "081-234-5678",
            // Regression: structured province fields make this concise detail complete.
            shippingAddress: "55 หมู่ 5",
            shippingProvince: "กรุงเทพมหานคร",
            shippingDistrict: "วัฒนา",
            shippingSubdistrict: "คลองตันเหนือ",
            shippingPostalCode: "10110",
            paymentMethod: "promptpay",
            paymentSlip: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
            note: "Automated QA - remove after test",
            items: [{ productId: product.id, quantity: 1 }],
        }

        const response = await fetch("http://localhost:3000/checkout", {
            method: "POST",
            headers: {
                accept: "text/x-component",
                "next-action": actionId,
                "content-type": "text/plain;charset=UTF-8",
                origin: "http://localhost:3000",
                "x-real-ip": `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
                cookie: qaUser.cookie,
            },
            body: JSON.stringify([data]),
        })
        const responseBody = await response.text()
        const order = await prisma.order.findFirst({ where: { userId: qaUser.id }, include: { items: true } })
        orderId = order?.id ?? ""
        const partAfter = await prisma.part.findUnique({ where: { productId: product.id }, select: { stock: true } })

        const result = {
            actionStatus: response.status,
            responseHasSuccess: responseBody.includes("success"),
            orderCreated: Boolean(order),
            stockBefore,
            stockAfter: partAfter?.stock,
            totalMatches: order?.totalAmount === product.price + 100,
            paymentStatus: order?.paymentStatus,
            slipEncryptedAtRest: Boolean(order?.paymentSlip?.startsWith("v1.")),
            addressStructured: Boolean(order?.shippingAddress.includes("แขวงคลองตันเหนือ เขตวัฒนา จังหวัดกรุงเทพมหานคร 10110")),
        }
        console.log(JSON.stringify(result))

        if (!order) {
            console.error(responseBody.slice(0, 2_000))
        }

        if (!response.ok || !result.orderCreated || !result.slipEncryptedAtRest || result.stockAfter !== stockBefore - 1 || !result.totalMatches || !result.addressStructured) {
            throw new Error("Checkout QA assertions failed")
        }
    } finally {
        if (orderId) {
            await prisma.$transaction([
                prisma.order.delete({ where: { id: orderId } }),
                prisma.part.update({ where: { productId: product.id }, data: { stock: { increment: 1 } } }),
            ])
            console.log(JSON.stringify({ cleanup: "QA order removed and stock restored" }))
        }
        if (originalSettings) {
            await prisma.storeSettings.update({
                where: { id: originalSettings.id },
                data: {
                    storeName: originalSettings.storeName,
                    contactPhone: originalSettings.contactPhone,
                    lineUrl: originalSettings.lineUrl,
                    promptPayIdEncrypted: originalSettings.promptPayIdEncrypted,
                    promptPayAccountName: originalSettings.promptPayAccountName,
                    bankName: originalSettings.bankName,
                    bankAccountName: originalSettings.bankAccountName,
                    bankAccountNumberEncrypted: originalSettings.bankAccountNumberEncrypted,
                    updatedById: originalSettings.updatedById,
                },
            })
        } else {
            await prisma.storeSettings.deleteMany({ where: { id: "primary" } })
        }
        await prisma.user.deleteMany({ where: { id: qaUser.id } })
        await prisma.$disconnect()
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
