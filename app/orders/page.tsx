import { redirect } from "next/navigation"
import Link from "next/link"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { getUserOrders } from "@/app/actions/order"
import { formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Package, ArrowRight, Truck } from "lucide-react"

export const metadata = { title: "คำสั่งซื้อของฉัน" }

const statusLabels: Record<string, string> = {
    pending: "รอดำเนินการ",
    confirmed: "ยืนยันแล้ว",
    shipped: "จัดส่งแล้ว",
    completed: "สำเร็จ",
    cancelled: "ยกเลิก",
}

const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
}

export default async function OrdersPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) redirect("/sign-in?callbackUrl=/orders")

    const orders = await getUserOrders()

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <h1 className="text-2xl font-bold">คำสั่งซื้อของฉัน</h1>

            {orders.length === 0 ? (
                <div className="text-center py-16 space-y-4">
                    <Package className="h-16 w-16 mx-auto text-muted-foreground/40" />
                    <p className="text-muted-foreground">ยังไม่มีคำสั่งซื้อ</p>
                    <Link href="/parts"><Button>ไปเลือกซื้ออะไหล่</Button></Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Card key={order.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(order.createdAt).toLocaleDateString("th-TH", { dateStyle: "long" })}
                                        </p>
                                        <p className="font-medium text-sm">#{order.id.slice(-8).toUpperCase()}</p>
                                    </div>
                                    <Badge className={statusColors[order.status] || ""}>
                                        {statusLabels[order.status] || order.status}
                                    </Badge>
                                </div>
                                <div className="space-y-1 mb-3">
                                    {order.items.map((item) => (
                                        <p key={item.id} className="text-sm text-muted-foreground line-clamp-1">
                                            {item.product.title} x{item.quantity}
                                        </p>
                                    ))}
                                </div>
                                {order.shippingCarrier && order.trackingNumber && (
                                    <div className="mb-3 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-sm">
                                        <Truck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                        <div className="min-w-0">
                                            <p className="font-medium">จัดส่งโดย {order.shippingCarrier}</p>
                                            <p className="break-all font-mono text-xs text-primary">เลขพัสดุ {order.trackingNumber}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-primary">{formatPrice(order.totalAmount)}</p>
                                    <Link href={`/orders/${order.id}`}>
                                        <Button variant="ghost" size="sm" className="gap-1">
                                            ดูรายละเอียด <ArrowRight className="h-3 w-3" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
