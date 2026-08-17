"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { useSession } from "@/lib/auth-client"
import { type CartItem, useCart } from "@/lib/cart-context"
import { createOrder } from "@/app/actions/order"
import { generatePromptPayQr } from "@/app/actions/store-settings"
import { CHECKOUT_SHIPPING_FEE } from "@/lib/checkout"
import { checkoutSchema, type CheckoutValues } from "@/lib/validations/order"
import type { AddressInput, SavedAddress } from "@/lib/validations/address"
import { formatPrice } from "@/lib/utils"
import ProductImage from "@/components/ProductImage"
import AddressBookDialog, { formatAddress } from "@/components/checkout/AddressBookDialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ArrowLeft, Check, CheckCircle2, ChevronDown, Loader2, LockKeyhole, Mail, MapPin, Pencil, QrCode, ShoppingBag, UploadCloud } from "lucide-react"

type CheckoutStep = 1 | 2 | 3

export default function CheckoutPageClient({ promptPayAccountName, storeName, initialAddresses }: { promptPayAccountName: string; storeName: string; initialAddresses: SavedAddress[] }) {
    const { data: session, isPending } = useSession()
    const { items, totalAmount, clearCart } = useCart()
    const [step, setStep] = React.useState<CheckoutStep>(1)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [qrDataUrl, setQrDataUrl] = React.useState("")
    const [slipName, setSlipName] = React.useState("")
    const [orderId, setOrderId] = React.useState("")
    const [completedItems, setCompletedItems] = React.useState<CartItem[]>([])
    const [completedSubtotal, setCompletedSubtotal] = React.useState(0)
    const initialAddress = initialAddresses.find((address) => address.isDefault) || initialAddresses[0]
    const [savedAddresses, setSavedAddresses] = React.useState(initialAddresses)
    const [selectedAddressId, setSelectedAddressId] = React.useState<string | null>(initialAddress?.id || null)
    const [addressDialogOpen, setAddressDialogOpen] = React.useState(false)
    const grandTotal = totalAmount + CHECKOUT_SHIPPING_FEE

    const form = useForm<CheckoutValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            shippingName: initialAddress?.recipientName || "",
            shippingPhone: initialAddress ? formatPhone(initialAddress.phone) : "",
            shippingAddress: initialAddress?.details || "",
            shippingProvince: initialAddress?.province || "",
            shippingDistrict: initialAddress?.district || "",
            shippingSubdistrict: initialAddress?.subdistrict || "",
            shippingPostalCode: initialAddress?.postalCode || "",
            paymentMethod: "promptpay",
            paymentSlip: "",
            note: "",
            items: [],
        },
    })
    const paymentSlip = useWatch({ control: form.control, name: "paymentSlip" })
    const shippingName = useWatch({ control: form.control, name: "shippingName" })
    const shippingPhone = useWatch({ control: form.control, name: "shippingPhone" })
    const shippingAddress = useWatch({ control: form.control, name: "shippingAddress" })
    const shippingProvince = useWatch({ control: form.control, name: "shippingProvince" })
    const shippingDistrict = useWatch({ control: form.control, name: "shippingDistrict" })
    const shippingSubdistrict = useWatch({ control: form.control, name: "shippingSubdistrict" })
    const shippingPostalCode = useWatch({ control: form.control, name: "shippingPostalCode" })
    const addressComplete = Boolean(shippingName && shippingPhone && shippingAddress && shippingProvince && shippingDistrict && shippingSubdistrict && shippingPostalCode)

    React.useEffect(() => {
        if (session?.user && !initialAddress) {
            form.setValue("shippingName", session.user.name || "")
            const user = session.user as typeof session.user & { phoneNumber?: string; address?: string }
            if (user.phoneNumber) form.setValue("shippingPhone", formatPhone(user.phoneNumber))
            if (user.address) form.setValue("shippingAddress", user.address)
        }
    }, [session, form, initialAddress])

    function applyAddress(address: AddressInput | SavedAddress, id: string | null) {
        form.setValue("shippingName", address.recipientName, { shouldValidate: true })
        form.setValue("shippingPhone", formatPhone(address.phone), { shouldValidate: true })
        form.setValue("shippingAddress", address.details, { shouldValidate: true })
        form.setValue("shippingProvince", address.province, { shouldValidate: true })
        form.setValue("shippingDistrict", address.district, { shouldValidate: true })
        form.setValue("shippingSubdistrict", address.subdistrict, { shouldValidate: true })
        form.setValue("shippingPostalCode", address.postalCode, { shouldValidate: true })
        setSelectedAddressId(id)
        setError(null)
    }

    React.useEffect(() => {
        form.setValue("items", items.map((item) => ({ productId: item.productId, quantity: item.quantity })))
    }, [items, form])

    React.useEffect(() => {
        if (!grandTotal || step !== 2) return
        let cancelled = false
        void generatePromptPayQr(grandTotal).then((result) => {
            if (cancelled) return
            if (result.success && result.qrDataUrl) {
                setQrDataUrl(result.qrDataUrl)
                setError(null)
            } else {
                setQrDataUrl("")
                setError(result.error || "ไม่สามารถสร้าง PromptPay QR ได้")
            }
        })
        return () => { cancelled = true }
    }, [grandTotal, step])

    if (isPending) {
        return <div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
    }

    if (step === 3) {
        return (
            <div className="market-shell py-6 sm:py-10">
                <CheckoutSteps active={3} />
                <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
                    <Card className="border-emerald-200 bg-gradient-to-br from-white to-emerald-50/60 shadow-none">
                        <CardContent className="flex min-h-[430px] flex-col items-center justify-center px-5 py-10 text-center">
                            <span className="grid h-20 w-20 place-items-center rounded-full border-2 border-emerald-500 bg-white text-emerald-600"><Check className="h-10 w-10" strokeWidth={2.5} /></span>
                            <h1 className="mt-6 text-2xl font-bold sm:text-3xl">สั่งซื้อสำเร็จ</h1>
                            <p className="mt-2 max-w-md text-sm text-slate-500">เราได้รับคำสั่งซื้อและสลิปของคุณแล้ว ทีมงานจะตรวจสอบการชำระเงินและอัปเดตสถานะให้เร็วที่สุด</p>
                            <div className="mt-6 rounded-xl border border-slate-200 bg-white px-6 py-4">
                                <p className="text-xs text-slate-500">หมายเลขคำสั่งซื้อ</p>
                                <p className="mt-1 font-bold text-blue-700">#{orderId}</p>
                                <p className="mt-3 text-xs text-slate-500">ยอดชำระ</p>
                                <p className="mt-1 text-xl font-bold text-blue-700">{formatPrice(completedSubtotal + CHECKOUT_SHIPPING_FEE)}</p>
                            </div>
                            <div className="mt-7 flex w-full max-w-lg flex-col-reverse gap-3 sm:flex-row">
                                <Link href="/parts" className="flex-1"><Button variant="outline" className="h-12 w-full border-blue-600 text-blue-700">เลือกซื้อสินค้าต่อ</Button></Link>
                                <Link href={`/orders/${orderId}`} className="flex-1"><Button className="h-12 w-full bg-blue-600 hover:bg-blue-700">ติดตามคำสั่งซื้อ</Button></Link>
                            </div>
                        </CardContent>
                    </Card>
                    <OrderSummary items={completedItems} subtotal={completedSubtotal} />
                </div>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
                <ShoppingBag className="h-16 w-16 text-slate-300" />
                <h1 className="text-xl font-bold">ยังไม่มีสินค้าในตะกร้า</h1>
                <Link href="/parts"><Button className="bg-blue-600 hover:bg-blue-700">ไปเลือกซื้ออะไหล่</Button></Link>
            </div>
        )
    }

    async function continueToPayment() {
        if (!addressComplete) {
            setError("กรุณาเพิ่มหรือเลือกที่อยู่จัดส่งก่อนดำเนินการชำระเงิน")
            setAddressDialogOpen(true)
            return
        }
        const fields: (keyof CheckoutValues)[] = [
            "shippingName",
            "shippingPhone",
            "shippingAddress",
            "shippingProvince",
            "shippingDistrict",
            "shippingSubdistrict",
            "shippingPostalCode",
        ]
        const valid = await form.trigger(fields, { shouldFocus: true })
        if (valid) {
            setError(null)
            setStep(2)
            window.scrollTo({ top: 0, behavior: "smooth" })
        } else {
            setError("ยังมีข้อมูลจัดส่งที่ต้องแก้ไข กรุณาตรวจสอบช่องที่มีกรอบสีแดงด้านล่าง")
        }
    }

    function handleSlip(file?: File) {
        if (!file) return
        if (!file.type.startsWith("image/")) {
            form.setError("paymentSlip", { message: "รองรับเฉพาะไฟล์รูปภาพ JPG หรือ PNG" })
            return
        }
        if (file.size > 1_400_000) {
            form.setError("paymentSlip", { message: "ไฟล์ต้องมีขนาดไม่เกิน 1.4 MB" })
            return
        }
        const reader = new FileReader()
        reader.onload = () => {
            form.setValue("paymentSlip", String(reader.result), { shouldValidate: true })
            setSlipName(file.name)
        }
        reader.readAsDataURL(file)
    }

    async function onSubmit(data: CheckoutValues) {
        setIsSubmitting(true)
        setError(null)
        const result = await createOrder(data)
        if (result.success && result.orderId) {
            setCompletedItems(items)
            setCompletedSubtotal(totalAmount)
            setOrderId(result.orderId)
            setStep(3)
            clearCart()
            window.scrollTo({ top: 0, behavior: "smooth" })
        } else {
            setError(result.error || "เกิดข้อผิดพลาด กรุณาลองอีกครั้ง")
        }
        setIsSubmitting(false)
    }

    return (
        <div className="market-shell py-5 sm:py-10">
            <CheckoutSteps active={step} />

            <details className="group mt-6 rounded-xl border border-slate-200 bg-white lg:hidden" open>
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold">
                    <span>สรุปคำสั่งซื้อ · {formatPrice(grandTotal)}</span>
                    <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                </summary>
                <div className="border-t border-slate-100 p-4"><OrderSummaryContent items={items} subtotal={totalAmount} /></div>
            </details>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
                <div>
                    {step === 1 ? (
                        <Card className="rounded-xl border-slate-200 shadow-none">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl">ข้อมูลจัดส่ง</CardTitle>
                                <p className="text-sm text-slate-500">เลือกที่อยู่ที่บันทึกไว้ในบัญชี หรือเพิ่มที่อยู่ใหม่</p>
                            </CardHeader>
                            <CardContent>
                                {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><span className="font-bold">ตรวจสอบข้อมูล:</span><span>{error}</span></div>}
                                <Form {...form}>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <section className="sm:col-span-2">
                                            <div className="mb-2 flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">ที่อยู่จัดส่ง *</p><p className="mt-0.5 text-xs text-slate-500">เลือกจากสมุดที่อยู่หรือเพิ่มที่อยู่ใหม่</p></div>{addressComplete && <Button type="button" variant="ghost" size="sm" className="text-blue-700" onClick={() => setAddressDialogOpen(true)}><Pencil className="mr-1.5 h-4 w-4" />เปลี่ยน</Button>}</div>
                                            {addressComplete ? (
                                                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                                                    <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-700"><MapPin className="h-5 w-5" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{savedAddresses.find((address) => address.id === selectedAddressId)?.label || "ที่อยู่จัดส่ง"}</p>{savedAddresses.find((address) => address.id === selectedAddressId)?.isDefault && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">ค่าเริ่มต้น</span>}</div><p className="mt-1 text-sm font-medium">{shippingName} · {shippingPhone}</p><p className="mt-1 break-words text-sm leading-6 text-slate-600">{formatAddress({ details: shippingAddress, province: shippingProvince, district: shippingDistrict, subdistrict: shippingSubdistrict, postalCode: shippingPostalCode })}</p></div></div>
                                                </div>
                                            ) : (
                                                <button type="button" onClick={() => setAddressDialogOpen(true)} className="flex min-h-28 w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/30 p-5 text-blue-700 transition hover:border-blue-500 hover:bg-blue-50"><MapPin className="h-6 w-6" /><span className="font-semibold">เลือก/เพิ่มที่อยู่</span></button>
                                            )}
                                        </section>
                                        <FormField control={form.control} name="note" render={({ field }) => <FormItem className="sm:col-span-2"><FormLabel>หมายเหตุ (ถ้ามี)</FormLabel><FormControl><Textarea className="resize-none" placeholder="รายละเอียดเพิ่มเติมสำหรับการจัดส่ง" {...field} /></FormControl><FormMessage /></FormItem>} />
                                    </div>
                                </Form>
                                {session && <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"><CheckCircle2 className="h-4 w-4" />เติมข้อมูลจากบัญชีของคุณให้อัตโนมัติแล้ว</div>}
                                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                                    <Link href="/cart"><Button variant="outline" className="h-12 w-full gap-2 border-blue-600 text-blue-700 sm:w-44"><ArrowLeft className="h-4 w-4" />ย้อนกลับ</Button></Link>
                                    <Button type="button" onClick={continueToPayment} className="h-12 bg-blue-600 px-8 hover:bg-blue-700">ไปยังขั้นตอนชำระเงิน</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="rounded-xl border-slate-200 shadow-none">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl">ชำระเงินผ่าน PromptPay QR</CardTitle>
                                <p className="text-sm text-slate-500">สแกนและแนบสลิปเพื่อยืนยันการชำระเงิน</p>
                            </CardHeader>
                            <CardContent>
                                {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)}>
                                        <div className="grid gap-5 md:grid-cols-2">
                                            <section className="rounded-xl border border-slate-200 p-4 text-center">
                                                <p className="text-sm font-semibold">สแกน QR Code เพื่อชำระเงิน</p>
                                                <p className="mt-1 text-2xl font-bold text-blue-700">{formatPrice(grandTotal)}</p>
                                                {promptPayAccountName ? (
                                                    <div className="mx-auto mt-3 max-w-[300px] rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                                                        <p className="text-xs text-slate-500">ชื่อบัญชีผู้รับเงิน</p>
                                                        <p className="mt-0.5 font-semibold text-slate-900">{promptPayAccountName}</p>
                                                    </div>
                                                ) : (
                                                    <div role="alert" className="mx-auto mt-3 max-w-[320px] rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs text-amber-800">
                                                        {storeName} ยังไม่ได้ระบุชื่อบัญชี PromptPay กรุณาติดต่อร้านก่อนชำระเงิน
                                                    </div>
                                                )}
                                                <div className="mx-auto mt-4 grid aspect-square w-full max-w-[280px] place-items-center rounded-lg bg-white p-2">
                                                    {qrDataUrl ? <ProductImage src={qrDataUrl} alt={`PromptPay QR ยอด ${formatPrice(grandTotal)}`} width={280} height={280} className="h-full w-full object-contain" /> : <Loader2 className="h-8 w-8 animate-spin text-blue-600" />}
                                                </div>
                                                <p className="mt-3 text-xs text-slate-500">ยอดใน QR ถูกระบุไว้แล้ว ไม่ต้องกรอกจำนวนเงินซ้ำ</p>
                                            </section>

                                            <section>
                                                <FormField control={form.control} name="paymentSlip" render={({ fieldState }) => <FormItem>
                                                    <FormLabel className="text-base font-semibold">อัปโหลดสลิปที่นี่</FormLabel>
                                                    <FormControl>
                                                        <label className="mt-2 flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-5 text-center transition hover:border-blue-500 hover:bg-blue-50">
                                                            <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => handleSlip(event.target.files?.[0])} />
                                                            {paymentSlip ? <><CheckCircle2 className="h-12 w-12 text-emerald-600" /><p className="mt-3 font-semibold text-emerald-700">อัปโหลดสลิปแล้ว</p><p className="mt-1 max-w-full truncate text-xs text-slate-500">{slipName}</p><span className="mt-4 rounded-md border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700">เปลี่ยนไฟล์</span></> : <><UploadCloud className="h-12 w-12 text-blue-600" /><p className="mt-3 font-semibold">แตะเพื่อเลือกสลิป</p><p className="mt-1 text-xs text-slate-500">รองรับ JPG, PNG หรือ WEBP ไม่เกิน 1.4 MB</p><span className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">เลือกไฟล์จากอุปกรณ์</span></>}
                                                        </label>
                                                    </FormControl>
                                                    {fieldState.error && <p className="mt-2 text-sm font-medium text-red-600">{fieldState.error.message}</p>}
                                                </FormItem>} />
                                            </section>
                                        </div>
                                        <div className="mt-5 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500"><LockKeyhole className="h-4 w-4 text-blue-600" />ข้อมูลการชำระเงินของคุณถูกส่งอย่างปลอดภัย</div>
                                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                                            <Button type="button" variant="outline" onClick={() => { setError(null); setStep(1) }} className="h-12 gap-2 border-blue-600 text-blue-700 sm:w-44"><ArrowLeft className="h-4 w-4" />ย้อนกลับ</Button>
                                            <Button type="submit" className="h-12 bg-blue-600 px-8 hover:bg-blue-700" disabled={isSubmitting || !qrDataUrl || !promptPayAccountName}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}ยืนยันการชำระเงิน</Button>
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    )}
                </div>
                <div className="hidden lg:block"><OrderSummary items={items} subtotal={totalAmount} /></div>
            </div>
            {addressDialogOpen && <AddressBookDialog
                addresses={savedAddresses}
                selectedAddressId={selectedAddressId}
                authenticated
                draft={{ label: "บ้าน", recipientName: shippingName || session?.user.name || "", phone: shippingPhone || "", details: shippingAddress || "", province: shippingProvince || "", district: shippingDistrict || "", subdistrict: shippingSubdistrict || "", postalCode: shippingPostalCode || "", isDefault: savedAddresses.length === 0 }}
                onClose={() => setAddressDialogOpen(false)}
                onSelect={applyAddress}
                onAddressesChange={setSavedAddresses}
            />}
        </div>
    )
}

function CheckoutSteps({ active }: { active: CheckoutStep }) {
    const labels = ["ข้อมูลจัดส่ง", "ชำระเงิน", "ยืนยัน/เสร็จสิ้น"]
    return <ol aria-label="ขั้นตอนชำระเงิน" className="mx-auto grid max-w-3xl grid-cols-3">{labels.map((label, index) => {
        const step = (index + 1) as CheckoutStep
        const complete = step < active
        const current = step === active
        return <li key={label} aria-current={current ? "step" : undefined} className="relative text-center">
            {index > 0 && <span className={`absolute right-1/2 top-4 h-0.5 w-full ${step <= active ? "bg-blue-600" : "bg-slate-200"}`} />}
            <span className={`relative z-10 mx-auto grid h-8 w-8 place-items-center rounded-full border text-xs font-bold ${step <= active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-400"}`}>{complete ? <Check className="h-4 w-4" /> : step}</span>
            <span className={`mt-2 block text-[11px] sm:text-sm ${current ? "font-bold text-blue-700" : step < active ? "font-medium text-blue-600" : "text-slate-400"}`}>{label}</span>
        </li>
    })}</ol>
}

function OrderSummary({ items, subtotal }: { items: CartItem[]; subtotal: number }) {
    return <Card className="rounded-xl border-slate-200 shadow-none lg:sticky lg:top-24"><CardHeader className="pb-4"><CardTitle className="text-lg">สรุปคำสั่งซื้อ</CardTitle></CardHeader><CardContent><OrderSummaryContent items={items} subtotal={subtotal} /></CardContent></Card>
}

function OrderSummaryContent({ items, subtotal }: { items: CartItem[]; subtotal: number }) {
    return <div>
        <div className="space-y-4">{items.map((item) => <div key={item.productId} className="flex gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"><ProductImage src={item.image} alt={item.title} fill sizes="64px" className="object-contain p-1" /></div>
            <div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-slate-500">จำนวน {item.quantity}</p></div>
            <p className="shrink-0 text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
        </div>)}</div>
        <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between text-slate-600"><span>ราคาสินค้า</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between text-slate-600"><span>ค่าจัดส่ง</span><span>{formatPrice(CHECKOUT_SHIPPING_FEE)}</span></div>
            <div className="mt-3 flex justify-between border-t border-dashed border-slate-200 pt-4 text-base font-bold"><span>ยอดสุทธิ</span><span className="text-xl text-blue-700">{formatPrice(subtotal + CHECKOUT_SHIPPING_FEE)}</span></div>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700"><Mail className="mt-0.5 h-4 w-4 shrink-0" />ระบบจะแจ้งเลขคำสั่งซื้อหลังอัปโหลดสลิปสำเร็จ</div>
    </div>
}

function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}
