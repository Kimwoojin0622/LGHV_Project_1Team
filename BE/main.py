from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
from models import CustomerSummary, TpsCancel
from schemas import CustomerSummaryRead, TpsCancelRead
from typing import List, Optional
from fastapi.responses import JSONResponse

# ✅ 예측 API는 별도 라우터에서 관리 (고객 조회창과 분리)
from prediction import router as prediction_router

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-total-count"],
)

# 📌 1. 대시보드 API (/dashboard)
@app.get("/dashboard")
def get_dashboard_data(db: Session = Depends(get_db)):
    """
    CRM 대시보드 데이터를 제공하는 API
    """
    # 🔹 총 고객 수
    total_customers = db.query(CustomerSummary).count()

    # 🔹 해지 고객 수
    churn_customers = db.query(CustomerSummary).filter(CustomerSummary.churn == "Y").count()

    # 🔹 신규 고객 수 (계약 종료일 기준 최신 데이터 필터링)
    latest_month = db.query(CustomerSummary.AGMT_END_YMD).order_by(CustomerSummary.AGMT_END_YMD.desc()).first()
    new_customers = db.query(CustomerSummary).filter(CustomerSummary.AGMT_END_YMD == latest_month).count()

    # 🔹 월별 해지율 추이
    monthly_churn_data = (
        db.query(
            TpsCancel.p_mt,
            db.func.count(TpsCancel.sha2_hash).label("churn_count")
        )
        .filter(TpsCancel.churn == "Y")
        .group_by(TpsCancel.p_mt)
        .order_by(TpsCancel.p_mt)
        .all()
    )
    monthly_churn = {str(row.p_mt): row.churn_count for row in monthly_churn_data}

    # 🔹 해지 고객 분류
    churn_categories = {
        "매우 위험": db.query(TpsCancel).filter(TpsCancel.CH_25_RATIO_1MONTH >= 0.8).count(),
        "위험": db.query(TpsCancel).filter(TpsCancel.CH_25_RATIO_1MONTH.between(0.6, 0.79)).count(),
        "주의": db.query(TpsCancel).filter(TpsCancel.CH_25_RATIO_1MONTH.between(0.4, 0.59)).count(),
        "양호": db.query(TpsCancel).filter(TpsCancel.CH_25_RATIO_1MONTH.between(0.2, 0.39)).count(),
        "안정": db.query(TpsCancel).filter(TpsCancel.CH_25_RATIO_1MONTH < 0.2).count()
    }

    return {
        "total_customers": total_customers,
        "churn_customers": churn_customers,
        "new_customers": new_customers,
        "monthly_churn": monthly_churn,
        "churn_categories": churn_categories
    }


# 📌 2. 고객 조회창 (/customers-summary)
@app.get("/customers-summary", response_model=List[CustomerSummaryRead])
def get_customers_summary(
    offset: int = 0,
    limit: int = 20,
    search: Optional[str] = Query(None),
    p_mt_range: Optional[str] = Query(None),
    churn: Optional[str] = Query(None),
    age_group: Optional[str] = Query(None),
    media_group: Optional[str] = Query(None),
    product_group: Optional[str] = Query(None),
    agreement_type: Optional[str] = Query(None),
    registration_path: Optional[str] = Query(None),
    contract_end: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    고객 요약 목록 반환 (현재 기준 데이터, 고객 ID 포함)
    """
    query = db.query(CustomerSummary)

    # 필터링 적용
    if search:
        query = query.filter(CustomerSummary.sha2_hash.contains(search))
    if p_mt_range:
        query = query.filter(CustomerSummary.p_mt_range == p_mt_range)
    if churn:
        query = query.filter(CustomerSummary.churn == churn)
    if age_group:
        query = query.filter(CustomerSummary.AGE_GRP10 == age_group)
    if media_group:
        query = query.filter(CustomerSummary.MEDIA_NM_GRP == media_group)
    if product_group:
        query = query.filter(CustomerSummary.PROD_NM_GRP == product_group)
    if agreement_type:
        query = query.filter(CustomerSummary.AGMT_KIND_NM == agreement_type)
    if registration_path:
        query = query.filter(CustomerSummary.SCRB_PATH_NM_GRP == registration_path)
    if contract_end:
        query = query.filter(CustomerSummary.AGMT_END_YMD == contract_end)

    total_count = db.query(CustomerSummary).count()
    results = query.offset(offset).limit(limit).all()

    response = JSONResponse(content=[{
        "sha2_hash": row.sha2_hash,  
        "p_mt_range": row.p_mt_range,
        "churn": row.churn,
        "AGE_GRP10": row.AGE_GRP10,
        "MEDIA_NM_GRP": row.MEDIA_NM_GRP,
        "PROD_NM_GRP": row.PROD_NM_GRP,
        "AGMT_KIND_NM": row.AGMT_KIND_NM,
        "SCRB_PATH_NM_GRP": row.SCRB_PATH_NM_GRP,
        "AGMT_END_YMD": row.AGMT_END_YMD
    } for row in results])
    response.headers["x-total-count"] = str(total_count)
    return response

# 📌 3. 고객 세부창 (/customer-details/{customer_id})
@app.get("/customer-details/{customer_id}", response_model=List[TpsCancelRead])
def get_customer_details(customer_id: str, db: Session = Depends(get_db)):
    """
    특정 고객의 과거 기록을 p_mt 기준으로 정렬하여 반환 (고객 ID 제외)
    """
    tps_cancel_data = (
        db.query(TpsCancel)
        .filter(TpsCancel.sha2_hash == customer_id)
        .order_by(TpsCancel.p_mt.asc())  # 🔥 p_mt 기준 정렬
        .all()
    )

    if not tps_cancel_data:
        raise HTTPException(status_code=404, detail="Customer data not found")

    # 🔹 고객 ID(sha2_hash) 제거하고 반환
    cancel_details = [{
        "p_mt": row.p_mt,
        "SVC_USE_DAYS_GRP": row.SVC_USE_DAYS_GRP,
        "MEDIA_NM_GRP": row.MEDIA_NM_GRP,
        "PROD_NM_GRP": row.PROD_NM_GRP,
        "PROD_OLD_YN": row.PROD_OLD_YN,
        "PROD_ONE_PLUS_YN": row.PROD_ONE_PLUS_YN,
        "AGMT_KIND_NM": row.AGMT_KIND_NM,
        "STB_RES_1M_YN": row.STB_RES_1M_YN,
        "SVOD_SCRB_CNT_GRP": row.SVOD_SCRB_CNT_GRP,
        "PAID_CHNL_CNT_GRP": row.PAID_CHNL_CNT_GRP,
        "SCRB_PATH_NM_GRP": row.SCRB_PATH_NM_GRP,
        "INHOME_RATE": row.INHOME_RATE,
        "AGMT_END_SEG": row.AGMT_END_SEG,
        "AGMT_END_YMD": row.AGMT_END_YMD,
        "TOTAL_USED_DAYS": row.TOTAL_USED_DAYS,
        "BUNDLE_YN": row.BUNDLE_YN,
        "DIGITAL_GIGA_YN": row.DIGITAL_GIGA_YN,
        "DIGITAL_ALOG_YN": row.DIGITAL_ALOG_YN,
        "TV_I_CNT": row.TV_I_CNT,
        "CH_LAST_DAYS_BF_GRP": row.CH_LAST_DAYS_BF_GRP,
        "VOC_TOTAL_MONTH1_YN": row.VOC_TOTAL_MONTH1_YN,
        "VOC_STOP_CANCEL_MONTH1_YN": row.VOC_STOP_CANCEL_MONTH1_YN,
        "AGE_GRP10": row.AGE_GRP10,
        "EMAIL_RECV_CLS_NM": row.EMAIL_RECV_CLS_NM,
        "SMS_SEND_CLS_NM": row.SMS_SEND_CLS_NM,
        "CH_HH_AVG_MONTH1": row.CH_HH_AVG_MONTH1,
        "CH_FAV_RNK1": row.CH_FAV_RNK1,
        "KIDS_USE_PV_MONTH1": row.KIDS_USE_PV_MONTH1,
        "NFX_USE_YN": row.NFX_USE_YN,
        "YTB_USE_YN": row.YTB_USE_YN,
        "churn": row.churn,
        "CH_25_RATIO_1MONTH": row.CH_25_RATIO_1MONTH,
        "KIDS_USE_YN": row.KIDS_USE_YN
    } for row in tps_cancel_data]

    return cancel_details


# 📌 4. 마케팅 추천 시스템 (/marketing-recommendations/{customer_id})
@app.get("/marketing-recommendations/{customer_id}")
def get_marketing_recommendations(customer_id: str, db: Session = Depends(get_db)):
    """
    특정 고객에게 맞춤형 마케팅 대안을 추천하는 API
    """
    customer = db.query(TpsCancel).filter(TpsCancel.sha2_hash == customer_id).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    recommendations = []
    probability = customer.CH_25_RATIO_1MONTH

    if probability >= 0.8:
        recommendations.append({"type": "요금 할인", "description": "재약정 할인 제공"})
    if probability >= 0.6:
        recommendations.append({"type": "혜택 제공", "description": "상품권 및 포인트 제공"})
    if probability >= 0.6:
        recommendations.append({"type": "맞춤형 상담", "description": "VIP 상담 서비스 제공"})

    return {
        "customer_id": customer_id,
        "probability_1": probability,
        "recommendations": recommendations
    }
