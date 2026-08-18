"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Form from "next/form"
import Link from "next/link"
import { ArrowRight, Building2, Car, ChevronDown, Cog, House, MapPin, Search, Tag, Truck } from "lucide-react"

type Brand = {
    id: string
    name: string
    logo: string | null
    models: { id: string; name: string; brandId: string }[]
    _count: { vehicles: number }
}

const bodyTypes = [
    { value: "sedan", label: "รถเก๋ง", icon: Car },
    { value: "suv", label: "SUV", icon: Car },
    { value: "pickup", label: "รถกระบะ", icon: Truck },
    { value: "van", label: "รถตู้", icon: Car },
]

const priceOptions = [
    { value: "", label: "ไม่จำกัด" },
    { value: "300000", label: "300,000" },
    { value: "500000", label: "500,000" },
    { value: "800000", label: "800,000" },
    { value: "1000000", label: "1,000,000" },
    { value: "1500000", label: "1,500,000" },
    { value: "2500000", label: "2,500,000" },
]

function SearchSelect({ id, name, label, value, onChange, children }: {
    id: string
    name: string
    label: string
    value?: string
    onChange?: (value: string) => void
    children: React.ReactNode
}) {
    return (
        <label htmlFor={id} className="min-w-0">
            <span className="mb-1.5 block text-xs font-medium text-slate-700">{label}</span>
            <span className="relative block">
                <select id={id} name={name} value={value} onChange={onChange ? (event) => onChange(event.target.value) : undefined} className="h-11 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10">
                    {children}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </span>
        </label>
    )
}

export default function HomeVehicleDiscovery({ brands, vehicleCount }: { brands: Brand[]; vehicleCount: number }) {
    const [brandId, setBrandId] = useState("")
    const [modelId, setModelId] = useState("")
    const models = useMemo(() => brands.find((brand) => brand.id === brandId)?.models ?? [], [brandId, brands])

    return (
        <>
            <section className="relative min-h-[650px] overflow-hidden border-b border-slate-200 bg-slate-50 sm:min-h-[590px] lg:min-h-[560px]">
                <Image src="/marketplace-hero-v2.png" alt="บ้านสมัยใหม่ รถยนต์ และอะไหล่รถยนต์" fill priority className="hidden object-cover object-center sm:block" sizes="100vw" />
                <div className="absolute inset-x-0 top-[94px] h-[170px] sm:hidden">
                    <Image src="/marketplace-hero-mobile-v1.png" alt="บ้านสมัยใหม่ รถยนต์ และอะไหล่รถยนต์" fill priority className="object-cover object-[center_60%]" sizes="100vw" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/5 to-white/20" />
                <div className="market-shell relative z-10 pt-6 text-center sm:pt-10 lg:pt-12">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">CHAYAPON WORKS ONLINE STORE</p>
                    <h1 className="mx-auto mt-2 max-w-4xl break-words px-1 text-[1.45rem] font-black leading-[1.08] tracking-[-0.045em] text-slate-950 sm:px-0 sm:text-[2.5rem] md:text-[2.75rem] lg:text-[3.15rem] xl:text-[3.8rem]">ค้นหารถ บ้าน และอะไหล่ที่ใช่สำหรับคุณ</h1>
                    <p className="mt-2 text-sm text-slate-600 sm:mt-3 sm:text-lg">สินค้าคุณภาพที่ Chayapon Works คัดสรรและดูแลให้คุณในที่เดียว</p>
                </div>

                <div className="market-shell absolute inset-x-0 bottom-4 z-20 sm:bottom-7 lg:bottom-9">
                    <div className="mx-auto max-w-6xl rounded-xl border border-slate-200 bg-white/95 shadow-[0_16px_45px_rgba(15,23,42,0.12)] backdrop-blur-md">
                        <div className="grid min-w-0 grid-cols-3 overflow-hidden border-b border-slate-200">
                            <button type="button" className="flex h-12 min-w-0 items-center justify-center gap-1 border-b-2 border-blue-600 px-1 text-xs font-semibold text-blue-700 sm:gap-2 sm:text-sm"><Car className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" /> รถยนต์</button>
                            <Link href="/real-estate" className="flex h-12 min-w-0 items-center justify-center gap-1 border-l border-slate-200 px-1 text-xs font-medium text-slate-600 hover:text-blue-700 sm:gap-2 sm:text-sm"><Building2 className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" /><span className="truncate"><span className="sm:hidden">อสังหาฯ</span><span className="hidden sm:inline">อสังหาริมทรัพย์</span></span></Link>
                            <Link href="/parts" className="flex h-12 min-w-0 items-center justify-center gap-1 border-l border-slate-200 px-1 text-xs font-medium text-slate-600 hover:text-blue-700 sm:gap-2 sm:text-sm"><Cog className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" /> อะไหล่</Link>
                        </div>

                        <Form action="/vehicles" className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1fr_auto] lg:items-end lg:p-5">
                            <label className="col-span-2 min-w-0 lg:col-span-1">
                                <span className="mb-1.5 block text-xs font-medium text-slate-700">ค้นหาคำค้น</span>
                                <span className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input name="q" placeholder="เช่น Toyota, Camry" className="h-11 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10" /></span>
                            </label>
                            <SearchSelect id="hero-brand" name="brand" label="ยี่ห้อ" value={brandId} onChange={(value) => { setBrandId(value); setModelId("") }}>
                                <option value="">ทุกยี่ห้อ</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                            </SearchSelect>
                            <SearchSelect id="hero-model" name="model" label="รุ่น" value={modelId} onChange={setModelId}>
                                <option value="">{brandId ? "ทุกรุ่น" : "เลือกรุ่น"}</option>{models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
                            </SearchSelect>
                            <SearchSelect id="hero-min" name="priceMin" label="ราคาต่ำสุด">{priceOptions.map((item) => <option key={`min-${item.value}`} value={item.value}>{item.label}</option>)}</SearchSelect>
                            <SearchSelect id="hero-max" name="priceMax" label="ราคาสูงสุด">{priceOptions.map((item) => <option key={`max-${item.value}`} value={item.value}>{item.label}</option>)}</SearchSelect>
                            <button className="col-span-2 h-11 rounded-md bg-blue-600 px-8 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 lg:col-span-1" type="submit">ค้นหา</button>
                        </Form>
                        <div className="hidden items-center justify-between border-t border-slate-100 px-5 py-2 text-xs text-slate-500 sm:flex">
                            <span>มีรถพร้อมขาย {vehicleCount.toLocaleString("th-TH")} คัน</span>
                            <Link href="/vehicles" className="flex items-center gap-1 font-semibold text-blue-700 hover:underline">ค้นหาแบบละเอียด <ArrowRight className="h-3.5 w-3.5" /></Link>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-b border-slate-200 bg-white">
                <div className="market-shell flex max-w-full justify-start gap-2 overflow-x-auto overscroll-x-contain py-3 [scrollbar-width:none] sm:gap-4 sm:py-4 xl:justify-center">
                    {bodyTypes.map(({ value, label, icon: Icon }) => <Link key={value} href={`/vehicles?bodyType=${value}`} className="group flex min-w-[112px] flex-col items-center gap-2 border-r border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 last:border-r-0 hover:text-blue-700"><Icon className="h-7 w-7 stroke-[1.5] transition-transform group-hover:-translate-y-0.5" />{label}</Link>)}
                    <Link href="/real-estate?propertyType=house" className="group flex min-w-[112px] flex-col items-center gap-2 border-r border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:text-blue-700"><House className="h-7 w-7 stroke-[1.5]" />บ้าน</Link>
                    <Link href="/real-estate?propertyType=condo" className="group flex min-w-[112px] flex-col items-center gap-2 border-r border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:text-blue-700"><Building2 className="h-7 w-7 stroke-[1.5]" />คอนโด</Link>
                    <Link href="/real-estate?propertyType=land" className="group flex min-w-[112px] flex-col items-center gap-2 border-r border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:text-blue-700"><MapPin className="h-7 w-7 stroke-[1.5]" />ที่ดิน</Link>
                    <Link href="/parts" className="group flex min-w-[112px] flex-col items-center gap-2 border-r border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:text-blue-700"><Cog className="h-7 w-7 stroke-[1.5]" />เครื่องยนต์</Link>
                    <Link href="/parts" className="group flex min-w-[112px] flex-col items-center gap-2 px-5 py-2 text-sm font-medium text-slate-700 hover:text-blue-700"><Tag className="h-7 w-7 stroke-[1.5]" />อะไหล่</Link>
                </div>
            </section>

            <section className="border-b border-slate-100 bg-slate-50/60 py-4">
                <div className="market-shell flex items-center gap-3 overflow-x-auto">
                    <span className="shrink-0 text-xs font-semibold text-slate-500"><MapPin className="mr-1 inline h-3.5 w-3.5" />แบรนด์ยอดนิยม</span>
                    {brands.slice(0, 8).map((brand) => <Link key={brand.id} href={`/vehicles?brand=${brand.id}`} className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-700">{brand.name} <span className="ml-1 text-slate-400">{brand._count.vehicles}</span></Link>)}
                </div>
            </section>
        </>
    )
}
