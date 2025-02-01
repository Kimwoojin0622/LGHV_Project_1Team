from fastapi import APIRouter
from schemas import PredictResponse

router = APIRouter()

@router.get("/", response_model=PredictResponse)
def predict_churn():
    # 실제 예측 로직 대신 예시 메시지 반환
    return PredictResponse(message="Churn prediction endpoint")
