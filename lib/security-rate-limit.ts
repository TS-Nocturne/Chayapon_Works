import "server-only"

import { createHash } from "node:crypto"
import { Prisma } from "@/app/generated/prisma/client"
import { prisma } from "@/lib/prisma"

type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number }

function requestIdentity(requestHeaders: Headers) {
    const configuredHeader = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase()
    const headerName = configuredHeader && /^[a-z0-9-]+$/.test(configuredHeader)
        ? configuredHeader
        : process.env.NODE_ENV === "production"
            ? "x-real-ip"
            : "x-forwarded-for"
    const rawAddress = requestHeaders.get(headerName)?.split(",")[0]?.trim() || "shared-client"
    return rawAddress.slice(0, 128)
}

function rateLimitKey(scope: string, identity: string) {
    const pepper = process.env.BETTER_AUTH_SECRET || "development-only-rate-limit-key"
    return `app:${scope}:${createHash("sha256").update(`${pepper}:${identity}`).digest("hex")}`
}

export async function consumeRateLimit({
    scope,
    requestHeaders,
    max,
    windowSeconds,
    identity,
}: {
    scope: string
    requestHeaders: Headers
    max: number
    windowSeconds: number
    identity?: string
}): Promise<RateLimitResult> {
    const now = BigInt(Date.now())
    const cutoff = now - BigInt(windowSeconds * 1_000)
    const key = rateLimitKey(scope, identity || requestIdentity(requestHeaders))

    try {
        await prisma.rateLimit.create({ data: { key, count: 1, lastRequest: now } })
        return { allowed: true }
    } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error
    }

    const reset = await prisma.rateLimit.updateMany({
        where: { key, lastRequest: { lte: cutoff } },
        data: { count: 1, lastRequest: now },
    })
    if (reset.count === 1) return { allowed: true }

    const incremented = await prisma.rateLimit.updateMany({
        where: { key, lastRequest: { gt: cutoff }, count: { lt: max } },
        data: { count: { increment: 1 }, lastRequest: now },
    })
    if (incremented.count === 1) return { allowed: true }

    const current = await prisma.rateLimit.findUnique({ where: { key }, select: { lastRequest: true } })
    const retryAfterSeconds = current
        ? Math.max(1, Math.ceil(Number(current.lastRequest + BigInt(windowSeconds * 1_000) - now) / 1_000))
        : windowSeconds
    return { allowed: false, retryAfterSeconds }
}
