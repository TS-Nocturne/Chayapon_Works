"use server"

import QRCode from "qrcode"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createPromptPayPayload } from "@/lib/promptpay"
import { encryptSetting } from "@/lib/settings-crypto"
import { getPromptPayTarget, STORE_SETTINGS_ID } from "@/lib/store-settings"
import { storeSettingsSchema, type StoreSettingsValues } from "@/lib/validations/store-settings"
import { consumeRateLimit } from "@/lib/security-rate-limit"

async function requireAdmin() {
    const requestHeaders = await headers()
    const session = await auth.api.getSession({ headers: requestHeaders })
    if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized")
    return { session, requestHeaders }
}

export async function updateStoreSettings(values: StoreSettingsValues) {
    try {
        const { session, requestHeaders } = await requireAdmin()
        const parsed = storeSettingsSchema.safeParse(values)
        if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message || "ข้อมูลไม่ถูกต้อง" }

        const current = await prisma.storeSettings.findUnique({ where: { id: STORE_SETTINGS_ID } })
        const data = parsed.data
        const changedFields = [
            ["storeName", current?.storeName, data.storeName],
            ["contactPhone", current?.contactPhone || "", data.contactPhone],
            ["lineUrl", current?.lineUrl || "", data.lineUrl],
            ["promptPay", Boolean(current?.promptPayIdEncrypted), Boolean(data.promptPayId)],
            ["promptPayAccountName", current?.promptPayAccountName || "", data.promptPayAccountName],
            ["bankName", current?.bankName || "", data.bankName],
            ["bankAccountName", current?.bankAccountName || "", data.bankAccountName],
            ["bankAccount", Boolean(current?.bankAccountNumberEncrypted), Boolean(data.bankAccountNumber)],
        ].filter(([, before, after]) => before !== after).map(([field]) => String(field))

        await prisma.$transaction([
            prisma.storeSettings.upsert({
                where: { id: STORE_SETTINGS_ID },
                create: {
                    id: STORE_SETTINGS_ID,
                    storeName: data.storeName,
                    contactPhone: data.contactPhone || null,
                    lineUrl: data.lineUrl || null,
                    promptPayIdEncrypted: encryptSetting(data.promptPayId),
                    promptPayAccountName: data.promptPayAccountName || null,
                    bankName: data.bankName || null,
                    bankAccountName: data.bankAccountName || null,
                    bankAccountNumberEncrypted: encryptSetting(data.bankAccountNumber),
                    updatedById: session.user.id,
                },
                update: {
                    storeName: data.storeName,
                    contactPhone: data.contactPhone || null,
                    lineUrl: data.lineUrl || null,
                    promptPayIdEncrypted: encryptSetting(data.promptPayId),
                    promptPayAccountName: data.promptPayAccountName || null,
                    bankName: data.bankName || null,
                    bankAccountName: data.bankAccountName || null,
                    bankAccountNumberEncrypted: encryptSetting(data.bankAccountNumber),
                    updatedById: session.user.id,
                },
            }),
            prisma.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: "UPDATE_STORE_SETTINGS",
                    entityType: "StoreSettings",
                    entityId: STORE_SETTINGS_ID,
                    details: { changedFields },
                    ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
                },
            }),
        ])

        revalidatePath("/dashboard/settings")
        revalidatePath("/checkout")
        revalidatePath("/vehicles")
        revalidatePath("/real-estate")
        revalidatePath("/parts")
        return { success: true }
    } catch (error) {
        console.error("updateStoreSettings failed", error)
        return { success: false, error: "ไม่สามารถบันทึกการตั้งค่าร้านค้าได้" }
    }
}

export async function generatePromptPayQr(amount: number) {
    if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) {
        return { success: false, error: "ยอดชำระเงินไม่ถูกต้อง" }
    }
    const requestHeaders = await headers()
    const session = await auth.api.getSession({ headers: requestHeaders })
    if (!session) return { success: false, error: "กรุณาเข้าสู่ระบบก่อนชำระเงิน" }
    const rateLimit = await consumeRateLimit({ scope: "promptpay-qr", requestHeaders, identity: session.user.id, max: 30, windowSeconds: 60 })
    if (!rateLimit.allowed) return { success: false, error: "สร้าง QR บ่อยเกินไป กรุณารอสักครู่" }
    const target = await getPromptPayTarget()
    if (!target) return { success: false, error: "ร้านค้ายังไม่ได้ตั้งค่า PromptPay" }
    try {
        const payload = createPromptPayPayload(target, Math.round(amount * 100) / 100)
        const qrDataUrl = await QRCode.toDataURL(payload, { width: 360, margin: 1, errorCorrectionLevel: "M" })
        return { success: true, qrDataUrl }
    } catch (error) {
        console.error("generatePromptPayQr failed", error)
        return { success: false, error: "ไม่สามารถสร้าง PromptPay QR ได้" }
    }
}
