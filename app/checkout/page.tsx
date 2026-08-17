import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import CheckoutPageClient from "./CheckoutPageClient"
import { getPublicStoreSettings } from "@/lib/store-settings"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
    title: "ชำระเงินผ่าน PromptPay",
    robots: { index: false, follow: false },
}

export default async function CheckoutPage() {
    const [settings, session] = await Promise.all([
        getPublicStoreSettings(),
        auth.api.getSession({ headers: await headers() }),
    ])
    if (!session) redirect("/sign-in?callbackUrl=/checkout")
    const addresses = await prisma.userAddress.findMany({ where: { userId: session.user.id }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] })

    return <CheckoutPageClient
        promptPayAccountName={settings.promptPayAccountName}
        storeName={settings.storeName}
        initialAddresses={addresses.map(({ id, label, recipientName, phone, details, province, district, subdistrict, postalCode, isDefault }) => ({ id, label, recipientName, phone, details, province, district, subdistrict, postalCode, isDefault }))}
    />
}
