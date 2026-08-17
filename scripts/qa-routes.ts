import { prisma } from "../lib/prisma"

const baseUrl = "http://localhost:3000"

async function check(path: string, expected: number[]) {
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual" })
    const result = { path, status: response.status, location: response.headers.get("location") }
    if (!expected.includes(response.status)) throw new Error(`Unexpected ${response.status} for ${path}`)
    return result
}

async function main() {
    const [vehicle, property, part] = await Promise.all([
        prisma.product.findFirst({ where: { productType: "vehicle", status: "active" }, select: { id: true } }),
        prisma.product.findFirst({ where: { productType: "real_estate", status: "active" }, select: { id: true } }),
        prisma.product.findFirst({ where: { productType: "part", status: "active" }, select: { id: true } }),
    ])
    if (!vehicle || !property || !part) throw new Error("Catalog fixtures are incomplete")

    const publicPaths = [
        "/", "/vehicles", "/vehicles?q=Toyota&minPrice=1", `/vehicles/${vehicle.id}`,
        "/real-estate", "/real-estate?propertyType=land", `/real-estate/${property.id}`,
        "/parts", "/parts?q=brake", `/parts/${part.id}`,
        "/cart", "/checkout", "/sign-in", "/sign-up", "/forgot-password",
        "/reset-password?error=INVALID_TOKEN", "/api/auth/get-session", "/api/store-settings",
    ]
    const protectedPaths = [
        "/orders", "/profile", "/profile/appointments", "/profile/personal-information", "/dashboard", "/dashboard/products", "/dashboard/orders",
        "/dashboard/leads", "/dashboard/users", "/dashboard/settings",
    ]

    const publicResults = await Promise.all(publicPaths.map((path) => check(path, [200])))
    const protectedResults = await Promise.all(protectedPaths.map((path) => check(path, [302, 303, 307, 308])))
    console.log(JSON.stringify({ publicRoutes: publicResults.length, protectedRoutes: protectedResults.length, failures: 0 }))
}

main()
    .finally(() => prisma.$disconnect())
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
