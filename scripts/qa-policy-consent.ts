import { prisma } from "../lib/prisma"

const baseUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"
const email = `qa-policy-${Date.now()}@hybrid.test`
const password = `QaPolicy!${Date.now()}`
const headers = {
    "content-type": "application/json",
    origin: new URL(baseUrl).origin,
    "x-real-ip": `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
}

async function signUp(policyAccepted?: boolean) {
    return fetch(`${baseUrl}/api/auth/sign-up/email`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: "QA Policy Consent", email, password, ...(policyAccepted === undefined ? {} : { policyAccepted }) }),
    })
}

async function main() {
    const rejected = await signUp()
    const userAfterRejection = await prisma.user.findUnique({ where: { email }, select: { id: true } })
    const accepted = await signUp(true)
    const userAfterAcceptance = await prisma.user.findUnique({
        where: { email },
        select: { id: true, policyAccepted: true, policyAcceptedAt: true },
    })

    const checks = {
        missingAcceptanceRejected: rejected.status >= 400 && !userAfterRejection,
        acceptedRegistrationSucceeded: accepted.ok,
        acceptanceRecorded: userAfterAcceptance?.policyAccepted === true && userAfterAcceptance.policyAcceptedAt instanceof Date,
    }

    console.log(JSON.stringify({ statuses: { rejected: rejected.status, accepted: accepted.status }, checks }, null, 2))
    if (Object.values(checks).some((passed) => !passed)) throw new Error("Policy consent QA failed")
}

main()
    .finally(async () => {
        await prisma.user.deleteMany({ where: { email } })
        await prisma.$disconnect()
    })
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
