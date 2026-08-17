import "server-only"

import { prisma } from "@/lib/prisma"
import { decryptSetting } from "@/lib/settings-crypto"

export const STORE_SETTINGS_ID = "primary"

function safeDecrypt(value?: string | null) {
    try {
        return decryptSetting(value)
    } catch (error) {
        console.error("Unable to decrypt store setting", error)
        return ""
    }
}

export async function getAdminStoreSettings() {
    const settings = await prisma.storeSettings.findUnique({ where: { id: STORE_SETTINGS_ID } })
    return {
        storeName: settings?.storeName || "Chayapon Works",
        contactPhone: settings?.contactPhone || "",
        lineUrl: settings?.lineUrl || process.env.LINE_URL || "",
        promptPayId: safeDecrypt(settings?.promptPayIdEncrypted) || process.env.PROMPTPAY_ID || "",
        promptPayAccountName: settings?.promptPayAccountName || "",
        bankName: settings?.bankName || "",
        bankAccountName: settings?.bankAccountName || "",
        bankAccountNumber: safeDecrypt(settings?.bankAccountNumberEncrypted),
        updatedAt: settings?.updatedAt || null,
        source: settings ? "database" as const : "environment" as const,
    }
}

export async function getPublicStoreSettings() {
    const settings = await prisma.storeSettings.findUnique({ where: { id: STORE_SETTINGS_ID } })
    return {
        storeName: settings?.storeName || "Chayapon Works",
        contactPhone: settings?.contactPhone || "",
        lineUrl: settings?.lineUrl || process.env.LINE_URL || "",
        promptPayAccountName: settings?.promptPayAccountName || "",
        bankName: settings?.bankName || "",
        bankAccountName: settings?.bankAccountName || "",
        bankAccountNumberMasked: maskAccountNumber(safeDecrypt(settings?.bankAccountNumberEncrypted)),
        promptPayConfigured: Boolean(settings?.promptPayIdEncrypted || process.env.PROMPTPAY_ID),
    }
}

export async function getPromptPayTarget() {
    const settings = await prisma.storeSettings.findUnique({
        where: { id: STORE_SETTINGS_ID },
        select: { promptPayIdEncrypted: true },
    })
    return safeDecrypt(settings?.promptPayIdEncrypted) || process.env.PROMPTPAY_ID || ""
}

function maskAccountNumber(value: string) {
    if (!value) return ""
    return `${"•".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`
}
