import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireAdminPage } from "@/lib/admin-auth"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Activity, Plus, Search, Shield, User, UserCheck, Users } from "lucide-react"
import UserRoleActions from "./UserRoleActions"
import ProductImage from "@/components/ProductImage"

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
    await requireAdminPage("/dashboard/users")
    const params = await searchParams
    const q = params.q?.trim() || ""
    const role = params.role || ""
    const users = await prisma.user.findMany({
        where: {
            ...(role ? { role } : {}),
            ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phoneNumber: { contains: q } }] } : {}),
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, phoneNumber: true, role: true, image: true, createdAt: true, sessions: { orderBy: { updatedAt: "desc" }, take: 1, select: { updatedAt: true } } },
    })
    const [allCount, adminCount, staffCount, customerCount] = await Promise.all([
        prisma.user.count(), prisma.user.count({ where: { role: "ADMIN" } }), prisma.user.count({ where: { role: "STAFF" } }), prisma.user.count({ where: { role: "USER" } }),
    ])

    return <div className="space-y-5">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-blue-700">MANAGEMENT</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">ผู้ใช้งานและพนักงาน</h1><p className="mt-1 text-sm text-slate-500">จัดการบัญชี บทบาท และตรวจสอบการใช้งานล่าสุด</p></div><Link href="/sign-up" className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" />เพิ่มผู้ใช้งาน</Link></section>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Summary icon={Users} label="ผู้ใช้ทั้งหมด" value={allCount} color="blue" />
            <Summary icon={Shield} label="Admin" value={adminCount} color="violet" />
            <Summary icon={UserCheck} label="Staff" value={staffCount} color="emerald" />
            <Summary icon={User} label="Customer" value={customerCount} color="amber" />
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <form className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-[1fr_180px_auto]">
                <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input name="q" defaultValue={q} className="h-10 w-full rounded-md border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-blue-500" placeholder="ค้นหาชื่อ อีเมล หรือเบอร์โทร" /></label>
                <select name="role" defaultValue={role} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"><option value="">ทุกบทบาท</option><option value="ADMIN">Admin</option><option value="STAFF">Staff</option><option value="USER">Customer</option></select>
                <button className="h-10 rounded-md border border-blue-600 px-5 text-sm font-semibold text-blue-700 hover:bg-blue-50">ค้นหา</button>
            </form>
            <div className="overflow-x-auto"><Table>
                <TableHeader><TableRow className="bg-slate-50/80"><TableHead>ผู้ใช้งาน</TableHead><TableHead>Role</TableHead><TableHead className="hidden md:table-cell">สถานะ</TableHead><TableHead className="hidden lg:table-cell">Last Active</TableHead><TableHead className="hidden xl:table-cell">วันที่สร้าง</TableHead><TableHead className="text-right">จัดการ</TableHead></TableRow></TableHeader>
                <TableBody>{users.map((user) => { const lastActive = user.sessions[0]?.updatedAt; return <TableRow key={user.id}>
                    <TableCell><div className="flex items-center gap-3"><span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-50">{user.image ? <ProductImage src={user.image} alt="" fill sizes="36px" className="object-cover" /> : <User className="h-4 w-4 text-blue-700" />}</span><div className="min-w-0"><p className="max-w-52 truncate text-sm font-semibold">{user.name}</p><p className="max-w-52 truncate text-xs text-slate-500">{user.email}</p></div></div></TableCell>
                    <TableCell><RoleBadge role={user.role} /></TableCell>
                    <TableCell className="hidden md:table-cell"><span className="inline-flex items-center gap-1.5 text-xs text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />Active</span></TableCell>
                    <TableCell className="hidden text-xs text-slate-500 lg:table-cell">{lastActive ? lastActive.toLocaleString("th-TH", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "ยังไม่เคยเข้าสู่ระบบ"}</TableCell>
                    <TableCell className="hidden text-xs text-slate-500 xl:table-cell">{user.createdAt.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                    <TableCell className="text-right"><UserRoleActions userId={user.id} currentRole={user.role} userName={user.name} /></TableCell>
                </TableRow> })}{!users.length && <TableRow><TableCell colSpan={6} className="py-16 text-center text-sm text-slate-400">ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไข</TableCell></TableRow>}</TableBody>
            </Table></div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Activity className="h-5 w-5 text-blue-600" /><h2 className="font-semibold">กิจกรรมบัญชีล่าสุด</h2></div><div className="mt-4 divide-y divide-slate-100">{users.slice(0, 4).map((user) => <div key={user.id} className="grid gap-1 py-3 text-sm sm:grid-cols-[1fr_1fr_auto]"><span className="font-medium">{user.name}</span><span className="text-slate-500">สร้างบัญชีในระบบ</span><time className="text-xs text-slate-400">{user.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</time></div>)}</div></section>
    </div>
}

const summaryTones: Record<string, string> = { blue: "bg-blue-50 text-blue-600", violet: "bg-violet-50 text-violet-600", emerald: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600" }
function Summary({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; color: string }) { return <article className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${summaryTones[color]}`}><Icon className="h-5 w-5" /></span><div><p className="text-xs text-slate-500">{label}</p><p className="text-2xl font-bold">{value.toLocaleString("th-TH")}</p></div></article> }
function RoleBadge({ role }: { role: string }) { if (role === "ADMIN") return <Badge className="border-0 bg-red-50 text-[10px] text-red-600">ADMIN</Badge>; if (role === "STAFF") return <Badge className="border-0 bg-emerald-50 text-[10px] text-emerald-700">STAFF</Badge>; return <Badge variant="outline" className="text-[10px] text-slate-600">CUSTOMER</Badge> }
