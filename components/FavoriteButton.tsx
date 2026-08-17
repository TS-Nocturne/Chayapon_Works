"use client"

import { useSyncExternalStore } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Heart } from "lucide-react"
import { useSession } from "@/lib/auth-client"

const STORAGE_KEY = "hybridmarket:favorites"
const CHANGE_EVENT = "hybridmarket:favorites-change"

function readFavorites(): string[] {
    try {
        const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]")
        return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
    } catch {
        return []
    }
}

function subscribe(callback: () => void) {
    window.addEventListener("storage", callback)
    window.addEventListener(CHANGE_EVENT, callback)
    return () => {
        window.removeEventListener("storage", callback)
        window.removeEventListener(CHANGE_EVENT, callback)
    }
}

export default function FavoriteButton({ productId, className = "" }: { productId: string; className?: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const { data: session, isPending } = useSession()
    const isFavorite = useSyncExternalStore(
        subscribe,
        () => readFavorites().includes(productId),
        () => false,
    )

    function toggleFavorite() {
        if (!session) {
            router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`)
            return
        }
        const favorites = readFavorites()
        const next = isFavorite
            ? favorites.filter((id) => id !== productId)
            : [...new Set([...favorites, productId])]
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        window.dispatchEvent(new Event(CHANGE_EVENT))
    }

    return (
        <button
            type="button"
            onClick={toggleFavorite}
            disabled={isPending}
            className={className}
            aria-label={!session ? "เข้าสู่ระบบเพื่อบันทึกรายการโปรด" : isFavorite ? "นำออกจากรายการโปรด" : "บันทึกเป็นรายการโปรด"}
            aria-pressed={isFavorite}
            title={!session ? "เข้าสู่ระบบเพื่อบันทึกรายการโปรด" : isFavorite ? "นำออกจากรายการโปรด" : "บันทึกเป็นรายการโปรด"}
        >
            <Heart className={`h-5 w-5 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
        </button>
    )
}
