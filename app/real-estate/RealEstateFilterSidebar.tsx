// ==========================================
// Real Estate Filter Sidebar — Client Component
// ==========================================
// ใช้ URL searchParams เป็น Single Source of Truth
// Pattern เดียวกับ VehicleFilterSidebar

"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useTransition, useState } from "react"
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
    Building2,
    MapPin,
    BedDouble,
    Ruler,
    Loader2,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────
interface RealEstateFilterSidebarProps {
    locations: string[]
}

// ─── Constants ───────────────────────────────────────────────
const PRICE_MIN = 0
const PRICE_MAX = 50000000
const AREA_MIN = 0
const AREA_MAX = 1000
const PROPERTY_TYPES = [
    { value: "house", label: "บ้านเดี่ยว" },
    { value: "condo", label: "คอนโดมิเนียม" },
    { value: "townhouse", label: "ทาวน์เฮ้าส์" },
    { value: "land", label: "ที่ดิน" },
]

const BEDROOM_OPTIONS = [
    { value: "1", label: "1+" },
    { value: "2", label: "2+" },
    { value: "3", label: "3+" },
    { value: "4", label: "4+" },
    { value: "5", label: "5+" },
]

const BATHROOM_OPTIONS = [
    { value: "1", label: "1+" },
    { value: "2", label: "2+" },
    { value: "3", label: "3+" },
]

const FURNISHED_OPTIONS = [
    { value: "furnished", label: "เฟอร์ครบ" },
    { value: "partially", label: "เฟอร์บางส่วน" },
    { value: "unfurnished", label: "ไม่มีเฟอร์" },
]

const SORT_OPTIONS = [
    { value: "newest", label: "ล่าสุด" },
    { value: "price_asc", label: "ราคาต่ำ → สูง" },
    { value: "price_desc", label: "ราคาสูง → ต่ำ" },
    { value: "popular", label: "ยอดนิยม" },
]

// ─── Component ───────────────────────────────────────────────
export default function RealEstateFilterSidebar({ locations }: RealEstateFilterSidebarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    // ─── Read current filters from URL ────────────────────────
    const currentPropertyType = searchParams.get("propertyType")?.split(",").filter(Boolean) || []
    const currentLocation = searchParams.get("location") || ""
    const currentBedrooms = searchParams.get("bedrooms") || ""
    const currentBathrooms = searchParams.get("bathrooms") || ""
    const currentFurnished = searchParams.get("furnished") || ""
    const currentSort = searchParams.get("sort") || "newest"
    const currentSearch = searchParams.get("q") || ""

    const currentPriceMin = parseInt(searchParams.get("priceMin") || String(PRICE_MIN))
    const currentPriceMax = parseInt(searchParams.get("priceMax") || String(PRICE_MAX))
    const currentAreaMin = parseInt(searchParams.get("areaMin") || String(AREA_MIN))
    const currentAreaMax = parseInt(searchParams.get("areaMax") || String(AREA_MAX))

    const [priceInputMin, setPriceInputMin] = useState(String(currentPriceMin))
    const [priceInputMax, setPriceInputMax] = useState(String(currentPriceMax))
    const [areaInputMin, setAreaInputMin] = useState(String(currentAreaMin))
    const [areaInputMax, setAreaInputMax] = useState(String(currentAreaMax))

    const rangeKey = [currentPriceMin, currentPriceMax, currentAreaMin, currentAreaMax].join(":")
    const [lastRangeKey, setLastRangeKey] = useState(rangeKey)
    if (lastRangeKey !== rangeKey) {
        setLastRangeKey(rangeKey)
        setPriceInputMin(String(currentPriceMin))
        setPriceInputMax(String(currentPriceMax))
        setAreaInputMin(String(currentAreaMin))
        setAreaInputMax(String(currentAreaMax))
    }

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
            if (params.get("areaMin") === String(AREA_MIN)) params.delete("areaMin")
            if (params.get("areaMax") === String(AREA_MAX)) params.delete("areaMax")
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
                        placeholder="พิมพ์ชื่อทรัพย์..."
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

            <Accordion type="multiple" defaultValue={["propertyType", "location"]} className="w-full">
                {/* ─── Property Type ─── */}
                <AccordionItem value="propertyType" className="border-b-0">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-primary">
                        <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> ประเภทอสังหาฯ</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                        <div className="grid grid-cols-2 gap-2">
                            {PROPERTY_TYPES.map((t) => (
                                <div key={t.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`prop-${t.value}`}
                                        checked={currentPropertyType.includes(t.value)}
                                        onCheckedChange={() => toggleArrayFilter("propertyType", t.value, currentPropertyType)}
                                    />
                                    <label htmlFor={`prop-${t.value}`} className="text-sm leading-none cursor-pointer">
                                        {t.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* ─── Location ─── */}
                <AccordionItem value="location" className="border-b-0">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-primary">
                        <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> ทำเล / จังหวัด</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                        <Select
                            value={currentLocation || "all"}
                            onValueChange={(value) =>
                                updateFilters({ location: value === "all" ? null : value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="ทุกทำเล" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทุกทำเล</SelectItem>
                                {locations.map((loc) => (
                                    <SelectItem key={loc} value={loc}>
                                        {loc}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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

                {/* ─── Bedrooms ─── */}
                <AccordionItem value="bedrooms" className="border-b-0">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-primary">
                        <span className="flex items-center gap-2"><BedDouble className="h-4 w-4" /> ห้องนอน</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant={currentBedrooms === "" ? "default" : "outline"}
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => updateFilters({ bedrooms: null })}
                            >
                                ทั้งหมด
                            </Button>
                            {BEDROOM_OPTIONS.map((opt) => (
                                <Button
                                    key={opt.value}
                                    variant={currentBedrooms === opt.value ? "default" : "outline"}
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => updateFilters({ bedrooms: opt.value })}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>

                        {/* Bathrooms */}
                        <div className="space-y-2 pt-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase">ห้องน้ำ</Label>
                            <div className="flex gap-2 flex-wrap">
                                <Button
                                    variant={currentBathrooms === "" ? "default" : "outline"}
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => updateFilters({ bathrooms: null })}
                                >
                                    ทั้งหมด
                                </Button>
                                {BATHROOM_OPTIONS.map((opt) => (
                                    <Button
                                        key={opt.value}
                                        variant={currentBathrooms === opt.value ? "default" : "outline"}
                                        size="sm"
                                        className="h-8 text-xs"
                                        onClick={() => updateFilters({ bathrooms: opt.value })}
                                    >
                                        {opt.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* ─── Area Size ─── */}
                <AccordionItem value="area" className="border-b-0">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-primary">
                        <span className="flex items-center gap-2"><Ruler className="h-4 w-4" /> พื้นที่ (ตร.ม.)</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-2">
                        <div className="flex gap-2 items-center">
                            <Input
                                type="number"
                                value={areaInputMin}
                                onChange={(e) => setAreaInputMin(e.target.value)}
                                onBlur={() => updateFilters({ areaMin: areaInputMin, areaMax: areaInputMax })}
                                placeholder="ต่ำสุด (ตร.ม.)"
                                className="h-8 text-xs font-mono"
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                                type="number"
                                value={areaInputMax}
                                onChange={(e) => setAreaInputMax(e.target.value)}
                                onBlur={() => updateFilters({ areaMin: areaInputMin, areaMax: areaInputMax })}
                                placeholder="สูงสุด (ตร.ม.)"
                                className="h-8 text-xs font-mono"
                            />
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* ─── Furnished ─── */}
                <AccordionItem value="furnished" className="border-b-0">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-primary">
                        สภาพเฟอร์นิเจอร์
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                        <Select
                            value={currentFurnished || "all"}
                            onValueChange={(value) =>
                                updateFilters({ furnished: value === "all" ? null : value })
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="ทั้งหมด" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">ทั้งหมด</SelectItem>
                                {FURNISHED_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}
