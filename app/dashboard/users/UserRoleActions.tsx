"use client"

import * as React from "react"
import { AlertTriangle, Loader2, MoreHorizontal, Shield, User, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { changeUserRole } from "@/app/actions/admin"
import { ActionNotice, type ActionNoticeValue } from "@/components/ui/action-notice"

interface UserRoleActionsProps { userId: string; currentRole: string; userName: string }

export default function UserRoleActions({ userId, currentRole, userName }: UserRoleActionsProps) {
    const [isPending, startTransition] = React.useTransition()
    const [pendingRole, setPendingRole] = React.useState<string | null>(null)
    const [notice, setNotice] = React.useState<ActionNoticeValue | null>(null)
    const dismissNotice = React.useCallback(() => setNotice(null), [])
    const changeRole = () => {
        if (!pendingRole) return
        const newRole = pendingRole
        setPendingRole(null)
        startTransition(async () => {
            try {
                const result = await changeUserRole(userId, newRole)
                setNotice(result.success
                    ? { type: "success", title: "เปลี่ยนสิทธิ์ผู้ใช้งานแล้ว", description: `${userName} มีบทบาทเป็น ${newRole}` }
                    : { type: "error", title: "เปลี่ยนสิทธิ์ไม่สำเร็จ", description: result.error })
            } catch {
                setNotice({ type: "error", title: "เปลี่ยนสิทธิ์ไม่สำเร็จ", description: "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง" })
            }
        })
    }
    return <>
        <ActionNotice notice={notice} onDismiss={dismissNotice} />
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48"><DropdownMenuLabel className="text-xs">เปลี่ยนบทบาท: {userName}</DropdownMenuLabel>
                <RoleItem role="STAFF" currentRole={currentRole} icon={UserCheck} className="text-emerald-600" onSelect={setPendingRole} />
                <RoleItem role="USER" currentRole={currentRole} icon={User} className="text-slate-500" onSelect={setPendingRole} />
                <RoleItem role="ADMIN" currentRole={currentRole} icon={Shield} className="text-amber-500" onSelect={setPendingRole} />
            </DropdownMenuContent>
        </DropdownMenu>
        <Dialog open={Boolean(pendingRole)} onOpenChange={(open) => { if (!open) setPendingRole(null) }}><DialogContent className="max-w-md"><DialogHeader><div className="mb-2 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-amber-50 text-amber-600"><AlertTriangle className="h-5 w-5" /></span><DialogTitle>ยืนยันการเปลี่ยนสิทธิ์?</DialogTitle></div><DialogDescription>บัญชีของ {userName} จะเปลี่ยนจาก {currentRole} เป็น {pendingRole} และเมนูที่เข้าถึงได้จะเปลี่ยนตามบทบาทใหม่</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setPendingRole(null)}>ยกเลิก</Button><Button className="bg-blue-600 hover:bg-blue-700" onClick={changeRole}>ยืนยันการเปลี่ยนสิทธิ์</Button></DialogFooter></DialogContent></Dialog>
    </>
}

function RoleItem({ role, currentRole, icon: Icon, className, onSelect }: { role: string; currentRole: string; icon: React.ComponentType<{ className?: string }>; className: string; onSelect: (role: string) => void }) { return <DropdownMenuItem onClick={() => onSelect(role)} disabled={currentRole === role} className="gap-2 text-xs"><Icon className={`h-3.5 w-3.5 ${className}`} />ตั้งเป็น {role}</DropdownMenuItem> }
