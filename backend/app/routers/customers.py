from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import TpsCancelModels as TpsCancelModel, CustomerSummary, CustomerFeatureImpact
from schemas import TpsCancelModelsRead, CustomerSummaryRead, CustomerDetailRead, CustomerFeatureImpactRead

router = APIRouter()

# ✅ 고객 요약 정보 조회 API
@router.get("/summary", response_model=List[CustomerSummaryRead])
def get_customers_summary(
    offset: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    customer_category: Optional[str] = None,
    age_group: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(CustomerSummary)

    # 동적 필터 적용
    filters = []
    if search:
        filters.append(CustomerSummary.sha2_hash == search)
    if age_group and age_group != "ALL":
        filters.append(CustomerSummary.AGE_GRP10 == age_group)
    if customer_category and customer_category != "ALL":
        filters.append(CustomerSummary.customer_category == customer_category)

    if filters:
        query = query.filter(*filters)

    return query.offset(offset).limit(limit).all()


# ✅ 특정 고객의 과거 이력 조회 API
@router.get("/{sha2_hash}/history", response_model=List[TpsCancelModelsRead])
def get_customer_history(
    sha2_hash: str,
    p_mt: Optional[int] = Query(None, description="특정 유지 월 데이터 조회"),
    db: Session = Depends(get_db)
):
    query = db.query(TpsCancelModel).filter(TpsCancelModel.sha2_hash == sha2_hash)
    
    if p_mt:
        query = query.filter(TpsCancelModel.p_mt == p_mt).limit(1)
    else:
        query = query.order_by(TpsCancelModel.p_mt.desc())

    history_records = query.all()

    if not history_records:
        raise HTTPException(status_code=404, detail="해당 고객의 과거 데이터가 없습니다.")

    return history_records

# ✅ 특정 고객의 중요 피처 영향도 조회 API
@router.get("/{sha2_hash}/feature-importance", response_model=List[CustomerFeatureImpactRead])
def get_customer_feature_importance(
    sha2_hash: str, 
    p_mt: Optional[int] = Query(None, description="특정 유지 월 (p_mt)"),
    db: Session = Depends(get_db)
):
    """
    특정 고객의 중요 피처 영향도를 조회하는 API  
    - `p_mt`를 입력하면 해당 월의 데이터를 가져옴  
    - `p_mt`가 없으면 최신 데이터를 반환  
    """
    query = db.query(CustomerFeatureImpact).filter(CustomerFeatureImpact.sha2_hash == sha2_hash)
    
    if p_mt:
        query = query.filter(CustomerFeatureImpact.p_mt == p_mt).limit(1)
    else:
        query = query.order_by(CustomerFeatureImpact.p_mt.desc())

    feature_impact_data = query.all()

    if not feature_impact_data:
        raise HTTPException(status_code=404, detail="해당 고객의 중요 피처 데이터가 없습니다.")

    return feature_impact_data
