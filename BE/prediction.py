import os
import numpy as np
import joblib
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import TpsCancelModels

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # 현재 실행 중인 파일 위치
DATA_DIR = os.path.join(BASE_DIR, "data")  # "data" 폴더가 BE 내부에 있다는 걸 명확하게 지정

model_path = os.path.join(DATA_DIR, "lightgbm_model.pkl")
robust_scaler_path = os.path.join(DATA_DIR, "robust_scaler.pkl")
minmax_scaler_path = os.path.join(DATA_DIR, "minmax_scaler.pkl")

loaded_model = joblib.load(model_path)
robust_scaler = joblib.load(robust_scaler_path)
minmax_scaler = joblib.load(minmax_scaler_path)

# 🔹 모델 학습 시 사용한 전체 피처 리스트 (예측 시 동일하게 맞춰야 함)
FEATURES = [
    "TOTAL_USED_DAYS", "CH_HH_AVG_MONTH1", "TV_I_CNT", "MONTHS_REMAINING",
    "SCRB_PATH_NM_GRP", "INHOME_RATE", "CH_LAST_DAYS_BF_GRP", "STB_RES_1M_YN",
    "AGMT_KIND_NM", "BUNDLE_YN", "AGMT_END_SEG", "AGE_GRP10",
    "VOC_STOP_CANCEL_MONTH1_YN", "VOC_TOTAL_MONTH1_YN"
]

# 🔹 해지 위험도 분류 함수
def classify_customer_fine(probability):
    if probability >= 0.8:
        return '매우 위험'
    elif probability >= 0.6:
        return '위험'
    elif probability >= 0.4:
        return '주의'
    elif probability > 0.25:
        return '양호'
    else:
        return '안정'

@router.get("/predict/{customer_id}")
def predict_churn(customer_id: str, db: Session = Depends(get_db)):
    """
    특정 고객의 해지 확률 예측 API (모델 학습 시 사용한 전체 피처 반영)
    """
    customer = db.query(TpsCancelModels).filter(TpsCancelModels.sha2_hash == customer_id).first()

    if not customer:
        return {"error": "해당 고객 데이터를 찾을 수 없습니다."}

    try:
        # 🔹 모델 학습 시 사용한 전체 피처를 가져와야 함
        feature_values = []
        for feature in FEATURES:
            value = getattr(customer, feature, 0)  # 해당 속성이 없으면 기본값 0 적용
            feature_values.append(float(value) if value is not None else 0.0)

        # 🔹 NumPy 배열 변환
        features = np.array(feature_values).reshape(1, -1)

        # 🔹 스케일링 적용 (각 피처에 맞춰서)
        scaled_features = minmax_scaler.transform(features)  # 모델 학습 시와 동일하게 적용

        # 🔹 모델 예측
        probabilities = loaded_model.predict_proba(scaled_features)
        prediction = (probabilities[:, 1] >= 0.5).astype(int)  # 50% 이상이면 해지 예측

        # 🔹 예측값 정리
        probability_1 = float(probabilities[0][1])
        customer_category = classify_customer_fine(probability_1)

        return {
            "customer_id": customer_id,
            "prediction": int(prediction[0]),  # 해지 여부 (0: 미해지, 1: 해지)
            "probability_1": probability_1,  # 해지 확률
            "customer_category": customer_category  # 해지 위험도
        }

    except Exception as e:
        return {"error": f"예측 중 오류 발생: {str(e)}"}
