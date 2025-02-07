from sqlalchemy.orm import Session
from database import SessionLocal
from models import CustomerFeatureImpact, MonthlyChurnFactors
from collections import defaultdict
import logging

# ✅ 로깅 설정
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

BATCH_SIZE = 10000  # ✅ 한 번에 처리할 데이터 개수 (조절 가능)

def calculate_monthly_churn_factors(db: Session):
    """
    CustomerFeatureImpact 테이블에서 월별 주요 해지 요인을 추출하고
    feature별 5~1점 점수를 부여하여 총합을 구한 후, MonthlyChurnFactors 테이블에 저장하는 함수.
    """
    logging.info("📊 주요 해지 요인 계산 시작...")

    monthly_factors = defaultdict(lambda: defaultdict(float))  # 유지월별 해지 요인 점수 저장

    offset = 0
    while True:
        logging.info(f"📥 {offset}부터 {BATCH_SIZE}개 데이터 조회 중...")
        
        # ✅ 청크 단위로 데이터 조회
        impacts = db.query(CustomerFeatureImpact).offset(offset).limit(BATCH_SIZE).all()
        if not impacts:
            break  # 더 이상 데이터가 없으면 종료

        # ✅ 월별 해지 요인 점수 집계 (순위에 따라 5~1점 부여)
        for impact in impacts:
            for i, score in zip(range(1, 6), [5, 4, 3, 2, 1]):  # feature_1=5점, feature_2=4점 ...
                feature = getattr(impact, f"feature_{i}", None)
                if feature:
                    monthly_factors[impact.p_mt][feature] += score  # ✅ 순위별 점수 부여

        offset += BATCH_SIZE  # 다음 청크로 이동

    logging.info("🔍 월별 주요 해지 요인 추출 중...")

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

        logging.info(f"📌 유지 월 {p_mt} | 상위 해지 요인: {sorted_factors}")

        db.merge(churn_factor)  # ✅ 기존 데이터 있으면 업데이트, 없으면 삽입

    db.commit()
    logging.info("✅ 주요 해지 요인 데이터 업데이트 완료!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        calculate_monthly_churn_factors(db)
    except Exception as e:
        logging.error(f"❌ 오류 발생: {e}")
        db.rollback()
    finally:
        db.close()
