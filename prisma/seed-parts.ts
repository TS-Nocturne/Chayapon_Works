import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client"

const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log("Seeding Auto Parts data...")

    const categories = ["เครื่องยนต์", "ช่วงล่าง", "เบรก", "ภายนอก", "ภายใน"]
    const brands = ["BOSCH", "DENSO", "NGK", "Brembo", "KYB", "TRD"]
    const compatibilities = [
        "Toyota Yaris / Vios 2014-2022",
        "Honda Civic FC/FK 2016-2021",
        "Isuzu D-Max 2020-2024",
        "Mazda 3 Skyactiv 2014-2019",
        "All Models (Universal)",
    ]

    const partNames: Record<string, string[]> = {
        "เครื่องยนต์": ["หัวเทียน Iridium", "ไส้กรองอากาศ", "ปั๊มน้ำ", "คอยล์จุดระเบิด"],
        "ช่วงล่าง": ["โช๊คอัพหน้า-หลัง", "ลูกหมากกันโคลง", "บูชปีกนก"],
        "เบรก": ["ผ้าเบรกหน้า", "จานเบรก", "น้ำมันเบรก DOT4"],
        "ภายนอก": ["หลอดไฟหน้า LED", "ใบปัดน้ำฝน", "กระจกมองข้าง"],
        "ภายใน": ["ไส้กรองแอร์", "พรมปูพื้น", "กล้องติดรถยนต์"]
    }

    for (let i = 0; i < 20; i++) {
        const category = categories[i % categories.length]
        const brand = brands[Math.floor(Math.random() * brands.length)]
        const nameList = partNames[category]
        const name = nameList[i % nameList.length]
        const compatibility = compatibilities[i % compatibilities.length]
        
        const sku = `PT-${brand.substring(0,3).toUpperCase()}-${1000 + i}`
        
        const product = await prisma.product.create({
            data: {
                title: `${name} ${brand} สำหรับ ${compatibility}`,
                description: `รายละเอียดสินค้า ${name} แบรนด์ ${brand} ของแท้ 100% พร้อมจัดส่ง`,
                price: 150 + Math.floor(Math.random() * 8500),
                images: [
                    "/part_placeholder.png",
                ],
                productType: "part",
                status: "active",
                featured: Math.random() > 0.8,
                views: Math.floor(Math.random() * 1000),
                part: {
                    create: {
                        sku: sku,
                        brand: brand,
                        category: category,
                        compatibility: compatibility,
                        stock: Math.floor(Math.random() * 50) > 5 ? 10 + Math.floor(Math.random() * 90) : 0, // 10% chance of out of stock
                    }
                }
            }
        })
        console.log(`Created part: ${product.title} (SKU: ${sku})`)
    }

    console.log("Seeding completed!")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
