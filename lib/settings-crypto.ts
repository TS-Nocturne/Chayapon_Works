import "server-only"

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"

const VERSION = "v1"

function encryptionKey() {
    const secret = process.env.STORE_SETTINGS_ENCRYPTION_KEY || process.env.BETTER_AUTH_SECRET
    if (!secret) throw new Error("STORE_SETTINGS_ENCRYPTION_KEY is not configured")
    return createHash("sha256").update(secret).digest()
}

export function encryptSetting(value: string) {
    if (!value) return null
    const iv = randomBytes(12)
    const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
    const tag = cipher.getAuthTag()
    return [VERSION, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".")
}

export function decryptSetting(value?: string | null) {
    if (!value) return ""
    const [version, iv, tag, encrypted] = value.split(".")
    if (version !== VERSION || !iv || !tag || !encrypted) throw new Error("Invalid encrypted store setting")
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"))
    decipher.setAuthTag(Buffer.from(tag, "base64url"))
    return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8")
}
