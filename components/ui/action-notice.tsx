"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export type ActionNoticeValue = {
    type: "success" | "error"
    title: string
    description?: string
}

export function ActionNotice({ notice, onDismiss }: { notice: ActionNoticeValue | null; onDismiss: () => void }) {
    React.useEffect(() => {
        if (!notice) return
        const timeout = window.setTimeout(onDismiss, notice.type === "success" ? 4_000 : 7_000)
        return () => window.clearTimeout(timeout)
    }, [notice, onDismiss])

    if (!notice) return null

    const success = notice.type === "success"
    return (
        <div
            role={success ? "status" : "alert"}
            aria-live={success ? "polite" : "assertive"}
            className={`fixed right-4 top-20 z-[100] flex w-[min(420px,calc(100vw-2rem))] items-start gap-3 rounded-xl border bg-white p-4 shadow-xl ${success ? "border-emerald-200" : "border-red-200"}`}
        >
            <span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${success ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                {success ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1 whitespace-normal text-left">
                <p className="break-words font-semibold leading-5 text-slate-900 [overflow-wrap:anywhere]">{notice.title}</p>
                {notice.description && <p className="mt-1 break-words whitespace-normal text-sm leading-5 text-slate-600 [overflow-wrap:anywhere]">{notice.description}</p>}
            </div>
            <Button type="button" variant="ghost" size="icon" className="-mr-2 -mt-2 h-8 w-8 shrink-0" onClick={onDismiss} aria-label="ปิดการแจ้งเตือน">
                <X className="h-4 w-4" />
            </Button>
        </div>
    )
}
