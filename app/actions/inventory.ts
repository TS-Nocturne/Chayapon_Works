"use server"

import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { productFormSchema, type ProductFormValues } from "@/lib/validations/product"
import { Prisma } from "@/app/generated/prisma/client"

// Require Admin Helper
async function requireAdmin() {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if (!session || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized: Admin access required")
    }
}

function revalidateInventory(productId?: string) {
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/products")
    revalidatePath("/")
    revalidatePath("/vehicles")
    revalidatePath("/real-estate")
    revalidatePath("/parts")
    if (productId) {
        revalidatePath(`/vehicles/${productId}`)
        revalidatePath(`/real-estate/${productId}`)
        revalidatePath(`/parts/${productId}`)
    }
}

function inventoryError(error: unknown, fallback: string) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") return "มีข้อมูลที่ใช้รหัสหรือชื่อเดียวกันอยู่แล้ว กรุณาตรวจสอบ SKU ยี่ห้อ และรุ่น"
        if (error.code === "P2025") return "ไม่พบสินค้าที่ต้องการจัดการ"
    }
    return fallback
}

export async function createProduct(data: ProductFormValues) {
    try {
        await requireAdmin()

        // Validate data strictly on server
        const parsed = productFormSchema.safeParse(data)
        if (!parsed.success) {
            return { success: false, error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }
        }

        const validData = parsed.data

        // Execute as a Prisma Transaction
        const newProduct = await prisma.$transaction(async (tx) => {
            // 1. Create Base Product
            const baseProduct = await tx.product.create({
                data: {
                    title: validData.title,
                    description: validData.description || null,
                    price: validData.price,
                    images: validData.images,
                    productType: validData.productType,
                    status: validData.status,
                    featured: validData.featured,
                }
            })

            // 2. Create Specific Product sub-record based on type
            if (validData.productType === "vehicle") {
                const brand = await tx.vehicleBrand.upsert({
                    where: { name: validData.brandName },
                    update: {},
                    create: { name: validData.brandName },
                })
                const model = await tx.vehicleModel.upsert({
                    where: { brandId_name: { brandId: brand.id, name: validData.modelName } },
                    update: {},
                    create: { brandId: brand.id, name: validData.modelName },
                })

                await tx.vehicle.create({
                    data: {
                        productId: baseProduct.id,
                        brandId: brand.id,
                        modelId: model.id,
                        year: validData.year,
                        mileage: validData.mileage,
                        transmission: validData.transmission,
                        fuelType: validData.fuelType,
                        color: validData.color || null,
                        engineSize: validData.engineSize ?? null,
                        bodyType: validData.bodyType || null,
                        driveType: validData.driveType || null,
                        plateProvince: validData.plateProvince || null,
                    }
                })
            } else if (validData.productType === "real_estate") {
                await tx.realEstate.create({
                    data: {
                        productId: baseProduct.id,
                        propertyType: validData.propertyType,
                        areaSqm: validData.areaSqm,
                        landSqw: validData.landSqw ?? null,
                        bedrooms: validData.bedrooms,
                        bathrooms: validData.bathrooms,
                        floors: validData.floors ?? null,
                        location: validData.location,
                        district: validData.district || null,
                        nearbyPlaces: validData.nearbyPlaces || null,
                        furnished: validData.furnished || null,
                        parking: validData.parking ?? null,
                        yearBuilt: validData.yearBuilt ?? null,
                        latitude: validData.latitude ?? null,
                        longitude: validData.longitude ?? null,
                    }
                })
            } else if (validData.productType === "part") {
                await tx.part.create({
                    data: {
                        productId: baseProduct.id,
                        sku: validData.sku.toUpperCase(),
                        brand: validData.brand,
                        category: validData.category,
                        compatibility: validData.compatibility,
                        stock: validData.stock,
                    }
                })
            }

            return baseProduct
        })

        revalidateInventory(newProduct.id)
        return { success: true, productId: newProduct.id }

    } catch (error: unknown) {
        console.error("Create Product Error:", error)
        return { success: false, error: inventoryError(error, "เกิดข้อผิดพลาดในการสร้างสินค้า") }
    }
}

export async function deleteProduct(productId: string) {
    try {
        await requireAdmin()

        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true },
        })

        if (!product) return { success: false, error: "ไม่พบสินค้าที่ต้องการลบ" }

        const deletedOrderItems = await prisma.$transaction(async (tx) => {
            // OrderItem is the only product relation that does not cascade in the
            // current schema. Remove those references first so an admin can
            // permanently delete a product regardless of its purchase history.
            const deletedItems = await tx.orderItem.deleteMany({ where: { productId } })
            await tx.product.delete({ where: { id: productId } })
            return deletedItems.count
        })

        revalidateInventory(productId)
        return { success: true, deletedOrderItems }
    } catch (error: unknown) {
        console.error("Delete Product Error:", error)
        return { success: false, error: inventoryError(error, "เกิดข้อผิดพลาดในการลบสินค้า") }
    }
}

export async function updateProduct(productId: string, data: ProductFormValues) {
    try {
        await requireAdmin()

        const parsed = productFormSchema.safeParse(data)
        if (!parsed.success) {
            return { success: false, error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() }
        }

        const validData = parsed.data

        // Verify the product type hasn't changed to prevent orphaned relations
        const existing = await prisma.product.findUnique({
            where: { id: productId },
            select: { productType: true }
        })

        if (!existing) return { success: false, error: "ไม่พบสินค้า" }
        if (existing.productType !== validData.productType) {
            return { success: false, error: "ไม่สามารถเปลี่ยนประเภทสินค้าระหว่างการอัปเดตได้" }
        }

        await prisma.$transaction(async (tx) => {
            // Update Base Product
            await tx.product.update({
                where: { id: productId },
                data: {
                    title: validData.title,
                    description: validData.description || null,
                    price: validData.price,
                    images: validData.images,
                    status: validData.status,
                    featured: validData.featured,
                }
            })

            // Update Specific Product sub-record based on type
            if (validData.productType === "vehicle") {
                const brand = await tx.vehicleBrand.upsert({
                    where: { name: validData.brandName },
                    update: {},
                    create: { name: validData.brandName },
                })
                const model = await tx.vehicleModel.upsert({
                    where: { brandId_name: { brandId: brand.id, name: validData.modelName } },
                    update: {},
                    create: { brandId: brand.id, name: validData.modelName },
                })

                await tx.vehicle.update({
                    where: { productId: productId },
                    data: {
                        brandId: brand.id,
                        modelId: model.id,
                        year: validData.year,
                        mileage: validData.mileage,
                        transmission: validData.transmission,
                        fuelType: validData.fuelType,
                        color: validData.color || null,
                        engineSize: validData.engineSize ?? null,
                        bodyType: validData.bodyType || null,
                        driveType: validData.driveType || null,
                        plateProvince: validData.plateProvince || null,
                    }
                })
            } else if (validData.productType === "real_estate") {
                await tx.realEstate.update({
                    where: { productId: productId },
                    data: {
                        propertyType: validData.propertyType,
                        areaSqm: validData.areaSqm,
                        landSqw: validData.landSqw ?? null,
                        bedrooms: validData.bedrooms,
                        bathrooms: validData.bathrooms,
                        floors: validData.floors ?? null,
                        location: validData.location,
                        district: validData.district || null,
                        nearbyPlaces: validData.nearbyPlaces || null,
                        furnished: validData.furnished || null,
                        parking: validData.parking ?? null,
                        yearBuilt: validData.yearBuilt ?? null,
                        latitude: validData.latitude ?? null,
                        longitude: validData.longitude ?? null,
                    }
                })
            } else if (validData.productType === "part") {
                await tx.part.update({
                    where: { productId: productId },
                    data: {
                        sku: validData.sku.toUpperCase(),
                        brand: validData.brand,
                        category: validData.category,
                        compatibility: validData.compatibility,
                        stock: validData.stock,
                    }
                })
            }
        })

        revalidatePath("/dashboard")
        revalidatePath("/dashboard/products")
        revalidatePath(`/dashboard/products/${productId}/edit`)
        revalidateInventory(productId)
        return { success: true }
    } catch (error: unknown) {
        console.error("Update Product Error:", error)
        return { success: false, error: inventoryError(error, "เกิดข้อผิดพลาดในการอัปเดตสินค้า") }
    }
}
