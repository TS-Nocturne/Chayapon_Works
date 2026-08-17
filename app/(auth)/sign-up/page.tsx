"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import { authClient } from "@/lib/auth-client"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { GoogleIcon } from "@/components/google-icon"
import { Loader2, Eye, EyeOff } from "lucide-react"

const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"

const signUpSchema = z.object({
    name: z.string().min(2, { message: "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร" }),
    email: z.string().email({ message: "อีเมลไม่ถูกต้อง" }),
    password: z.string().min(12, { message: "รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร" }).max(128),
    confirmPassword: z.string(),
    phoneNumber: z.string()
        .regex(/^[0-9]{10}$/, { message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น" })
        .optional()
        .or(z.literal("")),
    acceptedPolicies: z.boolean().refine((accepted) => accepted, {
        message: "กรุณายอมรับข้อกำหนดการใช้งานและรับทราบนโยบายความเป็นส่วนตัว",
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
})

type SignUpValues = z.infer<typeof signUpSchema>

export default function SignUpPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = React.useState(false)
    const [globalError, setGlobalError] = React.useState<string | null>(null)
    const [showPassword, setShowPassword] = React.useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

    const form = useForm<SignUpValues>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            phoneNumber: "",
            acceptedPolicies: false,
        },
    })
    const acceptedPolicies = useWatch({ control: form.control, name: "acceptedPolicies" })

    async function onSubmit(data: SignUpValues) {
        setIsLoading(true)
        setGlobalError(null)

        try {
            const { error } = await authClient.signUp.email({
                email: data.email,
                password: data.password,
                name: data.name,
                // @ts-expect-error - Custom field handled by server's user.additionalFields
                phoneNumber: data.phoneNumber || undefined,
                policyAccepted: data.acceptedPolicies,
            })

            if (error) {
                setGlobalError(error.message || "เกิดข้อผิดพลาดในการลงทะเบียน")
                setIsLoading(false)
                return
            }

            // Success -> Redirect to Home
            router.push("/")
            router.refresh()
        } catch {
            setGlobalError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์")
            setIsLoading(false)
        }
    }

    async function signUpWithGoogle() {
        if (!acceptedPolicies) {
            form.setError("acceptedPolicies", {
                type: "manual",
                message: "กรุณายอมรับข้อกำหนดการใช้งานและรับทราบนโยบายความเป็นส่วนตัวก่อนสมัครด้วย Google",
            })
            return
        }

        setIsGoogleLoading(true)
        setGlobalError(null)

        try {
            const { error } = await authClient.signIn.social({
                provider: "google",
                callbackURL: "/",
                newUserCallbackURL: "/",
                errorCallbackURL: "/sign-up?error=google_oauth",
                requestSignUp: true,
                additionalData: {
                    policyAccepted: true,
                },
            })

            if (error) {
                setGlobalError(error.message || "ไม่สามารถสมัครสมาชิกด้วย Google ได้")
                setIsGoogleLoading(false)
            }
        } catch {
            setGlobalError("ไม่สามารถเชื่อมต่อ Google ได้ กรุณาลองใหม่อีกครั้ง")
            setIsGoogleLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-muted/50">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">สร้างบัญชีใหม่</CardTitle>
                    <CardDescription>
                        กรอกข้อมูลด้านล่างเพื่อลงทะเบียนเข้าสู่ระบบ
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {globalError && (
                                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                                    {globalError}
                                </div>
                            )}

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={signUpWithGoogle}
                                disabled={!googleAuthEnabled || !acceptedPolicies || isGoogleLoading || isLoading}
                            >
                                {isGoogleLoading ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <GoogleIcon className="mr-2 h-5 w-5" />
                                )}
                                สมัครสมาชิกด้วย Google
                            </Button>

                            {!googleAuthEnabled && (
                                <p className="text-center text-xs text-muted-foreground">
                                    ระบบ Google ยังรอการตั้งค่า Client ID โดยผู้ดูแล
                                </p>
                            )}

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground">หรือสมัครด้วยอีเมล</span>
                                </div>
                            </div>

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
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>อีเมล *</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="example@email.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
                                                    const value = e.target.value.replace(/\D/g, ""); // ลบตัวอักษรที่ไม่ใช่ตัวเลขออก
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
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>รหัสผ่าน *</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ยืนยันรหัสผ่าน *</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" {...field} />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="acceptedPolicies"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={(checked) => field.onChange(checked === true)}
                                                    aria-describedby="policy-consent-description"
                                                />
                                            </FormControl>
                                            <div id="policy-consent-description" className="text-sm leading-6 text-slate-600">
                                                ฉันได้อ่านและยอมรับ <Link href="/terms" target="_blank" className="font-semibold text-blue-700 hover:underline">ข้อกำหนดการใช้งาน</Link>{" "}
                                                และรับทราบ <Link href="/privacy" target="_blank" className="font-semibold text-blue-700 hover:underline">นโยบายคุ้มครองข้อมูลส่วนบุคคล</Link>
                                            </div>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading || !acceptedPolicies}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                ลงทะเบียน
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-center text-muted-foreground w-full">
                        มีบัญชีอยู่แล้ว?{" "}
                        <Link href="/sign-in" className="text-primary hover:underline font-medium">
                            เข้าสู่ระบบ
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
