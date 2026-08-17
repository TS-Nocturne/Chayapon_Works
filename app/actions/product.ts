"use server"

import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { consumeRateLimit } from "@/lib/security-rate-limit"

export async function incrementProductView(productId: string) {
    try {
        if (typeof productId !== "string" || productId.length < 10 || productId.length > 64) return
        const requestHeaders = await headers()
        const rateLimit = await consumeRateLimit({ scope: "product-view", requestHeaders, max: 60, windowSeconds: 60 })
        if (!rateLimit.allowed) return
        await prisma.product.update({
            where: { id: productId },
            data: { views: { increment: 1 } },
        })
    } catch {
        // Non-critical — ignore if product not found
    }
}
