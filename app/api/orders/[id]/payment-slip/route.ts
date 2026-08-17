import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decryptSetting } from "@/lib/settings-crypto"
import { isSafeRasterDataUrl } from "@/lib/validations/image"

const dataUrlPattern = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!["ADMIN", "STAFF"].includes(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { id } = await params
    if (!id || id.length > 64) return NextResponse.json({ error: "Invalid order" }, { status: 400 })

    const order = await prisma.order.findUnique({ where: { id }, select: { paymentSlip: true } })
    if (!order?.paymentSlip) return NextResponse.json({ error: "Slip not found" }, { status: 404 })

    let dataUrl = order.paymentSlip
    if (dataUrl.startsWith("v1.")) {
        try {
            dataUrl = decryptSetting(dataUrl)
        } catch {
            return NextResponse.json({ error: "Unable to read slip" }, { status: 500 })
        }
    }
    if (!isSafeRasterDataUrl(dataUrl, 1_500_000)) return NextResponse.json({ error: "Invalid slip" }, { status: 422 })

    const match = dataUrlPattern.exec(dataUrl)
    if (!match) return NextResponse.json({ error: "Invalid slip" }, { status: 422 })
    const [, mime, payload] = match
    const body = Uint8Array.from(Buffer.from(payload, "base64"))

    return new NextResponse(body, {
        headers: {
            "Content-Type": mime === "jpeg" ? "image/jpeg" : `image/${mime}`,
            "Content-Disposition": `inline; filename="payment-slip-${id.slice(-8)}.${mime === "jpeg" ? "jpg" : mime}"`,
            "Cache-Control": "private, no-store, max-age=0",
            "X-Content-Type-Options": "nosniff",
        },
    })
}
