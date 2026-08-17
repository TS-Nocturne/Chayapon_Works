import { ProductDetailPage } from "@/components/ProductDetailView"
import { buildProductMetadata } from "@/lib/product-seo"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return buildProductMetadata(id, "part")
}

export default function PartDetailPage(props: { params: Promise<{ id: string }> }) {
    return (
        <ProductDetailPage
            {...props}
            category="part"
            backHref="/parts"
            backLabel="กลับไปหน้าอะไหล่"
        />
    )
}
