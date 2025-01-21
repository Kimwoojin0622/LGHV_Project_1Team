# database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from config import DB_URL

# 1) 엔진 생성
engine = create_engine(
    DB_URL,
    echo=True,           # SQL 실행 로깅 여부
    pool_recycle=3600,   # 커넥션 풀 재활용 시간 (예시)
    pool_pre_ping=True   # 커넥션이 유효한지 체크
)

# 2) 세션 팩토리
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 3) Base 선언
Base = declarative_base()
