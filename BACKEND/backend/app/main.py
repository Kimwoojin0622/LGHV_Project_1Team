from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ✅ 라우터 임포트
from routers import customers, riskanalysis  

app = FastAPI()

# ✅ CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-total-count"],
)

# ✅ 라우터 등록 확인
app.include_router(customers.router, prefix="/customers", tags=["Customers"])
app.include_router(riskanalysis.router, prefix="/risk-summary", tags=["Risk Analysis"])  # ✅ "/risk" prefix 확인

# ✅ 기본 엔드포인트 추가 (API 정상 작동 확인용)
@app.get("/")
def root():
    return {"message": "API is running!"}
