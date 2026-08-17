// ==========================================
// Seed Script: Vehicle Brands, Models & Sample Listings
// ==========================================
// รัน: pnpx tsx --env-file=.env prisma/seed-vehicles.ts
// Pattern เดียวกับ Day 5 seed script (ใช้ PrismaPg adapter โดยตรง)

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client"

const connectionString = process.env.DATABASE_URL!

async function main() {
    const adapter = new PrismaPg({ connectionString })
    const prisma = new PrismaClient({ adapter })

    console.log("\n🚗 Starting Vehicle Seed...\n")

    // ── 1. Create Brands ─────────────────────────────────────
    const brandsData = [
        { name: "Toyota", logo: null },
        { name: "Honda", logo: null },
        { name: "Mazda", logo: null },
        { name: "Nissan", logo: null },
        { name: "Mitsubishi", logo: null },
        { name: "Isuzu", logo: null },
        { name: "Mercedes-Benz", logo: null },
        { name: "BMW", logo: null },
    ]

    const brands: Record<string, string> = {}

    for (const brandData of brandsData) {
        const brand = await prisma.vehicleBrand.upsert({
            where: { name: brandData.name },
            update: {},
            create: brandData,
        })
        brands[brand.name] = brand.id
        console.log(`  ✅ Brand: ${brand.name}`)
    }

    // ── 2. Create Models ─────────────────────────────────────
    const modelsData: { name: string; brand: string }[] = [
        // Toyota
        { name: "Camry", brand: "Toyota" },
        { name: "Corolla Altis", brand: "Toyota" },
        { name: "Yaris", brand: "Toyota" },
        { name: "Hilux Revo", brand: "Toyota" },
        { name: "Fortuner", brand: "Toyota" },
        { name: "C-HR", brand: "Toyota" },
        // Honda
        { name: "Civic", brand: "Honda" },
        { name: "City", brand: "Honda" },
        { name: "CR-V", brand: "Honda" },
        { name: "HR-V", brand: "Honda" },
        { name: "Accord", brand: "Honda" },
        // Mazda
        { name: "Mazda 2", brand: "Mazda" },
        { name: "Mazda 3", brand: "Mazda" },
        { name: "CX-5", brand: "Mazda" },
        { name: "CX-30", brand: "Mazda" },
        // Nissan
        { name: "Almera", brand: "Nissan" },
        { name: "Kicks", brand: "Nissan" },
        { name: "X-Trail", brand: "Nissan" },
        // Mitsubishi
        { name: "Triton", brand: "Mitsubishi" },
        { name: "Pajero Sport", brand: "Mitsubishi" },
        { name: "Xpander", brand: "Mitsubishi" },
        // Isuzu
        { name: "D-Max", brand: "Isuzu" },
        { name: "MU-X", brand: "Isuzu" },
        // Mercedes-Benz
        { name: "C-Class", brand: "Mercedes-Benz" },
        { name: "E-Class", brand: "Mercedes-Benz" },
        { name: "GLC", brand: "Mercedes-Benz" },
        // BMW
        { name: "3 Series", brand: "BMW" },
        { name: "5 Series", brand: "BMW" },
        { name: "X3", brand: "BMW" },
    ]

    const models: Record<string, string> = {}

    for (const modelData of modelsData) {
        const brandId = brands[modelData.brand]
        const model = await prisma.vehicleModel.upsert({
            where: {
                brandId_name: { brandId, name: modelData.name },
            },
            update: {},
            create: {
                name: modelData.name,
                brandId,
            },
        })
        models[`${modelData.brand}_${modelData.name}`] = model.id
        console.log(`  ✅ Model: ${modelData.brand} ${modelData.name}`)
    }

    // ── 3. Create Sample Vehicle Products ────────────────────
    const vehiclesData = [
        {
            title: "Toyota Camry 2.5 Hybrid Premium สีขาวมุก สภาพนางฟ้า",
            price: 1350000,
            brand: "Toyota",
            model: "Camry",
            year: 2022,
            mileage: 35000,
            transmission: "automatic",
            fuelType: "hybrid",
            bodyType: "sedan",
            engineSize: 2.5,
            color: "ขาวมุก",
            plateProvince: "กรุงเทพมหานคร",
            featured: true,
        },
        {
            title: "Honda Civic RS Turbo ตัวท็อป ประวัติศูนย์ครบ",
            price: 920000,
            brand: "Honda",
            model: "Civic",
            year: 2021,
            mileage: 48000,
            transmission: "automatic",
            fuelType: "gasoline",
            bodyType: "sedan",
            engineSize: 1.5,
            color: "ดำ",
            plateProvince: "นนทบุรี",
            featured: true,
        },
        {
            title: "Mazda CX-5 2.0 SP ดีเซล ขับสี่ ออปชันเต็ม",
            price: 1150000,
            brand: "Mazda",
            model: "CX-5",
            year: 2023,
            mileage: 18000,
            transmission: "automatic",
            fuelType: "diesel",
            bodyType: "suv",
            engineSize: 2.2,
            color: "แดง Soul Red",
            plateProvince: "เชียงใหม่",
            featured: true,
        },
        {
            title: "Toyota Hilux Revo 2.4 Prerunner กระบะยกสูง",
            price: 780000,
            brand: "Toyota",
            model: "Hilux Revo",
            year: 2020,
            mileage: 72000,
            transmission: "automatic",
            fuelType: "diesel",
            bodyType: "pickup",
            engineSize: 2.4,
            color: "เทา",
            plateProvince: "ขอนแก่น",
            featured: false,
        },
        {
            title: "Honda CR-V 2.4 EL 4WD ตัวท็อปสุด เบาะไฟฟ้า",
            price: 1050000,
            brand: "Honda",
            model: "CR-V",
            year: 2021,
            mileage: 42000,
            transmission: "automatic",
            fuelType: "gasoline",
            bodyType: "suv",
            engineSize: 2.4,
            color: "ขาว",
            plateProvince: "กรุงเทพมหานคร",
            featured: false,
        },
        {
            title: "Toyota Fortuner 2.8 V 4WD ดีเซล สีดำ สภาพดี",
            price: 1420000,
            brand: "Toyota",
            model: "Fortuner",
            year: 2022,
            mileage: 30000,
            transmission: "automatic",
            fuelType: "diesel",
            bodyType: "suv",
            engineSize: 2.8,
            color: "ดำ",
            plateProvince: "ภูเก็ต",
            featured: true,
        },
        {
            title: "Nissan Kicks e-POWER VL ไฟฟ้าล้วน ไมล์น้อย",
            price: 820000,
            brand: "Nissan",
            model: "Kicks",
            year: 2023,
            mileage: 12000,
            transmission: "automatic",
            fuelType: "electric",
            bodyType: "suv",
            engineSize: null,
            color: "ส้ม-ดำ",
            plateProvince: "ชลบุรี",
            featured: false,
        },
        {
            title: "Mazda 3 2.0 SP Sports ตัวท็อป Bose Sound",
            price: 780000,
            brand: "Mazda",
            model: "Mazda 3",
            year: 2021,
            mileage: 38000,
            transmission: "automatic",
            fuelType: "gasoline",
            bodyType: "hatchback",
            engineSize: 2.0,
            color: "แดง",
            plateProvince: "กรุงเทพมหานคร",
            featured: false,
        },
        {
            title: "Mercedes-Benz C200 AMG Dynamic สภาพป้ายแดง",
            price: 2150000,
            brand: "Mercedes-Benz",
            model: "C-Class",
            year: 2023,
            mileage: 15000,
            transmission: "automatic",
            fuelType: "gasoline",
            bodyType: "sedan",
            engineSize: 1.5,
            color: "เทาอ่อน",
            plateProvince: "กรุงเทพมหานคร",
            featured: true,
        },
        {
            title: "BMW 320d M Sport ดีเซล ประหยัดน้ำมัน แรง",
            price: 1850000,
            brand: "BMW",
            model: "3 Series",
            year: 2022,
            mileage: 28000,
            transmission: "automatic",
            fuelType: "diesel",
            bodyType: "sedan",
            engineSize: 2.0,
            color: "น้ำเงิน",
            plateProvince: "กรุงเทพมหานคร",
            featured: false,
        },
        {
            title: "Isuzu D-Max 1.9 Hi-Lander ดีเซล เกียร์ธรรมดา",
            price: 620000,
            brand: "Isuzu",
            model: "D-Max",
            year: 2020,
            mileage: 85000,
            transmission: "manual",
            fuelType: "diesel",
            bodyType: "pickup",
            engineSize: 1.9,
            color: "น้ำเงิน",
            plateProvince: "นครราชสีมา",
            featured: false,
        },
        {
            title: "Mitsubishi Xpander GT เบนซิน ครอบครัวชอบ",
            price: 680000,
            brand: "Mitsubishi",
            model: "Xpander",
            year: 2022,
            mileage: 32000,
            transmission: "automatic",
            fuelType: "gasoline",
            bodyType: "van",
            engineSize: 1.5,
            color: "เงิน",
            plateProvince: "สมุทรปราการ",
            featured: false,
        },
        {
            title: "Toyota Yaris ATIV 1.2 Sport Premium สปอร์ต",
            price: 520000,
            brand: "Toyota",
            model: "Yaris",
            year: 2021,
            mileage: 45000,
            transmission: "automatic",
            fuelType: "gasoline",
            bodyType: "sedan",
            engineSize: 1.2,
            color: "แดง",
            plateProvince: "สงขลา",
            featured: false,
        },
        {
            title: "Honda City 1.0 Turbo RS ตัวท็อป Sensing",
            price: 640000,
            brand: "Honda",
            model: "City",
            year: 2022,
            mileage: 27000,
            transmission: "automatic",
            fuelType: "gasoline",
            bodyType: "sedan",
            engineSize: 1.0,
            color: "ขาว",
            plateProvince: "เชียงใหม่",
            featured: false,
        },
        {
            title: "BMW X3 xDrive20d M Sport ดีเซล ขับสี่ ครบ",
            price: 2450000,
            brand: "BMW",
            model: "X3",
            year: 2023,
            mileage: 20000,
            transmission: "automatic",
            fuelType: "diesel",
            bodyType: "suv",
            engineSize: 2.0,
            color: "ดำ",
            plateProvince: "กรุงเทพมหานคร",
            featured: true,
        },
        {
            title: "Mitsubishi Triton 2.4 GT Premium กระบะ 4 ประตู",
            price: 850000,
            brand: "Mitsubishi",
            model: "Triton",
            year: 2022,
            mileage: 38000,
            transmission: "automatic",
            fuelType: "diesel",
            bodyType: "pickup",
            engineSize: 2.4,
            color: "ดำ",
            plateProvince: "อุดรธานี",
            featured: false,
        },
        {
            title: "Honda HR-V RS e:HEV ไฮบริด ประหยัดมาก",
            price: 980000,
            brand: "Honda",
            model: "HR-V",
            year: 2023,
            mileage: 22000,
            transmission: "automatic",
            fuelType: "hybrid",
            bodyType: "suv",
            engineSize: 1.5,
            color: "เขียว",
            plateProvince: "นนทบุรี",
            featured: false,
        },
        {
            title: "Mercedes-Benz GLC 300e AMG Plug-in Hybrid ครบ",
            price: 2850000,
            brand: "Mercedes-Benz",
            model: "GLC",
            year: 2023,
            mileage: 10000,
            transmission: "automatic",
            fuelType: "hybrid",
            bodyType: "suv",
            engineSize: 2.0,
            color: "ดำ",
            plateProvince: "กรุงเทพมหานคร",
            featured: true,
        },
    ]

    console.log("\n📦 Creating Vehicle Products...\n")

    for (const v of vehiclesData) {
        const brandId = brands[v.brand]
        const modelId = models[`${v.brand}_${v.model}`]

        if (!brandId || !modelId) {
            console.log(`  ⚠️  Skipping: ${v.title} (brand or model not found)`)
            continue
        }

        // Upsert by title to avoid duplicates on re-run
        const existing = await prisma.product.findFirst({
            where: { title: v.title },
        })

        if (existing) {
            console.log(`  ⏭️  Exists: ${v.title}`)
            continue
        }

        await prisma.product.create({
            data: {
                title: v.title,
                description: v.title,
                price: v.price,
                images: ["/vehicle_placeholder.png"],
                productType: "vehicle",
                status: "active",
                featured: v.featured,
                views: Math.floor(Math.random() * 500),
                vehicle: {
                    create: {
                        brandId,
                        modelId,
                        year: v.year,
                        mileage: v.mileage,
                        transmission: v.transmission,
                        fuelType: v.fuelType,
                        bodyType: v.bodyType,
                        engineSize: v.engineSize,
                        color: v.color,
                        plateProvince: v.plateProvince,
                    },
                },
            },
        })

        console.log(`  ✅ Created: ${v.title}`)
    }

    console.log("\n🎉 Vehicle Seed Complete!\n")
    await prisma.$disconnect()
}

main().catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
})
