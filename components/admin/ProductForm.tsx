"use client"

import * as React from "react"
import type { Resolver } from "react-hook-form"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { ImagePlus, Loader2, Plus, Star, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

import { productFormSchema, type ProductFormValues } from "@/lib/validations/product"
import { createProduct, updateProduct } from "@/app/actions/inventory"
import ProductImage from "@/components/ProductImage"

const MAX_IMAGE_COUNT = 8
const MAX_SOURCE_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_IMAGE_PAYLOAD_SIZE = 7 * 1024 * 1024

interface VehicleBrandOption {
    id: string
    name: string
    models: { id: string; name: string }[]
}

interface ProductFormProps {
    initialData?: ProductFormValues & { id: string }
    vehicleBrands?: VehicleBrandOption[]
}

export default function ProductForm({ initialData, vehicleBrands = [] }: ProductFormProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [globalError, setGlobalError] = React.useState<string | null>(null)
    const [imagePreviews, setImagePreviews] = React.useState<string[]>(initialData?.images || [])
    
    const mainImageInputRef = React.useRef<HTMLInputElement>(null)
    const secondaryImageInputRef = React.useRef<HTMLInputElement>(null)

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema) as Resolver<ProductFormValues>,
        defaultValues: initialData ? {
            ...initialData,
            // Ensure productType correctly matches for discriminated union
        } : ({
            title: "",
            description: "",
            price: 0,
            images: [],
            status: "active",
            productType: "vehicle", // default
            brandName: "",
            modelName: "",
            year: new Date().getFullYear(),
            mileage: 0,
            transmission: "automatic",
            fuelType: "gasoline",
            color: "",
            bodyType: undefined,
            driveType: undefined,
            plateProvince: "",
            propertyType: "house",
            areaSqm: 1,
            bedrooms: 0,
            bathrooms: 0,
            location: "",
            district: "",
            nearbyPlaces: "",
            furnished: undefined,
            sku: "",
            brand: "",
            category: "",
            compatibility: "",
            stock: 0,
            featured: false,
        } as ProductFormValues),
    })

    const productType = useWatch({
        control: form.control,
        name: "productType",
    })

    const brandName = useWatch({
        control: form.control,
        name: "brandName",
    })

    const selectedBrand = vehicleBrands.find(
        (brand) => brand.name.toLocaleLowerCase() === brandName?.trim().toLocaleLowerCase(),
    )

    // Handle when productType changes, we need to reset some fields to avoid validation errors of previous types
    React.useEffect(() => {
        // Just clear errors when type changes
        form.clearErrors()
    }, [productType, form])

    const resizeImage = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            setGlobalError(`ไฟล์ ${file.name} ไม่ใช่รูปภาพที่รองรับ`)
            return null
        }
        if (file.size > MAX_SOURCE_IMAGE_SIZE) {
            setGlobalError(`รูปภาพ ${file.name} มีขนาดเกิน 5 MB`)
            return null
        }

        return new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = (event) => {
                    const img = new Image()
                    img.onload = () => {
                        const MAX_SIZE = 800
                        let width = img.width
                        let height = img.height

                        if (width > height && width > MAX_SIZE) {
                            height = Math.round((height *= MAX_SIZE / width))
                            width = MAX_SIZE
                        } else if (height > MAX_SIZE) {
                            width = Math.round((width *= MAX_SIZE / height))
                            height = MAX_SIZE
                        }

                        const canvas = document.createElement("canvas")
                        canvas.width = width
                        canvas.height = height

                        const ctx = canvas.getContext("2d")
                        if (!ctx) {
                            reject(new Error("Unable to resize image"))
                            return
                        }

                        ctx.drawImage(img, 0, 0, width, height)
                        resolve(canvas.toDataURL("image/jpeg", 0.7))
                    }
                    img.onerror = () => reject(new Error("Invalid image"))
                    img.src = event.target?.result as string
                }
                reader.onerror = () => reject(new Error("Unable to read image"))
                reader.readAsDataURL(file)
        }).catch(() => {
            setGlobalError(`ไม่สามารถอ่านรูปภาพ ${file.name} ได้`)
            return null
        })
    }

    const saveImages = (updatedImages: string[]) => {
        const payloadSize = updatedImages.reduce((total, image) => total + image.length, 0)
        if (payloadSize > MAX_IMAGE_PAYLOAD_SIZE) {
            setGlobalError("รูปภาพรวมมีขนาดใหญ่เกิน 7 MB กรุณาลบบางรูปหรือเลือกรูปที่เล็กลง")
            return false
        }
        setImagePreviews(updatedImages)
        form.setValue("images", updatedImages, { shouldValidate: true, shouldDirty: true })
        return true
    }

    const handleMainImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        setGlobalError(null)
        const image = await resizeImage(file)
        if (image) saveImages([image, ...imagePreviews.slice(1)])
        event.target.value = ""
    }

    const handleSecondaryImagesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])
        if (!files.length) return
        if (!imagePreviews.length) {
            setGlobalError("กรุณาอัปโหลดภาพหลักก่อนเพิ่มภาพรอง")
            event.target.value = ""
            return
        }

        const availableSlots = MAX_IMAGE_COUNT - imagePreviews.length
        if (availableSlots <= 0) {
            setGlobalError(`อัปโหลดรูปภาพได้สูงสุด ${MAX_IMAGE_COUNT} รูป (ภาพหลัก 1 รูป และภาพรอง 7 รูป)`)
            event.target.value = ""
            return
        }

        setGlobalError(files.length > availableSlots ? `เพิ่มภาพรองได้อีก ${availableSlots} รูป ระบบเลือกเฉพาะรูปแรกตามจำนวนที่ว่าง` : null)
        const newImages = (await Promise.all(files.slice(0, availableSlots).map(resizeImage))).filter(
            (image): image is string => Boolean(image),
        )
        saveImages([...imagePreviews, ...newImages])
        event.target.value = ""
    }

    const removeImage = (indexToRemove: number) => {
        const updated = imagePreviews.filter((_, idx) => idx !== indexToRemove)
        saveImages(updated)
    }

    const setAsMainImage = (index: number) => {
        const selectedImage = imagePreviews[index]
        if (!selectedImage || index === 0) return
        saveImages([selectedImage, ...imagePreviews.filter((_, imageIndex) => imageIndex !== index)])
    }

    async function onSubmit(data: ProductFormValues) {
        setIsLoading(true)
        setGlobalError(null)

        try {
            let result;
            if (initialData) {
                result = await updateProduct(initialData.id, data)
            } else {
                result = await createProduct(data)
            }
            
            if (!result.success) {
                setGlobalError(result.error || `เกิดข้อผิดพลาดในการ${initialData ? "อัปเดต" : "สร้าง"}สินค้า`)
                setIsLoading(false)
                return
            }

            router.push("/dashboard/products")
        } catch {
            setGlobalError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {globalError && (
                    <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm font-medium">
                        {globalError}
                    </div>
                )}

                {/* ─── Base Fields ─── */}
                <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="productType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ประเภทสินค้า *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!!initialData}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="เลือกประเภท" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="vehicle">รถยนต์ (Vehicle)</SelectItem>
                                        <SelectItem value="real_estate">อสังหาริมทรัพย์ (Real Estate)</SelectItem>
                                        <SelectItem value="part">อะไหล่ (Part)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>สถานะเริ่มต้น</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="active">เปิดขาย (Active)</SelectItem>
                                        <SelectItem value="sold">ขายแล้ว (Sold)</SelectItem>
                                        <SelectItem value="reserved">จองแล้ว (Reserved)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                                <FormLabel>ชื่อสินค้า *</FormLabel>
                                <FormControl>
                                    <Input placeholder="เช่น Toyota Camry 2.5G 2020 หรือ บ้านเดี่ยว 2 ชั้น..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ราคา (บาท) *</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="featured"
                        render={({ field }) => (
                            <FormItem className="flex items-center gap-3 space-y-0 pt-6">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <FormLabel className="font-normal">แสดงเป็นสินค้าแนะนำ</FormLabel>
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>รายละเอียดเพิ่มเติม</FormLabel>
                            <FormControl>
                                <Textarea className="min-h-[120px]" placeholder="ข้อมูลเพิ่มเติมต่างๆ..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* ─── Image Upload ─── */}
                <div className="space-y-5 pt-2">
                    <div>
                        <FormLabel>รูปภาพสินค้า *</FormLabel>
                        <FormDescription>อัปโหลดได้สูงสุด 8 รูป ระบบจะปรับขนาดและบีบอัดให้อัตโนมัติ</FormDescription>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[minmax(240px,360px)_1fr]">
                        <section className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">ภาพหลัก</span>
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">แสดงบนหน้ารายการ</span>
                            </div>
                            {imagePreviews[0] ? (
                                <div className="group relative aspect-[16/10] overflow-hidden rounded-xl border-2 border-blue-600 bg-slate-50">
                                    <ProductImage src={imagePreviews[0]} alt="ภาพหลักของสินค้า" fill className="object-cover" sizes="360px" />
                                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 to-transparent px-3 pb-3 pt-8">
                                        <span className="flex items-center gap-1 text-xs font-semibold text-white"><Star className="h-3.5 w-3.5 fill-current" /> ภาพหลัก</span>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => mainImageInputRef.current?.click()} className="rounded-md bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-white">เปลี่ยนภาพ</button>
                                            <button type="button" onClick={() => removeImage(0)} aria-label="ลบภาพหลัก" className="rounded-md bg-red-600 p-1.5 text-white hover:bg-red-700"><X className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => mainImageInputRef.current?.click()}
                                    className="flex aspect-[16/10] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/40 text-blue-700 transition-colors hover:border-blue-500 hover:bg-blue-50"
                                >
                                    <ImagePlus className="mb-2 h-8 w-8" />
                                    <span className="text-sm font-semibold">อัปโหลดภาพหลัก</span>
                                    <span className="mt-1 text-xs text-slate-500">PNG, JPG หรือ WEBP ไม่เกิน 5 MB</span>
                                </button>
                            )}
                            <input type="file" ref={mainImageInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleMainImageChange} />
                            <p className="text-xs text-slate-500">ภาพนี้ใช้เป็นภาพปกสินค้าในหน้าค้นหาและหน้าแนะนำ</p>
                        </section>

                        <section className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-sm font-semibold">ภาพรอง ({Math.max(0, imagePreviews.length - 1)}/7)</span>
                                <span className="text-xs text-slate-500">ใช้แสดงในแกลเลอรีหน้ารายละเอียด</span>
                            </div>
                            <div className="flex min-h-32 flex-wrap content-start gap-3 rounded-xl border bg-slate-50/60 p-3">
                                {imagePreviews.slice(1).map((src, secondaryIndex) => {
                                    const index = secondaryIndex + 1
                                    return (
                                        <div key={`${src.slice(-24)}-${index}`} className="group relative h-28 w-28 overflow-hidden rounded-lg border bg-white">
                                            <ProductImage src={src} alt={`ภาพรองสินค้า ${index}`} fill className="object-cover" sizes="112px" />
                                            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/80 to-transparent px-1.5 pb-1.5 pt-6 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                                                <button type="button" onClick={() => setAsMainImage(index)} className="rounded bg-white/95 px-1.5 py-1 text-[10px] font-semibold text-slate-800" title="ตั้งเป็นภาพหลัก">ตั้งเป็นภาพหลัก</button>
                                                <button type="button" onClick={() => removeImage(index)} aria-label={`ลบภาพรอง ${index}`} className="rounded bg-red-600 p-1 text-white"><X className="h-3 w-3" /></button>
                                            </div>
                                        </div>
                                    )
                                })}
                                {imagePreviews.length < MAX_IMAGE_COUNT && (
                                    <button
                                        type="button"
                                        onClick={() => imagePreviews.length ? secondaryImageInputRef.current?.click() : mainImageInputRef.current?.click()}
                                        className="flex h-28 w-28 flex-col items-center justify-center rounded-lg border-2 border-dashed bg-white text-slate-500 transition-colors hover:border-blue-400 hover:text-blue-700"
                                    >
                                        <Plus className="mb-1 h-6 w-6" />
                                        <span className="text-xs font-medium">เพิ่มภาพรอง</span>
                                    </button>
                                )}
                            </div>
                            <input type="file" ref={secondaryImageInputRef} className="hidden" multiple accept="image/png, image/jpeg, image/webp" onChange={handleSecondaryImagesChange} />
                            <p className="text-xs text-slate-500">เลือกพร้อมกันได้หลายภาพ และสามารถตั้งภาพรองเป็นภาพหลักภายหลังได้</p>
                        </section>
                    </div>
                    {form.formState.errors.images && (
                        <p className="text-sm font-medium text-destructive mt-1">
                            {form.formState.errors.images.message}
                        </p>
                    )}
                </div>

                <div className="pt-4 border-t" />

                {/* ─── Vehicle Fields ─── */}
                {productType === "vehicle" && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight">ข้อมูลรถยนต์</h3>
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                            <FormField control={form.control} name="brandName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ยี่ห้อ *</FormLabel>
                                    <FormControl>
                                        <Input {...field} list="vehicle-brand-options" placeholder="เช่น Toyota" autoComplete="off" />
                                    </FormControl>
                                    <datalist id="vehicle-brand-options">
                                        {vehicleBrands.map((brand) => <option key={brand.id} value={brand.name} />)}
                                    </datalist>
                                    <FormDescription>พิมพ์ยี่ห้อใหม่ได้ ระบบจะบันทึกให้อัตโนมัติ</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="modelName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>รุ่น *</FormLabel>
                                    <FormControl>
                                        <Input {...field} list="vehicle-model-options" placeholder="เช่น Camry" autoComplete="off" />
                                    </FormControl>
                                    <datalist id="vehicle-model-options">
                                        {selectedBrand?.models.map((model) => <option key={model.id} value={model.name} />)}
                                    </datalist>
                                    <FormDescription>พิมพ์รุ่นใหม่ได้ แม้ยังไม่มีข้อมูลในระบบ</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="year" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ปี *</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="mileage" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ไมล์ (กม.) *</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="transmission" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>เกียร์ *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="automatic">อัตโนมัติ</SelectItem>
                                            <SelectItem value="manual">ธรรมดา</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="fuelType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>เชื้อเพลิง *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="gasoline">เบนซิน</SelectItem>
                                            <SelectItem value="diesel">ดีเซล</SelectItem>
                                            <SelectItem value="hybrid">ไฮบริด</SelectItem>
                                            <SelectItem value="electric">EV</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="bodyType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ตัวถัง</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {["sedan", "suv", "pickup", "hatchback", "van", "coupe"].map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="engineSize" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ขนาดเครื่องยนต์ (ลิตร)</FormLabel>
                                    <FormControl><Input type="number" min="0" step="0.1" {...field} value={field.value ?? ""} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="driveType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ระบบขับเคลื่อน</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="fwd">ล้อหน้า (FWD)</SelectItem>
                                            <SelectItem value="rwd">ล้อหลัง (RWD)</SelectItem>
                                            <SelectItem value="awd">ทุกล้อ (AWD)</SelectItem>
                                            <SelectItem value="4wd">สี่ล้อ (4WD)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="color" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>สี</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="plateProvince" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>จังหวัดทะเบียน</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </div>
                )}

                {/* ─── Real Estate Fields ─── */}
                {productType === "real_estate" && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight">ข้อมูลอสังหาริมทรัพย์</h3>
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                            <FormField control={form.control} name="propertyType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ประเภททรัพย์ *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="เลือกประเภท" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="house">บ้านเดี่ยว</SelectItem>
                                            <SelectItem value="condo">คอนโด</SelectItem>
                                            <SelectItem value="townhouse">ทาวน์เฮ้าส์</SelectItem>
                                            <SelectItem value="land">ที่ดิน</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="location" render={({ field }) => (
                                <FormItem><FormLabel>จังหวัด / ที่ตั้ง *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="district" render={({ field }) => (
                                <FormItem><FormLabel>อำเภอ / เขต</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="areaSqm" render={({ field }) => (
                                <FormItem><FormLabel>พื้นที่ใช้สอย (ตร.ม.) *</FormLabel><FormControl><Input type="number" min="1" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="landSqw" render={({ field }) => (
                                <FormItem><FormLabel>พื้นที่ดิน (ตร.ว.)</FormLabel><FormControl><Input type="number" min="0" step="0.01" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="bedrooms" render={({ field }) => (
                                <FormItem><FormLabel>ห้องนอน *</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="bathrooms" render={({ field }) => (
                                <FormItem><FormLabel>ห้องน้ำ *</FormLabel><FormControl><Input type="number" min="0" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="floors" render={({ field }) => (
                                <FormItem><FormLabel>จำนวนชั้น</FormLabel><FormControl><Input type="number" min="0" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="parking" render={({ field }) => (
                                <FormItem><FormLabel>ที่จอดรถ</FormLabel><FormControl><Input type="number" min="0" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="furnished" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>เฟอร์นิเจอร์</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="เลือก" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="furnished">พร้อมเฟอร์นิเจอร์</SelectItem>
                                            <SelectItem value="partially">เฟอร์นิเจอร์บางส่วน</SelectItem>
                                            <SelectItem value="unfurnished">ไม่มีเฟอร์นิเจอร์</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="yearBuilt" render={({ field }) => (
                                <FormItem><FormLabel>ปีที่สร้าง</FormLabel><FormControl><Input type="number" min="1800" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="latitude" render={({ field }) => (
                                <FormItem><FormLabel>ละติจูด</FormLabel><FormControl><Input type="number" min="-90" max="90" step="any" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="longitude" render={({ field }) => (
                                <FormItem><FormLabel>ลองจิจูด</FormLabel><FormControl><Input type="number" min="-180" max="180" step="any" {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="nearbyPlaces" render={({ field }) => (
                                <FormItem className="sm:col-span-2 md:col-span-3">
                                    <FormLabel>สถานที่ใกล้เคียง</FormLabel>
                                    <FormControl><Textarea {...field} placeholder="เช่น BTS โรงเรียน โรงพยาบาล หรือห้างสรรพสินค้า" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </div>
                )}

                {/* ─── Part Fields ─── */}
                {productType === "part" && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium tracking-tight">ข้อมูลอะไหล่</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {(["sku", "brand", "category", "compatibility", "stock"] as const).map((fieldName) => (
                                <FormField
                                    key={fieldName}
                                    control={form.control}
                                    name={fieldName}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="capitalize">{fieldName} *</FormLabel>
                                            <FormControl>
                                                <Input {...field} type={fieldName === "stock" ? "number" : "text"} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="pt-6 flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        ยกเลิก
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initialData ? "บันทึกการแก้ไข" : "สร้างสินค้า"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
