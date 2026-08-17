import Link from "next/link"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatPrice } from "@/lib/utils"
import { CalendarDays, ChevronRight, Package, Search, Star } from "lucide-react"
import ProductImage from "@/components/ProductImage"
import ProfileForm from "./ProfileForm"
import ProfileNavigation from "./ProfileNavigation"
import LegacyProfileHashRedirect from "./LegacyProfileHashRedirect"

export default async function ProfilePage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) redirect("/sign-in")
    const [orders, appointments] = await Promise.all([
        prisma.order.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 3, include: { items: { include: { product: { select: { title: true, images: true } } } } } }),
        prisma.contactLead.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 3, include: { product: { select: { title: true, images: true, productType: true } } } }),
    ])
    const memberPoints = orders.reduce((sum, order) => sum + Math.floor(order.totalAmount / 100), 0)

    return <main className="min-h-screen bg-slate-50 py-6 sm:py-8"><LegacyProfileHashRedirect /><div className="market-shell grid gap-5 lg:grid-cols-[220px_1fr]">
        <ProfileNavigation />
        <div className="space-y-5">
            <section className="grid gap-4 xl:grid-cols-[1fr_260px]"><div><p className="text-sm font-semibold text-blue-700">MY ACCOUNT</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">สวัสดีครับ คุณ{session.user.name}</h1><p className="mt-1 text-sm text-slate-500">กลับมาจัดการคำสั่งซื้อ นัดหมาย และสินค้าที่คุณสนใจได้จากที่เดียว</p><form action="/vehicles" className="relative mt-5 max-w-2xl"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input name="q" className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-28 text-sm outline-none focus:border-blue-500" placeholder="ค้นหารถ บ้าน หรืออะไหล่ต่อไหม?" /><button className="absolute right-1.5 top-1.5 h-8 rounded-md bg-blue-600 px-5 text-xs font-semibold text-white">ค้นหา</button></form></div>
                <article className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5"><div className="flex items-center gap-2 text-amber-700"><Star className="h-5 w-5 fill-amber-400 text-amber-400" /><span className="text-sm font-bold">CHAYAPON WORKS MEMBER</span></div><p className="mt-4 text-3xl font-bold">{memberPoints.toLocaleString("th-TH")} <span className="text-sm font-medium">คะแนน</span></p><p className="mt-2 text-xs text-slate-500">สะสมจากคำสั่งซื้ออะไหล่ที่สำเร็จ</p><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-2/3 rounded-full bg-amber-400" /></div></article>
            </section>

            <section id="appointments" className="grid gap-4 xl:grid-cols-2"><AccountPanel title="คำสั่งซื้ออะไหล่ของฉัน" href="/orders">
                {orders.map((order) => <Link href={`/orders/${order.id}`} key={order.id} className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"><span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-slate-50">{order.items[0]?.product.images[0] ? <ProductImage src={order.items[0].product.images[0]} alt="" fill sizes="64px" className="object-contain p-1" /> : <Package className="m-5 h-6 w-6 text-slate-400" />}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{order.items[0]?.product.title || `คำสั่งซื้อ #${order.id.slice(-8)}`}</p><p className="mt-1 text-xs text-slate-500">{order.createdAt.toLocaleDateString("th-TH", { dateStyle: "medium" })}</p><p className="mt-1 text-sm font-bold text-blue-700">{formatPrice(order.totalAmount)}</p></div><span className="ml-auto rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">{order.status}</span></Link>)}
                {!orders.length && <Empty text="ยังไม่มีคำสั่งซื้ออะไหล่" href="/parts" action="เลือกซื้ออะไหล่" />}
            </AccountPanel>
            <AccountPanel title="การนัดหมายของฉัน" href="/profile/appointments">
                {appointments.map((lead) => <div key={lead.id} className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0"><span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md bg-slate-50">{lead.product.images[0] ? <ProductImage src={lead.product.images[0]} alt="" fill sizes="80px" className="object-cover" /> : <CalendarDays className="m-5 h-6 w-6 text-slate-400" />}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{lead.product.title}</p><p className="mt-1 text-xs text-slate-500">{lead.preferredDate || "รอเจ้าหน้าที่ติดต่อยืนยันเวลา"}</p></div><span className="ml-auto rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">{lead.status}</span></div>)}
                {!appointments.length && <Empty text="ยังไม่มีการนัดดูรถหรืออสังหาริมทรัพย์" href="/vehicles" action="เลือกดูสินค้า" />}
            </AccountPanel></section>

            <details id="personal-information" className="rounded-xl border border-slate-200 bg-white shadow-sm"><summary className="cursor-pointer list-none p-5 font-semibold">ข้อมูลส่วนตัวและการติดต่อ <span className="float-right text-sm font-medium text-blue-700">แก้ไขข้อมูล</span></summary><div className="border-t border-slate-100 p-5"><ProfileForm user={session.user} /></div></details>
        </div>
    </div></main>
}

function AccountPanel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) { return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold">{title}</h2><Link href={href} className="flex items-center text-xs font-semibold text-blue-700">ดูทั้งหมด<ChevronRight className="h-4 w-4" /></Link></div><div className="mt-3">{children}</div></article> }
function Empty({ text, href, action }: { text: string; href: string; action: string }) { return <div className="py-10 text-center"><p className="text-sm text-slate-500">{text}</p><Link href={href} className="mt-3 inline-flex rounded-md border border-blue-600 px-4 py-2 text-xs font-semibold text-blue-700">{action}</Link></div> }
