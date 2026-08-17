import { prisma } from "@/lib/prisma"
import { requireBackOfficePage } from "@/lib/admin-auth"
import LeadsTable from "./LeadsTable"
import { MessageSquare } from "lucide-react"

export const metadata = { title: "จัดการ Lead | Admin Dashboard" }

export default async function LeadsPage() {
    await requireBackOfficePage("/dashboard/leads")
    const leads = await prisma.contactLead.findMany({
        include: {
            product: { select: { id: true, title: true, productType: true } },
            user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
    })

    const newCount = leads.filter((l) => l.status === "new").length

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                    <MessageSquare className="h-7 w-7 text-primary" />
                    จัดการ Lead
                </h1>
                <p className="text-muted-foreground mt-1">
                    รายการติดต่อสอบถาม / นัดหมายจากลูกค้า {newCount > 0 && `(ใหม่ ${newCount} รายการ)`}
                </p>
            </div>
            <LeadsTable leads={leads} />
        </div>
    )
}
