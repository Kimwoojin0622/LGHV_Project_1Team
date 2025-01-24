from pydantic import BaseModel
from typing import Optional, List
from datetime import date

# ✅ CustomerSummary 관련 스키마
class CustomerSummaryRead(BaseModel):
    sha2_hash: str  # 고객 ID
    p_mt_range: Optional[str]  # 유지 월 범위
    churn: Optional[str]  # 해지 여부 (Y/N)
    AGE_GRP10: Optional[str]  # 연령대 (예: 20대, 30대)
    MEDIA_NM_GRP: Optional[str]  # 미디어 그룹 (HD, UHD 등)
    PROD_NM_GRP: Optional[str]  # 상품 그룹 (베이직, 프리미엄 등)
    AGMT_KIND_NM: Optional[str]  # 계약 종류 (신규, 재약정 등)
    SCRB_PATH_NM_GRP: Optional[str]  # 가입 경로 (O/B, I/B 등)
    AGMT_END_YMD: Optional[str]  # 계약 종료일 (YYYYMMDD 형식)

    class Config:
        from_attributes = True  # SQLAlchemy 모델에서 자동 변환 허용

# ✅ CustomerChurnPrediction 관련 스키마
class CustomerChurnPredictionRead(BaseModel):
    sha2_hash: str  # 고객 ID
    p_mt: int  # 유지 월
    churn_probability: float  # 해지 확률
    customer_category: str  # 고객 분류 (위험, 주의, 안정 등)
    prediction_date: date  # 예측 날짜

    class Config:
        from_attributes = True  # SQLAlchemy 모델에서 자동 변환 허용

# ✅ TpsCancel 관련 스키마
class TpsCancelRead(BaseModel):
    p_mt: int  # 유지 월
    SVC_USE_DAYS_GRP: Optional[str]
    MEDIA_NM_GRP: Optional[str]
    PROD_NM_GRP: Optional[str]
    PROD_OLD_YN: Optional[str]
    PROD_ONE_PLUS_YN: Optional[str]
    AGMT_KIND_NM: Optional[str]
    STB_RES_1M_YN: Optional[str]
    SVOD_SCRB_CNT_GRP: Optional[str]
    PAID_CHNL_CNT_GRP: Optional[str]
    SCRB_PATH_NM_GRP: Optional[str]
    INHOME_RATE: Optional[str]
    AGMT_END_SEG: Optional[str]
    AGMT_END_YMD: Optional[str]
    TOTAL_USED_DAYS: Optional[int]
    BUNDLE_YN: Optional[str]
    DIGITAL_GIGA_YN: Optional[str]
    DIGITAL_ALOG_YN: Optional[str]
    TV_I_CNT: Optional[float]
    CH_LAST_DAYS_BF_GRP: Optional[str]
    VOC_TOTAL_MONTH1_YN: Optional[str]
    VOC_STOP_CANCEL_MONTH1_YN: Optional[str]
    AGE_GRP10: Optional[str]
    EMAIL_RECV_CLS_NM: Optional[str]
    SMS_SEND_CLS_NM: Optional[str]
    CH_HH_AVG_MONTH1: Optional[float]
    CH_FAV_RNK1: Optional[str]
    KIDS_USE_PV_MONTH1: Optional[float]
    NFX_USE_YN: Optional[str]
    YTB_USE_YN: Optional[str]
    churn: Optional[str]
    CH_25_RATIO_1MONTH: Optional[float]
    KIDS_USE_YN: Optional[str]

    class Config:
        from_attributes = True

# ✅ tps_cancel_models 관련 스키마
class TpsCancelModelsRead(BaseModel):
    sha2_hash: str  # 고객 ID
    p_mt: int  # 유지 월
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

    class Config:
        from_attributes = True

# ✅ SHAP Feature Impact 관련 스키마
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
    prediction_date: date

    class Config:
        from_attributes = True
