from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Union
from database import get_db
from models import MonthlySummary, CustomerFeatureImpact, MonthlyChurnFactors
from schemas import MonthlySummaryRead, RiskAnalysisRead

router = APIRouter()

# 🔹 월별 위험군 요약 데이터 API
@router.get("/monthly-summary", response_model=List[MonthlySummaryRead])
def get_monthly_risk_summary(
    month: int = Query(..., description="조회할 유지 월 (2~12)"),
    db: Session = Depends(get_db)
):
    result = db.query(MonthlySummary).filter(MonthlySummary.p_mt == month).first()
    if not result:
        return []
    return [result]


# ✅ 특정 월(p_mt)의 위험도별 고객 분포 API
@router.get("/risk-distribution", response_model=Dict[str, int])
def get_risk_distribution(
    month: int = Query(..., description="조회할 유지 월 (2~12)"),
    db: Session = Depends(get_db)
):
    """
    특정 월(p_mt)에 해당하는 위험도별 고객 데이터를 반환
    """
    result = db.query(
        func.sum(MonthlySummary.category_high_risk).label("매우 위험"),
        func.sum(MonthlySummary.category_risk).label("위험"),
        func.sum(MonthlySummary.category_caution).label("주의")
    ).filter(MonthlySummary.p_mt == month).first()

    if not result:
        return {"매우 위험": 0, "위험": 0, "주의": 0}

    return {
        "매우 위험": result[0] or 0,
        "위험": result[1] or 0,
        "주의": result[2] or 0
    }

# ✅ 위험군 변화 추이 데이터 API
@router.get("/risk-trend", response_model=List[Dict[str, int]])
def get_risk_trend(db: Session = Depends(get_db)):
    """
    2월~12월까지 위험군 변화 추이를 반환
    """
    results = db.query(
        MonthlySummary.p_mt,
        MonthlySummary.category_high_risk.label("매우 위험"),
        MonthlySummary.category_risk.label("위험"),
        MonthlySummary.category_caution.label("주의"),
    ).filter(MonthlySummary.p_mt.between(2, 12)).order_by(MonthlySummary.p_mt).all()

    # 데이터 변환 (딕셔너리 리스트)
    return [{"p_mt": row[0], "매우 위험": row[1], "위험": row[2], "주의": row[3]} for row in results]

# ✅ 주요 해지 요인 (월별 p_mt 필터 적용)
@router.get("/churn-factors", response_model=List[Dict[str, Union[str, float]]])
def get_churn_factors(
    month: int = Query(..., description="조회할 유지 월 (2~12)"),
    db: Session = Depends(get_db)
):
    """
    특정 월(p_mt)의 주요 해지 요인 5개를 반환
    """
    result = db.query(MonthlyChurnFactors).filter(MonthlyChurnFactors.p_mt == month).first()

    if not result:
        return []

    return [
        {"factor": result.feature_1, "impact": result.impact_score_1},
        {"factor": result.feature_2, "impact": result.impact_score_2},
        {"factor": result.feature_3, "impact": result.impact_score_3},
        {"factor": result.feature_4, "impact": result.impact_score_4},
        {"factor": result.feature_5, "impact": result.impact_score_5}
    ]
