import { prisma } from "../lib/prisma"

async function main() {
    const [negativeStock, temporaryUsers, temporaryProducts, temporaryLeads, temporaryOrders, temporaryAuditLogs, products] = await Promise.all([
        prisma.part.count({ where: { stock: { lt: 0 } } }),
        prisma.user.count({ where: { email: { endsWith: "@hybrid.test" } } }),
        prisma.product.count({ where: { title: { startsWith: "QA " } } }),
        prisma.contactLead.count({ where: { name: { startsWith: "QA " } } }),
        prisma.order.count({ where: { guestEmail: { endsWith: "@hybrid.test" } } }),
        prisma.auditLog.count({ where: { action: { startsWith: "QA_" } } }),
        prisma.product.findMany({
            select: {
                id: true,
                title: true,
                productType: true,
                images: true,
                vehicle: { select: { id: true } },
                realEstate: { select: { id: true } },
                part: { select: { id: true } },
            },
        }),
    ])

    const invalidProducts = products.filter((product) => {
        if (!product.title.trim() || product.images.length === 0) return true
        if (product.productType === "vehicle") return !product.vehicle || Boolean(product.realEstate || product.part)
        if (product.productType === "real_estate") return !product.realEstate || Boolean(product.vehicle || product.part)
        if (product.productType === "part") return !product.part || Boolean(product.vehicle || product.realEstate)
        return true
    })

    const result = {
        products: products.length,
        negativeStock,
        temporaryUsers,
        temporaryProducts,
        temporaryLeads,
        temporaryOrders,
        temporaryAuditLogs,
        invalidProducts: invalidProducts.map(({ id, title }) => ({ id, title })),
    }
    console.log(JSON.stringify(result))

    if (negativeStock || temporaryUsers || temporaryProducts || temporaryLeads || temporaryOrders || temporaryAuditLogs || invalidProducts.length) {
        throw new Error("Database integrity QA failed")
    }
}

main()
    .finally(() => prisma.$disconnect())
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
