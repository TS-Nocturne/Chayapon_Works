import { readFileSync } from "node:fs"
import { createCipheriv, createHash, randomBytes } from "node:crypto"
import { prisma } from "../lib/prisma"

interface ServerReference { exportedName: string }
const manifestPath = process.env.QA_SERVER_REFERENCE_MANIFEST || ".next/server/server-reference-manifest.json"
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { node: Record<string, ServerReference> }
const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000"
const origin = process.env.QA_ORIGIN || baseUrl

function encryptQaSetting(value: string) {
    const secret = process.env.STORE_SETTINGS_ENCRYPTION_KEY || process.env.BETTER_AUTH_SECRET
    if (!secret) throw new Error("Missing settings encryption key for Operations QA")
    const iv = randomBytes(12)
    const cipher = createCipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), iv)
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
    return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".")
}

function actionId(name: string) {
    const id = Object.entries(manifest.node).find(([, action]) => action.exportedName === name)?.[0]
    if (!id) throw new Error(`${name} server action not found`)
    return id
}

async function callAction(name: string, route: string, args: unknown[], cookie = "") {
    const response = await fetch(`${baseUrl}${route}`, {
        method: "POST",
        headers: {
            accept: "text/x-component",
            "next-action": actionId(name),
            "content-type": "text/plain;charset=UTF-8",
            origin,
            "x-real-ip": "198.51.100.201",
            ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify(args),
    })
    return { response, body: await response.text() }
}

async function signUp(name: string, prefix: string) {
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "content-type": "application/json", origin, "x-real-ip": "198.51.100.201" },
        body: JSON.stringify({ name, email: `${prefix}-${stamp}@hybrid.test`, password: `QaSafe!${stamp}`, policyAccepted: true }),
    })
    const body = await response.json()
    const cookie = response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ")
    const sessionResponse = await fetch(`${baseUrl}/api/auth/get-session`, { headers: { cookie, origin } })
    const sessionBody = await sessionResponse.text()
    if (!sessionBody.includes(body.user?.id || "__missing_user__")) {
        throw new Error(`QA session cookie was not accepted: ${sessionResponse.status} ${sessionBody.slice(0, 500)}`)
    }
    return {
        id: body.user?.id as string,
        cookie,
    }
}

async function main() {
    const admin = await signUp("QA Operations Admin", "qa-ops-admin")
    const target = await signUp("QA Role Target", "qa-role-target")
    if (!admin.id || !admin.cookie || !target.id) throw new Error("Unable to create QA users")
    await prisma.user.update({ where: { id: admin.id }, data: { role: "ADMIN" } })

    const part = await prisma.product.findFirst({ where: { productType: "part", status: "active", part: { stock: { gte: 1 } } }, include: { part: true } })
    const vehicle = await prisma.product.findFirst({ where: { productType: "vehicle", status: "active" } })
    if (!part?.part || !vehicle) throw new Error("QA catalog data unavailable")

    const stockBefore = part.part.stock
    const guestEmail = `qa-ops-order-${Date.now()}@hybrid.test`
    const phone = `08${String(Date.now()).slice(-8)}`
    const originalSettings = await prisma.storeSettings.findUnique({ where: { id: "primary" } })
    let orderId = ""
    let leadId = ""

    try {
        await prisma.storeSettings.upsert({
            where: { id: "primary" },
            create: { id: "primary", promptPayIdEncrypted: encryptQaSetting("0812345678"), promptPayAccountName: "QA Payment" },
            update: { promptPayIdEncrypted: encryptQaSetting("0812345678"), promptPayAccountName: "QA Payment" },
        })

        const roleAction = await callAction("changeUserRole", "/dashboard/users", [target.id, "STAFF"], admin.cookie)
        const profileAction = await callAction("updateProfile", "/profile", [{ name: "QA Operations Admin Updated", phoneNumber: "0812345678", lineId: "qa_ops", address: "QA Address" }], admin.cookie)

        const checkout = await callAction("createOrder", "/checkout", [{
            shippingName: "QA Operations",
            shippingPhone: "081-234-5678",
            shippingAddress: "88 ถนนทดสอบ",
            shippingProvince: "กรุงเทพมหานคร",
            shippingDistrict: "วัฒนา",
            shippingSubdistrict: "คลองตันเหนือ",
            shippingPostalCode: "10110",
            guestEmail,
            paymentMethod: "promptpay",
            paymentSlip: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
            note: "QA operations",
            items: [{ productId: part.id, quantity: 1 }],
        }])
        const order = await prisma.order.findFirst({ where: { guestEmail } })
        orderId = order?.id ?? ""
        if (!orderId) throw new Error(`QA order was not created (${admin.cookie.split("=")[0]}): ${checkout.response.status} ${checkout.body.slice(0, 1000)}`)

        const paymentAction = await callAction("updatePaymentStatus", "/dashboard/orders", [orderId, "verified"], admin.cookie)
        const slipResponse = await fetch(`${baseUrl}/api/orders/${orderId}/payment-slip`, { headers: { cookie: admin.cookie } })
        const confirmAction = await callAction("updateOrderStatus", "/dashboard/orders", [orderId, "confirmed"], admin.cookie)
        const missingShipmentAction = await callAction("updateOrderStatus", "/dashboard/orders", [orderId, "shipped"], admin.cookie)
        const afterMissingShipment = await prisma.order.findUnique({ where: { id: orderId } })
        const shipmentAction = await callAction("updateOrderStatus", "/dashboard/orders", [orderId, "shipped", {
            shippingCarrier: "Flash Express",
            trackingNumber: "QA-TRACK-12345",
        }], admin.cookie)
        const customerOrderResponse = await fetch(`${baseUrl}/orders/${orderId}`, { headers: { cookie: admin.cookie } })
        const customerOrderHtml = await customerOrderResponse.text()
        const cancelAction = await callAction("updateOrderStatus", "/dashboard/orders", [orderId, "cancelled"], admin.cookie)

        const leadCreate = await callAction("submitContactLead", `/vehicles/${vehicle.id}`, [{ productId: vehicle.id, name: "QA Operations Lead", phone, preferredDate: "2026-08-21" }])
        const lead = await prisma.contactLead.findFirst({ where: { productId: vehicle.id, phone } })
        leadId = lead?.id ?? ""
        if (!leadId) throw new Error("QA lead was not created")
        const leadUpdate = await callAction("updateLeadStatus", "/dashboard/leads", [leadId, "contacted"], admin.cookie)

        const [targetAfter, adminAfter, orderAfter, leadAfter, partAfter] = await Promise.all([
            prisma.user.findUnique({ where: { id: target.id } }),
            prisma.user.findUnique({ where: { id: admin.id } }),
            prisma.order.findUnique({ where: { id: orderId } }),
            prisma.contactLead.findUnique({ where: { id: leadId } }),
            prisma.part.findUnique({ where: { productId: part.id } }),
        ])

        const statuses = [roleAction, profileAction, checkout, paymentAction, confirmAction, missingShipmentAction, shipmentAction, cancelAction, leadCreate, leadUpdate].map((action) => action.response.status)
        const result = {
            actionStatuses: statuses,
            roleChanged: targetAfter?.role === "STAFF",
            profileUpdated: adminAfter?.name === "QA Operations Admin Updated" && adminAfter.phoneNumber === "0812345678",
            orderCancelled: orderAfter?.status === "cancelled",
            paymentVerified: orderAfter?.paymentStatus === "verified",
            missingShipmentRejected: afterMissingShipment?.status === "confirmed" && missingShipmentAction.body.includes("error"),
            shipmentSaved: orderAfter?.shippingCarrier === "Flash Express" && orderAfter.trackingNumber === "QA-TRACK-12345" && Boolean(orderAfter.shippedAt),
            shipmentRenderedForCustomer: customerOrderResponse.ok && customerOrderHtml.includes("Flash Express") && customerOrderHtml.includes("QA-TRACK-12345"),
            protectedSlipRendered: slipResponse.ok && slipResponse.headers.get("content-type") === "image/png",
            stockRestored: partAfter?.stock === stockBefore,
            leadUpdated: leadAfter?.status === "contacted",
        }
        console.log(JSON.stringify(result))
        if (statuses.some((status) => status >= 400) || Object.entries(result).some(([key, passed]) => key !== "actionStatuses" && !passed)) {
            throw new Error("Operations QA assertions failed")
        }
    } finally {
        await prisma.auditLog.deleteMany({ where: { OR: [{ userId: admin.id }, ...(orderId ? [{ entityId: orderId }] : []), { entityId: target.id }] } }).catch(() => undefined)
        if (leadId) await prisma.contactLead.delete({ where: { id: leadId } }).catch(() => undefined)
        if (orderId) {
            const order = await prisma.order.findUnique({ where: { id: orderId } })
            if (order && order.status !== "cancelled") await prisma.part.update({ where: { productId: part.id }, data: { stock: { increment: 1 } } })
            await prisma.order.delete({ where: { id: orderId } }).catch(() => undefined)
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
        await prisma.user.deleteMany({ where: { id: { in: [admin.id, target.id] } } })
        console.log(JSON.stringify({ cleanup: "QA operations data removed" }))
        await prisma.$disconnect()
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
