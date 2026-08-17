"use client"

import * as React from "react"
import Link from "next/link"
import { updateLeadStatus } from "@/app/actions/leads"
import { Badge } from "@/components/ui/badge"
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
import { Loader2 } from "lucide-react"
import { ActionNotice, type ActionNoticeValue } from "@/components/ui/action-notice"

interface Lead {
    id: string
    name: string
    phone: string
    preferredDate: string | null
    status: string
    createdAt: Date
    product: { id: string; title: string; productType: string }
    user: { name: string; email: string } | null
}

const statusLabels: Record<string, string> = {
    new: "ใหม่",
    contacted: "ติดต่อแล้ว",
    closed: "ปิดแล้ว",
}

const productPaths: Record<string, string> = {
    vehicle: "vehicles",
    real_estate: "real-estate",
    part: "parts",
}

export default function LeadsTable({ leads }: { leads: Lead[] }) {
    const [loadingId, setLoadingId] = React.useState<string | null>(null)
    const [notice, setNotice] = React.useState<ActionNoticeValue | null>(null)
    const dismissNotice = React.useCallback(() => setNotice(null), [])

    async function handleStatusChange(leadId: string, status: string) {
        setLoadingId(leadId)
        try {
            const result = await updateLeadStatus(leadId, status)
            setNotice(result.success
                ? { type: "success", title: "อัปเดตสถานะลูกค้าแล้ว", description: `สถานะใหม่: ${statusLabels[status] || status}` }
                : { type: "error", title: "อัปเดตสถานะไม่สำเร็จ", description: result.error })
        } catch {
            setNotice({ type: "error", title: "อัปเดตสถานะไม่สำเร็จ", description: "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง" })
        } finally {
            setLoadingId(null)
        }
    }

    if (leads.length === 0) {
        return <p className="text-muted-foreground text-center py-12">ยังไม่มี Lead</p>
    }

    return (
        <><ActionNotice notice={notice} onDismiss={dismissNotice} /><div className="rounded-xl border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>วันที่</TableHead>
                        <TableHead>สินค้า</TableHead>
                        <TableHead>ชื่อ</TableHead>
                        <TableHead>เบอร์โทร</TableHead>
                        <TableHead>วันนัด</TableHead>
                        <TableHead>สถานะ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {leads.map((lead) => (
                        <TableRow key={lead.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                                {new Date(lead.createdAt).toLocaleDateString("th-TH")}
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                                <Link
                                    href={`/${productPaths[lead.product.productType] || ""}/${lead.product.id}`}
                                    className="text-sm font-medium line-clamp-1 hover:underline"
                                >
                                    {lead.product.title}
                                </Link>
                                <Badge variant="outline" className="text-[10px] mt-0.5">{lead.product.productType}</Badge>
                            </TableCell>
                            <TableCell>{lead.name}</TableCell>
                            <TableCell><a href={`tel:${lead.phone}`} className="text-primary hover:underline">{lead.phone}</a></TableCell>
                            <TableCell className="text-xs">{lead.preferredDate || "-"}</TableCell>
                            <TableCell>
                                <Select
                                    value={lead.status}
                                    onValueChange={(v) => handleStatusChange(lead.id, v)}
                                    disabled={loadingId === lead.id}
                                >
                                    <SelectTrigger className="w-[130px] h-8">
                                        {loadingId === lead.id ? (
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
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div></>
    )
}
