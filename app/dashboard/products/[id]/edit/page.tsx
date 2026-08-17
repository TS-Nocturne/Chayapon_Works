import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, EditIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import ProductForm from "@/components/admin/ProductForm"
import { prisma } from "@/lib/prisma"
import { requireAdminPage } from "@/lib/admin-auth"
import type { ProductFormValues } from "@/lib/validations/product"

export const metadata = {
    title: "แก้ไขสินค้า | Admin Dashboard",
}

interface EditProductPageProps {
    params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
    const { id } = await params
    await requireAdminPage(`/dashboard/products/${id}/edit`)

    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            vehicle: { include: { brand: true, model: true } },
            realEstate: true,
            part: true,
        }
    })

    if (!product) {
        notFound()
    }

    const vehicleBrands = await prisma.vehicleBrand.findMany({
        include: { models: { orderBy: { name: "asc" } } },
        orderBy: { name: "asc" },
    })

    // Flatten product payload for the form
    let initialData = {
        id: product.id,
        title: product.title,
        description: product.description || "",
        price: product.price,
        images: product.images,
        status: product.status,
        featured: product.featured,
        productType: product.productType,
    } as unknown as ProductFormValues & { id: string }

    if (product.productType === "vehicle" && product.vehicle) {
        initialData = {
            ...initialData,
            ...product.vehicle,
            brandName: product.vehicle.brand.name,
            modelName: product.vehicle.model.name,
        } as unknown as ProductFormValues & { id: string }
    } else if (product.productType === "real_estate" && product.realEstate) {
        initialData = { ...initialData, ...product.realEstate } as unknown as ProductFormValues & { id: string }
    } else if (product.productType === "part" && product.part) {
        initialData = { ...initialData, ...product.part } as unknown as ProductFormValues & { id: string }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* ─── Header ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                        <EditIcon className="h-7 w-7 text-primary" />
                        แก้ไขสินค้า
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        แก้ไขรายละเอียดสินค้า (ไม่สามารถเปลี่ยนประเภทของสินค้าได้)
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
                    <ProductForm initialData={initialData} vehicleBrands={vehicleBrands} />
                </CardContent>
            </Card>
        </div>
    )
}
