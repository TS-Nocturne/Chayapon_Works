import { ProductDetailPage } from "@/components/ProductDetailView"
import { buildProductMetadata } from "@/lib/product-seo"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return buildProductMetadata(id, "vehicle")
}

export default function VehicleDetailPage(props: { params: Promise<{ id: string }> }) {
    return (
        <ProductDetailPage
            {...props}
            category="vehicle"
            backHref="/vehicles"
            backLabel="กลับไปหน้ารถยนต์"
        />
    )
}
