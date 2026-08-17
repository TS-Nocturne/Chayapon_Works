"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { checkoutSchema, type CheckoutValues } from "@/lib/validations/order"
import { CHECKOUT_SHIPPING_FEE } from "@/lib/checkout"
import { getThaiPostalCodes } from "@/lib/thai-address"
import { getPromptPayTarget } from "@/lib/store-settings"
import { consumeRateLimit } from "@/lib/security-rate-limit"
import { encryptSetting } from "@/lib/settings-crypto"
import { z } from "zod"

const OUT_OF_STOCK_ERROR = "OUT_OF_STOCK"
const ORDER_NOT_FOUND_ERROR = "ORDER_NOT_FOUND"
const PRODUCT_UNAVAILABLE_ERROR = "PRODUCT_UNAVAILABLE"
const PAYMENT_NOT_VERIFIED_ERROR = "PAYMENT_NOT_VERIFIED"
const ORDER_STATUSES = ["pending", "confirmed", "shipped", "completed", "cancelled"] as const
const PAYMENT_STATUSES = ["verified", "rejected"] as const
const shipmentSchema = z.object({
    shippingCarrier: z.string().trim().min(2).max(100),
    trackingNumber: z.string().trim().min(3).max(100).regex(/^[A-Za-z0-9._/-]+$/),
})

async function requireUser() {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) throw new Error("Unauthorized")
    return session
}

async function requireAdmin() {
    const session = await requireUser()
    if (!["ADMIN", "STAFF"].includes(session.user.role)) throw new Error("Unauthorized")
    return session
}

export async function createOrder(data: CheckoutValues) {
    try {
        const requestHeaders = await headers()
        const session = await auth.api.getSession({ headers: requestHeaders })
        if (!session) return { success: false, error: "กรุณาเข้าสู่ระบบก่อนสั่งซื้อสินค้า" }
        const rateLimit = await consumeRateLimit({
            scope: "create-order",
            requestHeaders,
            identity: session.user.id,
            max: 5,
            windowSeconds: 10 * 60,
        })
        if (!rateLimit.allowed) {
            return { success: false, error: `สร้างคำสั่งซื้อบ่อยเกินไป กรุณารอ ${rateLimit.retryAfterSeconds} วินาที` }
        }

        const parsed = checkoutSchema.safeParse(data)
        if (!parsed.success) {
            return { success: false, error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }
        }

        const {
            items,
            shippingName,
            shippingPhone,
            shippingAddress,
            shippingProvince,
            shippingDistrict,
            shippingSubdistrict,
            shippingPostalCode,
            paymentMethod,
            paymentSlip,
            note,
        } = parsed.data

        if (paymentMethod === "promptpay" && !(await getPromptPayTarget())) {
            return { success: false, error: "ร้านค้ายังไม่ได้ตั้งค่า PromptPay กรุณาติดต่อร้านค้า" }
        }

        const validPostalCodes = getThaiPostalCodes(shippingProvince, shippingDistrict, shippingSubdistrict)
        if (!validPostalCodes.includes(shippingPostalCode)) {
            return { success: false, error: "ข้อมูลจังหวัด เขต/อำเภอ แขวง/ตำบล หรือรหัสไปรษณีย์ไม่สัมพันธ์กัน" }
        }

        const productIds = items.map((i) => i.productId)
        const products = await prisma.product.findMany({
            where: {
                id: { in: productIds },
                productType: "part",
                status: "active",
            },
            include: { part: true },
        })

        if (products.length !== items.length) {
            return { success: false, error: "มีสินค้าบางรายการไม่พร้อมขาย" }
        }

        const productMap = new Map(products.map((p) => [p.id, p]))
        let totalAmount = 0
        const orderItems: { productId: string; quantity: number; price: number }[] = []

        for (const item of items) {
            const product = productMap.get(item.productId)
            if (!product?.part) {
                return { success: false, error: "สินค้าไม่ถูกต้อง" }
            }
            if (product.part.stock < item.quantity) {
                return {
                    success: false,
                    error: `สินค้า "${product.title}" มีสต็อกไม่เพียงพอ (คงเหลือ ${product.part.stock})`,
                }
            }
            totalAmount += product.price * item.quantity
            orderItems.push({
                productId: product.id,
                quantity: item.quantity,
                price: product.price,
            })
        }

        const order = await prisma.$transaction(async (tx) => {
            for (const item of orderItems) {
                const result = await tx.part.updateMany({
                    where: {
                        productId: item.productId,
                        stock: { gte: item.quantity },
                    },
                    data: { stock: { decrement: item.quantity } },
                })
                if (result.count !== 1) throw new Error(OUT_OF_STOCK_ERROR)
            }

            return tx.order.create({
                data: {
                    userId: session.user.id,
                    totalAmount: totalAmount + CHECKOUT_SHIPPING_FEE,
                    shippingFee: CHECKOUT_SHIPPING_FEE,
                    shippingName,
                    shippingPhone,
                    shippingAddress: formatShippingAddress({
                        details: shippingAddress,
                        province: shippingProvince,
                        district: shippingDistrict,
                        subdistrict: shippingSubdistrict,
                        postalCode: shippingPostalCode,
                    }),
                    guestEmail: null,
                    paymentMethod,
                    paymentStatus: "pending_verification",
                    paymentSlip: encryptSetting(paymentSlip),
                    note: note || null,
                    items: { create: orderItems },
                },
                include: { items: true },
            })
        })

        revalidatePath("/parts")
        revalidatePath("/orders")
        revalidatePath("/dashboard/orders")

        return { success: true, orderId: order.id }
    } catch (error: unknown) {
        if (error instanceof Error && error.message === OUT_OF_STOCK_ERROR) {
            return { success: false, error: "มีสินค้าในตะกร้าสต็อกไม่เพียงพอ กรุณาตรวจสอบอีกครั้ง" }
        }
        console.error("Order creation failed", error)
        return { success: false, error: "เกิดข้อผิดพลาดในการสั่งซื้อ กรุณาลองอีกครั้ง" }
    }
}

function formatShippingAddress({ details, province, district, subdistrict, postalCode }: {
    details: string
    province: string
    district: string
    subdistrict: string
    postalCode: string
}) {
    const isBangkok = province === "กรุงเทพมหานคร"
    return [
        details.trim(),
        `${isBangkok ? "แขวง" : "ตำบล"}${subdistrict}`,
        `${isBangkok ? "เขต" : "อำเภอ"}${district}`,
        `จังหวัด${province}`,
        postalCode,
    ].join(" ")
}

export async function getUserOrders() {
    const session = await requireUser()

    return prisma.order.findMany({
        where: { userId: session.user.id },
        include: {
            items: {
                include: {
                    product: { include: { part: true } },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    })
}

export async function updateOrderStatus(
    orderId: string,
    status: string,
    shipment?: { shippingCarrier?: string; trackingNumber?: string },
) {
    try {
        const session = await requireAdmin()

        if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
            return { success: false, error: "สถานะคำสั่งซื้อไม่ถูกต้อง" }
        }

        const parsedShipment = status === "shipped" ? shipmentSchema.safeParse(shipment) : null
        if (parsedShipment && !parsedShipment.success) {
            return { success: false, error: "กรุณากรอกบริษัทขนส่งและเลขพัสดุให้ครบถ้วน (เลขพัสดุใช้ตัวอักษรภาษาอังกฤษ ตัวเลข จุด ขีดกลาง หรือ / เท่านั้น)" }
        }

        const requestHeaders = await headers()
        const configuredIpHeader = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase()
        const ipHeader = configuredIpHeader && /^[a-z0-9-]+$/.test(configuredIpHeader) ? configuredIpHeader : "x-real-ip"

        await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: orderId },
                include: {
                    items: {
                        include: {
                            product: { select: { status: true, productType: true, part: true } },
                        },
                    },
                },
            })

            if (!order) throw new Error(ORDER_NOT_FOUND_ERROR)
            if (order.status === status && status !== "shipped") return
            if (["confirmed", "shipped", "completed"].includes(status) && order.paymentStatus !== "verified") {
                throw new Error(PAYMENT_NOT_VERIFIED_ERROR)
            }

            if (status === "cancelled" && order.status !== "cancelled") {
                for (const item of order.items) {
                    await tx.part.update({
                        where: { productId: item.productId },
                        data: { stock: { increment: item.quantity } },
                    })
                }
            } else if (order.status === "cancelled" && status !== "cancelled") {
                for (const item of order.items) {
                    if (item.product.productType !== "part" || item.product.status !== "active" || !item.product.part) {
                        throw new Error(PRODUCT_UNAVAILABLE_ERROR)
                    }

                    const result = await tx.part.updateMany({
                        where: { productId: item.productId, stock: { gte: item.quantity } },
                        data: { stock: { decrement: item.quantity } },
                    })
                    if (result.count !== 1) throw new Error(OUT_OF_STOCK_ERROR)
                }
            }

            await tx.order.update({
                where: { id: orderId },
                data: {
                    status,
                    ...(status === "shipped" && parsedShipment?.success
                        ? {
                            shippingCarrier: parsedShipment.data.shippingCarrier,
                            trackingNumber: parsedShipment.data.trackingNumber.toUpperCase(),
                            shippedAt: order.shippedAt ?? new Date(),
                        }
                        : {}),
                },
            })

            await tx.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: status === "shipped" ? "SHIP_ORDER" : "UPDATE_ORDER_STATUS",
                    entityType: "Order",
                    entityId: orderId,
                    details: {
                        previousStatus: order.status,
                        status,
                        ...(status === "shipped" && parsedShipment?.success ? parsedShipment.data : {}),
                    },
                    ipAddress: requestHeaders.get(ipHeader)?.split(",")[0]?.trim().slice(0, 128) || null,
                },
            })
        })

        revalidatePath("/dashboard")
        revalidatePath("/dashboard/orders")
        revalidatePath("/orders")
        revalidatePath("/profile")
        revalidatePath(`/orders/${orderId}`)
        revalidatePath("/parts")
        return { success: true }
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.message === ORDER_NOT_FOUND_ERROR) return { success: false, error: "ไม่พบคำสั่งซื้อ" }
            if (error.message === OUT_OF_STOCK_ERROR) return { success: false, error: "สต็อกไม่เพียงพอสำหรับนำคำสั่งซื้อนี้กลับมาดำเนินการ" }
            if (error.message === PRODUCT_UNAVAILABLE_ERROR) return { success: false, error: "มีสินค้าในคำสั่งซื้อที่ไม่พร้อมขาย" }
            if (error.message === PAYMENT_NOT_VERIFIED_ERROR) return { success: false, error: "ต้องตรวจสอบและอนุมัติการชำระเงินก่อนเปลี่ยนสถานะคำสั่งซื้อ" }
        }
        console.error("Order status update failed", error)
        return { success: false, error: "ไม่สามารถอัปเดตสถานะคำสั่งซื้อได้" }
    }
}

export async function updatePaymentStatus(orderId: string, paymentStatus: string) {
    try {
        const session = await requireAdmin()
        if (!PAYMENT_STATUSES.includes(paymentStatus as (typeof PAYMENT_STATUSES)[number])) {
            return { success: false, error: "สถานะการชำระเงินไม่ถูกต้อง" }
        }

        const requestHeaders = await headers()
        const configuredIpHeader = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase()
        const ipHeader = configuredIpHeader && /^[a-z0-9-]+$/.test(configuredIpHeader) ? configuredIpHeader : "x-real-ip"

        await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({ where: { id: orderId }, select: { paymentStatus: true, paymentSlip: true, status: true } })
            if (!order) throw new Error(ORDER_NOT_FOUND_ERROR)
            if (!order.paymentSlip) throw new Error("PAYMENT_SLIP_MISSING")
            if (order.paymentStatus === "verified" && paymentStatus === "rejected") throw new Error("PAYMENT_ALREADY_VERIFIED")
            if (order.paymentStatus === paymentStatus) return

            await tx.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus,
                    ...(paymentStatus === "verified" && order.status === "pending" ? { status: "confirmed" } : {}),
                },
            })
            await tx.auditLog.create({
                data: {
                    userId: session.user.id,
                    action: paymentStatus === "verified" ? "VERIFY_PAYMENT" : "REJECT_PAYMENT",
                    entityType: "Order",
                    entityId: orderId,
                    details: { previousStatus: order.paymentStatus, paymentStatus },
                    ipAddress: requestHeaders.get(ipHeader)?.split(",")[0]?.trim().slice(0, 128) || null,
                },
            })
        })

        revalidatePath("/dashboard")
        revalidatePath("/dashboard/orders")
        revalidatePath("/orders")
        return { success: true }
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.message === ORDER_NOT_FOUND_ERROR) return { success: false, error: "ไม่พบคำสั่งซื้อ" }
            if (error.message === "PAYMENT_SLIP_MISSING") return { success: false, error: "คำสั่งซื้อนี้ไม่มีสลิปการชำระเงิน" }
            if (error.message === "PAYMENT_ALREADY_VERIFIED") return { success: false, error: "การชำระเงินนี้ได้รับอนุมัติแล้ว จึงเปลี่ยนเป็นไม่ผ่านจากหน้านี้ไม่ได้" }
        }
        console.error("Payment status update failed", error)
        return { success: false, error: "ไม่สามารถอัปเดตสถานะการชำระเงินได้" }
    }
}
