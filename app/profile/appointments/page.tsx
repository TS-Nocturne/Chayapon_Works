import Link from "next/link"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { CalendarDays, ExternalLink, MessageCircle, Phone } from "lucide-react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPublicStoreSettings } from "@/lib/store-settings"
import ProductImage from "@/components/ProductImage"
import ProfileNavigation from "../ProfileNavigation"

export const metadata = { title: "การนัดหมายของฉัน" }

export default async function AppointmentsPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) redirect("/sign-in?callbackUrl=%2Fprofile%2Fappointments")
    const [appointments, store] = await Promise.all([
        prisma.contactLead.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            include: { product: { select: { id: true, title: true, images: true, productType: true } } },
        }),
        getPublicStoreSettings(),
    ])

    return <main className="min-h-screen bg-slate-50 py-6 sm:py-8"><div className="market-shell grid gap-5 lg:grid-cols-[220px_1fr]">
        <ProfileNavigation />
        <div className="space-y-5">
            <section><p className="text-sm font-semibold text-blue-700">MY APPOINTMENTS</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">การนัดหมายของฉัน</h1><p className="mt-1 text-sm text-slate-500">ตรวจสอบรายการนัดดูรถหรืออสังหาริมทรัพย์ และติดต่อร้านได้ทันที</p></section>

            {appointments.length ? <div className="space-y-4">{appointments.map((appointment) => {
                const detailHref = appointment.product.productType === "real_estate" ? `/real-estate/${appointment.product.id}` : appointment.product.productType === "part" ? `/parts/${appointment.product.id}` : `/vehicles/${appointment.product.id}`
                return <article key={appointment.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row">
                        <span className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:w-44">{appointment.product.images[0] ? <ProductImage src={appointment.product.images[0]} alt={appointment.product.title} fill sizes="176px" className="object-cover" /> : <CalendarDays className="m-auto h-10 w-10 text-slate-300" />}</span>
                        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="font-semibold sm:text-lg">{appointment.product.title}</h2><p className="mt-1 text-xs text-slate-500">ส่งคำขอเมื่อ {appointment.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{appointment.status}</span></div>
                            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">วันที่สะดวก</p><p className="mt-1 font-medium">{appointment.preferredDate || "รอเจ้าหน้าที่ติดต่อยืนยัน"}</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">เบอร์ที่ใช้ติดต่อ</p><p className="mt-1 font-medium">{appointment.phone}</p></div></div>
                            <div className="mt-4 flex flex-wrap gap-2"><Link href={detailHref} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 px-4 text-xs font-semibold text-slate-700">ดูสินค้า<ExternalLink className="h-3.5 w-3.5" /></Link>{store.contactPhone && <a href={`tel:${store.contactPhone}`} className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-xs font-semibold text-white"><Phone className="h-4 w-4" />โทรหาร้าน</a>}{store.lineUrl && <a href={store.lineUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-md bg-[#06C755] px-4 text-xs font-semibold text-white"><MessageCircle className="h-4 w-4" />ติดต่อผ่าน LINE</a>}</div>
                            {!store.lineUrl && <p className="mt-3 text-xs text-amber-700">ร้านยังไม่ได้ตั้งค่า LINE กรุณาติดต่อด้วยแบบฟอร์มหรือเบอร์โทรของร้าน</p>}
                        </div>
                    </div>
                </article>
            })}</div> : <section className="rounded-xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm"><CalendarDays className="mx-auto h-12 w-12 text-slate-300" /><h2 className="mt-4 font-semibold">ยังไม่มีการนัดหมาย</h2><p className="mt-1 text-sm text-slate-500">เลือกดูรถหรืออสังหาริมทรัพย์ แล้วส่งคำขอนัดหมายได้จากหน้าสินค้า</p><Link href="/vehicles" className="mt-5 inline-flex rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white">เลือกดูสินค้า</Link></section>}
        </div>
    </div></main>
}
