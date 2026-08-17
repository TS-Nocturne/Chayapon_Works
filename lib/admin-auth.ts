import "server-only"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

export async function requireAdminPage(callbackUrl = "/dashboard") {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
        redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    }

    if (session.user.role !== "ADMIN") {
        redirect("/")
    }

    return session
}

export async function requireBackOfficePage(callbackUrl = "/dashboard") {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`)
    if (!["ADMIN", "STAFF"].includes(session.user.role)) redirect("/")
    return session
}
