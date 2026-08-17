"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useMemo, useTransition, useState } from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    RotateCcw,
    Search,
    Fuel,
    Gauge,
    Calendar,
    Car,
    Cog,
    Loader2,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────
interface Brand {
    id: string
    name: string
    logo: string | null
    models: { id: string; name: string; brandId: string }[]
}

interface VehicleFilterSidebarProps {
    brands: Brand[]
}

// ─── Constants ───────────────────────────────────────────────
const PRICE_MIN = 0
const PRICE_MAX = 5000000
const YEAR_MIN = 2000
const YEAR_MAX = new Date().getFullYear() + 1

const MILEAGE_MIN = 0
const MILEAGE_MAX = 300000
const TRANSMISSIONS = [
    { value: "automatic", label: "อัตโนมัติ (AT)" },
    { value: "manual", label: "ธรรมดา (MT)" },
]

const FUEL_TYPES = [
    { value: "gasoline", label: "เบนซิน" },
    { value: "diesel", label: "ดีเซล" },
    { value: "hybrid", label: "ไฮบริด" },
    { value: "electric", label: "ไฟฟ้า (EV)" },
]

const BODY_TYPES = [
    { value: "sedan", label: "ซีดาน" },
    { value: "suv", label: "SUV" },
    { value: "pickup", label: "กระบะ" },
    { value: "hatchback", label: "แฮทช์แบ็ค" },
    { value: "van", label: "แวน/MPV" },
    { value: "coupe", label: "คูเป้" },
]

const SORT_OPTIONS = [
    { value: "newest", label: "ล่าสุด" },
    { value: "price_asc", label: "ราคาต่ำ → สูง" },
    { value: "price_desc", label: "ราคาสูง → ต่ำ" },
    { value: "popular", label: "ยอดนิยม" },
]

// ─── Component ───────────────────────────────────────────────
export default function VehicleFilterSidebar({ brands }: VehicleFilterSidebarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    // ─── Read current filters from URL ────────────────────────
    const currentBrand = searchParams.get("brand") || ""
    const currentModel = searchParams.get("model") || ""
    const currentTransmission = searchParams.get("transmission")?.split(",").filter(Boolean) || []
    const currentFuelType = searchParams.get("fuelType")?.split(",").filter(Boolean) || []
    const currentBodyType = searchParams.get("bodyType")?.split(",").filter(Boolean) || []
    const currentSort = searchParams.get("sort") || "newest"
    const currentSearch = searchParams.get("q") || ""

    const currentPriceMin = parseInt(searchParams.get("priceMin") || String(PRICE_MIN))
    const currentPriceMax = parseInt(searchParams.get("priceMax") || String(PRICE_MAX))
    const currentYearMin = parseInt(searchParams.get("yearMin") || String(YEAR_MIN))
    const currentYearMax = parseInt(searchParams.get("yearMax") || String(YEAR_MAX))
    const currentMileageMin = parseInt(searchParams.get("mileageMin") || String(MILEAGE_MIN))
    const currentMileageMax = parseInt(searchParams.get("mileageMax") || String(MILEAGE_MAX))

    // Local state for direct inputs
    const [priceInputMin, setPriceInputMin] = useState(String(currentPriceMin))
    const [priceInputMax, setPriceInputMax] = useState(String(currentPriceMax))

    const [yearInputMin, setYearInputMin] = useState(String(currentYearMin))
    const [yearInputMax, setYearInputMax] = useState(String(currentYearMax))
    const [mileageInputMin, setMileageInputMin] = useState(String(currentMileageMin))
    const [mileageInputMax, setMileageInputMax] = useState(String(currentMileageMax))

    const rangeKey = [currentPriceMin, currentPriceMax, currentYearMin, currentYearMax, currentMileageMin, currentMileageMax].join(":")
    const [lastRangeKey, setLastRangeKey] = useState(rangeKey)
    if (lastRangeKey !== rangeKey) {
        setLastRangeKey(rangeKey)
        setPriceInputMin(String(currentPriceMin))
        setPriceInputMax(String(currentPriceMax))
        setYearInputMin(String(currentYearMin))
        setYearInputMax(String(currentYearMax))
        setMileageInputMin(String(currentMileageMin))
        setMileageInputMax(String(currentMileageMax))
    }


    const filteredModels = useMemo(() => {
        if (!currentBrand) return []
        const brand = brands.find((b) => b.id === currentBrand)
        return brand?.models || []
    }, [currentBrand, brands])

    // ─── Update URL helper ────────────────────────────────────
    const updateFilters = useCallback(
        (updates: Record<string, string | null>) => {
            const params = new URLSearchParams(searchParams.toString())
            params.delete("page")

            Object.entries(updates).forEach(([key, value]) => {
                if (value === null || value === "" || value === "all") {
                    params.delete(key)
                } else {
                    params.set(key, value)
                }
            })

            if (params.get("priceMin") === String(PRICE_MIN)) params.delete("priceMin")
            if (params.get("priceMax") === String(PRICE_MAX)) params.delete("priceMax")
            if (params.get("yearMin") === String(YEAR_MIN)) params.delete("yearMin")
            if (params.get("yearMax") === String(YEAR_MAX)) params.delete("yearMax")
            if (params.get("mileageMin") === String(MILEAGE_MIN)) params.delete("mileageMin")
            if (params.get("mileageMax") === String(MILEAGE_MAX)) params.delete("mileageMax")
            if (params.get("sort") === "newest") params.delete("sort")

            startTransition(() => {
                router.push(`${pathname}?${params.toString()}`, { scroll: false })
            })
        },
        [searchParams, pathname, router]
    )

    const toggleArrayFilter = (key: string, value: string, currentArray: string[]) => {
        const nextArray = currentArray.includes(value)
            ? currentArray.filter((v) => v !== value)
            : [...currentArray, value]
        updateFilters({ [key]: nextArray.length > 0 ? nextArray.join(",") : null })
    }

    const clearFilters = useCallback(() => {
        startTransition(() => {
            router.push(pathname, { scroll: false })
        })
    }, [router, pathname])

    const hasActiveFilters = searchParams.toString().length > 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    ค้นหา & กรอง
                </h2>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-muted-foreground hover:text-foreground"
                        disabled={isPending}
                    >
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        ล้าง
                    </Button>
                )}
            </div>

            {isPending && (
                <div className="flex items-center gap-2 text-sm text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังค้นหา...
                </div>
            )}

            {/* General */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <Input
                        placeholder="พิมพ์ชื่อรถ..."
                        defaultValue={currentSearch}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                updateFilters({ q: (e.target as HTMLInputElement).value })
                            }
                        }}
                    />
                </div>
                <div className="space-y-2">
                    <Select
                        value={currentSort}
                        onValueChange={(value) => updateFilters({ sort: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="เรียงตาม" />
                        </SelectTrigger>
                        <SelectContent>
                            {SORT_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Accordion type="multiple" defaultValue={["brand", "price"]} className="w-full">
                {/* ─── Brand & Model ─── */}
                <AccordionItem value="brand" className="border-b-0">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-primary">
                        <span className="flex items-center gap-2"><Car className="h-4 w-4" /> ยี่ห้อ และ รุ่น</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <Select
                            value={currentBrand || "all"}
                            onValueChange={(value) =>
                                updateFilters({
                                    brand: value === "all" ? null : value,
                                    model: null,
                                })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="ทุกยี่ห้อ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกยี่ห้อ</SelectItem>
                                {brands.map((brand) => (
                                    <SelectItem key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {filteredModels.length > 0 && (
                            <Select
                                value={currentModel || "all"}
                                onValueChange={(value) =>
                                    updateFilters({ model: value === "all" ? null : value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="ทุกรุ่น" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">ทุกรุ่น</SelectItem>
                                    {filteredModels.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </AccordionContent>
                </AccordionItem>

                {/* ─── Price Range ─── */}
                <AccordionItem value="price" className="border-b-0">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-primary">
                        ช่วงราคา
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div className="flex gap-2 items-center">
                            <Input
                                type="number"
                                value={priceInputMin}
                                onChange={(e) => setPriceInputMin(e.target.value)}
                                onBlur={() => updateFilters({ priceMin: priceInputMin, priceMax: priceInputMax })}
                                placeholder="ต่ำสุด"
                                className="h-8 text-xs font-mono"
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                                type="number"
                                value={priceInputMax}
                                onChange={(e) => setPriceInputMax(e.target.value)}
                                onBlur={() => updateFilters({ priceMin: priceInputMin, priceMax: priceInputMax })}
                                placeholder="สูงสุด"
                                className="h-8 text-xs font-mono"
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* ─── Year Range ─── */}
                <AccordionItem value="year" className="border-b-0">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-primary">
                        <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> ปีจดทะเบียน</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div className="flex gap-2 items-center">
                            <Input
                                type="number"
                                value={yearInputMin}
                                onChange={(e) => setYearInputMin(e.target.value)}
                                onBlur={() => updateFilters({ yearMin: yearInputMin, yearMax: yearInputMax })}
                                placeholder="ต่ำสุด"
                                className="h-8 text-xs"
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                                type="number"
                                value={yearInputMax}
                                onChange={(e) => setYearInputMax(e.target.value)}
                                onBlur={() => updateFilters({ yearMin: yearInputMin, yearMax: yearInputMax })}
                                placeholder="สูงสุด"
                                className="h-8 text-xs"
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* ─── Mileage Range ─── */}
                <AccordionItem value="mileage" className="border-b-0">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-primary">
                        <span className="flex items-center gap-2"><Gauge className="h-4 w-4" /> เลขไมล์ (กม.)</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div className="flex gap-2 items-center">
                            <Input
                                type="number"
                                value={mileageInputMin}
                                onChange={(e) => setMileageInputMin(e.target.value)}
                                onBlur={() => updateFilters({ mileageMin: mileageInputMin, mileageMax: mileageInputMax })}
                                placeholder="ต่ำสุด"
                                className="h-8 text-xs"
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                                type="number"
                                value={mileageInputMax}
                                onChange={(e) => setMileageInputMax(e.target.value)}
                                onBlur={() => updateFilters({ mileageMin: mileageInputMin, mileageMax: mileageInputMax })}
                                placeholder="สูงสุด"
                                className="h-8 text-xs"
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* ─── Specs (Transmission, Body, Fuel) ─── */}
                <AccordionItem value="specs" className="border-b-0">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-primary">
                        <span className="flex items-center gap-2"><Cog className="h-4 w-4" /> สเปคตัวรถ</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-2">
                        {/* Body Type */}
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase">ประเภทตัวถัง</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {BODY_TYPES.map((b) => (
                                    <div key={b.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`body-${b.value}`}
                                            checked={currentBodyType.includes(b.value)}
                                            onCheckedChange={() => toggleArrayFilter("bodyType", b.value, currentBodyType)}
                                        />
                                        <label htmlFor={`body-${b.value}`} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                            {b.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Transmission */}
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase">ระบบเกียร์</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {TRANSMISSIONS.map((t) => (
                                    <div key={t.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`trans-${t.value}`}
                                            checked={currentTransmission.includes(t.value)}
                                            onCheckedChange={() => toggleArrayFilter("transmission", t.value, currentTransmission)}
                                        />
                                        <label htmlFor={`trans-${t.value}`} className="text-sm leading-none cursor-pointer">
                                            {t.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Fuel Type */}
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                <Fuel className="h-3 w-3" /> เชื้อเพลิง
                            </Label>
                            <div className="grid grid-cols-2 gap-2">
                                {FUEL_TYPES.map((f) => (
                                    <div key={f.value} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`fuel-${f.value}`}
                                            checked={currentFuelType.includes(f.value)}
                                            onCheckedChange={() => toggleArrayFilter("fuelType", f.value, currentFuelType)}
                                        />
                                        <label htmlFor={`fuel-${f.value}`} className="text-sm leading-none cursor-pointer">
                                            {f.label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
