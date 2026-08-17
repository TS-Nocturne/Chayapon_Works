import { z } from "zod"

export const contactFormSchema = z.object({
  productId: z.string().min(10).max(64),
  name: z.string().trim().min(2, { message: "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร" }).max(120),
  phone: z.string().trim().regex(/^0\d{8,9}$/, { message: "กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง" }),
  preferredDate: z.iso.date().optional().or(z.literal("")),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>
