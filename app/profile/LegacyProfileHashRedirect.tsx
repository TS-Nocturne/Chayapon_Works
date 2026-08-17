"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LegacyProfileHashRedirect() {
    const router = useRouter()
    useEffect(() => {
        if (window.location.hash === "#appointments") router.replace("/profile/appointments")
        if (window.location.hash === "#personal-information") router.replace("/profile/personal-information")
    }, [router])
    return null
}
