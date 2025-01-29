from sqlalchemy import Column, String, Integer, Float, Text, Date, BigInteger, ForeignKey, Index
from sqlalchemy.orm import relationship
from database import Base
from datetime import date

class TpsCancel(Base):
    __tablename__ = "tps_cancel_total"

    sha2_hash = Column(String(64), primary_key=True)  # SHA-256 고정 64자
    p_mt = Column(Integer, primary_key=True)  # 유지 월

    SVC_USE_DAYS_GRP = Column(Text)
    MEDIA_NM_GRP = Column(String(50))
    PROD_NM_GRP = Column(String(50))
    PROD_OLD_YN = Column(String(1))
    PROD_ONE_PLUS_YN = Column(String(1))
    AGMT_KIND_NM = Column(String(50))
    STB_RES_1M_YN = Column(String(1))
    SVOD_SCRB_CNT_GRP = Column(Text)
    PAID_CHNL_CNT_GRP = Column(Text)
    SCRB_PATH_NM_GRP = Column(Text)
    INHOME_RATE = Column(String(50))
    AGMT_END_SEG = Column(String(50))
    AGMT_END_YMD = Column(Date)
    TOTAL_USED_DAYS = Column(Integer)
    BUNDLE_YN = Column(String(1))
    DIGITAL_GIGA_YN = Column(String(1))
    DIGITAL_ALOG_YN = Column(String(1))
    TV_I_CNT = Column(Float)
    CH_LAST_DAYS_BF_GRP = Column(Text)
    VOC_TOTAL_MONTH1_YN = Column(String(1))
    VOC_STOP_CANCEL_MONTH1_YN = Column(String(1))
    AGE_GRP10 = Column(String(10))
    EMAIL_RECV_CLS_NM = Column(String(50))
    SMS_SEND_CLS_NM = Column(String(50))
    CH_HH_AVG_MONTH1 = Column(Float)
    CH_FAV_RNK1 = Column(String(50))
    KIDS_USE_PV_MONTH1 = Column(Float)
    NFX_USE_YN = Column(String(1))
    YTB_USE_YN = Column(String(1))
    churn = Column(String(1))
    CH_25_RATIO_1MONTH = Column(Float)
    KIDS_USE_YN = Column(String(1))

class CustomerSummary(Base):
    __tablename__ = "customer_summary"

    sha2_hash = Column(String(64), primary_key=True)
    p_mt_range = Column(String(41))
    churn = Column(String(1))
    AGE_GRP10 = Column(Text)
    MEDIA_NM_GRP = Column(Text)
    PROD_NM_GRP = Column(Text)
    AGMT_KIND_NM = Column(Text)
    SCRB_PATH_NM_GRP = Column(Text)
    AGMT_END_YMD = Column(Text)
    churn_probability = Column(Float)
    customer_category = Column(String(20))
    prediction_date = Column(Date)

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
    AGE_GRP10 = Column(Text)
    VOC_STOP_CANCEL_MONTH1_YN = Column(Text)
    CH_HH_AVG_MONTH1 = Column(Float)
    MONTHS_REMAINING = Column(BigInteger)
    PROD_NM_GRP = Column(Text)
    MEDIA_NM_GRP = Column(Text)
    VOC_TOTAL_MONTH1_YN = Column(Text)
    churn = Column(Text)

class CustomerChurnPrediction(Base):
    __tablename__ = "customer_churn_prediction"

    sha2_hash = Column(String(64), ForeignKey("tps_cancel_models.sha2_hash"), primary_key=True)
    p_mt = Column(Integer, primary_key=True)
    churn_probability = Column(Float)
    customer_category = Column(String(20))
    prediction_date = Column(Date, default=date.today())

    customer = relationship("TpsCancelModels", backref="churn_predictions")

# ✅ 📌 SHAP Feature Impact 저장 모델 추가
class CustomerFeatureImpact(Base):
    __tablename__ = "customer_feature_impact"

    sha2_hash = Column(String(64), ForeignKey("tps_cancel_models.sha2_hash"), primary_key=True)
    p_mt = Column(Integer, primary_key=True)
    
    feature_1 = Column(String(50))
    impact_value_1 = Column(Float)
    
    feature_2 = Column(String(50))
    impact_value_2 = Column(Float)
    
    feature_3 = Column(String(50))
    impact_value_3 = Column(Float)
    
    feature_4 = Column(String(50))
    impact_value_4 = Column(Float)
    
    feature_5 = Column(String(50))
    impact_value_5 = Column(Float)
    
    prediction_date = Column(Date, default=date.today())

    customer = relationship("TpsCancelModels", backref="feature_impacts")
