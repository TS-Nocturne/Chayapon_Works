import { readFileSync } from "node:fs"
import { prisma } from "../lib/prisma"

interface ServerReference { exportedName: string }

async function callAction(actionName: string, route: string, args: unknown[]) {
    const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")) as {
        node: Record<string, ServerReference>
    }
    const actionId = Object.entries(manifest.node).find(([, action]) => action.exportedName === actionName)?.[0]
    if (!actionId) throw new Error(`${actionName} server action not found`)
    return fetch(`http://localhost:3000${route}`, {
        method: "POST",
        headers: {
            accept: "text/x-component",
            "next-action": actionId,
            "content-type": "text/plain;charset=UTF-8",
            origin: "http://localhost:3000",
        },
        body: JSON.stringify(args),
    })
}

async function main() {
    const vehicle = await prisma.product.findFirst({ where: { productType: "vehicle", status: "active" } })
    if (!vehicle) throw new Error("No active vehicle available for catalog QA")
    let leadId = ""
    const viewsBefore = vehicle.views

    try {
        const detailResponse = await fetch(`http://localhost:3000/vehicles/${vehicle.id}`)
        const viewResponse = await callAction("incrementProductView", `/vehicles/${vehicle.id}`, [vehicle.id])
        const afterView = await prisma.product.findUnique({ where: { id: vehicle.id }, select: { views: true } })

        const phone = `08${String(Date.now()).slice(-8)}`
        const leadResponse = await callAction("submitContactLead", `/vehicles/${vehicle.id}`, [{
            productId: vehicle.id,
            name: "QA Contact",
            phone,
            preferredDate: "2026-08-20",
        }])
        const leadBody = await leadResponse.text()
        const lead = await prisma.contactLead.findFirst({ where: { productId: vehicle.id, phone } })
        leadId = lead?.id ?? ""

        const result = {
            detailStatus: detailResponse.status,
            viewActionStatus: viewResponse.status,
            viewIncremented: afterView?.views === viewsBefore + 1,
            leadActionStatus: leadResponse.status,
            leadResponseHasSuccess: leadBody.includes("success"),
            leadCreated: Boolean(lead),
        }
        console.log(JSON.stringify(result))
        if (!detailResponse.ok || !viewResponse.ok || !result.viewIncremented || !leadResponse.ok || !result.leadCreated) {
            throw new Error("Catalog QA assertions failed")
        }
    } finally {
        if (leadId) await prisma.contactLead.delete({ where: { id: leadId } })
        await prisma.product.update({ where: { id: vehicle.id }, data: { views: viewsBefore } })
        console.log(JSON.stringify({ cleanup: "QA lead removed and view count restored" }))
        await prisma.$disconnect()
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
