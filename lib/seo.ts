import type { Metadata } from "next"

export const SITE_NAME = "Chayapon Works"
export const DEFAULT_DESCRIPTION =
    "เลือกซื้อรถยนต์มือสอง อสังหาริมทรัพย์ และอะไหล่รถยนต์จาก Chayapon Works พร้อมข้อมูลสินค้าและช่องทางติดต่อจากร้านโดยตรง"

export function getSiteUrl() {
    const configuredUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    try {
        return new URL(configuredUrl)
    } catch {
        return new URL("http://localhost:3000")
    }
}

export function absoluteUrl(pathOrUrl: string) {
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
    return new URL(pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`, getSiteUrl()).toString()
}

export function productPath(type: string, id: string) {
    if (type === "vehicle") return `/vehicles/${id}`
    if (type === "real_estate") return `/real-estate/${id}`
    return `/parts/${id}`
}

export function compactDescription(value: string | null | undefined, fallback: string) {
    const text = (value || fallback).replace(/\s+/g, " ").trim()
    return text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text
}

export function seoImage(image: string | null | undefined, fallback = "/marketplace-hero-v2.png") {
    if (!image || image.startsWith("data:")) return fallback
    return image
}

export function hasSearchParameters(params: Record<string, string | string[] | undefined>) {
    return Object.values(params).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value))
}

export function buildCategoryMetadata({
    title,
    description,
    path,
    filtered,
}: {
    title: string
    description: string
    path: string
    filtered: boolean
}): Metadata {
    return {
        title,
        description,
        alternates: { canonical: path },
        openGraph: {
            type: "website",
            locale: "th_TH",
            url: path,
            siteName: SITE_NAME,
            title,
            description,
            images: [{ url: "/marketplace-hero-v2.png", alt: `${SITE_NAME} ร้านค้าออนไลน์` }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: ["/marketplace-hero-v2.png"],
        },
        robots: filtered
            ? { index: false, follow: true }
            : { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
    }
}
