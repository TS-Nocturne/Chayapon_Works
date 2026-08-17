// ==========================================
// Product Filters — Client Component
// ==========================================
// Search bar + Type filter dropdown for Products page

"use client"

import { useRouter, usePathname } from "next/navigation"
import { useTransition } from "react"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, Loader2 } from "lucide-react"

interface ProductFiltersProps {
    currentType: string
    searchQuery: string
    totalCount: number
}

export default function ProductFilters({ currentType, searchQuery, totalCount }: ProductFiltersProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [isPending, startTransition] = useTransition()

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams()
        if (key === "type") {
            if (value && value !== "all") params.set("type", value)
            if (searchQuery) params.set("q", searchQuery)
        } else if (key === "q") {
            if (currentType) params.set("type", currentType)
            if (value) params.set("q", value)
        }
        // Always reset to page 1
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`)
        })
    }

    return (
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="ค้นหาชื่อสินค้า..."
                    defaultValue={searchQuery}
                    className="pl-9 h-9"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            updateFilter("q", (e.target as HTMLInputElement).value)
                        }
                    }}
                />
            </div>
            <Select
                value={currentType || "all"}
                onValueChange={(value) => updateFilter("type", value)}
            >
                <SelectTrigger className="w-full sm:w-[160px] h-9">
                    <SelectValue placeholder="ทุกประเภท" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">ทุกประเภท</SelectItem>
                    <SelectItem value="vehicle">รถยนต์</SelectItem>
                    <SelectItem value="real_estate">อสังหาฯ</SelectItem>
                    <SelectItem value="part">อะไหล่</SelectItem>
                </SelectContent>
            </Select>

            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{totalCount} รายการ</span>
            </div>
        </div>
    )
}
