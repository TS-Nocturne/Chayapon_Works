function field(id: string, value: string) {
    return `${id}${String(value.length).padStart(2, "0")}${value}`
}

function crc16(payload: string) {
    let crc = 0xffff
    for (let index = 0; index < payload.length; index += 1) {
        crc ^= payload.charCodeAt(index) << 8
        for (let bit = 0; bit < 8; bit += 1) {
            crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1
            crc &= 0xffff
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0")
}

export function createPromptPayPayload(target: string, amount: number) {
    const cleanTarget = target.replace(/\D/g, "")
    const isPhone = cleanTarget.length <= 10
    const account = isPhone
        ? `0066${cleanTarget.replace(/^0/, "")}`
        : cleanTarget
    const merchantAccount = field("00", "A000000677010111") + field(isPhone ? "01" : "02", account)

    const payload = [
        field("00", "01"),
        field("01", "12"),
        field("29", merchantAccount),
        field("58", "TH"),
        field("53", "764"),
        field("54", amount.toFixed(2)),
        "6304",
    ].join("")

    return payload + crc16(payload)
}
