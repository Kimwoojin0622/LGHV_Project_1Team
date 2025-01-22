from sqlalchemy import Column, String, Integer, Float, Text, Date, BigInteger, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import date

class TpsCancel(Base):
    __tablename__ = "tps_cancel_total"

    # Primary Key
    sha2_hash = Column(String(64), primary_key=True)  # SHA-256 고정 64자
    p_mt = Column(Integer, primary_key=True)  # 유지 월

    # 주요 컬럼
    SVC_USE_DAYS_GRP = Column(Text)  # 서비스 사용 일수 그룹
    MEDIA_NM_GRP = Column(String(50))  # 미디어 이름 그룹
    PROD_NM_GRP = Column(String(50))  # 상품 이름 그룹
    PROD_OLD_YN = Column(String(1))  # 오래된 상품 여부 (Y/N)
    PROD_ONE_PLUS_YN = Column(String(1))  # 원 플러스 상품 여부 (Y/N)
    AGMT_KIND_NM = Column(String(50))  # 계약 유형
    STB_RES_1M_YN = Column(String(1))  # STB 결과 1개월 (Y/N)
    SVOD_SCRB_CNT_GRP = Column(Text)  # SVOD 구독 수 그룹
    PAID_CHNL_CNT_GRP = Column(Text)  # 유료 채널 수 그룹
    SCRB_PATH_NM_GRP = Column(Text)  # 가입 경로 이름 그룹
    INHOME_RATE = Column(String(50))  # 내부 비율
    AGMT_END_SEG = Column(String(50))  # 계약 종료 구간
    AGMT_END_YMD = Column(Date)  # 계약 종료 날짜
    TOTAL_USED_DAYS = Column(Integer)  # 총 사용 일수
    BUNDLE_YN = Column(String(1))  # 번들 여부 (Y/N)
    DIGITAL_GIGA_YN = Column(String(1))  # 디지털 기가 사용 여부 (Y/N)
    DIGITAL_ALOG_YN = Column(String(1))  # 디지털 ALOG 사용 여부 (Y/N)
    TV_I_CNT = Column(Float)  # TV 채널 수
    CH_LAST_DAYS_BF_GRP = Column(Text)  # 마지막 사용일 그룹
    VOC_TOTAL_MONTH1_YN = Column(String(1))  # VOC 총 1개월 여부 (Y/N)
    VOC_STOP_CANCEL_MONTH1_YN = Column(String(1))  # VOC 중단/해지 여부 (Y/N)
    AGE_GRP10 = Column(String(10))  # 연령대 그룹
    EMAIL_RECV_CLS_NM = Column(String(50))  # 이메일 수신 클래스 이름
    SMS_SEND_CLS_NM = Column(String(50))  # SMS 발송 클래스 이름
    CH_HH_AVG_MONTH1 = Column(Float)  # 월별 평균 시청 시간
    CH_FAV_RNK1 = Column(String(50))  # 가장 선호하는 채널 순위
    KIDS_USE_PV_MONTH1 = Column(Float)  # 어린이 콘텐츠 이용 PV
    NFX_USE_YN = Column(String(1))  # 넷플릭스 사용 여부 (Y/N)
    YTB_USE_YN = Column(String(1))  # 유튜브 사용 여부 (Y/N)
    churn = Column(String(1))  # 해지 여부 (Y/N)
    CH_25_RATIO_1MONTH = Column(Float)  # 해지 가능성 점수
    KIDS_USE_YN = Column(String(1))  # 어린이 콘텐츠 사용 여부 (Y/N)

# 요약 데이터 테이블
class CustomerSummary(Base):
    __tablename__ = "customer_summary"

    sha2_hash = Column(String(64), primary_key=True)  # 고객 ID
    p_mt_range = Column(String(41))  # 유지 월 범위
    churn = Column(Text)  # 해지 여부
    AGE_GRP10 = Column(Text)  # 연령대
    MEDIA_NM_GRP = Column(Text)  # 미디어 그룹
    PROD_NM_GRP = Column(Text)  # 상품 그룹
    AGMT_KIND_NM = Column(Text)  # 계약 종류
    SCRB_PATH_NM_GRP = Column(Text)  # 가입 경로
    AGMT_END_YMD = Column(Text)  # 계약 종료일

class TpsCancelModels(Base):
    __tablename__ = "tps_cancel_models"

    sha2_hash = Column(Text, primary_key=True)  # 고객 ID
    p_mt = Column(BigInteger, primary_key=True)  # 유지 월
    SCRB_PATH_NM_GRP = Column(Text)  # 가입 경로 이름 그룹
    INHOME_RATE = Column(Float)  # 내부 비율
    TOTAL_USED_DAYS = Column(BigInteger)  # 총 사용 일수
    CH_LAST_DAYS_BF_GRP = Column(Text)  # 마지막 사용일 그룹
    STB_RES_1M_YN = Column(Text)  # STB 결과 1개월 (Y/N)
    AGMT_KIND_NM = Column(Text)  # 계약 유형
    BUNDLE_YN = Column(Text)  # 번들 여부 (Y/N)
    TV_I_CNT = Column(Float)  # TV 채널 수
    AGMT_END_SEG = Column(Text)  # 계약 종료 구간
    AGE_GRP10 = Column(Text)  # 연령대 그룹
    VOC_STOP_CANCEL_MONTH1_YN = Column(Text)  # VOC 중단/해지 여부 (Y/N)
    CH_HH_AVG_MONTH1 = Column(Float)  # 월별 평균 시청 시간
    MONTHS_REMAINING = Column(BigInteger)  # 남은 계약 개월 수
    PROD_NM_GRP = Column(Text)  # 상품 그룹
    MEDIA_NM_GRP = Column(Text)  # 미디어 그룹
    VOC_TOTAL_MONTH1_YN = Column(Text)  # VOC 총 1개월 여부 (Y/N)
    churn = Column(Text)  # 해지 여부 (Y/N)

class CustomerChurnPrediction(Base):
    __tablename__ = "customer_churn_prediction"

    sha2_hash = Column(String(64), ForeignKey("tps_cancel_models.sha2_hash"), primary_key=True)  # 고객 ID
    p_mt = Column(Integer, primary_key=True)  # 유지 월
    churn_probability = Column(Float)  # 예측된 해지 확률
    prediction = Column(Integer)  # 해지 여부 (0: 미해지, 1: 해지)
    customer_category = Column(String(20))  # 해지 위험도 분류 ('매우 위험', '위험' 등)
    prediction_date = Column(Date, default=date.today())  # 예측 수행 날짜

    customer = relationship("TpsCancelModels", backref="churn_predictions")  # 관계 설정   