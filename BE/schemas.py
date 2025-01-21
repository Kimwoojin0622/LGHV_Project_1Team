from pydantic import BaseModel
from typing import Optional, List

# CustomerSummary 관련 스키마
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

# TpsCancel 관련 스키마
class TpsCancelRead(BaseModel):
    p_mt: int  # 유지 월
    SVC_USE_DAYS_GRP: Optional[str]  # 서비스 사용 일수 그룹
    MEDIA_NM_GRP: Optional[str]  # 미디어 그룹
    PROD_NM_GRP: Optional[str]  # 상품 그룹
    PROD_OLD_YN: Optional[str]  # 오래된 상품 여부 (Y/N)
    PROD_ONE_PLUS_YN: Optional[str]  # 원 플러스 상품 여부 (Y/N)
    AGMT_KIND_NM: Optional[str]  # 계약 유형
    STB_RES_1M_YN: Optional[str]  # STB 결과 1개월 (Y/N)
    SVOD_SCRB_CNT_GRP: Optional[str]  # SVOD 구독 수 그룹
    PAID_CHNL_CNT_GRP: Optional[str]  # 유료 채널 수 그룹
    SCRB_PATH_NM_GRP: Optional[str]  # 가입 경로 이름 그룹
    INHOME_RATE: Optional[str]  # 내부 비율
    AGMT_END_SEG: Optional[str]  # 계약 종료 구간
    AGMT_END_YMD: Optional[str]  # 계약 종료 날짜
    TOTAL_USED_DAYS: Optional[int]  # 총 사용 일수
    BUNDLE_YN: Optional[str]  # 번들 여부 (Y/N)
    DIGITAL_GIGA_YN: Optional[str]  # 디지털 기가 사용 여부 (Y/N)
    DIGITAL_ALOG_YN: Optional[str]  # 디지털 ALOG 사용 여부 (Y/N)
    TV_I_CNT: Optional[float]  # TV 채널 수
    CH_LAST_DAYS_BF_GRP: Optional[str]  # 마지막 사용일 그룹
    VOC_TOTAL_MONTH1_YN: Optional[str]  # VOC 총 1개월 여부 (Y/N)
    VOC_STOP_CANCEL_MONTH1_YN: Optional[str]  # VOC 중단/해지 여부 (Y/N)
    AGE_GRP10: Optional[str]  # 연령대 그룹
    EMAIL_RECV_CLS_NM: Optional[str]  # 이메일 수신 클래스 이름
    SMS_SEND_CLS_NM: Optional[str]  # SMS 발송 클래스 이름
    CH_HH_AVG_MONTH1: Optional[float]  # 월별 평균 시청 시간
    CH_FAV_RNK1: Optional[str]  # 가장 선호하는 채널 순위
    KIDS_USE_PV_MONTH1: Optional[float]  # 어린이 콘텐츠 이용 PV
    NFX_USE_YN: Optional[str]  # 넷플릭스 사용 여부 (Y/N)
    YTB_USE_YN: Optional[str]  # 유튜브 사용 여부 (Y/N)
    churn: Optional[str]  # 해지 여부 (Y/N)
    CH_25_RATIO_1MONTH: Optional[float]  # 해지 가능성 점수
    KIDS_USE_YN: Optional[str]  # 어린이 콘텐츠 사용 여부 (Y/N)

    class Config:
        from_attributes = True  # SQLAlchemy 모델에서 자동 변환 허용

# tps_cancel_models 관련 스키마
class TpsCancelModelsRead(BaseModel):
    sha2_hash: str  # 고객 ID
    p_mt: int  # 유지 월
    SCRB_PATH_NM_GRP: Optional[str]  # 가입 경로 이름 그룹
    INHOME_RATE: Optional[float]  # 내부 비율
    TOTAL_USED_DAYS: Optional[int]  # 총 사용 일수
    CH_LAST_DAYS_BF_GRP: Optional[str]  # 마지막 사용일 그룹
    STB_RES_1M_YN: Optional[str]  # STB 결과 1개월 (Y/N)
    AGMT_KIND_NM: Optional[str]  # 계약 유형
    BUNDLE_YN: Optional[str]  # 번들 여부 (Y/N)
    TV_I_CNT: Optional[float]  # TV 채널 수
    AGMT_END_SEG: Optional[str]  # 계약 종료 구간
    AGE_GRP10: Optional[str]  # 연령대 그룹
    VOC_STOP_CANCEL_MONTH1_YN: Optional[str]  # VOC 중단/해지 여부 (Y/N)
    CH_HH_AVG_MONTH1: Optional[float]  # 월별 평균 시청 시간
    MONTHS_REMAINING: Optional[int]  # 남은 계약 개월 수
    PROD_NM_GRP: Optional[str]  # 상품 그룹
    MEDIA_NM_GRP: Optional[str]  # 미디어 그룹
    VOC_TOTAL_MONTH1_YN: Optional[str]  # VOC 총 1개월 여부 (Y/N)
    churn: Optional[str]  # 해지 여부 (Y/N)

    class Config:
        from_attributes = True  # SQLAlchemy 모델에서 자동 변환 허용