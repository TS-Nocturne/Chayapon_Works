// ==========================================
// Mobile Filter — Sheet Wrapper (Real Estate)
// ==========================================

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose,
} from "@/components/ui/sheet"
import RealEstateFilterSidebar from "./RealEstateFilterSidebar"

interface RealEstateMobileFilterProps {
    locations: string[]
}

export default function RealEstateMobileFilter({ locations }: RealEstateMobileFilterProps) {
    const [open, setOpen] = useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className={`fixed inset-x-4 bottom-4 z-40 h-12 rounded-full border-blue-700 bg-blue-700 text-white shadow-[0_12px_30px_rgba(29,78,216,.35)] hover:bg-blue-800 lg:hidden ${open ? "hidden" : ""}`}
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    ปรับตัวกรอง
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="mobile-filter-panel flex w-[calc(100vw-1rem)] max-w-[360px] min-w-0 flex-col overflow-x-hidden bg-card/95 p-0 backdrop-blur-xl">
                <SheetHeader className="px-5 py-4 border-b text-left">
                    <SheetTitle>ตัวค้นหาและตัวกรองอสังหาฯ</SheetTitle>
                    <SheetDescription>บ้าน คอนโด หรือที่ดินที่ตรงใจคุณ</SheetDescription>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <RealEstateFilterSidebar locations={locations} />
                </div>

                <SheetFooter className="px-5 py-4 border-t bg-card/95 backdrop-blur-md">
                    <SheetClose asChild>
                        <Button className="w-full text-md font-semibold h-11" onClick={() => setOpen(false)}>
                            ดูผลลัพธ์
                        </Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
