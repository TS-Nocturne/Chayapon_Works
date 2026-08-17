"use client"

import * as React from "react"

export interface CartItem {
    productId: string
    title: string
    price: number
    image: string
    sku: string
    stock: number
    quantity: number
}

interface CartContextValue {
    items: CartItem[]
    itemCount: number
    totalAmount: number
    addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
}

const CartContext = React.createContext<CartContextValue | null>(null)

const STORAGE_KEY = "hybrid-cart"

function loadCart(): CartItem[] {
    if (typeof window === "undefined") return []
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = React.useState<CartItem[]>([])
    const [hydrated, setHydrated] = React.useState(false)

    React.useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            setItems(loadCart())
            setHydrated(true)
        })
        return () => window.cancelAnimationFrame(frame)
    }, [])

    React.useEffect(() => {
        if (hydrated) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
        }
    }, [items, hydrated])

    const addItem = React.useCallback(
        (item: Omit<CartItem, "quantity">, quantity = 1) => {
            setItems((prev) => {
                const existing = prev.find((i) => i.productId === item.productId)
                if (existing) {
                    const newQty = Math.min(existing.quantity + quantity, item.stock)
                    return prev.map((i) =>
                        i.productId === item.productId ? { ...i, quantity: newQty, stock: item.stock } : i
                    )
                }
                return [...prev, { ...item, quantity: Math.min(quantity, item.stock) }]
            })
        },
        []
    )

    const removeItem = React.useCallback((productId: string) => {
        setItems((prev) => prev.filter((i) => i.productId !== productId))
    }, [])

    const updateQuantity = React.useCallback((productId: string, quantity: number) => {
        setItems((prev) =>
            prev
                .map((i) => {
                    if (i.productId !== productId) return i
                    if (quantity <= 0) return null
                    return { ...i, quantity: Math.min(quantity, i.stock) }
                })
                .filter(Boolean) as CartItem[]
        )
    }, [])

    const clearCart = React.useCallback(() => setItems([]), [])

    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

    return (
        <CartContext.Provider
            value={{ items, itemCount, totalAmount, addItem, removeItem, updateQuantity, clearCart }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const ctx = React.useContext(CartContext)
    if (!ctx) throw new Error("useCart must be used within CartProvider")
    return ctx
}
