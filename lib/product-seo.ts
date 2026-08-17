import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { compactDescription, productPath, seoImage, SITE_NAME } from "@/lib/seo"

const categoryFallbacks: Record<string, string> = {
    vehicle: "ดูข้อมูลรถยนต์มือสอง ราคา รูปภาพ และรายละเอียดสำคัญก่อนติดต่อ Chayapon Works",
    real_estate: "ดูข้อมูลอสังหาริมทรัพย์ ราคา ทำเล พื้นที่ และรายละเอียดสำคัญก่อนติดต่อ Chayapon Works",
    part: "ดูข้อมูลอะไหล่รถยนต์ ราคา รุ่นที่รองรับ และสต็อกก่อนสั่งซื้อกับ Chayapon Works",
}

export async function buildProductMetadata(id: string, productType: "vehicle" | "real_estate" | "part"): Promise<Metadata> {
    const product = await prisma.product.findFirst({
        where: { id, productType, status: { in: ["active", "reserved"] } },
        select: { title: true, description: true, images: true, status: true },
    })

    if (!product) {
        return {
            title: "ไม่พบสินค้า",
            description: "ไม่พบสินค้าที่คุณกำลังค้นหา",
            robots: { index: false, follow: false },
        }
    }

    const path = productPath(productType, id)
    const description = compactDescription(product.description, categoryFallbacks[productType])
    const image = seoImage(product.images[0])

    return {
        title: product.title,
        description,
        alternates: { canonical: path },
        openGraph: {
            type: "website",
            locale: "th_TH",
            url: path,
            siteName: SITE_NAME,
            title: product.title,
            description,
            images: [{ url: image, alt: product.title }],
        },
        twitter: { card: "summary_large_image", title: product.title, description, images: [image] },
        robots: {
            index: true,
            follow: true,
            googleBot: { index: true, follow: true, "max-image-preview": "large" },
        },
    }
}
