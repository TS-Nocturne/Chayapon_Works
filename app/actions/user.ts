"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { isSafeRasterDataUrl } from "@/lib/validations/image"
import { consumeRateLimit } from "@/lib/security-rate-limit"

const updateProfileSchema = z.object({
    name: z.string().trim().min(2, { message: "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร" }).max(120),
    phoneNumber: z.string().regex(/^[0-9]{10}$/, { message: "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้น" }).optional().or(z.literal("")),
    lineId: z.string().trim().max(100).optional().or(z.literal("")),
    address: z.string().trim().max(500).optional().or(z.literal("")),
    image: z.string()
        .refine((value) => isSafeRasterDataUrl(value, 400_000), {
            message: "รองรับรูปโปรไฟล์ JPG, PNG หรือ WebP ขนาดไม่เกิน 400 KB",
        })
        .optional(),
})

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>

export async function updateProfile(data: UpdateProfileValues) {
    try {
        const requestHeaders = await headers()
        const session = await auth.api.getSession({ headers: requestHeaders })

        if (!session) {
            return { success: false, error: "Unauthorized" }
        }

        const rateLimit = await consumeRateLimit({
            scope: "update-profile",
            requestHeaders,
            identity: session.user.id,
            max: 20,
            windowSeconds: 10 * 60,
        })
        if (!rateLimit.allowed) return { success: false, error: "บันทึกข้อมูลบ่อยเกินไป กรุณารอสักครู่" }

        const parsed = updateProfileSchema.safeParse(data)
        if (!parsed.success) {
            return { success: false, error: "ข้อมูลไม่ถูกต้อง" }
        }

        const { name, phoneNumber, lineId, address, image } = parsed.data

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name,
                phoneNumber: phoneNumber || null,
                lineId: lineId || null,
                address: address || null,
                ...(image !== undefined && { image })
            }
        })

        return {
            success: true,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                phoneNumber: updatedUser.phoneNumber,
                lineId: updatedUser.lineId,
                address: updatedUser.address,
                image: updatedUser.image,
            },
        }

    } catch (error) {
        console.error("Profile update error:", error)
        return { success: false, error: "Internal Server Error" }
    }
}
