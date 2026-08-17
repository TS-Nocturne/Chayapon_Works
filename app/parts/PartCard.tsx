"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import AddToCartButton from "@/components/AddToCartButton"
import { Eye, Package, Tag, Wrench } from "lucide-react"
import { formatPrice, cn } from "@/lib/utils"

interface PartCardProps {
    layout?: "grid" | "list"
    product: {
        id: string
        title: string
        description: string | null
        price: number
        images: string[]
        status: string
        featured: boolean
        views: number
        createdAt: Date
        part: {
            id: string
            sku: string
            brand: string
            category: string
            compatibility: string
            stock: number
        } | null
    }
}

const PLACEHOLDER_IMAGES = [
    "/part_placeholder.png",
]

export default function PartCard({ product, layout = "grid" }: PartCardProps) {
    const part = product.part

    if (!part) return null
    const placeholderIndex = Array.from(product.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % PLACEHOLDER_IMAGES.length
    const imageUrl = product.images?.[0] || PLACEHOLDER_IMAGES[placeholderIndex]
    const isOutOfStock = part.stock <= 0

    return (
        <Card className={cn("group relative min-w-0 max-w-full flex flex-col gap-0 overflow-hidden rounded-lg border-slate-200 py-0 shadow-none transition hover:border-blue-300 hover:shadow-md", layout === "list" && "max-sm:grid max-sm:grid-cols-[42%_58%]", product.featured && "border-blue-200")}>
            <Link href={`/parts/${product.id}`} className={cn("relative block aspect-[16/10] overflow-hidden bg-white p-5", layout === "list" && "max-sm:aspect-auto max-sm:min-h-[178px] max-sm:p-2")}>
                <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    className="object-contain p-5 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                    {product.featured && <Badge className="bg-blue-600 text-white border-0 shadow-sm text-[10px]">แนะนำ</Badge>}
                </div>
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    {isOutOfStock ? (
                        <Badge variant="destructive" className="border-0 text-[10px]">สินค้าหมด</Badge>
                    ) : (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">มีสินค้า ({part.stock})</Badge>
                    )}
                </div>
            </Link>

            <CardContent className={cn("min-w-0 flex flex-1 flex-col space-y-2.5 border-t border-slate-100 bg-white p-3.5", layout === "list" && "max-sm:space-y-1.5 max-sm:border-l max-sm:border-t-0 max-sm:p-3")}>
                <div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 flex justify-between">
                        <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> {part.brand}</span>
                        <span className={cn(layout === "list" && "max-sm:hidden")}>SKU: {part.sku}</span>
                    </div>
                    <Link href={`/parts/${product.id}`}>
                        <h3 className="line-clamp-2 h-10 text-sm font-semibold leading-tight transition-colors group-hover:text-blue-700">
                            {product.title}
                        </h3>
                    </Link>
                </div>

                <div className={cn("flex flex-col gap-1.5 mt-2", layout === "list" && "max-sm:mt-0")}>
                    <div className={cn("flex items-start gap-1.5 text-xs text-muted-foreground", layout === "list" && "max-sm:hidden")}>
                        <Package className="h-3.5 w-3.5 text-primary/70 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{part.category}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Wrench className="h-3.5 w-3.5 text-primary/70 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{part.compatibility}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 mt-auto pt-3">
                    <p className={cn("text-xl font-bold text-blue-700", layout === "list" && "max-sm:text-lg")}>
                        {formatPrice(product.price)}
                    </p>
                    <span className={cn("flex items-center gap-1", layout === "list" && "max-sm:hidden")}><Eye className="h-3 w-3" /> {product.views}</span>
                </div>

                <AddToCartButton
                    productId={product.id}
                    title={product.title}
                    price={product.price}
                    image={imageUrl}
                    sku={part.sku}
                    stock={part.stock}
                    className="w-full mt-2"
                    size="sm"
                />
            </CardContent>
        </Card>
    )
}
