// ==========================================
// Vehicle Listing Page — Server Component (Public)
// ==========================================
// หน้านี้เป็น Public ไม่ต้อง Login เพื่อให้ Google Bot ทำ SEO ได้
// อ่าน searchParams จาก URL → สร้าง Prisma WHERE clause → fetch ข้อมูล → render
// การ "Book Test Drive" จะเช็ค session ฝั่ง Client Component แทน

import type { Metadata } from "next"
import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { Car, Search } from "lucide-react"
import VehicleFilterSidebar from "./VehicleFilterSidebar"
import VehicleCard from "./VehicleCard"
import VehiclePagination from "./VehiclePagination"
import VehicleMobileFilter from "./VehicleMobileFilter"
import { buildCategoryMetadata, hasSearchParameters } from "@/lib/seo"

// ─── SEO Metadata ────────────────────────────────────────────
// ─── Types ───────────────────────────────────────────────────
interface VehiclesPageProps {
    searchParams: Promise<{
        brand?: string
        model?: string
        yearMin?: string
        yearMax?: string
        priceMin?: string
        priceMax?: string
        mileageMin?: string
        mileageMax?: string
        transmission?: string
        fuelType?: string
        bodyType?: string
        sort?: string
        page?: string
        q?: string
    }>
}

export async function generateMetadata({ searchParams }: VehiclesPageProps): Promise<Metadata> {
    const params = await searchParams
    return buildCategoryMetadata({
        title: "รถยนต์มือสอง ตรวจสอบข้อมูลได้",
        description: "ค้นหารถยนต์มือสองจาก Chayapon Works เลือกตามยี่ห้อ รุ่น ปี ราคา ระยะทาง เชื้อเพลิง และประเภทรถ พร้อมดูรายละเอียดก่อนติดต่อร้าน",
        path: "/vehicles",
        filtered: hasSearchParameters(params),
    })
}

// ─── Constants ───────────────────────────────────────────────
const ITEMS_PER_PAGE = 12

// ─── Main Page Component ─────────────────────────────────────
export default async function VehiclesPage({ searchParams }: VehiclesPageProps) {
    // Await searchParams (Next.js 16 — params เป็น Promise)
    const params = await searchParams

    // ── 1. Build Prisma WHERE clause จาก URL searchParams ──
    const where: Record<string, unknown> = {
        productType: "vehicle",
        status: "active",
    }

    // Vehicle-specific filters — ใช้ nested where บน relation
    const vehicleWhere: Record<string, unknown> = {}

    if (params.brand) {
        vehicleWhere.brandId = params.brand
    }
    if (params.model) {
        vehicleWhere.modelId = params.model
    }
    if (params.yearMin || params.yearMax) {
        vehicleWhere.year = {
            ...(params.yearMin ? { gte: parseInt(params.yearMin) } : {}),
            ...(params.yearMax ? { lte: parseInt(params.yearMax) } : {}),
        }
    }
    if (params.mileageMin || params.mileageMax) {
        vehicleWhere.mileage = {
            ...(params.mileageMin ? { gte: parseInt(params.mileageMin) } : {}),
            ...(params.mileageMax ? { lte: parseInt(params.mileageMax) } : {}),
        }
    }
    if (params.transmission) {
        vehicleWhere.transmission = { in: params.transmission.split(",") }
    }
    if (params.fuelType) {
        vehicleWhere.fuelType = { in: params.fuelType.split(",") }
    }
    if (params.bodyType) {
        vehicleWhere.bodyType = { in: params.bodyType.split(",") }
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

    // Add vehicle relation filter
    if (Object.keys(vehicleWhere).length > 0) {
        where.vehicle = vehicleWhere
    } else {
        // ต้องมี vehicle relation (ไม่ใช่ null)
        where.vehicle = { isNot: null }
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
        case "year_desc":
            // จะ sort ผ่าน nested relation ไม่ได้โดยตรง → ใช้ createdAt แทน
            orderBy = { createdAt: "desc" }
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
    const [products, totalCount, brands] = await Promise.all([
        // Products with Vehicle details
        prisma.product.findMany({
            where,
            include: {
                vehicle: {
                    include: {
                        brand: true,
                        model: true,
                    },
                },
            },
            orderBy,
            skip,
            take: ITEMS_PER_PAGE,
        }),
        // Total count for pagination
        prisma.product.count({ where }),
        // All brands + models for filter sidebar
        prisma.vehicleBrand.findMany({
            include: {
                models: {
                    orderBy: { name: "asc" },
                },
            },
            orderBy: { name: "asc" },
        }),
    ])

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

    // ── 5. Render ────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-background">
            {/* ─── Header ──────────────────────────────── */}
            <header className="border-b border-slate-200 bg-white">
                <div className="market-shell">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-600">
                                <Car className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">ค้นหารถมือสอง</h1>
                                <p className="text-xs text-muted-foreground">
                                    {totalCount.toLocaleString()} คัน
                                </p>
                            </div>
                        </div>

                        {/* Mobile Filter Button */}
                        <VehicleMobileFilter brands={brands} />
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
                                <VehicleFilterSidebar brands={brands} />
                            </Suspense>
                        </div>
                    </aside>

                    {/* ─── Vehicle Grid ─────────────────── */}
                    <main className="flex-1 min-w-0">
                        {/* Sort Bar */}
                        <div className="mb-6 flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                แสดง{" "}
                                <span className="font-medium text-foreground">
                                    {skip + 1}-{Math.min(skip + ITEMS_PER_PAGE, totalCount)}
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
                                        <VehicleCard product={product} layout="list" />
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
                                    ไม่พบรถที่ตรงกับเงื่อนไข
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-md">
                                    ลองปรับเงื่อนไขการค้นหา หรือล้างตัวกรองเพื่อดูรถทั้งหมด
                                </p>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <VehiclePagination
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
