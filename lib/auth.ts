import { betterAuth } from "better-auth"
import { getOAuthState } from "better-auth/api"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"
import { googleSignupPolicyFields } from "@/lib/google-oauth-policy"
import { sendPasswordResetEmail } from "@/lib/transactional-email"
import { z } from "zod"

const authSecret = process.env.BETTER_AUTH_SECRET
if (process.env.NODE_ENV === "production" && (!authSecret || authSecret.length < 32)) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters in production")
}

const authBaseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"
const trustedOrigins = Array.from(new Set([
    new URL(authBaseURL).origin,
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean),
]))
const trustedIpHeader = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase()
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim()
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
const googleOAuthConfigured = Boolean(googleClientId && googleClientSecret)

export const auth = betterAuth({
    secret: authSecret,
    baseURL: authBaseURL,
    trustedOrigins,
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 12,
        maxPasswordLength: 128,
        resetPasswordTokenExpiresIn: 60 * 60,
        revokeSessionsOnPasswordReset: true,
        sendResetPassword: async ({ user, url }) => {
            await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl: url })
        },
    },
    socialProviders: googleOAuthConfigured ? {
        google: {
            clientId: googleClientId!,
            clientSecret: googleClientSecret!,
            // The sign-in page cannot silently create a new Google account.
            // New users must start from sign-up and accept both policies first.
            disableImplicitSignUp: true,
            mapProfileToUser: async () => {
                const oauthState = await getOAuthState()
                return googleSignupPolicyFields(oauthState)
            },
        },
    } : {},
    account: {
        accountLinking: {
            enabled: true,
            trustedProviders: ["google"],
            // Google verifies the email before it is trusted for linking.
            requireLocalEmailVerified: false,
        },
    },
    rateLimit: {
        enabled: true,
        storage: "database",
        window: 60,
        max: 100,
        customRules: {
            "/sign-in/email": { window: 60, max: 5 },
            "/sign-up/email": { window: 60 * 10, max: 5 },
            "/request-password-reset": { window: 60 * 10, max: 3 },
            "/reset-password": { window: 60 * 10, max: 5 },
        },
    },
    advanced: {
        useSecureCookies: process.env.NODE_ENV === "production",
        ipAddress: {
            ipAddressHeaders: [trustedIpHeader && /^[a-z0-9-]+$/.test(trustedIpHeader) ? trustedIpHeader : "x-real-ip"],
        },
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "USER",
                input: false,
            },
            phoneNumber: {
                type: "string",
                required: false,
                validator: { input: z.string().regex(/^0\d{9}$/).max(10) },
            },
            lineId: {
                type: "string",
                required: false,
                input: false,
            },
            address: {
                type: "string",
                required: false,
                input: false,
            },
            policyAccepted: {
                type: "boolean",
                required: true,
                returned: false,
                validator: { input: z.literal(true) },
            },
            policyAcceptedAt: {
                type: "date",
                required: false,
                input: false,
                returned: false,
                defaultValue: () => new Date(),
            },
        },
    },
})
