from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from database import engine
from models import CustomerFeatureImpact, MonthlyChurnFactors

# ✅ 한 번에 처리할 청크 크기 설정
CHUNK_SIZE = 100000  # 청크 크기 (한 번에 가져올 레코드 수)

def update_monthly_churn_factors():
    db = Session(engine)

    # ✅ 2월~12월까지 반복하여 데이터 집계
    for month in range(2, 13):
        print(f"\n📊 {month}월 데이터 처리 시작...")

        # ✅ 기존 데이터 삭제 (월별 해지 요인 초기화)
        deleted_rows = db.query(MonthlyChurnFactors).filter(MonthlyChurnFactors.p_mt == month).delete()
        db.commit()
        print(f"🗑️ {deleted_rows}개의 기존 데이터 삭제 완료.")

        impact_scores = {}

        # ✅ 데이터를 청크 단위로 처리
        base_query = db.query(
            CustomerFeatureImpact.feature_1.label("feature"),
            (CustomerFeatureImpact.impact_value_1 * 5).label("score")
        ).filter(CustomerFeatureImpact.p_mt == month).group_by(CustomerFeatureImpact.feature_1).union_all(
            db.query(
                CustomerFeatureImpact.feature_2.label("feature"),
                (CustomerFeatureImpact.impact_value_2 * 4).label("score")
            ).filter(CustomerFeatureImpact.p_mt == month).group_by(CustomerFeatureImpact.feature_2)
        ).union_all(
            db.query(
                CustomerFeatureImpact.feature_3.label("feature"),
                (CustomerFeatureImpact.impact_value_3 * 3).label("score")
            ).filter(CustomerFeatureImpact.p_mt == month).group_by(CustomerFeatureImpact.feature_3)
        ).union_all(
            db.query(
                CustomerFeatureImpact.feature_4.label("feature"),
                (CustomerFeatureImpact.impact_value_4 * 2).label("score")
            ).filter(CustomerFeatureImpact.p_mt == month).group_by(CustomerFeatureImpact.feature_4)
        ).union_all(
            db.query(
                CustomerFeatureImpact.feature_5.label("feature"),
                (CustomerFeatureImpact.impact_value_5 * 1).label("score")
            ).filter(CustomerFeatureImpact.p_mt == month).group_by(CustomerFeatureImpact.feature_5)
        ).subquery()

        # ✅ 청크 단위로 데이터를 처리
        chunk_query = db.query(base_query.c.feature, func.sum(base_query.c.score).label("total_score"))\
                        .group_by(base_query.c.feature)\
                        .order_by(desc("total_score"))\
                        .yield_per(CHUNK_SIZE)

        processed_rows = 0

        # ✅ 청크 단위로 반복 처리
        for row in chunk_query:
            processed_rows += 1
            feature = row.feature
            impact_score = row.total_score

            if feature:
                if feature in impact_scores:
                    impact_scores[feature] += impact_score
                else:
                    impact_scores[feature] = impact_score

            # ✅ 일정 간격마다 진행 상태 출력
            if processed_rows % CHUNK_SIZE == 0:
                print(f"🔄 {processed_rows}개 데이터 처리 완료...")

        print(f"✅ 총 {processed_rows}개 데이터 처리 완료.")

        # ✅ 가중치 점수를 기반으로 영향력 높은 순서대로 정렬
        sorted_factors = sorted(impact_scores.items(), key=lambda x: x[1], reverse=True)[:5]

        # ✅ 상위 5개 요인 로그 출력
        print("📌 월별 주요 해지 요인 TOP 5:")
        for idx, (factor, score) in enumerate(sorted_factors, 1):
            print(f"   {idx}. {factor}: {score:.2f}")

        # ✅ 예외 처리 추가 (TOP 5가 부족한 경우)
        while len(sorted_factors) < 5:
            sorted_factors.append(("", 0))

        # ✅ 최종 데이터 삽입
        new_data = MonthlyChurnFactors(
            p_mt=month,
            feature_1=sorted_factors[0][0], impact_score_1=sorted_factors[0][1],
            feature_2=sorted_factors[1][0], impact_score_2=sorted_factors[1][1],
            feature_3=sorted_factors[2][0], impact_score_3=sorted_factors[2][1],
            feature_4=sorted_factors[3][0], impact_score_4=sorted_factors[3][1],
            feature_5=sorted_factors[4][0], impact_score_5=sorted_factors[4][1]
        )

        db.add(new_data)
        db.commit()

        print(f"✅ {month}월 데이터 업데이트 완료!\n")

    db.close()

if __name__ == "__main__":
    update_monthly_churn_factors()
    print("🚀 월별 주요 해지 요인 데이터 업데이트 완료!")
