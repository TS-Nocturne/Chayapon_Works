// ==========================================
// Product Actions — Client Component
// ==========================================
// Dropdown menu with toggle status + featured actions

"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ActionNotice, type ActionNoticeValue } from "@/components/ui/action-notice"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { AlertTriangle, MoreHorizontal, CheckCircle, XCircle, Clock, Star, StarOff, Loader2, Edit, Trash } from "lucide-react"
import { toggleProductStatus, toggleProductFeatured } from "@/app/actions/admin"
import { deleteProduct } from "@/app/actions/inventory"

interface ProductActionsProps {
    productId: string
    currentStatus: string
    isFeatured: boolean
}

export default function ProductActions({ productId, currentStatus, isFeatured }: ProductActionsProps) {
    const router = useRouter()
    const [isPending, startTransition] = React.useTransition()
    const [deleteOpen, setDeleteOpen] = React.useState(false)
    const [notice, setNotice] = React.useState<ActionNoticeValue | null>(null)
    const dismissNotice = React.useCallback(() => setNotice(null), [])

    const handleStatusChange = (newStatus: string) => {
        startTransition(async () => {
            try {
                const result = await toggleProductStatus(productId, newStatus)
                setNotice(result.success
                    ? { type: "success", title: "เปลี่ยนสถานะสินค้าแล้ว", description: "ข้อมูลหน้าร้านได้รับการอัปเดตเรียบร้อย" }
                    : { type: "error", title: "เปลี่ยนสถานะไม่สำเร็จ", description: result.error })
            } catch {
                setNotice({ type: "error", title: "เปลี่ยนสถานะไม่สำเร็จ", description: "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง" })
            }
        })
    }

    const handleToggleFeatured = () => {
        startTransition(async () => {
            try {
                const result = await toggleProductFeatured(productId)
                setNotice(result.success
                    ? { type: "success", title: isFeatured ? "นำสินค้าออกจากรายการแนะนำแล้ว" : "เพิ่มสินค้าในรายการแนะนำแล้ว" }
                    : { type: "error", title: "อัปเดตรายการแนะนำไม่สำเร็จ", description: result.error })
            } catch {
                setNotice({ type: "error", title: "อัปเดตรายการแนะนำไม่สำเร็จ", description: "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง" })
            }
        })
    }

    const handleDelete = () => {
        startTransition(async () => {
            try {
                const result = await deleteProduct(productId)
                if (!result.success) {
                    setDeleteOpen(false)
                    setNotice({ type: "error", title: "ลบสินค้าไม่ได้", description: result.error })
                    return
                }
                setDeleteOpen(false)
                setNotice({ type: "success", title: "ลบสินค้าเรียบร้อยแล้ว" })
                router.refresh()
            } catch {
                setDeleteOpen(false)
                setNotice({ type: "error", title: "ลบสินค้าไม่สำเร็จ", description: "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง" })
            }
        })
    }

    return (<>
        <ActionNotice notice={notice} onDismiss={dismissNotice} />
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending}>
                    {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <MoreHorizontal className="h-4 w-4" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">เปลี่ยนสถานะ</DropdownMenuLabel>
                <DropdownMenuItem
                    onClick={() => handleStatusChange("active")}
                    disabled={currentStatus === "active"}
                    className="gap-2 text-xs"
                >
                    <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    เปิดขาย
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleStatusChange("reserved")}
                    disabled={currentStatus === "reserved"}
                    className="gap-2 text-xs"
                >
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    จองแล้ว
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleStatusChange("sold")}
                    disabled={currentStatus === "sold"}
                    className="gap-2 text-xs"
                >
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                    ขายแล้ว
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={handleToggleFeatured} className="gap-2 text-xs">
                    {isFeatured ? (
                        <>
                            <StarOff className="h-3.5 w-3.5 text-muted-foreground" />
                            ยกเลิกแนะนำ
                        </>
                    ) : (
                        <>
                            <Star className="h-3.5 w-3.5 text-amber-500" />
                            ตั้งเป็นแนะนำ
                        </>
                    )}
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => router.push(`/dashboard/products/${productId}/edit`)} className="gap-2 text-xs">
                    <Edit className="h-3.5 w-3.5 text-blue-500" />
                    แก้ไขข้อมูล
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="gap-2 text-xs text-red-600 focus:text-red-600 focus:bg-red-50">
                    <Trash className="h-3.5 w-3.5 text-red-500" />
                    ลบสินค้า
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="mb-2 flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5" /></span>
                        <DialogTitle>ยืนยันการลบสินค้า?</DialogTitle>
                    </div>
                    <DialogDescription className="leading-6">สินค้าจะถูกลบถาวรและไม่สามารถกู้คืนผ่านหน้าเว็บได้ รวมถึงรายการสินค้านี้ที่อ้างอิงอยู่ในประวัติคำสั่งซื้อเดิม</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isPending}>ยกเลิก</Button>
                    <Button className="bg-red-600 hover:bg-red-700" onClick={handleDelete} disabled={isPending}>{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}ยืนยันลบสินค้า</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>)
}
