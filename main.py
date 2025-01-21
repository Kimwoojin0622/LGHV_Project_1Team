# main.py
from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import Base, engine, SessionLocal
from models import CustomerSummary, TpsCancel
from schemas import CustomerSummaryRead, TpsCancelRead
from typing import List, Optional
from fastapi.responses import JSONResponse

# ✅ 별도의 prediction 모듈에서 함수 가져오기
from prediction import predict_customer

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

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 📊 1️⃣ 대시보드 API
@app.get("/dashboard")
def get_dashboard_data(db: Session = Depends(get_db)):
    model_predictions = predict_customer(db)

    total_customers = len(model_predictions)
    churn_customers = sum(1 for p in model_predictions if p["prediction"] == 1)
    high_risk_customers = sum(1 for p in model_predictions if p["probability_1"] >= 0.8)

    churn_categories = {
        "매우 위험": sum(1 for p in model_predictions if p["customer_category"] == "매우 위험"),
        "위험": sum(1 for p in model_predictions if p["customer_category"] == "위험"),
        "주의": sum(1 for p in model_predictions if p["customer_category"] == "주의"),
        "양호": sum(1 for p in model_predictions if p["customer_category"] == "양호"),
        "안정": sum(1 for p in model_predictions if p["customer_category"] == "안정"),
    }

    return {
        "total_customers": total_customers,
        "churn_customers": churn_customers,
        "high_risk_customers": high_risk_customers,
        "churn_categories": churn_categories
    }

# 2️⃣ 고객 조회창 (현재 기준 데이터 + 고객 ID 유지)
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
        "sha2_hash": row.sha2_hash,  # 고객 ID 포함
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

# 3️⃣ 특정 고객의 전체 데이터 조회 (과거 기록 포함 + 고객 ID 유지)
@app.get("/customer-details/{customer_id}", response_model=List[TpsCancelRead])
def get_customer_details(customer_id: str, db: Session = Depends(get_db)):
    """
    특정 고객의 TpsCancel 데이터를 조회 (과거 기록 포함, 고객 ID 유지)
    """
    # 현재 기준 고객 정보 조회
    customer_summary = db.query(CustomerSummary).filter(CustomerSummary.sha2_hash == customer_id).first()
    if not customer_summary:
        raise HTTPException(status_code=404, detail="Customer not found")

    # 과거 기록이 포함된 TpsCancel 데이터 조회
    tps_cancel_data = db.query(TpsCancel).filter(TpsCancel.sha2_hash == customer_id).all()
    if not tps_cancel_data:
        raise HTTPException(status_code=404, detail="Customer data not found")

    # 데이터 변환 (현재 기준 정보 + 과거 기록 유지 + 고객 ID 포함)
    cancel_details = [{
        "sha2_hash": customer_id,  # 고객 ID 유지
        "p_mt_range": customer_summary.p_mt_range,
        "churn": customer_summary.churn,
        "AGE_GRP10": customer_summary.AGE_GRP10,
        "MEDIA_NM_GRP": customer_summary.MEDIA_NM_GRP,
        "PROD_NM_GRP": customer_summary.PROD_NM_GRP,
        "AGMT_KIND_NM": customer_summary.AGMT_KIND_NM,
        "SCRB_PATH_NM_GRP": customer_summary.SCRB_PATH_NM_GRP,
        "AGMT_END_YMD": customer_summary.AGMT_END_YMD,
        "cancel_date": row.cancel_date,
        "cancel_reason": row.cancel_reason
    } for row in tps_cancel_data]

    return JSONResponse(content=cancel_details)

# 💡 4️⃣ 마케팅 대안 추천 API
@app.get("/marketing-recommendations/{customer_id}")
def get_marketing_recommendations(customer_id: str, db: Session = Depends(get_db)):
    """
    특정 고객에게 맞춤형 마케팅 대안을 추천하는 API
    """
    model_predictions = predict_customer(db)
    customer = next((p for p in model_predictions if p["sha2_hash"] == customer_id), None)

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    recommendations = []
    if customer["probability_1"] >= 0.8:
        recommendations.append({"type": "요금 할인", "description": "재약정 할인 제공"})
    if customer["probability_1"] >= 0.6:
        recommendations.append({"type": "혜택 제공", "description": "상품권 및 포인트 제공"})
    if customer["probability_1"] >= 0.6:
        recommendations.append({"type": "맞춤형 상담", "description": "VIP 상담 서비스 제공"})

    return {"customer_id": customer_id, "recommendations": recommendations}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
