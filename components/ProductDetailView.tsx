import * as React from "react"
import {
    Calendar,
    Fuel,
    Gauge,
    Cog,
    MapPin,
    Eye,
    ArrowLeft,
    BedDouble,
    Bath,
    Ruler,
    Building2,
    ParkingCircle,
    CalendarDays,
    Package,
    Tag,
    Wrench,
    ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { formatPrice, formatNumber } from "@/lib/utils"
import ProductGallery from "@/components/ProductGallery"
import ContactSellerModal from "@/components/ContactSellerModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import AddToCartButton from "@/components/AddToCartButton"
import ProductViewTracker from "@/components/ProductViewTracker"
import FavoriteButton from "@/components/FavoriteButton"
import StructuredData from "@/components/StructuredData"
import { absoluteUrl, compactDescription, productPath, seoImage, SITE_NAME } from "@/lib/seo"

const transmissionLabels: Record<string, string> = { automatic: "เกียร์อัตโนมัติ", manual: "เกียร์ธรรมดา" }
const fuelLabels: Record<string, string> = { gasoline: "เบนซิน", diesel: "ดีเซล", hybrid: "ไฮบริด", electric: "EV" }
const bodyLabels: Record<string, string> = {
    sedan: "ซีดาน", suv: "SUV", pickup: "กระบะ", hatchback: "แฮทช์แบ็ค", van: "แวน", coupe: "คูเป้",
}
const propertyTypeLabels: Record<string, string> = {
    house: "บ้านเดี่ยว", condo: "คอนโด", townhouse: "ทาวน์เฮ้าส์", land: "ที่ดิน",
}
const furnishedLabels: Record<string, string> = {
    furnished: "เฟอร์ครบ", unfurnished: "ไม่มีเฟอร์", partially: "เฟอร์บางส่วน",
}

const PLACEHOLDERS: Record<string, string[]> = {
    vehicle: ["/vehicle_placeholder.png"],
    real_estate: ["/real_estate_placeholder.png"],
    part: ["/part_placeholder.png"],
}

interface ProductDetailPageProps {
    params: Promise<{ id: string }>
    category: "vehicle" | "real_estate" | "part"
    backHref: string
    backLabel: string
}

export async function ProductDetailPage({ params, category, backHref, backLabel }: ProductDetailPageProps) {
    const { id } = await params

    const product = await prisma.product.findUnique({
        where: { id, productType: category, status: { in: ["active", "reserved"] } },
        include: {
            vehicle: { include: { brand: true, model: true } },
            realEstate: true,
            part: true,
        },
    })

    if (!product) notFound()

    const images = product.images?.length ? product.images : PLACEHOLDERS[category]
    const mainImage = images[0]
    const detailPath = productPath(category, product.id)
    const categoryName = category === "vehicle" ? "รถยนต์มือสอง" : category === "real_estate" ? "อสังหาริมทรัพย์" : "อะไหล่รถยนต์"
    const categoryPath = category === "vehicle" ? "/vehicles" : category === "real_estate" ? "/real-estate" : "/parts"
    const schemaDescription = compactDescription(product.description, `${product.title} จาก ${SITE_NAME}`)
    const inStock = category !== "part" || Boolean(product.part && product.part.stock > 0)
    const schemaAvailability = product.status === "reserved"
        ? "https://schema.org/PreOrder"
        : inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock"
    const productSchema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: schemaDescription,
        image: images.map((image) => absoluteUrl(seoImage(image))),
        url: absoluteUrl(detailPath),
        category: categoryName,
        ...(product.vehicle?.brand?.name ? { brand: { "@type": "Brand", name: product.vehicle.brand.name } } : {}),
        ...(product.part?.brand ? { brand: { "@type": "Brand", name: product.part.brand } } : {}),
        ...(product.part?.sku ? { sku: product.part.sku } : {}),
        offers: {
            "@type": "Offer",
            url: absoluteUrl(detailPath),
            priceCurrency: "THB",
            price: product.price,
            availability: schemaAvailability,
            ...(category === "vehicle" ? { itemCondition: "https://schema.org/UsedCondition" } : {}),
            ...(category === "part" ? { itemCondition: "https://schema.org/NewCondition" } : {}),
            seller: { "@type": "Organization", name: SITE_NAME, url: absoluteUrl("/") },
        },
    }
    const breadcrumbSchema: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "หน้าหลัก", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: categoryName, item: absoluteUrl(categoryPath) },
            { "@type": "ListItem", position: 3, name: product.title, item: absoluteUrl(detailPath) },
        ],
    }

    return (
        <div className="min-h-screen bg-white">
            <StructuredData data={[productSchema, breadcrumbSchema]} />
            <ProductViewTracker productId={product.id} />
            <div className="market-shell py-3 sm:py-8">
                <Link href={backHref}>
                    <Button variant="ghost" className="mb-3 gap-2 px-0 text-slate-500 hover:bg-transparent hover:text-blue-700 sm:mb-5">
                        <ArrowLeft className="h-4 w-4" />
                        {backLabel}
                    </Button>
                </Link>

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.85fr)] lg:items-start">
                    {/* Images */}
                    <ProductGallery
                        images={images}
                        title={product.title}
                        fallbackLabel={category === "vehicle" ? "ยังไม่มีรูปภาพรถคันนี้" : "ยังไม่มีรูปภาพ"}
                    />

                    {/* Info */}
                    <div className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-[0_4px_18px_rgba(15,23,42,0.05)] max-sm:border-0 max-sm:p-0 max-sm:shadow-none lg:sticky lg:top-24 sm:p-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700"><ShieldCheck className="mr-1 h-3.5 w-3.5" />ตรวจสอบแล้ว</Badge>
                                {product.featured && <Badge className="bg-blue-600 text-white border-0">แนะนำ</Badge>}
                                {product.status === "reserved" && <Badge className="bg-orange-500 text-white border-0">จองแล้ว</Badge>}
                                <span className="ml-auto flex items-center gap-1 text-xs text-slate-500">
                                    <Eye className="h-3 w-3" /> {product.views + 1} ครั้ง
                                </span>
                            </div>
                            <div className="flex items-start justify-between gap-3"><h1 className="text-2xl font-bold leading-tight sm:text-3xl">{product.title}</h1><FavoriteButton productId={product.id} className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-slate-200" /></div>
                            <p className="mt-4 text-3xl font-bold tracking-tight text-blue-700 sm:text-4xl">{formatPrice(product.price)}</p>
                        </div>

                        {product.description && (
                            <Card className="rounded-md border-slate-200 shadow-none">
                                <CardContent className="p-4">
                                    <h2 className="font-semibold mb-2">รายละเอียด</h2>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Vehicle specs */}
                        {category === "vehicle" && product.vehicle && (
                            <Card className="rounded-md border-slate-200 shadow-none">
                                <CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
                                    <Spec icon={Calendar} label="ปี" value={`${product.vehicle.year}`} />
                                    <Spec icon={Gauge} label="ไมล์" value={`${formatNumber(product.vehicle.mileage)} กม.`} />
                                    <Spec icon={Cog} label="เกียร์" value={transmissionLabels[product.vehicle.transmission] || product.vehicle.transmission} />
                                    <Spec icon={Fuel} label="เชื้อเพลิง" value={fuelLabels[product.vehicle.fuelType] || product.vehicle.fuelType} />
                                    {product.vehicle.bodyType && <Spec icon={Building2} label="ตัวถัง" value={bodyLabels[product.vehicle.bodyType] || product.vehicle.bodyType} />}
                                    {product.vehicle.engineSize && <Spec label="เครื่องยนต์" value={`${product.vehicle.engineSize}L`} />}
                                    {product.vehicle.color && <Spec label="สี" value={product.vehicle.color} />}
                                    {product.vehicle.plateProvince && <Spec icon={MapPin} label="ทะเบียน" value={product.vehicle.plateProvince} />}
                                </CardContent>
                            </Card>
                        )}

                        {/* Real estate specs */}
                        {category === "real_estate" && product.realEstate && (
                            <Card className="rounded-md border-slate-200 shadow-none">
                                <CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
                                    <Spec icon={Building2} label="ประเภท" value={propertyTypeLabels[product.realEstate.propertyType] || product.realEstate.propertyType} />
                                    <Spec icon={MapPin} label="ที่ตั้ง" value={`${product.realEstate.district ? product.realEstate.district + ", " : ""}${product.realEstate.location}`} />
                                    {product.realEstate.propertyType !== "land" && <Spec icon={BedDouble} label="ห้องนอน" value={`${product.realEstate.bedrooms}`} />}
                                    {product.realEstate.propertyType !== "land" && <Spec icon={Bath} label="ห้องน้ำ" value={`${product.realEstate.bathrooms}`} />}
                                    {product.realEstate.propertyType !== "land" && <Spec icon={Ruler} label="พื้นที่ใช้สอย" value={`${formatNumber(product.realEstate.areaSqm)} ตร.ม.`} />}
                                    {product.realEstate.landSqw && <Spec icon={Ruler} label="ขนาดที่ดิน" value={`${formatNumber(product.realEstate.landSqw)} ตร.ว. (${formatNumber(product.realEstate.landSqw * 4)} ตร.ม.)`} />}
                                    {product.realEstate.floors && <Spec icon={Building2} label="ชั้น" value={`${product.realEstate.floors}`} />}
                                    {product.realEstate.parking != null && product.realEstate.parking > 0 && <Spec icon={ParkingCircle} label="ที่จอด" value={`${product.realEstate.parking} คัน`} />}
                                    {product.realEstate.yearBuilt && <Spec icon={CalendarDays} label="ปีสร้าง" value={`${product.realEstate.yearBuilt}`} />}
                                    {product.realEstate.furnished && <Spec label="เฟอร์" value={furnishedLabels[product.realEstate.furnished] || product.realEstate.furnished} />}
                                    {product.realEstate.nearbyPlaces && <Spec label="ใกล้เคียง" value={product.realEstate.nearbyPlaces} />}
                                </CardContent>
                            </Card>
                        )}

                        {/* Part specs */}
                        {category === "part" && product.part && (
                            <Card className="rounded-md border-slate-200 shadow-none">
                                <CardContent className="p-4 grid grid-cols-2 gap-3 text-sm">
                                    <Spec icon={Tag} label="แบรนด์" value={product.part.brand} />
                                    <Spec label="SKU" value={product.part.sku} />
                                    <Spec icon={Package} label="หมวดหมู่" value={product.part.category} />
                                    <Spec icon={Wrench} label="รุ่นที่ใช้ได้" value={product.part.compatibility} />
                                    <Spec label="สต็อก" value={product.part.stock > 0 ? `${product.part.stock} ชิ้น` : "สินค้าหมด"} />
                                </CardContent>
                            </Card>
                        )}

                        {/* CTA */}
                        <div className="hidden space-y-3 pt-2 sm:block">
                            {category === "part" && product.part && product.part.stock > 0 && (
                                <AddToCartButton
                                    productId={product.id}
                                    title={product.title}
                                    price={product.price}
                                    image={mainImage}
                                    sku={product.part.sku}
                                    stock={product.part.stock}
                                    className="w-full h-12"
                                />
                            )}
                            {(category === "vehicle" || category === "real_estate" || category === "part") && (
                                <ContactSellerModal
                                    productId={product.id}
                                    productTitle={product.title}
                                    productType={category}
                                />
                            )}
                        </div>
                        <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-md border border-slate-200 bg-slate-50 py-3 text-center text-[11px] text-slate-600">
                            <span>สินค้าโดย Chayapon Works</span><span>ข้อมูลตรวจสอบได้</span><span>ร้านดูแลโดยตรง</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-2 gap-2 border-t border-slate-200 bg-white/95 px-3 pt-2 pb-[max(.5rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(15,23,42,.12)] backdrop-blur-xl sm:hidden">
                {category === "part" && product.part && product.part.stock > 0 ? (
                    <AddToCartButton
                        productId={product.id}
                        title={product.title}
                        price={product.price}
                        image={mainImage}
                        sku={product.part.sku}
                        stock={product.part.stock}
                        className="h-11 w-full"
                    />
                ) : (
                    <Link href={backHref} className="inline-flex h-11 items-center justify-center rounded-md border border-blue-600 px-3 text-sm font-semibold text-blue-700">ดูสินค้าอื่น</Link>
                )}
                <ContactSellerModal productId={product.id} productTitle={product.title} productType={category} />
            </div>
        </div>
    )
}

function Spec({ icon: Icon, label, value }: { icon?: React.ComponentType<{ className?: string }>; label: string; value: string }) {
    return (
        <div className="flex items-start gap-2">
            {Icon && <Icon className="h-4 w-4 text-primary/70 mt-0.5 shrink-0" />}
            <div>
                <p className="text-muted-foreground text-xs">{label}</p>
                <p className="font-medium">{value}</p>
            </div>
        </div>
    )
}

export { transmissionLabels, fuelLabels, propertyTypeLabels }
