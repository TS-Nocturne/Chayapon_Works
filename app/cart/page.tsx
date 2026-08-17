import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import CartPageClient from "./CartPageClient"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
    title: "ตะกร้าสินค้า",
    robots: { index: false, follow: false },
}

export default async function CartPage() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) redirect("/sign-in?callbackUrl=/cart")
    return <CartPageClient />
}
