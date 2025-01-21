# services/prediction.py
import pickle
import numpy as np

# 모델 로드를 전역에서 수행 (프로세스 시작 시 한 번)
with open("model.pkl", "rb") as f:
    churn_model = pickle.load(f)

def predict_customer(db_session):
    """
    DB에서 고객 정보를 가져와서 모델로 예측.
    예측 결과(확률, 카테고리 등)를 list(dict) 형태로 반환.
    """

    # 예: CustomerSummary 모델로부터 전체 조회
    from models import CustomerSummary
    customers = db_session.query(CustomerSummary).all()

    predictions = []
    for c in customers:
        # 실제 모델 특성에 맞는 전처리 로직 작성
        try:
            age = float(c.AGE_GRP10) if c.AGE_GRP10 else 0.0
            pmtr = float(c.p_mt_range) if c.p_mt_range else 0.0
        except:
            age = 0.0
            pmtr = 0.0
        
        features = np.array([age, pmtr]).reshape(1, -1)
        pred = churn_model.predict(features)
        prob = churn_model.predict_proba(features)

        prob_1 = float(prob[0][1])
        if prob_1 >= 0.8:
            category = "매우 위험"
        elif prob_1 >= 0.6:
            category = "위험"
        elif prob_1 >= 0.4:
            category = "주의"
        elif prob_1 >= 0.2:
            category = "양호"
        else:
            category = "안정"

        predictions.append({
            "sha2_hash": c.sha2_hash,
            "prediction": int(pred[0]),
            "probability_0": float(prob[0][0]),
            "probability_1": prob_1,
            "customer_category": category,
        })
    
    return predictions
