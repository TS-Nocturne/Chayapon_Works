import Link from "next/link"
import { ArrowLeft, FileCheck2, ShieldCheck, Store } from "lucide-react"

const policyLinks = [
    { href: "/about", label: "เกี่ยวกับร้าน", icon: Store },
    { href: "/terms", label: "ข้อกำหนดการใช้งาน", icon: FileCheck2 },
    { href: "/privacy", label: "นโยบายความเป็นส่วนตัว", icon: ShieldCheck },
]

export default function PolicyPage({
    eyebrow,
    title,
    description,
    updatedAt,
    children,
}: {
    eyebrow: string
    title: string
    description: string
    updatedAt?: string
    children: React.ReactNode
}) {
    return (
        <main className="min-h-screen bg-slate-50 text-slate-950">
            <section className="border-b border-slate-200 bg-white">
                <div className="market-shell py-10 sm:py-14">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline">
                        <ArrowLeft className="h-4 w-4" /> กลับหน้าแรก
                    </Link>
                    <p className="mt-8 text-xs font-bold tracking-[0.18em] text-blue-700">{eyebrow}</p>
                    <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
                    {updatedAt && <p className="mt-4 text-xs text-slate-500">ปรับปรุงล่าสุด: {updatedAt}</p>}
                </div>
            </section>

            <div className="market-shell grid gap-8 py-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-12">
                <aside className="h-fit rounded-xl border border-slate-200 bg-white p-3 lg:sticky lg:top-24">
                    <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-wider text-slate-400">ข้อมูลร้านและนโยบาย</p>
                    <nav aria-label="ข้อมูลร้านและนโยบาย" className="space-y-1">
                        {policyLinks.map(({ href, label, icon: Icon }) => (
                            <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">
                                <Icon className="h-4 w-4" /> {label}
                            </Link>
                        ))}
                    </nav>
                </aside>
                <article className="min-w-0 space-y-6">{children}</article>
            </div>
        </main>
    )
}

export function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">{title}</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">{children}</div>
        </section>
    )
}

export function PolicyList({ children }: { children: React.ReactNode }) {
    return <ul className="list-disc space-y-2 pl-5 marker:text-blue-600">{children}</ul>
}
