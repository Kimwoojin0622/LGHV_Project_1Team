from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import dashboard, customers, predict  # 각 라우터 모듈 임포트

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["x-total-count"],
)

# 라우터 포함
# app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(customers.router, prefix="/customers", tags=["Customers"])
app.include_router(predict.router, prefix="/predict", tags=["Risk Analysis"])  
