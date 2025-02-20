from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import TpsCancelModels as TpsCancelModel, CustomerSummary, CustomerFeatureImpact, MonthlySummary
from schemas import TpsCancelModelsRead, CustomerSummaryRead, CustomerFeatureImpactRead, MonthlySummaryRead

router = APIRouter()

# ✅ 고객 요약 정보 조회 API
@router.get("/summary", response_model=List[CustomerSummaryRead])
def get_customers_summary(
    offset: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    customer_category: Optional[str] = None,
    age_group: Optional[str] = None,
    prod_nm: Optional[str] = None,        # 상품 필터 추가
    scrb_path: Optional[str] = None,      # 가입 경로 필터 추가
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
    if customer_category and customer_category != "ALL":
        query = query.filter(CustomerSummary.customer_category == customer_category)
    if prod_nm and prod_nm != "ALL":          # 상품 필터 조건 추가
        query = query.filter(CustomerSummary.PROD_NM_GRP == prod_nm)
    if scrb_path and scrb_path != "ALL":        # 가입 경로 필터 조건 추가
        query = query.filter(CustomerSummary.SCRB_PATH_NM_GRP == scrb_path)

    results = query.offset(offset).limit(limit).all()

    # 반환값을 Pydantic 모델 형태로 변환
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
        TpsCancelModel.BUNDLE_YN,
        TpsCancelModel.CH_LAST_DAYS_BF_GRP,
        TpsCancelModel.CH_HH_AVG_MONTH1,
        TpsCancelModel.VOC_TOTAL_MONTH1_YN,
        TpsCancelModel.VOC_STOP_CANCEL_MONTH1_YN,
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
        BUNDLE_YN=result[3],
        CH_LAST_DAYS_BF_GRP=result[4],
        CH_HH_AVG_MONTH1=result[5],
        VOC_TOTAL_MONTH1_YN=result[6],
        VOC_STOP_CANCEL_MONTH1_YN=result[7],
        MONTHS_REMAINING=result[8],
        PROD_NM_GRP=result[9],
        MEDIA_NM_GRP=result[10],
        churn_probability=result[11],
        customer_category=result[12]
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

# ✅ 최신 월별 요약 데이터 조회 API
@router.get("/monthly-summary/latest", response_model=MonthlySummaryRead)
def get_latest_monthly_summary(db: Session = Depends(get_db)):
    latest_month = db.query(MonthlySummary.p_mt).order_by(MonthlySummary.p_mt.desc()).limit(1).scalar()

    if not latest_month:
        raise HTTPException(status_code=404, detail="월별 데이터가 존재하지 않습니다.")

    result = db.query(MonthlySummary).filter(MonthlySummary.p_mt == latest_month).first()
    
    return result
