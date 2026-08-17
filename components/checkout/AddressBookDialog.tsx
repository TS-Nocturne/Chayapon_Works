"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { Check, Home, Loader2, MapPin, Pencil, Plus, Trash2, UserRound } from "lucide-react"
import { saveUserAddress, deleteUserAddress } from "@/app/actions/address"
import { addressInputSchema, type AddressInput, type SavedAddress } from "@/lib/validations/address"
import { getThaiDistricts, getThaiPostalCodes, getThaiSubdistricts, thaiProvinces } from "@/lib/thai-address"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Props = {
    addresses: SavedAddress[]
    selectedAddressId: string | null
    authenticated: boolean
    draft: AddressInput
    onClose: () => void
    onSelect: (address: SavedAddress | AddressInput, id: string | null) => void
    onAddressesChange: (addresses: SavedAddress[]) => void
}

const emptyAddress: AddressInput = {
    label: "บ้าน",
    recipientName: "",
    phone: "",
    details: "",
    province: "",
    district: "",
    subdistrict: "",
    postalCode: "",
    isDefault: false,
}

export default function AddressBookDialog({ addresses, selectedAddressId, authenticated, draft, onClose, onSelect, onAddressesChange }: Props) {
    const [mode, setMode] = React.useState<"list" | "form">(authenticated && addresses.length > 0 ? "list" : "form")
    const [editingId, setEditingId] = React.useState<string | null>(null)
    const [deleteId, setDeleteId] = React.useState<string | null>(null)
    const [isPending, startTransition] = React.useTransition()
    const [error, setError] = React.useState<string | null>(null)

    const form = useForm<AddressInput>({
        resolver: zodResolver(addressInputSchema),
        defaultValues: { ...emptyAddress, ...draft, id: undefined },
    })
    const province = useWatch({ control: form.control, name: "province" }) || ""
    const district = useWatch({ control: form.control, name: "district" }) || ""
    const subdistrict = useWatch({ control: form.control, name: "subdistrict" }) || ""
    const districts = React.useMemo(() => getThaiDistricts(province), [province])
    const subdistricts = React.useMemo(() => getThaiSubdistricts(province, district), [province, district])
    const postalCodes = React.useMemo(() => getThaiPostalCodes(province, district, subdistrict), [province, district, subdistrict])

    function startNew() {
        setEditingId(null)
        setError(null)
        form.reset({ ...emptyAddress, recipientName: draft.recipientName || "", phone: draft.phone || "", isDefault: addresses.length === 0 })
        setMode("form")
    }

    function startEdit(address: SavedAddress) {
        setEditingId(address.id)
        setError(null)
        form.reset(address)
        setMode("form")
    }

    function submit(values: AddressInput) {
        setError(null)
        if (!authenticated) {
            onSelect(values, null)
            onClose()
            return
        }

        startTransition(async () => {
            const result = await saveUserAddress({ ...values, id: editingId || undefined })
            if (!result.success) {
                setError(result.error)
                return
            }
            const saved = result.address
            const next = saved.isDefault
                ? [saved, ...addresses.filter((address) => address.id !== saved.id).map((address) => ({ ...address, isDefault: false }))]
                : [saved, ...addresses.filter((address) => address.id !== saved.id)]
            onAddressesChange(next)
            onSelect(saved, saved.id)
            onClose()
        })
    }

    function removeAddress() {
        if (!deleteId) return
        startTransition(async () => {
            const result = await deleteUserAddress(deleteId)
            if (!result.success) {
                setError(result.error)
                setDeleteId(null)
                return
            }
            onAddressesChange(result.addresses)
            setDeleteId(null)
            if (result.addresses.length === 0) startNew()
        })
    }

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto p-0">
                <DialogHeader className="border-b border-slate-100 px-5 py-4 text-left">
                    <DialogTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-blue-600" />{mode === "list" ? "เลือกที่อยู่จัดส่ง" : editingId ? "แก้ไขที่อยู่" : "เพิ่มที่อยู่ใหม่"}</DialogTitle>
                    <DialogDescription>{authenticated ? "บันทึกไว้ในบัญชีและเลือกใช้ในการสั่งซื้อครั้งถัดไปได้" : "กรอกเพื่อใช้กับคำสั่งซื้อนี้ หากต้องการบันทึกไว้ใช้ภายหลังกรุณาเข้าสู่ระบบ"}</DialogDescription>
                </DialogHeader>

                {error && <div role="alert" className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

                {mode === "list" ? (
                    <div className="space-y-3 p-5">
                        {addresses.map((address) => (
                            <article key={address.id} className={`rounded-xl border p-4 transition ${selectedAddressId === address.id ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500" : "border-slate-200"}`}>
                                <div className="flex items-start gap-3">
                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600"><Home className="h-5 w-5" /></span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{address.label}</p>{address.isDefault && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">ค่าเริ่มต้น</span>}</div>
                                        <p className="mt-1 text-sm font-medium">{address.recipientName} · {formatPhone(address.phone)}</p>
                                        <p className="mt-1 break-words text-sm leading-6 text-slate-600">{formatAddress(address)}</p>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap justify-end gap-2">
                                    <Button type="button" variant="ghost" size="sm" className="text-slate-600" onClick={() => startEdit(address)}><Pencil className="mr-1.5 h-4 w-4" />แก้ไข</Button>
                                    <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleteId(address.id)}><Trash2 className="mr-1.5 h-4 w-4" />ลบ</Button>
                                    <Button type="button" size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => { onSelect(address, address.id); onClose() }}>{selectedAddressId === address.id ? <Check className="mr-1.5 h-4 w-4" /> : null}{selectedAddressId === address.id ? "เลือกอยู่" : "ใช้ที่อยู่นี้"}</Button>
                                </div>
                                {deleteId === address.id && <div className="mt-3 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="text-red-700">ยืนยันลบที่อยู่นี้ออกจากบัญชี?</span><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={() => setDeleteId(null)}>ยกเลิก</Button><Button type="button" size="sm" className="bg-red-600 hover:bg-red-700" disabled={isPending} onClick={removeAddress}>{isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}ยืนยันลบ</Button></div></div>}
                            </article>
                        ))}
                        <Button type="button" variant="outline" className="h-11 w-full border-dashed border-blue-300 text-blue-700" onClick={startNew}><Plus className="mr-2 h-4 w-4" />เพิ่มที่อยู่ใหม่</Button>
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(submit)} className="space-y-5 p-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField control={form.control} name="label" render={({ field }) => <FormItem><FormLabel>ชื่อที่อยู่ *</FormLabel><FormControl><Input placeholder="เช่น บ้าน, ที่ทำงาน" {...field} /></FormControl><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="recipientName" render={({ field }) => <FormItem><FormLabel>ชื่อผู้รับ *</FormLabel><FormControl><Input autoComplete="name" placeholder="ชื่อ-นามสกุล" {...field} /></FormControl><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="phone" render={({ field }) => <FormItem className="sm:col-span-2"><FormLabel>เบอร์โทรศัพท์ *</FormLabel><FormControl><Input type="tel" inputMode="numeric" autoComplete="tel" maxLength={12} placeholder="081-234-5678" {...field} onChange={(event) => field.onChange(formatPhone(event.target.value))} /></FormControl><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="province" render={({ field }) => <FormItem><FormLabel>จังหวัด *</FormLabel><Select value={field.value} onValueChange={(value) => { field.onChange(value); form.setValue("district", ""); form.setValue("subdistrict", ""); form.setValue("postalCode", "") }}><FormControl><SelectTrigger><SelectValue placeholder="เลือกจังหวัด" /></SelectTrigger></FormControl><SelectContent>{thaiProvinces.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="district" render={({ field }) => <FormItem><FormLabel>{province === "กรุงเทพมหานคร" ? "เขต" : "อำเภอ"} *</FormLabel><Select value={field.value} disabled={!province} onValueChange={(value) => { field.onChange(value); form.setValue("subdistrict", ""); form.setValue("postalCode", "") }}><FormControl><SelectTrigger><SelectValue placeholder={province ? `เลือก${province === "กรุงเทพมหานคร" ? "เขต" : "อำเภอ"}` : "เลือกจังหวัดก่อน"} /></SelectTrigger></FormControl><SelectContent>{districts.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="subdistrict" render={({ field }) => <FormItem><FormLabel>{province === "กรุงเทพมหานคร" ? "แขวง" : "ตำบล"} *</FormLabel><Select value={field.value} disabled={!district} onValueChange={(value) => { field.onChange(value); const codes = getThaiPostalCodes(province, district, value); form.setValue("postalCode", codes.length === 1 ? codes[0] : "", { shouldValidate: true }) }}><FormControl><SelectTrigger><SelectValue placeholder={district ? `เลือก${province === "กรุงเทพมหานคร" ? "แขวง" : "ตำบล"}` : "เลือกอำเภอก่อน"} /></SelectTrigger></FormControl><SelectContent>{subdistricts.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="postalCode" render={({ field }) => <FormItem><FormLabel>รหัสไปรษณีย์ *</FormLabel><Select value={field.value} disabled={!subdistrict} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="เลือกรหัสไปรษณีย์" /></SelectTrigger></FormControl><SelectContent>{postalCodes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>} />
                                <FormField control={form.control} name="details" render={({ field }) => <FormItem className="sm:col-span-2"><FormLabel>บ้านเลขที่ / อาคาร / ห้อง / ซอย / หมู่ / ถนน *</FormLabel><FormControl><Textarea className="min-h-24 resize-none" placeholder="เช่น 55 หมู่ 5 หรือ 123/45 อาคาร A ชั้น 5" {...field} /></FormControl><p className="text-xs text-slate-500">ไม่ต้องกรอกจังหวัด อำเภอ ตำบล และรหัสไปรษณีย์ซ้ำ</p><FormMessage /></FormItem>} />
                                {authenticated && <FormField control={form.control} name="isDefault" render={({ field }) => <FormItem className="sm:col-span-2"><label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3"><FormControl><Checkbox checked={Boolean(field.value)} onCheckedChange={(checked) => field.onChange(checked === true)} /></FormControl><span className="text-sm">ตั้งเป็นที่อยู่เริ่มต้น</span></label><FormMessage /></FormItem>} />}
                            </div>
                            <DialogFooter className="gap-2">
                                {authenticated && addresses.length > 0 && <Button type="button" variant="outline" onClick={() => { setError(null); setMode("list") }}>กลับไปรายการที่อยู่</Button>}
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isPending}>{isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserRound className="mr-2 h-4 w-4" />}{authenticated ? "บันทึกและใช้ที่อยู่นี้" : "ใช้ที่อยู่นี้"}</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    )
}

export function formatAddress(address: Pick<AddressInput, "details" | "province" | "district" | "subdistrict" | "postalCode">) {
    const bangkok = address.province === "กรุงเทพมหานคร"
    return `${address.details} ${bangkok ? "แขวง" : "ตำบล"}${address.subdistrict} ${bangkok ? "เขต" : "อำเภอ"}${address.district} จังหวัด${address.province} ${address.postalCode}`
}

function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}
