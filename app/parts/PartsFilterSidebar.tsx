// ==========================================
// Auto Parts Filter Sidebar — Client Component
// ==========================================

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
    Tags,
    Box,
    Loader2,
} from "lucide-react"

interface PartsFilterSidebarProps {
    categories: string[]
    brands: string[]
}

const PRICE_MIN = 0
const PRICE_MAX = 100000
const SORT_OPTIONS = [
    { value: "newest", label: "ล่าสุด" },
    { value: "price_asc", label: "ราคาต่ำ → สูง" },
    { value: "price_desc", label: "ราคาสูง → ต่ำ" },
    { value: "popular", label: "ยอดนิยม" },
]

export default function PartsFilterSidebar({ categories, brands }: PartsFilterSidebarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const currentCategory = searchParams.get("category")?.split(",").filter(Boolean) || []
    const currentBrand = searchParams.get("brand")?.split(",").filter(Boolean) || []
    const currentSort = searchParams.get("sort") || "newest"
    const currentSearch = searchParams.get("q") || ""

    const currentPriceMin = parseInt(searchParams.get("priceMin") || String(PRICE_MIN))
    const currentPriceMax = parseInt(searchParams.get("priceMax") || String(PRICE_MAX))

    const [priceInputMin, setPriceInputMin] = useState(String(currentPriceMin))
    const [priceInputMax, setPriceInputMax] = useState(String(currentPriceMax))

    const rangeKey = `${currentPriceMin}:${currentPriceMax}`
    const [lastRangeKey, setLastRangeKey] = useState(rangeKey)
    if (lastRangeKey !== rangeKey) {
        setLastRangeKey(rangeKey)
        setPriceInputMin(String(currentPriceMin))
        setPriceInputMax(String(currentPriceMax))
    }

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

            <div className="space-y-4">
                <div className="space-y-2">
                    <Input
                        placeholder="พิมพ์ชื่อ, รุ่นรถ, หรือ SKU..."
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

            <Accordion type="multiple" defaultValue={["category"]} className="w-full">
                {/* ─── Category ─── */}
                <AccordionItem value="category" className="border-b-0">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-primary">
                        <span className="flex items-center gap-2"><Tags className="h-4 w-4" /> หมวดหมู่</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                        <div className="flex flex-col gap-3">
                            {categories.map((c) => (
                                <div key={c} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`cat-${c}`}
                                        checked={currentCategory.includes(c)}
                                        onCheckedChange={() => toggleArrayFilter("category", c, currentCategory)}
                                    />
                                    <label htmlFor={`cat-${c}`} className="text-sm leading-none cursor-pointer">
                                        {c}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* ─── Brand ─── */}
                <AccordionItem value="brand" className="border-b-0">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline hover:text-primary">
                        <span className="flex items-center gap-2"><Box className="h-4 w-4" /> แบรนด์</span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-2">
                        <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-2">
                            {brands.map((b) => (
                                <div key={b} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`brand-${b}`}
                                        checked={currentBrand.includes(b)}
                                        onCheckedChange={() => toggleArrayFilter("brand", b, currentBrand)}
                                    />
                                    <label htmlFor={`brand-${b}`} className="text-sm leading-none cursor-pointer">
                                        {b}
                                    </label>
                                </div>
                            ))}
                        </div>
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
            </Accordion>
        </div>
    )
}
