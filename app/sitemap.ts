import type { MetadataRoute } from "next"
import { prisma } from "@/lib/prisma"
import { absoluteUrl, productPath } from "@/lib/seo"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const products = await prisma.product.findMany({
        where: {
            productType: { in: ["vehicle", "real_estate", "part"] },
            status: { in: ["active", "reserved"] },
        },
        select: { id: true, productType: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
    })

    const staticPages: MetadataRoute.Sitemap = [
        { url: absoluteUrl("/"), lastModified: new Date(), changeFrequency: "daily", priority: 1 },
        { url: absoluteUrl("/vehicles"), lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
        { url: absoluteUrl("/real-estate"), lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
        { url: absoluteUrl("/parts"), lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
        { url: absoluteUrl("/about"), lastModified: new Date("2026-08-16"), changeFrequency: "monthly", priority: 0.6 },
        { url: absoluteUrl("/terms"), lastModified: new Date("2026-08-16"), changeFrequency: "yearly", priority: 0.3 },
        { url: absoluteUrl("/privacy"), lastModified: new Date("2026-08-16"), changeFrequency: "yearly", priority: 0.3 },
    ]

    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
        url: absoluteUrl(productPath(product.productType, product.id)),
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
    }))

    return [...staticPages, ...productPages]
}
