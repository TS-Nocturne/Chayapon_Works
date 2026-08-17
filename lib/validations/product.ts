import { z } from "zod"
import { isSafeImageSource } from "@/lib/validations/image"

const optionalNumber = (schema: z.ZodNumber) =>
    z.preprocess(
        (value) => value === "" || value === null || value === undefined ? undefined : value,
        z.coerce.number().pipe(schema).optional(),
    )

const imageSchema = z
    .string()
    .max(7_000_000, "รูปภาพมีขนาดใหญ่เกินไป")
    .refine(
        (value) => isSafeImageSource(value, 5_000_000),
        "รองรับเฉพาะ JPG, PNG, WebP, รูปภายในระบบ หรือ HTTPS URL",
    )

const baseProductSchema = z.object({
    title: z.string().trim().min(3, "กรุณากรอกชื่อสินค้าอย่างน้อย 3 ตัวอักษร").max(200),
    description: z.string().trim().max(10_000).optional(),
    price: z.coerce.number().min(0, "ราคาต้องไม่ติดลบ"),
    images: z
        .array(imageSchema)
        .min(1, "กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป")
        .max(8, "อัปโหลดรูปภาพได้สูงสุด 8 รูป")
        .refine(
            (images) => images.reduce((total, image) => total + image.length, 0) <= 7_000_000,
            "รูปภาพรวมมีขนาดใหญ่เกิน 7 MB",
        ),
    status: z.enum(["active", "sold", "reserved"]).default("active"),
    featured: z.boolean().default(false),
})

const vehicleSchema = z.object({
    productType: z.literal("vehicle"),
    brandName: z.string().trim().min(1, "กรุณาระบุยี่ห้อรถ").max(100),
    modelName: z.string().trim().min(1, "กรุณาระบุรุ่นรถ").max(100),
    year: z.coerce.number().min(1900, "ปีไม่ถูกต้อง").max(new Date().getFullYear() + 1),
    mileage: z.coerce.number().int().min(0),
    transmission: z.enum(["automatic", "manual"]),
    fuelType: z.enum(["gasoline", "diesel", "hybrid", "electric"]),
    color: z.string().trim().max(100).optional(),
    engineSize: optionalNumber(z.number().positive("ขนาดเครื่องยนต์ต้องมากกว่า 0")),
    bodyType: z.enum(["sedan", "suv", "pickup", "hatchback", "van", "coupe"]).optional(),
    driveType: z.enum(["fwd", "rwd", "awd", "4wd"]).optional(),
    plateProvince: z.string().trim().max(100).optional(),
})

const realEstateSchema = z.object({
    productType: z.literal("real_estate"),
    propertyType: z.enum(["house", "condo", "townhouse", "land"]),
    areaSqm: z.coerce.number().min(1, "กรุณาระบุพื้นที่ใช้สอย"),
    landSqw: optionalNumber(z.number().min(0)),
    bedrooms: z.coerce.number().int().min(0),
    bathrooms: z.coerce.number().int().min(0),
    floors: optionalNumber(z.number().int().min(0)),
    location: z.string().trim().min(1, "กรุณาระบุจังหวัด/ที่ตั้ง").max(200),
    district: z.string().trim().max(200).optional(),
    nearbyPlaces: z.string().trim().max(2_000).optional(),
    furnished: z.enum(["furnished", "unfurnished", "partially"]).optional(),
    parking: optionalNumber(z.number().int().min(0)),
    yearBuilt: optionalNumber(z.number().int().min(1800).max(new Date().getFullYear() + 5)),
    latitude: optionalNumber(z.number().min(-90).max(90)),
    longitude: optionalNumber(z.number().min(-180).max(180)),
})

const partSchema = z.object({
    productType: z.literal("part"),
    sku: z.string().trim().min(1, "กรุณาระบุรหัสสินค้า (SKU)").max(100),
    brand: z.string().trim().min(1, "กรุณาระบุยี่ห้อ").max(100),
    category: z.string().trim().min(1, "กรุณาระบุหมวดหมู่").max(100),
    compatibility: z.string().trim().min(1, "กรุณาระบุรุ่นที่รองรับ").max(2_000),
    stock: z.coerce.number().int().min(0, "จำนวนสต็อกต้องไม่ติดลบ").default(0),
})

export const productFormSchema = z.discriminatedUnion("productType", [
    baseProductSchema.merge(vehicleSchema),
    baseProductSchema.merge(realEstateSchema),
    baseProductSchema.merge(partSchema),
])

export type ProductFormValues = z.infer<typeof productFormSchema>
