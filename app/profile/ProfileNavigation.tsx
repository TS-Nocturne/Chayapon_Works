"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, Home, Settings, ShoppingBag } from "lucide-react"

const links = [
    { href: "/profile", label: "ภาพรวม", icon: Home, exact: true },
    { href: "/orders", label: "คำสั่งซื้อ", icon: ShoppingBag },
    { href: "/profile/appointments", label: "การนัดหมาย", icon: CalendarDays },
    { href: "/profile/personal-information", label: "ข้อมูลส่วนตัว", icon: Settings },
]

export default function ProfileNavigation() {
    const pathname = usePathname()
    return <>
        <aside className="hidden self-start rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:block">
            <p className="px-3 py-3 text-sm font-bold">บัญชีของฉัน</p>
            <nav className="space-y-1" aria-label="เมนูบัญชี">
                {links.map((link) => <ProfileLink key={link.href} {...link} active={link.exact ? pathname === link.href : pathname.startsWith(link.href)} />)}
            </nav>
        </aside>
        <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden" aria-label="เมนูบัญชีมือถือ">
            {links.map((link) => { const Icon = link.icon; const active = link.exact ? pathname === link.href : pathname.startsWith(link.href); return <Link key={link.href} href={link.href} className={`flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-semibold ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}><Icon className="h-4 w-4" />{link.label}</Link> })}
        </nav>
    </>
}

function ProfileLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; active: boolean }) {
    return <Link href={href} className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm ${active ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}><Icon className="h-4 w-4" />{label}</Link>
}
