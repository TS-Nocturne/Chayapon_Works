// ==========================================
// Real Estate Card — Premium Property Display Card
// ==========================================
// แสดงข้อมูลอสังหาริมทรัพย์ในรูปแบบ Card พร้อม CTA นัดดูทรัพย์
// Re-use ContactSellerModal จาก Phase 2

"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import ContactSellerModal from "@/components/ContactSellerModal"
import FavoriteButton from "@/components/FavoriteButton"
import {
    BedDouble,
    Bath,
    Ruler,
    MapPin,
    Eye,
    Building2,
    ParkingCircle,
    CalendarDays,
    ShieldCheck,
} from "lucide-react"
import { formatPrice, formatNumber, cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────
interface RealEstateCardProps {
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
        realEstate: {
            id: string
            propertyType: string
            areaSqm: number
            landSqw: number | null
            bedrooms: number
            bathrooms: number
            floors: number | null
            location: string
            district: string | null
            nearbyPlaces: string | null
            furnished: string | null
            parking: number | null
            yearBuilt: number | null
        } | null
    }
}

// ─── Label Mappings ──────────────────────────────────────────
const propertyTypeLabels: Record<string, string> = {
    house: "บ้านเดี่ยว",
    condo: "คอนโด",
    townhouse: "ทาวน์เฮ้าส์",
    land: "ที่ดิน",
}

const furnishedLabels: Record<string, string> = {
    furnished: "เฟอร์ครบ",
    unfurnished: "ไม่มีเฟอร์",
    partially: "เฟอร์บางส่วน",
}

const PLACEHOLDER_IMAGES = [
    "/real_estate_placeholder.png",
]

export default function RealEstateCard({ product, layout = "grid" }: RealEstateCardProps) {
    const property = product.realEstate

    if (!property) return null
    const placeholderIndex = Array.from(product.id).reduce((sum, char) => sum + char.charCodeAt(0), 0) % PLACEHOLDER_IMAGES.length
    const imageUrl = product.images?.[0] || PLACEHOLDER_IMAGES[placeholderIndex]

    return (
        <Card className={cn("group relative min-w-0 max-w-full flex flex-col gap-0 overflow-hidden rounded-lg border-slate-200 py-0 shadow-none transition hover:border-blue-300 hover:shadow-md", layout === "list" && "max-sm:grid max-sm:grid-cols-[42%_58%]", product.featured && "border-blue-200")}>
            {/* ─── Image ───────────────────────────────── */}
            <Link href={`/real-estate/${product.id}`} className={cn("relative block aspect-[16/9] overflow-hidden bg-slate-100", layout === "list" && "max-sm:aspect-auto max-sm:min-h-[178px]")}>
                <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute left-2 top-2 flex gap-2">
                    <Badge className="border-0 bg-blue-600 text-white shadow-sm text-[10px]"><ShieldCheck className="mr-1 h-3 w-3" />ทรัพย์คัดสรรโดยร้าน</Badge>
                    {product.featured && <Badge className="bg-slate-900 text-white border-0 text-[10px]">แนะนำ</Badge>}
                    {product.status === "reserved" && <Badge className="bg-orange-500 text-white border-0 shadow-lg text-[10px]">จองแล้ว</Badge>}
                </div>
                <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="bg-black/60 text-white border-0 backdrop-blur-sm text-[10px]">
                        {propertyTypeLabels[property.propertyType] || property.propertyType}
                    </Badge>
                </div>
            </Link>
            <FavoriteButton productId={product.id} className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-slate-800 shadow-sm" />

            {/* ─── Content ─────────────────────────────── */}
            <CardContent className={cn("min-w-0 flex flex-1 flex-col space-y-2.5 p-3.5", layout === "list" && "max-sm:space-y-1.5 max-sm:p-3")}>
                <div>
                    <Link href={`/real-estate/${product.id}`}>
                        <h3 className="font-semibold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                            {product.title}
                        </h3>
                    </Link>
                    <p className={cn("text-xs text-muted-foreground mt-0.5 line-clamp-1 flex items-center gap-1", layout === "list" && "max-sm:text-[11px]")}>
                        <MapPin className="h-3 w-3" />
                        {property.district ? `${property.district}, ` : ""}{property.location}
                    </p>
                </div>

                {property.propertyType === "land" ? (
                    <div className={cn("grid grid-cols-2 gap-2 border-y border-slate-100 py-2", layout === "list" && "max-sm:grid-cols-1 max-sm:border-0 max-sm:py-0")}>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Ruler className="h-3.5 w-3.5 text-primary/70" /><span>{formatNumber(property.landSqw || 0)} ตร.ว.</span></div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-primary/70" /><span>{formatNumber((property.landSqw || 0) * 4)} ตร.ม.</span></div>
                    </div>
                ) : (
                    <div className={cn("mt-2 grid grid-cols-3 gap-2", layout === "list" && "max-sm:grid-cols-2 max-sm:gap-1 max-sm:mt-0")}>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><BedDouble className="h-3.5 w-3.5 text-primary/70" /><span>{property.bedrooms} ห้องนอน</span></div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Bath className="h-3.5 w-3.5 text-primary/70" /><span>{property.bathrooms} ห้องน้ำ</span></div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Ruler className="h-3.5 w-3.5 text-primary/70" /><span>{formatNumber(property.areaSqm)} ตร.ม.</span></div>
                    </div>
                )}

                {/* Secondary Info */}
                <div className={cn("flex items-center gap-3 text-xs text-muted-foreground pb-2 flex-wrap", layout === "list" && "max-sm:hidden")}>
                    {property.floors && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> {property.floors} ชั้น</span>}
                    {property.parking != null && property.parking > 0 && <span className="flex items-center gap-1"><ParkingCircle className="h-3 w-3" /> {property.parking} คัน</span>}
                    {property.yearBuilt && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> สร้างปี {property.yearBuilt}</span>}
                    {property.furnished && (
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                            {furnishedLabels[property.furnished] || property.furnished}
                        </Badge>
                    )}
                    <span className="flex items-center gap-1 ml-auto"><Eye className="h-3 w-3" /> {product.views}</span>
                </div>

                {/* CTA → Re-use ContactSellerModal */}
                <p className={cn("mt-auto text-xl font-bold tracking-tight text-blue-700", layout === "list" && "max-sm:text-lg")}>{formatPrice(product.price)}</p>
                <div className="pt-1">
                    <ContactSellerModal
                        productId={product.id}
                        productTitle={`${propertyTypeLabels[property.propertyType] || property.propertyType} ${property.location}`}
                        productType="real_estate"
                        ctaLabel="นัดหมายดูสถานที่"
                    />
                </div>
            </CardContent>
        </Card>
    )
}
