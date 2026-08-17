import { ProductDetailPage } from "@/components/ProductDetailView"
import { buildProductMetadata } from "@/lib/product-seo"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return buildProductMetadata(id, "real_estate")
}

export default function RealEstateDetailPage(props: { params: Promise<{ id: string }> }) {
    return (
        <ProductDetailPage
            {...props}
            category="real_estate"
            backHref="/real-estate"
            backLabel="กลับไปหน้าอสังหาฯ"
        />
    )
}
