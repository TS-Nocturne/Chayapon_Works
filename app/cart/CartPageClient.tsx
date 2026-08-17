"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/utils"
import ProductImage from "@/components/ProductImage"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function CartPageClient() {
    const { items, itemCount, totalAmount, updateQuantity, removeItem } = useCart()
    const router = useRouter()

    if (itemCount === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
                <h1 className="text-xl font-semibold">ตะกร้าว่างเปล่า</h1>
                <p className="text-muted-foreground text-sm">เพิ่มอะไหล่จากหน้ารายการสินค้า</p>
                <Link href="/parts">
                    <Button>ไปเลือกซื้ออะไหล่</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="market-shell py-8 sm:py-10">
            <CheckoutSteps active={1} />
            <h1 className="mt-8 text-2xl font-bold tracking-tight sm:text-3xl">ตะกร้าสินค้า</h1>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
                <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-none">
                    <div className="border-b border-slate-200 px-5 py-4 text-sm font-semibold">สินค้าในตะกร้า ({itemCount})</div>
                    <div className="divide-y divide-slate-200">
                        {items.map((item) => (
                            <CardContent key={item.productId} className="flex gap-4 p-5">
                                <Link href={`/parts/${item.productId}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-slate-50"><ProductImage src={item.image} alt={item.title} fill className="object-contain p-2" sizes="96px" /></Link>
                                <div className="min-w-0 flex-1"><Link href={`/parts/${item.productId}`} className="line-clamp-2 text-sm font-semibold hover:text-blue-700">{item.title}</Link><p className="mt-1 text-xs text-slate-500">SKU: {item.sku}</p><p className="mt-3 font-bold text-blue-700">{formatPrice(item.price)}</p></div>
                                <div className="flex flex-col items-end justify-between gap-3">
                                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.productId)} className="h-8 w-8 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                                    <div className="flex items-center border border-slate-200 rounded-md"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity - 1)}><Minus className="h-3 w-3" /></Button><span className="w-8 text-center text-sm font-medium">{item.quantity}</span><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.stock}><Plus className="h-3 w-3" /></Button></div>
                                </div>
                            </CardContent>
                        ))}
                    </div>
                </Card>

                <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-none lg:sticky lg:top-24">
                    <CardContent className="space-y-4 p-5"><h2 className="font-semibold">สรุปคำสั่งซื้อ</h2><div className="flex justify-between text-sm text-slate-600"><span>ราคาสินค้า ({itemCount} ชิ้น)</span><span>{formatPrice(totalAmount)}</span></div><div className="flex justify-between text-sm text-slate-600"><span>ค่าจัดส่ง</span><span className="text-emerald-600">คำนวณในขั้นตอนถัดไป</span></div><div className="flex items-end justify-between border-t border-slate-200 pt-4"><span className="font-semibold">ยอดรวมทั้งหมด</span><span className="text-2xl font-bold text-blue-700">{formatPrice(totalAmount)}</span></div><Button size="lg" className="w-full gap-2 rounded-md bg-blue-600 hover:bg-blue-700" onClick={() => router.push("/checkout")}>ดำเนินการชำระเงิน<ArrowRight className="h-4 w-4" /></Button><p className="text-center text-xs text-slate-500">ชำระเงินอย่างปลอดภัยและตรวจสอบได้</p></CardContent>
                </Card>
            </div>
        </div>
    )
}

function CheckoutSteps({ active }: { active: number }) {
    return <div className="mx-auto grid max-w-2xl grid-cols-4">{["ตะกร้าสินค้า", "ที่อยู่จัดส่ง", "ชำระเงิน", "สำเร็จ"].map((label, index) => { const step = index + 1; return <div key={label} className="relative text-center"><div className={`relative z-10 mx-auto grid h-7 w-7 place-items-center rounded-full border text-xs font-bold ${step <= active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-slate-400"}`}>{step}</div><p className={`mt-2 text-xs ${step <= active ? "font-semibold text-blue-700" : "text-slate-400"}`}>{label}</p>{index < 3 && <span className="absolute left-1/2 top-3.5 h-px w-full bg-slate-200" />}</div> })}</div>
}
