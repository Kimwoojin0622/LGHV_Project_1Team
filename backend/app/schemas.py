from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import date, datetime

# ✅ CustomerSummary 관련 스키마
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
