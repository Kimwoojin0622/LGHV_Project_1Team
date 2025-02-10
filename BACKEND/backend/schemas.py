from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import date, datetime


# ✅ 월별 요약 응답 스키마
class ChurnRateResponse(BaseModel):
    p_mt: int  # 월
    total_customers: int  # 총 고객 수
    churn_customers: int  # 해지 고객 수
    new_customers: int  # 신규 고객 수
    category_stable: int  # 안정
    category_normal: int  # 보통
    category_caution: int  # 주의
    category_risk: int  # 위험
    category_high_risk: int  # 매우 위험

# ✅ 해지 사유 응답 스키마
class ChurnReasonsResponse(BaseModel):
    p_mt: int  # 월
    reason: str  # 해지 사유
    percentage: float  # 해당 사유의 비율

# ✅ 해지 위험 고객 응답 스키마
class HighRiskCustomersResponse(BaseModel):
    p_mt: int  # 월
    sha2_hash: str  # 고객 식별자 (SHA2 해시)
    last_access: str  # 마지막 접속
    churn_call: str  # 해지 문의 여부 (Y/N)
    churn_risk: float  # 해지 위험도 (확률)
    months_remaining: int  # 남은 계약 개월 수

class CustomerSummaryRead(BaseModel):
    sha2_hash: str
    AGE_GRP10: Optional[str]
    MEDIA_NM_GRP: Optional[str]
    PROD_NM_GRP: Optional[str]
    SCRB_PATH_NM_GRP: Optional[str]
    AGMT_END_YMD: Optional[str]
    churn_probability: Optional[float]
    customer_category: Optional[str]

    class Config:
        from_attributes = True

# ✅ TpsCancelModels 관련 스키마
class TpsCancelModelsRead(BaseModel):
    sha2_hash: str
    p_mt: int
    TOTAL_USED_DAYS: Optional[int]
    CH_LAST_DAYS_BF_GRP: Optional[str]
    VOC_TOTAL_MONTH1_YN: Optional[str]
    MONTHS_REMAINING: Optional[int]
    PROD_NM_GRP: Optional[str]
    MEDIA_NM_GRP: Optional[str]
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

# ✅ 위험군 분석 API의 응답 스키마 정의
class RiskAnalysisRead(BaseModel):
    sha2_hash: str
    p_mt: int
    feature_1: Optional[str]
    impact_value_1: Optional[float]
    churn_probability: Optional[float]
    customer_category: Optional[str]
    prediction_date: Optional[date]

    class Config:
        from_attributes = True

class MonthlySummaryRead(BaseModel):
    p_mt: int
    total_customers: int
    churn_customers: int
    new_customers: int
    category_stable: int
    category_normal: int
    category_caution: int
    category_risk: int
    category_high_risk: int
    
    class Config:
        from_attributes = True
