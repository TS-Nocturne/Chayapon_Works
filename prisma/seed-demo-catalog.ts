import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    throw new Error("DATABASE_URL is required")
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

async function shouldCreate(title: string) {
    const existing = await prisma.product.findFirst({ where: { title } })
    if (existing) {
        console.log(`  ⏭️  มีอยู่แล้ว: ${title}`)
        return false
    }
    return true
}

async function main() {
    const before = await prisma.product.groupBy({ by: ["productType"], _count: true })
    console.log("\n📊 สินค้าก่อนลงข้อมูล:", before)

    const toyota = await prisma.vehicleBrand.upsert({
        where: { name: "Toyota" },
        update: {},
        create: { name: "Toyota" },
    })
    const honda = await prisma.vehicleBrand.upsert({
        where: { name: "Honda" },
        update: {},
        create: { name: "Honda" },
    })
    const camry = await prisma.vehicleModel.upsert({
        where: { brandId_name: { brandId: toyota.id, name: "Camry" } },
        update: {},
        create: { brandId: toyota.id, name: "Camry" },
    })
    const crv = await prisma.vehicleModel.upsert({
        where: { brandId_name: { brandId: honda.id, name: "CR-V" } },
        update: {},
        create: { brandId: honda.id, name: "CR-V" },
    })

    const sedanTitle = "Toyota Camry 2.5 HEV Premium ปี 2024 สีดำเมทัลลิก"
    if (await shouldCreate(sedanTitle)) {
        await prisma.product.create({
            data: {
                title: sedanTitle,
                description: "รถผู้บริหารสภาพสวย ไมล์น้อย ประวัติเข้าศูนย์ครบ แบตเตอรี่ไฮบริดอยู่ในระยะรับประกัน ภายในหนังสีดำ กล้องรอบคัน ระบบ Adaptive Cruise Control และชุดความปลอดภัยครบ",
                price: 1690000,
                images: ["/catalog-demo/executive-sedan.png"],
                productType: "vehicle",
                status: "active",
                featured: true,
                views: 428,
                vehicle: { create: { brandId: toyota.id, modelId: camry.id, year: 2024, mileage: 12800, transmission: "automatic", fuelType: "hybrid", color: "ดำเมทัลลิก", engineSize: 2.5, bodyType: "sedan", driveType: "fwd", plateProvince: "กรุงเทพมหานคร" } },
            },
        })
        console.log(`  ✅ เพิ่มรถ: ${sedanTitle}`)
    }

    const suvTitle = "Honda CR-V e:HEV RS ปี 2023 สีขาวมุก 7 ที่นั่ง"
    if (await shouldCreate(suvTitle)) {
        await prisma.product.create({
            data: {
                title: suvTitle,
                description: "SUV ครอบครัวรุ่นท็อป เครื่องยนต์ไฮบริด ประหยัดน้ำมัน เบาะไฟฟ้า หลังคาพาโนรามิก Honda Sensing ครบชุด พร้อมยางใหม่และรับประกันหลังการขายจากร้าน",
                price: 1450000,
                images: ["/catalog-demo/premium-suv.png"],
                productType: "vehicle",
                status: "active",
                featured: true,
                views: 365,
                vehicle: { create: { brandId: honda.id, modelId: crv.id, year: 2023, mileage: 22400, transmission: "automatic", fuelType: "hybrid", color: "ขาวมุก", engineSize: 2.0, bodyType: "suv", driveType: "awd", plateProvince: "กรุงเทพมหานคร" } },
            },
        })
        console.log(`  ✅ เพิ่มรถ: ${suvTitle}`)
    }

    const houseTitle = "Modern Residence ราชพฤกษ์ บ้านเดี่ยวพร้อมอยู่"
    if (await shouldCreate(houseTitle)) {
        await prisma.product.create({
            data: {
                title: houseTitle,
                description: "บ้านเดี่ยวดีไซน์โมเดิร์นในโครงการส่วนตัว พื้นที่ใช้สอยกว้าง ห้องรับแขก Double Volume ครัวไทยและครัวฝรั่ง สวนจัดเต็ม ระบบรักษาความปลอดภัย 24 ชั่วโมง ใกล้ทางด่วนและโรงเรียนนานาชาติ",
                price: 24900000,
                images: ["/catalog-demo/modern-house.png"],
                productType: "real_estate",
                status: "active",
                featured: true,
                views: 812,
                realEstate: { create: { propertyType: "house", areaSqm: 420, landSqw: 126, bedrooms: 5, bathrooms: 6, floors: 2, location: "นนทบุรี", district: "ปากเกร็ด", nearbyPlaces: "ทางด่วนศรีรัช, Central Westgate, โรงเรียนนานาชาติ", furnished: "furnished", parking: 3, yearBuilt: 2025 } },
            },
        })
        console.log(`  ✅ เพิ่มอสังหาฯ: ${houseTitle}`)
    }

    const condoTitle = "Sky Residence Sukhumvit 39 ห้องมุมวิวเมือง"
    if (await shouldCreate(condoTitle)) {
        await prisma.product.create({
            data: {
                title: condoTitle,
                description: "คอนโด Luxury ห้องมุม วิวเมืองแบบพาโนรามา ตกแต่งครบพร้อมเข้าอยู่ ห้องนั่งเล่นกว้าง กระจกเต็มบาน ใกล้ BTS พร้อมพงษ์ และ EmQuartier",
                price: 12900000,
                images: ["/catalog-demo/luxury-condo.png"],
                productType: "real_estate",
                status: "active",
                featured: true,
                views: 694,
                realEstate: { create: { propertyType: "condo", areaSqm: 86, landSqw: null, bedrooms: 2, bathrooms: 2, floors: 24, location: "กรุงเทพมหานคร", district: "วัฒนา", nearbyPlaces: "BTS พร้อมพงษ์ 450 เมตร, EmQuartier 650 เมตร", furnished: "furnished", parking: 1, yearBuilt: 2022 } },
            },
        })
        console.log(`  ✅ เพิ่มอสังหาฯ: ${condoTitle}`)
    }

    const landTitle = "ที่ดินเขาใหญ่ วิวภูเขา 2 ไร่ ติดถนนโครงการ"
    if (await shouldCreate(landTitle)) {
        await prisma.product.create({
            data: {
                title: landTitle,
                description: "ที่ดินแปลงสวยรูปสี่เหลี่ยม หน้ากว้าง ติดถนนลาดยางในโครงการ พื้นที่ราบพร้อมพัฒนา เห็นวิวภูเขาชัดเจน ไฟฟ้าและน้ำเข้าถึง เหมาะสร้างบ้านพักตากอากาศหรือโครงการพูลวิลล่า",
                price: 12800000,
                images: ["/catalog-demo/khao-yai-land.png"],
                productType: "real_estate",
                status: "active",
                featured: true,
                views: 587,
                realEstate: { create: { propertyType: "land", areaSqm: 3200, landSqw: 800, bedrooms: 0, bathrooms: 0, floors: null, location: "นครราชสีมา", district: "ปากช่อง", nearbyPlaces: "ถนนธนะรัชต์ 8 กม., อุทยานแห่งชาติเขาใหญ่ 18 กม.", furnished: null, parking: null, yearBuilt: null } },
            },
        })
        console.log(`  ✅ เพิ่มที่ดิน: ${landTitle}`)
    }

    const brakeTitle = "ชุดจานเบรก Performance พร้อมผ้าเบรก Ceramic สำหรับ Toyota Camry"
    if (await shouldCreate(brakeTitle)) {
        await prisma.product.create({
            data: {
                title: brakeTitle,
                description: "ชุดจานเบรกหน้าแบบเซาะร่องระบายความร้อน พร้อมผ้าเบรก Ceramic ลดเสียงและฝุ่นเบรก เหมาะสำหรับใช้งานประจำวันและเดินทางไกล รับประกันสินค้า 1 ปี",
                price: 18900,
                images: ["/catalog-demo/performance-brake-kit.png"],
                productType: "part",
                status: "active",
                featured: true,
                views: 536,
                part: { create: { sku: "DEMO-BRK-001", brand: "Chayapon Works Select", category: "เบรก", compatibility: "Toyota Camry 2.0 / 2.5 / HEV ปี 2020-2024", stock: 12 } },
            },
        })
        console.log(`  ✅ เพิ่มอะไหล่: ${brakeTitle}`)
    }

    const suspensionTitle = "ชุดช่วงล่าง Sport Comfort ปรับระดับได้ สำหรับ Honda Civic"
    if (await shouldCreate(suspensionTitle)) {
        await prisma.product.create({
            data: {
                title: suspensionTitle,
                description: "โช้คอัพพร้อมสปริง Sport Comfort แบบปรับระดับ รองรับการใช้งานในเมือง เพิ่มการทรงตัวโดยไม่แข็งกระด้าง พร้อมบูชและชุดน็อตติดตั้ง รับประกัน 18 เดือน",
                price: 24500,
                images: ["/catalog-demo/sport-suspension-kit.png"],
                productType: "part",
                status: "active",
                featured: true,
                views: 472,
                part: { create: { sku: "DEMO-SUS-001", brand: "Chayapon Works Select", category: "ช่วงล่าง", compatibility: "Honda Civic FC / FK ปี 2016-2021", stock: 8 } },
            },
        })
        console.log(`  ✅ เพิ่มอะไหล่: ${suspensionTitle}`)
    }

    const after = await prisma.product.groupBy({ by: ["productType"], _count: true })
    console.log("\n📊 สินค้าหลังลงข้อมูล:", after)
    console.log("🎉 ลงสินค้า Client Demo เรียบร้อย\n")
}

main()
    .catch((error) => {
        console.error("❌ Demo catalog seed failed:", error)
        process.exitCode = 1
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
