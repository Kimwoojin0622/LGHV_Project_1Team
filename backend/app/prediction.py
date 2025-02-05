import os
import numpy as np
import joblib
import pandas as pd
from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import TpsCancelModels, CustomerFeatureImpact
from schemas import TpsCancelModelsRead, CustomerFeatureImpactRead
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

# 🔹 Label Encoders 저장소
label_encoders = {}

def encode_categorical_features(df):
    """ 문자열 데이터를 숫자로 변환 (Label Encoding 수행) """
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

# 🔹 신규 고객 예측 및 DB 업데이트
@router.post("/predict/new_customers")
def predict_new_customers(db: Session = Depends(get_db)):
    """
    신규 고객의 해지 확률을 예측하고, TpsCancelModels 및 CustomerFeatureImpact 테이블에 저장
    """
    # 1️⃣ 신규 고객 데이터 조회 (예측되지 않은 고객만)
    new_customers = db.query(TpsCancelModels).filter(
        TpsCancelModels.churn_probability == None
    ).all()

    if not new_customers:
        return {"message": "신규 고객 데이터가 없습니다."}

    # 2️⃣ 데이터프레임 변환
    df_modeling = pd.DataFrame([
        {key: value for key, value in vars(customer).items() if not key.startswith("_")}
        for customer in new_customers
    ])
    df_ids = df_modeling[["sha2_hash", "p_mt"]]

    # 3️⃣ 필요 없는 컬럼 제거 및 피처 인코딩
    df_modeling = df_modeling.drop(columns=["sha2_hash", "p_mt", "churn"], errors="ignore")
    df_modeling = encode_categorical_features(df_modeling)
    df_modeling = df_modeling.reindex(columns=FEATURES, fill_value=0)

    # 4️⃣ 스케일링 적용
    robust_columns = ["TOTAL_USED_DAYS", "CH_HH_AVG_MONTH1"]
    minmax_columns = [col for col in FEATURES if col not in robust_columns]

    df_modeling[robust_columns] = robust_scaler.transform(df_modeling[robust_columns])
    df_modeling[minmax_columns] = minmax_scaler.transform(df_modeling[minmax_columns])

    # 5️⃣ 해지 확률 예측
    probabilities = loaded_model.predict_proba(df_modeling)

    # 6️⃣ SHAP 값 계산
    shap_values = explainer(df_modeling).values

    # 7️⃣ 예측 결과 DB 저장
    for i in range(len(df_ids)):
        sha2_hash = df_ids.iloc[i]["sha2_hash"]
        p_mt = df_ids.iloc[i]["p_mt"]
        churn_probability = round(float(probabilities[i][1]), 2)
        customer_category = classify_customer_fine(churn_probability)

        # TpsCancelModels 업데이트
        customer = db.query(TpsCancelModels).filter(
            TpsCancelModels.sha2_hash == sha2_hash,
            TpsCancelModels.p_mt == p_mt
        ).first()

        if customer:
            customer.churn_probability = churn_probability
            customer.customer_category = customer_category
            db.add(customer)

        # SHAP 중요 피처 5개 저장
        sorted_features = sorted(
            zip(FEATURES, shap_values[i]), key=lambda x: abs(x[1]), reverse=True
        )[:5]

        feature_impact_entry = CustomerFeatureImpact(
            sha2_hash=sha2_hash,
            p_mt=p_mt,
            feature_1=sorted_features[0][0],
            impact_value_1=sorted_features[0][1],
            feature_2=sorted_features[1][0] if len(sorted_features) > 1 else None,
            impact_value_2=sorted_features[1][1] if len(sorted_features) > 1 else None,
            feature_3=sorted_features[2][0] if len(sorted_features) > 2 else None,
            impact_value_3=sorted_features[2][1] if len(sorted_features) > 2 else None,
            feature_4=sorted_features[3][0] if len(sorted_features) > 3 else None,
            impact_value_4=sorted_features[3][1] if len(sorted_features) > 3 else None,
            feature_5=sorted_features[4][0] if len(sorted_features) > 4 else None,
            impact_value_5=sorted_features[4][1] if len(sorted_features) > 4 else None,
            prediction_date=date.today()
        )
        db.add(feature_impact_entry)

    db.commit()

    return {
        "message": "신규 고객 해지 확률 예측 및 DB 저장 완료",
        "total_processed": len(new_customers)
    }
