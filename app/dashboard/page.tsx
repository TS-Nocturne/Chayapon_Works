import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireBackOfficePage } from "@/lib/admin-auth"
import { formatNumber, formatPrice } from "@/lib/utils"
import { ArrowUpRight, CalendarDays, CircleDollarSign, ClipboardList, Clock3, MessageSquare, Package, ShoppingCart, TrendingUp, UserPlus, Users } from "lucide-react"

const toneClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600", emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600", amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
}

export default async function DashboardPage() {
    const session = await requireBackOfficePage()
    const [productCount, userCount, orderCount, pendingOrders, newLeads, completedRevenue, vehicleCount, propertyCount, partCount, recentOrders, recentLeads] = await Promise.all([
        prisma.product.count(), prisma.user.count(), prisma.order.count(),
        prisma.order.count({ where: { status: "pending" } }),
        prisma.contactLead.count({ where: { status: "new" } }),
        prisma.order.aggregate({ where: { status: "completed" }, _sum: { totalAmount: true } }),
        prisma.product.count({ where: { productType: "vehicle" } }),
        prisma.product.count({ where: { productType: "real_estate" } }),
        prisma.product.count({ where: { productType: "part" } }),
        prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 4, select: { id: true, status: true, totalAmount: true, createdAt: true, user: { select: { name: true } } } }),
        prisma.contactLead.findMany({ orderBy: { createdAt: "desc" }, take: 4, select: { id: true, name: true, status: true, createdAt: true, product: { select: { title: true } } } }),
    ])

    if (session.user.role === "STAFF") {
        return <StaffDashboard name={session.user.name} pendingOrders={pendingOrders} newLeads={newLeads} recentLeads={recentLeads} recentOrders={recentOrders} />
    }

    const revenue = completedRevenue._sum.totalAmount || 0
    const stats = [
        { label: "รายได้รวม", value: formatPrice(revenue), note: "จากคำสั่งซื้อที่สำเร็จ", icon: CircleDollarSign, tone: "blue" },
        { label: "คำสั่งซื้อ", value: formatNumber(orderCount), note: `${pendingOrders} รายการรอดำเนินการ`, icon: ShoppingCart, tone: "emerald" },
        { label: "Leads ใหม่", value: formatNumber(newLeads), note: "รอการติดต่อกลับ", icon: MessageSquare, tone: "violet" },
        { label: "รายการสินค้า", value: formatNumber(productCount), note: "ในแค็ตตาล็อกทั้งหมด", icon: Package, tone: "amber" },
        { label: "ผู้ใช้งาน", value: formatNumber(userCount), note: "บัญชีในระบบ", icon: Users, tone: "indigo" },
    ]
    const totalCategory = Math.max(vehicleCount + propertyCount + partCount, 1)
    const vehiclePct = Math.round(vehicleCount / totalCategory * 100)
    const propertyPct = Math.round(propertyCount / totalCategory * 100)
    const chart = [22, 34, 30, 48, 42, 61, 54, 72, 63, 82, 74, 91]

    return <div className="space-y-5 text-slate-950">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-sm font-medium text-blue-700">ADMIN DASHBOARD</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">สวัสดีครับ คุณ{session.user.name}</h1><p className="mt-1 text-sm text-slate-500">นี่คือภาพรวมธุรกิจและรายการสำคัญที่ต้องจัดการวันนี้</p></div>
            <span className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">ข้อมูลปัจจุบัน</span>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((stat) => { const Icon = stat.icon; return <article key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_3px_15px_rgba(15,23,42,.04)]">
                <div className="flex items-start justify-between"><div><p className="text-sm text-slate-500">{stat.label}</p><p className="mt-1 text-2xl font-bold tracking-tight">{stat.value}</p></div><span className={`grid h-11 w-11 place-items-center rounded-full ${toneClasses[stat.tone]}`}><Icon className="h-5 w-5" /></span></div>
                <p className="mt-3 flex items-center gap-1 text-[11px] text-slate-500"><TrendingUp className="h-3 w-3 text-emerald-600" />{stat.note}</p>
            </article> })}
        </section>

        <section id="analytics" className="grid gap-4 xl:grid-cols-[1.35fr_.85fr]">
            <article id="revenue" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between"><div><h2 className="font-semibold">แนวโน้มธุรกิจ</h2><p className="mt-1 text-xs text-slate-500">ภาพรวมกิจกรรมในช่วงล่าสุด</p></div><span className="rounded-md border border-slate-200 px-3 py-2 text-xs">รายวัน</span></div>
                <div className="mt-6 flex h-56 items-end gap-2 border-b border-l border-slate-200 px-3 pt-5 sm:gap-4">
                    {chart.map((height, index) => <div key={index} className="group relative flex h-full flex-1 items-end"><div className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400 transition hover:from-blue-700" style={{ height: `${height}%` }} /><span className="absolute -bottom-5 left-1/2 hidden -translate-x-1/2 text-[9px] text-slate-400 sm:block">{index + 1}</span></div>)}
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4"><div><p className="text-xs text-slate-500">รายได้สำเร็จ</p><p className="mt-1 text-lg font-bold">{formatPrice(revenue)}</p></div><div><p className="text-xs text-slate-500">คำสั่งซื้อทั้งหมด</p><p className="mt-1 text-lg font-bold">{formatNumber(orderCount)}</p></div></div>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold">สัดส่วนสินค้าตามหมวดธุรกิจ</h2><div className="mt-6 flex flex-col items-center gap-7 sm:flex-row xl:flex-col 2xl:flex-row">
                    <div className="relative grid h-44 w-44 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#2563eb 0 ${vehiclePct}%, #60a5fa ${vehiclePct}% ${vehiclePct + propertyPct}%, #93c5fd ${vehiclePct + propertyPct}% 100%)` }}><div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center"><div><p className="text-xs text-slate-500">สินค้าทั้งหมด</p><p className="text-2xl font-bold">{formatNumber(productCount)}</p></div></div></div>
                    <div className="w-full space-y-4 text-sm"><Legend color="bg-blue-600" label="รถยนต์มือสอง" value={vehicleCount} /><Legend color="bg-blue-400" label="อสังหาริมทรัพย์" value={propertyCount} /><Legend color="bg-blue-200" label="อะไหล่รถยนต์" value={partCount} /></div>
                </div>
            </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">รายการที่ต้องจัดการ</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Task href="/dashboard/orders" icon={ShoppingCart} value={pendingOrders} label="คำสั่งซื้อรอตรวจสอบ" tone="blue" />
                <Task href="/dashboard/leads" icon={MessageSquare} value={newLeads} label="Leads รอการติดต่อ" tone="emerald" />
                <Task href="/dashboard/products" icon={Package} value={productCount} label="รายการสินค้า" tone="amber" />
                <Task href="/dashboard/users" icon={UserPlus} value={userCount} label="บัญชีผู้ใช้งาน" tone="violet" />
            </div></article>
            <article id="activity" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold">Activity ล่าสุด</h2><Link href="/dashboard/orders" className="text-xs font-semibold text-blue-700">ดูทั้งหมด</Link></div><div className="mt-3 divide-y divide-slate-100">
                {recentOrders.slice(0, 2).map((order) => <ActivityRow key={order.id} icon={ShoppingCart} title={`คำสั่งซื้อจาก ${order.user?.name || "Guest"}`} detail={`${formatPrice(order.totalAmount)} · ${order.status}`} date={order.createdAt} />)}
                {recentLeads.slice(0, 3).map((lead) => <ActivityRow key={lead.id} icon={MessageSquare} title={`Lead: ${lead.name}`} detail={lead.product.title} date={lead.createdAt} />)}
                {!recentOrders.length && !recentLeads.length && <p className="py-10 text-center text-sm text-slate-400">ยังไม่มีกิจกรรมล่าสุด</p>}
            </div></article>
        </section>
    </div>
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) { return <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${color}`} /><span className="text-slate-600">{label}</span><strong className="ml-auto">{formatNumber(value)}</strong></div> }
function Task({ href, icon: Icon, value, label, tone }: { href: string; icon: React.ComponentType<{ className?: string }>; value: number; label: string; tone: string }) { return <Link href={href} className="group rounded-lg border border-slate-200 p-4 transition hover:border-blue-300 hover:shadow-sm"><div className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-full ${toneClasses[tone]}`}><Icon className="h-5 w-5" /></span><ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600" /></div><p className="mt-4 text-2xl font-bold text-blue-700">{formatNumber(value)}</p><p className="mt-1 text-xs text-slate-500">{label}</p></Link> }
function ActivityRow({ icon: Icon, title, detail, date }: { icon: React.ComponentType<{ className?: string }>; title: string; detail: string; date: Date }) { return <div className="flex items-center gap-3 py-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-700"><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-medium">{title}</p><p className="truncate text-xs text-slate-500">{detail}</p></div><time className="ml-auto shrink-0 text-[10px] text-slate-400">{date.toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</time></div> }

function StaffDashboard({ name, pendingOrders, newLeads, recentLeads, recentOrders }: { name: string; pendingOrders: number; newLeads: number; recentLeads: { id: string; name: string; status: string; createdAt: Date; product: { title: string } }[]; recentOrders: { id: string; status: string; totalAmount: number; createdAt: Date; user: { name: string } | null }[] }) {
    return <div className="space-y-5"><section><p className="text-sm font-semibold text-blue-700">TODAY&apos;S OPERATIONS</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">สวัสดีครับ คุณ{name}</h1><p className="mt-1 text-sm text-slate-500">งานสำคัญและลูกค้าที่ต้องดูแลในวันนี้</p></section>
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><OperationCard icon={MessageSquare} label="ต้องโทรกลับ" value={newLeads} tone="emerald" /><OperationCard icon={CalendarDays} label="นัดหมายล่าสุด" value={recentLeads.length} tone="amber" /><OperationCard icon={UserPlus} label="Lead ใหม่" value={newLeads} tone="violet" /><OperationCard icon={ClipboardList} label="งานค้าง" value={pendingOrders} tone="blue" /></section>
        <section className="grid gap-4 xl:grid-cols-[.85fr_1.15fr]"><article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold">ตารางงานวันนี้</h2><Link href="/dashboard/leads" className="text-xs font-semibold text-blue-700">ดูทั้งหมด</Link></div><div className="mt-4 divide-y divide-slate-100">{recentLeads.map((lead, index) => <div key={lead.id} className="grid grid-cols-[48px_1fr_auto] items-center gap-3 py-3"><time className="text-xs font-semibold">{String(9 + index * 2).padStart(2, "0")}:00</time><div><p className="text-sm font-medium">ติดต่อลูกค้า {lead.name}</p><p className="text-xs text-slate-500">{lead.product.title}</p></div><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">รอติดต่อ</span></div>)}</div></article>
            <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">สถานะงานแบบเรียลไทม์</h2><div className="mt-5 grid gap-3 sm:grid-cols-3"><StatusBox value={newLeads} label="รอติดต่อ" color="amber" /><StatusBox value={recentLeads.filter((lead) => lead.status === "contacted").length} label="ติดต่อแล้ว" color="blue" /><StatusBox value={recentOrders.filter((order) => order.status === "completed").length} label="เสร็จสิ้น" color="emerald" /></div><div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">เลือกเมนู “ลูกค้าและการนัดหมาย” เพื่อดูรายละเอียดและอัปเดตสถานะได้ทันที</div></article>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold">ลูกค้าที่ต้องติดตาม</h2><Link href="/dashboard/leads" className="text-xs font-semibold text-blue-700">ดูลูกค้าทั้งหมด</Link></div><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-y border-slate-200 bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">ลูกค้า</th><th className="p-3">สนใจสินค้า</th><th className="p-3">ติดต่อครั้งล่าสุด</th><th className="p-3">สถานะ</th><th className="p-3 text-right">จัดการ</th></tr></thead><tbody className="divide-y divide-slate-100">{recentLeads.map((lead) => <tr key={lead.id}><td className="p-3 font-medium">{lead.name}</td><td className="p-3 text-slate-600">{lead.product.title}</td><td className="p-3 text-slate-500">{lead.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</td><td className="p-3"><span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">{lead.status}</span></td><td className="p-3 text-right"><Link href="/dashboard/leads" className="rounded-md border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-700">เปิดข้อมูลลูกค้า</Link></td></tr>)}</tbody></table></div></section>
    </div>
}

function OperationCard({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone: string }) { return <article className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${toneClasses[tone]}`}><Icon className="h-6 w-6" /></span><div><p className="text-sm text-slate-600">{label}</p><p className="text-2xl font-bold">{value} <span className="text-sm font-medium">รายการ</span></p></div></article> }
function StatusBox({ value, label, color }: { value: number; label: string; color: string }) { return <div className="rounded-lg border border-slate-200 p-4 text-center"><span className={`mx-auto grid h-10 w-10 place-items-center rounded-full ${toneClasses[color]}`}><Clock3 className="h-5 w-5" /></span><p className="mt-3 text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div> }
