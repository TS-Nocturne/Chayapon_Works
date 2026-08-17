"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Expand, Images } from "lucide-react"
import ProductImage from "@/components/ProductImage"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ProductGalleryProps {
    images: string[]
    title: string
    fallbackLabel?: string
}

export default function ProductGallery({ images, title, fallbackLabel }: ProductGalleryProps) {
    const safeImages = images.length ? images : ["/no_image_placeholder.png"]
    const [selectedIndex, setSelectedIndex] = React.useState(0)
    const [lightboxOpen, setLightboxOpen] = React.useState(false)
    const touchStartX = React.useRef<number | null>(null)
    const suppressOpen = React.useRef(false)
    const thumbnailRefs = React.useRef<Array<HTMLButtonElement | null>>([])

    const showPrevious = React.useCallback(() => {
        setSelectedIndex((current) => (current - 1 + safeImages.length) % safeImages.length)
    }, [safeImages.length])

    const showNext = React.useCallback(() => {
        setSelectedIndex((current) => (current + 1) % safeImages.length)
    }, [safeImages.length])

    React.useEffect(() => {
        thumbnailRefs.current[selectedIndex]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }, [selectedIndex])

    React.useEffect(() => {
        if (!lightboxOpen) return
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "ArrowLeft") showPrevious()
            if (event.key === "ArrowRight") showNext()
        }
        window.addEventListener("keydown", handleKeyDown)
        return () => window.removeEventListener("keydown", handleKeyDown)
    }, [lightboxOpen, showNext, showPrevious])

    function handleTouchStart(event: React.TouchEvent) {
        touchStartX.current = event.touches[0]?.clientX ?? null
        suppressOpen.current = false
    }

    function handleTouchEnd(event: React.TouchEvent) {
        if (touchStartX.current == null || safeImages.length < 2) return
        const endX = event.changedTouches[0]?.clientX ?? touchStartX.current
        const distance = endX - touchStartX.current
        touchStartX.current = null
        if (Math.abs(distance) < 45) return
        suppressOpen.current = true
        if (distance > 0) showPrevious()
        else showNext()
    }

    function openLightbox() {
        if (suppressOpen.current) {
            suppressOpen.current = false
            return
        }
        setLightboxOpen(true)
    }

    const navigationButton = "absolute top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/45 text-white shadow-lg backdrop-blur transition hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"

    return (
        <>
            <div className="space-y-3 sm:space-y-4">
                <div
                    className="group relative aspect-[16/10] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 max-sm:-mx-4 max-sm:rounded-none max-sm:border-x-0"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <button
                        type="button"
                        onClick={openLightbox}
                        className="absolute inset-0 z-10 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600"
                        aria-label={`ดูภาพ ${selectedIndex + 1} ของ ${title} แบบเต็มหน้าจอ`}
                    >
                        <ProductImage
                            src={safeImages[selectedIndex]}
                            alt={`${title} ภาพที่ ${selectedIndex + 1}`}
                            fill
                            className="object-cover transition duration-300 group-hover:scale-[1.01]"
                            sizes="(min-width: 1024px) 62vw, 100vw"
                            preload={selectedIndex === 0}
                            fallbackLabel={fallbackLabel}
                        />
                    </button>

                    <span className="pointer-events-none absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                        <Expand className="h-3.5 w-3.5" /> ดูภาพเต็ม
                    </span>
                    <span className="pointer-events-none absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                        <Images className="h-3.5 w-3.5" /> {selectedIndex + 1} / {safeImages.length}
                    </span>

                    {safeImages.length > 1 && (
                        <>
                            <button type="button" onClick={showPrevious} className={cn(navigationButton, "left-3")} aria-label="ดูภาพก่อนหน้า">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button type="button" onClick={showNext} className={cn(navigationButton, "right-3")} aria-label="ดูภาพถัดไป">
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </>
                    )}
                </div>

                {safeImages.length > 1 && (
                    <div className="flex snap-x gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:thin]" aria-label="ภาพสินค้าทั้งหมด">
                        {safeImages.map((image, index) => (
                            <button
                                key={`${image}-${index}`}
                                ref={(element) => { thumbnailRefs.current[index] = element }}
                                type="button"
                                onClick={() => setSelectedIndex(index)}
                                className={cn(
                                    "relative aspect-[16/10] w-24 shrink-0 snap-center overflow-hidden rounded-md border-2 bg-slate-100 transition sm:w-32",
                                    selectedIndex === index ? "border-blue-600 ring-2 ring-blue-600/15" : "border-transparent hover:border-slate-300",
                                )}
                                aria-label={`ดูภาพที่ ${index + 1}`}
                                aria-current={selectedIndex === index ? "true" : undefined}
                            >
                                <ProductImage src={image} alt="" fill className="object-cover" sizes="128px" fallbackLabel={fallbackLabel} />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
                <DialogContent className="h-[100dvh] w-screen !max-w-none gap-0 border-0 bg-black p-0 text-white shadow-none sm:rounded-none [&>button]:right-4 [&>button]:top-4 [&>button]:z-30 [&>button]:grid [&>button]:h-10 [&>button]:w-10 [&>button]:place-items-center [&>button]:rounded-full [&>button]:bg-white/15 [&>button]:text-white [&>button]:opacity-100">
                    <DialogTitle className="sr-only">ภาพสินค้า {title}</DialogTitle>
                    <DialogDescription className="sr-only">ใช้ปุ่มลูกศรหรือปัดหน้าจอเพื่อดูภาพก่อนหน้าและภาพถัดไป</DialogDescription>

                    <div className="relative h-full w-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
                        <ProductImage
                            src={safeImages[selectedIndex]}
                            alt={`${title} ภาพที่ ${selectedIndex + 1}`}
                            fill
                            className="object-contain px-2 pb-28 pt-14 sm:px-16 sm:pb-32 sm:pt-12"
                            sizes="100vw"
                            fallbackLabel={fallbackLabel}
                        />

                        <div className="absolute left-4 top-4 z-20 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold backdrop-blur sm:left-6">
                            {selectedIndex + 1} / {safeImages.length}
                        </div>

                        {safeImages.length > 1 && (
                            <>
                                <button type="button" onClick={showPrevious} className={cn(navigationButton, "left-3 sm:left-6")} aria-label="ดูภาพก่อนหน้า">
                                    <ChevronLeft className="h-6 w-6" />
                                </button>
                                <button type="button" onClick={showNext} className={cn(navigationButton, "right-3 sm:right-6")} aria-label="ดูภาพถัดไป">
                                    <ChevronRight className="h-6 w-6" />
                                </button>
                            </>
                        )}

                        {safeImages.length > 1 && (
                            <div className="absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-black via-black/80 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8">
                                <div className="flex max-w-full gap-2 overflow-x-auto overscroll-x-contain [scrollbar-width:none]">
                                    {safeImages.map((image, index) => (
                                        <button
                                            key={`lightbox-${image}-${index}`}
                                            type="button"
                                            onClick={() => setSelectedIndex(index)}
                                            className={cn(
                                                "relative h-16 w-24 shrink-0 overflow-hidden rounded-md border-2 bg-slate-900 transition",
                                                selectedIndex === index ? "border-white" : "border-transparent opacity-65 hover:opacity-100",
                                            )}
                                            aria-label={`ดูภาพที่ ${index + 1}`}
                                        >
                                            <ProductImage src={image} alt="" fill className="object-cover" sizes="96px" fallbackLabel={fallbackLabel} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
