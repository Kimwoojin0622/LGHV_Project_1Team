// Type definitions
type AccessStatus = "일주일내" | "3개월내없음" | "3주일전" | "2주일전" | "1주일전"
type ChurnCall = "Y" | "N"

interface Customer {
  id: number
  sha2_hash: string
  last_access: AccessStatus
  churn_call: ChurnCall
  churn_risk: number
  contract_expiration: Date // Add this line
}

interface MonthData {
  total: number
  churn: number
  new: number
  churn_rate: number
  high_risk_customers: Customer[]
  churn_reasons: { [key: string]: number }
}

// Helper functions
function generateSHA2Hash() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function generateCustomers(count: number, baseDate: Date): Customer[] {
  const accessStatuses: AccessStatus[] = ["일주일내", "3개월내없음", "3주일전", "2주일전", "1주일전"]

  return Array.from({ length: count }, (_, i) => {
    const contractExpiration = new Date(baseDate.getTime() + (Math.random() * 12 - 6) * 30 * 24 * 60 * 60 * 1000)
    return {
      id: i + 1,
      sha2_hash: generateSHA2Hash(),
      last_access: accessStatuses[Math.floor(Math.random() * accessStatuses.length)],
      churn_call: Math.random() > 0.5 ? "Y" : "N",
      churn_risk: 50 + Math.floor(Math.random() * 40),
      contract_expiration: contractExpiration,
    }
  })
}

// Monthly data object
export const monthlyData: Record<string, MonthData> = {
  "1월": {
    total: 2194800,
    churn: 21948,
    new: 37200,
    churn_rate: 1.0,
    high_risk_customers: generateCustomers(5, new Date(2023, 0, 31)),
    churn_reasons: { "서비스 불만족": 40, "경쟁사 전환": 25, 가격: 20, 이사: 10, 기타: 5 },
  },
  "2월": {
    total: 2210052,
    churn: 28731,
    new: 38400,
    churn_rate: 1.3,
    high_risk_customers: generateCustomers(5, new Date(2023, 1, 28)),
    churn_reasons: { "서비스 불만족": 38, "경쟁사 전환": 27, 가격: 22, 이사: 8, 기타: 5 },
  },
  "3월": {
    total: 2219721,
    churn: 35516,
    new: 39000,
    churn_rate: 1.6,
    high_risk_customers: generateCustomers(5, new Date(2023, 2, 31)),
    churn_reasons: { "서비스 불만족": 42, "경쟁사 전환": 23, 가격: 21, 이사: 9, 기타: 5 },
  },
  "4월": {
    total: 2223205,
    churn: 37795,
    new: 39500,
    churn_rate: 1.7,
    high_risk_customers: generateCustomers(5, new Date(2023, 3, 30)),
    churn_reasons: { "서비스 불만족": 41, "경쟁사 전환": 24, 가격: 20, 이사: 10, 기타: 5 },
  },
  "5월": {
    total: 2224910,
    churn: 40048,
    new: 40000,
    churn_rate: 1.8,
    high_risk_customers: generateCustomers(5, new Date(2023, 4, 31)),
    churn_reasons: { "서비스 불만족": 39, "경쟁사 전환": 26, 가격: 21, 이사: 9, 기타: 5 },
  },
  "6월": {
    total: 2224862,
    churn: 42272,
    new: 38500,
    churn_rate: 1.9,
    high_risk_customers: generateCustomers(5, new Date(2023, 5, 30)),
    churn_reasons: { "서비스 불만족": 38, "경쟁사 전환": 27, 가격: 22, 이사: 8, 기타: 5 },
  },
  "7월": {
    total: 2221090,
    churn: 44462,
    new: 37000,
    churn_rate: 2.0,
    high_risk_customers: generateCustomers(5, new Date(2023, 6, 31)),
    churn_reasons: { "서비스 불만족": 37, "경쟁사 전환": 28, 가격: 21, 이사: 9, 기타: 5 },
  },
  "8월": {
    total: 2213628,
    churn: 43393,
    new: 36500,
    churn_rate: 1.96,
    high_risk_customers: generateCustomers(5, new Date(2023, 7, 31)),
    churn_reasons: { "서비스 불만족": 36, "경쟁사 전환": 29, 가격: 20, 이사: 10, 기타: 5 },
  },
  "9월": {
    total: 2206735,
    churn: 42335,
    new: 37000,
    churn_rate: 1.92,
    high_risk_customers: generateCustomers(5, new Date(2023, 8, 30)),
    churn_reasons: { "서비스 불만족": 35, "경쟁사 전환": 30, 가격: 20, 이사: 10, 기타: 5 },
  },
  "10월": {
    total: 2201400,
    churn: 41288,
    new: 38500,
    churn_rate: 1.88,
    high_risk_customers: generateCustomers(5, new Date(2023, 9, 31)),
    churn_reasons: { "서비스 불만족": 36, "경쟁사 전환": 29, 가격: 21, 이사: 9, 기타: 5 },
  },
  "11월": {
    total: 2198612,
    churn: 40252,
    new: 39000,
    churn_rate: 1.83,
    high_risk_customers: generateCustomers(5, new Date(2023, 10, 30)),
    churn_reasons: { "서비스 불만족": 37, "경쟁사 전환": 28, 가격: 22, 이사: 8, 기타: 5 },
  },
  "12월": {
    total: 2197360,
    churn: 39227,
    new: 39500,
    churn_rate: 1.78,
    high_risk_customers: generateCustomers(5, new Date(2023, 11, 31)),
    churn_reasons: { "서비스 불만족": 35, "경쟁사 전환": 30, 가격: 20, 이사: 10, 기타: 5 },
  },
}

// Export type
export type MonthlyData = typeof monthlyData

