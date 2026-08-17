"use client"

import { useState, useTransition } from "react"
import { AlertTriangle, Building2, CheckCircle2, Eye, EyeOff, Landmark, Loader2, Phone, Save, ShieldCheck } from "lucide-react"
import { updateStoreSettings } from "@/app/actions/store-settings"
import type { StoreSettingsValues } from "@/lib/validations/store-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Props {
    initialValues: StoreSettingsValues
    source: "database" | "environment"
    updatedAt: string | null
}

const fields: { key: keyof StoreSettingsValues; label: string; placeholder: string; group: "contact" | "payment"; sensitive?: boolean }[] = [
    { key: "storeName", label: "ชื่อร้านค้า", placeholder: "Chayapon Works", group: "contact" },
    { key: "contactPhone", label: "เบอร์โทรติดต่อ", placeholder: "0812345678", group: "contact" },
    { key: "lineUrl", label: "LINE URL", placeholder: "https://line.me/R/ti/p/@yourstore", group: "contact" },
    { key: "promptPayId", label: "หมายเลข PromptPay", placeholder: "เบอร์โทร 10 หลัก หรือเลขนิติบุคคล 13 หลัก", group: "payment", sensitive: true },
    { key: "promptPayAccountName", label: "ชื่อบัญชี PromptPay", placeholder: "บริษัท ไฮบริดมาร์เก็ต จำกัด", group: "payment" },
    { key: "bankName", label: "ธนาคาร", placeholder: "ธนาคารกสิกรไทย", group: "payment" },
    { key: "bankAccountName", label: "ชื่อบัญชีธนาคาร", placeholder: "บริษัท ไฮบริดมาร์เก็ต จำกัด", group: "payment" },
    { key: "bankAccountNumber", label: "เลขบัญชีธนาคาร", placeholder: "กรอกเฉพาะตัวเลข", group: "payment", sensitive: true },
]

export default function StoreSettingsForm({ initialValues, source, updatedAt }: Props) {
    const [values, setValues] = useState(initialValues)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [showSensitive, setShowSensitive] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    function setValue(key: keyof StoreSettingsValues, value: string) {
        setValues((current) => ({ ...current, [key]: value }))
        setMessage(null)
    }

    function save() {
        setConfirmOpen(false)
        startTransition(async () => {
            const result = await updateStoreSettings(values)
            setMessage(result.success
                ? { type: "success", text: "บันทึกการตั้งค่าร้านค้าเรียบร้อยแล้ว" }
                : { type: "error", text: result.error || "ไม่สามารถบันทึกข้อมูลได้" })
        })
    }

    return <>
        <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <div className="space-y-5">
                {message && <div role="status" className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                    {message.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}{message.text}
                </div>}

                <SettingsSection icon={Phone} title="ช่องทางติดต่อ" description="ข้อมูลนี้จะแสดงในหน้าสินค้าและหน้าติดต่อร้าน">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {fields.filter((field) => field.group === "contact").map((field) => <Field key={field.key} field={field} value={String(values[field.key] || "")} onChange={(value) => setValue(field.key, value)} showSensitive={showSensitive} />)}
                    </div>
                </SettingsSection>

                <SettingsSection icon={Landmark} title="การรับชำระเงิน" description="หมายเลข PromptPay และเลขบัญชีจะถูกเข้ารหัสก่อนบันทึกลงฐานข้อมูล">
                    <div className="mb-4 flex justify-end"><Button type="button" variant="outline" size="sm" onClick={() => setShowSensitive((value) => !value)} className="gap-2">{showSensitive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{showSensitive ? "ซ่อนข้อมูลการเงิน" : "แสดงข้อมูลการเงิน"}</Button></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {fields.filter((field) => field.group === "payment").map((field) => <Field key={field.key} field={field} value={String(values[field.key] || "")} onChange={(value) => setValue(field.key, value)} showSensitive={showSensitive} />)}
                    </div>
                </SettingsSection>

                <div className="flex justify-end">
                    <Button onClick={() => setConfirmOpen(true)} disabled={isPending} className="h-11 gap-2 bg-blue-600 px-6 hover:bg-blue-700">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}บันทึกการตั้งค่า</Button>
                </div>
            </div>

            <aside className="space-y-4">
                <article className="rounded-xl border border-blue-200 bg-blue-50/60 p-5"><div className="flex items-center gap-2 text-blue-700"><ShieldCheck className="h-5 w-5" /><h2 className="font-semibold">ความปลอดภัย</h2></div><ul className="mt-4 space-y-3 text-sm text-slate-600"><li>• เฉพาะ Admin เท่านั้นที่แก้ไขได้</li><li>• ข้อมูลการเงินเข้ารหัสแบบ AES-256-GCM</li><li>• ทุกการเปลี่ยนแปลงถูกบันทึกใน Audit Log</li><li>• Public API ไม่ส่งเลขบัญชีหรือ PromptPay เต็ม</li></ul></article>
                <article className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-blue-600" /><h2 className="font-semibold">สถานะการตั้งค่า</h2></div><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><dt className="text-slate-500">แหล่งข้อมูล</dt><dd className="font-medium">{source === "database" ? "Dashboard / Database" : "ค่าเริ่มต้นจาก Environment"}</dd></div><div className="flex justify-between"><dt className="text-slate-500">แก้ไขล่าสุด</dt><dd className="text-right font-medium">{updatedAt ? new Date(updatedAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "ยังไม่เคยบันทึก"}</dd></div></dl></article>
            </aside>
        </div>

        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent className="max-w-md"><DialogHeader><div className="mb-2 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-amber-50 text-amber-600"><AlertTriangle className="h-5 w-5" /></span><DialogTitle>ยืนยันการเปลี่ยนการตั้งค่าร้าน?</DialogTitle></div><DialogDescription>ข้อมูลติดต่อและช่องทางรับเงินบนหน้าเว็บจะเปลี่ยนทันที และระบบจะบันทึกกิจกรรมนี้ไว้ใน Audit Log</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setConfirmOpen(false)}>กลับ</Button><Button className="bg-blue-600 hover:bg-blue-700" onClick={save}>ยืนยันและบันทึก</Button></DialogFooter></DialogContent>
        </Dialog>
    </>
}

function SettingsSection({ icon: Icon, title, description, children }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; children: React.ReactNode }) {
    return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700"><Icon className="h-5 w-5" /></span><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-xs text-slate-500">{description}</p></div></div>{children}</section>
}

function Field({ field, value, onChange, showSensitive }: { field: typeof fields[number]; value: string; onChange: (value: string) => void; showSensitive: boolean }) {
    return <label className={field.key === "lineUrl" ? "sm:col-span-2" : ""}><span className="mb-1.5 block text-sm font-medium text-slate-700">{field.label}</span><Input type={field.sensitive && !showSensitive ? "password" : field.key === "contactPhone" ? "tel" : "text"} inputMode={field.key === "contactPhone" || field.sensitive ? "numeric" : undefined} value={value} onChange={(event) => onChange(event.target.value)} placeholder={field.placeholder} autoComplete="off" /></label>
}
