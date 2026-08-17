// ==========================================
// Real Estate Listing Page — Server Component (Public)
// ==========================================
// หน้านี้เป็น Public ไม่ต้อง Login เพื่อให้ Google Bot ทำ SEO ได้
// อ่าน searchParams จาก URL → สร้าง Prisma WHERE clause → fetch ข้อมูล → render
// CTA "นัดดูบ้าน" จะเช็ค session ฝั่ง Client Component แทน

import type { Metadata } from "next"
import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { Building2, Search } from "lucide-react"
import RealEstateFilterSidebar from "./RealEstateFilterSidebar"
import RealEstateCard from "./RealEstateCard"
import RealEstatePagination from "./RealEstatePagination"
import RealEstateMobileFilter from "./RealEstateMobileFilter"
import { buildCategoryMetadata, hasSearchParameters } from "@/lib/seo"

// ─── SEO Metadata ────────────────────────────────────────────
// ─── Types ───────────────────────────────────────────────────
interface RealEstatePageProps {
    searchParams: Promise<{
        propertyType?: string
        location?: string
        priceMin?: string
        priceMax?: string
        bedrooms?: string
        bathrooms?: string
        areaMin?: string
        areaMax?: string
        furnished?: string
        sort?: string
        page?: string
        q?: string
    }>
}

export async function generateMetadata({ searchParams }: RealEstatePageProps): Promise<Metadata> {
    const params = await searchParams
    return buildCategoryMetadata({
        title: "อสังหาริมทรัพย์ บ้าน คอนโด ทาวน์เฮ้าส์ และที่ดิน",
        description: "ค้นหาอสังหาริมทรัพย์จาก Chayapon Works ทั้งบ้าน คอนโด ทาวน์เฮ้าส์ และที่ดิน เลือกตามประเภท ทำเล พื้นที่ และช่วงราคา",
        path: "/real-estate",
        filtered: hasSearchParameters(params),
    })
}

// ─── Constants ───────────────────────────────────────────────
const ITEMS_PER_PAGE = 12

// ─── Main Page Component ─────────────────────────────────────
export default async function RealEstatePage({ searchParams }: RealEstatePageProps) {
    // Await searchParams (Next.js 16 — params เป็น Promise)
    const params = await searchParams

    // ── 1. Build Prisma WHERE clause จาก URL searchParams ──
    const where: Record<string, unknown> = {
        productType: "real_estate",
        status: "active",
    }

    // RealEstate-specific filters — ใช้ nested where บน relation
    const realEstateWhere: Record<string, unknown> = {}

    if (params.propertyType) {
        realEstateWhere.propertyType = { in: params.propertyType.split(",") }
    }
    if (params.location) {
        realEstateWhere.location = { contains: params.location, mode: "insensitive" }
    }
    if (params.bedrooms) {
        realEstateWhere.bedrooms = { gte: parseInt(params.bedrooms) }
    }
    if (params.bathrooms) {
        realEstateWhere.bathrooms = { gte: parseInt(params.bathrooms) }
    }
    if (params.areaMin || params.areaMax) {
        realEstateWhere.areaSqm = {
            ...(params.areaMin ? { gte: parseFloat(params.areaMin) } : {}),
            ...(params.areaMax ? { lte: parseFloat(params.areaMax) } : {}),
        }
    }
    if (params.furnished) {
        realEstateWhere.furnished = params.furnished
    }

    // Price filter on base Product
    if (params.priceMin || params.priceMax) {
        where.price = {
            ...(params.priceMin ? { gte: parseFloat(params.priceMin) } : {}),
            ...(params.priceMax ? { lte: parseFloat(params.priceMax) } : {}),
        }
    }

    // Text search
    if (params.q) {
        where.title = { contains: params.q, mode: "insensitive" }
    }

    // Add realEstate relation filter
    if (Object.keys(realEstateWhere).length > 0) {
        where.realEstate = realEstateWhere
    } else {
        // ต้องมี realEstate relation (ไม่ใช่ null)
        where.realEstate = { isNot: null }
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
    const [products, totalCount, locations] = await Promise.all([
        // Products with RealEstate details
        prisma.product.findMany({
            where,
            include: {
                realEstate: true,
            },
            orderBy,
            skip,
            take: ITEMS_PER_PAGE,
        }),
        // Total count for pagination
        prisma.product.count({ where }),
        // Distinct locations for filter sidebar
        prisma.realEstate.findMany({
            select: { location: true },
            distinct: ["location"],
            orderBy: { location: "asc" },
        }),
    ])

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
    const uniqueLocations = locations.map((l) => l.location)

    // ── 5. Render ────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background">
            {/* ─── Header ──────────────────────────────── */}
            <header className="border-b border-slate-200 bg-white">
                <div className="market-shell">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600">
                                <Building2 className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">ค้นหาอสังหาริมทรัพย์</h1>
                                <p className="text-xs text-muted-foreground">
                                    {totalCount.toLocaleString()} รายการ
                                </p>
                            </div>
                        </div>

                        {/* Mobile Filter Button */}
                        <RealEstateMobileFilter locations={uniqueLocations} />
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
                                <RealEstateFilterSidebar locations={uniqueLocations} />
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
                                        <RealEstateCard product={product} layout="list" />
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
                                    ไม่พบอสังหาริมทรัพย์ที่ตรงกับเงื่อนไข
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-md">
                                    ลองปรับเงื่อนไขการค้นหา หรือล้างตัวกรองเพื่อดูทรัพย์สินทั้งหมด
                                </p>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <RealEstatePagination
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
