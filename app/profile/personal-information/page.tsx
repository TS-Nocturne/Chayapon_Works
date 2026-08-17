import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import ProfileForm from "../ProfileForm"
import ProfileNavigation from "../ProfileNavigation"

export const metadata = { title: "ข้อมูลส่วนตัว" }

export default async function PersonalInformationPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) redirect("/sign-in?callbackUrl=%2Fprofile%2Fpersonal-information")

    return <main className="min-h-screen bg-slate-50 py-6 sm:py-8"><div className="market-shell grid gap-5 lg:grid-cols-[220px_1fr]">
        <ProfileNavigation />
        <div className="space-y-5"><section><p className="text-sm font-semibold text-blue-700">MY ACCOUNT</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">ข้อมูลส่วนตัว</h1><p className="mt-1 text-sm text-slate-500">แก้ไขข้อมูลติดต่อ ที่อยู่ และรูปโปรไฟล์สำหรับการสั่งซื้อและนัดหมาย</p></section><ProfileForm user={session.user} /></div>
    </div></main>
}
