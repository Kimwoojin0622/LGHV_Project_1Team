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

label_encoders = {}

def encode_categorical_features(df):
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

@router.post("/predict/customers")
def batch_predict_customers(
    sha2_hash: str = None, p_mt: int = None, batch_size: int = 1000, db: Session = Depends(get_db)
):
    """
    특정 고객(sha2_hash, p_mt 입력 시) 또는 신규 고객(batch_size 입력 시) 해지 예측 후 DB에 저장.
    """
    if sha2_hash and p_mt:
        customers = db.query(TpsCancelModels).filter(
            TpsCancelModels.sha2_hash == sha2_hash,
            TpsCancelModels.p_mt == p_mt
        ).all()
    else:
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
                break

            print(f"🔹 신규 데이터 {offset}-{offset + batch_size} 처리 중...")
            
            df_modeling = pd.DataFrame([{key: value for key, value in vars(customer).items() if not key.startswith("_")} for customer in customers])
            df_ids = df_modeling[["sha2_hash", "p_mt"]]
            
            df_modeling = df_modeling.drop(columns=["sha2_hash", "p_mt", "churn"], errors="ignore")
            df_modeling = encode_categorical_features(df_modeling)
            df_modeling = df_modeling.reindex(columns=FEATURES, fill_value=0)

            robust_columns = ["TOTAL_USED_DAYS", "CH_HH_AVG_MONTH1"]
            minmax_columns = [col for col in FEATURES if col not in robust_columns]

            df_modeling[robust_columns] = robust_scaler.transform(df_modeling[robust_columns])
            df_modeling[minmax_columns] = minmax_scaler.transform(df_modeling[minmax_columns])

            probabilities = loaded_model.predict_proba(df_modeling)

            for i in range(len(df_ids)):
                sha2_hash = df_ids.iloc[i]["sha2_hash"]
                p_mt = df_ids.iloc[i]["p_mt"]
                churn_probability = round(float(probabilities[i][1]), 2)
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
    
    return {"message": "특정 고객 예측 완료", "total_processed": len(customers)}
