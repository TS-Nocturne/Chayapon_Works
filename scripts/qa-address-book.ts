import { readFileSync } from "node:fs"
import { prisma } from "../lib/prisma"

interface ServerReference { exportedName: string }
const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as { node: Record<string, ServerReference> }

function actionId(name: string) {
    const id = Object.entries(manifest.node).find(([, action]) => action.exportedName === name)?.[0]
    if (!id) throw new Error(`${name} server action not found`)
    return id
}

async function callAction(name: string, args: unknown[], cookie = "") {
    const response = await fetch("http://localhost:3000/checkout", {
        method: "POST",
        headers: {
            accept: "text/x-component",
            "next-action": actionId(name),
            "content-type": "text/plain;charset=UTF-8",
            origin: "http://localhost:3000",
            "x-real-ip": `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
            ...(cookie ? { cookie } : {}),
        },
        body: JSON.stringify(args),
    })
    return { status: response.status, body: await response.text() }
}

async function signUp() {
    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const response = await fetch("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost:3000", "x-real-ip": "198.51.100.88" },
        body: JSON.stringify({ name: "QA Address Customer", email: `qa-address-${stamp}@hybrid.test`, password: `QaAddress!${stamp}`, policyAccepted: true }),
    })
    const body = await response.json()
    return { id: body.user?.id as string, cookie: response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ") }
}

async function main() {
    const user = await signUp()
    if (!user.id || !user.cookie) throw new Error("Unable to create address QA user")

    try {
        const input = {
            label: "บ้าน QA",
            recipientName: "ผู้รับทดสอบที่อยู่",
            phone: "081-234-5678",
            details: "55 หมู่ 5",
            province: "กาญจนบุรี",
            district: "ทองผาภูมิ",
            subdistrict: "ปิล๊อก",
            postalCode: "71180",
            isDefault: true,
        }

        const unauthorized = await callAction("saveUserAddress", [input])
        const savedResponse = await callAction("saveUserAddress", [input], user.cookie)
        const saved = await prisma.userAddress.findFirst({ where: { userId: user.id } })
        const checkout = await fetch("http://localhost:3000/checkout", { headers: { cookie: user.cookie } })
        const checkoutHtml = await checkout.text()

        const updatedResponse = saved
            ? await callAction("saveUserAddress", [{ ...input, id: saved.id, label: "บ้านที่บันทึกแล้ว", details: "99 หมู่ 9" }], user.cookie)
            : { status: 0, body: "" }
        const updated = saved ? await prisma.userAddress.findUnique({ where: { id: saved.id } }) : null

        const deleteResponse = saved ? await callAction("deleteUserAddress", [saved.id], user.cookie) : { status: 0, body: "" }
        const remaining = await prisma.userAddress.count({ where: { userId: user.id } })

        const checks = {
            unauthorizedRejected: unauthorized.body.includes("กรุณาเข้าสู่ระบบ"),
            saveActionSucceeded: savedResponse.status === 200 && savedResponse.body.includes("success"),
            persistedForUser: saved?.recipientName === input.recipientName && saved.isDefault,
            renderedOnNextCheckout: checkout.ok && checkoutHtml.includes(input.recipientName) && checkoutHtml.includes("55 หมู่ 5"),
            updatePersisted: updatedResponse.status === 200 && updated?.label === "บ้านที่บันทึกแล้ว" && updated.details === "99 หมู่ 9",
            deleteSucceeded: deleteResponse.status === 200 && remaining === 0,
        }

        console.log(JSON.stringify({ statuses: { unauthorized: unauthorized.status, save: savedResponse.status, checkout: checkout.status, update: updatedResponse.status, delete: deleteResponse.status }, checks }, null, 2))
        if (Object.values(checks).some((passed) => !passed)) throw new Error("Address book QA failed")
    } finally {
        await prisma.user.deleteMany({ where: { id: user.id } })
        await prisma.$disconnect()
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
