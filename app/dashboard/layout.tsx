// ==========================================
// Dashboard Layout — Server Component (Auth Guard)
// ==========================================
// ป้องกันการเข้าถึงโดยผู้ใช้ที่ไม่ใช่ ADMIN
// ใช้ layout แยกจาก root layout (ไม่แสดง Navbar หลัก)

import { requireBackOfficePage } from "@/lib/admin-auth"
import DashboardSidebar from "./DashboardSidebar"
import { Suspense } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Admin Dashboard",
    robots: { index: false, follow: false },
}

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // ─── Auth Guard ──────────────────────────────────────────
    const session = await requireBackOfficePage()

    return (
        <div className="min-h-screen bg-muted/30">
            <Suspense>
                <DashboardSidebar userName={session.user.name} userRole={session.user.role} userImage={session.user.image} />
            </Suspense>

            {/* ─── Main Content ───────────────────────────── */}
            <div className="lg:pl-64 lg:pt-16">
                <main className="p-4 sm:p-6 lg:p-7">{children}</main>
            </div>
        </div>
    )
}
