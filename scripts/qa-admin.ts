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

async function callAction(name: string, route: string, args: unknown[], cookie: string) {
    const response = await fetch(`http://localhost:3000${route}`, {
        method: "POST",
        headers: {
            accept: "text/x-component",
            "next-action": actionId(name),
            "content-type": "text/plain;charset=UTF-8",
            origin: "http://localhost:3000",
            cookie,
        },
        body: JSON.stringify(args),
    })
    return { response, body: await response.text() }
}

async function main() {
    const stamp = Date.now()
    const email = `qa-admin-${stamp}@hybrid.test`
    const password = `QaSafe!${stamp}`
    const sku = `QA-${stamp}`
    let userId = ""
    let productId = ""

    try {
        const signup = await fetch("http://localhost:3000/api/auth/sign-up/email", {
            method: "POST",
            headers: { "content-type": "application/json", origin: "http://localhost:3000", "x-real-ip": `198.51.100.${Math.floor(Math.random() * 200) + 1}` },
            body: JSON.stringify({ name: "QA Admin", email, password, policyAccepted: true }),
        })
        const signupBody = await signup.json()
        userId = signupBody.user?.id ?? ""
        const cookie = signup.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ")
        if (!signup.ok || !userId || !cookie) throw new Error("Unable to create temporary QA admin")
        await prisma.user.update({ where: { id: userId }, data: { role: "ADMIN" } })

        const baseProduct = {
            productType: "part",
            title: "QA Temporary Brake Pad",
            description: "Temporary product created by automated QA",
            price: 999,
            images: ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="],
            status: "active",
            featured: false,
            sku,
            brand: "QA",
            category: "เบรก",
            compatibility: "QA Test Vehicle",
            stock: 2,
        }

        const created = await callAction("createProduct", "/dashboard/products/new", [baseProduct], cookie)
        const product = await prisma.product.findFirst({ where: { part: { sku } }, include: { part: true } })
        productId = product?.id ?? ""
        if (!created.response.ok || !productId) throw new Error("Product create action failed")

        const updated = await callAction("updateProduct", `/dashboard/products/${productId}/edit`, [productId, { ...baseProduct, title: "QA Temporary Brake Pad Updated", price: 1099, stock: 3 }], cookie)
        const toggledStatus = await callAction("toggleProductStatus", "/dashboard/products", [productId, "reserved"], cookie)
        const toggledFeatured = await callAction("toggleProductFeatured", "/dashboard/products", [productId], cookie)
        const afterUpdate = await prisma.product.findUnique({ where: { id: productId }, include: { part: true } })
        const deleted = await callAction("deleteProduct", "/dashboard/products", [productId], cookie)
        const afterDelete = await prisma.product.findUnique({ where: { id: productId } })

        const result = {
            createStatus: created.response.status,
            updateStatus: updated.response.status,
            toggleStatus: toggledStatus.response.status,
            toggleFeaturedStatus: toggledFeatured.response.status,
            deleteStatus: deleted.response.status,
            updatedCorrectly: afterUpdate?.title.endsWith("Updated") && afterUpdate.price === 1099 && afterUpdate.part?.stock === 3,
            statusCorrect: afterUpdate?.status === "reserved",
            featuredCorrect: afterUpdate?.featured === true,
            deleted: afterDelete === null,
        }
        console.log(JSON.stringify(result))
        if (Object.values(result).some((value) => value === false) || Object.values(result).some((value) => typeof value === "number" && value >= 400)) {
            throw new Error("Admin inventory QA assertions failed")
        }
        productId = ""
    } finally {
        if (productId) await prisma.product.delete({ where: { id: productId } }).catch(() => undefined)
        if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => undefined)
        console.log(JSON.stringify({ cleanup: "Temporary QA admin and product removed" }))
        await prisma.$disconnect()
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
