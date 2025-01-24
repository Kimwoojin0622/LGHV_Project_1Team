from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
from models import CustomerSummary, TpsCancel, CustomerChurnPrediction, TpsCancelModels, CustomerFeatureImpact
from schemas import CustomerSummaryRead, TpsCancelRead, CustomerChurnPredictionRead, CustomerFeatureImpactRead, TpsCancelModelsRead
from typing import List, Optional
from fastapi.responses import JSONResponse
from sqlalchemy import func

# ✅ 예측 API는 별도 라우터에서 관리 (고객 조회창과 분리)
from prediction import router as prediction_router
from prediction_SHAP import router as shap_router  # 📌 SHAP 라우터 추가

app = FastAPI()

# 📌 예측 API 포함
app.include_router(prediction_router, prefix="/predict", tags=["Churn Prediction"])
app.include_router(shap_router, prefix="/shap", tags=["SHAP Analysis"])  # 📌 SHAP API 포함

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
    📌 CRM 대시보드 데이터를 제공하는 API
    """

    # 🔹 1️⃣ 총 고객 수, 해지 고객 수, 신규 고객 수 가져오기
    results = (
        db.query(
            func.count(CustomerSummary.sha2_hash).label("total_customers"),
            func.count(func.nullif(CustomerSummary.churn, "N")).label("churn_customers"),
            func.max(CustomerSummary.AGMT_END_YMD).label("latest_month")
        ).first()
    )

    total_customers = results.total_customers
    churn_customers = results.churn_customers
    latest_month = results.latest_month

    # 🔹 2️⃣ 신규 고객 수
    new_customers = (
        db.query(func.count(CustomerSummary.sha2_hash))
        .filter(CustomerSummary.AGMT_END_YMD == latest_month)
        .scalar()
    )

    # 🔹 3️⃣ 전월 대비 고객 증감 계산
    previous_month = db.query(func.max(CustomerSummary.AGMT_END_YMD)).filter(CustomerSummary.AGMT_END_YMD < latest_month).scalar()
    prev_total_customers = (
        db.query(func.count(CustomerSummary.sha2_hash))
        .filter(CustomerSummary.AGMT_END_YMD == previous_month)
        .scalar()
    )

    customer_change = total_customers - prev_total_customers if prev_total_customers else total_customers

    # 🔹 4️⃣ 월별 해지율 추이 (배치 로드 후 dict 변환)
    monthly_churn_data = (
        db.query(TpsCancel.p_mt, func.count(TpsCancel.sha2_hash).label("churn_count"))
        .filter(TpsCancel.churn == "Y")
        .group_by(TpsCancel.p_mt)
        .order_by(TpsCancel.p_mt)
        .all()
    )
    monthly_churn_trend = {str(row.p_mt): row.churn_count for row in monthly_churn_data}

    # 🔹 5️⃣ 해지 고객 분류 (해지율 기준)
    churn_category_counts = (
        db.query(TpsCancel.CH_25_RATIO_1MONTH)
        .filter(TpsCancel.CH_25_RATIO_1MONTH.isnot(None))  # None 값 제외
        .all()
    )

    churn_categories = {
        "매우 위험": sum(1 for row in churn_category_counts if row.CH_25_RATIO_1MONTH >= 0.8),
        "위험": sum(1 for row in churn_category_counts if 0.6 <= row.CH_25_RATIO_1MONTH < 0.8),
        "주의": sum(1 for row in churn_category_counts if 0.4 <= row.CH_25_RATIO_1MONTH < 0.6),
        "양호": sum(1 for row in churn_category_counts if 0.2 <= row.CH_25_RATIO_1MONTH < 0.4),
        "안정": sum(1 for row in churn_category_counts if row.CH_25_RATIO_1MONTH < 0.2),
    }

    # 🔹 6️⃣ 해지 고객 수 변화 (전월 대비 해지 고객 변화량 계산)
    prev_churn_customers = (
        db.query(func.count(TpsCancel.sha2_hash))
        .filter(TpsCancel.p_mt == previous_month, TpsCancel.churn == "Y")
        .scalar()
    )

    churn_change = churn_customers - prev_churn_customers if prev_churn_customers else churn_customers

    return {
        "total_customers": total_customers,         # 📌 총 고객 수
        "churn_customers": churn_customers,         # 📌 해지 고객 수
        "customer_change": customer_change,         # 📌 전월 대비 증감
        "monthly_churn_trend": monthly_churn_trend, # 📌 월별 해지율 추이
        "churn_categories": churn_categories,       # 📌 해지 고객 분류
        "churn_change": churn_change,               # 📌 해지 고객 수 변화
        "new_customers": new_customers              # 📌 신규 고객 수
    }


# 📌 2. 고객 조회창 (/customers-summary)
@app.get("/customers-summary", response_model=List[dict])
def get_customers_summary(
    offset: int = 0,
    limit: int = 20,
    search: Optional[str] = Query(None),
    p_mt_range: Optional[str] = Query(None),
    churn: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    고객 요약 목록 반환 (고객 ID 포함) + 최신 해지율 데이터 추가
    """
    query = db.query(CustomerSummary)

    # 🔹 필터링 적용
    if search:
        query = query.filter(CustomerSummary.sha2_hash.contains(search))
    if p_mt_range:
        query = query.filter(CustomerSummary.p_mt_range == p_mt_range)
    if churn:
        query = query.filter(CustomerSummary.churn == churn)

    total_count = db.query(CustomerSummary).count()
    results = query.offset(offset).limit(limit).all()

    # 🔹 고객별 최신 해지율 정보 가져오기
    customer_ids = [row.sha2_hash for row in results]

    latest_churn_predictions = (
        db.query(
            CustomerChurnPrediction.sha2_hash,
            func.max(CustomerChurnPrediction.p_mt).label("latest_p_mt"),
            CustomerChurnPrediction.churn_probability,
            CustomerChurnPrediction.customer_category
        )
        .filter(CustomerChurnPrediction.sha2_hash.in_(customer_ids))
        .group_by(CustomerChurnPrediction.sha2_hash, CustomerChurnPrediction.churn_probability, CustomerChurnPrediction.customer_category)
        .all()
    )

    churn_dict = {cp.sha2_hash: {"churn_probability": cp.churn_probability, "customer_category": cp.customer_category} for cp in latest_churn_predictions}

    response = JSONResponse(content=[{
        "sha2_hash": row.sha2_hash,
        "p_mt_range": row.p_mt_range,
        "churn": row.churn,
        "AGE_GRP10": row.AGE_GRP10,
        "MEDIA_NM_GRP": row.MEDIA_NM_GRP,
        "PROD_NM_GRP": row.PROD_NM_GRP,
        "AGMT_KIND_NM": row.AGMT_KIND_NM,
        "SCRB_PATH_NM_GRP": row.SCRB_PATH_NM_GRP,
        "AGMT_END_YMD": row.AGMT_END_YMD,
        "churn_probability": churn_dict.get(row.sha2_hash, {}).get("churn_probability", None),
        "customer_category": churn_dict.get(row.sha2_hash, {}).get("customer_category", None)
    } for row in results])

    response.headers["x-total-count"] = str(total_count)
    return response

# 📌 3. 고객 상세 정보 (/customers/{sha2_hash}
@app.get("/customers/{sha2_hash}", response_model=List[dict])
def get_customer_details(
    sha2_hash: str,
    db: Session = Depends(get_db)
):
    """
    특정 고객의 과거 및 현재 기록 반환 + 해지 확률 & 고객 분류 포함
    """

    customer_history = (
        db.query(
            TpsCancel.p_mt,
            TpsCancel.MEDIA_NM_GRP,
            TpsCancel.PROD_NM_GRP,
            TpsCancel.AGMT_KIND_NM,
            TpsCancel.AGMT_END_YMD,
            TpsCancel.churn
        )
        .filter(TpsCancel.sha2_hash == sha2_hash)
        .order_by(TpsCancel.p_mt.desc())
        .all()
    )

    if not customer_history:
        raise HTTPException(status_code=404, detail="해당 고객 데이터를 찾을 수 없습니다.")

    churn_prediction = (
        db.query(
            CustomerChurnPrediction.p_mt,
            CustomerChurnPrediction.churn_probability,
            CustomerChurnPrediction.customer_category
        )
        .filter(CustomerChurnPrediction.sha2_hash == sha2_hash)
        .order_by(CustomerChurnPrediction.p_mt.desc())
        .all()
    )

    churn_dict = {cp.p_mt: {"churn_probability": cp.churn_probability, "customer_category": cp.customer_category} for cp in churn_prediction}

    result = []
    for row in customer_history:
        result.append({
            "p_mt": row.p_mt,
            "MEDIA_NM_GRP": row.MEDIA_NM_GRP,
            "PROD_NM_GRP": row.PROD_NM_GRP,
            "AGMT_KIND_NM": row.AGMT_KIND_NM,
            "AGMT_END_YMD": row.AGMT_END_YMD,
            "churn": row.churn,
            "churn_probability": churn_dict.get(row.p_mt, {}).get("churn_probability", None),
            "customer_category": churn_dict.get(row.p_mt, {}).get("customer_category", None)
        })
    return result