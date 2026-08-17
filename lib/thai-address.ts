import { getAllData } from "thai-data"

interface ThaiAddressRecord {
    province: string
    district: string
    subdistrict: string
    postalCode: string
}

const records: ThaiAddressRecord[] = getAllData().flatMap((entry) =>
    (entry.subDistrictList ?? []).flatMap((subdistrict) => {
        const district = (entry.districtList ?? []).find((item) => item.districtId === subdistrict.districtId)
        const province = (entry.provinceList ?? []).find((item) => item.provinceId === subdistrict.provinceId)
        if (!district || !province) return []
        return [{
            province: province.provinceName,
            district: district.districtName,
            subdistrict: subdistrict.subDistrictName,
            postalCode: entry.zipCode,
        }]
    })
)

function uniqueSorted(values: string[]) {
    return [...new Set(values)].sort((left, right) => left.localeCompare(right, "th"))
}

export const thaiProvinces = uniqueSorted(records.map((record) => record.province))

export function getThaiDistricts(province: string) {
    return uniqueSorted(records.filter((record) => record.province === province).map((record) => record.district))
}

export function getThaiSubdistricts(province: string, district: string) {
    return uniqueSorted(records
        .filter((record) => record.province === province && record.district === district)
        .map((record) => record.subdistrict))
}

export function getThaiPostalCodes(province: string, district: string, subdistrict: string) {
    return uniqueSorted(records
        .filter((record) => record.province === province && record.district === district && record.subdistrict === subdistrict)
        .map((record) => record.postalCode))
}
