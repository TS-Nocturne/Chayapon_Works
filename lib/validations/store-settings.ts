import { z } from "zod"

const optionalHttpsUrl = z.string().trim().refine(
    (value) => !value || /^https:\/\//i.test(value),
    "URL ต้องขึ้นต้นด้วย https://",
)

export const storeSettingsSchema = z.object({
    storeName: z.string().trim().min(2, "กรุณากรอกชื่อร้าน").max(80),
    contactPhone: z.string().trim().regex(/^0\d{8,9}$/, "กรุณากรอกเบอร์โทร 9–10 หลัก").or(z.literal("")),
    lineUrl: optionalHttpsUrl,
    promptPayId: z.string().transform((value) => value.replace(/\D/g, "")).refine(
        (value) => !value || value.length === 10 || value.length === 13,
        "PromptPay ต้องเป็นเบอร์โทร 10 หลักหรือเลขนิติบุคคล 13 หลัก",
    ),
    promptPayAccountName: z.string().trim().max(120),
    bankName: z.string().trim().max(100),
    bankAccountName: z.string().trim().max(120),
    bankAccountNumber: z.string().transform((value) => value.replace(/\D/g, "")).refine(
        (value) => !value || (value.length >= 10 && value.length <= 15),
        "เลขบัญชีต้องมี 10–15 หลัก",
    ),
}).superRefine((value, context) => {
    if (value.promptPayId && !value.promptPayAccountName) {
        context.addIssue({ code: "custom", path: ["promptPayAccountName"], message: "กรุณากรอกชื่อบัญชี PromptPay" })
    }
    if (value.bankAccountNumber && (!value.bankName || !value.bankAccountName)) {
        context.addIssue({ code: "custom", path: ["bankName"], message: "กรุณากรอกธนาคารและชื่อบัญชีให้ครบ" })
    }
})

export type StoreSettingsValues = z.input<typeof storeSettingsSchema>
