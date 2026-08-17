import { z } from "zod"
import { isSafeRasterDataUrl } from "@/lib/validations/image"

export const checkoutSchema = z.object({
    shippingName: z.string().trim().min(2, { message: "กรุณากรอกชื่อผู้รับ" }).max(120),
    shippingPhone: z.string().regex(/^0\d{2}-?\d{3}-?\d{4}$/, { message: "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก" }),
    // Province/district/subdistrict/postal code are validated separately, so a
    // concise detail such as "55 หมู่ 5" is already a complete street detail.
    shippingAddress: z.string().trim().min(3, { message: "กรุณากรอกบ้านเลขที่หรือรายละเอียดจุดจัดส่ง" }).max(500),
    shippingProvince: z.string().trim().min(1, { message: "กรุณาเลือกจังหวัด" }).max(100),
    shippingDistrict: z.string().trim().min(1, { message: "กรุณาเลือกเขต/อำเภอ" }).max(100),
    shippingSubdistrict: z.string().trim().min(1, { message: "กรุณาเลือกแขวง/ตำบล" }).max(100),
    shippingPostalCode: z.string().regex(/^\d{5}$/, { message: "กรุณาเลือกรหัสไปรษณีย์" }),
    paymentMethod: z.literal("promptpay"),
    paymentSlip: z.string().refine(
        (value) => isSafeRasterDataUrl(value, 1_500_000),
        { message: "รองรับสลิป JPG, PNG หรือ WebP ขนาดไม่เกิน 1.5 MB" },
    ),
    note: z.string().trim().max(1_000).optional(),
    items: z.array(
        z.object({
            productId: z.string().min(10).max(64),
            quantity: z.number().int().min(1).max(99),
        })
    ).min(1, { message: "ตะกร้าสินค้าว่างเปล่า" }).max(25, { message: "รายการสินค้าเกินจำนวนที่ระบบรองรับ" }),
}).superRefine(({ items }, ctx) => {
    const productIds = new Set(items.map((item) => item.productId))
    if (productIds.size !== items.length) {
        ctx.addIssue({
            code: "custom",
            path: ["items"],
            message: "รายการสินค้าในตะกร้าซ้ำกัน",
        })
    }
})

export type CheckoutValues = z.infer<typeof checkoutSchema>
