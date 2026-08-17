"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { consumeRateLimit } from "@/lib/security-rate-limit"
import { addressInputSchema, type AddressInput, type SavedAddress } from "@/lib/validations/address"

async function currentUser() {
    const requestHeaders = await headers()
    const session = await auth.api.getSession({ headers: requestHeaders })
    return { requestHeaders, session }
}

export async function saveUserAddress(input: AddressInput) {
    try {
        const { requestHeaders, session } = await currentUser()
        if (!session) return { success: false as const, error: "กรุณาเข้าสู่ระบบเพื่อบันทึกที่อยู่" }

        const rateLimit = await consumeRateLimit({
            scope: "save-user-address",
            requestHeaders,
            identity: session.user.id,
            max: 20,
            windowSeconds: 10 * 60,
        })
        if (!rateLimit.allowed) return { success: false as const, error: "บันทึกที่อยู่บ่อยเกินไป กรุณารอสักครู่" }

        const parsed = addressInputSchema.safeParse(input)
        if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message || "ข้อมูลที่อยู่ไม่ถูกต้อง" }

        const data = parsed.data
        const address = await prisma.$transaction(async (tx) => {
            const existingCount = await tx.userAddress.count({ where: { userId: session.user.id } })
            if (!data.id && existingCount >= 10) throw new Error("ADDRESS_LIMIT")

            const owned = data.id
                ? await tx.userAddress.findFirst({ where: { id: data.id, userId: session.user.id } })
                : null
            if (data.id && !owned) throw new Error("ADDRESS_NOT_FOUND")

            const makeDefault = data.isDefault || existingCount === 0 || owned?.isDefault === true
            if (makeDefault) {
                await tx.userAddress.updateMany({ where: { userId: session.user.id }, data: { isDefault: false } })
            }

            const values = {
                label: data.label,
                recipientName: data.recipientName,
                phone: data.phone.replace(/\D/g, ""),
                details: data.details,
                province: data.province,
                district: data.district,
                subdistrict: data.subdistrict,
                postalCode: data.postalCode,
                isDefault: makeDefault,
            }

            return data.id
                ? tx.userAddress.update({ where: { id: data.id }, data: values })
                : tx.userAddress.create({ data: { ...values, userId: session.user.id } })
        })

        revalidatePath("/checkout")
        revalidatePath("/profile")
        return { success: true as const, address: serializeAddress(address) }
    } catch (error) {
        if (error instanceof Error && error.message === "ADDRESS_LIMIT") return { success: false as const, error: "บันทึกที่อยู่ได้สูงสุด 10 รายการ" }
        if (error instanceof Error && error.message === "ADDRESS_NOT_FOUND") return { success: false as const, error: "ไม่พบที่อยู่หรือคุณไม่มีสิทธิ์แก้ไข" }
        console.error("Save user address failed", error)
        return { success: false as const, error: "ไม่สามารถบันทึกที่อยู่ได้ กรุณาลองอีกครั้ง" }
    }
}

export async function deleteUserAddress(addressId: string) {
    try {
        const { requestHeaders, session } = await currentUser()
        if (!session) return { success: false as const, error: "กรุณาเข้าสู่ระบบ" }

        const rateLimit = await consumeRateLimit({ scope: "delete-user-address", requestHeaders, identity: session.user.id, max: 10, windowSeconds: 10 * 60 })
        if (!rateLimit.allowed) return { success: false as const, error: "ลบที่อยู่บ่อยเกินไป กรุณารอสักครู่" }

        await prisma.$transaction(async (tx) => {
            const address = await tx.userAddress.findFirst({ where: { id: addressId, userId: session.user.id } })
            if (!address) throw new Error("ADDRESS_NOT_FOUND")
            await tx.userAddress.delete({ where: { id: address.id } })
            if (address.isDefault) {
                const next = await tx.userAddress.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } })
                if (next) await tx.userAddress.update({ where: { id: next.id }, data: { isDefault: true } })
            }
        })

        revalidatePath("/checkout")
        const remaining = await prisma.userAddress.findMany({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] })
        return { success: true as const, addresses: remaining.map(serializeAddress) }
    } catch (error) {
        if (error instanceof Error && error.message === "ADDRESS_NOT_FOUND") return { success: false as const, error: "ไม่พบที่อยู่หรือคุณไม่มีสิทธิ์ลบ" }
        console.error("Delete user address failed", error)
        return { success: false as const, error: "ไม่สามารถลบที่อยู่ได้" }
    }
}

function serializeAddress(address: {
    id: string; label: string; recipientName: string; phone: string; details: string; province: string; district: string; subdistrict: string; postalCode: string; isDefault: boolean
}): SavedAddress {
    return { ...address }
}
