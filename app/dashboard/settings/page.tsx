import { requireAdminPage } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"
import { getAdminStoreSettings } from "@/lib/store-settings"
import StoreSettingsForm from "./StoreSettingsForm"
import { LineChart } from "lucide-react"

export const metadata = { title: "ตั้งค่าร้านค้า" }

export default async function StoreSettingsPage() {
    await requireAdminPage("/dashboard/settings")
    const [settings, logs] = await Promise.all([
        getAdminStoreSettings(),
        prisma.auditLog.findMany({
            where: { entityType: "StoreSettings" },
            orderBy: { createdAt: "desc" },
            take: 8,
            include: { user: { select: { name: true, email: true } } },
        }),
    ])

    return <div className="space-y-5 text-slate-950">
        <section><p className="text-sm font-semibold text-blue-700">SETTINGS</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">ตั้งค่าร้านค้า</h1><p className="mt-1 text-sm text-slate-500">จัดการข้อมูลติดต่อ LINE, PromptPay และบัญชีรับโอนจากจุดเดียว</p></section>
        <StoreSettingsForm initialValues={{
            storeName: settings.storeName,
            contactPhone: settings.contactPhone,
            lineUrl: settings.lineUrl,
            promptPayId: settings.promptPayId,
            promptPayAccountName: settings.promptPayAccountName,
            bankName: settings.bankName,
            bankAccountName: settings.bankAccountName,
            bankAccountNumber: settings.bankAccountNumber,
        }} source={settings.source} updatedAt={settings.updatedAt?.toISOString() || null} />

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><LineChart className="h-5 w-5 text-blue-600" /><h2 className="font-semibold">Audit Log การตั้งค่าล่าสุด</h2></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-y border-slate-200 bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">ผู้ดำเนินการ</th><th className="p-3">รายการ</th><th className="p-3">ฟิลด์ที่เปลี่ยน</th><th className="p-3">วันและเวลา</th></tr></thead><tbody className="divide-y divide-slate-100">{logs.map((log) => { const details = log.details as { changedFields?: string[] } | null; return <tr key={log.id}><td className="p-3"><p className="font-medium">{log.user?.name || "System"}</p><p className="text-xs text-slate-500">{log.user?.email}</p></td><td className="p-3">แก้ไขการตั้งค่าร้านค้า</td><td className="p-3 text-slate-600">{details?.changedFields?.join(", ") || "—"}</td><td className="p-3 text-slate-500">{log.createdAt.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</td></tr> })}{!logs.length && <tr><td colSpan={4} className="p-8 text-center text-slate-400">ยังไม่มีประวัติการเปลี่ยนแปลง</td></tr>}</tbody></table></div></section>
    </div>
}
