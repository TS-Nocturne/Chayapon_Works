import { z } from "zod"
import { getThaiPostalCodes } from "@/lib/thai-address"

export const addressInputSchema = z.object({
    id: z.string().min(10).max(64).optional(),
    label: z.string().trim().min(1, "กรุณาระบุชื่อที่อยู่").max(40),
    recipientName: z.string().trim().min(2, "กรุณากรอกชื่อผู้รับ").max(120),
    phone: z.string().regex(/^0\d{2}-?\d{3}-?\d{4}$/, "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก"),
    details: z.string().trim().min(3, "กรุณากรอกบ้านเลขที่หรือรายละเอียดจุดจัดส่ง").max(500),
    province: z.string().trim().min(1, "กรุณาเลือกจังหวัด").max(100),
    district: z.string().trim().min(1, "กรุณาเลือกเขต/อำเภอ").max(100),
    subdistrict: z.string().trim().min(1, "กรุณาเลือกแขวง/ตำบล").max(100),
    postalCode: z.string().regex(/^\d{5}$/, "กรุณาเลือกรหัสไปรษณีย์"),
    isDefault: z.boolean().default(false),
}).superRefine((value, context) => {
    const validPostalCodes = getThaiPostalCodes(value.province, value.district, value.subdistrict)
    if (!validPostalCodes.includes(value.postalCode)) {
        context.addIssue({ code: "custom", path: ["postalCode"], message: "ที่อยู่และรหัสไปรษณีย์ไม่สัมพันธ์กัน" })
    }
})

export type AddressInput = z.input<typeof addressInputSchema>
export type SavedAddress = z.output<typeof addressInputSchema> & { id: string }
