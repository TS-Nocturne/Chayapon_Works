import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatPrice } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CheckCircle, Truck } from "lucide-react"

const statusLabels: Record<string, string> = {
    pending: "รอดำเนินการ",
    confirmed: "ยืนยันแล้ว",
    shipped: "จัดส่งแล้ว",
    completed: "สำเร็จ",
    cancelled: "ยกเลิก",
}

interface OrderDetailPageProps {
    params: Promise<{ id: string }>
    searchParams: Promise<{ success?: string }>
}

export default async function OrderDetailPage({ params, searchParams }: OrderDetailPageProps) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) redirect("/sign-in?callbackUrl=/orders")

    const { id } = await params
    const { success } = await searchParams

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            items: { include: { product: { include: { part: true } } } },
        },
    })

    if (!order || order.userId !== session.user.id) notFound()

    return (
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <Link href="/orders">
                <Button variant="ghost" className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    กลับไปคำสั่งซื้อ
                </Button>
            </Link>

            {success === "1" && (
                <div className="flex items-center gap-3 p-4 bg-green-50 text-green-800 rounded-xl border border-green-200">
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">สั่งซื้อสำเร็จ! ทีมงานจะติดต่อยืนยันคำสั่งซื้อโดยเร็วที่สุด</p>
                </div>
            )}

            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">คำสั่งซื้อ #{order.id.slice(-8).toUpperCase()}</h1>
                <Badge>{statusLabels[order.status] || order.status}</Badge>
            </div>

            <Card>
                <CardHeader><CardTitle>รายการสินค้า</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <div>
                                <p className="font-medium">{item.product.title}</p>
                                <p className="text-xs text-muted-foreground">x{item.quantity} @ {formatPrice(item.price)}</p>
                            </div>
                            <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                    ))}
                    <div className="border-t pt-3 flex justify-between font-bold">
                        <span>รวมทั้งหมด</span>
                        <span className="text-primary">{formatPrice(order.totalAmount)}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>ที่อยู่จัดส่ง</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-1">
                    <p className="font-medium">{order.shippingName}</p>
                    <p className="text-muted-foreground">{order.shippingPhone}</p>
                    <p className="text-muted-foreground whitespace-pre-wrap">{order.shippingAddress}</p>
                    {order.note && <p className="text-muted-foreground pt-2">หมายเหตุ: {order.note}</p>}
                </CardContent>
            </Card>

            {order.shippingCarrier && order.trackingNumber && (
                <Card className="border-blue-200 bg-blue-50/40">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5 text-primary" />
                            ข้อมูลติดตามพัสดุ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2">
                            <div>
                                <p className="text-xs text-muted-foreground">บริษัทขนส่ง</p>
                                <p className="font-semibold">{order.shippingCarrier}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">เลขพัสดุ</p>
                                <p className="break-all font-mono font-semibold text-primary">{order.trackingNumber}</p>
                            </div>
                        </div>
                        {order.shippedAt && (
                            <p className="text-xs text-muted-foreground">
                                ร้านค้าแจ้งจัดส่งเมื่อ {new Date(order.shippedAt).toLocaleString("th-TH", { dateStyle: "long", timeStyle: "short" })}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">นำเลขพัสดุไปตรวจสอบกับเว็บไซต์หรือแอปของบริษัทขนส่งได้ทันที</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
