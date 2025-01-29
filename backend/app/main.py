from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
from models import CustomerSummary, TpsCancel, CustomerChurnPrediction
from typing import List, Optional
from fastapi.responses import JSONResponse
from sqlalchemy import func

# 예측 API는 별도 라우터에서 관리 (고객 조회창과 분리)
from prediction import router as prediction_router

app = FastAPI()

# 예측 API 포함
app.include_router(prediction_router, prefix="/predict", tags=["Churn Prediction"])

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-total-count"],
)

# 1. 대시보드 API (/dashboard)
@app.get("/dashboard")
def get_dashboard_data(db: Session = Depends(get_db)):
    """
    CRM 대시보드 데이터를 제공하는 API
    """
    # 총 고객 수, 해지 고객 수, 신규 고객 수 가져오기
    results = db.query(
        func.count(CustomerSummary.sha2_hash).label("total_customers"),
        func.count(func.nullif(CustomerSummary.churn, "N")).label("churn_customers"),
        func.max(CustomerSummary.AGMT_END_YMD).label("latest_month")
    ).first()

    total_customers = results.total_customers
    churn_customers = results.churn_customers
    latest_month = results.latest_month

    # 신규 고객 수
    new_customers = db.query(func.count(CustomerSummary.sha2_hash)).filter(CustomerSummary.AGMT_END_YMD == latest_month).scalar()

    # 전월 대비 고객 증감 계산
    previous_month = db.query(func.max(CustomerSummary.AGMT_END_YMD)).filter(CustomerSummary.AGMT_END_YMD < latest_month).scalar()
    prev_total_customers = db.query(func.count(CustomerSummary.sha2_hash)).filter(CustomerSummary.AGMT_END_YMD == previous_month).scalar()

    customer_change = total_customers - prev_total_customers if prev_total_customers else total_customers

    # 월별 해지율 추이
    monthly_churn_data = db.query(TpsCancel.p_mt, func.count(TpsCancel.sha2_hash).label("churn_count"))\
                            .filter(TpsCancel.churn == "Y")\
                            .group_by(TpsCancel.p_mt)\
                            .order_by(TpsCancel.p_mt)\
                            .all()
    monthly_churn_trend = {str(row.p_mt): row.churn_count for row in monthly_churn_data}

    # 해지 고객 분류 (해지율 기준)
    churn_category_counts = db.query(TpsCancel.CH_25_RATIO_1MONTH).filter(TpsCancel.CH_25_RATIO_1MONTH.isnot(None)).all()
    churn_categories = {
        "매우 위험": sum(1 for row in churn_category_counts if row.CH_25_RATIO_1MONTH >= 0.8),
        "위험": sum(1 for row in churn_category_counts if 0.6 <= row.CH_25_RATIO_1MONTH < 0.8),
        "주의": sum(1 for row in churn_category_counts if 0.4 <= row.CH_25_RATIO_1MONTH < 0.6),
        "양호": sum(1 for row in churn_category_counts if 0.2 <= row.CH_25_RATIO_1MONTH < 0.4),
        "안정": sum(1 for row in churn_category_counts if row.CH_25_RATIO_1MONTH < 0.2),
    }

    # 해지 고객 수 변화
    prev_churn_customers = db.query(func.count(TpsCancel.sha2_hash))\
                              .filter(TpsCancel.p_mt == previous_month, TpsCancel.churn == "Y")\
                              .scalar()

    churn_change = churn_customers - prev_churn_customers if prev_churn_customers else churn_customers

    return {
        "total_customers": total_customers,
        "churn_customers": churn_customers,
        "customer_change": customer_change,
        "monthly_churn_trend": monthly_churn_trend,
        "churn_categories": churn_categories,
        "churn_change": churn_change,
        "new_customers": new_customers
    }

# 2. 고객 조회창 (/customers-summary)
@app.get("/customers-summary", response_model=List[dict])
def get_customers_summary(
    offset: int = 0,
    limit: int = 20,
    search: Optional[str] = Query(None),
    p_mt_range: Optional[str] = Query(None),
    churn: Optional[str] = Query(None),
    customer_category: Optional[str] = Query(None),  # 이탈 위험도 필터
    age_group: Optional[str] = Query(None),  # 연령대 필터
    db: Session = Depends(get_db),
):
    """
    고객 요약 목록 반환 (고객 ID 포함) + 최신 해지율 데이터 추가
    """

    # 쿼리 빌드 시작
    query = db.query(CustomerSummary)

    # 검색 필터 적용
    if search:
        query = query.filter(CustomerSummary.sha2_hash.contains(search))

    # 연령대 필터 적용 (ALL이 아닌 경우만 필터링)
    if age_group and age_group != "ALL":
        query = query.filter(CustomerSummary.AGE_GRP10 == age_group)

    # 이탈 위험도 필터 적용 (ALL이 아닌 경우만 필터링)
    if customer_category and customer_category != "ALL":
        query = query.filter(CustomerSummary.customer_category == customer_category)

    # 필터링된 고객 수를 계산
    total_count = query.count()

    # 결과 조회
    results = query.offset(offset).limit(limit).all()

    # 고객별 최신 해지 예측 정보 추가
    customer_ids = [row.sha2_hash for row in results]
    latest_churn_predictions = db.query(
        CustomerChurnPrediction.sha2_hash,
        func.max(CustomerChurnPrediction.p_mt).label("latest_p_mt"),
        CustomerChurnPrediction.churn_probability,
        CustomerChurnPrediction.customer_category
    ).filter(CustomerChurnPrediction.sha2_hash.in_(customer_ids))\
     .group_by(CustomerChurnPrediction.sha2_hash, CustomerChurnPrediction.churn_probability, CustomerChurnPrediction.customer_category)\
     .all()

    churn_dict = {cp.sha2_hash: {"churn_probability": cp.churn_probability, "customer_category": cp.customer_category} for cp in latest_churn_predictions}

    # 응답 데이터 구성
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

# 3. 고객 상세 정보 (/customers/{sha2_hash})
@app.get("/customers/{sha2_hash}", response_model=List[dict])
def get_customer_details(
    sha2_hash: str,
    db: Session = Depends(get_db)
):
    """
    특정 고객의 과거 및 현재 기록 반환 + 해지 확률 & 고객 분류 포함
    """
    # 고객의 과거 기록 가져오기 (TpsCancel 테이블에서)
    customer_history = db.query(
        TpsCancel.p_mt,
        TpsCancel.MEDIA_NM_GRP,
        TpsCancel.PROD_NM_GRP,
        TpsCancel.AGMT_KIND_NM,
        TpsCancel.AGMT_END_YMD,
        TpsCancel.churn
    ).filter(TpsCancel.sha2_hash == sha2_hash).order_by(TpsCancel.p_mt.desc()).all()

    if not customer_history:
        raise HTTPException(status_code=404, detail="해당 고객 데이터를 찾을 수 없습니다.")

    # 고객의 해지 예측 정보 가져오기 (CustomerChurnPrediction 테이블에서)
    churn_prediction = db.query(
        CustomerChurnPrediction.p_mt,
        CustomerChurnPrediction.churn_probability,
        CustomerChurnPrediction.customer_category
    ).filter(CustomerChurnPrediction.sha2_hash == sha2_hash).order_by(CustomerChurnPrediction.p_mt.desc()).all()

    # 고객의 해지 예측 데이터를 p_mt별로 맵핑
    churn_dict = {cp.p_mt: {"churn_probability": cp.churn_probability, "customer_category": cp.customer_category} for cp in churn_prediction}

    # 결과 리스트 구성
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
