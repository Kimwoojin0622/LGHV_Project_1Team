from fastapi import FastAPI, Depends, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
from models import MonthlySummary, ChurnReasons, HighRiskCustomers
from schemas import ChurnRateResponse, ChurnReasonsResponse, HighRiskCustomersResponse
from typing import Optional
from routers import customers, riskanalysis

app = FastAPI()

# CORS 설정 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React 개발 서버 주소
    allow_credentials=True,
    allow_methods=["*"],  # 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 헤더 허용
    expose_headers=["x-total-count"],
)

@app.get("/api/churn_rate", response_model=list[ChurnRateResponse])
def get_churn_rate(db: Session = Depends(get_db), p_mt: int = Query(None, description="조회할 월")):
    """ 월별 이탈율 데이터 및 고객 분포 가져오기 """
    query = db.query(
        MonthlySummary.p_mt, 
        MonthlySummary.churn_customers, 
        MonthlySummary.total_customers, 
        MonthlySummary.new_customers,
        MonthlySummary.category_stable, 
        MonthlySummary.category_normal, 
        MonthlySummary.category_caution, 
        MonthlySummary.category_risk, 
        MonthlySummary.category_high_risk
    )
    
    if p_mt:
        query = query.filter(MonthlySummary.p_mt == p_mt)
    
    results = query.all()
    
    if not results:
        raise HTTPException(status_code=404, detail="해당 월의 데이터가 없습니다.")

    return results

@app.get("/api/churn_reasons", response_model=list[ChurnReasonsResponse])
def get_churn_reasons(db: Session = Depends(get_db), p_mt: int = Query(None, description="조회할 월")):
    """ 월별 주요 해지 사유 데이터 가져오기 """
    query = db.query(ChurnReasons.p_mt, ChurnReasons.reason, ChurnReasons.percentage)
    if p_mt:
        query = query.filter(ChurnReasons.p_mt == p_mt)
    
    results = query.all()

    if not results:
        raise HTTPException(status_code=404, detail="해당 월의 데이터가 없습니다.")

    return results

@app.get("/api/high_risk_customers", response_model=list[HighRiskCustomersResponse])
def get_high_risk_customers(db: Session = Depends(get_db), p_mt: int = Query(None, description="조회할 월")):
    """ 특정 월의 해지 위험 고객 데이터 가져오기 """
    query = db.query(HighRiskCustomers)
    if p_mt:
        query = query.filter(HighRiskCustomers.p_mt == p_mt)
    
    results = query.all()

    if not results:
        raise HTTPException(status_code=404, detail="해당 월의 데이터가 없습니다.")

    return results

app.include_router(customers.router, prefix="/customers", tags=["Customers"])
app.include_router(riskanalysis.router, prefix="/risk-summary", tags=["Risk Analysis"])  # ✅ "/risk" prefix 확인
