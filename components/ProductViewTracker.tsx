"use client"

import { useEffect, useRef } from "react"
import { incrementProductView } from "@/app/actions/product"

export default function ProductViewTracker({ productId }: { productId: string }) {
    const tracked = useRef(false)

    useEffect(() => {
        if (tracked.current) return
        tracked.current = true
        void incrementProductView(productId)
    }, [productId])

    return null
}
