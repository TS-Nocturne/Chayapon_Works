// ==========================================
// Admin Server Actions — Auth-protected mutations
// ==========================================

"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// ─── Auth Guard Helper ───────────────────────────────────────
async function requireAdmin() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized: Admin access required")
    }
    return session
}

// ─── Toggle Product Status ───────────────────────────────────
export async function toggleProductStatus(productId: string, newStatus: string) {
    await requireAdmin()

    const validStatuses = ["active", "sold", "reserved"]
    if (!validStatuses.includes(newStatus)) {
        return { success: false, error: "Invalid status" }
    }

    await prisma.product.update({
        where: { id: productId },
        data: { status: newStatus },
    })

    revalidatePath("/dashboard/products")
    revalidatePath("/dashboard")
    revalidatePath("/")
    revalidatePath("/vehicles")
    revalidatePath("/real-estate")
    revalidatePath("/parts")
    return { success: true }
}

// ─── Toggle Product Featured ──────────────────────────────────
export async function toggleProductFeatured(productId: string) {
    await requireAdmin()

    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { featured: true },
    })

    if (!product) {
        return { success: false, error: "Product not found" }
    }

    await prisma.product.update({
        where: { id: productId },
        data: { featured: !product.featured },
    })

    revalidatePath("/dashboard/products")
    revalidatePath("/dashboard")
    revalidatePath("/")
    revalidatePath("/vehicles")
    revalidatePath("/real-estate")
    revalidatePath("/parts")
    return { success: true }
}

// ─── Change User Role ─────────────────────────────────────────
export async function changeUserRole(userId: string, newRole: string) {
    const session = await requireAdmin()

    const validRoles = ["USER", "STAFF", "ADMIN"]
    if (!validRoles.includes(newRole)) {
        return { success: false, error: "Invalid role" }
    }

    if (userId === session.user.id && newRole !== "ADMIN") {
        return { success: false, error: "ไม่สามารถลดสิทธิ์บัญชีผู้ดูแลที่กำลังใช้งานอยู่ได้" }
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    if (!targetUser) return { success: false, error: "ไม่พบบัญชีผู้ใช้" }
    if (targetUser.role === newRole) return { success: true }

    const requestHeaders = await headers()
    const configuredIpHeader = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase()
    const ipHeader = configuredIpHeader && /^[a-z0-9-]+$/.test(configuredIpHeader) ? configuredIpHeader : "x-real-ip"

    await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { role: newRole } }),
        prisma.auditLog.create({
            data: {
                userId: session.user.id,
                action: "CHANGE_USER_ROLE",
                entityType: "User",
                entityId: userId,
                details: { previousRole: targetUser.role, newRole },
                ipAddress: requestHeaders.get(ipHeader)?.split(",")[0]?.trim().slice(0, 128) || null,
            },
        }),
    ])

    revalidatePath("/dashboard/users")
    return { success: true }
}
