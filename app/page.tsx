import Link from "next/link"
import { ArrowRight, BadgeCheck, CreditCard, Headphones, ShieldCheck } from "lucide-react"
import { prisma } from "@/lib/prisma"
import HomeVehicleDiscovery from "@/components/HomeVehicleDiscovery"
import VehicleCard from "@/app/vehicles/VehicleCard"
import RealEstateCard from "@/app/real-estate/RealEstateCard"
import PartCard from "@/app/parts/PartCard"
import StructuredData from "@/components/StructuredData"
import { absoluteUrl, DEFAULT_DESCRIPTION, SITE_NAME } from "@/lib/seo"

export default async function HomePage() {
    const [vehicles, properties, parts, brands, vehicleCount] = await Promise.all([
        prisma.product.findMany({
            where: { productType: "vehicle", status: "active" },
            include: { vehicle: { include: { brand: true, model: true } } },
            orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
            take: 4,
        }),
        prisma.product.findMany({
            where: { productType: "real_estate", status: "active" },
            include: { realEstate: true },
            orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
            take: 4,
        }),
        prisma.product.findMany({
            where: { productType: "part", status: "active" },
            include: { part: true },
            orderBy: [{ featured: "desc" }, { views: "desc" }],
            take: 4,
        }),
        prisma.vehicleBrand.findMany({
            include: { models: { orderBy: { name: "asc" } }, _count: { select: { vehicles: true } } },
            orderBy: { name: "asc" },
        }),
        prisma.product.count({ where: { productType: "vehicle", status: "active" } }),
    ])

    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: absoluteUrl("/"),
        description: DEFAULT_DESCRIPTION,
    }
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: absoluteUrl("/"),
        inLanguage: "th-TH",
    }

    return (
        <main className="min-h-screen bg-white text-slate-950">
            <StructuredData data={[organizationSchema, websiteSchema]} />
            <HomeVehicleDiscovery brands={brands} vehicleCount={vehicleCount} />

            <div className="market-shell space-y-8 py-7 sm:space-y-12 sm:py-12">
                {vehicles.length > 0 && (
                    <ProductSection title="รถยนต์มือสองแนะนำ" href="/vehicles" description="รถของร้านผ่านการตรวจสอบ พร้อมข้อมูลสำคัญครบถ้วน">
                        {vehicles.map((product) => <VehicleCard key={product.id} product={product} />)}
                    </ProductSection>
                )}

                {properties.length > 0 && (
                    <ProductSection title="อสังหาริมทรัพย์แนะนำ" href="/real-estate" description="บ้าน คอนโด และที่ดินทำเลดีที่ร้านคัดสรร พร้อมข้อมูลตรวจสอบได้">
                        {properties.map((product) => <RealEstateCard key={product.id} product={product} />)}
                    </ProductSection>
                )}

                {parts.length > 0 && (
                    <ProductSection title="อะไหล่รถยนต์ยอดนิยม" href="/parts" description="สินค้าจากสต็อกของร้าน เลือกซื้อและชำระเงินได้ทันที">
                        {parts.map((product) => <PartCard key={product.id} product={product} />)}
                    </ProductSection>
                )}
            </div>

            <section id="about-store" className="scroll-mt-20 border-y border-slate-200 bg-slate-50">
                <div className="market-shell grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                    <TrustItem icon={ShieldCheck} title="รับประกันโดยร้าน" description="Chayapon Works ดูแลสินค้าทุกชิ้น" />
                    <TrustItem icon={BadgeCheck} title="สินค้าคุณภาพ" description="ข้อมูลครบและตรงตามมาตรฐาน" />
                    <TrustItem icon={CreditCard} title="ชำระเงินปลอดภัย" description="ระบบชำระเงินได้มาตรฐาน" />
                    <TrustItem icon={Headphones} title="บริการช่วยเหลือลูกค้า" description="พร้อมดูแลทุกขั้นตอน" />
                </div>
            </section>

            <footer className="bg-slate-950 py-10 text-white">
                <div className="market-shell grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
                    <div><p className="text-xl font-black tracking-tight"><span className="text-blue-500">Chayapon</span> Works</p><p className="mt-3 max-w-md text-sm leading-6 text-slate-400">แพลตฟอร์มซื้อขายรถยนต์ อสังหาริมทรัพย์ และอะไหล่รถยนต์ที่ใช้งานง่ายและเชื่อถือได้</p></div>
                    <div><p className="text-sm font-semibold">เลือกซื้อสินค้า</p><div className="mt-3 space-y-2 text-sm text-slate-400"><Link className="block hover:text-white" href="/vehicles">รถยนต์มือสอง</Link><Link className="block hover:text-white" href="/real-estate">อสังหาริมทรัพย์</Link><Link className="block hover:text-white" href="/parts">อะไหล่รถยนต์</Link></div></div>
                    <div><p className="text-sm font-semibold">บริการลูกค้า</p><div className="mt-3 space-y-2 text-sm text-slate-400"><Link className="block hover:text-white" href="/sign-in">เข้าสู่ระบบ</Link><Link className="block hover:text-white" href="/orders">ติดตามคำสั่งซื้อ</Link><Link className="block hover:text-white" href="/about">เกี่ยวกับร้าน</Link><Link className="block hover:text-white" href="/terms">ข้อกำหนดการใช้งาน</Link><Link className="block hover:text-white" href="/privacy">นโยบายความเป็นส่วนตัว</Link></div></div>
                </div>
            </footer>
        </main>
    )
}

function ProductSection({ title, description, href, children }: { title: string; description: string; href: string; children: React.ReactNode }) {
    return (
        <section>
            <div className="mb-5 flex items-end justify-between gap-4">
                <div><h2 className="market-section-title">{title}</h2><p className="mt-1 hidden text-sm text-slate-500 sm:block">{description}</p></div>
                <Link href={href} className="flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-700 hover:underline">ดูทั้งหมด <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
        </section>
    )
}

function TrustItem({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
    return <div className="flex items-center gap-4 px-6 py-6"><Icon className="h-8 w-8 shrink-0 stroke-[1.5] text-blue-600" /><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-slate-500">{description}</p></div></div>
}
