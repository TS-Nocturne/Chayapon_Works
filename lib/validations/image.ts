const rasterDataUrl = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/

function hasExpectedSignature(mime: string, payload: string) {
    try {
        const binary = atob(payload.slice(0, 32))
        const bytes = Array.from(binary, (character) => character.charCodeAt(0))
        if (mime === "jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
        if (mime === "png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte)
        if (mime === "webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
        return false
    } catch {
        return false
    }
}

export function isSafeRasterDataUrl(value: string, maxBytes: number) {
    const match = rasterDataUrl.exec(value)
    if (!match) return false
    const [, mime, payload] = match
    const estimatedBytes = Math.floor(payload.length * 3 / 4) - (payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0)
    return estimatedBytes <= maxBytes && hasExpectedSignature(mime, payload)
}

export function isSafeImageSource(value: string, maxDataBytes: number) {
    if (isSafeRasterDataUrl(value, maxDataBytes)) return true
    if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true

    try {
        const url = new URL(value)
        return url.protocol === "https:" && !url.username && !url.password
    } catch {
        return false
    }
}
