// ==========================================
// Vehicle Card — Premium Car Display Card + Lead Gen Modal
// ==========================================
"use client"

import * as React from "react"
import Link from "next/link"

import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import ContactSellerModal from "@/components/ContactSellerModal"
import ProductImage from "@/components/ProductImage"
import FavoriteButton from "@/components/FavoriteButton"
import {
    Calendar,
    Fuel,
    Gauge,
    Cog,
    Eye,
    MapPin,
    ShieldCheck,
    ArrowRight,
} from "lucide-react"
import { formatPrice, formatNumber, cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────
interface VehicleCardProps {
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
        vehicle: {
            id: string
            year: number
            mileage: number
            transmission: string
            fuelType: string
            color: string | null
            engineSize: number | null
            bodyType: string | null
            plateProvince: string | null
            brand: { id: string; name: string; logo: string | null }
            model: { id: string; name: string }
        } | null
    }
}

// ─── Label Mappings ──────────────────────────────────────────
const transmissionLabels: Record<string, string> = {
    automatic: "AT",
    manual: "MT",
}
const fuelLabels: Record<string, string> = {
    gasoline: "เบนซิน",
    diesel: "ดีเซล",
    hybrid: "ไฮบริด",
    electric: "EV",
}
const bodyLabels: Record<string, string> = {
    sedan: "ซีดาน",
    suv: "SUV",
    pickup: "กระบะ",
    hatchback: "แฮทช์แบ็ค",
    van: "แวน",
    coupe: "คูเป้",
}

export default function VehicleCard({ product, layout = "grid" }: VehicleCardProps) {
    const vehicle = product.vehicle

    if (!vehicle) return null
    const imageUrl = product.images?.[0] || "/vehicle_placeholder.png"

    return (
        <Card className={cn("group relative min-w-0 max-w-full flex flex-col gap-0 overflow-hidden rounded-lg border-slate-200 py-0 shadow-none transition hover:border-blue-300 hover:shadow-md", layout === "list" && "max-sm:grid max-sm:grid-cols-[42%_58%]", product.featured && "border-blue-200")}>
            {/* ─── Image ───────────────────────────────── */}
            <Link href={`/vehicles/${product.id}`} className={cn("relative block aspect-[16/9] overflow-hidden bg-slate-100", layout === "list" && "max-sm:aspect-auto max-sm:min-h-[178px]")}>
                <ProductImage
                    src={imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    fallbackLabel="ยังไม่มีรูปภาพรถคันนี้"
                />
                <div className="absolute left-2 top-2 flex flex-wrap gap-2 pr-14">
                    <Badge className="border-0 bg-emerald-600 text-white shadow-sm text-[10px]">
                        <ShieldCheck className="mr-1 h-3 w-3" aria-hidden="true" />
                        ตรวจสภาพแล้ว
                    </Badge>
                    {product.featured && <Badge className="border-0 bg-blue-600 text-white shadow-sm text-[10px]">แนะนำ</Badge>}
                    {product.status === "reserved" && <Badge className="bg-orange-500 text-white border-0 shadow-lg text-[10px]">จองแล้ว</Badge>}
                </div>
                {vehicle.bodyType && (
                    <div className="absolute bottom-2 right-2">
                        <Badge variant="secondary" className="bg-black/60 text-white border-0 backdrop-blur-sm text-[10px]">
                            {bodyLabels[vehicle.bodyType] || vehicle.bodyType}
                        </Badge>
                    </div>
                )}
            </Link>
            <FavoriteButton productId={product.id} className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-800 shadow-sm" />

            {/* ─── Content ─────────────────────────────── */}
            <CardContent className={cn("min-w-0 flex flex-1 flex-col space-y-2.5 p-3.5", layout === "list" && "max-sm:space-y-1.5 max-sm:p-3")}>
                <div>
                    <Link href={`/vehicles/${product.id}`}>
                        <h3 className="line-clamp-1 text-[15px] font-semibold leading-tight transition-colors group-hover:text-blue-700">
                        {vehicle.brand.name} {vehicle.model.name}
                        </h3>
                    </Link>
                    <p className={cn("mt-0.5 line-clamp-1 text-xs text-slate-500", layout === "list" && "max-sm:hidden")}>{product.title}</p>
                </div>

                <div className={cn("grid grid-cols-2 gap-1.5 border-b border-slate-100 pb-2", layout === "list" && "max-sm:grid-cols-1 max-sm:border-0 max-sm:pb-0")}>
                    <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", layout === "list" && "max-sm:hidden")}>
                        <Calendar className="h-3.5 w-3.5 text-slate-400" /><span>ปี {vehicle.year}</span>
                    </div>
                    <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground", layout === "list" && "max-sm:hidden")}>
                        <Gauge className="h-3.5 w-3.5 text-slate-400" /><span>{formatNumber(vehicle.mileage)} กม.</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Cog className="h-3.5 w-3.5 text-slate-400" /><span>{transmissionLabels[vehicle.transmission] || vehicle.transmission}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Fuel className="h-3.5 w-3.5 text-slate-400" /><span>{fuelLabels[vehicle.fuelType] || vehicle.fuelType}</span>
                    </div>
                </div>

                <div className={cn("flex items-center gap-3 text-xs text-slate-500", layout === "list" && "max-sm:text-[11px]")}>
                    {vehicle.engineSize && <span className={cn("flex items-center gap-1", layout === "list" && "max-sm:hidden")}>🔧 {vehicle.engineSize}L</span>}
                    {vehicle.plateProvince && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {vehicle.plateProvince}</span>}
                    <span className={cn("flex items-center gap-1 ml-auto", layout === "list" && "max-sm:hidden")}><Eye className="h-3 w-3" /> {product.views}</span>
                </div>

                {/* Clear primary and secondary actions */}
                <p className={cn("mt-auto text-xl font-bold tracking-tight text-blue-700", layout === "list" && "max-sm:text-lg")}>{formatPrice(product.price)}</p>
                <div className={cn("grid grid-cols-[0.8fr_1.2fr] gap-2 pt-1", layout === "list" && "max-sm:grid-cols-1")}>
                    <Link
                        href={`/vehicles/${product.id}`}
                        className={cn("inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-blue-600 bg-white px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-50", layout === "list" && "max-sm:hidden")}
                    >
                        ดูรายละเอียด <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                    <ContactSellerModal 
                        productId={product.id} 
                        productTitle={`${vehicle.brand.name} ${vehicle.model.name} ${vehicle.year}`} 
                        ctaLabel="ติดต่อร้าน"
                    />
                </div>
            </CardContent>
        </Card>
    )
}
