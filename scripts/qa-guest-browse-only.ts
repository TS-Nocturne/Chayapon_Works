import { readFileSync } from "node:fs"
import { prisma } from "../lib/prisma"

interface ServerReference { exportedName: string }
const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as { node: Record<string, ServerReference> }

function actionId(name: string) {
    const id = Object.entries(manifest.node).find(([, action]) => action.exportedName === name)?.[0]
    if (!id) throw new Error(`${name} server action not found`)
    return id
}

async function callAction(name: string, args: unknown[]) {
    const response = await fetch("http://localhost:3000/checkout", {
        method: "POST",
        headers: {
            accept: "text/x-component",
            "next-action": actionId(name),
            "content-type": "text/plain;charset=UTF-8",
            origin: "http://localhost:3000",
            "x-real-ip": "198.51.100.119",
        },
        body: JSON.stringify(args),
    })
    return { status: response.status, body: await response.text() }
}

async function route(path: string) {
    const response = await fetch(`http://localhost:3000${path}`, { redirect: "manual" })
    return { status: response.status, location: response.headers.get("location") || "" }
}

async function main() {
    const product = await prisma.product.findFirst({ where: { status: "active" }, select: { id: true, productType: true } })
    if (!product) throw new Error("No public product available")
    const productPath = product.productType === "vehicle" ? "vehicles" : product.productType === "real_estate" ? "real-estate" : "parts"

    const [home, listing, detail, signIn, cart, checkout, orders, profile, createOrder, contact, promptPay] = await Promise.all([
        route("/"),
        route(`/${productPath}`),
        route(`/${productPath}/${product.id}`),
        route("/sign-in"),
        route("/cart"),
        route("/checkout"),
        route("/orders"),
        route("/profile"),
        callAction("createOrder", [{}]),
        callAction("submitContactLead", [{ productId: product.id, name: "Guest", phone: "0812345678", preferredDate: "" }]),
        callAction("generatePromptPayQr", [100]),
    ])

    const checks = {
        homepagePublic: home.status === 200,
        listingPublic: listing.status === 200,
        productDetailPublic: detail.status === 200,
        signInPublic: signIn.status === 200,
        cartRequiresLogin: [302, 303, 307, 308].includes(cart.status) && cart.location.includes("/sign-in") && cart.location.includes("callbackUrl=/cart"),
        checkoutRequiresLogin: [302, 303, 307, 308].includes(checkout.status) && checkout.location.includes("/sign-in") && checkout.location.includes("callbackUrl=/checkout"),
        ordersRequireLogin: [302, 303, 307, 308].includes(orders.status) && orders.location.includes("/sign-in"),
        profileRequiresLogin: [302, 303, 307, 308].includes(profile.status) && profile.location.includes("/sign-in"),
        directOrderBlocked: createOrder.body.includes("กรุณาเข้าสู่ระบบก่อนสั่งซื้อสินค้า"),
        directContactBlocked: contact.body.includes("กรุณาเข้าสู่ระบบก่อนติดต่อร้านหรือนัดหมาย"),
        directQrBlocked: promptPay.body.includes("กรุณาเข้าสู่ระบบก่อนชำระเงิน"),
    }

    console.log(JSON.stringify({ routes: { home, listing, detail, signIn, cart, checkout, orders, profile }, actionStatuses: { createOrder: createOrder.status, contact: contact.status, promptPay: promptPay.status }, checks }, null, 2))
    if (Object.values(checks).some((passed) => !passed)) throw new Error("Guest browse-only QA failed")
}

main()
    .finally(() => prisma.$disconnect())
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
