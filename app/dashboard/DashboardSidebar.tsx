"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, BarChart3, ChevronLeft, CircleDollarSign, LayoutDashboard, Menu, MessageSquare, Package, Search, Settings, ShieldCheck, ShoppingCart, Store, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; exact?: boolean }
type NavGroup = { label: string; items: NavItem[] }

const ADMIN_GROUPS: NavGroup[] = [
    { label: "MAIN", items: [{ href: "/dashboard", label: "ภาพรวมธุรกิจ", icon: LayoutDashboard, exact: true }] },
    { label: "MANAGEMENT", items: [
        { href: "/dashboard/products", label: "รายการสินค้า", icon: Package },
        { href: "/dashboard/orders", label: "คำสั่งซื้อ", icon: ShoppingCart },
        { href: "/dashboard/leads", label: "ลูกค้าและการนัดหมาย", icon: MessageSquare },
        { href: "/dashboard/users", label: "ผู้ใช้งานและพนักงาน", icon: Users },
    ] },
    { label: "ANALYTICS", items: [
        { href: "/dashboard#analytics", label: "Analytics", icon: BarChart3 },
        { href: "/dashboard#revenue", label: "รายได้", icon: CircleDollarSign },
        { href: "/dashboard#activity", label: "Activity Log", icon: Activity },
    ] },
    { label: "SETTINGS", items: [
        { href: "/dashboard/settings", label: "ตั้งค่าร้านค้า", icon: Settings },
        { href: "/profile", label: "โปรไฟล์และบัญชี", icon: Settings },
        { href: "/", label: "ดูหน้าร้าน", icon: Store },
    ] },
]

const STAFF_GROUPS: NavGroup[] = [
    { label: "MAIN", items: [{ href: "/dashboard", label: "งานวันนี้", icon: LayoutDashboard, exact: true }] },
    { label: "WORK", items: [
        { href: "/dashboard/leads", label: "ลูกค้าและการนัดหมาย", icon: MessageSquare },
        { href: "/dashboard/orders", label: "คำสั่งซื้อ", icon: ShoppingCart },
    ] },
    { label: "ACCOUNT", items: [
        { href: "/profile", label: "โปรไฟล์ของฉัน", icon: Settings },
        { href: "/", label: "ดูหน้าร้าน", icon: Store },
    ] },
]

interface DashboardSidebarProps { userName: string; userRole: string; userImage?: string | null }

function SidebarContent({ userName, userRole, userImage, onNavigate }: DashboardSidebarProps & { onNavigate?: () => void }) {
    const pathname = usePathname()
    const groups = userRole === "STAFF" ? STAFF_GROUPS : ADMIN_GROUPS
    return <div className="flex h-full flex-col bg-gradient-to-b from-[#061a36] to-[#032b5b] text-white">
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
            <Link href="/dashboard" onClick={onNavigate} className="text-xl font-black tracking-[-0.04em]"><span className="text-blue-400">Chayapon</span> Works</Link>
            <ChevronLeft className="h-5 w-5 text-white/70" />
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
            {groups.map((group) => <div key={group.label}>
                <p className="mb-2 px-3 text-[10px] font-semibold tracking-[.12em] text-slate-400">{group.label}</p>
                <div className="space-y-1">{group.items.map((item) => {
                    const Icon = item.icon
                    const path = item.href.split("#")[0]
                    const active = item.exact ? pathname === item.href : path !== "/dashboard" && pathname.startsWith(path)
                    return <Link key={item.href} href={item.href} onClick={onNavigate} className={cn("flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white", active && "bg-blue-600 text-white shadow-lg shadow-blue-950/30")}><Icon className="h-[18px] w-[18px]" />{item.label}</Link>
                })}</div>
            </div>)}
        </nav>
        <div className="border-t border-white/10 p-3"><div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-500/20">{userImage ? <Image src={userImage} alt="" fill sizes="40px" className="object-cover" unoptimized /> : <ShieldCheck className="h-5 w-5 text-blue-300" />}</span>
            <div className="min-w-0"><p className="truncate text-sm font-semibold">{userName}</p><span className={cn("mt-1 inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold", userRole === "STAFF" ? "bg-emerald-500" : "bg-red-500")}>{userRole}</span></div>
        </div></div>
    </div>
}

export default function DashboardSidebar(props: DashboardSidebarProps) {
    const [open, setOpen] = useState(false)
    return <>
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block"><SidebarContent {...props} /></aside>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl lg:fixed lg:left-64 lg:right-0 lg:px-7">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden"><Menu className="h-5 w-5" /></Button></SheetTrigger>
                <SheetContent side="left" className="w-72 border-0 p-0"><SheetHeader className="sr-only"><SheetTitle>เมนูหลังบ้าน</SheetTitle></SheetHeader><SidebarContent {...props} onNavigate={() => setOpen(false)} /></SheetContent>
            </Sheet>
            <Link href="/dashboard" className="text-base font-black tracking-tight lg:hidden"><span className="text-blue-700">Chayapon</span> Works</Link>
            <form action="/dashboard/products" className="relative hidden max-w-md flex-1 items-center lg:flex"><Search className="absolute left-3 h-4 w-4 text-slate-400" /><input name="q" className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-blue-500" placeholder="ค้นหาสินค้าในระบบ..." /></form>
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
                <Link href="/dashboard#activity" className="grid h-10 w-10 place-items-center rounded-full text-slate-600 hover:bg-slate-100" aria-label="ดูกิจกรรมล่าสุด"><Activity className="h-5 w-5" /></Link>
                <div className="ml-1 flex items-center gap-2 border-l border-slate-200 pl-3">
                    <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-blue-50">{props.userImage ? <Image src={props.userImage} alt="" fill sizes="36px" className="object-cover" unoptimized /> : <Users className="h-4 w-4 text-blue-700" />}</span>
                    <div className="hidden sm:block"><p className="max-w-32 truncate text-xs font-semibold">{props.userName}</p><span className={cn("rounded px-1.5 py-0.5 text-[9px] font-bold", props.userRole === "STAFF" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600")}>{props.userRole}</span></div>
                </div>
            </div>
        </header>
    </>
}
