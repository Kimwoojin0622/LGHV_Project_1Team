from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import CustomerSummary, TpsCancelModels as TpsCancelModel
from schemas import DashboardData

router = APIRouter()

@router.get("", response_model=DashboardData)
def get_dashboard_data(db: Session = Depends(get_db)):
    """
    CRM 대시보드 데이터를 제공하는 API
    """
    # 총 고객 수, 해지 고객 수, 최신 계약 종료일(월) 계산
    results = db.query(
        func.count(CustomerSummary.sha2_hash).label("total_customers"),
        func.count(func.nullif(CustomerSummary.churn, "N")).label("churn_customers"),
        func.max(CustomerSummary.AGMT_END_YMD).label("latest_month")
    ).first()

    total_customers = results.total_customers
    churn_customers = results.churn_customers
    latest_month = results.latest_month

    # 신규 고객 수
    new_customers = db.query(func.count(CustomerSummary.sha2_hash)).filter(
        CustomerSummary.AGMT_END_YMD == latest_month
    ).scalar()

    # 전월 대비 고객 증감
    previous_month = db.query(func.max(CustomerSummary.AGMT_END_YMD)).filter(
        CustomerSummary.AGMT_END_YMD < latest_month
    ).scalar()
    prev_total_customers = db.query(func.count(CustomerSummary.sha2_hash)).filter(
        CustomerSummary.AGMT_END_YMD == previous_month
    ).scalar()
    customer_change = total_customers - prev_total_customers if prev_total_customers else total_customers

    # 월별 해지 고객 수
    monthly_churn_data = db.query(
        TpsCancelModel.p_mt,
        func.count(TpsCancelModel.sha2_hash).label("churn_count")
    ).filter(TpsCancelModel.churn == "Y") \
     .group_by(TpsCancelModel.p_mt) \
     .order_by(TpsCancelModel.p_mt) \
     .all()
    monthly_churn_trend = {str(row.p_mt): row.churn_count for row in monthly_churn_data}

    # 해지 고객 분류 (churn_probability 기준)
    churn_probability_data = db.query(TpsCancelModel.churn_probability) \
                               .filter(TpsCancelModel.churn_probability.isnot(None)) \
                               .all()
    churn_categories = {
        "매우 위험": sum(1 for row in churn_probability_data if row.churn_probability >= 0.8),
        "위험": sum(1 for row in churn_probability_data if 0.6 <= row.churn_probability < 0.8),
        "주의": sum(1 for row in churn_probability_data if 0.4 <= row.churn_probability < 0.6),
        "양호": sum(1 for row in churn_probability_data if 0.2 <= row.churn_probability < 0.4),
        "안정": sum(1 for row in churn_probability_data if row.churn_probability < 0.2),
    }

    prev_churn_customers = db.query(func.count(TpsCancelModel.sha2_hash)) \
                              .filter(TpsCancelModel.p_mt == previous_month, TpsCancelModel.churn == "Y") \
                              .scalar()
    churn_change = churn_customers - prev_churn_customers if prev_churn_customers else churn_customers

    return DashboardData(
        total_customers=total_customers,
        churn_customers=churn_customers,
        customer_change=customer_change,
        monthly_churn_trend=monthly_churn_trend,
        churn_categories=churn_categories,
        churn_change=churn_change,
        new_customers=new_customers
    )
