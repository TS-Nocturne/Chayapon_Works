export function safeInternalRedirect(value: string | null | undefined, fallback = "/") {
    if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback
    if (/[\u0000-\u001F\u007F\\]/.test(value)) return fallback

    try {
        const parsed = new URL(value, "https://internal.invalid")
        return parsed.origin === "https://internal.invalid" ? `${parsed.pathname}${parsed.search}${parsed.hash}` : fallback
    } catch {
        return fallback
    }
}
