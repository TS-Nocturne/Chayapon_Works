"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import { GoogleIcon } from "@/components/google-icon"
import { Loader2, Eye, EyeOff, Zap, ArrowRight } from "lucide-react"
import { safeInternalRedirect } from "@/lib/safe-redirect"

const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true"

const signInSchema = z.object({
    email: z.string().email({ message: "อีเมลไม่ถูกต้อง" }),
    password: z.string().min(1, { message: "กรุณากรอกรหัสผ่าน" }),
})

type SignInValues = z.infer<typeof signInSchema>

function SignInForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = safeInternalRedirect(searchParams.get("callbackUrl"))
    const oauthError = searchParams.get("error")
    const oauthErrorMessage = oauthError === "signup_disabled"
        ? "ยังไม่มีบัญชี Google นี้ กรุณาไปหน้าสมัครสมาชิกและยอมรับนโยบายก่อน"
        : oauthError
            ? "เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
            : null

    const [isLoading, setIsLoading] = React.useState(false)
    const [isGoogleLoading, setIsGoogleLoading] = React.useState(false)
    const [globalError, setGlobalError] = React.useState<string | null>(null)
    const [showPassword, setShowPassword] = React.useState(false)

    const form = useForm<SignInValues>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(data: SignInValues) {
        setIsLoading(true)
        setGlobalError(null)

        try {
            const { error } = await authClient.signIn.email({
                email: data.email,
                password: data.password,
            })

            if (error) {
                setGlobalError(error.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
                setIsLoading(false)
                return
            }

            router.push(callbackUrl)
            router.refresh()
        } catch {
            setGlobalError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์")
            setIsLoading(false)
        }
    }

    async function signInWithGoogle() {
        setIsGoogleLoading(true)
        setGlobalError(null)

        try {
            const { error } = await authClient.signIn.social({
                provider: "google",
                callbackURL: callbackUrl,
                errorCallbackURL: "/sign-in?error=google_oauth",
                requestSignUp: false,
            })

            if (error) {
                setGlobalError(error.message || "เข้าสู่ระบบด้วย Google ไม่สำเร็จ")
                setIsGoogleLoading(false)
            }
        } catch {
            setGlobalError("ไม่สามารถเชื่อมต่อ Google ได้ กรุณาลองใหม่อีกครั้ง")
            setIsGoogleLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md shadow-2xl border-white/20 bg-background/60 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-background -z-10" />
            
            <CardHeader className="space-y-3 pb-6 text-center pt-8">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-primary/60 shadow-lg shadow-primary/30 mb-2">
                    <Zap className="h-6 w-6 text-primary-foreground" />
                </div>
                <CardTitle className="text-3xl font-extrabold tracking-tight">ยินดีต้อนรับกลับมา</CardTitle>
                <CardDescription className="text-base font-medium">
                    กรอกข้อมูลเพื่อเข้าสู่ระบบ Chayapon Works
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button
                    type="button"
                    variant="outline"
                    className="mb-5 h-11 w-full rounded-xl bg-background/70 font-semibold"
                    onClick={signInWithGoogle}
                    disabled={!googleAuthEnabled || isGoogleLoading || isLoading}
                >
                    {isGoogleLoading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <GoogleIcon className="mr-2 h-5 w-5" />
                    )}
                    เข้าสู่ระบบด้วย Google
                </Button>
                {!googleAuthEnabled && (
                    <p className="-mt-2 mb-5 text-center text-xs text-muted-foreground">
                        ระบบ Google ยังรอการตั้งค่า Client ID โดยผู้ดูแล
                    </p>
                )}
                <div className="relative mb-5">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-muted-foreground/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background/80 px-2 text-muted-foreground">หรือเข้าสู่ระบบด้วยอีเมล</span>
                    </div>
                </div>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        {(globalError || oauthErrorMessage) && (
                            <div className="p-3 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-xl animate-in slide-in-from-top-2">
                                {globalError || oauthErrorMessage}
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5 flex flex-col items-start w-full">
                                    <FormLabel className="font-semibold text-foreground/80">อีเมล</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="email" 
                                            placeholder="example@email.com" 
                                            className="h-11 rounded-xl bg-background/50 focus-visible:ring-primary/30 transition-all border-muted-foreground/20 hover:border-muted-foreground/40 w-full"
                                            {...field} 
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
                                <FormItem className="space-y-1.5 flex flex-col items-start w-full">
                                    <div className="flex items-center justify-between w-full">
                                        <FormLabel className="font-semibold text-foreground/80">รหัสผ่าน</FormLabel>
                                        <Link 
                                            href="/forgot-password" 
                                            className="text-xs font-semibold text-primary hover:text-primary/80 hover:underline transition-colors"
                                        >
                                            ลืมรหัสผ่าน?
                                        </Link>
                                    </div>
                                    <FormControl>
                                        <div className="relative group w-full">
                                            <Input 
                                                type={showPassword ? "text" : "password"} 
                                                placeholder="••••••••" 
                                                className="h-11 rounded-xl bg-background/50 focus-visible:ring-primary/30 transition-all border-muted-foreground/20 hover:border-muted-foreground/40 pr-10 w-full"
                                                {...field} 
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button 
                            type="submit" 
                            className="w-full h-11 mt-2 text-base font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all group" 
                            disabled={isLoading || isGoogleLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    เข้าสู่ระบบ
                                    <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pb-8">
                <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-muted-foreground/20"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background/80 px-2 text-muted-foreground font-medium backdrop-blur-sm">หรือ</span>
                    </div>
                </div>
                <div className="text-sm text-center text-muted-foreground w-full">
                    ยังไม่มีบัญชีผู้ใช้?{" "}
                    <Link href="/sign-up" className="text-primary hover:text-primary/80 font-bold hover:underline transition-all">
                        สมัครสมาชิกฟรี
                    </Link>
                </div>
            </CardFooter>
        </Card>
    )
}

export default function SignInPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-[128px] opacity-70" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-[128px] opacity-70" />
            
            <div className="relative z-10 w-full max-w-md">
                <React.Suspense fallback={<Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />}>
                    <SignInForm />
                </React.Suspense>
            </div>
        </div>
    )
}
