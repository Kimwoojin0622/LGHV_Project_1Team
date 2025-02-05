from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import date, datetime

# ✅ CustomerSummary 관련 스키마
class CustomerSummaryRead(BaseModel):
    sha2_hash: str                      # 고객 ID
    p_mt_range: Optional[str]           # 유지 월 범위
    churn: Optional[str]                # 해지 여부 (Y/N)
    AGE_GRP10: Optional[str]            # 연령대 (예: 20대, 30대)
    MEDIA_NM_GRP: Optional[str]         # 미디어 그룹 (HD, UHD 등)
    PROD_NM_GRP: Optional[str]          # 상품 그룹 (베이직, 프리미엄 등)
    AGMT_KIND_NM: Optional[str]         # 계약 종류 (신규, 재약정 등)
    SCRB_PATH_NM_GRP: Optional[str]     # 가입 경로 (O/B, I/B 등)
    AGMT_END_YMD: Optional[str]         # 계약 종료일 (YYYYMMDD 형식)
    churn_probability: Optional[float]  # 해지 확률
    customer_category: Optional[str]    # 고객 분류 (예: 위험, 안정 등)
    prediction_date: Optional[date]     # 예측 날짜

    class Config:
        from_attributes = True


# ✅ TpsCancelModels 관련 스키마
class TpsCancelModelsRead(BaseModel):
    sha2_hash: str                      # 고객 ID
    p_mt: int                           # 유지 월
    SCRB_PATH_NM_GRP: Optional[str]
    INHOME_RATE: Optional[float]
    TOTAL_USED_DAYS: Optional[int]
    CH_LAST_DAYS_BF_GRP: Optional[str]
    STB_RES_1M_YN: Optional[str]
    AGMT_KIND_NM: Optional[str]
    BUNDLE_YN: Optional[str]
    TV_I_CNT: Optional[float]
    AGMT_END_SEG: Optional[str]
    AGE_GRP10: Optional[str]
    VOC_STOP_CANCEL_MONTH1_YN: Optional[str]
    CH_HH_AVG_MONTH1: Optional[float]
    MONTHS_REMAINING: Optional[int]
    PROD_NM_GRP: Optional[str]
    MEDIA_NM_GRP: Optional[str]
    VOC_TOTAL_MONTH1_YN: Optional[str]
    churn: Optional[str]
    churn_probability: Optional[float]
    customer_category: Optional[str]

    class Config:
        from_attributes = True


# ✅ CustomerFeatureImpact 관련 스키마
class CustomerFeatureImpactRead(BaseModel):
    sha2_hash: str
    p_mt: int
    feature_1: Optional[str]
    impact_value_1: Optional[float]
    feature_2: Optional[str]
    impact_value_2: Optional[float]
    feature_3: Optional[str]
    impact_value_3: Optional[float]
    feature_4: Optional[str]
    impact_value_4: Optional[float]
    feature_5: Optional[str]
    impact_value_5: Optional[float]
    churn_probability: Optional[float]  # ✅ 해지 확률 추가
    customer_category: Optional[str]  # ✅ 이탈 위험도 추가
    prediction_date: Optional[date]

    class Config:
        from_attributes = True


# ✅ 대시보드 응답 스키마
class DashboardData(BaseModel):
    total_customers: int
    churn_customers: int
    customer_change: int
    monthly_churn_trend: Dict[str, int]
    churn_categories: Dict[str, int]
    churn_change: int
    new_customers: int

    class Config:
        # 단순 dict를 반환하므로 from_attributes 불필요
        orm_mode = True


# ✅ 고객 상세 조회 응답 스키마class CustomerDetailRead(BaseModel):
class CustomerDetailRead(BaseModel):
    sha2_hash: str
    churn_risk: str          # 고객 분류(예: 위험, 안정 등)
    age_group: Optional[str]
    product_type: Optional[str]
    media_type: Optional[str]
    signup_channel: Optional[str]
    contract_type: Optional[str]
    months_remaining: Optional[int]  # 기존 contract_end_date 대신 남은 개월 수 사용
    churn_probability: float
    customer_category: str

    class Config:
        orm_mode = True


# ✅ 예측 API 응답 스키마
class PredictResponse(BaseModel):
    message: str

    class Config:
        orm_mode = True
