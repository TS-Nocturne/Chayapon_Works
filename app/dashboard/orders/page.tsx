import { prisma } from "@/lib/prisma"
import { requireBackOfficePage } from "@/lib/admin-auth"
import OrdersTable from "./OrdersTable"
import { ShoppingCart } from "lucide-react"

export const metadata = { title: "จัดการคำสั่งซื้อ | Admin Dashboard" }

export default async function AdminOrdersPage() {
    await requireBackOfficePage("/dashboard/orders")
    const orders = await prisma.order.findMany({
        include: {
            user: { select: { name: true, email: true } },
            items: { include: { product: { select: { title: true } } } },
        },
        orderBy: { createdAt: "desc" },
    })

    const pendingCount = orders.filter((o) => o.status === "pending").length

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                    <ShoppingCart className="h-7 w-7 text-primary" />
                    จัดการคำสั่งซื้อ
                </h1>
                <p className="text-muted-foreground mt-1">
                    คำสั่งซื้ออะไหล่ทั้งหมด {pendingCount > 0 && `(รอดำเนินการ ${pendingCount} รายการ)`}
                </p>
            </div>
            <OrdersTable orders={orders} />
        </div>
    )
}
