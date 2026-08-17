// ==========================================
// Auto Parts Listing Page — Server Component (Public)
// ==========================================

import type { Metadata } from "next"
import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { Settings, Search } from "lucide-react"
import PartsFilterSidebar from "./PartsFilterSidebar"
import PartCard from "./PartCard"
import PartsPagination from "./PartsPagination"
import PartsMobileFilter from "./PartsMobileFilter"
import { buildCategoryMetadata, hasSearchParameters } from "@/lib/seo"

// ─── SEO Metadata ────────────────────────────────────────────
// ─── Types ───────────────────────────────────────────────────
interface PartsPageProps {
    searchParams: Promise<{
        category?: string
        brand?: string
        priceMin?: string
        priceMax?: string
        sort?: string
        page?: string
        q?: string
    }>
}

export async function generateMetadata({ searchParams }: PartsPageProps): Promise<Metadata> {
    const params = await searchParams
    return buildCategoryMetadata({
        title: "อะไหล่และชิ้นส่วนรถยนต์",
        description: "เลือกซื้ออะไหล่รถยนต์จาก Chayapon Works ค้นหาตามหมวดหมู่ แบรนด์ รุ่นรถ ราคา และตรวจสอบสต็อกก่อนสั่งซื้อออนไลน์",
        path: "/parts",
        filtered: hasSearchParameters(params),
    })
}

// ─── Constants ───────────────────────────────────────────────
const ITEMS_PER_PAGE = 12

// ─── Main Page Component ─────────────────────────────────────
export default async function PartsPage({ searchParams }: PartsPageProps) {
    const params = await searchParams

    // ── 1. Build Prisma WHERE clause จาก URL searchParams ──
    const where: Record<string, unknown> = {
        productType: "part",
        status: "active",
    }

    const partWhere: Record<string, unknown> = {}

    if (params.category) {
        partWhere.category = { in: params.category.split(",") }
    }
    if (params.brand) {
        partWhere.brand = { in: params.brand.split(",") }
    }

    // Price filter on base Product
    if (params.priceMin || params.priceMax) {
        where.price = {
            ...(params.priceMin ? { gte: parseFloat(params.priceMin) } : {}),
            ...(params.priceMax ? { lte: parseFloat(params.priceMax) } : {}),
        }
    }

    // Text search in Title OR Compatibility OR SKU
    if (params.q) {
        where.OR = [
            { title: { contains: params.q, mode: "insensitive" } },
            { 
                part: {
                    OR: [
                        { compatibility: { contains: params.q, mode: "insensitive" } },
                        { sku: { contains: params.q, mode: "insensitive" } },
                    ]
                }
            }
        ]
    }

    // Add part relation filter
    if (Object.keys(partWhere).length > 0) {
        if (where.OR) {
            // merge with existing part condition if OR exists
            where.part = { ...partWhere, ...(where.part as Record<string,unknown> || {}) }
        } else {
            where.part = partWhere
        }
    } else if (!where.part) {
        // ต้องมี part relation (ไม่ใช่ null)
        where.part = { isNot: null }
    }

    // ── 2. Sort ──────────────────────────────────────────────
    type SortOption = { price?: "asc" | "desc"; createdAt?: "asc" | "desc"; views?: "desc" }
    let orderBy: SortOption = { createdAt: "desc" }
    switch (params.sort) {
        case "price_asc":
            orderBy = { price: "asc" }
            break
        case "price_desc":
            orderBy = { price: "desc" }
            break
        case "popular":
            orderBy = { views: "desc" }
            break
        default:
            orderBy = { createdAt: "desc" }
    }

    // ── 3. Pagination ────────────────────────────────────────
    const parsedPage = Number.parseInt(params.page || "1", 10)
    const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
    const skip = (currentPage - 1) * ITEMS_PER_PAGE

    // ── 4. Fetch Data (Prisma) ───────────────────────────────
    const [products, totalCount, categories, brands] = await Promise.all([
        prisma.product.findMany({
            where,
            include: {
                part: true,
            },
            orderBy,
            skip,
            take: ITEMS_PER_PAGE,
        }),
        prisma.product.count({ where }),
        // Distinct categories for filter sidebar
        prisma.part.findMany({
            select: { category: true },
            distinct: ["category"],
            orderBy: { category: "asc" },
        }),
        // Distinct brands for filter sidebar
        prisma.part.findMany({
            select: { brand: true },
            distinct: ["brand"],
            orderBy: { brand: "asc" },
        }),
    ])

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
    const uniqueCategories = categories.map((c) => c.category)
    const uniqueBrands = brands.map((b) => b.brand)

    // ── 5. Render ────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background">
            {/* ─── Header ──────────────────────────────── */}
            <header className="border-b border-slate-200 bg-white">
                <div className="market-shell">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600">
                                <Settings className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">ค้นหาอะไหล่รถยนต์</h1>
                                <p className="text-xs text-muted-foreground">
                                    {totalCount.toLocaleString()} รายการ
                                </p>
                            </div>
                        </div>

                        {/* Mobile Filter Button */}
                        <PartsMobileFilter categories={uniqueCategories} brands={uniqueBrands} />
                    </div>
                </div>
            </header>

            {/* ─── Main Content ────────────────────────── */}
            <div className="market-shell py-4 pb-20 sm:py-6 lg:pb-6">
                <div className="flex gap-6">
                    {/* ─── Desktop Sidebar ──────────────── */}
                    <aside className="hidden w-72 shrink-0 rounded-lg border border-slate-200 bg-white p-4 lg:block">
                        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 pb-6">
                            <Suspense fallback={<div className="animate-pulse h-96 bg-muted rounded-xl" />}>
                                <PartsFilterSidebar categories={uniqueCategories} brands={uniqueBrands} />
                            </Suspense>
                        </div>
                    </aside>

                    {/* ─── Property Grid ─────────────────── */}
                    <main className="flex-1 min-w-0">
                        {/* Sort Bar */}
                        <div className="mb-6 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                แสดง{" "}
                                <span className="font-medium text-foreground">
                                    {totalCount > 0 ? skip + 1 : 0}-{Math.min(skip + ITEMS_PER_PAGE, totalCount)}
                                </span>{" "}
                                จาก{" "}
                                <span className="font-medium text-foreground">
                                    {totalCount.toLocaleString()}
                                </span>{" "}
                                รายการ
                            </p>
                        </div>

                        {/* Products Grid */}
                        {products.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                                {products.map((product, index) => (
                                    <div
                                        key={product.id}
                                        className="animate-fade-in-up"
                                        style={{ animationDelay: `${index * 50}ms` }}
                                    >
                                        <PartCard product={product} layout="list" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="flex flex-col items-center justify-center py-24 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                    <Search className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="mb-2 text-lg font-semibold">
                                    ไม่พบสินค้าที่ตรงกับเงื่อนไข
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-md">
                                    ลองปรับเงื่อนไขการค้นหา หรือล้างตัวกรองเพื่อดูสินค้าทั้งหมด
                                </p>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <PartsPagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                            />
                        )}
                    </main>
                </div>
            </div>
        </div>
    )
}
