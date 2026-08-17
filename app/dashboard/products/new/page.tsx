// ==========================================
// Add New Product — Server Component
// ==========================================

import Link from "next/link"
import { ArrowLeft, PackagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import ProductForm from "@/components/admin/ProductForm"
import { prisma } from "@/lib/prisma"
import { requireAdminPage } from "@/lib/admin-auth"

export const metadata = {
    title: "เพิ่มสินค้าใหม่ | Admin Dashboard",
}

export default async function NewProductPage() {
    await requireAdminPage("/dashboard/products/new")
    const vehicleBrands = await prisma.vehicleBrand.findMany({
        include: { models: { orderBy: { name: "asc" } } },
        orderBy: { name: "asc" },
    })

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* ─── Header ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                        <PackagePlus className="h-7 w-7 text-primary" />
                        เพิ่มสินค้าใหม่
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        เลือกประเภทสินค้าและกรอกข้อมูลเพื่อแสดงผลบนหน้าเว็บไซต์
                    </p>
                </div>
                <Link href="/dashboard/products">
                    <Button variant="outline" className="shrink-0 gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        กลับหน้ารายการสินค้า
                    </Button>
                </Link>
            </div>

            {/* ─── Content ─── */}
            <Card>
                <CardContent className="p-6">
                    <ProductForm vehicleBrands={vehicleBrands} />
                </CardContent>
            </Card>
        </div>
    )
}
