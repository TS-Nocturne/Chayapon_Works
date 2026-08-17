import { Suspense } from "react"
import ResetPasswordPage from "./ResetPasswordClient"

export const metadata = { title: "ตั้งรหัสผ่านใหม่" }

export default function Page() {
    return (
        <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center">กำลังโหลด...</div>}>
            <ResetPasswordPage />
        </Suspense>
    )
}
