import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# ✅ 환경 변수 로드
load_dotenv(".env.aws")


# ✅ 환경 변수 불러오기 (이전 변수명과 다르게 설정)
MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")  # 기본값 3306
MYSQL_USER = os.getenv("MYSQL_USER", "admin")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_DB = os.getenv("MYSQL_DB", "tps_cancel")

# ✅ `MYSQL_PORT`를 정수로 변환 (오류 방지)
try:
    MYSQL_PORT = int(MYSQL_PORT)
except ValueError:
    MYSQL_PORT = 3306  # 기본 포트

# ✅ MySQL 연결 URL 생성 (`pymysql` 사용)
DATABASE_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"

# ✅ SQLAlchemy 엔진 생성 (자동 TCP/IP 연결)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)

Base = declarative_base()

# ✅ 세션 팩토리 생성 (각 요청마다 DB 세션을 생성하고 자동 종료)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ DB 세션 의존성 (FastAPI에서 `Depends(get_db)`로 사용 가능)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
