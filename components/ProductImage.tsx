"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductImageProps {
    src: string
    alt: string
    fill?: boolean
    className?: string
    sizes?: string
    preload?: boolean
    width?: number
    height?: number
    fallbackLabel?: string
}

export default function ProductImage({
    src,
    alt,
    fill,
    className,
    sizes,
    preload,
    width,
    height,
    fallbackLabel = "ยังไม่มีรูปภาพ",
}: ProductImageProps) {
    const placeholder = "/no_image_placeholder.png"
    const requestedSrc = src || placeholder
    const [failure, setFailure] = useState<{ requestedSrc: string; fallbackFailed: boolean } | null>(null)
    const hasFailed = failure?.requestedSrc === requestedSrc
    const imgSrc = hasFailed ? placeholder : requestedSrc
    const fallbackFailed = hasFailed && failure.fallbackFailed

    const isDataUrl = imgSrc.startsWith("data:")

    if (fallbackFailed) {
        return (
            <div
                role={alt ? "img" : undefined}
                aria-label={alt || undefined}
                aria-hidden={alt ? undefined : true}
                className={cn(
                    "flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground",
                    fill && "absolute inset-0 h-full w-full",
                    className,
                )}
                style={!fill ? { width, height } : undefined}
            >
                <ImageOff className="h-8 w-8" aria-hidden="true" />
                <span className="px-3 text-center text-xs font-medium">{fallbackLabel}</span>
            </div>
        )
    }

    if (isDataUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={imgSrc}
                alt={alt}
                className={cn(fill && "absolute inset-0 h-full w-full object-cover", className)}
                onError={() => {
                    setFailure({ requestedSrc, fallbackFailed: imgSrc === placeholder })
                }}
            />
        )
    }

    return (
        <Image
            src={imgSrc}
            alt={alt}
            fill={fill}
            className={className}
            sizes={sizes}
            priority={preload}
            width={width}
            height={height}
            onError={() => {
                setFailure({ requestedSrc, fallbackFailed: imgSrc === placeholder })
            }}
        />
    )
}
