from sqlalchemy.orm import Session
from database import SessionLocal
from models import CustomerFeatureImpact, MonthlyChurnFactors
from collections import defaultdict

BATCH_SIZE = 10000  # ✅ 한 번에 처리할 데이터 개수 (조절 가능)

def calculate_monthly_churn_factors(db: Session):
    """
    CustomerFeatureImpact 테이블에서 월별 주요 해지 요인을 추출하고
    MonthlyChurnFactors 테이블에 삽입하는 함수.
    """
    monthly_factors = defaultdict(lambda: defaultdict(float))

    offset = 0
    while True:
        # ✅ 청크 단위로 데이터 조회
        impacts = db.query(CustomerFeatureImpact).offset(offset).limit(BATCH_SIZE).all()
        if not impacts:
            break  # 더 이상 데이터가 없으면 종료

        # ✅ 월별 해지 요인 점수 집계
        for impact in impacts:
            for i in range(1, 6):
                feature = getattr(impact, f"feature_{i}")
                score = getattr(impact, f"impact_value_{i}", 0)
                if feature:
                    monthly_factors[impact.p_mt][feature] += score

        offset += BATCH_SIZE  # 다음 청크로 이동

    # ✅ 월별 상위 5개 요인 추출 및 DB 저장
    for p_mt, factors in monthly_factors.items():
        sorted_factors = sorted(factors.items(), key=lambda x: x[1], reverse=True)[:5]

        churn_factor = MonthlyChurnFactors(
            p_mt=p_mt,
            feature_1=sorted_factors[0][0] if len(sorted_factors) > 0 else None,
            impact_score_1=sorted_factors[0][1] if len(sorted_factors) > 0 else 0,
            feature_2=sorted_factors[1][0] if len(sorted_factors) > 1 else None,
            impact_score_2=sorted_factors[1][1] if len(sorted_factors) > 1 else 0,
            feature_3=sorted_factors[2][0] if len(sorted_factors) > 2 else None,
            impact_score_3=sorted_factors[2][1] if len(sorted_factors) > 2 else 0,
            feature_4=sorted_factors[3][0] if len(sorted_factors) > 3 else None,
            impact_score_4=sorted_factors[3][1] if len(sorted_factors) > 3 else 0,
            feature_5=sorted_factors[4][0] if len(sorted_factors) > 4 else None,
            impact_score_5=sorted_factors[4][1] if len(sorted_factors) > 4 else 0,
        )
        db.merge(churn_factor)  # ✅ 기존 데이터 있으면 업데이트, 없으면 삽입

    db.commit()

if __name__ == "__main__":
    db = SessionLocal()
    calculate_monthly_churn_factors(db)
    db.close()
    print("✅ 주요 해지 요인 데이터 업데이트 완료")
