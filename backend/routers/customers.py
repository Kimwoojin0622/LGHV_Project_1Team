from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import TpsCancelModels as TpsCancelModel, CustomerSummary, CustomerFeatureImpact
from schemas import TpsCancelModelsRead, CustomerSummaryRead, CustomerFeatureImpactRead

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
    query = db.query(
        CustomerSummary.sha2_hash,
        CustomerSummary.AGE_GRP10,
        CustomerSummary.MEDIA_NM_GRP,
        CustomerSummary.PROD_NM_GRP,
        CustomerSummary.SCRB_PATH_NM_GRP,
        CustomerSummary.AGMT_END_YMD,
        CustomerSummary.churn_probability,
        CustomerSummary.customer_category
    )

    # 동적 필터 적용
    if search:
        query = query.filter(CustomerSummary.sha2_hash == search)
    if age_group and age_group != "ALL":
        query = query.filter(CustomerSummary.AGE_GRP10 == age_group)
    if customer_category and customer_category != "ALL":
        query = query.filter(CustomerSummary.customer_category == customer_category)

    results = query.offset(offset).limit(limit).all()

    # ✅ 반환값을 Pydantic 모델 형태로 변환
    return [
        CustomerSummaryRead(
            sha2_hash=r[0],
            AGE_GRP10=r[1],
            MEDIA_NM_GRP=r[2],
            PROD_NM_GRP=r[3],
            SCRB_PATH_NM_GRP=r[4],
            AGMT_END_YMD=r[5],
            churn_probability=r[6],
            customer_category=r[7]
        ) for r in results
    ]



# ✅ 특정 고객의 과거 이력 조회 API
@router.get("/{sha2_hash}/detailed-history", response_model=Optional[TpsCancelModelsRead])
def get_customer_detailed_history(
    sha2_hash: str,
    p_mt: Optional[int] = Query(None, description="특정 유지 월 필터링"),
    db: Session = Depends(get_db)
):
    """
    특정 유지 월(p_mt)의 고객 데이터를 반환하는 API  
    - `p_mt`를 입력하면 해당 월의 데이터를 가져옴  
    - `p_mt`가 없으면 최신 데이터를 반환  
    """
    query = db.query(
        TpsCancelModel.sha2_hash,
        TpsCancelModel.p_mt,
        TpsCancelModel.TOTAL_USED_DAYS,
        TpsCancelModel.CH_LAST_DAYS_BF_GRP,
        TpsCancelModel.VOC_TOTAL_MONTH1_YN,
        TpsCancelModel.MONTHS_REMAINING,
        TpsCancelModel.PROD_NM_GRP,
        TpsCancelModel.MEDIA_NM_GRP,
        TpsCancelModel.churn_probability,
        TpsCancelModel.customer_category
    )

    if p_mt:
        query = query.filter(TpsCancelModel.sha2_hash == sha2_hash, TpsCancelModel.p_mt == p_mt).limit(1)
    else:
        query = query.filter(TpsCancelModel.sha2_hash == sha2_hash).order_by(TpsCancelModel.p_mt.desc()).limit(1)

    result = query.first()

    if not result:
        raise HTTPException(status_code=404, detail="해당 고객의 데이터가 없습니다.")

    return TpsCancelModelsRead(
        sha2_hash=result[0],
        p_mt=result[1],
        TOTAL_USED_DAYS=result[2],
        CH_LAST_DAYS_BF_GRP=result[3],
        VOC_TOTAL_MONTH1_YN=result[4],
        MONTHS_REMAINING=result[5],
        PROD_NM_GRP=result[6],
        MEDIA_NM_GRP=result[7],
        churn_probability=result[8],
        customer_category=result[9]
    )



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
