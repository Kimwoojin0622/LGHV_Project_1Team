from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, Date, BigInteger, Index
from sqlalchemy.orm import relationship
from database import Base
from datetime import date


class MonthlySummary(Base):
    __tablename__ = "monthly_summary"

    p_mt = Column(Integer, primary_key=True)
    total_customers = Column(Integer, nullable=False)
    churn_customers = Column(Integer, nullable=False)
    new_customers = Column(Integer, nullable=False)
    category_stable = Column(Integer, nullable=False)
    category_normal = Column(Integer, nullable=False)
    category_caution = Column(Integer, nullable=False)
    category_risk = Column(Integer, nullable=False)
    category_high_risk = Column(Integer, nullable=False)

class ChurnReasons(Base):
    __tablename__ = "churn_reasons"

    id = Column(Integer, primary_key=True, autoincrement=True)
    p_mt = Column(Integer, ForeignKey("monthly_summary.p_mt"), nullable=False)
    reason = Column(String(255), nullable=False)
    percentage = Column(Float, nullable=False)

class HighRiskCustomers(Base):
    __tablename__ = "high_risk_customers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    p_mt = Column(Integer, ForeignKey("monthly_summary.p_mt"), nullable=False)
    sha2_hash = Column(String(64), nullable=False)
    last_access = Column(String(255), nullable=False)
    churn_call = Column(String(10), nullable=False)
    churn_risk = Column(Float, nullable=False)
    months_remaining = Column(Integer, nullable=False)

class CustomerSummary(Base):
    __tablename__ = "customer_summary"

    sha2_hash = Column(String(64), primary_key=True, index=True)  # 고객 ID (PK & Index 추가)
    p_mt_range = Column(String(41))
    churn = Column(String(1), index=True)  # ✅ 해지 여부 인덱스 추가
    AGE_GRP10 = Column(Text, index=True)  # ✅ 연령대 인덱스 추가
    MEDIA_NM_GRP = Column(Text)
    PROD_NM_GRP = Column(Text)
    AGMT_KIND_NM = Column(Text)
    SCRB_PATH_NM_GRP = Column(Text)
    AGMT_END_YMD = Column(Text, index=True)  # ✅ 계약 종료일 인덱스 추가
    churn_probability = Column(Float, index=True)  # ✅ 해지 확률 인덱스 추가
    customer_category = Column(String(20), index=True)  # ✅ 고객 분류 인덱스 추가
    prediction_date = Column(Date)

    # ✅ 복합 인덱스 추가 (해지 여부 + 고객 분류)
    __table_args__ = (
        Index("idx_churn_customer_category", "churn", "customer_category"),
    )


class TpsCancelModels(Base):
    __tablename__ = "tps_cancel_models"

    sha2_hash = Column(String(64), primary_key=True, index=True)  # 고객 ID (PK & Index 추가)
    p_mt = Column(BigInteger, primary_key=True)
    SCRB_PATH_NM_GRP = Column(Text)
    INHOME_RATE = Column(Float)
    TOTAL_USED_DAYS = Column(BigInteger)
    CH_LAST_DAYS_BF_GRP = Column(Text)
    STB_RES_1M_YN = Column(Text)
    AGMT_KIND_NM = Column(Text)
    BUNDLE_YN = Column(Text)
    TV_I_CNT = Column(Float)
    AGMT_END_SEG = Column(Text)
    AGE_GRP10 = Column(Text, index=True)  # ✅ 연령대 인덱스 추가
    VOC_STOP_CANCEL_MONTH1_YN = Column(Text)
    CH_HH_AVG_MONTH1 = Column(Float)
    MONTHS_REMAINING = Column(BigInteger, index=True)  # ✅ 남은 개월 수 인덱스 추가
    PROD_NM_GRP = Column(Text, index=True)  # ✅ 상품 그룹 인덱스 추가
    MEDIA_NM_GRP = Column(Text)
    VOC_TOTAL_MONTH1_YN = Column(Text)
    churn = Column(Text, index=True)  # ✅ 해지 여부 인덱스 추가
    churn_probability = Column(Float, nullable=True, index=True)  # ✅ 해지 확률 인덱스 추가
    customer_category = Column(String(20), nullable=True, index=True)  # ✅ 고객 분류 인덱스 추가

    # ✅ 복합 인덱스 추가 (고객 ID + 유지 월)
    __table_args__ = (
        Index("idx_sha2_hash_p_mt", "sha2_hash", "p_mt"),
    )


class CustomerFeatureImpact(Base):
    __tablename__ = "customer_feature_impact"

    sha2_hash = Column(String(64), ForeignKey("tps_cancel_models.sha2_hash"), primary_key=True, index=True)
    p_mt = Column(Integer, primary_key=True, index=True)

    feature_1 = Column(String(100))
    impact_value_1 = Column(Float)

    feature_2 = Column(String(100))
    impact_value_2 = Column(Float)

    feature_3 = Column(String(100))
    impact_value_3 = Column(Float)

    feature_4 = Column(String(100))
    impact_value_4 = Column(Float)

    feature_5 = Column(String(100))
    impact_value_5 = Column(Float)

    churn_probability = Column(Float, nullable=True, index=True)  # ✅ 해지 확률 인덱스 추가
    customer_category = Column(String(20), nullable=True, index=True)  # ✅ 고객 분류 인덱스 추가

    prediction_date = Column(Date, default=date.today(), index=True)  # ✅ 예측 날짜 인덱스 추가

    customer = relationship("TpsCancelModels", backref="feature_impacts")

    # ✅ 복합 인덱스 추가 (고객 ID + 유지 월 + 예측 날짜)
    __table_args__ = (
        Index("idx_sha2_hash_p_mt_pred_date", "sha2_hash", "p_mt", "prediction_date"),
    )


class MonthlyChurnFactors(Base):
    __tablename__ = "monthly_churn_factors"

    p_mt = Column(Integer, primary_key=True, index=True)  # 유지 월 (PK)
    feature_1 = Column(String(100), nullable=False)  # 1위 해지 요인
    impact_score_1 = Column(Float, nullable=False)

    feature_2 = Column(String(100), nullable=False)  # 2위 해지 요인
    impact_score_2 = Column(Float, nullable=False)

    feature_3 = Column(String(100), nullable=False)  # 3위 해지 요인
    impact_score_3 = Column(Float, nullable=False)

    feature_4 = Column(String(100), nullable=False)  # 4위 해지 요인
    impact_score_4 = Column(Float, nullable=False)

    feature_5 = Column(String(100), nullable=False)  # 5위 해지 요인
    impact_score_5 = Column(Float, nullable=False)

