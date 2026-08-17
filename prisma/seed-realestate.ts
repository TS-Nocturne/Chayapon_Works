import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../app/generated/prisma/client"

const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log("Seeding Real Estate data...")

    // Seed 12 dummy real estate properties
    const propertyTypes = ["house", "condo", "townhouse", "land"]
    const locations = ["กรุงเทพมหานคร", "เชียงใหม่", "ชลบุรี", "ภูเก็ต", "นนทบุรี"]
    const furnishedOptions = ["furnished", "unfurnished", "partially"]

    for (let i = 0; i < 12; i++) {
        const type = propertyTypes[i % propertyTypes.length]
        const location = locations[i % locations.length]
        const isCondo = type === "condo"

        const product = await prisma.product.create({
            data: {
                title: `${type === "house" ? "บ้านเดี่ยว" : type === "condo" ? "คอนโดมิเนียม" : type === "townhouse" ? "ทาวน์โฮม" : "ที่ดิน"} สวยๆ ทำเล${location}`,
                description: `รายละเอียดอสังหาริมทรัพย์ ${type} สุดหรูที่ ${location}`,
                price: 1500000 + (Math.random() * 8500000), // 1.5m to 10m
                images: [
                    "/real_estate_placeholder.png",
                ],
                productType: "real_estate",
                status: "active",
                featured: Math.random() > 0.8,
                views: Math.floor(Math.random() * 5000),
                realEstate: {
                    create: {
                        propertyType: type,
                        areaSqm: type === "land" ? 0 : 30 + (Math.random() * 200),
                        landSqw: isCondo ? null : 50 + (Math.random() * 100),
                        bedrooms: isCondo ? 1 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 3),
                        bathrooms: isCondo ? 1 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 3),
                        floors: isCondo ? 30 : 2,
                        location: location,
                        district: ["เมือง", "บางละมุง", "ปากเกร็ด", "หางดง"][i % 4],
                        furnished: isCondo ? "furnished" : furnishedOptions[i % 3],
                        parking: isCondo ? 1 : 2,
                        yearBuilt: 2015 + Math.floor(Math.random() * 10),
                    }
                }
            }
        })
        console.log(`Created property: ${product.title}`)
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
