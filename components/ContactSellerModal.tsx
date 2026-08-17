"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CalendarCheck, MessageCircle, Loader2, Phone } from "lucide-react"

import { submitContactLead } from "@/app/actions/contact"
import { contactFormSchema, type ContactFormValues } from "@/lib/validations/contact"

interface ContactSellerModalProps {
    productId: string
    productTitle: string
    productType?: "vehicle" | "real_estate" | "part"
    ctaLabel?: string
}

export default function ContactSellerModal({ productId, productTitle, productType = "vehicle", ctaLabel }: ContactSellerModalProps) {
    // Text mappings based on product type
    const copy = {
        vehicle: {
            cta: "ติดต่อร้าน / นัดหมายทดลองขับ",
            descPrefix: "สำหรับรถ",
            dateLabel: "วันที่สะดวกนัดดูรถ (เลือกได้)",
        },
        real_estate: {
            cta: "ติดต่อร้าน / นัดดูสถานที่จริง",
            descPrefix: "สำหรับทรัพย์",
            dateLabel: "วันที่สะดวกนัดดูสถานที่ (เลือกได้)",
        },
        part: {
            cta: "ติดต่อร้าน / สอบถามอะไหล่",
            descPrefix: "สำหรับอะไหล่",
            dateLabel: "วันที่สะดวกรับสินค้า/ดูของ (เลือกได้)",
        }
    }
    const txt = copy[productType]
    const router = useRouter()
    const { data: session, isPending: sessionLoading } = useSession()

    const [isOpen, setIsOpen] = React.useState(false)
    const [isSubmitting, startTransition] = React.useTransition()
    const [isSuccess, setIsSuccess] = React.useState(false)
    const [submitError, setSubmitError] = React.useState<string | null>(null)
    const [contactSettings, setContactSettings] = React.useState<{ contactPhone: string; lineUrl: string } | null>(null)
    const authLoading = sessionLoading

    // Form logic
    const form = useForm<ContactFormValues>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            productId,
            name: session?.user?.name || "",
            phone: "",
            preferredDate: "",
        },
    })

    // Pre-fill name if session loads later
    React.useEffect(() => {
        if (session?.user?.name && !form.getValues("name")) {
            form.setValue("name", session.user.name)
        }
    }, [session, form])

    const categoryPaths = {
        vehicle: "/vehicles",
        real_estate: "/real-estate",
        part: "/parts",
    }

    // Auth Guard
    const handleTriggerClick = (e: React.MouseEvent) => {
        if (authLoading) {
            e.preventDefault()
            return
        }

        if (!session) {
            e.preventDefault()
            router.push(`/sign-in?callbackUrl=${encodeURIComponent(`${categoryPaths[productType]}/${productId}`)}`)
            return
        }

        if (!contactSettings) {
            void fetch("/api/store-settings")
                .then((response) => response.ok ? response.json() : null)
                .then((settings) => {
                    if (settings) setContactSettings({ contactPhone: settings.contactPhone || "", lineUrl: settings.lineUrl || "" })
                })
                .catch(() => setContactSettings({ contactPhone: "", lineUrl: "" }))
        }
    }

    const onSubmit = (data: ContactFormValues) => {
        setSubmitError(null)
        startTransition(async () => {
            const result = await submitContactLead(data)
            if (result.success) {
                setIsSuccess(true)
            } else {
                setSubmitError(result.error || "ไม่สามารถส่งข้อมูลได้ กรุณาลองอีกครั้ง")
            }
        })
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (!open) {
            // Reset form when modal fully closes
            setTimeout(() => {
                form.reset()
                setIsSuccess(false)
                setSubmitError(null)
            }, 300)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    onClick={handleTriggerClick}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
                    size="sm"
                    disabled={authLoading}
                >
                    {authLoading ? (
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                        <CalendarCheck className="h-4 w-4 mr-1.5" />
                    )}
                    {ctaLabel || txt.cta}
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>ติดต่อ Chayapon Works / นัดหมาย</DialogTitle>
                    <DialogDescription>
                        {txt.descPrefix} {productTitle}
                    </DialogDescription>
                </DialogHeader>

                {isSuccess ? (
                    <div className="py-6 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <CalendarCheck className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">เราได้รับข้อมูลของคุณแล้ว!</h3>
                        <p className="text-sm text-muted-foreground">
                            ทีมงานจะติดต่อกลับไปยืนยันคิวและตอบข้อสงสัยโดยเร็วที่สุด
                        </p>
                        <Button onClick={() => handleOpenChange(false)} variant="outline" className="mt-4 w-full">
                            ปิดหน้าต่าง
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                {submitError && (
                                    <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                        {submitError}
                                    </p>
                                )}
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ชื่อ - นามสกุล *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="เช่น สมชาย ใจดี" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>เบอร์โทรศัพท์ (ติดต่อกลับ) *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="08X-XXX-XXXX" type="tel" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="preferredDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{txt.dateLabel}</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    ส่งข้อมูลติดต่อ
                                </Button>
                            </form>
                        </Form>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">หรือ</span>
                            </div>
                        </div>

                        {contactSettings?.contactPhone && <a href={`tel:${contactSettings.contactPhone}`} className="block w-full">
                            <Button type="button" variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                                <Phone className="mr-2 h-4 w-4" />โทร {contactSettings.contactPhone}
                            </Button>
                        </a>}

                        {/* Show LINE only when the store has configured a real account. */}
                        {contactSettings?.lineUrl ? <a href={contactSettings.lineUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full text-[#00B900] border-[#00B900]/30 hover:bg-[#00B900]/5 hover:text-[#00B900]"
                            >
                                <MessageCircle className="mr-2 h-4 w-4" />
                                ติดต่อสอบถามผ่าน LINE
                            </Button>
                        </a> : !contactSettings?.contactPhone ? (
                            <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
                                กรุณาส่งแบบฟอร์มด้านบนเพื่อให้ร้านติดต่อกลับ
                            </p>
                        ) : null}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
