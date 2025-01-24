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

# 🔹 모델 학습 시 사용한 전체 피처 리스트 (`sha2_hash`, `p_mt` 제외)
FEATURES = [feature for feature in loaded_model.feature_name_ if feature not in ["sha2_hash", "p_mt"]]

# 🔹 해지 위험도 분류 함수
def classify_customer_fine(probability):
    if probability >= 0.8:
        return "매우 위험"
    elif probability >= 0.6:
        return "위험"
    elif probability >= 0.4:
        return "주의"
    elif probability > 0.25:
        return "양호"
    else:
        return "안정"

# 🔹 Label Encoders 저장소
label_encoders = {}

def encode_categorical_features(df):
    """
    문자열 데이터를 숫자로 변환 (Label Encoding 수행)
    """
    for column in df.select_dtypes(include=["object"]).columns:
        if column not in label_encoders:
            label_encoders[column] = LabelEncoder()
            df[column] = label_encoders[column].fit_transform(df[column].astype(str))
        else:
            existing_classes = set(label_encoders[column].classes_)
            new_classes = set(df[column].astype(str).unique())
            unseen_classes = new_classes - existing_classes
            if unseen_classes:
                updated_classes = np.array(sorted(existing_classes | unseen_classes))
                label_encoders[column].classes_ = updated_classes
            df[column] = label_encoders[column].transform(df[column].astype(str))
    return df

@router.post("/predict/new")
def batch_predict_new_customers(db: Session = Depends(get_db), batch_size: int = 1000):
    """
    **새로운 고객 데이터만** 예측하고 `customer_churn_prediction` 테이블에 저장.
    기존 데이터는 유지하고, 신규 데이터만 추가 학습하는 방식.
    """
    offset = 0
    total_processed = 0

    while True:
        customers = db.query(TpsCancelModels).filter(
            ~db.query(CustomerChurnPrediction.sha2_hash, CustomerChurnPrediction.p_mt)
            .filter(CustomerChurnPrediction.sha2_hash == TpsCancelModels.sha2_hash, 
                    CustomerChurnPrediction.p_mt == TpsCancelModels.p_mt)
            .exists()
        ).offset(offset).limit(batch_size).all()

        if not customers:
            break  # 예측할 새로운 데이터가 없으면 종료

        print(f"🔹 신규 데이터 {offset}-{offset + batch_size} 처리 중...")

        # 🔹 고객 데이터를 DataFrame으로 변환
        df_modeling = pd.DataFrame([{key: value for key, value in vars(customer).items() if not key.startswith("_")} for customer in customers])
        
        # ✅ sha2_hash 및 p_mt 유지
        df_ids = df_modeling[["sha2_hash", "p_mt"]]  # 고객 ID 및 월 유지

        # 🔹 Feature 데이터만 남기고 학습에 필요 없는 값 제거
        df_modeling = df_modeling.drop(columns=["sha2_hash", "p_mt", "churn"], errors="ignore")
        df_modeling = encode_categorical_features(df_modeling)

        # 🔹 모델 학습 시 사용한 FEATURE 순서 맞추기
        df_modeling = df_modeling.reindex(columns=FEATURES, fill_value=0)

        # 🔹 스케일링 적용
        robust_columns = ["TOTAL_USED_DAYS", "CH_HH_AVG_MONTH1"]
        minmax_columns = [col for col in FEATURES if col not in robust_columns]

        df_modeling[robust_columns] = robust_scaler.transform(df_modeling[robust_columns])
        df_modeling[minmax_columns] = minmax_scaler.transform(df_modeling[minmax_columns])

        # 🔹 해지 확률 예측
        probabilities = loaded_model.predict_proba(df_modeling)

        # 🔹 예측 결과 DB 저장
        for i in range(len(df_ids)):
            sha2_hash = df_ids.iloc[i]["sha2_hash"]
            p_mt = df_ids.iloc[i]["p_mt"]
            churn_probability = round(float(probabilities[i][1]), 2)  # 소숫점 두 자리까지만 저장
            customer_category = classify_customer_fine(churn_probability)

            prediction_entry = CustomerChurnPrediction(
                sha2_hash=sha2_hash,
                p_mt=p_mt,
                churn_probability=churn_probability,
                customer_category=customer_category,
                prediction_date=date.today()
            )
            db.add(prediction_entry)

        db.commit()
        total_processed += len(customers)
        offset += batch_size

        print(f"✅ 신규 고객 {total_processed}명의 해지 확률 예측 완료...")

    return {"message": "신규 고객의 해지 확률 예측 완료", "total_processed": total_processed}
