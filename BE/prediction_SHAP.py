import os
import numpy as np
import joblib
import pandas as pd
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import TpsCancelModels, CustomerChurnPrediction, CustomerFeatureImpact
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

@router.post("/predict/individual/{sha2_hash}/{p_mt}")
def predict_individual_impact(sha2_hash: str, p_mt: int, db: Session = Depends(get_db)):
    """
    특정 고객의 해지 확률을 예측하고, 상위 5개 피처의 영향을 열(column) 형태로 저장합니다.
    """
    customer = db.query(TpsCancelModels).filter(
        TpsCancelModels.sha2_hash == sha2_hash,
        TpsCancelModels.p_mt == p_mt
    ).first()

    if not customer:
        return {"error": "해당 고객 데이터를 찾을 수 없습니다."}

    # 🔹 데이터 프레임 변환
    df_modeling = pd.DataFrame([{key: value for key, value in vars(customer).items() if not key.startswith("_")}])

    # ✅ sha2_hash 및 p_mt 유지
    df_ids = df_modeling[["sha2_hash", "p_mt"]]  # 고객 ID 및 유지 월

    # 🔹 Feature 데이터만 남기고 학습에 필요 없는 값 제거
    df_modeling = df_modeling.drop(columns=["sha2_hash", "p_mt", "churn"], errors="ignore")

    # 🔹 범주형 데이터 인코딩
    df_modeling = encode_categorical_features(df_modeling)

    # 🔹 모델 학습 시 사용한 FEATURE 순서 맞추기
    df_modeling = df_modeling.reindex(columns=FEATURES, fill_value=0)

    # 🔹 데이터 스케일링 적용
    robust_columns = ["TOTAL_USED_DAYS", "CH_HH_AVG_MONTH1"]
    minmax_columns = [col for col in FEATURES if col not in robust_columns]

    df_modeling[robust_columns] = robust_scaler.transform(df_modeling[robust_columns])
    df_modeling[minmax_columns] = minmax_scaler.transform(df_modeling[minmax_columns])

    # 🔹 SHAP 값 계산
    shap_values = explainer(df_modeling)
    impact_df = pd.DataFrame({
        "feature": FEATURES,
        "impact": shap_values.values[0]  # 첫 번째 고객에 대한 SHAP 값
    }).sort_values(by="impact", ascending=False).head(5)  # 🔹 상위 5개 피처만 선택

    # 🔹 피처와 영향도를 리스트로 변환
    top_features = impact_df["feature"].tolist()
    top_impacts = impact_df["impact"].tolist()

    # 🔹 예측 확률
    probability = loaded_model.predict_proba(df_modeling)[0][1]
    churn_probability = round(float(probability), 2)
    customer_category = classify_customer_fine(churn_probability)

    # 🔹 기존 데이터 삭제 (업데이트 방식)
    db.query(CustomerFeatureImpact).filter(
        CustomerFeatureImpact.sha2_hash == sha2_hash,
        CustomerFeatureImpact.p_mt == p_mt
    ).delete()

    # 🔹 새로운 데이터 삽입
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
    db.add(impact_entry)

    db.commit()

    return {
        "sha2_hash": sha2_hash,
        "p_mt": p_mt,
        "churn_probability": churn_probability,
        "customer_category": customer_category,
        "feature_impact": {
            "feature_1": top_features[0], "impact_value_1": top_impacts[0],
            "feature_2": top_features[1], "impact_value_2": top_impacts[1],
            "feature_3": top_features[2], "impact_value_3": top_impacts[2],
            "feature_4": top_features[3], "impact_value_4": top_impacts[3],
            "feature_5": top_features[4], "impact_value_5": top_impacts[4]
        }
    }
