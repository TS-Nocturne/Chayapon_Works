"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session || !["ADMIN", "STAFF"].includes((session.user as { role?: string }).role || "")) {
        throw new Error("Unauthorized")
    }
}

export async function updateLeadStatus(leadId: string, status: string) {
    try {
        await requireAdmin()

        if (!["new", "contacted", "closed"].includes(status)) {
            return { success: false, error: "สถานะไม่ถูกต้อง" }
        }

        await prisma.contactLead.update({
            where: { id: leadId },
            data: { status },
        })

        revalidatePath("/dashboard/leads")
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error) {
        console.error("Lead status update failed", error)
        return { success: false, error: "ไม่สามารถอัปเดตสถานะ Lead ได้" }
    }
}
