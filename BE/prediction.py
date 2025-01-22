import os
import numpy as np
import joblib
import pandas as pd
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import TpsCancelModels, CustomerChurnPrediction
from sklearn.preprocessing import LabelEncoder

router = APIRouter()

# 🔹 모델 및 스케일러 로드
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

model_path = os.path.join(DATA_DIR, "lightgbm_model.pkl")
robust_scaler_path = os.path.join(DATA_DIR, "robust_scaler.pkl")
minmax_scaler_path = os.path.join(DATA_DIR, "minmax_scaler.pkl")

loaded_model = joblib.load(model_path)
robust_scaler = joblib.load(robust_scaler_path)
minmax_scaler = joblib.load(minmax_scaler_path)

# 🔹 모델 학습 시 사용한 전체 피처 리스트 (sha2_hash, p_mt 제외)
FEATURES = [
    "TOTAL_USED_DAYS", "CH_HH_AVG_MONTH1", "TV_I_CNT", "MONTHS_REMAINING",
    "SCRB_PATH_NM_GRP", "INHOME_RATE", "CH_LAST_DAYS_BF_GRP", "STB_RES_1M_YN",
    "AGMT_KIND_NM", "BUNDLE_YN", "AGMT_END_SEG", "AGE_GRP10",
    "VOC_STOP_CANCEL_MONTH1_YN", "VOC_TOTAL_MONTH1_YN"
]

# 🔹 해지 위험도 분류 함수
def classify_customer_fine(probability):
    """
    고객 해지 위험도를 확률에 따라 분류하는 함수
    """
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

# 🔹 인코딩을 위한 Label Encoders (카테고리형 변수 변환)
label_encoders = {}

def encode_categorical_features(df):
    """
    문자열 데이터를 숫자로 변환 (Label Encoding 적용)
    """
    for column in df.select_dtypes(include=['object']).columns:  # 문자열 컬럼만 선택
        if column not in label_encoders:  # 새로운 컬럼이면 새로운 LabelEncoder 생성
            label_encoders[column] = LabelEncoder()
            df[column] = label_encoders[column].fit_transform(df[column].astype(str))
        else:
            df[column] = label_encoders[column].transform(df[column].astype(str))  # 기존 LabelEncoder 적용
    return df

@router.post("/predict/all")
def batch_predict_churn(db: Session = Depends(get_db), batch_size: int = 1000):
    """
    월별(p_mt) 데이터를 유지하면서 고객별 해지 확률을 예측하여 customer_churn_prediction 테이블에 저장
    """
    offset = 0
    total_processed = 0

    while True:
        # 🔹 특정 개수(batch_size)만큼 고객 데이터를 가져옴 (월별 데이터 유지)
        customers = db.query(TpsCancelModels).offset(offset).limit(batch_size).all()

        if not customers:
            break  # 더 이상 데이터가 없으면 종료

        predictions = []

        # 🔹 ORM 객체를 DataFrame으로 변환 (불필요한 `InstanceState` 제거)
        df_modeling = pd.DataFrame([{key: value for key, value in vars(customer).items() if not key.startswith('_')} for customer in customers])

        # 🔹 `sha2_hash`, `p_mt` 유지한 상태로 학습 피처만 분리
        df_ids = df_modeling[["sha2_hash", "p_mt"]]  # ID 정보 유지
        df_modeling = df_modeling.drop(columns=["churn"], errors="ignore")  # `churn` 제거

        # 🔹 레이블 인코딩 수행 (문자열 → 숫자 변환)
        df_modeling = encode_categorical_features(df_modeling)

        # 🔹 모델 학습 시 사용한 컬럼만 유지 (sha2_hash, p_mt 제거 X)
        df_modeling = df_modeling[FEATURES]

        # 🔹 스케일링 적용 (sha2_hash, p_mt 제외)
        robust_columns = ['TOTAL_USED_DAYS', 'CH_HH_AVG_MONTH1']
        minmax_columns = [col for col in FEATURES if col not in robust_columns]

        df_modeling[robust_columns] = robust_scaler.transform(df_modeling[robust_columns])  # RobustScaler 적용
        df_modeling[minmax_columns] = minmax_scaler.transform(df_modeling[minmax_columns])  # MinMaxScaler 적용

        # 🔹 모델 예측
        probabilities = loaded_model.predict_proba(df_modeling)
        predictions = (probabilities[:, 1] >= 0.5).astype(int)

        # 🔹 결과 저장
        for i in range(len(df_ids)):  # ID 정보 유지하며 저장
            sha2_hash = df_ids.iloc[i]["sha2_hash"]
            p_mt = df_ids.iloc[i]["p_mt"]
            churn_probability = float(probabilities[i][1])
            prediction = int(predictions[i])
            customer_category = classify_customer_fine(churn_probability)

            # 🔹 기존 데이터 확인 (중복 방지, 월별 데이터 유지)
            existing_entry = db.query(CustomerChurnPrediction).filter(
                CustomerChurnPrediction.sha2_hash == sha2_hash,
                CustomerChurnPrediction.p_mt == p_mt
            ).first()

            if existing_entry:
                # 기존 데이터 업데이트
                existing_entry.churn_probability = churn_probability
                existing_entry.prediction = prediction
                existing_entry.customer_category = customer_category
                existing_entry.prediction_date = date.today()
            else:
                # 새로운 예측 데이터 추가
                prediction_entry = CustomerChurnPrediction(
                    sha2_hash=sha2_hash,
                    p_mt=p_mt,
                    churn_probability=churn_probability,
                    prediction=prediction,
                    customer_category=customer_category,
                    prediction_date=date.today()
                )
                db.add(prediction_entry)

            predictions.append({
                "customer_id": sha2_hash,
                "p_mt": p_mt,
                "prediction": prediction,
                "churn_probability": churn_probability,
                "customer_category": customer_category
            })

        # 🔹 배치 커밋
        db.commit()
        total_processed += len(customers)
        offset += batch_size

        print(f"✅ {total_processed}명의 해지 확률 예측 완료...")

    return {"message": "모든 고객의 해지 확률 예측 완료", "total_processed": total_processed}
