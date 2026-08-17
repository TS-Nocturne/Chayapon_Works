"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { authClient } from "@/lib/auth-client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Upload, User as UserIcon } from "lucide-react"

import { updateProfile } from "@/app/actions/user"
import ProductImage from "@/components/ProductImage"

const profileSchema = z.object({
    name: z.string().min(2, { message: "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร" }),
    phoneNumber: z.string()
        .regex(/^[0-9]{10}$/, { message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น" })
        .optional()
        .or(z.literal("")),
    lineId: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
})

type ProfileValues = z.infer<typeof profileSchema>

interface ProfileFormProps {
    user: {
        name: string
        email: string
        image?: string | null
        phoneNumber?: string | null
        lineId?: string | null
        address?: string | null
    }
}

export default function ProfileForm({ user }: ProfileFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [globalError, setGlobalError] = React.useState<string | null>(null)
    const [globalSuccess, setGlobalSuccess] = React.useState<string | null>(null)
    
    const [imagePreview, setImagePreview] = React.useState<string | null>(user.image || null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const form = useForm<ProfileValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: user.name || "",
            phoneNumber: user.phoneNumber || "",
            lineId: user.lineId || "",
            address: user.address || "",
        },
    })

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            setGlobalError("กรุณาเลือกไฟล์รูปภาพ PNG, JPEG หรือ WebP")
            return
        }

        // Validate size before compression (e.g. max 5MB input)
        if (file.size > 5 * 1024 * 1024) {
            setGlobalError("ขนาดรูปภาพต้องไม่เกิน 5MB")
            return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
            const img = new Image()
            img.onload = () => {
                const MAX_WIDTH = 200
                const MAX_HEIGHT = 200
                let width = img.width
                let height = img.height

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round((height *= MAX_WIDTH / width))
                        width = MAX_WIDTH
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round((width *= MAX_HEIGHT / height))
                        height = MAX_HEIGHT
                    }
                }

                const canvas = document.createElement("canvas")
                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext("2d")
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height)
                    // Compress to JPEG with 70% quality
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.7)
                    setImagePreview(dataUrl)
                }
            }
            img.onerror = () => setGlobalError("ไม่สามารถอ่านไฟล์รูปภาพนี้ได้")
            img.src = event.target?.result as string
        }
        reader.onerror = () => setGlobalError("ไม่สามารถอ่านไฟล์รูปภาพนี้ได้")
        reader.readAsDataURL(file)
    }

    async function onSubmit(data: ProfileValues) {
        setIsLoading(true)
        setGlobalError(null)
        setGlobalSuccess(null)

        try {
            const result = await updateProfile({
                name: data.name,
                phoneNumber: data.phoneNumber,
                lineId: data.lineId,
                address: data.address,
                image: imagePreview || undefined,
            })

            if (!result.success) {
                setGlobalError(result.error || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล")
                setIsLoading(false)
                return
            }

            // Sync with Better Auth local cache so Navbar updates immediately
            await authClient.updateUser({
                name: data.name,
                image: imagePreview || undefined,
            })

            setGlobalSuccess("อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว")
            router.refresh()
        } catch {
            setGlobalError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>ข้อมูลทั่วไป</CardTitle>
                <CardDescription>
                    ข้อมูลที่ใช้สำหรับติดต่อและแสดงผลบนแพลตฟอร์ม
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        
                        {/* Profile Picture Upload */}
                        <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b">
                            <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-primary/20">
                                {imagePreview ? (
                                    <ProductImage src={imagePreview} alt="ตัวอย่างรูปโปรไฟล์" fill className="object-cover" sizes="96px" />
                                ) : (
                                    <UserIcon className="h-10 w-10 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex flex-col gap-2 text-center sm:text-left">
                                <h3 className="text-sm font-medium">รูปภาพโปรไฟล์</h3>
                                <p className="text-xs text-muted-foreground">ระบบจะปรับขนาดและบีบอัดรูปให้โดยอัตโนมัติ (ไม่เกิน 5MB)</p>
                                <div className="mt-1">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        เปลี่ยนรูป
                                    </Button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/png, image/jpeg, image/webp"
                                        onChange={handleImageChange}
                                    />
                                    {imagePreview && imagePreview !== user.image && (
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm" 
                                            className="ml-2 text-destructive hover:text-destructive"
                                            onClick={() => setImagePreview(user.image ?? null)}
                                        >
                                            ยกเลิก
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {globalError && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                {globalError}
                            </div>
                        )}
                        {globalSuccess && (
                            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
                                {globalSuccess}
                            </div>
                        )}

                        <div className="grid gap-6 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ชื่อ - นามสกุล *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="ชื่อ นามสกุล" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormItem>
                                <FormLabel>อีเมล</FormLabel>
                                <FormControl>
                                    <Input value={user.email} disabled className="bg-muted/50" />
                                </FormControl>
                                <FormDescription>ไม่สามารถเปลี่ยนอีเมลได้ในขณะนี้</FormDescription>
                            </FormItem>

                            <FormField
                                control={form.control}
                                name="phoneNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>เบอร์โทรศัพท์</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="tel" 
                                                placeholder="08XXXXXXXX" 
                                                {...field}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/\D/g, "");
                                                    if (value.length <= 10) {
                                                        field.onChange(value);
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="lineId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>LINE ID</FormLabel>
                                        <FormControl>
                                            <Input placeholder="LINE ID (ตัวเลือก)" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ที่อยู่จัดส่ง (สำหรับอะไหล่)</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="กรอกที่อยู่สำหรับจัดส่งสินค้า..." 
                                            className="resize-none h-24"
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="pt-4 flex justify-end">
                            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                บันทึกข้อมูล
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
