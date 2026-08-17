"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { authClient } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Mail } from "lucide-react"

const schema = z.object({
    email: z.string().email({ message: "อีเมลไม่ถูกต้อง" }),
})

type FormValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = React.useState(false)
    const [sent, setSent] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { email: "" },
    })

    async function onSubmit(data: FormValues) {
        setIsLoading(true)
        setError(null)

        try {
            const result = await authClient.requestPasswordReset({
                email: data.email,
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (result.error) {
                setError(result.error.message || "เกิดข้อผิดพลาด")
            } else {
                setSent(true)
            }
        } catch {
            setError("เกิดข้อผิดพลาดในการเชื่อมต่อ")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle>ลืมรหัสผ่าน</CardTitle>
                    <CardDescription>
                        {sent
                            ? "หากอีเมลนี้มีในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปแล้ว"
                            : "กรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sent ? (
                        <div className="text-center py-4">
                            <Mail className="h-12 w-12 mx-auto text-primary mb-4" />
                            <p className="text-sm text-muted-foreground">ตรวจสอบกล่องจดหมายของคุณ</p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">{error}</div>
                            )}
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>อีเมล</FormLabel>
                                            <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        ส่งลิงก์รีเซ็ตรหัสผ่าน
                                    </Button>
                                </form>
                            </Form>
                        </>
                    )}
                </CardContent>
                <CardFooter className="justify-center">
                    <Link href="/sign-in">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            กลับไปเข้าสู่ระบบ
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
