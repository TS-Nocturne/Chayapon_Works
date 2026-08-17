import { prisma } from "../lib/prisma"

async function main() {
    const stamp = Date.now()
    const email = `qa-profile-${stamp}@hybrid.test`
    const password = `QaSafe!${stamp}`
    const originalSettings = await prisma.storeSettings.findUnique({ where: { id: "primary" } })
    let userId = ""
    let leadId = ""

    try {
        const signup = await fetch("http://localhost:3000/api/auth/sign-up/email", {
            method: "POST",
            headers: { "content-type": "application/json", origin: "http://localhost:3000", "x-real-ip": `198.51.100.${Math.floor(Math.random() * 200) + 1}` },
            body: JSON.stringify({ name: "QA Profile", email, password, policyAccepted: true }),
        })
        const signupBody = await signup.json()
        userId = signupBody.user?.id ?? ""
        const cookie = signup.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ")
        if (!signup.ok || !userId || !cookie) throw new Error("Unable to create QA profile user")

        const product = await prisma.product.findFirst({ where: { productType: "vehicle", status: "active" } })
        if (!product) throw new Error("No product for profile QA")
        const lead = await prisma.contactLead.create({ data: { productId: product.id, userId, name: "QA Profile", phone: "0812345678", preferredDate: "2026-08-20" } })
        leadId = lead.id
        await prisma.storeSettings.upsert({
            where: { id: "primary" },
            create: { id: "primary", storeName: "Chayapon Works", contactPhone: "021234567", lineUrl: "https://line.me/R/ti/p/@qa-hybrid" },
            update: { contactPhone: "021234567", lineUrl: "https://line.me/R/ti/p/@qa-hybrid" },
        })

        const [appointments, personal] = await Promise.all([
            fetch("http://localhost:3000/profile/appointments", { headers: { cookie }, redirect: "manual" }),
            fetch("http://localhost:3000/profile/personal-information", { headers: { cookie }, redirect: "manual" }),
        ])
        const appointmentBody = await appointments.text()
        const personalBody = await personal.text()
        const result = {
            appointmentsStatus: appointments.status,
            personalStatus: personal.status,
            appointmentRendered: appointmentBody.includes(product.title),
            contactActionsRendered: appointmentBody.includes("tel:021234567") && appointmentBody.includes("https://line.me/R/ti/p/@qa-hybrid"),
            personalFormRendered: personalBody.includes("QA Profile"),
        }
        console.log(JSON.stringify(result))
        if (appointments.status !== 200 || personal.status !== 200 || !result.appointmentRendered || !result.contactActionsRendered || !result.personalFormRendered) {
            throw new Error("Profile routes QA assertions failed")
        }
    } finally {
        if (leadId) await prisma.contactLead.delete({ where: { id: leadId } }).catch(() => undefined)
        if (originalSettings) {
            await prisma.storeSettings.upsert({ where: { id: originalSettings.id }, create: originalSettings, update: originalSettings })
        } else {
            await prisma.storeSettings.deleteMany({ where: { id: "primary" } })
        }
        if (userId) await prisma.user.delete({ where: { id: userId } }).catch(() => undefined)
        console.log(JSON.stringify({ cleanup: "QA profile user and appointment removed" }))
        await prisma.$disconnect()
    }
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
