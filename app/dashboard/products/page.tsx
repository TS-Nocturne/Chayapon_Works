// ==========================================
// Products Management — Server Component
// ==========================================
// ตารางสินค้าทั้งหมด พร้อม Search, Filter by Type, Pagination
// + Toggle Status & Featured ผ่าน Client Actions

import { prisma } from "@/lib/prisma"
import { requireAdminPage } from "@/lib/admin-auth"
import { formatPrice, formatNumber } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Package, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import ProductActions from "./ProductActions"
import ProductFilters from "./ProductFilters"
import ProductImage from "@/components/ProductImage"
import type { Prisma } from "@/app/generated/prisma/client"

// ─── Label Mappings ──────────────────────────────────────────
const productTypeLabels: Record<string, string> = {
    vehicle: "รถยนต์",
    real_estate: "อสังหาฯ",
    part: "อะไหล่",
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    active: { label: "เปิดขาย", variant: "default" },
    sold: { label: "ขายแล้ว", variant: "secondary" },
    reserved: { label: "จองแล้ว", variant: "outline" },
}

const ITEMS_PER_PAGE = 15

interface ProductsPageProps {
    searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    await requireAdminPage("/dashboard/products")
    const params = await searchParams
    const parsedPage = Number.parseInt(params.page || "1", 10)
    const requestedPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1
    const currentType = ["vehicle", "real_estate", "part"].includes(params.type || "") ? params.type! : ""
    const searchQuery = (params.q || "").trim().slice(0, 100)

    // ─── Build Prisma Where ──────────────────────────────────
    const where: Prisma.ProductWhereInput = {}
    if (currentType) {
        where.productType = currentType
    }
    if (searchQuery) {
        where.title = { contains: searchQuery, mode: "insensitive" }
    }

    // ─── Fetch Data ──────────────────────────────────────────
    const totalCount = await prisma.product.count({ where })
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
    const currentPage = Math.min(requestedPage, Math.max(totalPages, 1))
    const skip = (currentPage - 1) * ITEMS_PER_PAGE
    const products = await prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: ITEMS_PER_PAGE,
        select: {
            id: true,
            title: true,
            productType: true,
            price: true,
            status: true,
            views: true,
            featured: true,
            images: true,
            createdAt: true,
        },
    })

    return (
        <div className="space-y-6">
            {/* ─── Header ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Package className="h-7 w-7 text-primary" />
                        จัดการสินค้า
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        ดูรายการสินค้าทั้งหมด เปลี่ยนสถานะ และจัดการ Featured
                    </p>
                </div>
                <Link href="/dashboard/products/new">
                    <Button className="shrink-0 gap-2">
                        <Plus className="h-4 w-4" />
                        เพิ่มสินค้า
                    </Button>
                </Link>
            </div>

            {/* ─── Filters ─── */}
            <ProductFilters
                currentType={currentType}
                searchQuery={searchQuery}
                totalCount={totalCount}
            />

            {/* ─── Products Table ─── */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px] hidden sm:table-cell">#</TableHead>
                                <TableHead>ชื่อสินค้า</TableHead>
                                <TableHead className="hidden sm:table-cell">ประเภท</TableHead>
                                <TableHead>ราคา</TableHead>
                                <TableHead className="hidden md:table-cell">สถานะ</TableHead>
                                <TableHead className="hidden lg:table-cell text-right">เข้าชม</TableHead>
                                <TableHead className="text-right">จัดการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product, index) => {
                                const st = statusLabels[product.status] || { label: product.status, variant: "outline" as const }
                                return (
                                    <TableRow key={product.id}>
                                        <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">
                                            {skip + index + 1}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {product.images?.[0] && (
                                                    <ProductImage
                                                        src={product.images[0]}
                                                        alt=""
                                                        className="h-8 w-8 rounded-md object-cover shrink-0 hidden sm:block"
                                                        width={32}
                                                        height={32}
                                                    />
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm truncate max-w-[180px] sm:max-w-[250px]">
                                                        {product.title}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground sm:hidden">
                                                        {productTypeLabels[product.productType]} · {st.label}
                                                    </p>
                                                </div>
                                                {product.featured && (
                                                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 text-[10px] shrink-0 hidden md:inline-flex">
                                                        ⭐ แนะนำ
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden sm:table-cell">
                                            <Badge variant="outline" className="text-[10px]">
                                                {productTypeLabels[product.productType] || product.productType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-sm whitespace-nowrap">
                                            {formatPrice(product.price)}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <Badge variant={st.variant} className="text-[10px]">
                                                {st.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-right text-muted-foreground text-sm">
                                            {formatNumber(product.views)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <ProductActions
                                                productId={product.id}
                                                currentStatus={product.status}
                                                isFeatured={product.featured}
                                            />
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {products.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                        ไม่พบสินค้าที่ตรงกับเงื่อนไข
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ─── Pagination ─── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground">
                        แสดง {skip + 1}-{Math.min(skip + ITEMS_PER_PAGE, totalCount)} จาก {totalCount} รายการ
                    </p>
                    <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            const params = new URLSearchParams()
                            if (currentType) params.set("type", currentType)
                            if (searchQuery) params.set("q", searchQuery)
                            params.set("page", String(page))
                            return (
                                <Link
                                    key={page}
                                    href={`/dashboard/products?${params.toString()}`}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        page === currentPage
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted hover:bg-muted/80 text-muted-foreground"
                                    }`}
                                >
                                    {page}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
