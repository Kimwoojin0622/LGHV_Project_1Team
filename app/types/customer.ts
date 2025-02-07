export interface Customer {
  sha2_hash: string;
  AGE_GRP10: string;
  MEDIA_NM_GRP: string;
  PROD_NM_GRP: string;
  SCRB_PATH_NM_GRP: string;
  AGMT_END_YMD: string;
  churn_probability: number;
  customer_category: "매우 위험" | "위험" | "주의" | "양호" | "안정";
}

// ✅ 고객의 과거 유지 정보 (detailed-history API에서 사용)
export interface CustomerHistory {
  sha2_hash: string;
  p_mt: number;
  TOTAL_USED_DAYS: number;
  CH_LAST_DAYS_BF_GRP: string;
  VOC_TOTAL_MONTH1_YN: string;
  MONTHS_REMAINING: number;
  PROD_NM_GRP: string;
  MEDIA_NM_GRP: string;
  churn_probability: number;
  customer_category: string;
}

// ✅ 중요 피처 영향도 (feature-importance API에서 사용)
export interface FeatureImportanceData {
  churn_probability: number;
  [key: string]: any;
}

// ✅ 고객 상세 모달 관련 props
export interface CustomerDetailModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

// ✅ 이탈 위험도 관련 props
export interface RiskCustomer {
  sha2_hash: string;
  p_mt: number;
  feature_1?: string;
  impact_value_1?: number;
  churn_probability?: number;
  customer_category: "매우 위험" | "위험" | "주의" | "양호" | "안정";
  prediction_date?: string;
}
