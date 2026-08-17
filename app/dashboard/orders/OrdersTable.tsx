"use client"

import * as React from "react"
import { updateOrderStatus, updatePaymentStatus } from "@/app/actions/order"
import { formatPrice } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { CheckCircle2, Eye, Loader2, XCircle } from "lucide-react"
import { ActionNotice, type ActionNoticeValue } from "@/components/ui/action-notice"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface AdminOrder {
    id: string
    status: string
    totalAmount: number
    shippingName: string
    shippingPhone: string
    shippingAddress: string
    note: string | null
    createdAt: Date
    guestEmail: string | null
    paymentStatus: string
    shippingCarrier: string | null
    trackingNumber: string | null
    shippedAt: Date | null
    user: { name: string; email: string } | null
    items: { quantity: number; product: { title: string } }[]
}

const statusLabels: Record<string, string> = {
    pending: "รอดำเนินการ",
    confirmed: "ยืนยันแล้ว",
    shipped: "จัดส่งแล้ว",
    completed: "สำเร็จ",
    cancelled: "ยกเลิก",
}

const paymentLabels: Record<string, string> = {
    pending_verification: "รอตรวจสลิป",
    verified: "ชำระแล้ว",
    rejected: "สลิปไม่ผ่าน",
}

const paymentTones: Record<string, string> = {
    pending_verification: "bg-amber-50 text-amber-700 border-amber-200",
    verified: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
}

export default function OrdersTable({ orders }: { orders: AdminOrder[] }) {
    const [loadingId, setLoadingId] = React.useState<string | null>(null)
    const [notice, setNotice] = React.useState<ActionNoticeValue | null>(null)
    const [shipmentOrder, setShipmentOrder] = React.useState<AdminOrder | null>(null)
    const [shippingCarrier, setShippingCarrier] = React.useState("")
    const [trackingNumber, setTrackingNumber] = React.useState("")
    const dismissNotice = React.useCallback(() => setNotice(null), [])

    function openShipmentDialog(order: AdminOrder) {
        setShipmentOrder(order)
        setShippingCarrier(order.shippingCarrier || "")
        setTrackingNumber(order.trackingNumber || "")
    }

    function handleStatusSelection(order: AdminOrder, status: string) {
        if (status === "shipped") {
            openShipmentDialog(order)
            return
        }
        void handleStatusChange(order.id, status)
    }

    async function handleStatusChange(
        orderId: string,
        status: string,
        shipment?: { shippingCarrier: string; trackingNumber: string },
    ) {
        setLoadingId(orderId)
        try {
            const result = await updateOrderStatus(orderId, status, shipment)
            setNotice(result.success
                ? { type: "success", title: "อัปเดตสถานะคำสั่งซื้อแล้ว", description: `สถานะใหม่: ${statusLabels[status] || status}` }
                : { type: "error", title: "เปลี่ยนสถานะไม่สำเร็จ", description: result.error })
            if (result.success && status === "shipped") setShipmentOrder(null)
        } catch {
            setNotice({ type: "error", title: "เปลี่ยนสถานะไม่สำเร็จ", description: "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง" })
        } finally {
            setLoadingId(null)
        }
    }

    function confirmShipment() {
        if (!shipmentOrder) return
        const carrier = shippingCarrier.trim()
        const tracking = trackingNumber.trim()
        if (!carrier || !tracking) {
            setNotice({ type: "error", title: "ข้อมูลจัดส่งยังไม่ครบ", description: "กรุณากรอกบริษัทขนส่งและเลขพัสดุก่อนยืนยันการจัดส่ง" })
            return
        }
        void handleStatusChange(shipmentOrder.id, "shipped", {
            shippingCarrier: carrier,
            trackingNumber: tracking,
        })
    }

    async function handlePaymentStatus(orderId: string, paymentStatus: "verified" | "rejected") {
        setLoadingId(orderId)
        try {
            const result = await updatePaymentStatus(orderId, paymentStatus)
            setNotice(result.success
                ? { type: "success", title: paymentStatus === "verified" ? "อนุมัติการชำระเงินแล้ว" : "บันทึกว่าสลิปไม่ผ่านแล้ว", description: paymentStatus === "verified" ? "คำสั่งซื้อถูกยืนยันและไม่สามารถกดปฏิเสธจากรายการนี้ได้" : "ลูกค้าสามารถส่งหลักฐานการชำระเงินใหม่ได้" }
                : { type: "error", title: "ตรวจสอบการชำระเงินไม่สำเร็จ", description: result.error })
        } catch {
            setNotice({ type: "error", title: "ตรวจสอบการชำระเงินไม่สำเร็จ", description: "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง" })
        } finally {
            setLoadingId(null)
        }
    }

    if (orders.length === 0) {
        return <p className="text-muted-foreground text-center py-12">ยังไม่มีคำสั่งซื้อ</p>
    }

    return (
        <>
        <ActionNotice notice={notice} onDismiss={dismissNotice} />
        <div className="rounded-xl border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>วันที่</TableHead>
                            <TableHead>ลูกค้า</TableHead>
                            <TableHead>ที่อยู่จัดส่ง</TableHead>
                        <TableHead>สินค้า</TableHead>
                        <TableHead>ยอดรวม</TableHead>
                        <TableHead>การชำระเงิน</TableHead>
                        <TableHead>สถานะ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                                {new Date(order.createdAt).toLocaleDateString("th-TH")}
                                <p className="mt-1 max-w-[90px] truncate text-[10px] text-muted-foreground" title={order.id}>#{order.id}</p>
                            </TableCell>
                            <TableCell>
                                <p className="text-sm font-medium">{order.shippingName}</p>
                                <a className="text-xs text-primary hover:underline" href={`tel:${order.shippingPhone}`}>{order.shippingPhone}</a>
                                <p className="text-xs text-muted-foreground">{order.user?.email || order.guestEmail || "Guest checkout"}</p>
                            </TableCell>
                            <TableCell className="min-w-[220px] max-w-[320px]">
                                <p className="text-xs whitespace-pre-wrap">{order.shippingAddress}</p>
                                {order.note && <p className="mt-1 text-xs text-muted-foreground">หมายเหตุ: {order.note}</p>}
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                                {order.items.map((item, i) => (
                                    <p key={i} className="text-xs line-clamp-1">{item.product.title} x{item.quantity}</p>
                                ))}
                            </TableCell>
                            <TableCell className="font-medium">{formatPrice(order.totalAmount)}</TableCell>
                            <TableCell className="min-w-[190px]">
                                <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${paymentTones[order.paymentStatus] || "bg-slate-50 text-slate-600"}`}>
                                    {paymentLabels[order.paymentStatus] || order.paymentStatus}
                                </span>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    <a href={`/api/orders/${order.id}/payment-slip`} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
                                        <Eye className="h-3.5 w-3.5" />ดูสลิป
                                    </a>
                                    {order.paymentStatus !== "verified" && <button type="button" disabled={loadingId === order.id} onClick={() => handlePaymentStatus(order.id, "verified")} className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-300 px-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" />{order.paymentStatus === "rejected" ? "อนุมัติใหม่" : "อนุมัติ"}</button>}
                                    {order.paymentStatus === "pending_verification" && <button type="button" disabled={loadingId === order.id} onClick={() => handlePaymentStatus(order.id, "rejected")} className="inline-flex h-8 items-center gap-1 rounded-md border border-red-200 px-2 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"><XCircle className="h-3.5 w-3.5" />ไม่ผ่าน</button>}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Select
                                    value={order.status}
                                    onValueChange={(v) => handleStatusSelection(order, v)}
                                    disabled={loadingId === order.id}
                                >
                                    <SelectTrigger className="w-[140px] h-8">
                                        {loadingId === order.id ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <SelectValue />
                                        )}
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(statusLabels).map(([k, v]) => (
                                            <SelectItem key={k} value={k}>{v}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {order.shippingCarrier && order.trackingNumber && (
                                    <div className="mt-2 max-w-[180px] text-[11px] leading-4">
                                        <p className="font-semibold text-slate-700">{order.shippingCarrier}</p>
                                        <p className="break-all font-mono text-primary">{order.trackingNumber}</p>
                                        <button type="button" className="mt-1 text-primary hover:underline" onClick={() => openShipmentDialog(order)}>
                                            แก้ไขข้อมูลจัดส่ง
                                        </button>
                                    </div>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
        <Dialog open={Boolean(shipmentOrder)} onOpenChange={(open) => !open && setShipmentOrder(null)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>ยืนยันการจัดส่งสินค้า</DialogTitle>
                    <DialogDescription>
                        กรอกข้อมูลติดตามพัสดุ ข้อมูลนี้จะแสดงในหน้าคำสั่งซื้อของลูกค้าทันที
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="shipping-carrier">บริษัทขนส่ง *</Label>
                        <Input
                            id="shipping-carrier"
                            list="shipping-carrier-options"
                            value={shippingCarrier}
                            onChange={(event) => setShippingCarrier(event.target.value)}
                            placeholder="เช่น ไปรษณีย์ไทย, Flash Express"
                            autoComplete="organization"
                        />
                        <datalist id="shipping-carrier-options">
                            <option value="ไปรษณีย์ไทย" />
                            <option value="Kerry Express" />
                            <option value="Flash Express" />
                            <option value="J&T Express" />
                            <option value="DHL Express" />
                            <option value="Ninja Van" />
                            <option value="SCG Express" />
                        </datalist>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tracking-number">เลขพัสดุ *</Label>
                        <Input
                            id="tracking-number"
                            value={trackingNumber}
                            onChange={(event) => setTrackingNumber(event.target.value.toUpperCase())}
                            placeholder="กรอกเลขติดตามพัสดุ"
                            className="font-mono uppercase"
                            autoComplete="off"
                        />
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={() => setShipmentOrder(null)} disabled={Boolean(loadingId)}>
                        ยกเลิก
                    </Button>
                    <Button type="button" onClick={confirmShipment} disabled={!shippingCarrier.trim() || !trackingNumber.trim() || Boolean(loadingId)}>
                        {loadingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        บันทึกและแจ้งจัดส่ง
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}
