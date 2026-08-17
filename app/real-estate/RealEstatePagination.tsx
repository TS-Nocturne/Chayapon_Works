// ==========================================
// Real Estate Pagination — Client Component
// ==========================================
// อัปเดต URL searchParams (?page=N) เพื่อ navigate ระหว่างหน้า
// Pattern เดียวกับ VehiclePagination

"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

interface RealEstatePaginationProps {
    currentPage: number
    totalPages: number
}

export default function RealEstatePagination({
    currentPage,
    totalPages,
}: RealEstatePaginationProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const goToPage = useCallback(
        (page: number) => {
            const params = new URLSearchParams(searchParams.toString())
            if (page <= 1) {
                params.delete("page")
            } else {
                params.set("page", String(page))
            }
            startTransition(() => {
                router.push(`${pathname}?${params.toString()}`, { scroll: true })
            })
        },
        [searchParams, pathname, router]
    )

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | "...")[] = []
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else {
            pages.push(1)
            if (currentPage > 3) pages.push("...")
            for (
                let i = Math.max(2, currentPage - 1);
                i <= Math.min(totalPages - 1, currentPage + 1);
                i++
            ) {
                pages.push(i)
            }
            if (currentPage < totalPages - 2) pages.push("...")
            pages.push(totalPages)
        }
        return pages
    }

    return (
        <div className="mt-10 flex items-center justify-center gap-1.5">
            {/* Previous */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1 || isPending}
                className="gap-1"
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">ก่อนหน้า</span>
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
                {isPending && <Loader2 className="h-4 w-4 animate-spin text-primary mr-1" />}
                {getPageNumbers().map((p, i) =>
                    p === "..." ? (
                        <span key={`dots-${i}`} className="px-2 text-muted-foreground text-sm">
                            ...
                        </span>
                    ) : (
                        <Button
                            key={p}
                            variant={p === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(p)}
                            disabled={isPending}
                            className="w-9 h-9 p-0"
                        >
                            {p}
                        </Button>
                    )
                )}
            </div>

            {/* Next */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages || isPending}
                className="gap-1"
            >
                <span className="hidden sm:inline">ถัดไป</span>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}
