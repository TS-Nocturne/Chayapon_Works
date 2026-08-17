"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { ShoppingCart, Check, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { cn } from "@/lib/utils"
import { useSession } from "@/lib/auth-client"

interface AddToCartButtonProps {
    productId: string
    title: string
    price: number
    image: string
    sku: string
    stock: number
    className?: string
    variant?: "default" | "secondary" | "outline"
    size?: "default" | "sm" | "lg"
}

export default function AddToCartButton({
    productId,
    title,
    price,
    image,
    sku,
    stock,
    className,
    variant = "default",
    size = "default",
}: AddToCartButtonProps) {
    const { addItem } = useCart()
    const router = useRouter()
    const pathname = usePathname()
    const { data: session, isPending } = useSession()
    const [added, setAdded] = React.useState(false)

    const handleAdd = () => {
        if (!session) {
            router.push(`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`)
            return
        }
        addItem({ productId, title, price, image, sku, stock })
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
    }

    if (stock <= 0) {
        return (
            <Button disabled variant="secondary" className={className} size={size}>
                สินค้าหมด
            </Button>
        )
    }

    return (
        <Button
            onClick={handleAdd}
            variant={added ? "secondary" : variant}
            className={cn("gap-2", className)}
            size={size}
            disabled={isPending}
        >
            {!session ? (
                <><LogIn className="h-4 w-4" />เข้าสู่ระบบเพื่อซื้อ</>
            ) : added ? (
                <>
                    <Check className="h-4 w-4" />
                    เพิ่มแล้ว
                </>
            ) : (
                <>
                    <ShoppingCart className="h-4 w-4" />
                    เพิ่มลงตะกร้า
                </>
            )}
        </Button>
    )
}
