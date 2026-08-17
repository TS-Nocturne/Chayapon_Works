import { prisma } from "../lib/prisma"
import { safeInternalRedirect } from "../lib/safe-redirect"
import { isSafeRasterDataUrl } from "../lib/validations/image"

const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"
const qaEmail = `qa-security-${Date.now()}@example.com`
const qaIp = `198.51.100.${Math.floor(Math.random() * 200) + 1}`

async function main() {
    const home = await fetch(baseUrl, { redirect: "manual" })
    const crossOrigin = await fetch(`${baseUrl}/api/auth/sign-in/email`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://attacker.invalid" },
        body: JSON.stringify({ email: "nobody@example.com", password: "InvalidPassword123" }),
        redirect: "manual",
    })
    const signUp = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: baseUrl, "x-real-ip": qaIp },
        body: JSON.stringify({
            name: "QA Security",
            email: qaEmail,
            password: "SecurityQA!2026",
            role: "ADMIN",
            phoneNumber: "0812345678",
            policyAccepted: true,
        }),
        redirect: "manual",
    })
    const createdUser = await prisma.user.findUnique({ where: { email: qaEmail }, select: { id: true, role: true } })

    const checks = {
        csp: Boolean(home.headers.get("content-security-policy")?.includes("frame-ancestors 'none'")),
        hsts: Boolean(home.headers.get("strict-transport-security")?.includes("max-age=")),
        noSniff: home.headers.get("x-content-type-options") === "nosniff",
        frameDenied: home.headers.get("x-frame-options") === "DENY",
        noPoweredBy: !home.headers.has("x-powered-by"),
        crossOriginAuthBlocked: crossOrigin.status === 403,
        roleEscalationBlocked: signUp.ok && createdUser?.role === "USER",
        externalRedirectBlocked: safeInternalRedirect("https://attacker.invalid/phish") === "/",
        protocolRelativeRedirectBlocked: safeInternalRedirect("//attacker.invalid/phish") === "/",
        internalRedirectAllowed: safeInternalRedirect("/orders?status=open") === "/orders?status=open",
        svgUploadBlocked: !isSafeRasterDataUrl("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=", 100_000),
    }

    console.log(JSON.stringify({ statuses: { home: home.status, crossOrigin: crossOrigin.status, signUp: signUp.status }, checks }))
    if (Object.values(checks).some((value) => !value)) throw new Error("Security QA failed")
}

main()
    .finally(async () => {
        const user = await prisma.user.findUnique({ where: { email: qaEmail }, select: { id: true } })
        if (user) await prisma.user.delete({ where: { id: user.id } })
        await prisma.$disconnect()
    })
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
