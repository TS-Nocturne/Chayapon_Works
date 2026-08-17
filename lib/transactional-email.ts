import "server-only"

function escapeHtml(value: string) {
    return value.replace(/[&<>'"]/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
    })[character] || character)
}

export async function sendPasswordResetEmail({ to, name, resetUrl }: { to: string; name: string; resetUrl: string }) {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.AUTH_EMAIL_FROM
    if (!apiKey || !from) throw new Error("Transactional email is not configured")

    const expectedOrigin = new URL(process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000").origin
    const parsedResetUrl = new URL(resetUrl)
    if (parsedResetUrl.origin !== expectedOrigin || parsedResetUrl.pathname !== "/reset-password") {
        throw new Error("Rejected untrusted password reset URL")
    }

    const safeName = escapeHtml(name || "ลูกค้า")
    const safeUrl = escapeHtml(parsedResetUrl.toString())
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: [to],
            subject: "ตั้งรหัสผ่านใหม่สำหรับ Chayapon Works",
            text: `สวัสดี ${name || "ลูกค้า"}\n\nเปิดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่ (ลิงก์มีอายุ 1 ชั่วโมง):\n${parsedResetUrl.toString()}\n\nหากคุณไม่ได้เป็นผู้ขอ กรุณาเพิกเฉยต่ออีเมลนี้`,
            html: `<p>สวัสดี ${safeName}</p><p>เปิดลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่ ลิงก์มีอายุ 1 ชั่วโมง</p><p><a href="${safeUrl}">ตั้งรหัสผ่านใหม่</a></p><p>หากคุณไม่ได้เป็นผู้ขอ กรุณาเพิกเฉยต่ออีเมลนี้</p>`,
        }),
        cache: "no-store",
    })

    if (!response.ok) throw new Error(`Transactional email provider returned ${response.status}`)
}
