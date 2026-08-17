import type { Metadata } from "next"
import { BadgeCheck, Building2, CarFront, Headphones, PackageCheck, ShieldCheck, Wrench } from "lucide-react"
import PolicyPage, { PolicyList, PolicySection } from "@/components/PolicyPage"
import { getPublicStoreSettings } from "@/lib/store-settings"

export const metadata: Metadata = {
    title: "เกี่ยวกับร้าน",
    description: "รู้จัก Chayapon Works ร้านค้าออนไลน์ผู้ขายรายเดียวสำหรับรถยนต์มือสอง อสังหาริมทรัพย์ และอะไหล่รถยนต์",
    alternates: { canonical: "/about" },
}

export default async function AboutPage() {
    const settings = await getPublicStoreSettings()
    return (
        <PolicyPage eyebrow="ABOUT CHAYAPON WORKS" title={`เกี่ยวกับ ${settings.storeName}`} description="ร้านค้าออนไลน์แบบผู้ขายรายเดียวที่รวมรถยนต์มือสอง อสังหาริมทรัพย์ และอะไหล่รถยนต์ไว้ในประสบการณ์เดียวที่ค้นหาง่าย โปร่งใส และติดต่อได้จริง">
            <section className="grid gap-4 sm:grid-cols-3">
                <Category icon={CarFront} title="รถยนต์มือสอง" detail="ดูข้อมูลรถ สถานะการตรวจสอบ และส่งคำขอนัดหมายทดลองขับ" />
                <Category icon={Building2} title="อสังหาริมทรัพย์" detail="บ้าน คอนโด ทาวน์เฮ้าส์ และที่ดิน พร้อมข้อมูลสำคัญตามประเภททรัพย์" />
                <Category icon={Wrench} title="อะไหล่รถยนต์" detail="เลือกสินค้า ตรวจสต็อก สั่งซื้อ และชำระผ่าน PromptPay QR" />
            </section>

            <PolicySection title="เราเป็นใคร">
                <p>{settings.storeName} เป็นร้านค้า E-Commerce ที่บริหารสินค้า ราคา คำสั่งซื้อ และบริการหลังการขายโดยผู้ขายรายเดียว ไม่ใช่ตลาดกลางที่เปิดให้บุคคลทั่วไปลงประกาศขายสินค้าเอง</p>
                <p>ข้อมูลสินค้าได้รับการจัดทำและดูแลโดยทีมงานของร้าน ผู้ใช้สามารถเลือกดูสินค้า นัดหมาย ติดต่อร้าน และติดตามคำสั่งซื้อผ่านเว็บไซต์ได้</p>
            </PolicySection>

            <PolicySection title="หลักการให้บริการ">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Value icon={BadgeCheck} title="ข้อมูลชัดเจน" detail="แสดงรายละเอียด ราคา และสถานะสินค้าในรูปแบบที่ตรวจสอบได้ง่าย" />
                    <Value icon={ShieldCheck} title="ดูแลข้อมูลส่วนบุคคล" detail="เก็บและใช้ข้อมูลเท่าที่จำเป็นต่อการให้บริการและความปลอดภัย" />
                    <Value icon={PackageCheck} title="ติดตามรายการได้" detail="ลูกค้าตรวจสอบสถานะนัดหมายและคำสั่งซื้อได้จากบัญชีของตน" />
                    <Value icon={Headphones} title="ติดต่อร้านได้โดยตรง" detail="ใช้ช่องทางโทรศัพท์หรือ LINE ที่ร้านตั้งค่าและแสดงบนเว็บไซต์" />
                </div>
            </PolicySection>

            <PolicySection title="ก่อนตัดสินใจซื้อหรือนัดหมาย">
                <PolicyList>
                    <li>ตรวจรายละเอียด รูปภาพ ราคา สถานะ และเงื่อนไขของสินค้าอีกครั้ง</li>
                    <li>รถยนต์และอสังหาริมทรัพย์ควรตรวจสภาพ เอกสารสิทธิ์ ภาระผูกพัน และค่าใช้จ่ายที่เกี่ยวข้องก่อนทำสัญญา</li>
                    <li>การส่งคำขอนัดหมายยังไม่ถือเป็นการยืนยัน จนกว่าทีมงานจะติดต่อกลับและยืนยันวันเวลา</li>
                    <li>อะไหล่ควรตรวจรุ่น ปี และความเข้ากันได้กับรถก่อนชำระเงิน</li>
                </PolicyList>
            </PolicySection>

            <PolicySection title="ติดต่อร้าน">
                <p>หากมีคำถามเกี่ยวกับสินค้า คำสั่งซื้อ การนัดหมาย หรือข้อมูลส่วนบุคคล โปรดติดต่อผ่านช่องทางที่ร้านประกาศไว้บนเว็บไซต์</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Contact label="โทรศัพท์" value={settings.contactPhone || "อยู่ระหว่างการตั้งค่าโดยผู้ดูแลระบบ"} />
                    <Contact label="LINE" value={settings.lineUrl || "อยู่ระหว่างการตั้งค่าโดยผู้ดูแลระบบ"} />
                </div>
            </PolicySection>
        </PolicyPage>
    )
}

function Category({ icon: Icon, title, detail }: { icon: React.ComponentType<{ className?: string }>; title: string; detail: string }) {
    return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Icon className="h-7 w-7 text-blue-600" /><h2 className="mt-4 font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p></div>
}

function Value({ icon: Icon, title, detail }: { icon: React.ComponentType<{ className?: string }>; title: string; detail: string }) {
    return <div className="rounded-lg bg-slate-50 p-4"><Icon className="h-5 w-5 text-blue-600" /><h3 className="mt-3 font-semibold text-slate-900">{title}</h3><p className="mt-1 text-xs leading-6">{detail}</p></div>
}

function Contact({ label, value }: { label: string; value: string }) {
    return <div className="rounded-lg border border-slate-200 p-4"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 break-all font-semibold text-slate-900">{value}</p></div>
}
