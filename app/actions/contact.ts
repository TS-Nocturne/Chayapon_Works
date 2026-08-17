"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { contactFormSchema, type ContactFormValues } from "@/lib/validations/contact"
import { consumeRateLimit } from "@/lib/security-rate-limit"

export async function submitContactLead(data: ContactFormValues) {
    const parsed = contactFormSchema.safeParse(data)

    if (!parsed.success) {
        return {
            success: false,
            error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
            details: parsed.error.flatten(),
        }
    }

    const requestHeaders = await headers()
    const session = await auth.api.getSession({ headers: requestHeaders })
    if (!session) return { success: false, error: "กรุณาเข้าสู่ระบบก่อนติดต่อร้านหรือนัดหมาย" }

    const rateLimit = await consumeRateLimit({ scope: "contact-lead", requestHeaders, identity: session.user.id, max: 5, windowSeconds: 10 * 60 })
    if (!rateLimit.allowed) {
        return { success: false, error: `ส่งข้อมูลบ่อยเกินไป กรุณารอ ${rateLimit.retryAfterSeconds} วินาที` }
    }

    const product = await prisma.product.findUnique({
        where: { id: parsed.data.productId },
        select: { id: true },
    })

    if (!product) {
        return { success: false, error: "ไม่พบสินค้าที่ต้องการติดต่อ" }
    }

    await prisma.contactLead.create({
        data: {
            productId: parsed.data.productId,
            userId: session.user.id,
            name: parsed.data.name,
            phone: parsed.data.phone,
            preferredDate: parsed.data.preferredDate || null,
        },
    })

    revalidatePath("/dashboard/leads")

    return {
        success: true,
        message: "ได้รับข้อมูลของคุณเรียบร้อยแล้ว ทีมงานจะติดต่อกลับโดยเร็วที่สุด",
    }
}
