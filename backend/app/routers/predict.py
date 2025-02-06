from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import CustomerFeatureImpact
from schemas import RiskAnalysisRead

router = APIRouter()

# ✅ 유지 월(`p_mt`)이 선택되면 해당 월만 필터링, 아니면 전체 데이터 반환
@router.get("/risk-analysis", response_model=List[RiskAnalysisRead])
def get_risk_analysis(
    customer_category: Optional[str] = Query(None, description="고객 위험군 필터"),
    p_mt: Optional[int] = Query(None, description="특정 유지 월 필터 (선택)"),
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """
    특정 유지 월(p_mt) 기준으로 위험군 고객 리스트를 조회하는 API
    - `customer_category`: '매우 위험', '위험' 등 고객 분류 필터
    - `p_mt`: 특정 유지 월 필터 (없으면 전체 데이터 조회)
    - `limit`: 최대 조회 개수 (기본 50개)
    """
    query = db.query(CustomerFeatureImpact)

    if customer_category:
        query = query.filter(CustomerFeatureImpact.customer_category == customer_category)

    # ✅ 유지 월 필터가 설정된 경우에만 필터링 적용
    if p_mt is not None:
        query = query.filter(CustomerFeatureImpact.p_mt == p_mt)

    results = query.limit(limit).all()

    if not results:
        raise HTTPException(status_code=404, detail="해당 조건에 맞는 위험군 고객이 없습니다.")

    return results
