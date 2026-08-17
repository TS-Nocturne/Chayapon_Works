"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, Search, User, ShoppingCart, LogOut, LayoutDashboard, Package, Home } from "lucide-react"
import { useSession, authClient } from "@/lib/auth-client"
import { useCart } from "@/lib/cart-context"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
    { href: "/vehicles", label: "รถยนต์มือสอง" },
    { href: "/real-estate", label: "อสังหาริมทรัพย์" },
    { href: "/parts", label: "อะไหล่รถยนต์" },
    { href: "/about", label: "เกี่ยวกับร้าน" },
]

export default function Navbar() {
    const pathname = usePathname()
    const router = useRouter()
    const { data: session, isPending } = useSession()
    const { itemCount } = useCart()
    const [mobileOpen, setMobileOpen] = React.useState(false)
    const userRole = session?.user && "role" in session.user ? session.user.role : undefined
    const isListingPage = ["/vehicles", "/real-estate", "/parts"].includes(pathname)
    const isDetailPage = /^\/(vehicles|real-estate|parts)\/[^/]+/.test(pathname)
    const showBottomNav = !isListingPage && !isDetailPage && !pathname.startsWith("/checkout")

    if (pathname.startsWith("/dashboard")) return null

    const signOut = async () => {
        await authClient.signOut()
        router.refresh()
    }

    const mobileItems = [
        { href: "/", label: "หน้าแรก", icon: Home },
        { href: "/vehicles", label: "ค้นหา", icon: Search },
        { href: session ? "/cart" : "/sign-in?callbackUrl=/cart", label: "ตะกร้า", icon: ShoppingCart },
        { href: session ? "/orders" : "/sign-in?callbackUrl=/orders", label: "คำสั่งซื้อ", icon: Package },
        { href: session ? "/profile" : "/sign-in", label: "บัญชี", icon: User },
    ]

    return (
        <>
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
            <div className="market-shell flex h-[60px] min-w-0 items-center justify-between gap-2 md:h-[70px] md:gap-6">
                <Link href="/" className="shrink-0 text-[18px] font-black tracking-[-0.04em] text-slate-900 min-[360px]:text-[21px] sm:text-2xl">
                    <span className="text-blue-700">Chayapon</span> Works
                </Link>

                <nav className="hidden items-center gap-7 lg:flex" aria-label="เมนูหลัก">
                    {NAV_LINKS.map((link) => (
                        <Link key={link.href} href={link.href} className={cn("border-b-2 border-transparent py-6 text-sm font-medium text-slate-700 transition hover:text-blue-700", pathname.startsWith(link.href) && "border-blue-600 text-blue-700")}>
                            {link.label}
                        </Link>
                    ))}
                </nav>

                <div className="ml-auto hidden items-center gap-2 md:flex">
                    <Link href="/vehicles" aria-label="ค้นหา" className="grid h-10 w-10 place-items-center text-slate-800 hover:text-blue-700"><Search className="h-5 w-5" /></Link>
                    <Link href="/vehicles" className="inline-flex h-10 items-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700">เลือกซื้อสินค้า</Link>
                    {isPending ? <div className="h-10 w-24 animate-pulse rounded bg-slate-100" /> : session ? (
                        <>
                            {userRole === "ADMIN" && <Link href="/dashboard" className="grid h-10 w-10 place-items-center text-slate-700" title="Dashboard"><LayoutDashboard className="h-5 w-5" /></Link>}
                            <Link href="/orders" className="grid h-10 w-10 place-items-center text-slate-700" title="คำสั่งซื้อ"><Package className="h-5 w-5" /></Link>
                            <Link href="/profile" className="flex h-10 items-center gap-2 border-l border-slate-200 pl-4 text-sm font-medium text-slate-800">
                                <span className="relative grid h-7 w-7 place-items-center overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                                    {session.user.image ? <Image src={session.user.image} alt="" fill sizes="28px" className="object-cover" unoptimized /> : <User className="h-4 w-4" />}
                                </span>
                                <span className="max-w-24 truncate">{session.user.name}</span>
                            </Link>
                            <button onClick={() => void signOut()} className="grid h-10 w-9 place-items-center text-slate-500 hover:text-red-600" aria-label="ออกจากระบบ"><LogOut className="h-4 w-4" /></button>
                        </>
                    ) : (
                        <Link href="/sign-in" className="flex h-10 items-center gap-2 border-l border-slate-200 pl-4 text-sm font-medium text-slate-800 hover:text-blue-700"><User className="h-5 w-5" />เข้าสู่ระบบ</Link>
                    )}
                    <Link href={session ? "/cart" : "/sign-in?callbackUrl=/cart"} className="relative grid h-10 w-10 place-items-center border-l border-slate-200 pl-2 text-slate-800" aria-label={session ? `ตะกร้า ${itemCount} ชิ้น` : "เข้าสู่ระบบเพื่อใช้ตะกร้า"}>
                        <ShoppingCart className="h-5 w-5" />
                        {session && itemCount > 0 && <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">{itemCount > 9 ? "9+" : itemCount}</span>}
                    </Link>
                </div>

                <div className="ml-auto flex items-center gap-1 md:hidden">
                    <Link href="/vehicles" aria-label="ค้นหา" className="grid h-10 w-10 place-items-center"><Search className="h-5 w-5" /></Link>
                    <button type="button" className="grid h-10 w-10 place-items-center" onClick={() => setMobileOpen((open) => !open)} aria-expanded={mobileOpen} aria-controls="mobile-nav" aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"}>
                        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {mobileOpen && (
                <nav id="mobile-nav" className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
                    {NAV_LINKS.map((link) => <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block border-b border-slate-100 px-2 py-3 text-sm font-medium">{link.label}</Link>)}
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <Link href={session ? "/profile" : "/sign-in"} onClick={() => setMobileOpen(false)} className="flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 text-sm font-semibold"><User className="h-4 w-4" />{session ? "บัญชีของฉัน" : "เข้าสู่ระบบ"}</Link>
                        <Link href={session ? "/cart" : "/sign-in?callbackUrl=/cart"} onClick={() => setMobileOpen(false)} className="flex h-11 items-center justify-center gap-2 rounded-md bg-blue-600 text-sm font-semibold text-white"><ShoppingCart className="h-4 w-4" />{session ? `ตะกร้า (${itemCount})` : "เข้าสู่ระบบ"}</Link>
                    </div>
                </nav>
            )}
        </header>
        {showBottomNav && (
            <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 pt-1.5 pb-[max(.35rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,.08)] backdrop-blur-xl md:hidden" aria-label="เมนูมือถือ">
                {mobileItems.map((item) => {
                    const Icon = item.icon
                    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
                    return (
                        <Link key={item.href} href={item.href} className={cn("relative flex min-h-12 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-slate-500", active && "text-blue-700")}>
                            <Icon className="h-5 w-5" />
                            <span>{item.label}</span>
                            {session && item.href === "/cart" && itemCount > 0 && <span className="absolute right-[24%] top-0 grid h-4 min-w-4 place-items-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">{itemCount > 9 ? "9+" : itemCount}</span>}
                        </Link>
                    )
                })}
            </nav>
        )}
        </>
    )
}
