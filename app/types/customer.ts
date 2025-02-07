export interface Customer {
  sha2_hash: string
  age_group: string
  media_type: string
  product_type: string
  contract_type: string
  signup_channel: string
  contract_end_date: string
  churn_risk: "매우 위험" | "위험" | "주의" | "보통" | "안정"
}

