import { readFileSync } from "node:fs"
import { prisma } from "../lib/prisma"

interface ServerReference { exportedName: string }
const baseUrl = process.env.QA_BASE_URL || "http://localhost:3000"
const origin = process.env.QA_ORIGIN || baseUrl
const manifestPath = process.env.QA_SERVER_REFERENCE_MANIFEST || ".next/server/server-reference-manifest.json"
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { node: Record<string, ServerReference> }

function actionId(name: string) {
    const id = Object.entries(manifest.node).find(([, action]) => action.exportedName === name)?.[0]
    if (!id) throw new Error(`${name} server action not found`)
    return id
}

async function callStatus(orderId: string, status: string, cookie: string, shipment?: object) {
    const response = await fetch(`${baseUrl}/dashboard/orders`, {
        method: "POST",
        headers: {
            accept: "text/x-component",
            "next-action": actionId("updateOrderStatus"),
            "content-type": "text/plain;charset=UTF-8",
            origin,
            cookie,
            "x-real-ip": "198.51.100.177",
        },
        body: JSON.stringify(shipment ? [orderId, status, shipment] : [orderId, status]),
    })
    return { status: response.status, body: await response.text() }
}

async function main() {
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const email = `qa-shipment-${stamp}@hybrid.test`
    const signUp = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "content-type": "application/json", origin, "x-real-ip": "198.51.100.177" },
        body: JSON.stringify({ name: "QA Shipment Admin", email, password: `QaShipment!${stamp}`, policyAccepted: true }),
    })
    const account = await signUp.json()
    const userId = account.user?.id as string
    const cookie = signUp.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ")
    if (!userId || !cookie) throw new Error("Unable to create shipment QA account")

    let orderId = ""
    try {
        await prisma.user.update({ where: { id: userId }, data: { role: "ADMIN" } })
        const order = await prisma.order.create({
            data: {
                userId,
                status: "confirmed",
                paymentStatus: "verified",
                totalAmount: 100,
                shippingName: "QA Shipment Customer",
                shippingPhone: "0812345678",
                shippingAddress: "QA shipping address",
            },
        })
        orderId = order.id

        const missing = await callStatus(orderId, "shipped", cookie)
        const afterMissing = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
        const shipped = await callStatus(orderId, "shipped", cookie, {
            shippingCarrier: "Flash Express",
            trackingNumber: "qa-track-12345",
        })
        const afterShipped = await prisma.order.findUniqueOrThrow({ where: { id: orderId } })
        const customerPage = await fetch(`${baseUrl}/orders/${orderId}`, { headers: { cookie } })
        const customerHtml = await customerPage.text()

        const checks = {
            missingDataRejected: missing.status === 200 && missing.body.includes("success\":false") && afterMissing.status === "confirmed",
            shipmentPersisted: shipped.status === 200 && shipped.body.includes("success\":true") && afterShipped.status === "shipped" && afterShipped.shippingCarrier === "Flash Express" && afterShipped.trackingNumber === "QA-TRACK-12345" && Boolean(afterShipped.shippedAt),
            customerPageUpdated: customerPage.ok && customerHtml.includes("Flash Express") && customerHtml.includes("QA-TRACK-12345"),
        }
        console.log(JSON.stringify(checks, null, 2))
        if (Object.values(checks).some((value) => !value)) throw new Error("Shipment QA assertions failed")
    } finally {
        if (orderId) {
            await prisma.auditLog.deleteMany({ where: { entityId: orderId } }).catch(() => undefined)
            await prisma.order.delete({ where: { id: orderId } }).catch(() => undefined)
        }
        await prisma.user.deleteMany({ where: { id: userId } })
        await prisma.$disconnect()
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
