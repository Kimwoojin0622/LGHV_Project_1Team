from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import TpsCancelModels as TpsCancelModel, CustomerSummary
from schemas import TpsCancelModelsRead, CustomerSummaryRead, CustomerDetailRead

router = APIRouter()

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
    if search:
        query = query.filter(CustomerSummary.sha2_hash.contains(search))
    if age_group and age_group != "ALL":
        query = query.filter(CustomerSummary.AGE_GRP10 == age_group)
    if customer_category and customer_category != "ALL":
        query = query.filter(CustomerSummary.customer_category == customer_category)
    
    results = query.offset(offset).limit(limit).all()
    return results

@router.get("/{sha2_hash}", response_model=CustomerDetailRead)
def get_customer_details(sha2_hash: str, db: Session = Depends(get_db)):

    latest_customer = db.query(
        TpsCancelModel.sha2_hash,
        TpsCancelModel.AGE_GRP10.label("age_group"),
        TpsCancelModel.MEDIA_NM_GRP.label("media_type"),
        TpsCancelModel.PROD_NM_GRP.label("product_type"),
        TpsCancelModel.SCRB_PATH_NM_GRP.label("signup_channel"),
        TpsCancelModel.AGMT_KIND_NM.label("contract_type"),
        TpsCancelModel.MONTHS_REMAINING.label("months_remaining"),  # 여기서 MONTHS_REMAINING 사용
        TpsCancelModel.churn_probability,
        TpsCancelModel.customer_category
    ).filter(TpsCancelModel.sha2_hash == sha2_hash) \
     .order_by(TpsCancelModel.p_mt.desc()) \
     .first()
    
    if not latest_customer:
        raise HTTPException(status_code=404, detail="고객 데이터를 찾을 수 없습니다.")
    
    customer_detail = {
        "sha2_hash": latest_customer.sha2_hash,
        "churn_risk": latest_customer.customer_category or "안정",
        "age_group": latest_customer.age_group,
        "product_type": latest_customer.product_type,
        "media_type": latest_customer.media_type,
        "signup_channel": latest_customer.signup_channel,
        "contract_type": latest_customer.contract_type,
        "months_remaining": latest_customer.months_remaining,
        "churn_probability": latest_customer.churn_probability or 0.0,
        "customer_category": latest_customer.customer_category or "안정"
    }
    
    return customer_detail

@router.get("/{sha2_hash}/history", response_model=List[TpsCancelModelsRead])
def get_customer_history(
    sha2_hash: str,
    p_mt: Optional[int] = Query(None, description="특정 유지 월 (p_mt). 값이 없으면 전체 이력을 반환합니다."),
    db: Session = Depends(get_db)
):
    """
    특정 고객의 과거 데이터를 조회하는 API  
    - 쿼리 파라미터 p_mt가 제공되면 해당 월의 데이터를 반환  
    - 제공되지 않으면 해당 고객의 전체 이력을 p_mt 기준 내림차순으로 반환
    """
    query = db.query(TpsCancelModel).filter(TpsCancelModel.sha2_hash == sha2_hash)
    
    if p_mt is not None:
        query = query.filter(TpsCancelModel.p_mt == p_mt)
    
    history_records = query.order_by(TpsCancelModel.p_mt.desc()).all()
    
    if not history_records:
        raise HTTPException(status_code=404, detail="해당 고객의 과거 데이터가 없습니다.")
    
    return history_records
