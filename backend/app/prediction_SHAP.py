import os
import numpy as np
import joblib
import pandas as pd
import time
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from sqlalchemy.dialects.mysql import insert
from database import get_db
from models import TpsCancelModels, CustomerFeatureImpact
from sklearn.preprocessing import LabelEncoder
import shap

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

# 🔹 SHAP Explainer 로드
explainer = shap.TreeExplainer(loaded_model)

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

@router.post("/predict/individual")
def predict_individual_impact(
    sha2_hash: str = None, p_mt: int = None, batch_size: int = 1000, db: Session = Depends(get_db)
):
    """
    특정 고객 또는 전체 고객의 해지 확률을 예측하고, 상위 5개 피처의 영향을 저장합니다.
    """
    MAX_RETRIES = 5
    BATCH_SIZE = 500  # 💡 500개 단위로 나눠서 저장

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
                ~db.query(CustomerFeatureImpact.sha2_hash, CustomerFeatureImpact.p_mt)
                .filter(CustomerFeatureImpact.sha2_hash == TpsCancelModels.sha2_hash, 
                        CustomerFeatureImpact.p_mt == TpsCancelModels.p_mt)
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

            shap_values = explainer(df_modeling)
            probabilities = loaded_model.predict_proba(df_modeling)

            impact_entries = []

            for i in range(len(df_ids)):
                sha2_hash = df_ids.iloc[i]["sha2_hash"]
                p_mt = df_ids.iloc[i]["p_mt"]
                churn_probability = round(float(probabilities[i][1]), 2)
                customer_category = classify_customer_fine(churn_probability)

                shap_values_raveled = np.ravel(shap_values.values[i])

                if len(shap_values_raveled) > len(FEATURES):
                    shap_values_raveled = shap_values_raveled[:len(FEATURES)]
                elif len(shap_values_raveled) < len(FEATURES):
                    shap_values_raveled = np.pad(shap_values_raveled, (0, len(FEATURES) - len(shap_values_raveled)), 'constant')

                impact_df = pd.DataFrame({
                    "feature": FEATURES,
                    "impact": shap_values_raveled
                }).sort_values(by="impact", ascending=False).head(5)

                top_features = impact_df["feature"].tolist()
                top_impacts = impact_df["impact"].tolist()

                impact_entry = CustomerFeatureImpact(
                    sha2_hash=sha2_hash,
                    p_mt=p_mt,
                    feature_1=top_features[0], impact_value_1=top_impacts[0],
                    feature_2=top_features[1], impact_value_2=top_impacts[1],
                    feature_3=top_features[2], impact_value_3=top_impacts[2],
                    feature_4=top_features[3], impact_value_4=top_impacts[3],
                    feature_5=top_features[4], impact_value_5=top_impacts[4],
                    prediction_date=date.today()
                )
                impact_entries.append(impact_entry)

            for i in range(0, len(impact_entries), BATCH_SIZE):
                batch = impact_entries[i : i + BATCH_SIZE]
                
                retries = 0
                while retries < MAX_RETRIES:
                    try:
                        for entry in batch:
                            entry_data = {key: value for key, value in vars(entry).items() if key != "_sa_instance_state"}
                            stmt = insert(CustomerFeatureImpact).values(**entry_data).on_duplicate_key_update(
                                feature_1=entry.feature_1, impact_value_1=entry.impact_value_1,
                                feature_2=entry.feature_2, impact_value_2=entry.impact_value_2,
                                feature_3=entry.feature_3, impact_value_3=entry.impact_value_3,
                                feature_4=entry.feature_4, impact_value_4=entry.impact_value_4,
                                feature_5=entry.feature_5, impact_value_5=entry.impact_value_5,
                                prediction_date=entry.prediction_date
                            )
                            db.execute(stmt)
                        
                        db.commit()
                        break
                    except OperationalError as e:
                        if "Deadlock" in str(e):
                            retries += 1
                            time.sleep(2 ** retries)
                        else:
                            raise e

            total_processed += len(customers)
            offset += batch_size

            print(f"✅ {total_processed}명의 고객 예측 완료")

        return {"message": "전체 고객 해지 확률 예측 완료", "total_processed": total_processed}
