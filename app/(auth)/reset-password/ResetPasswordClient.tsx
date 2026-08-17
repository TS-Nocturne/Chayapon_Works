"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { authClient } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react"

const schema = z.object({
    password: z.string().min(12, { message: "รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร" }).max(128),
    confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
})

type FormValues = z.infer<typeof schema>

export default function ResetPasswordClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")
    const resetError = searchParams.get("error")

    const [isLoading, setIsLoading] = React.useState(false)
    const [success, setSuccess] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [showPassword, setShowPassword] = React.useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { password: "", confirmPassword: "" },
    })

    async function onSubmit(data: FormValues) {
        if (!token || resetError) {
            setError("ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ")
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const result = await authClient.resetPassword({
                newPassword: data.password,
                token: token as string,
            })

            if (result.error) {
                setError(result.error.message || "เกิดข้อผิดพลาด")
            } else {
                setSuccess(true)
                setTimeout(() => router.push("/sign-in"), 3000)
            }
        } catch {
            setError("เกิดข้อผิดพลาดในการเชื่อมต่อ")
        } finally {
            setIsLoading(false)
        }
    }

    if (!token || resetError) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <Card className="w-full max-w-md text-center p-6">
                    <p className="text-destructive mb-4">ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง</p>
                    <Link href="/forgot-password"><Button>ขอลิงก์ใหม่</Button></Link>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>ตั้งรหัสผ่านใหม่</CardTitle>
                    <CardDescription>กรอกรหัสผ่านใหม่ของคุณ</CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="text-center py-4 space-y-3">
                            <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
                            <p className="text-sm">เปลี่ยนรหัสผ่านสำเร็จ! กำลังนำไปหน้าเข้าสู่ระบบ...</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>
                            )}
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField control={form.control} name="password" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>รหัสผ่านใหม่</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input type={showPassword ? "text" : "password"} {...field} />
                                                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowPassword(!showPassword)}>
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>ยืนยันรหัสผ่าน</FormLabel>
                                            <FormControl><Input type="password" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        บันทึกรหัสผ่านใหม่
                                    </Button>
                                </form>
                            </Form>
                        </>
                    )}
                </CardContent>
                <CardFooter className="justify-center">
                    <Link href="/sign-in"><Button variant="ghost" size="sm">เข้าสู่ระบบ</Button></Link>
                </CardFooter>
            </Card>
        </div>
    )
}
